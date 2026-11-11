// Host 半：本插件没有 host 逻辑（不注册工具/服务），只需要这个 entry
// 存在，让 dsh-client-modules 把 ./client bundle 发给浏览器。
// 仍导出 apply 以便装配时打一行日志，方便排查 entry 是否生效。
export const name = 'dsh-todo-corner';

export function apply() {
  // 静默装配即可；需要排查时看设置页插件列表。
}
