import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import http from 'node:http';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.HOME + '/.cache/ms-playwright/chromium-1148/chrome-linux/chrome';
execFileSync('node', [join(here, 'build.mjs')], { stdio: 'inherit' });

// Chrome's CLI --screenshot with --window-size=1024,1024 captures only the
// top ~940 px of this page (the bottom rows come out blank), so screenshot
// through the DevTools protocol instead, with captureBeyondViewport.
const profile = mkdtempSync(join(tmpdir(), 'news21-r2-'));
const port = 9400 + (process.pid % 50);
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
const get = (path) => new Promise((res, rej) => {
  const req = http.get({ host: '127.0.0.1', port, path }, (r) => { let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(d)); });
  req.on('error', rej);
});
let targets;
for (let i = 0; i < 60; i++) {
  try { targets = JSON.parse(await get('/json/list')); break; }
  catch { await new Promise((r) => setTimeout(r, 200)); }
}
if (!targets) throw new Error('chrome DevTools did not come up');
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
let id = 0;
const pend = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id;
  pend.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
});
const js = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(join(here, 'poster.html')).href });
await new Promise((r) => setTimeout(r, 1500));
const layout = await js(`JSON.stringify({h: document.documentElement.scrollHeight, overflow: document.documentElement.scrollHeight > 1024, sections: [...document.querySelector('.page').children].map(c => Math.round(c.getBoundingClientRect().top))})`);
console.log('layout', layout);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
writeFileSync(join(here, 'entry-raw.png'), Buffer.from(shot.data, 'base64'));
ws.close();
chrome.kill();
rmSync(profile, { recursive: true, force: true });

execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(join(here, 'entry-raw.png'))}).convert('RGB')
print('raw size', im.size)
im = im.crop((0, 0, 1024, 1024))
im.save(${JSON.stringify(join(here, 'entry.png'))})
`], { stdio: 'inherit' });
const buf = readFileSync(join(here, 'entry.png'));
console.log(JSON.stringify({ entry: 'entry.png', bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') }));
