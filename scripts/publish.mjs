#!/usr/bin/env node
// 发版脚本：把 plugins/<name> 当前 HEAD 提交登记进 index.json。
//
// 用法：
//   node scripts/publish.mjs <pluginName> [--validate-only] [--repo <git-url>]
//
// 规则（对应 dsh-plugin-market-index format 1 校验器）：
//   - 插件目录必须已提交（工作区干净才算“定稿”）；
//   - version 取插件 package.json 的 version，不得与 index 中已有版本重复；
//   - publishTimestamp 取当前 Unix 秒；
//   - git 源固定到当前 HEAD 的完整 40 位 commit SHA，path 是插件在仓库内的目录；
//   - engines.dsh 默认 ">=0.2.2-rc.1 <0.3.0"（当前 DSH 0.2.2-rc.1 是预发布版，
//     SemVer 规则下范围比较必须显式含预发布下界，普通 >=0.2.0 匹配不上 rc）；
//     插件 package.json 里写 engines.dsh 则以其为准（去掉 workspace: 前缀后原样使用）。
//
// --validate-only：只校验现有 index.json 是否仍可通过 format-1 校验，不登记新版本。
// --repo <url>：覆盖 index 条目里的 git url（默认从当前 git remote origin 推导）。

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(repoRoot, 'index.json');

const argv = process.argv.slice(2);
const validateOnly = argv.includes('--validate-only');
const repoFlagIdx = argv.indexOf('--repo');
const repoOverride = repoFlagIdx !== -1 ? argv[repoFlagIdx + 1] : undefined;
const pluginName = argv.find((a) => !a.startsWith('--') && a !== repoOverride);

const fail = (msg) => {
  console.error(`publish: ${msg}`);
  process.exit(1);
};

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch (error) {
    fail(`git ${args.join(' ')} failed: ${String(error.message).split('\n')[0]}`);
  }
};

// ---------------------------------------------------------------------------
// 内嵌 format-1 校验（与 @deepseek-ai/dsh-plugin-market-index 相同的规则集，
// 避免给本仓库添加依赖；如以后可用该包，应改为直接 import parseMarketIndex）。
// ---------------------------------------------------------------------------
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const COMMIT = /^[0-9a-f]{40}$/u;
const PACKAGE_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/u;
const MAX_PUBLISH_TIMESTAMP = 1e11;

function vfail(where, why) {
  fail(`index.json violates format 1 at ${where}: ${why}`);
}

function localizedText(value, where) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) vfail(where, 'must be an object');
  const out = {};
  for (const [lang, text] of Object.entries(value)) {
    if (typeof text !== 'string') vfail(`${where}.${lang}`, 'must be a string');
    out[lang] = text;
  }
  if (!('en' in out)) vfail(`${where}.en`, "localized text requires at least 'en'");
  return out;
}

function validateIndex(doc, indexUrl) {
  if (!URL.canParse(indexUrl)) fail('--repo URL is not absolute');
  if (doc.format !== 1) vfail('$.format', 'must be 1');
  localizedText(doc.title, '$.title');
  if (!Array.isArray(doc.plugins)) vfail('$.plugins', 'must be an array');
  const meta = doc.metadata ?? {};
  const categories = meta.categories ?? {};
  const labels = meta.labels ?? {};
  const sortKeys = meta.sortKeys ?? {};
  const names = new Set();
  doc.plugins.forEach((p, i) => {
    const at = `$.plugins[${i}]`;
    if (typeof p.name !== 'string' || !PACKAGE_NAME.test(p.name) || p.name.length > 214) {
      vfail(`${at}.name`, 'must be a valid npm package name');
    }
    if (names.has(p.name)) vfail(`${at}.name`, `duplicates ${p.name}`);
    names.add(p.name);
    if (p.title !== undefined) localizedText(p.title, `${at}.title`);
    if (p.description !== undefined) localizedText(p.description, `${at}.description`);
    if (p.author !== undefined && typeof p.author !== 'string') vfail(`${at}.author`, 'must be a string');
    if (p.metadata?.category !== undefined && !(p.metadata.category in categories)) {
      vfail(`${at}.metadata.category`, `references undeclared id ${p.metadata.category}`);
    }
    for (const label of p.metadata?.labels ?? []) {
      if (!(label in labels)) vfail(`${at}.metadata.labels`, `references undeclared id ${label}`);
    }
    for (const key of Object.keys(p.metadata?.sortKeys ?? {})) {
      if (!(key in sortKeys)) vfail(`${at}.metadata.sortKeys.${key}`, 'references undeclared id');
    }
    if (!Array.isArray(p.versions) || p.versions.length === 0) vfail(`${at}.versions`, 'must be a non-empty array');
    const seen = new Set();
    p.versions.forEach((v, j) => {
      const vat = `${at}.versions[${j}]`;
      if (!SEMVER.test(v.version ?? '')) vfail(`${vat}.version`, 'must be an exact SemVer version');
      if (seen.has(v.version)) vfail(`${vat}.version`, `duplicates ${v.version}`);
      seen.add(v.version);
      const ts = v.publishTimestamp;
      if (!Number.isInteger(ts) || ts < 0 || ts >= MAX_PUBLISH_TIMESTAMP) {
        vfail(`${vat}.publishTimestamp`, 'must be an integer number of Unix seconds in [0, 10^11)');
      }
      const src = v.source ?? {};
      if (src.type === 'git') {
        if (!COMMIT.test(src.commit ?? '')) vfail(`${vat}.source.commit`, 'must be a lowercase 40-hex-digit commit SHA');
        if (typeof src.url !== 'string' || !/^https:\/\/[^/]+(?:\/[^/]+){2,}$/u.test(src.url) || /\.(tgz|tar\.gz)$/iu.test(src.url)) {
          vfail(`${vat}.source.url`, 'must be a canonical https repository URL');
        }
      } else if (src.type === 'npm') {
        if (src.registry !== undefined && !/^https?:\/\//u.test(src.registry)) vfail(`${vat}.source.registry`, 'must be http(s)');
      } else {
        vfail(`${vat}.source.type`, 'must be "npm" or "git"');
      }
      if (v.engines?.dsh !== undefined && !/^[><=~^ ]*\d/u.test(v.engines.dsh)) {
        vfail(`${vat}.engines.dsh`, 'must be a SemVer range');
      }
    });
  });
}

// ---------------------------------------------------------------------------
const DEFAULT_ENGINES = '>=0.2.2-rc.1 <0.3.0';

const indexUrl = repoOverride ?? git('remote', 'get-url', 'origin').replace(/\.git$/u, '').replace(/^git@github\.com:/u, 'https://github.com/');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

if (validateOnly) {
  validateIndex(index, indexUrl);
  console.log(`index.json OK (${index.plugins.length} plugins)`);
  process.exit(0);
}

if (!pluginName) fail('usage: node scripts/publish.mjs <pluginName> [--validate-only] [--repo <url>]');

// 插件目录与版本
const pluginDir = path.join(repoRoot, 'plugins', pluginName);
if (!fs.existsSync(path.join(pluginDir, 'package.json'))) fail(`plugins/${pluginName}/package.json not found`);
const pkg = JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf8'));
if (pkg.name !== pluginName) fail(`package.json name is ${pkg.name}, expected ${pluginName}`);
if (!SEMVER.test(pkg.version ?? '')) fail(`plugin version ${pkg.version} is not exact SemVer`);

// 工作区必须干净（相对插件目录）
const dirty = git('status', '--porcelain', '--', `plugins/${pluginName}`);
if (dirty !== '') fail(`plugins/${pluginName} has uncommitted changes:\n${dirty}`);

const commit = git('rev-parse', 'HEAD');
const repoUrl = (repoOverride ?? git('remote', 'get-url', 'origin')).replace(/\.git$/u, '').replace(/^git@github\.com:/u, 'https://github.com/');
if (!/^https:\/\//u.test(repoUrl)) fail(`repository URL ${repoUrl} is not https; pass --repo <https-url>`);

const enginesDsh = typeof pkg.engines?.dsh === 'string' && !pkg.engines.dsh.startsWith('workspace:')
  ? pkg.engines.dsh
  : DEFAULT_ENGINES;

// 登记/追加版本
let entry = index.plugins.find((p) => p.name === pluginName);
if (entry === undefined) {
  entry = {
    name: pluginName,
    title: pkg.description ? { en: pkg.description } : undefined,
    description: pkg.description ? { en: pkg.description, zh: pkg.description } : undefined,
    author: pkg.author ?? 'linxun',
    repository: { url: repoUrl, directory: `plugins/${pluginName}` },
    metadata: { category: 'ui', keywords: ['dsh'], labels: ['client'], sortKeys: { release: 1 } },
    versions: []
  };
  index.plugins.push(entry);
}
if (entry.versions.some((v) => v.version === pkg.version)) fail(`version ${pkg.version} already published for ${pluginName}`);
entry.versions.push({
  version: pkg.version,
  publishTimestamp: Math.floor(Date.now() / 1000),
  source: { type: 'git', url: repoUrl, commit, path: `plugins/${pluginName}` },
  engines: { dsh: enginesDsh }
});
entry.versions.sort((a, b) => b.publishTimestamp - a.publishTimestamp);

validateIndex(index, indexUrl);
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
console.log(`published ${pluginName}@${pkg.version} @ ${commit.slice(0, 10)}`);
console.log('remember: git add index.json && commit && push — the index entry points at the plugin commit above, which must be pushed too.');
