// Boolean operations between shapes (union, subtract, intersect, exclude), with no dependencies.
//
// A region is a list of closed contours (each one a list of { x, y }); a point is inside it by the even-odd rule, so a region can
// have holes (a ring is two contours). The operation works on the arrangement of the two regions' edges:
//   1. every edge is cut at the points where it meets an edge of the other region (a point is shared, so the cuts match);
//   2. every piece is looked at from both sides: is the point just left of it inside A? inside B? the same just right of it?
//      The result is "inside" by the operation's rule (A or B, A and not B, A and B, A xor B); a piece is part of the result's
//      outline when its two sides disagree (edges that two shapes share are handled by this, with no special case);
//   3. the pieces are turned so that the inside is always on their left and chained into closed contours: outlines come out
//      turning one way and holes the other, so the result fills right with the nonzero rule too.
const SNAP = 1e7;       // two points closer than 1e-7 are the same point
const SIDE = 1e-4;      // how far from a piece its sides are looked at

export function inRegion(region, px, py) {
  let inside = false;
  for (const c of region) {
    for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
      const a = c[i], b = c[j];
      if ((a.y > py) !== (b.y > py) && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
  }
  return inside;
}

export function contourArea(c) {
  let a = 0;
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) a += (c[j].x + c[i].x) * (c[j].y - c[i].y);
  return a / 2;
}

// Area of a region produced by regionBoolean: outlines count, holes take away
export function regionArea(region) {
  let total = 0;
  for (const c of region) total += contourArea(c);
  return Math.abs(total);
}

// The same test, for many points: the edges are filed by the horizontal strip they cross, so a point only looks at its own strip
function regionTester(region) {
  let minY = Infinity, maxY = -Infinity, n = 0;
  for (const c of region) for (const p of c) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); n++; }
  if (!n) return () => false;
  const strips = Math.max(1, Math.min(128, Math.round(n / 8)));
  const h = Math.max(1e-9, (maxY - minY) / strips);
  const bins = Array.from({ length: strips }, () => []);
  for (const c of region) {
    for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
      const a = c[i], b = c[j];
      const s0 = Math.max(0, Math.min(strips - 1, Math.floor((Math.min(a.y, b.y) - minY) / h)));
      const s1 = Math.max(0, Math.min(strips - 1, Math.floor((Math.max(a.y, b.y) - minY) / h)));
      for (let s = s0; s <= s1; s++) bins[s].push(a, b);
    }
  }
  return (px, py) => {
    if (py < minY || py > maxY) return false;
    const list = bins[Math.max(0, Math.min(strips - 1, Math.floor((py - minY) / h)))];
    let inside = false;
    for (let k = 0; k < list.length; k += 2) {
      const a = list[k], b = list[k + 1];
      if ((a.y > py) !== (b.y > py) && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  };
}

const RULES = {
  union: (a, b) => a || b,
  subtract: (a, b) => a && !b,
  intersect: (a, b) => a && b,
  xor: (a, b) => a !== b
};

export function regionBoolean(op, A, B) {
  const rule = RULES[op];
  if (!rule) throw new Error("Unknown boolean operation: " + op);
  A = A.filter(c => c.length >= 3); B = B.filter(c => c.length >= 3);
  if (!A.length && !B.length) return [];

  // Points are shared: the same coordinates give the same vertex
  const verts = new Map();
  const vertex = (x, y) => {
    const key = Math.round(x * SNAP) + "," + Math.round(y * SNAP);
    let v = verts.get(key);
    if (!v) { v = { x, y, id: verts.size }; verts.set(key, v); }
    return v;
  };

  const edges = [];
  const addRegion = (region, src) => {
    for (const c of region) {
      const vs = c.map(p => vertex(p.x, p.y));
      for (let i = 0; i < vs.length; i++) {
        const a = vs[i], b = vs[(i + 1) % vs.length];
        if (a !== b) edges.push({ a, b, src, cuts: [] });
      }
    }
  };
  addRegion(A, 0); addRegion(B, 1);

  // A grid of cells, so only edges that can meet are compared
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of verts.values()) { minX = Math.min(minX, v.x); minY = Math.min(minY, v.y); maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y); }
  const cell = Math.max(1e-6, Math.max(maxX - minX, maxY - minY) / 40);
  const grid = new Map();
  edges.forEach((e, idx) => {
    const x0 = Math.floor((Math.min(e.a.x, e.b.x) - minX) / cell), x1 = Math.floor((Math.max(e.a.x, e.b.x) - minX) / cell);
    const y0 = Math.floor((Math.min(e.a.y, e.b.y) - minY) / cell), y1 = Math.floor((Math.max(e.a.y, e.b.y) - minY) / cell);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const k = gx * 100003 + gy;
      let l = grid.get(k); if (!l) grid.set(k, l = []);
      l.push(idx);
    }
  });

  const along = (e, v) => {
    const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
    return ((v.x - e.a.x) * dx + (v.y - e.a.y) * dy) / (dx * dx + dy * dy);
  };
  const cutAt = (e, v) => { if (v !== e.a && v !== e.b) e.cuts.push({ t: along(e, v), v }); };

  const done = new Set();
  for (const list of grid.values()) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const ei = list[i], ej = list[j];
      const key = ei < ej ? ei * 1e7 + ej : ej * 1e7 + ei;
      if (done.has(key)) continue;
      done.add(key);
      const p = edges[ei], q = edges[ej];
      if (p.src === q.src) continue; // the outlines of one region are taken as not crossing each other
      const rx = p.b.x - p.a.x, ry = p.b.y - p.a.y, sx = q.b.x - q.a.x, sy = q.b.y - q.a.y;
      const den = rx * sy - ry * sx;
      const qpx = q.a.x - p.a.x, qpy = q.a.y - p.a.y;
      const lenP = Math.hypot(rx, ry), lenQ = Math.hypot(sx, sy);
      if (Math.abs(den) <= 1e-12 * lenP * lenQ) {
        // parallel: only if they lie on one line do they share a stretch, and then each is cut at the other's ends
        if (Math.abs(qpx * ry - qpy * rx) > 1e-9 * lenP * Math.max(1, lenQ)) continue;
        for (const v of [q.a, q.b]) { const t = along(p, v); if (t > 0 && t < 1) cutAt(p, v); }
        for (const v of [p.a, p.b]) { const t = along(q, v); if (t > 0 && t < 1) cutAt(q, v); }
        continue;
      }
      const t = (qpx * sy - qpy * sx) / den, u = (qpx * ry - qpy * rx) / den;
      const tol = 1e-9;
      if (t < -tol || t > 1 + tol || u < -tol || u > 1 + tol) continue;
      const v = vertex(p.a.x + t * rx, p.a.y + t * ry);
      cutAt(p, v); cutAt(q, v);
    }
  }

  // The pieces, each once
  const seen = new Set();
  const pieces = [];
  for (const e of edges) {
    const stops = [{ t: 0, v: e.a }, ...e.cuts.sort((m, n) => m.t - n.t), { t: 1, v: e.b }];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i].v, b = stops[i + 1].v;
      if (a === b) continue;
      const key = a.id < b.id ? a.id + "-" + b.id : b.id + "-" + a.id;
      if (seen.has(key)) continue;
      seen.add(key);
      pieces.push({ a, b });
    }
  }

  const inA = regionTester(A), inB = regionTester(B);
  // Keep the pieces whose two sides disagree, with the inside on their left
  const out = new Map(); // start vertex id -> pieces going out of it
  const kept = [];
  for (const pc of pieces) {
    const dx = pc.b.x - pc.a.x, dy = pc.b.y - pc.a.y, len = Math.hypot(dx, dy);
    const mx = (pc.a.x + pc.b.x) / 2, my = (pc.a.y + pc.b.y) / 2;
    const nx = -dy / len, ny = dx / len;
    const left = rule(inA(mx + nx * SIDE, my + ny * SIDE), inB(mx + nx * SIDE, my + ny * SIDE));
    const right = rule(inA(mx - nx * SIDE, my - ny * SIDE), inB(mx - nx * SIDE, my - ny * SIDE));
    if (left === right) continue;
    const s = left ? { from: pc.a, to: pc.b, used: false } : { from: pc.b, to: pc.a, used: false };
    kept.push(s);
    let l = out.get(s.from.id); if (!l) out.set(s.from.id, l = []);
    l.push(s);
  }

  // Chain them into closed contours
  const contours = [];
  for (const start of kept) {
    if (start.used) continue;
    const pts = [];
    let cur = start;
    while (cur && !cur.used) {
      cur.used = true;
      pts.push({ x: cur.from.x, y: cur.from.y });
      if (cur.to === start.from) break;
      const next = (out.get(cur.to.id) || []).filter(s => !s.used);
      // at a point where several pieces leave, take the one that turns most to the left, which keeps the outlines simple
      if (next.length > 1) {
        const ang = (s) => Math.atan2(s.to.y - s.from.y, s.to.x - s.from.x);
        const base = Math.atan2(cur.to.y - cur.from.y, cur.to.x - cur.from.x);
        next.sort((m, n) => turn(ang(m) - base) - turn(ang(n) - base));
      }
      cur = next[0];
    }
    if (pts.length >= 3 && Math.abs(contourArea(pts)) > 1e-9) contours.push(pts);
  }
  return contours;
}

function turn(a) { while (a <= -Math.PI) a += 2 * Math.PI; while (a > Math.PI) a -= 2 * Math.PI; return a; }
