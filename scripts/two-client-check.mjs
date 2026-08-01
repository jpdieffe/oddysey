import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectDir = path.resolve(import.meta.dirname, '..');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4183';
const soakSeconds = Number(process.env.SOAK_SECONDS ?? 30);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = (seconds) => Date.now() + seconds * 1000;

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try { await access(candidate); return candidate; } catch { /* try the next browser */ }
  }
  throw new Error('Chrome/Edge not found. Set CHROME_PATH to a Chromium executable.');
}

async function waitForServer(url, until = deadline(15)) {
  while (Date.now() < until) {
    try { if ((await fetch(url)).ok) return; } catch { /* Vite is still starting */ }
    await wait(150);
  }
  throw new Error(`Vite did not become ready at ${url}`);
}

async function startServer() {
  if (process.argv[2]) { await waitForServer(baseUrl); return null; }
  const viteEntry = path.join(projectDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const proc = spawn(process.execPath, [viteEntry, '--host', '--port', '4183', '--strictPort'], {
    cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let output = '';
  proc.stdout.on('data', (chunk) => { output += chunk; });
  proc.stderr.on('data', (chunk) => { output += chunk; });
  try { await waitForServer(baseUrl); } catch (error) {
    proc.kill();
    throw new Error(`${error.message}\n${output}`);
  }
  return proc;
}

async function connectDebugger(port, expectedOrigin) {
  const until = deadline(12);
  while (Date.now() < until) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = pages.find((candidate) => candidate.type === 'page' && candidate.url.startsWith(expectedOrigin));
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    } catch { /* Chromium is still starting */ }
    await wait(100);
  }
  throw new Error(`Browser on debugging port ${port} did not expose the game page`);
}

async function launchClient(chrome, id, port, url) {
  const profile = await mkdtemp(path.join(tmpdir(), `odyssey-perf-client-${id}-`));
  const proc = spawn(chrome, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,900', url,
  ], { stdio: 'ignore', windowsHide: true });
  const ws = await connectDebugger(port, new URL(baseUrl).origin);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  let seq = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++seq;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`${method} timed out`)); }, 10000);
    pending.set(requestId, (message) => { clearTimeout(timer); resolve(message); });
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async (expression, awaitPromise = false) => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description ?? response.result.exceptionDetails.text);
    return response.result?.result?.value;
  };
  const close = async () => {
    try { ws.close(); } catch { /* already closed */ }
    proc.kill();
    await wait(250);
    await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 }).catch(() => {});
  };
  return { id, evaluate, close };
}

async function waitFor(client, expression, label, seconds = 20) {
  const until = deadline(seconds);
  while (Date.now() < until) {
    if (await client.evaluate(`Boolean(${expression})`)) return;
    await wait(150);
  }
  const text = await client.evaluate('document.body.innerText.slice(0, 500)');
  throw new Error(`Client ${client.id}: timed out waiting for ${label}\n${text}`);
}

async function clickText(client, text) {
  const clicked = await client.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent.includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    return true;
  })()`);
  if (!clicked) throw new Error(`Client ${client.id}: button containing "${text}" not found`);
}

async function startAutoplayer(client) {
  await client.evaluate(`(() => {
    const perf = window.__odysseyPerf = {
      frameTimes: [], samples: [], longTasks: [], startedAt: performance.now(), moves: 0, casts: 0, readyClicks: 0,
    };
    let previous = performance.now();
    const frame = (now) => { perf.frameTimes.push(now - previous); previous = now; requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    if (window.PerformanceObserver) {
      try { new PerformanceObserver((list) => list.getEntries().forEach((entry) => perf.longTasks.push(entry.duration))).observe({ type: 'longtask' }); } catch {}
    }
    const act = () => {
      const canvas = document.querySelector('canvas');
      const state = window.__bulwark?.state();
      const lockstep = window.__bulwark?.lockstep;
      if (!canvas || !state || !lockstep) return;
      const ready = document.querySelector('.ready-btn');
      if (ready && getComputedStyle(ready).display !== 'none' && !state.players[lockstep.localPlayer]?.ready) {
        ready.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); perf.readyClicks++;
      }
      const rect = canvas.getBoundingClientRect();
      const phase = (perf.moves + ${client.id} * 7) * 0.71;
      const x = rect.left + rect.width * (0.28 + 0.42 * ((Math.sin(phase) + 1) / 2));
      const y = rect.top + rect.height * (0.25 + 0.45 * ((Math.cos(phase * 0.83) + 1) / 2));
      for (const type of ['pointerdown', 'pointerup']) canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
      perf.moves++;
      if (perf.moves % 4 === 0) {
        const power = document.querySelector('.power-slot');
        if (power) { power.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 2 })); canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 2 })); perf.casts++; }
      }
    };
    perf.actionTimer = setInterval(act, 450);
    perf.sampleTimer = setInterval(() => {
      const state = window.__bulwark?.state(); const net = window.__bulwark?.lockstep?.stats();
      if (state && net) perf.samples.push({ at: performance.now(), tick: state.tick, enemies: state.enemies.length, stalled: net.stalled, stallMs: net.stallMs, rttMs: net.rttMs, verified: net.verifiedTicks, desynced: net.desynced });
    }, 200);
    return true;
  })()`);
}

async function collect(client) {
  return client.evaluate(`(() => {
    const perf = window.__odysseyPerf; clearInterval(perf.actionTimer); clearInterval(perf.sampleTimer);
    const sorted = [...perf.frameTimes].sort((a,b) => a-b); const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
    const state = window.__bulwark.state(); const net = window.__bulwark.lockstep.stats();
    let stalledSamples=0,maxStallMs=0,maxTickPauseMs=0;
    for(let i=0;i<perf.samples.length;i++){const sample=perf.samples[i];if(sample.stalled)stalledSamples++;maxStallMs=Math.max(maxStallMs,sample.stallMs);if(i&&sample.tick===perf.samples[i-1].tick)maxTickPauseMs+=sample.at-perf.samples[i-1].at;else maxTickPauseMs=0;}
    const elapsed=performance.now()-perf.startedAt;
    return { client: window.__bulwark.lockstep.localPlayer+1, elapsedMs: Math.round(elapsed), frames: perf.frameTimes.length,
      fps: +(perf.frameTimes.length*1000/elapsed).toFixed(1), p50FrameMs:+pct(.5).toFixed(1), p95FrameMs:+pct(.95).toFixed(1), p99FrameMs:+pct(.99).toFixed(1), maxFrameMs:+(sorted.at(-1)??0).toFixed(1),
      framesOver25Ms:perf.frameTimes.filter(x=>x>25).length, framesOver50Ms:perf.frameTimes.filter(x=>x>50).length,
      longTasks:perf.longTasks.length,longTaskMs:+perf.longTasks.reduce((a,b)=>a+b,0).toFixed(1),tick:state.tick,wave:state.wave,enemies:state.enemies.length,
      hash:window.__bulwark.hash(),rttMs:net.rttMs,inputDelay:net.inputDelay,verifiedTicks:net.verifiedTicks,desynced:net.desynced,
      stalledSamples,maxStallMs,moves:perf.moves,casts:perf.casts,readyClicks:perf.readyClicks };
  })()`);
}

function assess(results) {
  const failures = [];
  for (const result of results) {
    if (result.fps < 50) failures.push(`client ${result.client} average FPS ${result.fps} < 50`);
    if (result.p95FrameMs > 25) failures.push(`client ${result.client} p95 frame ${result.p95FrameMs}ms > 25ms`);
    if (result.framesOver50Ms / Math.max(1, result.frames) > 0.01) failures.push(`client ${result.client} has >1% frames over 50ms`);
    if (result.maxStallMs > 750) failures.push(`client ${result.client} lockstep stall ${result.maxStallMs}ms > 750ms`);
    if (result.desynced) failures.push(`client ${result.client} reported a desync`);
    if (result.verifiedTicks < 10) failures.push(`client ${result.client} verified only ${result.verifiedTicks} state hashes`);
    if (result.moves < soakSeconds) failures.push(`client ${result.client} autoplayer produced too few actions`);
  }
  if (Math.abs(results[0].tick - results[1].tick) > 2) failures.push(`clients ended ${Math.abs(results[0].tick-results[1].tick)} ticks apart`);
  return failures;
}

let server = null;
const clients = [];
try {
  if (!Number.isFinite(soakSeconds) || soakSeconds < 10) throw new Error('SOAK_SECONDS must be at least 10');
  const chrome = await findChrome();
  server = await startServer();
  const host = await launchClient(chrome, 1, 9331, baseUrl); clients.push(host);
  await waitFor(host, "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Host a co-op game'))", 'title screen');
  await clickText(host, 'Host a co-op game');
  await waitFor(host, "document.querySelector('.room-code')", 'room code');
  const code = await host.evaluate("document.querySelector('.room-code').textContent.trim()");
  const guest = await launchClient(chrome, 2, 9332, `${baseUrl}#${code}`); clients.push(guest);
  await waitFor(host, "document.body.innerText.includes('Co-op lobby')", 'host lobby', 30);
  await waitFor(guest, "document.body.innerText.includes('Co-op lobby')", 'guest lobby', 30);
  await clickText(guest, 'Ready up'); await wait(400);
  await clickText(host, 'Ready up');
  await waitFor(host, "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Start the battle'))", 'start battle button');
  await clickText(host, 'Start the battle');
  await waitFor(host, 'window.__bulwark?.state()', 'host game');
  await waitFor(guest, 'window.__bulwark?.state()', 'guest game');
  await Promise.all([startAutoplayer(host), startAutoplayer(guest)]);
  console.log(`Two real WebRTC clients are auto-playing for ${soakSeconds}s (room ${code})...`);
  const until = deadline(soakSeconds);
  while (Date.now() < until) { await wait(Math.min(1000, until - Date.now())); }
  const results = await Promise.all([collect(host), collect(guest)]);
  console.table(results.map(({ hash, ...rest }) => rest));
  const failures = assess(results);
  if (failures.length) { console.error('\nFAIL\n- ' + failures.join('\n- ')); process.exitCode = 1; }
  else console.log('\nPASS: two-client rendering, WebRTC lockstep, automation, and state verification stayed within budget.');
} finally {
  await Promise.all(clients.map((client) => client.close()));
  server?.kill();
}
