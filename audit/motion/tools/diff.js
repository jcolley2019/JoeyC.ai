// Usage: node diff.js <dirA> <dirB> [diffOutDir]
// Prints per-step % differing pixels (pixelmatch threshold 0.1) for 1440 and 390.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const [A, B, OUT] = process.argv.slice(2);
const rows = [];
for (const w of ['1440', '390']) {
  for (let i = 0; i <= 20; i++) {
    const name = `step-${String(i).padStart(2, '0')}.png`;
    const pa = path.join(A, w, name), pb = path.join(B, w, name);
    if (!fs.existsSync(pa) || !fs.existsSync(pb)) { rows.push({ w, i, pct: NaN }); continue; }
    const a = PNG.sync.read(fs.readFileSync(pa)), b = PNG.sync.read(fs.readFileSync(pb));
    if (a.width !== b.width || a.height !== b.height) { rows.push({ w, i, pct: 100, note: 'size mismatch' }); continue; }
    const out = OUT ? new PNG({ width: a.width, height: a.height }) : null;
    const n = pixelmatch(a.data, b.data, out ? out.data : null, a.width, a.height, { threshold: 0.1 });
    const pct = (n / (a.width * a.height)) * 100;
    if (out && n > 0) { fs.mkdirSync(path.join(OUT, w), { recursive: true }); fs.writeFileSync(path.join(OUT, w, name), PNG.sync.write(out)); }
    rows.push({ w, i, n, pct });
  }
}
const fmt = r => `${r.w}\tstep-${String(r.i).padStart(2, '0')}\t${isNaN(r.pct) ? 'missing' : r.pct.toFixed(3) + '%'}${r.note ? ' ' + r.note : ''}`;
console.log('width\tstep\tdiff');
rows.forEach(r => console.log(fmt(r)));
const failing = rows.filter(r => r.pct > 0.5);
console.log(`\nsteps > 0.5%: ${failing.length}`);
console.log('worst 5:'); rows.slice().sort((x, y) => y.pct - x.pct).slice(0, 5).forEach(r => console.log('  ' + fmt(r)));
