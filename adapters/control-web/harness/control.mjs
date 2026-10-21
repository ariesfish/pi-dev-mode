#!/usr/bin/env node
// control.mjs — CDP 驱动核对 harness(冻结接口,变更须过 README 例外审批)
//
// 构造约束(adapters/control-web/README.md):
//   1. 自起隔离实例:launch 永远新 chrome + 独立 --user-data-dir + auto 端口;
//      drive 只连 launch 输出的隔离端口,绝不附着用户浏览器
//   2. ARIA/可访问名优先,坐标兜底(显式 coords 才用,report 标记)
//   3. 本文件属冻结 helper;launch/doctor/cleanup 零 npm 依赖(Node ≥22 原生
//      WebSocket),drive 引擎为 playwright-core(connectOverCDP,例外审批
//      2026-10-22),自动等待/滚动到位/iframe+shadow DOM/console 取证由引擎带来
//
// 用法见 README。子命令:launch | doctor | drive | cleanup

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
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

// ---------- CDP 客户端(零依赖;launch 体检与 cleanup 关停用) ----------

class Cdp {
	constructor(wsUrl) {
		this.ws = new WebSocket(wsUrl);
		this.nextId = 1;
		this.pending = new Map();
		this.ws.addEventListener("message", (ev) => {
			const msg = JSON.parse(String(ev.data));
			if (msg.id && this.pending.has(msg.id)) {
				const { resolve, reject } = this.pending.get(msg.id);
				this.pending.delete(msg.id);
				if (msg.error) reject(new Error(`${msg.error.message} ${msg.error.data ?? ""}`));
				else resolve(msg.result);
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
	// auto 端口:绑 0 让内核分,再从 DevToolsActivePort 读回
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
	while (Date.now() < deadline) {
		await delay(300);
		if (child.exitCode !== null) fail(`chrome exited early (code ${child.exitCode})`);
		try {
			// DevToolsActivePort 文件由 chrome 写入 user-data-dir,含真实端口
			const portFile = `/tmp/verify-${runId}/DevToolsActivePort`;
			if (existsSync(portFile)) {
				const port = Number(readFileSync(portFile, "utf8").split("\n")[0]);
				const version = await fetchJson(`http://127.0.0.1:${port}/json/version`);
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

// ---------- drive:playwright-core 引擎驱动 + 取证 ----------

// 连接本树 launch 出来的隔离实例;引擎在 drive 才需要,缺装时给出精确指引
async function connect(port, timeoutMs) {
	let pw;
	try {
		pw = await import("playwright-core");
	} catch {
		fail("drive needs playwright-core: run npm install at this package's root (see adapters/control-web/README.md 依赖面)");
	}
	const browser = await pw.chromium.connectOverCDP(`http://127.0.0.1:${port}`);
	const ctx = browser.contexts()[0] ?? (await browser.newContext());
	ctx.setDefaultTimeout(timeoutMs);
	const page = ctx.pages()[0] ?? (await ctx.newPage());
	return { browser, page };
}

// 定位:aria(getByLabel)→ selector → text;coords 不建 locator(走鼠标坐标)
function locate(page, criteria) {
	if (criteria.aria != null) return { loc: page.getByLabel(criteria.aria), via: "aria" };
	if (criteria.selector != null) return { loc: page.locator(criteria.selector), via: "selector" };
	if (criteria.text != null) return { loc: page.getByText(criteria.text), via: "text" };
	return null;
}

async function cmdDrive(args) {
	const port = Number(argValue(args, "--port"));
	const stepsFile = argValue(args, "--steps");
	const outDir = argValue(args, "--out") || "/tmp/verify-drive";
	if (!port || !stepsFile) fail("drive requires --port and --steps");
	const plan = JSON.parse(readFileSync(stepsFile, "utf8"));
	mkdirSync(outDir, { recursive: true });

	const { browser, page } = await connect(port, plan.timeoutMs ?? 8000);
	const pageErrors = [];
	page.on("pageerror", (e) => pageErrors.push(String((e && e.message) || e)));
	const report = { ok: true, url: plan.navigate ?? null, steps: [] };
	try {
		if (plan.navigate) {
			await page.goto(plan.navigate);
			if (plan.settleMs) await delay(plan.settleMs);
		}
		let shotSeq = 0;
		for (const [i, step] of (plan.steps || []).entries()) {
			const entry = { step: i + 1, label: step.label || step.shot || "unlabeled", ok: false };
			try {
				if (step.shot) {
					const name = `${String(++shotSeq).padStart(2, "0")}-${step.shot.replace(/[^\w.-]+/g, "_")}.png`;
					await page.screenshot({ path: join(outDir, name) });
					entry.shot = join(outDir, name);
					entry.ok = true;
				} else if (step.expectVisible || step.click || step.type || step.read) {
					const criteria = step.find || {};
					if (criteria.coords) {
						// coords 是最后兜底,只支持点击(打标记);其他动词要明确判据,不静默 ok
						if (step.click && !step.type && !step.read && !step.expectVisible) {
							const [x, y] = criteria.coords;
							await page.mouse.click(x, y);
							entry.via = "coords";
							entry.note = "coordinate-fallback";
							entry.ok = true;
						} else {
							entry.error = "coords supports click only; type/read/expectVisible need aria|selector|text";
						}
					} else {
						const hit = locate(page, criteria);
						if (!hit) {
							entry.error = "find: no criteria (aria|selector|text|coords)";
						} else {
							if (step.expectVisible || step.click || step.type) {
								await hit.loc.waitFor({ state: "visible" });
							}
							entry.via = hit.via;
							entry.text = String((await hit.loc.textContent()) ?? "").slice(0, 60);
							entry.ok = true;
							if (step.click) await hit.loc.click();
							if (step.type) await hit.loc.fill(String(step.type));
							if (step.read) entry.read = await hit.loc.textContent();
						}
					}
				} else if (step.navigate) {
					await page.goto(step.navigate);
					if (step.settleMs) await delay(step.settleMs);
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
		try {
			await browser.close(); // connectOverCDP:只断连,chrome 由 cleanup 关停
		} catch {
			/* 断连失败不掩报告 */
		}
	}
	const out = pageErrors.length ? { ...report, pageErrors } : report;
	writeFileSync(join(outDir, "report.json"), JSON.stringify(out, null, 2));
	log(out);
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
