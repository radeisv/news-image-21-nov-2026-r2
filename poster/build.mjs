import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'data', 'stories35.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// word-wrap a string into lines of at most n chars, breaking on spaces
function wrap(text, n) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= n) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
const deckLines = (text, n, max) => wrap(text, n).slice(0, max);

// ---- map geometry: equirectangular, lon -180..180, lat 84..-58 ----
const MAP_W = 470, MAP_H = 164;
const px = (lon) => ((lon + 180) / 360) * MAP_W;
const py = (lat) => ((84 - lat) / (84 + 58)) * MAP_H;
// simplified continent outlines (lon,lat pairs), drawn as land
const LAND = [
  // North America
  [[-168,66],[-158,58],[-140,60],[-130,54],[-124,42],[-120,34],[-114,29],[-105,23],[-97,16],[-90,14],[-83,9],[-79,9],[-85,15],[-87,21],[-90,21],[-91,18],[-97,26],[-93,30],[-84,30],[-81,26],[-76,35],[-70,42],[-65,44],[-60,47],[-55,52],[-60,55],[-65,60],[-68,58],[-78,62],[-85,66],[-95,69],[-110,68],[-125,70],[-140,70],[-158,71],[-168,66]],
  // Greenland
  [[-45,60],[-32,68],[-22,70],[-20,76],[-30,81],[-45,80],[-58,76],[-55,70],[-52,64],[-45,60]],
  // South America
  [[-79,9],[-77,4],[-80,-3],[-81,-6],[-77,-12],[-70,-18],[-70,-23],[-70,-30],[-73,-37],[-73,-44],[-70,-52],[-68,-55],[-65,-55],[-62,-48],[-57,-40],[-48,-28],[-40,-20],[-35,-8],[-35,-5],[-42,-3],[-50,0],[-52,4],[-58,6],[-62,9],[-70,11],[-77,7],[-79,9]],
  // Africa
  [[-17,15],[-17,21],[-15,27],[-9,31],[-5,35],[3,37],[10,37],[11,34],[19,32],[25,32],[30,31],[32,31],[34,28],[35,23],[37,18],[40,15],[43,12],[48,11],[51,12],[46,5],[41,-1],[40,-7],[36,-17],[33,-26],[28,-33],[20,-35],[16,-28],[12,-18],[13,-10],[9,-1],[9,4],[-8,4],[-13,8],[-17,12],[-17,15]],
  // Eurasia
  [[-9,37],[-9,43],[-2,44],[-1,46],[-4,48],[-2,50],[0,51],[3,53],[8,57],[10,59],[5,60],[5,62],[10,64],[18,69],[25,71],[32,70],[40,68],[45,68],[55,69],[65,69],[75,72],[85,74],[95,76],[105,77],[115,74],[125,72],[135,71],[145,72],[155,69],[162,66],[170,66],[178,65],[170,62],[162,60],[158,53],[150,59],[142,55],[140,50],[135,44],[130,42],[127,40],[122,38],[120,32],[118,25],[110,20],[108,15],[105,10],[100,8],[98,12],[95,16],[92,21],[89,22],[86,20],[82,17],[80,13],[77,8],[75,12],[72,20],[68,23],[66,25],[61,25],[58,26],[56,27],[52,28],[50,30],[48,29],[52,26],[55,25],[58,24],[60,25],[57,27],[54,27],[52,25],[50,27],[48,30],[44,29],[42,27],[39,21],[39,18],[43,13],[45,13],[48,14],[52,15],[55,17],[58,20],[60,23],[62,25],[58,26],[56,26],[53,24],[51,24],[49,25],[48,28],[47,30],[44,29],[42,28],[40,26],[38,24],[36,22],[34,27],[33,29],[32,31],[28,31],[26,32],[23,33],[20,32],[18,30],[16,28],[14,25],[12,22],[10,20],[8,18],[6,16],[4,14],[2,12],[0,10],[-2,8],[-5,5],[-8,4],[-10,6],[-12,8],[-14,10],[-16,12],[-17,15],[-17,21],[-15,27],[-10,29],[-9,32],[-9,37]],
  // Australia
  [[113,-22],[114,-30],[115,-34],[118,-35],[124,-33],[129,-32],[132,-32],[135,-35],[138,-35],[140,-38],[145,-38],[150,-37],[153,-32],[153,-27],[150,-22],[146,-19],[142,-15],[142,-11],[140,-17],[136,-15],[135,-12],[132,-11],[130,-13],[126,-14],[122,-17],[118,-20],[113,-22]],
  // UK
  [[-5,50],[-3,53],[-5,56],[-3,58],[-1,57],[0,53],[-1,51],[-3,50],[-5,50]],
  // Japan
  [[130,31],[132,33],[135,34],[138,35],[140,37],[141,40],[143,42],[141,44],[140,41],[138,38],[135,35],[132,33],[130,31]],
  // Borneo
  [[109,1],[111,3],[113,5],[116,6],[118,2],[117,-2],[114,-3],[110,-2],[109,1]],
  // Sumatra
  [[95,5],[98,3],[100,0],[103,-2],[105,-4],[104,-5],[101,-3],[98,1],[95,5]],
  // New Guinea
  [[131,-1],[134,-3],[138,-5],[141,-6],[145,-7],[148,-9],[150,-10],[146,-8],[142,-8],[138,-8],[134,-4],[131,-1]],
  // Madagascar
  [[44,-16],[47,-15],[50,-16],[49,-20],[47,-24],[45,-25],[43,-22],[44,-16]],
  // New Zealand
  [[167,-45],[170,-43],[173,-41],[175,-38],[177,-38],[175,-40],[172,-42],[169,-46],[167,-45]],
  // Iceland
  [[-22,64],[-18,63],[-14,64],[-15,66],[-20,66],[-24,65],[-22,64]],
];
const landPath = LAND.map((poly) => 'M' + poly.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(' L') + ' Z').join(' ');

// pins: slight offsets for stories sharing a place
const pinXY = {};
function pinPos(n, lat, lon) {
  const key = `${lat},${lon}`;
  const k = (pinXY[key] = (pinXY[key] || 0) + 1);
  const off = [[0, 0], [13, -4], [-13, -4], [0, -13], [13, -13]][k - 1] || [0, 0];
  return [px(lon) + off[0], py(lat) + off[1]];
}
const allPinned = [...data.leads, ...data.features.filter((f) => !f.space), ...data.briefs];
const pins = allPinned.map((s) => {
  const [x, y] = pinPos(s.n, s.lat, s.lon);
  return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="#b91c1c" stroke="#fff" stroke-width="1"/><text x="${x.toFixed(1)}" y="${(y + 2.5).toFixed(1)}" text-anchor="middle" font-size="7.5" font-weight="700" fill="#fff" font-family="Georgia,serif">${s.n}</text></g>`;
}).join('');

// ---- inline SVG art ----
function leadArt(kind) {
  if (kind === 'cop31') return `<svg viewBox="0 0 300 132" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    <rect width="300" height="132" fill="#dcefe0"/>
    <circle cx="70" cy="62" r="34" fill="#7fb6d9"/><path d="M45,50 Q60,38 78,48 Q92,58 88,74 Q70,84 52,78 Q38,66 45,50Z" fill="#5da24a"/><path d="M60,44 Q72,40 82,48 Q76,56 64,54 Q56,50 60,44Z" fill="#5da24a"/>
    <rect x="118" y="18" width="14" height="86" rx="7" fill="#f3f4f6" stroke="#9ca3af"/><rect x="121" y="62" width="8" height="39" rx="4" fill="#dc2626"/><circle cx="125" cy="104" r="10" fill="#dc2626"/>
    <text x="125" y="12" font-size="11" font-weight="700" fill="#b91c1c" text-anchor="middle" font-family="Georgia,serif">+1.5°C</text>
    <circle cx="205" cy="62" r="34" fill="#fff" stroke="#374151" stroke-width="3"/><line x1="205" y1="62" x2="205" y2="36" stroke="#111" stroke-width="3"/><line x1="205" y1="62" x2="224" y2="62" stroke="#dc2626" stroke-width="3"/><circle cx="205" cy="62" r="4" fill="#111"/>
    <text x="205" y="116" font-size="10" font-weight="700" fill="#374151" text-anchor="middle" font-family="Georgia,serif">DAY 13</text>
    <rect x="252" y="30" width="40" height="26" rx="3" fill="#fff" stroke="#9ca3af"/><text x="272" y="47" font-size="11" font-weight="700" fill="#111" text-anchor="middle" font-family="Georgia,serif">LIMIT</text>
    <text x="272" y="72" font-size="10" font-weight="700" fill="#b91c1c" text-anchor="middle" font-family="Georgia,serif">AT RISK</text>
  </svg>`;
  if (kind === 'riyadh') return `<svg viewBox="0 0 300 132" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    <rect width="300" height="132" fill="#0b1026"/>
    <circle cx="262" cy="26" r="12" fill="#fbbf24"/><circle cx="262" cy="26" r="20" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.5"/>
    <path d="M0,132 L0,86 L28,86 L28,70 L52,70 L52,92 L78,92 L78,60 L104,60 L104,88 L130,88 L130,74 L158,74 L158,96 L186,96 L186,66 L212,66 L212,90 L240,90 L240,76 L268,76 L268,96 L300,96 L300,132 Z" fill="#1f2937"/>
    <rect x="10" y="96" width="6" height="6" fill="#fbbf24"/><rect x="60" y="76" width="6" height="6" fill="#fbbf24"/><rect x="140" y="84" width="6" height="6" fill="#fbbf24"/><rect x="200" y="76" width="6" height="6" fill="#fbbf24"/>
    <path d="M30,110 Q90,40 150,22" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="5 4"/><path d="M90,110 Q150,50 210,30" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="5 4"/><path d="M170,110 Q220,60 258,34" fill="none" stroke="#fde68a" stroke-width="2"/>
    <path d="M150,22 l-6,10 l12,0 Z" fill="#fbbf24"/><path d="M210,30 l-6,10 l12,0 Z" fill="#fbbf24"/><path d="M258,34 l-6,10 l12,0 Z" fill="#fde68a"/>
    <circle cx="30" cy="110" r="4" fill="#f97316"/><circle cx="90" cy="110" r="4" fill="#f97316"/><circle cx="170" cy="110" r="4" fill="#f97316"/>
  </svg>`;
  return `<svg viewBox="0 0 300 132" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    <rect width="300" height="132" fill="#fde8d8"/>
    <path d="M0,96 L40,58 L80,92 L120,52 L160,90 L200,60 L240,94 L280,66 L300,82 L300,132 L0,132 Z" fill="#b45309" opacity="0.55"/>
    <path d="M0,70 L30,44 L60,66 L95,40 L130,64 L165,42 L200,66 L235,44 L270,64 L300,48" fill="none" stroke="#b91c1c" stroke-width="3.5"/>
    <path d="M20,86 L48,58 L76,84 L104,60 L132,86 L160,62 L188,84 L216,60 L244,82 L272,62" fill="none" stroke="#dc2626" stroke-width="2" opacity="0.7"/>
    <rect x="18" y="96" width="34" height="22" fill="#fff" stroke="#9ca3af"/><path d="M14,96 L35,84 L56,96 Z" fill="#b91c1c"/>
    <rect x="66" y="98" width="30" height="20" fill="#fff" stroke="#9ca3af"/><path d="M63,98 L81,88 L99,98 Z" fill="#b91c1c"/>
    <rect x="238" y="94" width="36" height="24" fill="#fff" stroke="#9ca3af"/><path d="M234,94 L256,82 L278,94 Z" fill="#b91c1c"/>
    <text x="150" y="20" font-size="22" font-weight="700" fill="#b91c1c" text-anchor="middle" font-family="Georgia,serif">6.7</text>
    <text x="150" y="36" font-size="10" font-weight="700" fill="#7f1d1d" text-anchor="middle" font-family="Georgia,serif">00:09 UTC</text>
  </svg>`;
}
function featArt(kind) {
  const wrap = (inner, bg) => `<svg viewBox="0 0 190 52" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"><rect width="190" height="52" fill="${bg}"/>${inner}</svg>`;
  switch (kind) {
    case 'kyiv': return wrap(`<path d="M0,52 L0,30 L30,30 L30,18 L60,18 L60,30 L95,30 L95,14 L130,14 L130,30 L160,30 L160,22 L190,22 L190,52 Z" fill="#1e3a5f"/><path d="M20,30 Q95,8 170,30" fill="none" stroke="#fbbf24" stroke-width="2.5"/><line x1="60" y1="26" x2="60" y2="14" stroke="#fbbf24" stroke-width="2"/><line x1="130" y1="26" x2="130" y2="14" stroke="#fbbf24" stroke-width="2"/><rect x="138" y="34" width="30" height="12" fill="#fbbf24"/><text x="153" y="43" font-size="8" font-weight="700" fill="#111" text-anchor="middle" font-family="Georgia,serif">BRIDGE</text>`, '#fde68a');
    case 'hormuz': return wrap(`<rect y="30" width="190" height="22" fill="#2563eb"/><path d="M20,34 L60,26 L110,34 L150,28 L190,34 L190,52 L0,52 L0,38 Z" fill="#1d4ed8"/><path d="M70,30 L120,30 L130,18 L60,18 Z" fill="#374151"/><rect x="88" y="8" width="14" height="12" fill="#9ca3af"/><circle cx="150" cy="12" r="7" fill="#f97316"/>`, '#bae6fd');
    case 'uranium': return wrap(`<circle cx="95" cy="26" r="7" fill="#dc2626"/><ellipse cx="95" cy="26" rx="34" ry="12" fill="none" stroke="#111" stroke-width="2" transform="rotate(-25 95 26)"/><ellipse cx="95" cy="26" rx="34" ry="12" fill="none" stroke="#111" stroke-width="2" transform="rotate(25 95 26)"/><ellipse cx="95" cy="26" rx="34" ry="12" fill="none" stroke="#111" stroke-width="2"/>`, '#fef3c7');
    case 'aitax': return wrap(`<rect x="70" y="8" width="50" height="36" rx="4" fill="#111"/><rect x="78" y="16" width="34" height="5" fill="#22c55e"/><rect x="78" y="25" width="22" height="5" fill="#22c55e"/><text x="150" y="34" font-size="20" font-weight="700" fill="#b91c1c" font-family="Georgia,serif">%</text><circle cx="40" cy="26" r="10" fill="#fbbf24"/>`, '#dbeafe');
    case 'chinajapan': return wrap(`<rect x="14" y="10" width="70" height="32" fill="#de2910"/><circle cx="49" cy="26" r="9" fill="#ffde00"/><rect x="106" y="10" width="70" height="32" fill="#fff" stroke="#9ca3af"/><circle cx="141" cy="26" r="10" fill="#bc002d"/>`, '#f3f4f6');
    case 'davao': return wrap(`<path d="M20,34 L60,26 L150,26 L176,32 L150,38 L60,38 Z" fill="#fff" stroke="#9ca3af"/><path d="M150,26 L178,14 L182,20 L160,30 Z" fill="#dc2626"/><path d="M60,38 L44,48 L52,48 L70,38 Z" fill="#374151"/><circle cx="170" cy="46" r="4" fill="#f97316"/>`, '#bae6fd');
    case 'canberra': return wrap(`<circle cx="60" cy="26" r="16" fill="#22c55e"/><path d="M48,22 Q60,14 72,22 Q70,34 60,36 Q50,34 48,22Z" fill="#fff"/><rect x="110" y="12" width="60" height="10" rx="5" fill="#fff" stroke="#9ca3af"/><rect x="110" y="28" width="44" height="10" rx="5" fill="#fff" stroke="#9ca3af"/>`, '#dbeafe');
    case 'bitcoin': return wrap(`<path d="M8,14 L40,20 L70,12 L105,30 L140,24 L172,40" fill="none" stroke="#dc2626" stroke-width="2.5"/><circle cx="172" cy="40" r="4" fill="#dc2626"/><text x="20" y="46" font-size="13" font-weight="700" fill="#b91c1c" font-family="Georgia,serif">BTC −3.9%</text><text x="150" y="46" font-size="11" font-weight="700" fill="#111" font-family="Georgia,serif">$58,983</text>`, '#111827');
    case 'f1': return wrap(`<rect y="34" width="190" height="18" fill="#374151"/><path d="M10,40 L40,40 L40,34 L30,34 Z" fill="#fff"/><path d="M30,34 L70,26 L120,26 L150,34 L170,34 L180,40 L40,40 Z" fill="#dc2626"/><circle cx="70" cy="40" r="6" fill="#111" stroke="#fff"/><circle cx="140" cy="40" r="6" fill="#111" stroke="#fff"/><text x="168" y="16" font-size="11" font-weight="700" fill="#111" font-family="Georgia,serif">P1</text>`, '#f3f4f6');
    default: return wrap(`<rect x="20" y="10" width="60" height="32" rx="4" fill="#166534"/><rect x="100" y="10" width="60" height="32" rx="4" fill="#b91c1c"/><circle cx="50" cy="26" r="8" fill="#fff"/><circle cx="130" cy="26" r="8" fill="#fff"/><path d="M20,44 L170,44" stroke="#111" stroke-width="2"/>`, '#dcfce7');
  }
}

// ---- HTML assembly ----
const regionColors = ['#1d4ed8', '#b45309', '#7c3aed', '#15803d', '#0f766e', '#be185d', '#4b5563'];
const regionBar = data.meta.regions.map(([name, n], i) => {
  return `<div style="flex:1;background:${regionColors[i]};color:#fff;font-size:8.5px;font-weight:700;padding:2px 2px;text-align:center;white-space:nowrap;overflow:hidden">${esc(name)} ${n}</div>`;
}).join('');
const stats = data.meta.stats.map(([big, label]) => `<div style="flex:1;padding:2px 6px;border-left:2px solid #b91c1c"><div style="font-family:Georgia,serif;font-size:23px;font-weight:700;color:#b91c1c;line-height:1">${esc(big)}</div><div style="font-size:8.5px;line-height:1.2;color:#374151;margin-top:2px">${esc(label)}</div></div>`).join('');

const leads = data.leads.map((s) => {
  const head = deckLines(s.headline, 26, 2);
  const deck = deckLines(s.deck, 46, 3);
  return `<div style="flex:1;min-width:0">
    <div style="height:120px;border:1px solid #d1d5db;border-bottom:none">${leadArt(s.art)}</div>
    <div style="background:#b91c1c;color:#fff;font-family:Georgia,serif;font-weight:700;font-size:15px;padding:3px 6px">${esc(s.banner)}</div>
    <div style="display:flex;justify-content:space-between;background:#111827;color:#fff;font-size:9px;font-weight:700;padding:2px 6px"><span>${esc(s.banner2)}</span><span>${esc(s.src_note.split('·')[0].trim())}</span></div>
    <div style="margin-top:5px;font-size:9px;font-weight:700;color:#b91c1c;letter-spacing:.4px"><span style="background:#b91c1c;color:#fff;border-radius:50%;display:inline-block;width:13px;height:13px;line-height:13px;text-align:center;font-size:9px">${s.n}</span> ${esc(s.place)} · ${esc(s.topic)}</div>
    <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;line-height:1.08;margin-top:2px">${head.map(esc).join('<br>')}</div>
    <div style="font-size:10.5px;line-height:1.3;color:#1f2937;margin-top:3px">${deck.map(esc).join('<br>')}</div>
    <div style="font-size:8px;color:#6b7280;margin-top:2px">(${esc(s.source)})</div>
  </div>`;
}).join('<div style="width:8px"></div>');

function featCol(s) {
  const head = deckLines(s.headline, 24, 2);
  const deck = deckLines(s.deck, 34, 2);
  return `<div style="flex:1;min-width:0">
    <div style="height:46px;border:1px solid #d1d5db;border-bottom:none">${featArt(s.art)}</div>
    <div style="background:#b91c1c;color:#fff;font-family:Georgia,serif;font-weight:700;font-size:10.5px;padding:2px 5px;white-space:nowrap;overflow:hidden">${esc(s.banner)}</div>
    <div style="margin-top:3px;font-size:8px;font-weight:700;color:#b91c1c"><span style="background:#b91c1c;color:#fff;border-radius:50%;display:inline-block;width:11px;height:11px;line-height:11px;text-align:center;font-size:8px">${s.n}</span> ${esc(s.place)} · ${esc(s.topic)}</div>
    <div style="font-family:Georgia,serif;font-size:12px;font-weight:700;line-height:1.1;margin-top:1px">${head.map(esc).join('<br>')}</div>
    <div style="font-size:9px;line-height:1.22;color:#1f2937;margin-top:2px">${deck.map(esc).join('<br>')}</div>
    <div style="font-size:7.5px;color:#6b7280;margin-top:1px">${esc(s.src_note)}</div>
  </div>`;
}
const featRow = (list) => `<div style="display:flex;gap:6px">${list.map(featCol).join('')}</div>`;

const briefCols = [data.briefs.slice(0, 11), data.briefs.slice(11)];
const briefCol = (list) => `<div style="flex:1;min-width:0">${list.map((b) => `<div style="font-size:8.5px;line-height:1.24;padding:1px 0"><span style="color:#b91c1c;font-weight:700">${b.n}</span> <b>${esc(b.place)}</b> ${esc(b.text)} <span style="color:#6b7280">(${esc(b.source)})</span></div>`).join('')}</div>`;

const mapSvg = `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" width="100%" height="164">
  <rect width="${MAP_W}" height="${MAP_H}" fill="#dbeafe"/>
  ${[0.25, 0.5, 0.75].map((f) => `<line x1="${(MAP_W * f).toFixed(0)}" y1="0" x2="${(MAP_W * f).toFixed(0)}" y2="${MAP_H}" stroke="#fff" stroke-width="1"/>`).join('')}
  ${[0.25, 0.5, 0.75].map((f) => `<line x1="0" y1="${(MAP_H * f).toFixed(0)}" x2="${MAP_W}" y2="${(MAP_H * f).toFixed(0)}" stroke="#fff" stroke-width="1"/>`).join('')}
  <path d="${landPath}" fill="#e8d9ae" stroke="#c9b489" stroke-width="0.8"/>
  ${pins}
</svg>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1024px;background:#f7f3e8;font-family:Georgia,serif;color:#111}
.page{width:1024px;padding:10px 14px 8px;display:flex;flex-direction:column}
</style></head><body><div class="page">
<div style="display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:2px">
  <div style="color:#b91c1c;font-size:11px;font-weight:700;letter-spacing:1.5px;font-family:Arial,sans-serif">${esc(data.meta.kicker)}</div>
  <div style="font-size:9px;font-weight:700;letter-spacing:.6px;font-family:Arial,sans-serif">${esc(data.meta.corner)}</div>
</div>
<div style="font-family:Georgia,serif;font-size:56px;font-weight:700;line-height:1.02;text-align:center;margin-top:3px">${esc(data.meta.title)}</div>
<div style="font-style:italic;font-size:13.5px;text-align:center;color:#374151;margin-top:1px">${esc(data.meta.strap)}</div>
<div style="display:flex;border-top:2px solid #111;border-bottom:2px solid #111;margin-top:6px;padding:4px 0">${stats}</div>
<div style="display:flex;margin-top:4px">${regionBar}</div>
<div style="display:flex;margin-top:7px">${leads}</div>
<div style="margin-top:8px">${featRow(data.features.slice(0, 5))}</div>
<div style="margin-top:7px">${featRow(data.features.slice(5))}</div>
<div style="display:flex;gap:10px;margin-top:8px;border-top:2px solid #111;padding-top:5px">
  <div style="width:470px;flex:none">
    <div style="font-size:10px;font-weight:700;letter-spacing:1px;font-family:Arial,sans-serif;margin-bottom:3px">WHERE IT HAPPENED</div>
    <div style="border:1px solid #9ca3af">${mapSvg}</div>
    <div style="font-size:8px;color:#6b7280;margin-top:2px">Each number is the story with that number on this page.</div>
  </div>
  <div style="flex:1;min-width:0">
    <div style="font-size:10px;font-weight:700;letter-spacing:1px;font-family:Arial,sans-serif;border-bottom:1px solid #111;padding-bottom:2px">ALSO ON SATURDAY 21 NOVEMBER — 22 MORE STORIES</div>
    <div style="display:flex;gap:8px;margin-top:3px">${briefCol(briefCols[0])}${briefCol(briefCols[1])}</div>
  </div>
</div>
<div style="border:1.5px solid #b91c1c;padding:4px 8px;margin-top:6px;font-size:9px;line-height:1.3">
  <span style="color:#b91c1c;font-weight:700">DATE CHECK</span> ${esc(data.meta.datecheck)}
</div>
<div style="display:flex;justify-content:space-between;font-size:8px;color:#6b7280;margin-top:5px;font-family:Arial,sans-serif">
  <span>${esc(data.meta.footer)}</span><span>${esc(data.meta.footer2)}</span>
</div>
</div></body></html>`;

writeFileSync(join(here, 'poster.html'), html);
console.log(JSON.stringify({ wrote: 'poster.html', bytes: html.length }));
