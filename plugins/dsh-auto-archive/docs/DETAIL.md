# dsh-auto-archive

定期扫描会话历史，把超过配置天数没有任何事件的会话自动归档，保持会话列表清爽。

## 设置界面

插件注册了设置页分区 **设置 → 自动归档**（侧栏设置内），可直接修改全部配置项（阈值、扫描间隔、dryRun 等），修改即保存并生效，无需改文件或重启。若该分区未出现，请重启 DSH 后刷新页面（Client 半在 Host 重启后才会重新组合）。

也可以直接编辑 `cordis.patch.yml`，两种途径等价。

## 工作方式

- 通过 `ctx.sessionQuery.listSessions()` 枚举全部会话，`listEvents(id)` 取每个会话最后一个事件的时间作为"最后活跃时间"。
- 空白会话（无任何事件）默认按 `createdAt` 判定（可关掉：`countBlankByCreation: false` 时空白会话永不归档）。
- 已归档会话自动跳过；置顶会话默认豁免（`excludePinned: true`），因为置顶与归档互斥。
- 归档调用官方 `ctx.workspaceRegistry.archiveSession(id, { stopActivity })`：仍有运行中工作的会话会被框架拒绝并记录跳过，不会误伤；只有显式设置 `stopActivity: true` 才会先归档再停止。
- 归档是可逆的：在会话列表"已归档"里取消归档即可恢复原位置。

## 配置（cordis.patch.yml）

| 键 | 默认 | 说明 |
|---|---|---|
| `idleDays` | `7` | 不活跃判定阈值（天） |
| `intervalHours` | `6` | 扫描间隔（小时） |
| `startupDelayMinutes` | `5` | 启动后首次扫描延迟（分钟） |
| `maxPerRun` | `20` | 每轮最多归档数（`0` 不限） |
| `stopActivity` | `false` | 归档时是否强制停止运行中的工作 |
| `excludePinned` | `true` | 置顶会话豁免 |
| `countBlankByCreation` | `true` | 空白会话按创建时间判定 |
| `dryRun` | `false` | 试运行：只记日志不实际归档 |

建议首次启用时先开 `dryRun: true` 观察一轮日志，确认候选无误后再关闭。

## 限制

- "不活跃"以会话日志最后一个事件的时间为准；标题生成等后台小请求若写入事件，也会刷新该时间戳。
- 只处理本机 profile 中 `sessionQuery` 可见的会话。
