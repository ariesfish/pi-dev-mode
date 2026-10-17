#!/usr/bin/env node
// control.mjs — CDP 驱动核对 harness(冻结接口,变更须过 README 例外审批)
//
// 构造约束(adapters/control-web/README.md):
//   1. 自起隔离实例:launch 永远新 chrome + 独立 --user-data-dir + auto 端口
//   2. ARIA/可访问名优先,坐标兜底(显式 coords 才用,report 标记)
//   3. 本文件属冻结 helper;零 npm 依赖(Node ≥22 原生 WebSocket)
//
// 用法见 README。子命令:launch | doctor | drive | cleanup

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { join } from "node:path";

const CHROME = process.env.CHROME_BIN || "google-chrome-stable";

// ---------- 小工具 ----------

function log(obj) {
	process.stdout.write(JSON.stringify(obj) + "\n");
}

function fail(msg, extra = {}) {
	log({ ok: false, error: msg, ...extra });
	process.exit(1);
}

async function fetchJson(url, timeoutMs = 4000) {
	const ac = new AbortController();
	const t = setTimeout(() => ac.abort(), timeoutMs);
	try {
		const res = await fetch(url, { signal: ac.signal });
		return await res.json();
	} finally {
		clearTimeout(t);
	}
}

// ---------- CDP 客户端(零依赖) ----------

class Cdp {
	constructor(wsUrl) {
		this.ws = new WebSocket(wsUrl);
		this.nextId = 1;
		this.pending = new Map();
		this.events = [];
		this.ws.addEventListener("message", (ev) => {
			const msg = JSON.parse(String(ev.data));
			if (msg.id && this.pending.has(msg.id)) {
				const { resolve, reject } = this.pending.get(msg.id);
				this.pending.delete(msg.id);
				if (msg.error) reject(new Error(`${msg.error.message} ${msg.error.data ?? ""}`));
				else resolve(msg.result);
			} else if (msg.method) {
				this.events.push(msg);
			}
		});
	}

	static async connect(port) {
		const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
		const page = targets.find((t) => t.type === "page");
		if (!page) throw new Error(`no page target on port ${port}`);
		const cdp = new Cdp(page.webSocketDebuggerUrl);
		await new Promise((resolve, reject) => {
			cdp.ws.addEventListener("open", resolve, { once: true });
			cdp.ws.addEventListener("error", () => reject(new Error("ws connect failed")), { once: true });
		});
		return cdp;
	}

	call(method, params = {}) {
		const id = this.nextId++;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.ws.send(JSON.stringify({ id, method, params }));
		});
	}

	close() {
		this.ws.close();
	}
}

// ---------- launch:自起隔离实例 ----------

async function cmdLaunch(args) {
	const runId = argValue(args, "--run-id") || `run-${Date.now()}`;
	const headless = !args.includes("--no-headless");
	// auto 端口:绑 0 让内核分,再从 /json/version 读回来
	const chromeArgs = [
		...(headless ? ["--headless=new"] : []),
		`--user-data-dir=/tmp/verify-${runId}`,
		"--remote-debugging-port=0",
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-extensions",
		"--disable-dev-shm-usage",
		"about:blank",
	];
	const child = spawn(CHROME, chromeArgs, { stdio: "ignore", detached: true });
	child.unref();
	const deadline = Date.now() + 15000;
	let version = null;
	while (Date.now() < deadline) {
		await delay(300);
		if (child.exitCode !== null) fail(`chrome exited early (code ${child.exitCode})`);
		try {
			// DevToolsActivePort 文件由 chrome 写入 user-data-dir,含真实端口
			const { readFileSync } = await import("node:fs");
			const portFile = `/tmp/verify-${runId}/DevToolsActivePort`;
			if (existsSync(portFile)) {
				const port = Number(readFileSync(portFile, "utf8").split("\n")[0]);
				version = await fetchJson(`http://127.0.0.1:${port}/json/version`);
				if (version && version.Browser) {
					log({
						ok: true,
						runId,
						pid: child.pid,
						devtoolsPort: port,
						userDataDir: `/tmp/verify-${runId}`,
					});
					return;
				}
			}
		} catch {
			/* chrome 尚未就绪,继续等 */
		}
	}
	fail("chrome did not expose DevToolsActivePort within 15s");
}

// ---------- doctor:只读体检 ----------

async function cmdDoctor(args) {
	const port = Number(argValue(args, "--port"));
	if (!port) fail("doctor requires --port");
	const checks = [];
	async function check(name, fn) {
		try {
			const detail = await fn();
			checks.push({ name, ok: true, ...detail });
		} catch (err) {
			checks.push({ name, ok: false, error: String(err.message || err) });
		}
	}
	await check("devtools-reachable", async () => {
		const v = await fetchJson(`http://127.0.0.1:${port}/json/version`);
		return { browser: v.Browser, webSocket: v.webSocketDebuggerUrl != null };
	});
	await check("page-target", async () => {
		const list = await fetchJson(`http://127.0.0.1:${port}/json/list`);
		const page = list.find((t) => t.type === "page");
		if (!page) throw new Error("no page target");
		return { url: page.url };
	});
	const ok = checks.every((c) => c.ok);
	log({ ok, checks });
}

// ---------- 定位:ARIA/可访问名优先,坐标兜底 ----------

// Runtime.evaluate 内跑的查找器;命中返回 [{ nodeId 用 CDP DOM 域拿 box }]
// 次序:aria-label / 可访问名(textContent 近似) / selector / 文本
const FINDER = (criteria) => {
	const norm = (s) => String(s || "").trim().toLowerCase();
	const aria = criteria.aria;
	if (aria != null) {
		const want = norm(aria);
		const byLabel = [
			...document.querySelectorAll(`[aria-label="${CSS.escape(aria)}"]`),
			...document.querySelectorAll(`[aria-labelledby]`),
			...document.querySelectorAll("button,a,[role],input,textarea"),
		];
		for (const el of byLabel) {
			const name =
				el.getAttribute("aria-label") ||
				document.getElementById(el.getAttribute("aria-labelledby") || "")?.textContent ||
				el.textContent;
			if (norm(name) === want || (name && norm(name).includes(want))) {
				return { el, via: "aria" };
			}
		}
	}
	if (criteria.selector != null) {
		const el = document.querySelector(criteria.selector);
		if (el) return { el, via: "selector" };
	}
	if (criteria.text != null) {
		const want = norm(criteria.text);
		for (const el of document.querySelectorAll("*")) {
			if (el.children.length === 0 && norm(el.textContent).includes(want)) {
				return { el, via: "text" };
			}
		}
	}
	return null;
};

async function findNode(cdp, criteria) {
	if (criteria.coords) return { via: "coords", coords: criteria.coords };
	// 命中元素打上临时属性,再用 DOM.performSearch 稳定取得 backendNodeId
	// (简化路径:evaluate 里直接给元素挂 data-pdm-hit,然后 querySelector 它)
	const expr = `(() => {
		document.querySelectorAll("[data-pdm-hit]").forEach((n) => n.removeAttribute("data-pdm-hit"));
		const hit = (${FINDER.toString()})(${JSON.stringify(criteria)});
		if (!hit) return null;
		hit.el.setAttribute("data-pdm-hit", "1");
		return { via: hit.via, tag: hit.el.tagName, text: (hit.el.textContent||"").slice(0,60) };
	})()`;
	const res = await cdp.call("Runtime.evaluate", { expression: expr, returnByValue: true });
	if (res.exceptionDetails) throw new Error("finder evaluate failed: " + res.exceptionDetails.text);
	if (!res.result.value) return null;
	// 通过持有真实节点的事件驱动:再 evaluate 一次拿到节点的 getBoundingClientRect
	const boxExpr = `(() => {
		const el = document.querySelector("[data-pdm-hit]");
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
	})()`;
	const boxRes = await cdp.call("Runtime.evaluate", { expression: boxExpr, returnByValue: true });
	const box = boxRes.result.value;
	if (!box) return null;
	return { ...res.result.value, box, via: res.result.value.via };
}

// ---------- 真实输入事件驱动 ----------

async function clickAt(cdp, x, y) {
	await cdp.call("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
	await cdp.call("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

async function typeText(cdp, text) {
	// insertText 走输入法路径,与真实键入等价的 Input 域文本注入
	for (const line of String(text).split("\n")) {
		await cdp.call("Input.insertText", { text: line });
		if (line !== String(text).split("\n").at(-1)) await keyTap(cdp, "Enter");
	}
}

async function keyTap(cdp, key) {
	const def = { key, code: key === "Enter" ? "Enter" : key, windowsVirtualKeyCode: key === "Enter" ? 13 : 0 };
	await cdp.call("Input.dispatchKeyEvent", { type: "keyDown", ...def });
	await cdp.call("Input.dispatchKeyEvent", { type: "keyUp", ...def });
}

// ---------- drive:工况 + 取证 ----------

async function cmdDrive(args) {
	const port = Number(argValue(args, "--port"));
	const stepsFile = argValue(args, "--steps");
	const outDir = argValue(args, "--out") || "/tmp/verify-drive";
	if (!port || !stepsFile) fail("drive requires --port and --steps");
	const { readFileSync } = await import("node:fs");
	const plan = JSON.parse(readFileSync(stepsFile, "utf8"));
	mkdirSync(outDir, { recursive: true });

	const cdp = await Cdp.connect(port);
	const report = { ok: true, url: plan.navigate ?? null, steps: [] };
	try {
		await cdp.call("Page.enable");
		await cdp.call("Runtime.enable");
		if (plan.navigate) {
			await cdp.call("Page.navigate", { url: plan.navigate });
			await delay(plan.settleMs ?? 1200);
		}
		let shotSeq = 0;
		for (const [i, step] of (plan.steps || []).entries()) {
			const entry = { step: i + 1, label: step.label || step.shot || "unlabeled", ok: false };
			try {
				if (step.shot) {
					const name = `${String(++shotSeq).padStart(2, "0")}-${step.shot.replace(/[^\w.-]+/g, "_")}.png`;
					const shot = await cdp.call("Page.captureScreenshot", { format: "png" });
					writeFileSync(join(outDir, name), Buffer.from(shot.data, "base64"));
					entry.shot = join(outDir, name);
					entry.ok = true;
				} else if (step.expectVisible || step.click || step.type || step.read) {
					const found = await findNode(cdp, step.find || {});
					if (!found) {
						entry.ok = false;
						entry.error = "find: no match for criteria";
					} else {
						entry.via = found.via;
						entry.text = found.text;
						entry.ok = true;
						if (step.click) {
							if (found.via === "coords") {
								await clickAt(cdp, found.coords[0], found.coords[1]);
								entry.note = "coordinate-fallback";
							} else {
								await clickAt(cdp, found.box.x, found.box.y);
							}
							await delay(400);
						}
						if (step.type) {
							if (found.via !== "coords") await clickAt(cdp, found.box.x, found.box.y);
							await typeText(cdp, step.type);
							await delay(300);
						}
						if (step.read) {
							const readExpr = `document.querySelector("[data-pdm-hit]")?.textContent ?? null`;
							const r = await cdp.call("Runtime.evaluate", { expression: readExpr, returnByValue: true });
							entry.read = r.result.value;
						}
					}
				} else if (step.navigate) {
					await cdp.call("Page.navigate", { url: step.navigate });
					await delay(step.settleMs ?? 1200);
					entry.ok = true;
				}
			} catch (err) {
				entry.ok = false;
				entry.error = String(err.message || err);
			}
			report.steps.push(entry);
			if (!entry.ok && step.required !== false) report.ok = false;
		}
	} finally {
		cdp.close();
	}
	writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
	log(report);
}

// ---------- cleanup:只杀自己起的,证据永不删 ----------

async function cmdCleanup(args) {
	const port = Number(argValue(args, "--port"));
	if (!port) fail("cleanup requires --port");
	const { execSync } = await import("node:child_process");
	const removed = { devtoolsDown: false, userDataDirs: [] };
	try {
		// 经 CDP Browser.close 优雅关停(只作用于该隔离实例)
		const cdp = await Cdp.connect(port);
		await cdp.call("Browser.close");
		cdp.close();
		removed.devtoolsDown = true;
	} catch {
		// 端口已死也算完成目标
		removed.devtoolsDown = true;
	}
	// 清理 15 秒前仍存在的本次 verify-* 隔离目录(保守:只删 >15s 的)
	const { readdirSync, statSync, rmSync: rm } = await import("node:fs");
	const cutoff = Date.now() - 15000;
	for (const dir of readdirSync("/tmp").filter((d) => d.startsWith("verify-"))) {
		const full = `/tmp/${dir}`;
		try {
			if (statSync(full).mtimeMs < cutoff) {
				rm(full, { recursive: true, force: true });
				removed.userDataDirs.push(full);
			}
		} catch {
			/* 竞态即忽略 */
		}
	}
	log({ ok: true, ...removed });
}

// ---------- CLI ----------

function argValue(args, flag) {
	const i = args.indexOf(flag);
	return i !== -1 ? args[i + 1] : null;
}

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
	case "launch":
		await cmdLaunch(args);
		break;
	case "doctor":
		await cmdDoctor(args);
		break;
	case "drive":
		await cmdDrive(args);
		break;
	case "cleanup":
		await cmdCleanup(args);
		break;
	default:
		fail(`unknown command ${cmd ?? "(none)"}; expect launch|doctor|drive|cleanup`);
}
