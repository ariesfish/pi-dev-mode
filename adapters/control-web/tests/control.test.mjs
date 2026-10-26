// control.test.mjs — 冻结接口缝测试:四命令 CLI + steps.json/report.json 契约。
// 引擎置换(drive 改 playwright-core connectOverCDP)的红灯先行:
//   RED 组(旧手写 CDP 引擎失败):视口外点击必须生效 / 慢渲染自动等待 / 页面错误入报告
//   GREEN 组(新旧都必须过的契约锚):aria 点击、type+input 事件、截图落盘、
//     coords 兜底标记、required:false 容忍、cleanup 证据永存
// 运行:node --test "adapters/control-web/tests/*.test.mjs"(需本机 chrome;drive 的
// playwright-core 由包根 npm install 提供;无需网络,data: URL 驱动;注意 Node 26 不再接受
// 目录形式的 --test 参数)。16 组:12 组引擎缝 + launch 键集 / run-id 越界 /
// 未认领端口拒绝 / cleanup 幂等。

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTROL = join(HERE, "..", "harness", "control.mjs");
const HTML = "data:text/html,";

function run(args) {
  const r = spawnSync(process.execPath, [CONTROL, ...args], { encoding: "utf8", timeout: 60_000 });
  assert.equal(r.status, 0, `CLI failed: ${args.join(" ")}\n${r.stderr}`);
  return JSON.parse(r.stdout.trim().split("\n").at(-1));
}

// Async variant: spawnSync blocks the test process, so a fake endpoint served
// from this same process would never answer the child.
function runAsync(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CONTROL, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (status) => resolve({ status, out }));
  });
}

function runFail(args) {
  const r = spawnSync(process.execPath, [CONTROL, ...args], { encoding: "utf8", timeout: 60_000 });
  assert.notEqual(r.status, 0, `CLI should have refused: ${args.join(" ")}\n${r.stdout}`);
  return JSON.parse(r.stdout.trim().split("\n").at(-1));
}

async function withChrome(t, fn) {
  const runId = `test-${t.name.replace(/[^\w-]+/g, "-")}-${Date.now()}`;
  const launched = run(["launch", "--run-id", runId]);
  assert.equal(launched.ok, true, "launch ok");
  try {
    await fn(launched);
  } finally {
    run(["cleanup", "--port", String(launched.devtoolsPort)]);
  }
}

function workDir() {
  return mkdtempSync(join(tmpdir(), "ctl-test-"));
}

// steps 组装 + 落盘 + drive 一把梭;html 属 data: URL 负责编码
function exec(port, dir, html, steps, extra = {}) {
  const plan = { navigate: HTML + encodeURIComponent(html), steps, ...extra };
  const stepsFile = join(dir, "steps.json");
  writeFileSync(stepsFile, JSON.stringify(plan));
  return run(["drive", "--port", String(port), "--steps", stepsFile, "--out", dir]);
}

test("doctor: 刚起的实例体检全绿", async (t) => {
  await withChrome(t, async (l) => {
    const d = run(["doctor", "--port", String(l.devtoolsPort)]);
    assert.equal(d.ok, true);
    assert.ok(d.checks.every((c) => c.ok));
    assert.deepEqual(
      d.checks.map((c) => c.name),
      ["devtools-reachable", "page-target", "port-owned-by-us", "user-data-dir-matches"],
    );
  });
});

test("launch: 输出契约 = README 的六个键", async (t) => {
  await withChrome(t, async (l) => {
    assert.deepEqual(Object.keys(l).sort(), ["devtoolsPort", "ok", "pid", "runId", "targetWsUrl", "userDataDir"]);
    assert.match(l.targetWsUrl, /^ws:\/\//);
  });
});

test("launch: run id 不能逃出 /tmp/verify-*", () => {
  const r = runFail(["launch", "--run-id", "../evil"]);
  assert.equal(r.ok, false);
});

test("cleanup: 有进程应答但无归属记录 -> 拒绝,别的 verify 目录不受牵连", async () => {
  const { createServer } = await import("node:http");
  const server = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ Browser: "NotOurs/1.0" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const foreign = join(tmpdir(), `verify-foreign-${Date.now()}`);
  mkdirSync(foreign, { recursive: true });
  writeFileSync(join(foreign, "keep.txt"), "evidence");
  try {
    const r = await runAsync(["cleanup", "--port", String(port)]);
    assert.notEqual(r.status, 0, "cleanup must refuse a port it does not own");
    assert.match(r.out, /refusing to close or delete/);
    assert.ok(existsSync(join(foreign, "keep.txt")), "foreign verify dir must survive");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(foreign, { recursive: true, force: true });
  }
});

test("cleanup: 已清理的端口重复调用是幂等的", async (t) => {
  await withChrome(t, async (l) => {
    run(["cleanup", "--port", String(l.devtoolsPort)]);
    const again = run(["cleanup", "--port", String(l.devtoolsPort)]);
    assert.equal(again.ok, true);
    assert.deepEqual(again.userDataDirs, []);
  });
});

test("green组-aria点击+selector读取+截图落盘", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    const html = `<button aria-label="go">go</button><p>init</p><script>document.querySelector('button').onclick=()=>{document.querySelector('p').textContent='hit'}<\/script>`;
    const report = exec(l.devtoolsPort, dir, html, [
      { find: { aria: "go" }, click: true, expectVisible: true },
      { find: { selector: "p" }, read: true },
      { shot: "final" },
    ]);
    assert.equal(report.ok, true, JSON.stringify(report));
    assert.equal(report.steps[0].via, "aria");
    assert.equal(report.steps[0].ok, true);
    assert.equal(report.steps[1].read, "hit");
    const shot = report.steps[2].shot;
    assert.ok(shot && existsSync(shot), "截图存在");
    assert.equal(readFileSync(shot).subarray(1, 4).toString("latin1"), "PNG");
  });
});

test("green组-type走input事件链", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    const html = `<input aria-label="field"><p>TEXT:</p><script>const i=document.querySelector('input');i.addEventListener('input',()=>document.querySelector('p').textContent='TEXT:'+i.value)<\/script>`;
    const report = exec(l.devtoolsPort, dir, html, [
      { find: { aria: "field" }, type: "hello" },
      { find: { selector: "p" }, read: true },
    ]);
    assert.equal(report.steps[1].read, "TEXT:hello", JSON.stringify(report));
  });
});

test("red组-视口外元素点击必须真实生效", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    // 按钮压在 2400px 深处(headless 视口 ~600px),不滚动必然点空
    const html = `<div style="height:2400px"></div><button aria-label="deep">deep</button><p>init</p><script>document.querySelector('button').onclick=()=>{document.querySelector('p').textContent='hit'}<\/script>`;
    const report = exec(l.devtoolsPort, dir, html, [
      { find: { aria: "deep" }, click: true },
      { find: { selector: "p" }, read: true },
    ], { settleMs: 200 });
    assert.equal(report.steps[0].ok, true);
    assert.equal(report.steps[1].read, "hit", `视口外点击未生效: ${JSON.stringify(report.steps[0])}`);
  });
});

test("red组-慢渲染元素自动等到可用", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    // 元素 900ms 后才出现;settleMs 只有 100,纯 sleep 引擎必 miss,自动等待引擎必中
    const html = `<h1>title</h1><script>setTimeout(()=>{const d=document.createElement('p');d.id='late';d.textContent='late-arrived';document.body.appendChild(d)},900)<\/script>`;
    const report = exec(l.devtoolsPort, dir, html, [
      { find: { selector: "#late" }, read: true, expectVisible: true },
    ], { settleMs: 100 });
    assert.equal(report.steps[0].read, "late-arrived", `未等到晚出现元素: ${JSON.stringify(report.steps[0])}`);
  });
});

test("red组-页面uncaught错误进报告", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    const html = `<h1>t</h1><script>setTimeout(()=>{throw new Error('boom-marker')},50)<\/script>`;
    const report = exec(l.devtoolsPort, dir, html, [
      { find: { selector: "h1" }, read: true },
    ], { settleMs: 400 });
    const joined = JSON.stringify(report.pageErrors ?? []);
    assert.ok(joined.includes("boom-marker"), `pageErrors 未捕获: ${joined}`);
  });
});

test("green组-coords兜底带标记", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    const html = `<div style="width:100%;height:100vh;background:#eee" onclick="document.title='clicked'"></div><h1>pad</h1>`;
    const report = exec(l.devtoolsPort, dir, html, [
      { find: { coords: [10, 10] }, click: true },
    ]);
    assert.equal(report.steps[0].via, "coords");
    assert.equal(report.steps[0].note, "coordinate-fallback");
  });
});

test("green组-requiredfalse容忍失败步", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    const report = exec(l.devtoolsPort, dir, `<h1>t</h1>`, [
      { find: { selector: "#nope" }, read: true, required: false, label: "optional-probe" },
      { find: { selector: "h1" }, read: true },
    ]);
    assert.equal(report.steps[0].ok, false);
    assert.equal(report.ok, true, `必选步之外的失败不应翻车: ${JSON.stringify(report)}`);
  });
});

test("red组-fill清空旧值再置值", async (t) => {
	await withChrome(t, async (l) => {
		const dir = workDir();
		const html = `<input aria-label="field" value="oldvalue"><p>TEXT:</p><script>const i=document.querySelector('input');i.addEventListener('input',()=>document.querySelector('p').textContent='TEXT:'+i.value)<\/script>`;
		const report = exec(l.devtoolsPort, dir, html, [
			{ find: { aria: "field" }, type: "fresh" },
			{ find: { selector: "p" }, read: true },
		]);
		// fill 语义:清空后置值;若不清空会读到 TEXT:oldvaluefresh
		assert.equal(report.steps[1].read, "TEXT:fresh", JSON.stringify(report));
	});
});

test("red组-多元素命中报错而非取首个", async (t) => {
	await withChrome(t, async (l) => {
		const dir = workDir();
		const html = `<button aria-label="dupe">a</button><button aria-label="dupe">b</button><p>quiet</p>`;
		const report = exec(l.devtoolsPort, dir, html, [
			{ find: { aria: "dupe" }, click: true },
			{ find: { selector: "p" }, read: true, required: false },
		]);
		assert.equal(report.steps[0].ok, false);
		assert.match(report.steps[0].error, /strict mode violation|2 elements/);
		assert.equal(report.ok, false, "默认必选步失败必须翻报告");
	});
});

test("red组-coords只支持点击", async (t) => {
	await withChrome(t, async (l) => {
		const dir = workDir();
		const html = `<h1>t</h1>`;
		const report = exec(l.devtoolsPort, dir, html, [
			{ find: { coords: [10, 10] }, type: "x" },
		]);
		assert.equal(report.steps[0].ok, false, "coords+type 不允许静默 ok");
		assert.match(report.steps[0].error, /coords supports click only/);
	});
});

test("green组-cleanup后证据永存", async (t) => {
  await withChrome(t, async (l) => {
    const dir = workDir();
    const report = exec(l.devtoolsPort, dir, `<h1>keep</h1>`, [
      { find: { selector: "h1" }, read: true }, { shot: "kept" },
    ]);
    run(["cleanup", "--port", String(l.devtoolsPort)]);
    assert.ok(existsSync(join(dir, "report.json")));
    assert.ok(existsSync(report.steps[1].shot));
  });
});
