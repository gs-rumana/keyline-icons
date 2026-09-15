/**
 * Emit the 1.0.0 singles into raw/ (or --out=DIR/raw).
 *   node tools/singles-1-0-0/build.mjs [--out=DIR] [name ...]
 *
 * Ten names, 15 Sep 2026, on Zafar's picks from a stroke sheet: `timer`,
 * `timer-reset`, `alarm-clock` with `-check`, `-plus` and `-minus`,
 * `snowflake`, `table`, `folder-zip` and, from a second round, `wind`. Every one is assembled from a drawing
 * the set already ships, which is how nothing here can have come from
 * anyone else's file:
 *
 *   timer         a face of r=8 on (12,14) under a T crown, a pusher at the
 *                 upper right and one hand standing up. The face is the only
 *                 place a crown fits on the canvas, so it lands where every
 *                 stopwatch's does; the crown, pusher and hand are ours.
 *   timer-reset   the timer with `rotate-ccw`'s gap and head READ from its
 *                 files and turned a quarter anticlockwise, so the head sits
 *                 at the lower left clear of the crown. Its legs lose 0.32 of
 *                 their length so the lower one's cap stops on the face's ink
 *                 edge, x=3. Open, so stroke only, as `rotate-ccw` is.
 *   alarm-clock   a face of r=7 on (12,13), two bells on r=11 about the same
 *                 centre (the house 2 off the face), and legs. The bells run
 *                 43.34..65.38 degrees off each horizontal, their caps on x=3
 *                 and y=2. They first ran from 24.62, caps on x=1, and he
 *                 called them too wide, "cut them by 2x": 22 degrees against
 *                 41, the nearest whole-number stop to half. His note on the first
 *                 cut was that the legs were too long: they stood 4.55 off a
 *                 face on (12,12). The face drops to (12,13) and the legs run
 *                 radially at 60 degrees to y=21, 2.24 long.
 *   -check/plus/minus  the sign INSIDE the face instead of the hands, on his
 *                 call, not a corner modifier. The face is `search`'s glass
 *                 exactly, r=7 with its inner ink on 6, so the signs are
 *                 `search-*`'s READ from their files and moved (+2, +3), in
 *                 every style and treatment, fills and knockouts included.
 *   snowflake     `thermometer-snowflake`'s forked arm six times, one arm
 *                 across as the thermometer's is. Arm and fork are solved so
 *                 the flake paints 1..23 both ways: L=7.3205, forks 3.7893.
 *                 Open, so stroke only.
 *   table         `grid-2x3` with its top two cells merged into a header: the
 *                 column rule starts under the header rule. Without that it is
 *                 `grid-2x3`, which is everyone's table.
 *   folder-zip    `folder` with `file-zip`'s zipper on x=9, where the ring
 *                 clears the wall by 2 and the first tooth hangs off the tab's
 *                 straight run. The folder is shorter than a file, so the teeth
 *                 are 2 long rather than 4, on the same 2 gap.
 *
 * Sharp: corners squared where the rounded drawing fillets them, free ends
 * pushed out by `sharpEndIn` (arcs by up to a unit, as `rotate-ccw`'s), each
 * clamped to the rounded drawing's ink box, so both treatments paint one box.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';
import { sharpEnd } from '../v5/icons.mjs';

const ROOT = resolve(import.meta.dirname, '../..');

/* ------------------------------------------------------------- path data */

const fmt = (v) => {
  if (!Number.isFinite(v)) throw new Error(`non-finite ${v}`);
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
};
const P = (p) => `${fmt(p[0])} ${fmt(p[1])}`;
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, Z: 0 };
function parse(d) {
  const out = [];
  for (const m of d.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g)) {
    const nums = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    if (nums.length % (ARITY[m[1]] || 1) !== 0) throw new Error(`bad ${m[1]} in ${d}`);
    out.push([m[1], nums]);
  }
  return out;
}
const emit = (cmds) => cmds.map(([c, n]) => c + n.map(fmt).join(' ')).join('');
const subpaths = (d) => d.split(/(?=M)/).filter(Boolean);
/** Translate per command, so H and V move by their own axis only. */
const move = (d, dx, dy) => emit(parse(d).map(([c, n]) => [c,
  c === 'H' ? n.map((v) => v + dx) : c === 'V' ? n.map((v) => v + dy) : c === 'Z' ? n : n.map((v, i) => v + (i % 2 ? dy : dx))]));

function areaOf(sp) {
  const pts = [];
  let cur = [0, 0];
  for (const [c, n] of parse(sp)) {
    if (c === 'M' || c === 'L') cur = [n[0], n[1]];
    else if (c === 'H') cur = [n[0], cur[1]];
    else if (c === 'V') cur = [cur[0], n[0]];
    else if (c === 'C') {
      const p0 = cur;
      for (let i = 1; i <= 8; i++) {
        const t = i / 8, u = 1 - t;
        pts.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * n[k] + 3 * u * t * t * n[k + 2] + t * t * t * n[k + 4]));
      }
      cur = [n[4], n[5]];
      continue;
    }
    if (c !== 'Z') pts.push(cur);
  }
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}
/** Reverse a closed subpath made of M, L and C. */
function reverse(sp) {
  const cmds = parse(sp);
  const segs = [];
  let cur = null, start = null;
  for (const [c, n] of cmds) {
    if (c === 'M') { cur = [n[0], n[1]]; start = cur; }
    else if (c === 'L') { segs.push({ from: cur, to: [n[0], n[1]] }); cur = [n[0], n[1]]; }
    else if (c === 'C') { segs.push({ from: cur, c1: [n[0], n[1]], c2: [n[2], n[3]], to: [n[4], n[5]] }); cur = [n[4], n[5]]; }
    else if (c === 'Z') { if (Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 1e-6) segs.push({ from: cur, to: start }); cur = start; }
    else throw new Error(`reverse cannot take ${c}`);
  }
  let d = `M${P(start)}`;
  for (const s of segs.reverse()) d += s.c1 ? `C${P(s.c2)} ${P(s.c1)} ${P(s.from)}` : `L${P(s.from)}`;
  return d + 'Z';
}
/** `hole` wound against `outline`, so it cuts under nonzero as well as evenodd. */
const against = (outline, hole) => (Math.sign(areaOf(hole)) === Math.sign(areaOf(outline)) ? reverse(hole) : hole);
/** `part` wound WITH `outline`, for a solid island inside a hole. */
const withIt = (outline, part) => (Math.sign(areaOf(part)) === Math.sign(areaOf(outline)) ? part : reverse(part));

/* --------------------------------------------------------------- circles */

const rad = (a) => (a * Math.PI) / 180;
const on = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
/** A circular arc as cubics, split on the cardinal angles. */
function arc(c, r, a0, a1, { move: mv = true } = {}) {
  const cuts = [a0];
  const dir = Math.sign(a1 - a0);
  for (let k = Math.ceil(Math.min(a0, a1) / 90) * 90; k <= Math.max(a0, a1); k += 90)
    if (Math.abs(k - a0) > 1e-6 && Math.abs(k - a1) > 1e-6) cuts.push(k);
  if (dir < 0) cuts.sort((x, y) => y - x); else cuts.sort((x, y) => x - y);
  cuts.push(a1);
  let d = mv ? `M${P(on(c, r, a0))}` : '';
  for (let i = 0; i + 1 < cuts.length; i++) {
    const b0 = cuts[i], b1 = cuts[i + 1];
    const k = (4 / 3) * Math.tan(rad(b1 - b0) / 4) * r;
    const p0 = on(c, r, b0), p1 = on(c, r, b1);
    const t0 = [-Math.sin(rad(b0)), Math.cos(rad(b0))], t1 = [-Math.sin(rad(b1)), Math.cos(rad(b1))];
    d += `C${P([p0[0] + t0[0] * k, p0[1] + t0[1] * k])} ${P([p1[0] - t1[0] * k, p1[1] - t1[1] * k])} ${P(p1)}`;
  }
  return d;
}
const circle = (c, r) => arc(c, r, -90, 270) + 'Z';
const line = (...pts) => `M${P(pts[0])}` + pts.slice(1).map((p) => `L${P(p)}`).join('');
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const unit = (a) => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; };

/**
 * How far a free end goes in sharp: `sharpEnd` for a line, a unit for an arc,
 * then no further than keeps the butt cap's corners inside `box`.
 */
function endIn(p, dir, box, most) {
  const nrm = [-dir[1], dir[0]];
  const fits = (k) => {
    const e = add(p, mul(dir, k));
    return [1, -1].every((s) => {
      const q = add(e, mul(nrm, s));
      return q[0] >= box[0] - 1e-9 && q[1] >= box[1] - 1e-9 && q[0] <= box[2] + 1e-9 && q[1] <= box[3] + 1e-9;
    });
  };
  if (fits(most)) return most;
  let lo = 0, hi = most;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
  return lo;
}
const pushLine = (p, from, box) => { const dir = unit([p[0] - from[0], p[1] - from[1]]); return add(p, mul(dir, endIn(p, dir, box, sharpEnd(dir)))); };

/* ------------------------------------------------------------- the files */

const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const file = (style, corners) => `Container=regular, Style=${style}, Corners=${corners}.svg`;
const cap = (corners) => (corners === 'sharp' ? 'butt' : 'round');
const stroke = (d, corners) => `<path d="${d}" stroke="black" stroke-width="2" stroke-linecap="${cap(corners)}" stroke-linejoin="round"/>`;
const plate = (d) => `<path d="${d}" fill="black" fill-opacity="0.4"/>`;
const solid = (d) => `<path fill-rule="evenodd" clip-rule="evenodd" d="${d}" fill="black"/>`;
const readRaw = (name, style, corners) => readFileSync(join(ROOT, 'raw', name, file(style, corners)), 'utf8');
const pathsOf = (svg) => [...svg.matchAll(/<path ([^>]*)\/>/g)].map((m) => ({ d: /\bd="([^"]+)"/.exec(m[1])[1], stroked: /stroke="black"/.test(m[1]), attrs: m[1] }));

const SETS = {};

/* ----------------------------------------------------------------- timer */

const TF = [12, 14], TR = 8, TIMER_BOX = [3, 1, 21, 23];
const PUSH = [on(TF, TR, -45), [19, 7]];
function timerParts(corners) {
  const sharp = corners === 'sharp';
  const bar = sharp ? line([8, 2], [16, 2]) : line([9, 2], [15, 2]);
  const stem = line([12, 2], [12, 6]);
  const hand = sharp ? line([12, 15], [12, 9]) : line([12, 14], [12, 10]);
  const pusher = sharp ? line(PUSH[0], pushLine(PUSH[1], PUSH[0], TIMER_BOX)) : line(...PUSH);
  return { bar, stem, hand, pusher };
}
const DISC9 = (c) => circle(c, 9);
SETS.timer = (style, corners) => {
  const t = timerParts(corners);
  const face = circle(TF, TR);
  if (style === 'stroke') return [stroke(face + t.bar + t.stem + t.hand + t.pusher, corners)];
  if (style === 'duotone') return [plate(DISC9(TF)), stroke(face + t.bar + t.stem + t.hand + t.pusher, corners)];
  const slot = corners === 'sharp'
    ? 'M11 9L13 9L13 15L11 15Z'
    : 'M11 10C11 9.4477 11.4477 9 12 9C12.5523 9 13 9.4477 13 10L13 14C13 14.5523 12.5523 15 12 15C11.4477 15 11 14.5523 11 14Z';
  return [solid(DISC9(TF) + against(DISC9(TF), slot)), stroke(t.bar + t.stem + t.pusher, corners)];
};
SETS.timer.box = TIMER_BOX;

/* ----------------------------------------------------------- timer-reset */

/**
 * `rotate-ccw`, read: its arc on r=9 about (12,12) from 192.42 degrees down to
 * -136.76, the head at that end. Turned a quarter anticlockwise and moved onto
 * the timer's r=8 face, the gap lands at 102.45..133.24, the lower left.
 */
const RC = { c: [12, 12], start: [3.2117, 10.0593], end: [5.4432, 5.8349], vertex: [4.7999, 6.5999] };
const RC_A0 = (Math.atan2(RC.start[1] - 12, RC.start[0] - 12) * 180) / Math.PI + 360;
const RC_A1 = (Math.atan2(RC.end[1] - 12, RC.end[0] - 12) * 180) / Math.PI;
const TURN = -90;
const RS = RC_A0 + TURN, RE = RC_A1 + TURN;
const REND = on(TF, TR, RE);
const turn = (p) => { const dx = p[0] - RC.end[0], dy = p[1] - RC.end[1]; return [REND[0] + dy, REND[1] - dx]; };
function resetHead(corners) {
  const V = turn(RC.vertex);
  // rounded rotate-ccw: leg ends 3.6364 off the vertex, the fillet at 0.5
  const legDirs = [[4.2857, 3], [8.4, 6.0857]].map((q) => unit([turn(q)[0] - V[0], turn(q)[1] - V[1]]));
  // the longest legs whose round caps stay in the timer's box
  let len = 3.6364;
  const inBox = (L) => legDirs.every((u) => { const e = add(V, mul(u, L)); return e[0] - 1 >= TIMER_BOX[0] - 1e-9 && e[1] + 1 <= TIMER_BOX[3] + 1e-9; });
  if (!inBox(len)) { let lo = 0, hi = len; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (inBox(m)) lo = m; else hi = m; } len = Math.floor(lo * 1e4) / 1e4; }
  const ends = legDirs.map((u) => add(V, mul(u, len)));
  if (corners === 'sharp') {
    const far = legDirs.map((u, i) => add(ends[i], mul(u, endIn(ends[i], u, TIMER_BOX, sharpEnd(u)))));
    return { head: line(far[0], V, far[1]), arcEnd: turn([4.9867, 6.3204]), len };
  }
  const f = [[4.7293, 6.105], [4.7683, 6.3784], [5.0216, 6.5683], [5.295, 6.5293]].map(turn);
  return { head: `M${P(ends[0])}L${P(f[0])}C${P(f[1])} ${P(f[2])} ${P(f[3])}L${P(ends[1])}`, len };
}
SETS['timer-reset'] = (style, corners) => {
  if (style !== 'stroke') return null;
  const t = timerParts(corners);
  const h = resetHead(corners);
  let body = arc(TF, TR, RS, RE);
  if (corners === 'sharp') {
    const s = on(TF, TR, RS), dir = [-Math.sin(rad(RS)), Math.cos(rad(RS))];
    const e0 = add(s, mul(dir, endIn(s, dir, TIMER_BOX, 1)));
    body = `M${P(e0)}L${P(s)}` + arc(TF, TR, RS, RE, { move: false }) + `L${P(h.arcEnd)}`;
  }
  return [stroke(body + h.head + t.bar + t.stem + t.hand + t.pusher, corners)];
};
SETS['timer-reset'].box = TIMER_BOX;

/* ----------------------------------------------------------- alarm-clock */

const AF = [12, 13], AR = 7, BELL = 11, ALARM_BOX = [3, 2, 21, 22];
const AS = (Math.acos((AF[0] - 4) / BELL) * 180) / Math.PI;    // the cap on x=3
const AE = (Math.asin((AF[1] - 3) / BELL) * 180) / Math.PI;    // the cap on y=2
const LEG = 60;
function alarmParts(corners) {
  const sharp = corners === 'sharp';
  const bells = [[180 + AS, 180 + AE], [360 - AS, 360 - AE]].map(([a0, a1]) => {
    if (!sharp) return arc(AF, BELL, a0, a1);
    const s = on(AF, BELL, a0), e = on(AF, BELL, a1);
    const sgn = Math.sign(a1 - a0);
    const back = mul([-Math.sin(rad(a0)), Math.cos(rad(a0))], -sgn), fwd = mul([-Math.sin(rad(a1)), Math.cos(rad(a1))], sgn);
    const s0 = add(s, mul(back, endIn(s, back, ALARM_BOX, 1))), e1 = add(e, mul(fwd, endIn(e, fwd, ALARM_BOX, 1)));
    return `M${P(s0)}L${P(s)}` + arc(AF, BELL, a0, a1, { move: false }) + `L${P(e1)}`;
  });
  const legs = [180 - LEG, LEG].map((a) => {
    const p = on(AF, AR, a), foot = on(AF, (21 - AF[1]) / Math.sin(rad(a)), a);
    return line(p, sharp ? pushLine(foot, p, ALARM_BOX) : foot);
  });
  return bells.join('') + legs.join('');
}
/** `search`'s layers for `sign`, moved from its glass on (10,10) onto the face on (12,13). */
function searchSign(sign, style, corners) {
  const paths = pathsOf(readRaw(`search-${sign}`, style, corners));
  const isLens = (sp) => /^M17 10C/.test(sp) || /^M18 10C/.test(sp);
  const isHandle = (sp) => /^M15 15L21 21$/.test(sp) || /^M14\.2929 14\.2929L21\.2929 21\.2929$/.test(sp);
  if (style === 'fill') {
    const body = paths.find((p) => !p.stroked);
    const [lens, ...holes] = subpaths(body.d);
    if (!isLens(lens) || !holes.length) throw new Error(`search-${sign} fill ${corners}: no lens or no knockout`);
    return { disc: move(lens, 2, 3), holes: holes.map((h) => move(h, 2, 3)) };
  }
  const s = paths.find((p) => p.stroked);
  const signs = subpaths(s.d).filter((sp) => !isLens(sp) && !isHandle(sp));
  if (!signs.length) throw new Error(`search-${sign} ${style} ${corners}: no sign`);
  return { strokes: signs.map((sp) => move(sp, 2, 3)).join('') };
}
const ALARM_DISC = (corners) => searchSign('plus', 'fill', corners).disc;
function alarm(sign) {
  const build = (style, corners) => {
    const face = circle(AF, AR), rest = alarmParts(corners);
    const glyph = sign
      ? searchSign(sign, 'stroke', corners).strokes
      : corners === 'sharp' ? line([12, 9], [12, 13], [16, 13]) : line([12, 10], [12, 13], [15, 13]);
    if (style === 'stroke') return [stroke(face + glyph + rest, corners)];
    if (style === 'duotone') return [plate(ALARM_DISC(corners)), stroke(face + glyph + rest, corners)];
    const disc = ALARM_DISC(corners);
    const holes = sign
      ? searchSign(sign, 'fill', corners).holes
      : [corners === 'sharp'
        ? 'M11 9L13 9L13 12L16 12L16 14L12 14C11.4477 14 11 13.5523 11 13Z'
        : 'M11 10C11 9.4477 11.4477 9 12 9C12.5523 9 13 9.4477 13 10L13 12L15 12C15.5523 12 16 12.4477 16 13C16 13.5523 15.5523 14 15 14L12 14C11.4477 14 11 13.5523 11 13Z'];
    return [solid(disc + holes.map((h) => against(disc, h)).join('')), stroke(rest, corners)];
  };
  build.box = ALARM_BOX;
  return build;
}
SETS['alarm-clock'] = alarm(null);
SETS['alarm-clock-check'] = alarm('check');
SETS['alarm-clock-plus'] = alarm('plus');
SETS['alarm-clock-minus'] = alarm('minus');

/* ------------------------------------------------------------- snowflake */

/** Arm and fork solved for 1..23 both ways: L + l cos45 = 10 and L sin60 + l sin105 = 10. */
const FORK = (10 - 10 * Math.sin(rad(60))) / (Math.sin(rad(105)) - Math.cos(rad(45)) * Math.sin(rad(60)));
const ARM = 10 - FORK * Math.cos(rad(45));
SETS.snowflake = (style, corners) => {
  if (style !== 'stroke') return null;
  const C = [12, 12], box = [1, 1, 23, 23];
  let d = '';
  for (let k = 0; k < 3; k++) {
    const a = 60 * k, p = on(C, ARM, a), q = on(C, ARM, a + 180);
    d += line(q, p);
    for (const [apex, dir] of [[p, a], [q, a + 180]]) {
      const legs = [dir + 45, dir - 45].map((b) => {
        const e = on(apex, FORK, b);
        return corners === 'sharp' ? pushLine(e, apex, box) : e;
      });
      d += line(legs[0], apex, legs[1]);
    }
  }
  return [stroke(d, corners)];
};
SETS.snowflake.box = [1, 1, 23, 23];

/* ------------------------------------------------------------------ wind */

/**
 * Three gusts, each a line ending in a circular curl of r=2 that turns 225
 * degrees and stops on the 45, pointing back at its own line. Drawn after both
 * references on 15 Sep 2026, on his word "redraw each one": the lines start
 * staggered (3, 6, 3) where both sets start them flush, and the top two curl up
 * while the bottom one curls down. The top curl sits on x=12, a unit left of
 * the sheet he approved, because on 13 its turn came 1.82 from the middle
 * gust's tail. Paints 2..22 both ways. Open, so stroke only.
 */
const GUSTS = [
  { from: [3, 7], c: [12, 5], a0: 90, a1: -135 },
  { from: [6, 12], c: [19, 10], a0: 90, a1: -135 },
  { from: [3, 17], c: [15, 19], a0: -90, a1: 135 },
];
SETS.wind = (style, corners) => {
  if (style !== 'stroke') return null;
  const box = [2, 2, 22, 22];
  let d = '';
  for (const g of GUSTS) {
    const start = on(g.c, 2, g.a0), end = on(g.c, 2, g.a1);
    if (corners !== 'sharp') { d += `M${P(g.from)}L${P(start)}` + arc(g.c, 2, g.a0, g.a1, { move: false }); continue; }
    const tail = pushLine(g.from, start, box);
    const sgn = Math.sign(g.a1 - g.a0), fwd = mul([-Math.sin(rad(g.a1)), Math.cos(rad(g.a1))], sgn);
    d += `M${P(tail)}L${P(start)}` + arc(g.c, 2, g.a0, g.a1, { move: false }) + `L${P(add(end, mul(fwd, endIn(end, fwd, box, 1))))}`;
  }
  return [stroke(d, corners)];
};
SETS.wind.box = [2, 2, 22, 22];

/* ----------------------------------------------------------------- table */

SETS.table = (style, corners) => {
  const sharp = corners === 'sharp';
  const grid = pathsOf(readRaw('grid-2x3', 'stroke', corners))[0].d;
  const [body, ...rules] = subpaths(grid);
  const want = sharp ? ['M12 3L12 21', 'M3 9L21 9', 'M3 15L21 15'] : ['M12 3V21', 'M3 9H21', 'M3 15H21'];
  if (rules.join('|') !== want.join('|')) throw new Error(`grid-2x3 ${corners} rules moved: ${rules}`);
  const cut = body + (sharp ? 'M3 9L21 9M3 15L21 15M12 9L12 21' : 'M3 9H21M3 15H21M12 9V21');
  if (style === 'stroke') return [stroke(cut, corners)];
  if (style === 'duotone') return [plate(pathsOf(readRaw('grid-2x3', 'duotone', corners))[0].d), stroke(cut, corners)];
  const cells = subpaths(pathsOf(readRaw('grid-2x3', 'fill', corners))[0].d);
  if (cells.length !== 6) throw new Error(`grid-2x3 fill ${corners}: ${cells.length} cells`);
  const header = sharp
    ? 'M3 2L21 2C21.5523 2 22 2.4477 22 3L22 8L2 8L2 3C2 2.4477 2.4477 2 3 2Z'
    : 'M6 2H18C20.20914 2 22 3.79086 22 6V8H2V6C2 3.79086 3.79086 2 6 2Z';
  return [`<path d="${header}${cells.slice(2).join('')}" fill="black"/>`];
};
SETS.table.box = [2, 2, 22, 22];

/* ------------------------------------------------------------ folder-zip */

/**
 * `file-zip`'s zipper, on x=9. The folder's tab runs straight on y=4 to 8.67
 * and fillets on r=2 about (8.6716, 6) into its 45 degree run, so the first
 * tooth hangs off the fillet at y=4.0271 in the rounded drawing and off the
 * straight run in sharp. In fill the tooth is knocked out BELOW the band, whose
 * inner edge is that fillet on r=1 and the diagonal a unit in.
 */
SETS['folder-zip'] = (style, corners) => {
  const sharp = corners === 'sharp';
  const folder = pathsOf(readRaw('folder', 'stroke', corners))[0].d;
  const ring = circle([9, 14], 2);
  const zip = (sharp ? 'M9 4L9 7M9 9L9 12' : 'M9 4.0271L9 6M9 10L9 12') + ring;
  if (style === 'stroke') return [stroke(folder + zip, corners)];
  const pl = pathsOf(readRaw('folder', style === 'duotone' ? 'duotone' : 'fill', corners))[0].d;
  if (style === 'duotone') return [plate(pl), stroke(folder + zip, corners)];
  const tooth = sharp
    ? 'M8 5L9.0858 5L10 5.9142L10 7L8 7Z'
    : `M8 5L8.6716 5${arc([8.6716, 6], 1, -90, -45, { move: false })}L10 5.9142L10 6C10 6.5523 9.5523 7 9 7C8.4477 7 8 6.5523 8 6Z`;
  const pull = sharp
    ? 'M8 11.1716C6.8014 11.5954 6 12.7287 6 14C6 15.6569 7.3431 17 9 17C10.6569 17 12 15.6569 12 14C12 12.7287 11.1986 11.5954 10 11.1716L10 9L8 9Z'
    : 'M8 11.1716C6.8014 11.5954 6 12.7287 6 14C6 15.6569 7.3431 17 9 17C10.6569 17 12 15.6569 12 14C12 12.7287 11.1986 11.5954 10 11.1716L10 10C10 9.4477 9.5523 9 9 9C8.4477 9 8 9.4477 8 10Z';
  const eye = 'M10 14C10 13.4477 9.5523 13 9 13C8.4477 13 8 13.4477 8 14C8 14.5523 8.4477 15 9 15C9.5523 15 10 14.5523 10 14Z';
  return [solid(pl + against(pl, tooth) + against(pl, pull) + withIt(pl, eye))];
};
SETS['folder-zip'].box = [2, 3, 22, 21];

/* ------------------------------------------------------------- the write */

function inkOf(svg, corners) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of pathsOf(svg)) {
    const q = p.stroked ? strokedBBox(p.d, 1, cap(corners)) : strokedBBox(p.d, 0, 'butt');
    b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
  }
  return b;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outArg = args.find((a) => a.startsWith('--out='));
  const OUT = outArg ? resolve(outArg.slice(6)) : ROOT;
  const want = args.filter((a) => !a.startsWith('--'));
  for (const [name, build] of Object.entries(SETS)) {
    if (want.length && !want.includes(name)) continue;
    const dir = join(OUT, 'raw', name);
    mkdirSync(dir, { recursive: true });
    let n = 0;
    for (const style of ['stroke', 'duotone', 'fill']) for (const corners of ['regular', 'sharp']) {
      const layers = build(style, corners);
      if (!layers) continue;
      const svg = [HEAD, ...layers, '</svg>', ''].join('\n');
      const b = inkOf(svg, corners);
      const off = Math.max(...b.map((v, i) => Math.abs(v - build.box[i])));
      if (off > 0.002) throw new Error(`${name} ${style} ${corners}: ink ${b.map((v) => v.toFixed(3))} should be ${build.box}`);
      writeFileSync(join(dir, file(style, corners)), svg);
      n++;
    }
    console.log(name.padEnd(20), 'ink', build.box.join(','), `${n} variants`);
  }
}

export { SETS };
