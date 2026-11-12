#!/usr/bin/env node
// 一键发版：npm publish -> 登记 index.json -> 提交推送 -> 双端验证。
//
// 用法：
//   node scripts/release.mjs <pluginName>
//
// 前提（一次性）：
//   - .npmrc 里的 token 必须是 Granular Access Token，勾选 Bypass 2FA，
//     且 Packages 权限为 Read and write（覆盖要发的包名）；
//     否则账号的 2FA 策略会让 npm publish 返回 403。
//
// 步骤：
//   1. 校验仓库干净、HEAD 已推送（索引必须固定已推送的 commit SHA）；
//   2. plugins/<name>/package.json 的 version 未在 npm 上存在过；
//   3. npm publish（输出实时可见；失败即中止，索引不动）；
//   4. node scripts/publish.mjs <name> 登记 index.json（内嵌 format-1 校验）；
//   5. 提交 index.json 并推送；
//   6. 验证 npm 与 raw index.json 都能看到新版本。
//
// 之后任何人在 DSH 插件弹窗里直接输 <name>（或 <name>@<version>）即可安装。

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginName = process.argv.slice(2).find((a) => !a.startsWith('--'));

const fail = (msg) => {
  console.error(`release: ${msg}`);
  process.exit(1);
};

if (!pluginName) fail('usage: node scripts/release.mjs <pluginName>');

/** Run and return stdout; null instead of exit on failure. */
const tryRun = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  return r.status === 0 ? (r.stdout ?? '').trim() : null;
};

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  if (r.status !== 0) {
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
    fail(`${cmd} ${args.join(' ')} failed:\n${out.split('\n').slice(-12).join('\n')}`);
  }
  return (r.stdout ?? '').trim();
};

// --- 1. 工作区干净，HEAD 已推送 -------------------------------------------
const dirty = run('git', ['status', '--porcelain']);
if (dirty !== '') fail(`working tree not clean:\n${dirty}`);
const head = run('git', ['rev-parse', 'HEAD']);
const upstream = tryRun('git', ['rev-parse', '@{u}']);
if (upstream === null) fail('no upstream branch configured; git push -u origin <branch> first');
if (head !== upstream) fail(`HEAD ${head.slice(0, 10)} is not pushed (upstream ${upstream.slice(0, 10)}); git push first`);
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

// --- 2. 目标版本 -----------------------------------------------------------
const pluginDir = path.join(repoRoot, 'plugins', pluginName);
const pkgPath = path.join(pluginDir, 'package.json');
if (!fs.existsSync(pkgPath)) fail(`plugins/${pluginName}/package.json not found`);
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8').replace(/^\uFEFF/u, ''));
if (pkg.name !== pluginName) fail(`package.json name is ${pkg.name}, expected ${pluginName}`);
const version = pkg.version;

const onNpmAlready = tryRun('npm', ['view', `${pluginName}@${version}`, 'version'], { cwd: pluginDir });
if (onNpmAlready === version) fail(`${pluginName}@${version} already on npm; bump version first`);

// --- 2.5 token 预检：提前发现「未勾选 Bypass 2FA」这一最常见配置错误 ----------
function findNpmToken() {
  if (process.env.NPM_CONFIG__AUTH_TOKEN) return process.env.NPM_CONFIG__AUTH_TOKEN;
  const candidates = [];
  for (let dir = pluginDir; ; dir = path.dirname(dir)) {
    candidates.push(path.join(dir, '.npmrc'));
    if (path.dirname(dir) === dir) break;
  }
  candidates.push(path.join(process.env.HOME ?? process.env.USERPROFILE ?? '', '.npmrc'));
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const m = /^\/\/registry\.npmjs\.org\/:_authToken=(\S+)/mu.exec(fs.readFileSync(file, 'utf8'));
    if (m) return m[1];
  }
  return null;
}

const token = findNpmToken();
if (token !== null) {
  try {
    const res = await fetch('https://registry.npmjs.org/-/npm/v1/tokens', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const masked = `${token.slice(0, 8)}...${token.slice(-4)}`;
      const list = (await res.json()).objects ?? [];
      const self = list.find((t) => t.token === masked);
      if (self !== undefined && self.bypass_2fa !== true) {
        fail([
          `当前 npm token（name "${self.name}"）bypass_2fa=false，npm 会拒绝非交互发布（403）。`,
          '→ npmjs.com → 头像 → Access Tokens → Generate New Token（Granular）：',
          '    1. 勾选 "Allow this token to bypass two-factor authentication"（关键）',
          '    2. Packages and scopes → Read and write（首次发布选 All packages）',
          '  然后执行：npm config set //registry.npmjs.org/:_authToken=<新token>',
          '  注意新 token 字符串必须与旧值不同（旧的：' + masked + '）。',
        ].join('\n'));
      }
      console.log(`✓ token 预检通过（${self?.name ?? masked}, bypass_2fa=true）`);
    }
  } catch {
    /* 预检网络/权限失败不阻塞，交给 npm publish 自行报错 */
  }
}


// --- 3. npm publish（实时输出） --------------------------------------------
console.log(`→ npm publish ${pluginName}@${version}`);
const pub = spawnSync('npm', ['publish'], { cwd: pluginDir, stdio: 'inherit' });
if (pub.status !== 0) fail('npm publish failed (index untouched)');

// --- 4. 登记索引（版本已在索引中则跳过——git 源与 npm 源可共存同一版本号） ----
const indexPath = path.join(repoRoot, 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8').replace(/^\uFEFF/u, ''));
const indexed = index.plugins.find((p) => p.name === pluginName)?.versions.some((v) => v.version === version);
if (indexed) {
  console.log(`→ index already lists ${version} (git source); skip registration`);
} else {
  console.log('→ register in index.json');
  run(process.execPath, [path.join(repoRoot, 'scripts', 'publish.mjs'), pluginName]);
}

// --- 5. 提交并推送索引 -----------------------------------------------------
console.log('→ commit and push index');
run('git', ['add', 'index.json']);
run('git', ['commit', '-m', `index: ${pluginName}@${version} (npm)`]);
run('git', ['push']);

// --- 6. 双端验证 -----------------------------------------------------------
const onNpm = run('npm', ['view', `${pluginName}@${version}`, 'version'], { cwd: pluginDir });
if (onNpm !== version) fail(`npm view returned "${onNpm}", expected "${version}"`);
const remote = run('git', ['remote', 'get-url', 'origin'])
  .replace(/\.git$/u, '').replace(/^git@github\.com:/u, 'https://github.com/');
const rawUrl = `${remote.replace('https://github.com', 'https://raw.githubusercontent.com')}/${branch}/index.json`;
const raw = tryRun('curl', ['-fsSL', rawUrl]);
if (raw === null) {
  console.warn(`! raw index fetch failed (${rawUrl}); GitHub CDN may lag — verify later`);
} else {
  const entry = JSON.parse(raw).plugins.find((p) => p.name === pluginName);
  const hit = entry?.versions.find((v) => v.version === version);
  if (!hit) console.warn(`! raw index does not list ${version} yet (${rawUrl}); CDN lag — verify later`);
  else console.log(`✓ verified on npm and in index: ${pluginName}@${version}`);
}
console.log(`done — install anywhere with just the name "${pluginName}"`);
