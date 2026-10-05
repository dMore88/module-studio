// The 15 shapes available in the studio (matches the Figma shape grid).
// `phIcon` is the Phosphor icon name, rendered with the regular weight (`ph ph-<name>`), as in the Figma shape grid.
export const STUDIO_SHAPE_KEYS = [
  "circle", "square", "triangle", "wave", "horseshoe", "hexagon", "line", "parallelogram", "hatch", "crescent", "teardrop", "cross", "digit1", "digit5", "digit9"
];

export const Shapes = {
  circle: {
    id: "circle",
    name: "Circle",
    category: "geometric",
    draw(ctx, size) {
      const r = size / 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.closePath();
    },
    svgPath(size) {
      const r = size / 2;
      return `<circle cx="0" cy="0" r="${r}" />`;
    },
    phIcon: "circle"
  },

  square: {
    id: "square",
    name: "Square",
    category: "geometric",
    draw(ctx, size) {
      const s = size;
      ctx.beginPath();
      ctx.rect(-s / 2, -s / 2, s, s);
      ctx.closePath();
    },
    svgPath(size) {
      const s = size;
      return `<rect x="${-s/2}" y="${-s/2}" width="${s}" height="${s}" />`;
    },
    phIcon: "square"
  },

  triangle: {
    id: "triangle",
    name: "Triangle",
    category: "geometric",
    draw(ctx, size) {
      const r = size * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
    },
    svgPath(size) {
      const r = size * 0.55;
      return `<polygon points="0,${-r} ${r*0.866},${r*0.5} ${-r*0.866},${r*0.5}" />`;
    },
    phIcon: "triangle"
  },

  wave: {
    id: "wave",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    name: "Sine Wave",
    category: "curved",
    draw(ctx, size) {
      const w = size * 0.85;
      const a = size * 0.25;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.bezierCurveTo(-w / 4, -a, -w / 4, -a, 0, 0);
      ctx.bezierCurveTo(w / 4, a, w / 4, a, w / 2, 0);
    },
    svgPath(size) {
      const w = size * 0.85;
      const a = size * 0.25;
      return `<path d="M ${-w/2} 0 C ${-w/4} ${-a}, ${-w/4} ${-a}, 0 0 C ${w/4} ${a}, ${w/4} ${a}, ${w/2} 0" fill="none" stroke="currentColor" stroke-width="4" />`;
    },
    phIcon: "tilde"
  },

  horseshoe: {
    id: "horseshoe",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    name: "Horseshoe",
    category: "curved",
    draw(ctx, size) {
      const w = size * 0.32;
      const h = size * 0.45;
      ctx.beginPath();
      ctx.moveTo(-w, -h);
      ctx.lineTo(-w, h * 0.1);
      ctx.arc(0, h * 0.1, w, Math.PI, 0, true);
      ctx.lineTo(w, -h);
    },
    svgPath(size) {
      const w = size * 0.32;
      const h = size * 0.45;
      return `<path d="M ${-w} ${-h} L ${-w} ${h*0.1} A ${w} ${w} 0 0 0 ${w} ${h*0.1} L ${w} ${-h}" fill="none" stroke="currentColor" stroke-width="4" />`;
    },
    phIcon: "circle-notch"
  },

  hexagon: {
    id: "hexagon",
    name: "Hexagon",
    category: "polygonal",
    draw(ctx, size) {
      const r = size * 0.52;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    },
    svgPath(size) {
      const r = size * 0.52;
      let pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
      }
      return `<polygon points="${pts.join(" ")}" />`;
    },
    phIcon: "hexagon"
  },

  line: {
    id: "line",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    textureRef: 450, // a line is a long module: texture px are calibrated for ~450px
    name: "Straight Line",
    category: "linear",
    draw(ctx, size) {
      const len = size * 0.9;
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0);
      ctx.lineTo(len / 2, 0);
    },
    svgPath(size) {
      const len = size * 0.9;
      return `<line x1="${-len/2}" y1="0" x2="${len/2}" y2="0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" />`;
    },
    phIcon: "minus"
  },

  parallelogram: {
    id: "parallelogram",
    name: "Parallelogram",
    category: "polygonal",
    draw(ctx, size) {
      const hw = size * 0.5;
      const hh = size * 0.32;
      const skew = size * 0.22;
      ctx.beginPath();
      ctx.moveTo(-hw + skew, -hh);
      ctx.lineTo(hw + skew, -hh);
      ctx.lineTo(hw - skew, hh);
      ctx.lineTo(-hw - skew, hh);
      ctx.closePath();
    },
    svgPath(size) {
      const hw = size * 0.5;
      const hh = size * 0.32;
      const skew = size * 0.22;
      return `<polygon points="${-hw + skew},${-hh} ${hw + skew},${-hh} ${hw - skew},${hh} ${-hw - skew},${hh}" />`;
    },
    phIcon: "parallelogram"
  },

  hatch: {
    id: "hatch",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    name: "Diagonal Hatch",
    category: "linear",
    draw(ctx, size) {
      const s = size * 0.45;
      ctx.beginPath();
      ctx.moveTo(-s, s); ctx.lineTo(s, -s);
      ctx.moveTo(-s * 0.3, s); ctx.lineTo(s, -s * 0.3);
      ctx.moveTo(-s, s * 0.3); ctx.lineTo(s * 0.3, -s);
    },
    svgPath(size) {
      const s = size * 0.45;
      return `<g stroke="currentColor" stroke-width="3"><line x1="${-s}" y1="${s}" x2="${s}" y2="${-s}"/><line x1="${-s*0.3}" y1="${s}" x2="${s}" y2="${-s*0.3}"/><line x1="${-s}" y1="${s*0.3}" x2="${s*0.3}" y2="${-s}"/></g>`;
    },
    phIcon: "scribble"
  },

  crescent: {
    id: "crescent",
    name: "Crescent",
    category: "curved",
    draw(ctx, size) {
      const r = size * 0.45;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.5, Math.PI * 1.5, false);
      ctx.bezierCurveTo(r * 0.4, -r * 0.8, r * 0.4, r * 0.8, 0, r);
      ctx.closePath();
    },
    svgPath(size) {
      const r = size * 0.45;
      return `<path d="M 0 ${r} A ${r} ${r} 0 0 1 0 ${-r} C ${r*0.4} ${-r*0.8} ${r*0.4} ${r*0.8} 0 ${r} Z" />`;
    },
    phIcon: "subset-proper-of"
  },

  teardrop: {
    id: "teardrop",
    name: "Teardrop (Gota)",
    category: "organic",
    draw(ctx, size) {
      const w = size * 0.65;
      const l = size * 0.95;
      ctx.beginPath();
      ctx.moveTo(0, -l / 2);
      ctx.bezierCurveTo(w / 1.5, -l / 6, w / 1.8, l / 2, 0, l / 2);
      ctx.bezierCurveTo(-w / 1.8, l / 2, -w / 1.5, -l / 6, 0, -l / 2);
      ctx.closePath();
    },
    svgPath(size) {
      const w = size * 0.65;
      const l = size * 0.95;
      return `<path d="M 0 ${-l/2} C ${w/1.5} ${-l/6}, ${w/1.8} ${l/2}, 0 ${l/2} C ${-w/1.8} ${l/2}, ${-w/1.5} ${-l/6}, 0 ${-l/2} Z" />`;
    },
    phIcon: "drop-half-bottom"
  },

  cross: {
    id: "cross",
    name: "Greek Cross (+)",
    category: "polygonal",
    draw(ctx, size) {
      const arm = size * 0.5;
      const th = size * 0.18;
      ctx.beginPath();
      ctx.moveTo(-th / 2, -arm);
      ctx.lineTo(th / 2, -arm);
      ctx.lineTo(th / 2, -th / 2);
      ctx.lineTo(arm, -th / 2);
      ctx.lineTo(arm, th / 2);
      ctx.lineTo(th / 2, th / 2);
      ctx.lineTo(th / 2, arm);
      ctx.lineTo(-th / 2, arm);
      ctx.lineTo(-th / 2, th / 2);
      ctx.lineTo(-arm, th / 2);
      ctx.lineTo(-arm, -th / 2);
      ctx.lineTo(-th / 2, -th / 2);
      ctx.closePath();
    },
    svgPath(size) {
      const arm = size * 0.5;
      const th = size * 0.18;
      return `<path d="M ${-th/2} ${-arm} L ${th/2} ${-arm} L ${th/2} ${-th/2} L ${arm} ${-th/2} L ${arm} ${th/2} L ${th/2} ${th/2} L ${th/2} ${arm} L ${-th/2} ${arm} L ${-th/2} ${th/2} L ${-arm} ${th/2} L ${-arm} ${-th/2} L ${-th/2} ${-th/2} Z" />`;
    },
    phIcon: "plus"
  },

  digit1: {
    id: "digit1",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    name: "Digit 1",
    category: "symbolic",
    draw(ctx, size) {
      const s = size;
      ctx.beginPath();
      ctx.moveTo(-0.17 * s, -0.2 * s);
      ctx.lineTo(0.03 * s, -0.4 * s);
      ctx.lineTo(0.03 * s, 0.4 * s);
    },
    svgPath(size) {
      const s = size;
      return `<path d="M ${-0.17*s} ${-0.2*s} L ${0.03*s} ${-0.4*s} L ${0.03*s} ${0.4*s}" fill="none" stroke="currentColor" stroke-width="${s*0.14}" stroke-linecap="round" stroke-linejoin="round" />`;
    },
    phIcon: "number-one"
  },

  digit5: {
    id: "digit5",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    name: "Digit 5",
    category: "symbolic",
    draw(ctx, size) {
      const s = size;
      ctx.beginPath();
      ctx.moveTo(0.2 * s, -0.4 * s);
      ctx.lineTo(-0.17 * s, -0.4 * s);
      ctx.lineTo(-0.21 * s, -0.02 * s);
      ctx.bezierCurveTo(0.0 * s, -0.14 * s, 0.3 * s, -0.04 * s, 0.3 * s, 0.17 * s);
      ctx.bezierCurveTo(0.3 * s, 0.4 * s, 0.0 * s, 0.46 * s, -0.24 * s, 0.3 * s);
    },
    svgPath(size) {
      const s = size;
      return `<path d="M ${0.2*s} ${-0.4*s} L ${-0.17*s} ${-0.4*s} L ${-0.21*s} ${-0.02*s} C ${0} ${-0.14*s} ${0.3*s} ${-0.04*s} ${0.3*s} ${0.17*s} C ${0.3*s} ${0.4*s} ${0} ${0.46*s} ${-0.24*s} ${0.3*s}" fill="none" stroke="currentColor" stroke-width="${s*0.14}" stroke-linecap="round" stroke-linejoin="round" />`;
    },
    phIcon: "number-five"
  },

  digit9: {
    id: "digit9",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    name: "Digit 9",
    category: "symbolic",
    draw(ctx, size) {
      const s = size;
      ctx.beginPath();
      ctx.arc(0, -0.15 * s, 0.22 * s, 0, Math.PI * 2);
      ctx.moveTo(0.22 * s, -0.15 * s);
      ctx.bezierCurveTo(0.22 * s, 0.2 * s, 0.1 * s, 0.4 * s, -0.2 * s, 0.4 * s);
    },
    svgPath(size) {
      const s = size;
      return `<path d="M ${0.22*s} ${-0.15*s} A ${0.22*s} ${0.22*s} 0 1 1 ${-0.22*s} ${-0.15*s} A ${0.22*s} ${0.22*s} 0 1 1 ${0.22*s} ${-0.15*s} M ${0.22*s} ${-0.15*s} C ${0.22*s} ${0.2*s} ${0.1*s} ${0.4*s} ${-0.2*s} ${0.4*s}" fill="none" stroke="currentColor" stroke-width="${s*0.14}" stroke-linecap="round" stroke-linejoin="round" />`;
    },
    phIcon: "number-nine"
  }
};

// ============================================================================
// TEXTURE GEOMETRY
// Texture is a set of geometry deformations (not a pixel pattern): every shape is
// flattened into a polyline once, then jitter, undulation, strand crossing and
// line skipping are applied to its vertices. Deterministic per seed.
// ============================================================================

const FLAT_REF_SIZE = 100;
const FLAT_SPACING = 1.5; // dense sampling step at the reference size

const flatCache = {};

// Records a shape's draw() commands into dense polylines at the reference size.
export function flattenShape(shapeDef) {
  if (!shapeDef.noCache && flatCache[shapeDef.id]) return flatCache[shapeDef.id];

  const subpaths = [];
  let cur = null;
  let last = null;
  let first = null;

  const startSub = (x, y) => {
    cur = { pts: [{ x, y, c: true }], closed: false };
    subpaths.push(cur);
    last = { x, y };
    first = { x, y };
  };
  const lineTo = (x, y) => {
    if (!cur) { startSub(x, y); return; }
    const dx = x - last.x, dy = y - last.y;
    const len = Math.hypot(dx, dy);
    const n = Math.max(1, Math.ceil(len / FLAT_SPACING));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      cur.pts.push({ x: last.x + dx * t, y: last.y + dy * t, c: i === n });
    }
    last = { x, y };
  };
  const bezier = (c1x, c1y, c2x, c2y, x, y) => {
    if (!cur) startSub(c1x, c1y);
    const x0 = last.x, y0 = last.y;
    const steps = 28;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, m = 1 - t;
      cur.pts.push({
        x: m * m * m * x0 + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * x,
        y: m * m * m * y0 + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * y,
        c: i === steps
      });
    }
    last = { x, y };
  };

  const rec = {
    beginPath() { cur = null; },
    moveTo(x, y) { startSub(x, y); },
    lineTo,
    closePath() { if (cur) { cur.closed = true; last = { x: first.x, y: first.y }; cur = null; } },
    bezierCurveTo: bezier,
    quadraticCurveTo(cx, cy, x, y) {
      const x0 = last ? last.x : cx, y0 = last ? last.y : cy;
      bezier(x0 + (2 / 3) * (cx - x0), y0 + (2 / 3) * (cy - y0), x + (2 / 3) * (cx - x), y + (2 / 3) * (cy - y), x, y);
    },
    arc(cx, cy, r, a0, a1, ccw = false) {
      let sweep = a1 - a0;
      if (!ccw && sweep < 0) sweep += Math.PI * 2 * Math.ceil(-sweep / (Math.PI * 2));
      if (ccw && sweep > 0) sweep -= Math.PI * 2 * Math.ceil(sweep / (Math.PI * 2));
      if (Math.abs(sweep) > Math.PI * 2) sweep = Math.sign(sweep) * Math.PI * 2;
      const sx = cx + Math.cos(a0) * r, sy = cy + Math.sin(a0) * r;
      if (cur) lineTo(sx, sy); else startSub(sx, sy);
      const steps = Math.max(8, Math.ceil((Math.abs(sweep) * r) / FLAT_SPACING));
      for (let i = 1; i <= steps; i++) {
        const a = a0 + (sweep * i) / steps;
        cur.pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, c: i === steps });
      }
      last = { x: cx + Math.cos(a0 + sweep) * r, y: cy + Math.sin(a0 + sweep) * r };
    },
    rect(x, y, w, h) {
      startSub(x, y);
      lineTo(x + w, y); lineTo(x + w, y + h); lineTo(x, y + h);
      cur.closed = true;
      cur = null;
    }
  };

  shapeDef.draw(rec, FLAT_REF_SIZE);

  // Normalise: arc-length parameter u (0..1) per subpath, drop a duplicated closing point
  for (const sp of subpaths) {
    const pts = sp.pts;
    if (pts.length > 2) {
      const a = pts[0], b = pts[pts.length - 1];
      if (Math.hypot(a.x - b.x, a.y - b.y) < 1e-6) {
        pts.pop();
        sp.closed = true; // a full-circle arc closes on itself
      }
    }
    let total = 0;
    pts[0].u = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      pts[i].u = total;
    }
    const closeLen = sp.closed ? Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) : 0;
    const len = (total + closeLen) || 1;
    for (const pt of pts) pt.u /= len;
  }

  if (!shapeDef.noCache) flatCache[shapeDef.id] = subpaths;
  return subpaths;
}

// ---- Shape morphing (Gradation > Shape) ----
// Two shapes are flattened, resampled to the same number of points by arc length and
// interpolated point by point. Closed outlines are rotated (and flipped) to line up best.
const MORPH_POINTS = 96;
const morphCache = {};

function resampleSubpath(sp, n) {
  const pts = sp.pts;
  const out = [];
  for (let k = 0; k < n; k++) {
    const u = sp.closed ? k / n : k / (n - 1);
    let i = 0;
    while (i < pts.length - 1 && pts[i + 1].u <= u) i++;
    const a = pts[i];
    const b = pts[i + 1] || (sp.closed ? { x: pts[0].x, y: pts[0].y, u: 1 } : a);
    const span = (b.u - a.u) || 1;
    const t = Math.min(1, Math.max(0, (u - a.u) / span));
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

function alignClosed(a, b) {
  const n = a.length;
  let best = Infinity, bestPts = b;
  for (const flip of [false, true]) {
    const src = flip ? b.slice().reverse() : b;
    for (let s = 0; s < n; s++) {
      let d = 0;
      for (let k = 0; k < n; k++) {
        const q = src[(k + s) % n];
        d += (a[k].x - q.x) ** 2 + (a[k].y - q.y) ** 2;
      }
      if (d < best) { best = d; bestPts = src.map((_, k) => src[(k + s) % n]); }
    }
  }
  return bestPts;
}

function centroid(pts) {
  let x = 0, y = 0;
  for (const p of pts) { x += p.x; y += p.y; }
  return { x: x / pts.length, y: y / pts.length };
}

function getMorphPairs(defA, defB) {
  const key = defA.id + "|" + defB.id;
  if (morphCache[key]) return morphCache[key];
  const A = flattenShape(defA), B = flattenShape(defB);
  const count = Math.max(A.length, B.length);
  const pairs = [];
  for (let i = 0; i < count; i++) {
    const spA = A[i], spB = B[i];
    let a, b, closedA, closedB;
    if (spA && spB) {
      closedA = spA.closed; closedB = spB.closed;
      a = resampleSubpath(spA, MORPH_POINTS);
      b = resampleSubpath(spB, MORPH_POINTS);
      if (closedA && closedB) b = alignClosed(a, b);
    } else if (spA) {
      // only A has this part: it collapses to its centre as the shape changes
      closedA = closedB = spA.closed;
      a = resampleSubpath(spA, MORPH_POINTS);
      const c = centroid(a);
      b = a.map(() => ({ x: c.x, y: c.y }));
    } else {
      closedA = closedB = spB.closed;
      b = resampleSubpath(spB, MORPH_POINTS);
      const c = centroid(b);
      a = b.map(() => ({ x: c.x, y: c.y }));
    }
    pairs.push({ a, b, closedA, closedB, onlyA: !spB, onlyB: !spA });
  }
  morphCache[key] = pairs;
  return pairs;
}

// A shape that is `amount` (0..1) of the way from defA to defB.
export function morphedShape(defA, defB, amount) {
  const m = Math.max(0, Math.min(1, amount));
  const pairs = getMorphPairs(defA, defB);
  return {
    id: `morph:${defA.id}:${defB.id}`,
    noCache: true, // every amount is a different outline: do not keep it in the flatten cache
    skeleton: m < 0.5 ? !!defA.skeleton : !!defB.skeleton,
    textureRef: defA.textureRef,
    draw(ctx, size) {
      const f = size / FLAT_REF_SIZE;
      ctx.beginPath();
      for (const p of pairs) {
        if (m === 0 && p.onlyB) continue;
        if (m === 1 && p.onlyA) continue;
        const closed = m < 0.5 ? p.closedA : p.closedB;
        for (let k = 0; k < p.a.length; k++) {
          const x = (p.a[k].x + (p.b[k].x - p.a[k].x) * m) * f;
          const y = (p.a[k].y + (p.b[k].y - p.a[k].y) * m) * f;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        if (closed) ctx.closePath();
      }
    }
  };
}

// Deforms a shape's polylines. Returns [{ segments: [[{x,y}...]], closed }] in local px at `size`.
export function buildTexturedGeometry(shapeDef, size, tex, seed, strokeOnly) {
  const base = flattenShape(shapeDef);
  const f = size / FLAT_REF_SIZE; // geometry scale
  const k = size / (shapeDef.textureRef || FLAT_REF_SIZE); // texture px are relative to the module size
  const jitter = (tex.jitter || 0) * k;
  const undulation = (tex.undulation || 0) * k * 0.7;
  // Skipping and crossing only read on strokes; they are ignored on filled shapes.
  const skipChance = strokeOnly ? (tex.skipChance || 0) / 100 : 0;
  const crossing = strokeOnly ? (tex.crossing || 0) / 100 : 0;
  const stride = Math.max(1, Math.round(Math.max(2, size * 0.04) / (FLAT_SPACING * f)));

  const out = [];
  base.forEach((sp, spIdx) => {
    const s = seed + spIdx * 7.31;
    // Keep corners, thin the dense samples between them
    const picked = [];
    let run = 0;
    for (const pt of sp.pts) {
      if (pt.c) { picked.push(pt); run = 0; }
      else if (++run % stride === 0) picked.push(pt);
    }
    const n = picked.length;
    let pts = picked.map(pt => ({ x: pt.x * f, y: pt.y * f, u: pt.u }));

    // Perimeter undulation: sine displacement along the outline normal
    if (undulation > 0 && n > 2) {
      const periods = sp.closed ? 3 : 2;
      const phase = s * 0.37;
      pts = pts.map((pt, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        let nx = -(b.y - a.y), ny = b.x - a.x;
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        const off = Math.sin(pt.u * Math.PI * 2 * periods + phase) * undulation;
        return { x: pt.x + nx * off, y: pt.y + ny * off, u: pt.u };
      });
    }

    // Jitter: per-vertex hand tremor
    if (jitter > 0) {
      pts.forEach((pt, p) => {
        pt.x += Math.sin(s * 13.1 + p * 37.3) * 0.5 * jitter;
        pt.y += Math.cos(s * 29.7 + p * 19.1) * 0.5 * jitter;
      });
    }

    // Strand crossing: swap nearby vertices to fray the stroke
    if (crossing > 0 && n > 6) {
      const swaps = Math.floor(n * crossing * 0.15);
      for (let k = 0; k < swaps; k++) {
        const a = Math.floor(Math.abs(Math.sin(s * 9.1 + k * 3.7)) * n) % n;
        const b = (a + 2 + Math.floor(Math.abs(Math.cos(s * 5.3 + k * 7.1)) * 4)) % n;
        const tmp = pts[a]; pts[a] = pts[b]; pts[b] = tmp;
      }
    }

    // Line skipping: drop vertices so the stroke breaks into segments
    const segments = [];
    if (skipChance > 0) {
      let seg = [];
      pts.forEach((pt, p) => {
        const skip = Math.abs(Math.sin(s * 43.1 + p * 97.7)) < skipChance;
        if (skip) { if (seg.length > 1) segments.push(seg); seg = []; }
        else seg.push(pt);
      });
      if (seg.length > 1) segments.push(seg);
    } else {
      segments.push(pts);
    }
    out.push({ segments, closed: sp.closed && skipChance === 0 });
  });
  return out;
}

// Wraps a shape so every draw() emits the deformed geometry (works with every Space mode).
export function texturedShape(shapeDef, tex, seed, strokeOnly) {
  return {
    ...shapeDef,
    draw(ctx, size) {
      const geo = buildTexturedGeometry(shapeDef, size, tex, seed, strokeOnly);
      ctx.beginPath();
      for (const sp of geo) {
        for (const seg of sp.segments) {
          seg.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
          if (sp.closed) ctx.closePath();
        }
      }
    }
  };
}
