// 1.0.0 batch, 14 Sep 2026: phone-call/-incoming/-outgoing/-missed/-forwarded, arrow-big-*, heading and heading-1..6.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as G from './geo.mjs';
const REPO = resolve(import.meta.dirname, '../..');
const { sharpEndIn } = await import(REPO + '/tools/v5/icons.mjs');
const { strokedBBox } = await import(REPO + '/pipeline/lib/geom.mjs');
const OUT = process.env.OUT || join(import.meta.dirname, 'out');
const git = (p) => execFileSync('git', ['-C', REPO, 'show', `origin/main:raw/${p}`], { encoding: 'utf8' });
const layersOf = (name, style, corners) => [...git(`${name}/Container=regular, Style=${style}, Corners=${corners}.svg`).matchAll(/<path d="([^"]+)"([^>]*)\/>/g)].map((m) => ({ d: m[1], attrs: m[2] }));
const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const doc = (ps) => [HEAD, ...ps.map((p) => `<path d="${p.d}"${p.attrs}/>`), '</svg>', ''].join('\n');
const STROKE = (sharp) => ` stroke="black" stroke-width="2" stroke-linecap="${sharp ? 'butt' : 'round'}" stroke-linejoin="round"`;
const PLATE = ' fill="black" fill-opacity="0.4"', SOLID = ' fill="black"';
const f4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const pt = (p) => `${f4(p[0])} ${f4(p[1])}`;
const write = (name, variants) => {
  const dir = join(OUT, 'raw', name); mkdirSync(dir, { recursive: true });
  for (const [k, ps] of Object.entries(variants)) {
    const [style, corners] = k.split('.');
    writeFileSync(join(dir, `Container=regular, Style=${style}, Corners=${corners}.svg`), doc(ps));
    const strokes = ps.filter((p) => p.attrs.includes('stroke=')).map((p) => p.d).join('');
    const solids = ps.filter((p) => !p.attrs.includes('stroke=')).map((p) => p.d).join('');
    const b = strokes ? strokedBBox(strokes, 1, corners === 'sharp' ? 'butt' : 'round') : [99, 99, -99, -99];
    if (solids) { const q = strokedBBox(solids, 0, 'butt'); b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]); }
    console.log(name.padEnd(22), k.padEnd(16), b.map((v) => f4(v)).join(','));
  }
};
/** A free end pushed out along its tangent so the butt cap paints where the round one did. */
function sharpRun(d, ends = [true, true]) {
  const subs = G.parse(d);
  // an end that lands on another run is a joint, not a free end, and stays put
  const onOther = (p, self) => subs.some((o) => o !== self && G.distToRun(p, G.refine(o.segs, 0.5)) < 0.01);
  return subs.map((sub) => {
    const { segs, closed } = sub;
    if (closed) return G.emit(segs, true);
    let r = segs;
    ends = [!onOther(G.p0(segs[0]), sub), !onOther(G.p1(segs.at(-1)), sub)];
    if (ends[1]) { const s = r.at(-1), p = G.p1(s), t = G.tan(s, 1), e = sharpEndIn(p, t); if (e > 1e-6) { if (s.t === 'L') r = [...r.slice(0, -1), { t: 'L', p: [s.p[0], G.add(p, G.mul(t, e))] }]; else r = [...r, { t: 'L', p: [p, G.add(p, G.mul(t, e))] }]; } }
    if (ends[0]) { const s = r[0], p = G.p0(s), t = G.mul(G.tan(s, 0), -1), e = sharpEndIn(p, t); if (e > 1e-6) { if (s.t === 'L') r = [{ t: 'L', p: [G.add(p, G.mul(t, e)), s.p[1]] }, ...r.slice(1)]; else r = [{ t: 'L', p: [G.add(p, G.mul(t, e)), p] }, ...r]; } }
    return G.emit(r);
  }).join('');
}

/* ------------------------------------------------------------------ phone-* */
// The handset is the shipped phone, untouched. Every sign sits in the house 6-unit box flush in the empty top-right
// corner (16..22 by 2..8), the smartphone-* signs translated; the call waves are the one mark drawn fresh.
const PHONE = Object.fromEntries(['regular', 'sharp'].flatMap((c) => ['stroke', 'duotone', 'fill'].map((s) => [`${s}.${c}`, layersOf('phone', s, c)])));
const SIGNS = {
  // sharp forms are given explicitly where the shipped family has them, translated by (+3, -14)
  incoming: { regular: 'M16.5 7.5L21 3M16 2V7.5C16 7.7761 16.2239 8 16.5 8H22', sharp: 'M16.1464 7.8536L21.2929 2.7071M16 1L16 8L23 8' },
  outgoing: { regular: 'M21.5 2.5L17 7M22 8V2.5C22 2.2239 21.7761 2 21.5 2H16', sharp: 'M21.8536 2.1464L16.7071 7.2929M22 9L22 2L15 2' },
  forwarded: { regular: 'M16 5H22M19 2L22 5L19 8', sharp: 'M15 5L22 5M18.7071 1.7071L22 5L18.7071 8.2929' },
  missed: { regular: 'M22 2L16 8M16 2L22 8', sharp: 'M22.2929 1.7071L15.7071 8.2929M15.7071 1.7071L22.2929 8.2929' },
};
// call: two waves about (12,12), r=4 and r=8, from -75 to -15 degrees; the gap between them is the house 2
function arcD(c, r, a0, a1) {
  const segs = G.arc(c, r, (a0 * Math.PI) / 180, ((a1 - a0) * Math.PI) / 180);
  return G.emit(segs);
}
const waves = [arcD([12, 12], 8, -75, -15), arcD([12, 12], 4, -75, -15)].join('');
SIGNS.call = { regular: waves, sharp: sharpRun(waves) };
for (const [kind, sign] of Object.entries(SIGNS)) {
  const v = {};
  for (const c of ['regular', 'sharp']) {
    const sharp = c === 'sharp';
    const body = PHONE[`stroke.${c}`][0];
    v[`stroke.${c}`] = [{ d: body.d + sign[c], attrs: STROKE(sharp) }];
    v[`duotone.${c}`] = [PHONE[`duotone.${c}`][0], { d: body.d + sign[c], attrs: STROKE(sharp) }];
    v[`fill.${c}`] = [PHONE[`fill.${c}`][0], { d: sign[c], attrs: STROKE(sharp) }];
  }
  write(`phone-${kind}`, v);
}

/* ---------------------------------------------------------------- arrow-big-* */
// Rebuilt on his note, 14 Sep 2026, after the reference set's construction: a square head (edges at 45 degrees, the
// apex a right angle), a shaft a third of the head's width, and one radius, r=1, on every corner. Solved so the
// painted box is whole: 3..21 across, 2..22 along. With r=1 at both the 45 degree wings and the right-angled apex the
// two paddings differ by exactly 1, which is what fixes them at 3 and 2.
const R1 = 1, SQ2 = Math.SQRT2, COT225 = 1 + SQ2;
const WING_X = 3 - SQ2 * R1 + 1;         // painted left = vx + (cot 22.5 - 1) r - 1 = 3
const BASE = 12, HALF = 12 - WING_X;      // the head is square, so its depth is half its width
const APEX_Y = BASE - HALF;               // painted top = vy + (sqrt2 - 1) r - 1 = 2
// shaft 8..16: at 9..15 the outline sat 56% on the reference set's; at 8 wide it is 36%, and still reads
const SHAFT = [8, 16], FOOT = 21;
function fillet(pts) { // closed polygon of {v, r}; each corner rounded by its own r, tangent points solved per corner
  const n = pts.length;
  const tp = pts.map((q, i) => {
    const prev = pts[(i + n - 1) % n].v, next = pts[(i + 1) % n].v;
    const u1 = G.unit(G.sub(prev, q.v)), u2 = G.unit(G.sub(next, q.v));
    const ang = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    const t = q.r / Math.tan(ang / 2);
    const bis = G.unit(G.add(u1, u2));
    return { a: G.add(q.v, G.mul(u1, t)), b: G.add(q.v, G.mul(u2, t)), c: G.add(q.v, G.mul(bis, q.r / Math.sin(ang / 2))), r: q.r };
  });
  let d = `M${pt(tp[0].b)}`;
  for (let i = 1; i <= n; i++) {
    const q = tp[i % n];
    d += `L${pt(q.a)}`;
    const a0 = Math.atan2(q.a[1] - q.c[1], q.a[0] - q.c[0]), a1 = Math.atan2(q.b[1] - q.c[1], q.b[0] - q.c[0]);
    let sw = a1 - a0; while (sw > Math.PI) sw -= 2 * Math.PI; while (sw < -Math.PI) sw += 2 * Math.PI;
    const arcs = G.arc(q.c, q.r, a0, sw); arcs[0].p[0] = q.a; arcs.at(-1).p[3] = q.b;
    d += arcs.map((s) => `C${pt(s.p[1])} ${pt(s.p[2])} ${pt(s.p[3])}`).join('');
  }
  return d + 'Z';
}
function arrowUp(sharp) {
  if (!sharp) {
    return fillet([
      { v: [12, APEX_Y], r: R1 }, { v: [24 - WING_X, BASE], r: R1 }, { v: [SHAFT[1], BASE], r: R1 }, { v: [SHAFT[1], FOOT], r: R1 },
      { v: [SHAFT[0], FOOT], r: R1 }, { v: [SHAFT[0], BASE], r: R1 }, { v: [WING_X, BASE], r: R1 },
    ]);
  }
  // sharp: true points at 45 degrees, placed so each round join paints on the rounded drawing's box (apex 3, wings 4),
  // which lifts the head's base to 11
  const apex = [12, 3], wingL = [4, 11];
  return `M${pt(apex)}L${pt([24 - wingL[0], wingL[1]])}L${SHAFT[1]} ${wingL[1]}L${SHAFT[1]} ${FOOT}L${SHAFT[0]} ${FOOT}L${SHAFT[0]} ${wingL[1]}L${pt(wingL)}Z`;
}
const rot = (d, turns) => d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (m, x, y) => {
  let p = [+x, +y];
  for (let i = 0; i < turns; i++) p = [24 - p[1], p[0]]; // 90 degrees clockwise about (12,12)
  return pt(p);
});
for (const [dir, turns] of [['up', 0], ['right', 1], ['down', 2], ['left', 3]]) {
  const v = {};
  for (const c of ['regular', 'sharp']) {
    const sharp = c === 'sharp';
    const d = rot(arrowUp(sharp), turns);
    // a concave r=1 corner offsets to radius 0; drop the collapsed arc it leaves rather than ship a knot of cubics
    const plate = G.emit(G.offsetClosed(G.parse(d)[0].segs, true).filter((sg) => G.len(G.sub(G.p1(sg), G.p0(sg))) > 0.01), true);
    v[`stroke.${c}`] = [{ d, attrs: STROKE(sharp) }];
    v[`duotone.${c}`] = [{ d: plate, attrs: PLATE }, { d, attrs: STROKE(sharp) }];
    v[`fill.${c}`] = [{ d: plate, attrs: SOLID }];
  }
  write(`arrow-big-${dir}`, v);
}

/* ------------------------------------------------------------------ heading */
// Letterforms, stroke only like bold and italic. The bare heading is a full-height H; the numbered six set a condensed
// H beside a numeral of the same height, 2 apart.
const H_FULL = 'M6 3V21M18 3V21M6 12H18';
const H_NUM = 'M3 5V19M11 5V19M3 12H11';
// his heading-1 of 14 Sep 2026 sets the numeral box: x 15..21, y 12..19 on the H's baseline
const Dg = await import('./digits.mjs');
// his heading-2..5 of 14 Sep 2026 (refs/), the numerals verbatim: x 16..20 on the same 12..19. His files split the H at
// its crossbar and the 4 at its bar; those are rejoined here into the same ink as single runs.
const HIS = {
  2: 'M16 14C16 12.8954 16.8954 12 18 12C19.1046 12 20 12.8954 20 14C20 14.6037 19.7273 15.1751 19.258 15.5548L16 19H20',
  3: 'M16 12H20L17.8564 15C19.0403 15 20 15.8954 20 17C20 18.1046 19.0403 19 17.8564 19C17.0906 19 16.3829 18.6188 16 18',
  4: 'M16 12V16.5H21M20 12V19',
  5: 'M20 12H16V15H18C19.1046 15 20 15.8954 20 17C20 18.1046 19.1046 19 18 19C17.2855 19 16.3573 18.6188 16 18',
};
const DIGITS = { 1: Dg.ONE, 2: HIS[2], 3: HIS[3], 4: HIS[4], 5: HIS[5], 6: Dg.six() };
const letter = (name, d) => write(name, { 'stroke.regular': [{ d, attrs: STROKE(false) }], 'stroke.sharp': [{ d: sharpRun(d), attrs: STROKE(true) }] });
letter('heading', H_FULL);
for (const [n, dg] of Object.entries(DIGITS)) letter(`heading-${n}`, H_NUM + dg);
