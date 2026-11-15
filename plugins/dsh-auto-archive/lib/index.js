// dsh-auto-archive — Host 插件：定期扫描不活跃会话并自动归档。
// npm 包名 @linxunxr/dsh-auto-archive（无作用域名 dsh-auto-archive 已被他人占用）。
//
// 判据（对照 0.2.2-rc.3 源码验证）：
//   - ctx.sessionQuery.listSessions() → SessionRecord[]；header 只有 createdAt
//     （epoch ms），无 lastActivity 字段。
//   - ctx.sessionQuery.listEvents(id) → SessionEventRecord[]（升序，带 time），
//     取末条 time 作“最后活跃时间”；空日志视为空白会话。
//   - ctx.workspaceRegistry.archiveSession(id, { stopActivity })：
//     活动中的会话抛 WorkspaceActiveSessionError（安全网），
//     不存在的会话抛 WorkspaceUnknownSessionError。
//   - ctx.workspaceRegistry.pinnedSessionIds / archivedSessionIds：
//     公开只读 getter（src/index.ts:360/439），用于置顶豁免与去重。
//   - ctx.interval/ctx.timeout 来自 @deepseek-ai/cordis-plugin-timer，需注入 'timer'。
//
// 设置界面：DSH 0.2.x 的 Settings 页只显示“loader entry id 对应的插件所导出
// Config 中带 volatile 标记的字段”（规则与 qq-mode-console 的注释一致）。
// 本插件的 entry id 是 auto-archive，所以下方 Config 的全部字段都标了
// volatile：在设置界面直接改 idleDays 等值，写入会持久化到 profile 的
// cordis.patch.yml，插件即时生效、无需重装。普通（非 volatile）字段改配置
// 文件才生效——这里全部做成 volatile，两种途径等价。
import z from '@deepseek-ai/schemastery'

export const name = 'dsh-auto-archive'

export const inject = ['workspaceRegistry', 'sessionQuery', 'timer']

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

// .extra('volatile', true) 与 .volatile() 等价（后者只是 DSH 自带 schemastery
// 的语法糖）；用 .extra 写法兼容任何 schemastery 版本（qq-mode-console 的教训）。
export const Config = z.object({
  idleDays: z.number().min(1).max(365).step(1).default(7)
    .description('不活跃判定阈值（天）：会话最后一个事件距今超过该天数才归档')
    .extra('volatile', true),
  intervalHours: z.number().min(1).max(168).step(1).default(6)
    .description('扫描间隔（小时）')
    .extra('volatile', true),
  startupDelayMinutes: z.number().min(0).max(720).step(1).default(5)
    .description('启动后首次扫描延迟（分钟）')
    .extra('volatile', true),
  maxPerRun: z.number().min(0).max(1000).step(1).default(20)
    .description('每轮最多归档数（0 = 不限）')
    .extra('volatile', true),
  stopActivity: z.boolean().default(false)
    .description('归档时强制停止运行中的工作（默认拒绝并跳过）')
    .extra('volatile', true),
  excludePinned: z.boolean().default(true)
    .description('置顶会话豁免')
    .extra('volatile', true),
  countBlankByCreation: z.boolean().default(true)
    .description('空白会话（无任何事件）按创建时间判定')
    .extra('volatile', true),
  dryRun: z.boolean().default(false)
    .description('试运行：只记日志不实际归档')
    .extra('volatile', true),
})

export function apply(ctx, config) {
  const logger = ctx.logger('dsh-auto-archive')
  let running = false

  function errorName(error) {
    return error && typeof error === 'object' && typeof error.constructor?.name === 'string'
      ? error.constructor.name
      : ''
  }

  async function runOnce() {
    if (running) return
    running = true
    try {
      // volatile 字段每次扫描时读当前值（settings 写入即时生效）。
      const idleDays = config.idleDays.get()
      const idleMs = idleDays * DAY_MS
      const now = Date.now()
      const registry = ctx.workspaceRegistry

      const records = await ctx.sessionQuery.listSessions()
      const archived = new Set(registry.archivedSessionIds.map(String))
      const excludePinned = config.excludePinned.get()
      const pinned = excludePinned
        ? new Set(registry.pinnedSessionIds.map(String))
        : new Set()

      const candidates = []
      for (const record of records) {
        const id = String(record.header.id)
        if (archived.has(id) || pinned.has(id)) continue

        let last = null
        try {
          const events = await ctx.sessionQuery.listEvents(id)
          last = events.length > 0 ? events[events.length - 1].time : null
        } catch (error) {
          logger.warn(`读取会话 ${id} 事件失败，跳过：${error instanceof Error ? error.message : String(error)}`)
          continue
        }

        const anchor = last ?? (config.countBlankByCreation.get() ? record.header.createdAt : null)
        if (anchor === null) continue
        const idleFor = now - anchor
        if (idleFor >= idleMs) candidates.push({ id, idleFor })
      }

      if (candidates.length === 0) {
        logger.info(`扫描完成：${records.length} 个会话中没有满足 ${idleDays} 天不活跃的候选`)
        return
      }

      const maxPerRun = config.maxPerRun.get()
      const limit = maxPerRun > 0 ? maxPerRun : candidates.length
      let archivedCount = 0
      let skipped = 0
      for (const candidate of candidates.slice(0, limit)) {
        const days = Math.floor(candidate.idleFor / DAY_MS)
        if (config.dryRun.get()) {
          logger.info(`[dry-run] 将归档会话 ${candidate.id}（不活跃 ${days} 天）`)
          archivedCount++
          continue
        }
        try {
          await registry.archiveSession(candidate.id, { stopActivity: config.stopPropagation.get() })
          archivedCount++
          logger.info(`已归档会话 ${candidate.id}（不活跃 ${days} 天）`)
        } catch (error) {
          skipped++
          const kind = errorName(error)
          if (kind === 'WorkspaceActiveSessionError') {
            logger.info(`会话 ${candidate.id} 仍有运行中的工作，本轮跳过`)
          } else if (kind === 'WorkspaceUnknownSessionError') {
            logger.info(`会话 ${candidate.id} 已不存在，跳过`)
          } else {
            logger.warn(`归档会话 ${candidate.id} 失败：${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
      logger.info(`扫描完成：共 ${records.length} 个会话，归档 ${archivedCount} 个，跳过 ${skipped} 个`)
    } catch (error) {
      logger.error(`自动归档扫描失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      running = false
    }
  }

  // ctx.interval/ctx.timeout（cordis-plugin-timer）注册在当前 fiber 上，
  // 插件卸载时自动清理；返回值同时是 disposer，稳妥起见仍显式保存。
  const disposeInterval = ctx.interval(() => { void runOnce() }, config.intervalHours.get() * HOUR_MS)
  const delayMinutes = config.startupDelayMinutes.get()
  const disposeInitial = delayMinutes > 0
    ? ctx.timeout(() => { void runOnce() }, delayMinutes * MINUTE_MS)
    : null

  logger.info(
    `dsh-auto-archive 已加载：idleDays=${config.idleDays.get()} intervalHours=${config.intervalHours.get()} maxPerRun=${config.maxPerRun.get()} dryRun=${config.dryRun.get()}`,
  )

  return () => {
    disposeInterval()
    disposeInitial?.()
  }
}
