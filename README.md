# dsh-plugins

个人 DeepSeek Harness（DSH）插件源码与市场索引仓库。

## 结构

- `plugins/<name>/` —— 插件包（`package.json` 带 `dsh.bundle` 与 `dsh.client` 声明）
- `index.json` —— 市场索引（[format 1](https://github.com/deepseek-ai/deepseek-harness)，供 DSH「自定义插件索引」/ 发现页读取）
- `scripts/publish.mjs` —— 发版登记脚本

## 开发回路（本地 link）

1. `New-Item -ItemType Junction -Path "$env:USERPROFILE\.dsh\plugins\<name>" -Target "<本仓库>\plugins\<name>"`
2. `New-Item -ItemType Junction -Path "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\<name>" -Target "$env:USERPROFILE\.dsh\plugins\<name>"`
3. 在 profile `package.json` 的 `dsh.profile.bundles` 里加 `"<name>"`，并确认 `dependencies` 里有 `"link:..."`。
4. 重启 DSH；设置 → 插件 里应出现该条目且为 active。

## 发版（登记进市场索引）

```powershell
# 1. 改插件版本号并提交
git add plugins/dsh-todo-corner && git commit -m "dsh-todo-corner@0.1.0"

# 2. 登记（校验工作区干净、固定 HEAD SHA、内嵌 format-1 校验）
node scripts/publish.mjs dsh-todo-corner

# 3. 提交索引并推送（插件 commit 与索引都要推上去）
git add index.json && git commit -m "index: dsh-todo-corner@0.1.0" && git push
```

## 一键发版（npm + 索引 + 推送 + 验证）

```powershell
# 前提：改 version → 提交 → push（脚本会校验工作区干净、HEAD 已推送）
npm run release dsh-todo-corner
```

自动完成：npm token 预检（bypass_2fa）→ `npm publish` → 登记 `index.json`
（索引已有该版本则跳过，git 源与 npm 源共存）→ 提交推送 → 验证 npm 与
raw 索引都能看到新版本。之后在 DSH 插件弹窗直接输包名即可安装。

npm token 要求：非交互发布必须用勾选了 **Bypass 2FA** 的 Granular token
（或 Classic → Automation 类型）。token 只放 `~\.npmrc`，不要进仓库
（`.gitignore` 已忽略 `tokens.*` / `.env`）。

索引 URL 用 GitHub raw 地址，例如：
`https://raw.githubusercontent.com/<user>/dsh-plugins/main/index.json`

## 注意事项

- `engines.dsh` 默认 `>=0.2.2-rc.1 <0.3.0`：DSH `0.2.2-rc.1` 是预发布版，SemVer
  规则下普通 `>=0.2.0` 匹配不上 rc，下界必须显式带预发布号。
- 本地 link 与市场安装**不能并存**同一插件：同名包两个来源会让 client-modules
  组合直接报错；切换前先删 junction 和 profile 里的 link 依赖。
- 索引 URL 不跟随重定向；raw 地址即最终地址，可直接配置。
- 市场索引不支持原地升级：旧版本显示「有更新」后，需先卸载再安装新版本。
