window.__ModuleLoader__.load({
	id: "dsh-todo-corner",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region css
		const css = ".TDC_todoCorner{position:relative;display:inline-flex;align-items:center}.TDC_trigger{border-radius:var(--dsw-radius-sm);min-height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;align-items:center;gap:5px;padding:3px 6px;font-size:12px;line-height:18px;display:inline-flex}.TDC_trigger:focus-visible{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-fill-l1)}@media (hover:hover){.TDC_trigger:hover{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-fill-l1)}}.TDC_trigger[aria-expanded='true']{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-fill-l1)}.TDC_triggerDot{flex:none}.TDC_triggerLabel{margin:0 1px;white-space:nowrap}.TDC_triggerDone{color:var(--dsw-alias-label-tertiary)}.TDC_menu{z-index:100;box-sizing:border-box;width:340px;max-width:min(380px, calc(100vw - 32px), var(--dsh-anchored-max-width,100vw));max-height:min(420px, calc(100vh - 140px), var(--dsh-anchored-max-height,100vh));--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);--dsh-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);background:var(--dsw-alias-bg-layer-1);border-radius:var(--dsw-radius-lg);flex-direction:column;display:flex;position:fixed;overflow:hidden}.TDC_menuBody{flex-direction:column;gap:1px;min-height:0;margin:0;padding:6px;list-style:none;display:flex;overflow:auto}.TDC_row{display:flex;align-items:flex-start;gap:8px;border-radius:var(--dsw-radius-sm);padding:5px 6px}.TDC_rowMark{flex:none;margin-top:3px;display:inline-flex}.TDC_rowText{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);line-height:18px;min-width:0;flex:1}.TDC_rowTextPending{color:var(--dsw-alias-label-secondary)}.TDC_rowTextDone{color:var(--dsw-alias-label-tertiary);text-decoration:line-through;text-decoration-color:var(--dsw-alias-label-tertiary)}.TDC_empty{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);padding:8px 6px;line-height:18px}";
		const cssTagId = "dsh-todo-corner/todo-corner.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(cssTagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-todo-corner";
			tag.dataset.pluginCss = cssTagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var cssMap = {
			"trigger": "TDC_trigger",
			"triggerDot": "TDC_triggerDot",
			"triggerLabel": "TDC_triggerLabel",
			"triggerDone": "TDC_triggerDone",
			"triggerOpen": "TDC_triggerOpen",
			"menu": "TDC_menu",
			"menuBody": "TDC_menuBody",
			"row": "TDC_row",
			"rowMark": "TDC_rowMark",
			"rowText": "TDC_rowText",
			"rowTextPending": "TDC_rowTextPending",
			"rowTextDone": "TDC_rowTextDone",
			"empty": "TDC_empty"
		};
		//#endregion
		//#region locale
		const NS = "todoCorner";
		const zh = {
			"pill.progress": "任务 {done}/{total}",
			"pill.done": "任务已完成 {total}",
			"pill.aria": "任务清单：已完成 {done}，共 {total} 项",
			"list.aria": "当前任务清单",
			"empty": "没有任务",
			"status.completed": "已完成",
			"status.in_progress": "进行中",
			"status.pending": "待办"
		};
		const en = {
			"pill.progress": "Tasks {done}/{total}",
			"pill.done": "All {total} tasks done",
			"pill.aria": "Task list: {done} of {total} completed",
			"list.aria": "Current task list",
			"empty": "No tasks",
			"status.completed": "Completed",
			"status.in_progress": "In progress",
			"status.pending": "Pending"
		};
		//#endregion
		//#region todo projection
		/** View target name this plugin owns. */
		const TARGET = "todo-corner";
		const EMPTY_TODOS = [];
		/**
		 * One entry per recorded `todo/write` event; state is the todos array.
		 * Later writes overwrite earlier state only in the view builder below,
		 * so paging older history still replays correctly.
		 */
		const todoWriteDefinition = {
			kind: "todo-corner-write",
			match: (event) => event.type === "todo/write" ? {
				id: `w:${event.seq}`,
				role: "start"
			} : null,
			start: (_context, match) => {
				if (match.event.type !== "todo/write") throw new Error("todo-corner requires todo/write");
				const todos = match.event.data.todos;
				return Array.isArray(todos) ? todos.map((todo) => ({
					content: typeof todo.content === "string" ? todo.content : "",
					status: todo.status
				})) : void 0;
			},
			update: (context) => context.state,
			publication: () => "none"
		};
		/** The `todo-corner` target: latest recorded todo list. */
		const todoCornerView = {
			target: TARGET,
			create: () => {
				let current = { todos: EMPTY_TODOS, seq: 0 };
				return {
					empty: current,
					replace: ({ nodes }) => {
						let picked = current;
						for (const node of nodes) if ((node.data?.seq ?? 0) >= (picked.seq ?? 0)) picked = node.data;
						current = picked;
						return current;
					},
					apply: ({ upserts }) => {
						if (upserts.length === 0) return current;
						let picked = current;
						for (const node of upserts) if ((node.data?.seq ?? 0) >= (picked.seq ?? 0)) picked = node.data;
						current = picked;
						return current;
					}
				};
			}
		};
		/** Build the view node carrying the latest todos plus its write seq. */
		function buildTodoCornerNode(context) {
			const state = context.state;
			if (state === void 0) return null;
			const seq = context.start?.event.seq ?? 0;
			return {
				key: context.key,
				kind: context.kind,
				id: context.id,
				target: TARGET,
				anchorSeq: seq,
				location: context.start?.location ?? { kind: "unresolved" },
				data: { todos: state, seq }
			};
		}
		/** Definition pair with the builder attached (kept separate for clarity). */
		const todoCornerWriteDefinition = { ...todoWriteDefinition, target: TARGET, buildViewNode: buildTodoCornerNode };
		//#endregion
		//#region component
		/** Marker glyph per todo status. */
		function markFor(status) {
			if (status === "completed") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "positive" });
			if (status === "in_progress") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" });
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "idle" });
		}
		/**
		 * Header-corner entry: progress pill that expands the current task list.
		 * Renders nothing until the session has recorded at least one todo list.
		 */
		function TodoCorner({ sessionId, useTodos, t }) {
			const snapshot = useTodos((value) => value);
			const todos = snapshot?.todos ?? EMPTY_TODOS;
			const [open, setOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			const menuRef = (0, react.useRef)(null);
			const menuPosition = (0, _deepseek_ai_dsh_client_ui_primitives.useAnchoredPosition)({
				open,
				anchorRef: rootRef,
				panelRef: menuRef,
				gap: 5,
				margin: 12
			});
			(0, _deepseek_ai_dsh_client_ui_primitives.useDismissOnOutsidePointer)(rootRef, open, setOpen);
			if (todos.length === 0) return null;
			const done = todos.filter((todo) => todo.status === "completed").length;
			const total = todos.length;
			const hasActive = done < total;
			const pill = hasActive ? t("pill.progress", { done, total }) : t("pill.done", { total });
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				className: "TDC_todoCorner",
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: cssMap.trigger,
					"aria-expanded": open,
					"aria-label": t("pill.aria", { done, total }),
					onClick: () => {
						setOpen((current) => !current);
					},
					children: [
						hasActive ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing", className: cssMap.triggerDot }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "positive", className: cssMap.triggerDot }),
						(0, react_jsx_runtime.jsx)("span", {
							className: cssMap.triggerLabel,
							children: pill
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { size: 12, className: open ? cssMap.triggerOpen : void 0 })
					]
				}), open ? (0, react_dom.createPortal)((0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuSurface, {
					ref: menuRef,
					className: cssMap.menu,
					style: menuPosition ?? { visibility: "hidden", left: 0, top: 0 },
					children: (0, react_jsx_runtime.jsx)("ul", {
						className: cssMap.menuBody,
						"aria-label": t("list.aria"),
						children: todos.map((todo, index) => (0, react_jsx_runtime.jsxs)("li", {
							className: cssMap.row,
							"aria-label": t(`status.${todo.status}`),
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: cssMap.rowMark,
								children: markFor(todo.status)
							}), (0, react_jsx_runtime.jsx)("span", {
								className: todo.status === "completed" ? `${cssMap.rowText} ${cssMap.rowTextDone}` : todo.status === "pending" ? `${cssMap.rowText} ${cssMap.rowTextPending}` : cssMap.rowText,
								children: todo.content
							})]
						}, `${index}:${todo.content}`))
					})
				}), document.body) : null]
			});
		}
		//#endregion
		//#region entry
		const inject = ["slots", "sessions", "uiConversation", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "todo-corner: dictionaries");
			ctx.uiConversation.events.register(todoCornerWriteDefinition);
			ctx.uiConversation.views.register(todoCornerView);
			const sources = /* @__PURE__ */ new WeakMap();
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "todo-corner",
				order: 5,
				locale: NS,
				inject: (sessionId) => {
					const binding = ctx.sessions.binding(sessionId);
					if (binding === void 0) throw new Error(`todo-corner: session "${sessionId}" is unavailable`);
					let source = sources.get(binding);
					if (source === void 0) {
						const target = ctx.uiConversation.binding(binding).target(TARGET);
						source = {
							getSnapshot: () => target.getSnapshot(),
							subscribe: (listener) => target.subscribe(listener)
						};
						sources.set(binding, source);
					}
					return { hooks: { todos: source } };
				}
			}, TodoCorner));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
