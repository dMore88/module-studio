// The shapes available in the studio, in the order of the shape grid (6 per row).
// `phIcon` is the Phosphor icon name, rendered with the regular weight (`ph ph-<name>`); the ring has no Phosphor icon
// and the letters show their own glyph (see `glyph`).
export const STUDIO_SHAPE_KEYS = [
  "circle", "square", "triangle", "line", "cross", "ring",
  "semicircle", "quarter", "crescent", "wave", "spiral", "arrow",
  "pentagon", "hexagon", "octagon", "star",
  "letterA", "letterS", "letterR", "digit1", "digit5", "digit9"
];

// ---- Helpers for the newer shapes: one list of path operations gives both the canvas path and the SVG path ----
const KAPPA = 0.5522847498;

// An arc from angle a0 to a1 (radians, canvas direction) as cubic curves of at most a quarter turn each
function arcOps(cx, cy, r, a0, a1) {
  const ops = [], total = a1 - a0, n = Math.max(1, Math.ceil(Math.abs(total) / (Math.PI / 2) - 1e-9)), step = total / n;
  const k = (4 / 3) * Math.tan(step / 4);
  for (let i = 0; i < n; i++) {
    const s = a0 + i * step, e = s + step;
    const x0 = cx + r * Math.cos(s), y0 = cy + r * Math.sin(s), x3 = cx + r * Math.cos(e), y3 = cy + r * Math.sin(e);
    ops.push(["C", x0 - k * r * Math.sin(s), y0 + k * r * Math.cos(s), x3 + k * r * Math.sin(e), y3 - k * r * Math.cos(e), x3, y3]);
  }
  return ops;
}

// A full circle; `hole` runs it the other way round so it cuts a hole in the circle drawn before it
function circleOps(cx, cy, r, hole) {
  const a1 = hole ? -Math.PI * 2 : Math.PI * 2;
  return [["M", cx + r, cy], ...arcOps(cx, cy, r, 0, a1), ["Z"]];
}

function polygonOps(n, r, start) {
  const ops = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i * Math.PI * 2) / n;
    ops.push([i === 0 ? "M" : "L", r * Math.cos(a), r * Math.sin(a)]);
  }
  ops.push(["Z"]);
  return ops;
}

// Builds `draw` and `svgPath` from `opsFor(size)`; open shapes (skeleton) are stroked in the SVG
function pathShape(opsFor) {
  const f = (v) => Math.round(v * 1000) / 1000;
  return {
    draw(ctx, size) {
      ctx.beginPath();
      for (const [op, ...a] of opsFor(size)) {
        if (op === "M") ctx.moveTo(a[0], a[1]);
        else if (op === "L") ctx.lineTo(a[0], a[1]);
        else if (op === "C") ctx.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]);
        else ctx.closePath();
      }
    },
    svgPath(size) {
      const d = opsFor(size).map(([op, ...a]) => (op === "Z" ? "Z" : `${op} ${a.map(f).join(" ")}`)).join(" ");
      return `<path d="${d}" />`;
    }
  };
}

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
  },

  ring: {
    id: "ring",
    name: "Ring",
    category: "geometric",
    ...pathShape((s) => [...circleOps(0, 0, s * 0.5, false), ...circleOps(0, 0, s * 0.27, true)]),
    phIcon: null
  },

  semicircle: {
    id: "semicircle",
    name: "Semicircle",
    category: "curved",
    ...pathShape((s) => [["M", -s * 0.5, s * 0.25], ...arcOps(0, s * 0.25, s * 0.5, Math.PI, Math.PI * 2), ["Z"]]),
    phIcon: "circle-half"
  },

  quarter: {
    id: "quarter",
    name: "Quarter Circle",
    category: "curved",
    ...pathShape((s) => {
      const r = s * 0.9, cx = -r / 2, cy = r / 2;
      return [["M", cx, cy], ["L", cx + r, cy], ...arcOps(cx, cy, r, 0, -Math.PI / 2), ["Z"]];
    }),
    phIcon: "chart-pie-slice"
  },

  spiral: {
    id: "spiral",
    skeleton: true, // open path: drawn as a stroke (thick stroke in fill mode)
    name: "Spiral",
    category: "curved",
    ...pathShape((s) => {
      const turns = 2.5, n = 120, ops = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, a = t * turns * Math.PI * 2, r = s * 0.46 * t;
        ops.push([i === 0 ? "M" : "L", r * Math.cos(a), r * Math.sin(a)]);
      }
      return ops;
    }),
    phIcon: "spiral"
  },

  arrow: {
    id: "arrow",
    name: "Arrow",
    category: "polygonal",
    ...pathShape((s) => [["M", 0, -s * 0.5], ["L", s * 0.32, -s * 0.1], ["L", s * 0.12, -s * 0.1], ["L", s * 0.12, s * 0.5], ["L", -s * 0.12, s * 0.5], ["L", -s * 0.12, -s * 0.1], ["L", -s * 0.32, -s * 0.1], ["Z"]]),
    phIcon: "arrow-fat-up"
  },

  pentagon: {
    id: "pentagon",
    name: "Pentagon",
    category: "polygonal",
    ...pathShape((s) => polygonOps(5, s * 0.52, -Math.PI / 2)),
    phIcon: "pentagon"
  },

  octagon: {
    id: "octagon",
    name: "Octagon",
    category: "polygonal",
    ...pathShape((s) => polygonOps(8, s * 0.52, -Math.PI / 2 + Math.PI / 8)),
    phIcon: "octagon"
  },

  star: {
    id: "star",
    name: "Star",
    category: "polygonal",
    ...pathShape((s) => {
      const ro = s * 0.52, ri = s * 0.22, ops = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 === 0 ? ro : ri;
        ops.push([i === 0 ? "M" : "L", r * Math.cos(a), r * Math.sin(a)]);
      }
      ops.push(["Z"]);
      return ops;
    }),
    phIcon: "star"
  },

  letterA: {
    id: "letterA",
    skeleton: true, // letters are drawn as strokes, like the numbers
    name: "Letter A",
    category: "symbolic",
    ...pathShape((s) => [["M", -0.28 * s, 0.4 * s], ["L", 0, -0.4 * s], ["L", 0.28 * s, 0.4 * s], ["M", -0.17 * s, 0.12 * s], ["L", 0.17 * s, 0.12 * s]]),
    glyph: "A"
  },

  letterS: {
    id: "letterS",
    skeleton: true,
    name: "Letter S",
    category: "symbolic",
    ...pathShape((s) => [["M", 0.24 * s, -0.26 * s], ["C", 0.12 * s, -0.43 * s, -0.26 * s, -0.43 * s, -0.26 * s, -0.19 * s], ["C", -0.26 * s, 0.03 * s, 0.26 * s, -0.03 * s, 0.26 * s, 0.2 * s], ["C", 0.26 * s, 0.44 * s, -0.12 * s, 0.44 * s, -0.25 * s, 0.26 * s]]),
    glyph: "S"
  },

  letterR: {
    id: "letterR",
    skeleton: true,
    name: "Letter R",
    category: "symbolic",
    ...pathShape((s) => [["M", -0.2 * s, 0.4 * s], ["L", -0.2 * s, -0.4 * s], ["L", 0.05 * s, -0.4 * s], ["C", 0.3 * s, -0.4 * s, 0.3 * s, 0.02 * s, 0.05 * s, 0.02 * s], ["L", -0.2 * s, 0.02 * s], ["M", 0.03 * s, 0.02 * s], ["L", 0.26 * s, 0.4 * s]]),
    glyph: "R"
  }
};

// ============================================================================
// TEXTURE GEOMETRY
// Texture is a set of geometry deformations (not a pixel pattern): every shape is
// flattened into a polyline once, then jitter, undulation, random lines and
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
  // Skipping and random lines only read on strokes; they are ignored on filled shapes.
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
    const nOrig = picked.length;
    let n = nOrig;
    let pts = picked.map(pt => ({ x: pt.x * f, y: pt.y * f, u: pt.u }));

    // Jitter and undulation need more points than the outline has: jitter is a fine tremor (a vertex every ~1.5 % of the
    // module, each pushed on its own) and undulation a long smooth wave. Skipping and random lines keep the old density
    if ((jitter > 0 || undulation > 0) && nOrig > 2) {
      const gap = Math.max(1, size * 0.015);
      const dense = [];
      const count = sp.closed ? nOrig : nOrig - 1;
      for (let i = 0; i < count; i++) {
        const a = pts[i], b = pts[(i + 1) % nOrig];
        const bu = (i + 1 === nOrig) ? b.u + 1 : b.u;
        const parts = Math.min(40, Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / gap)));
        for (let k = 0; k < parts; k++) {
          const t = k / parts;
          dense.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, u: a.u + (bu - a.u) * t });
        }
      }
      if (!sp.closed) dense.push({ ...pts[nOrig - 1] });
      if (dense.length <= 600) { pts = dense; n = pts.length; }
    }
    const density = n / nOrig; // how many points now stand for one original point

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

    // Random lines: short strokes that leave the outline mostly along it (a share of the vertices grows one).
    // The angle leans toward the direction of the stroke, either way, and the length varies a lot: many short, a few long
    const fract = (v) => v - Math.floor(v);
    const strays = [];
    if (crossing > 0 && n > 2) {
      pts.forEach((pt, p) => {
        if (fract(Math.abs(Math.sin(s * 17.3 + p * 61.7)) * 1000) >= crossing / density) return;
        const a = pts[Math.max(0, p - 1)], b = pts[Math.min(n - 1, p + 1)];
        const along = Math.atan2(b.y - a.y, b.x - a.x) + (fract(Math.abs(Math.sin(s * 5.1 + p * 29.3)) * 1000) < 0.5 ? 0 : Math.PI);
        const u = fract(Math.abs(Math.cos(s * 7.9 + p * 23.1)) * 1000) * 2 - 1; // -1 to 1, squared so most are near parallel
        const ang = along + u * Math.abs(u) * (Math.PI * 55) / 180;
        const r = fract(Math.abs(Math.sin(s * 3.3 + p * 11.9)) * 1000);
        const len = size * (0.02 + 0.22 * Math.pow(r, 2.2));
        strays.push([{ x: pt.x, y: pt.y }, { x: pt.x + Math.cos(ang) * len, y: pt.y + Math.sin(ang) * len }]);
      });
    }

    // Line skipping: drop vertices so the stroke breaks into segments
    const segments = [];
    if (skipChance > 0) {
      let seg = [];
      pts.forEach((pt, p) => {
        const skip = Math.abs(Math.sin(s * 43.1 + Math.floor(p / density) * 97.7)) < skipChance;
        if (skip) { if (seg.length > 1) segments.push(seg); seg = []; }
        else seg.push(pt);
      });
      if (seg.length > 1) segments.push(seg);
    } else {
      segments.push(pts);
    }
    strays.forEach(st => segments.push(st));
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
