window.__ModuleLoader__.load({
	id: "@linxunxr/dsh-auto-archive",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let jsxRuntime = require("react/jsx-runtime");
		const jsx = jsxRuntime.jsx, jsxs = jsxRuntime.jsxs;

		//#region css
		const css = [
			".DAA_page{display:flex;flex-direction:column;gap:16px}",
			".DAA_title{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);font-weight:600;margin:0}",
			".DAA_intro{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);line-height:18px;margin:0}",
			".DAA_field{display:flex;flex-direction:column;gap:4px;max-width:360px}",
			".DAA_label{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12)}",
			".DAA_input{box-sizing:border-box;width:100%;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);padding:6px 8px}",
			".DAA_input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-label-primary));outline-offset:1px}",
			".DAA_inputInvalid{border-color:var(--dsw-alias-label-error,var(--dsw-alias-label-primary))}",
			".DAA_hint{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);line-height:16px;margin:0}",
			".DAA_error{color:var(--dsw-alias-label-error,#d33);font:var(--dsw-font-xxs-12);margin:0}",
			".DAA_toggleRow{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;max-width:360px}",
			".DAA_toggleText{display:flex;flex-direction:column;gap:2px;min-width:0}",
			".DAA_checkbox{width:16px;height:16px;flex:none;margin:3px 0 0}",
			".DAA_status{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);margin:0;min-height:16px}",
			".DAA_group{display:flex;flex-direction:column;gap:12px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-layer-1)}",
			".DAA_groupTitle{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);font-weight:600;margin:0}",
		].join("");
		const cssTagId = "@linxunxr/dsh-auto-archive/settings.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(cssTagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@linxunxr/dsh-auto-archive";
			tag.dataset.pluginCss = cssTagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region locale
		const NS = "autoArchive";
		const zh = {
			"navLabel": "自动归档",
			"title": "不活跃会话自动归档",
			"intro": "会话最后一个事件距今超过设定天数后，自动加入归档集合：从会话列表隐藏，数据完整保留，可在「已归档」中取消归档恢复。",
			"idleDays": "闲置天数",
			"idleDaysHint": "超过该天数没有任何事件的会话会被归档（1–365 天）。",
			"scanGroup": "扫描",
			"intervalHours": "扫描间隔",
			"intervalHoursHint": "每隔多少小时扫描一次（1–168 小时）。",
			"startupDelayMinutes": "启动延迟",
			"startupDelayMinutesHint": "DSH 启动后延迟多久开始首次扫描（分钟）。",
			"maxPerRun": "每轮上限",
			"maxPerRunHint": "每轮最多归档的会话数，0 表示不限。",
			"behaviorGroup": "行为",
			"dryRun": "试运行",
			"dryRunHint": "只记录将要归档的会话，不真正执行。",
			"excludePinned": "豁免置顶会话",
			"excludePinnedHint": "置顶会话不会被自动归档。",
			"countBlankByCreation": "空白会话按创建时间算",
			"countBlankByCreationHint": "没有任何事件的空白会话是否按创建时间参与判定。",
			"stopActivity": "强制停止运行中的工作",
			"stopActivityHint": "关闭时，仍有运行中工作的会话会被跳过；开启则先归档再停止。",
			"saving": "保存中…",
			"saved": "已保存",
			"failed": "保存失败，请重试",
			"loading": "正在读取配置…",
			"unavailable": "该配置当前不可用：插件未启用或 Host 未提供配置命名空间。",
			"invalidNumber": "请输入有效范围内的整数",
		};
		const en = {
			"navLabel": "Auto-archive",
			"title": "Auto-archive idle sessions",
			"intro": "A session whose last event is older than the configured number of days joins the archive set: hidden from the session list, data preserved, and restorable from Archived sessions.",
			"idleDays": "Idle days",
			"idleDaysHint": "Sessions with no events for this many days are archived (1–365 days).",
			"scanGroup": "Scanning",
			"intervalHours": "Scan interval",
			"intervalHoursHint": "How often to scan, in hours (1–168 hours).",
			"startupDelayMinutes": "Startup delay",
			"startupDelayMinutesHint": "Delay before the first scan after DSH starts, in minutes.",
			"maxPerRun": "Per-run limit",
			"maxPerRunHint": "Maximum sessions archived per run; 0 means unlimited.",
			"behaviorGroup": "Behavior",
			"dryRun": "Dry run",
			"dryRunHint": "Only log what would be archived; do not archive anything.",
			"excludePinned": "Exempt pinned sessions",
			"excludePinnedHint": "Pinned sessions are never auto-archived.",
			"countBlankByCreation": "Count blank sessions by creation time",
			"countBlankByCreationHint": "Whether sessions with no events join the check using their creation time.",
			"stopActivity": "Force-stop running work",
			"stopActivityHint": "Off: sessions with running work are skipped. On: archive first, then stop their work.",
			"saving": "Saving…",
			"saved": "Saved",
			"failed": "Save failed, please retry",
			"loading": "Loading configuration…",
			"unavailable": "Configuration unavailable: the plugin is off or the Host serves no configuration namespace.",
			"invalidNumber": "Enter an integer within the allowed range",
		};
		//#endregion

		//#region fields
		const FIELDS = [
			{ key: "idleDays", group: "scanGroup", min: 1, max: 365, kind: "number" },
			{ key: "intervalHours", group: "scanGroup", min: 1, max: 168, kind: "number" },
			{ key: "startupDelayMinutes", group: "scanGroup", min: 0, max: 720, kind: "number" },
			{ key: "maxPerRun", group: "scanGroup", min: 0, max: 1000, kind: "number" },
			{ key: "dryRun", group: "behaviorGroup", kind: "boolean" },
			{ key: "excludePinned", group: "behaviorGroup", kind: "boolean" },
			{ key: "countBlankByCreation", group: "behaviorGroup", kind: "boolean" },
			{ key: "stopActivity", group: "behaviorGroup", kind: "boolean" },
		];
		//#endregion

		//#region view
		/** Subscribe to a Host-observable (config form) through useSyncExternalStore. */
		function useObservable(observable) {
			return react.useSyncExternalStore(
				(listener) => observable.subscribe(listener),
				() => observable.getSnapshot(),
				() => observable.getSnapshot(),
			);
		}

		function NumberField({ t, field, value, disabled, onCommit }) {
			const [text, setText] = react.useState(String(value ?? ""));
			const [invalid, setInvalid] = react.useState(false);
			react.useEffect(() => { setText(String(value ?? "")) }, [value]);
			const inputId = "auto-archive-" + field.key;
			const commit = () => {
				const next = Number(text);
				if (text.trim() === "" || !Number.isInteger(next) || next < field.min || next > field.max) {
					setInvalid(true);
					return;
				}
				setInvalid(false);
				if (next !== value) onCommit(field.key, next);
			};
			return jsxs("div", { className: "DAA_field", children: [
				jsx("label", { htmlFor: inputId, className: "DAA_label", children: t(field.key) }),
				jsx("input", {
					id: inputId,
					type: "number",
					inputMode: "numeric",
					className: invalid ? "DAA_input DAA_inputInvalid" : "DAA_input",
					value: text,
					min: field.min,
					max: field.max,
					step: 1,
					disabled,
					onChange: (event) => { setText(event.target.value); setInvalid(false); },
					onBlur: commit,
					onKeyDown: (event) => {
						if (event.key === "Enter") { event.preventDefault(); commit(); }
					},
				}),
				jsx("p", { className: invalid ? "DAA_error" : "DAA_hint", children: invalid ? t("invalidNumber") : t(field.key + "Hint") }),
			] });
		}

		function ToggleField({ t, field, checked, disabled, onCommit }) {
			const inputId = "auto-archive-" + field.key;
			return jsxs("div", { className: "DAA_toggleRow", children: [
				jsxs("div", { className: "DAA_toggleText", children: [
					jsx("label", { htmlFor: inputId, className: "DAA_label", children: t(field.key) }),
					jsx("p", { className: "DAA_hint", children: t(field.key + "Hint") }),
				] }),
				jsx("input", {
					id: inputId,
					type: "checkbox",
					className: "DAA_checkbox",
					checked: !!checked,
					disabled,
					onChange: (event) => { onCommit(field.key, event.target.checked) },
				}),
			] });
		}

		/**
		 * Build the settings section component bound to one apply() closure.
		 * @param t - dictionary reader bound to the plugin namespace.
		 * @param form - the Host config form for the `auto-archive` entry.
		 * @returns the section component.
		 */
		function createSection(t, form) {
			return function AutoArchiveSection() {
				const snapshot = useObservable(form);
				const [status, setStatus] = react.useState("idle");
				const statusTimer = react.useRef(0);
				const flash = (next) => {
					setStatus(next);
					if (next === "saved") {
						clearTimeout(statusTimer.current);
						statusTimer.current = setTimeout(() => { setStatus("idle") }, 2000);
					}
				};
				react.useEffect(() => () => { clearTimeout(statusTimer.current) }, []);
				if (snapshot.status === "loading") return jsx("p", { className: "DAA_hint", children: t("loading") });
				if (snapshot.status === "unavailable") return jsx("p", { className: "DAA_hint", children: t("unavailable") });
				const value = snapshot.value || {};
				const disabled = !snapshot.writable || status === "saving";
				const commit = (key, next) => {
					flash("saving");
					form.set(key, next).then((ok) => { flash(ok ? "saved" : "failed") })
						.catch(() => { flash("failed") });
				};
				const groups = ["scanGroup", "behaviorGroup"];
				return jsxs("div", { className: "DAA_page", children: [
					jsxs("div", { children: [
						jsx("h3", { className: "DAA_title", children: t("title") }),
						jsx("p", { className: "DAA_intro", children: t("intro") }),
					] }),
					...groups.map((group) => jsxs("div", { className: "DAA_group", children: [
						jsx("h4", { className: "DAA_groupTitle", children: t(group) }),
						...FIELDS.filter((field) => field.group === group).map((field) => field.kind === "number"
							? jsx(NumberField, { t, field, value: value[field.key], disabled, onCommit: commit }, field.key)
							: jsx(ToggleField, { t, field, checked: value[field.key], disabled, onCommit: commit }, field.key)),
					] }, group)),
					jsx("p", { className: "DAA_status", children: status === "saving" ? t("saving") : status === "saved" ? t("saved") : status === "failed" ? t("failed") : "" }),
				] });
			};
		}
		//#endregion

		//#region entry
		const inject = ["slots", "locale", "configForms"];

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "auto-archive: dictionaries");
			const t = ctx.locale.bind(NS);
			const form = ctx.configForms.get("auto-archive");
			const Section = createSection(t, form);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "auto-archive",
				order: 100,
				label: () => t("navLabel"),
				locale: NS,
			}, Section));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
