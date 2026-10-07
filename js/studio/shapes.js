import { regionBoolean } from './booleans.js';
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
// `refSize` and `spacing` are for outlines that need a different density (the boolean operations sample at the real size)
export function flattenShape(shapeDef, refSize = FLAT_REF_SIZE, spacing = FLAT_SPACING) {
  const standard = refSize === FLAT_REF_SIZE && spacing === FLAT_SPACING;
  if (standard && !shapeDef.noCache && flatCache[shapeDef.id]) return flatCache[shapeDef.id];

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
    const n = Math.max(1, Math.ceil(len / spacing));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      cur.pts.push({ x: last.x + dx * t, y: last.y + dy * t, c: i === n });
    }
    last = { x, y };
  };
  const bezier = (c1x, c1y, c2x, c2y, x, y) => {
    if (!cur) startSub(c1x, c1y);
    const x0 = last.x, y0 = last.y;
    // the usual density keeps 28 steps; a finer outline (for the boolean operations) follows the length of the curve
    const steps = standard ? 28 : Math.max(12, Math.min(240, Math.ceil((Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y)) / spacing)));
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

  // The recorder keeps its own transform (translate / rotate / scale / save / restore), so a composite shape can place its
  // figures; every point is mapped through it before it is stored
  let M = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const T = (x, y) => ({ x: M[0] * x + M[2] * y + M[4], y: M[1] * x + M[3] * y + M[5] });
  const rec = {
    beginPath() { cur = null; },
    save() { stack.push(M.slice()); },
    restore() { if (stack.length) M = stack.pop(); },
    translate(tx, ty) { M = [M[0], M[1], M[2], M[3], M[0] * tx + M[2] * ty + M[4], M[1] * tx + M[3] * ty + M[5]]; },
    rotate(a) {
      const c = Math.cos(a), s = Math.sin(a);
      M = [M[0] * c + M[2] * s, M[1] * c + M[3] * s, -M[0] * s + M[2] * c, -M[1] * s + M[3] * c, M[4], M[5]];
    },
    scale(sx, sy) { M = [M[0] * sx, M[1] * sx, M[2] * sy, M[3] * sy, M[4], M[5]]; },
    moveTo(x, y) { const p = T(x, y); startSub(p.x, p.y); },
    lineTo(x, y) { const p = T(x, y); lineTo(p.x, p.y); },
    closePath() { if (cur) { cur.closed = true; last = { x: first.x, y: first.y }; cur = null; } },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      const a = T(c1x, c1y), b = T(c2x, c2y), p = T(x, y);
      bezier(a.x, a.y, b.x, b.y, p.x, p.y);
    },
    quadraticCurveTo(cx, cy, x, y) {
      const c = T(cx, cy), p = T(x, y);
      const x0 = last ? last.x : c.x, y0 = last ? last.y : c.y;
      bezier(x0 + (2 / 3) * (c.x - x0), y0 + (2 / 3) * (c.y - y0), p.x + (2 / 3) * (c.x - p.x), p.y + (2 / 3) * (c.y - p.y), p.x, p.y);
    },
    arc(cx, cy, r, a0, a1, ccw = false) {
      let sweep = a1 - a0;
      if (!ccw && sweep < 0) sweep += Math.PI * 2 * Math.ceil(-sweep / (Math.PI * 2));
      if (ccw && sweep > 0) sweep -= Math.PI * 2 * Math.ceil(sweep / (Math.PI * 2));
      if (Math.abs(sweep) > Math.PI * 2) sweep = Math.sign(sweep) * Math.PI * 2;
      const s0 = T(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      if (cur) lineTo(s0.x, s0.y); else startSub(s0.x, s0.y);
      const steps = Math.max(8, Math.ceil((Math.abs(sweep) * r) / spacing));
      for (let i = 1; i <= steps; i++) {
        const a = a0 + (sweep * i) / steps;
        const q = T(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        cur.pts.push({ x: q.x, y: q.y, c: i === steps });
      }
      const e = T(cx + Math.cos(a0 + sweep) * r, cy + Math.sin(a0 + sweep) * r);
      last = { x: e.x, y: e.y };
    },
    rect(x, y, w, h) {
      const a = T(x, y), b = T(x + w, y), c = T(x + w, y + h), d = T(x, y + h);
      startSub(a.x, a.y);
      lineTo(b.x, b.y); lineTo(c.x, c.y); lineTo(d.x, d.y);
      cur.closed = true;
      cur = null;
    }
  };

  shapeDef.draw(rec, refSize);

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

  if (standard && !shapeDef.noCache) flatCache[shapeDef.id] = subpaths;
  return subpaths;
}

// ---- Container clip as geometry (Clip container) ----
// The shape cut by the container, as a new shape: its outline is clipped to the container's rectangle BEFORE texture and space
// work on it, so those effects are not cut themselves (they treat the cut module as the shape). A stroked outline keeps only its
// arcs inside (no line along the cut); a filled one becomes a polygon closed along the container's edge.
// `corners`: the four corners of the container, in the frame the shape is drawn in, as a share of `size0` (the size it is drawn at).
export function clippedShape(shapeDef, corners, size0, strokeOnly) {
  const r0 = size0 || 1;
  const nc = corners.map(c => ({ x: c.x / r0, y: c.y / r0 }));
  const key = `clip:${shapeDef.id}:${strokeOnly ? "s" : "f"}:${nc.map(c => `${Math.round(c.x * 1000)},${Math.round(c.y * 1000)}`).join(";")}`;
  return {
    id: key,
    name: shapeDef.name,
    noCache: true,
    skeleton: shapeDef.skeleton,
    textureRef: shapeDef.textureRef,
    draw(ctx, size) {
      const f = size / FLAT_REF_SIZE;
      let q = nc.map(c => ({ x: c.x * size, y: c.y * size }));
      let area = 0;
      for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; area += a.x * b.y - b.x * a.y; }
      if (area < 0) q = q.reverse(); // one orientation, so "inside" is the same side of every edge
      const side = (a, b, p) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      const edges = [0, 1, 2, 3].map(i => [q[i], q[(i + 1) % 4]]);
      ctx.beginPath();
      for (const sp of flattenShape(shapeDef)) {
        const pts = sp.pts.map(p => ({ x: p.x * f, y: p.y * f }));
        if (pts.length < 2) continue;
        if (sp.closed && !strokeOnly && !shapeDef.skeleton) {
          // Sutherland-Hodgman against the four edges
          let poly = pts;
          for (const [a, b] of edges) {
            const out = [];
            for (let i = 0; i < poly.length; i++) {
              const p = poly[i], n = poly[(i + 1) % poly.length];
              const sp1 = side(a, b, p), sn = side(a, b, n);
              if (sp1 >= 0) out.push(p);
              if ((sp1 >= 0) !== (sn >= 0)) { const k = sp1 / (sp1 - sn); out.push({ x: p.x + (n.x - p.x) * k, y: p.y + (n.y - p.y) * k }); }
            }
            poly = out;
            if (poly.length === 0) break;
          }
          if (poly.length >= 3) { poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); }
          continue;
        }
        // Outlines and open paths: keep the parts inside (Cyrus-Beck on every segment)
        const line = sp.closed ? pts.concat([pts[0]]) : pts;
        const runs = [];
        let run = null, firstAtStart = false, lastOpen = false;
        for (let i = 0; i < line.length - 1; i++) {
          const p0 = line[i], p1 = line[i + 1];
          let t0 = 0, t1 = 1, ok = true;
          for (const [a, b] of edges) {
            const f0 = side(a, b, p0), f1 = side(a, b, p1);
            if (f0 < 0 && f1 < 0) { ok = false; break; }
            if (f0 < 0) t0 = Math.max(t0, f0 / (f0 - f1));
            else if (f1 < 0) t1 = Math.min(t1, f0 / (f0 - f1));
          }
          if (!ok || t0 > t1) { if (run) { runs.push(run); run = null; } lastOpen = false; continue; }
          const at = (t) => ({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t });
          if (i === 0 && t0 === 0) firstAtStart = true;
          if (!run || t0 > 0) { if (run) runs.push(run); run = [at(t0)]; }
          run.push(at(t1));
          if (t1 < 1) { runs.push(run); run = null; lastOpen = false; } else lastOpen = true;
        }
        if (run) runs.push(run);
        let closedWhole = false;
        if (sp.closed && runs.length >= 1 && firstAtStart && lastOpen) {
          if (runs.length === 1) closedWhole = true; // all of it is inside
          else { const last = runs.pop(); runs[0] = last.concat(runs[0].slice(1)); } // the run that crosses the start of the outline
        }
        for (const r of runs) {
          if (r.length < 2) continue;
          r.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          if (closedWhole) ctx.closePath();
        }
      }
    }
  };
}

// ---- Smart module (composite shape) ----
// A module made of several figures, drawn as ONE shape: every modifier (texture, space, morph...) sees a single shape with
// several outlines. A figure is { shape, width, height, x, y, rotation } in px, from the centre of the module's container
// (the piece of paper); `ref` is the container's larger side, so the figures keep their proportions when the module is
// scaled (by its cell, for example). Older figures were { shape, size, x, y, rotation } as a % of the module.
const compositeCache = {};

// Shapes related to the previous one (Wong's interrelation of forms, the placements): `relation` is "free" (the shape's own
// x, y), "coincident" (same centre as the previous shape) or "distance" (placed in the direction `angle`, with `gap` px between
// the two: 0 touching, positive apart, negative overlapping). The touching distance is measured on the outlines (the supports of
// the two shapes along the direction), so it is exact for convex shapes and follows the convex hull of the others.
function figureSupport(f, ux, uy) {
  const def = Shapes[f.shape];
  const w = f.width, h = f.height ?? f.width;
  const m = f.shape === "line" ? w : Math.max(w, h);
  if (!def || !(m > 0)) return 0;
  const k = m / FLAT_REF_SIZE;
  const flat = !!def.skeleton;
  const sx = flat ? 1 : w / m, sy = flat ? 1 : h / m;
  const a = ((f.rotation || 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  let best = -Infinity;
  for (const sp of flattenShape(def)) {
    for (const p of sp.pts) {
      const qx = p.x * k * sx, qy = p.y * k * sy;
      const v = (qx * c - qy * s) * ux + (qx * s + qy * c) * uy;
      if (v > best) best = v;
    }
  }
  return best === -Infinity ? 0 : best;
}

const resolveCache = {};
export function resolveFigures(figures) {
  const key = JSON.stringify(figures);
  if (resolveCache[key]) return resolveCache[key];
  const out = [];
  (figures || []).forEach((f0, i) => {
    const f = { ...f0 };
    const prev = out[i - 1];
    if (i > 0 && prev && f.width !== undefined && f.relation === "coincident") {
      f.x = prev.x; f.y = prev.y;
    } else if (i > 0 && prev && f.width !== undefined && f.relation === "distance") {
      const a = (((f.angle ?? 0) % 360) * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a);
      const d = figureSupport(prev, ux, uy) + figureSupport(f, -ux, -uy) + (f.gap || 0);
      f.x = (prev.x || 0) + ux * d; f.y = (prev.y || 0) + uy * d;
    }
    out.push(f);
  });
  if (Object.keys(resolveCache).length > 200) for (const k of Object.keys(resolveCache)) delete resolveCache[k];
  resolveCache[key] = out;
  return out;
}

// A shape's outline as a region in module px: sampled at its real size, with its own width, height, turn and place
function shapeRegion(f, def) {
  const w = f.width, h = f.height ?? f.width;
  const m = f.shape === "line" ? w : Math.max(w, h);
  if (!(m > 0)) return [];
  const sx = w / m, sy = h / m;
  const a = ((f.rotation || 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const out = [];
  for (const sp of flattenShape(def, m, Math.max(0.5, Math.min(3, m / 100)))) {
    if (!sp.closed || sp.pts.length < 3) continue;
    out.push(sp.pts.map(p => { const qx = p.x * sx, qy = p.y * sy; return { x: (f.x || 0) + qx * c - qy * s, y: (f.y || 0) + qx * s + qy * c }; }));
  }
  return out;
}

export function compositeShape(figures, ref = 100, combine = "none") {
  const R = ref > 0 ? ref : 100;
  const list = resolveFigures((figures || []).filter(f => f && Shapes[f.shape]).map(f => (f.width !== undefined ? f : {
    shape: f.shape, width: ((f.size ?? 100) / 100) * R, height: ((f.size ?? 100) / 100) * R, x: ((f.x || 0) / 100) * R, y: ((f.y || 0) / 100) * R, rotation: f.rotation || 0
  })));
  const op = ["union", "subtract", "intersect", "xor"].includes(combine) ? combine : "none";
  const key = "smart:" + op + ":" + Math.round(R * 1000) + ":" + JSON.stringify(list.map(f => [f.shape, f.width, f.height ?? f.width, f.x || 0, f.y || 0, f.rotation || 0]));
  if (compositeCache[key]) return compositeCache[key];
  // Where a figure goes when the module is drawn at `size`; a figure keeps its own proportions (like a shape in a module)
  const place = (f, size) => {
    const k = size / R;
    const w = f.width * k, h = (f.height ?? f.width) * k;
    const def = Shapes[f.shape];
    const m = f.shape === "line" ? w : Math.max(w, h);
    const flat = !!def.skeleton || m <= 0;
    return { x: (f.x || 0) * k, y: (f.y || 0) * k, a: ((f.rotation || 0) * Math.PI) / 180, m, sx: flat ? 1 : w / m, sy: flat ? 1 : h / m };
  };
  // With a combine operation the shapes that have an area become ONE outline (union, subtract, intersect or exclude, in the order
  // of the list: subtract takes the rest away from the first); shapes that are only a line stay as they are. Computed once.
  let combined = null;
  const buildCombined = () => {
    if (combined) return combined;
    const regions = [], rest = [];
    for (const f of list) {
      const def0 = Shapes[f.shape];
      const region = def0.skeleton ? [] : shapeRegion(f, def0);
      if (region.length) regions.push(region); else rest.push(f);
    }
    let result = regions[0] || [];
    for (let i = 1; i < regions.length; i++) result = regionBoolean(op, result, regions[i]);
    combined = { contours: result, rest };
    return combined;
  };
  const def = {
    id: key,
    name: "Smart module",
    category: "smart",
    skeleton: list.length > 0 && list.every(f => !!Shapes[f.shape].skeleton),
    draw(ctx, size) {
      // One path for all the figures: a figure's own beginPath must not wipe the ones already added
      // An arc that starts a figure must not be joined by a line to the end of the previous figure: when no outline is
      // open, it starts at its own first point
      let first = true, open = false;
      const wrap = new Proxy(ctx, {
        get(target, prop) {
          if (prop === "beginPath") return () => { open = false; if (first) { target.beginPath(); first = false; } };
          if (prop === "closePath") return () => { open = false; target.closePath(); };
          if (prop === "moveTo" || prop === "lineTo" || prop === "bezierCurveTo" || prop === "quadraticCurveTo") {
            return (...a) => { open = true; return target[prop](...a); };
          }
          if (prop === "arc") {
            return (cx, cy, r, a0, a1, ccw) => {
              if (!open) target.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
              open = true;
              return target.arc(cx, cy, r, a0, a1, ccw);
            };
          }
          const v = target[prop];
          return typeof v === "function" ? v.bind(target) : v;
        },
        set(target, prop, v) { target[prop] = v; return true; }
      });
      let drawn = list;
      if (op === "none") {
        wrap.beginPath();
      } else {
        const cmb = buildCombined(), k = size / R;
        ctx.beginPath();
        first = false;
        for (const c of cmb.contours) {
          c.forEach((p, i) => (i ? ctx.lineTo(p.x * k, p.y * k) : ctx.moveTo(p.x * k, p.y * k)));
          ctx.closePath();
        }
        drawn = cmb.rest;
      }
      for (const f of drawn) {
        const p = place(f, size);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.scale(p.sx, p.sy);
        open = false;
        Shapes[f.shape].draw(wrap, p.m);
        ctx.restore();
      }
    },
    svgPath(size) {
      const r = (v) => Math.round(v * 1000) / 1000;
      let drawn = list, outline = "";
      if (op !== "none") {
        const cmb = buildCombined(), k = size / R;
        outline = cmb.contours.length ? `<path d="${cmb.contours.map(c => "M " + c.map(p => `${r(p.x * k)} ${r(p.y * k)}`).join(" L ") + " Z").join(" ")}" />` : "";
        drawn = cmb.rest;
      }
      return outline + drawn.map((f) => {
        const p = place(f, size);
        return `<g transform="translate(${r(p.x)} ${r(p.y)}) rotate(${r(f.rotation || 0)}) scale(${r(p.sx)} ${r(p.sy)})">${Shapes[f.shape].svgPath(p.m)}</g>`;
      }).join("");
    }
  };
  compositeCache[key] = def;
  Shapes[key] = def; // registered by id, so everything that looks a shape up by name finds it
  return def;
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
export function buildTexturedGeometry(shapeDef, size, tex, seed, strokeOnly, hairsOn = strokeOnly) {
  const base = flattenShape(shapeDef);
  const f = size / FLAT_REF_SIZE; // geometry scale
  const k = size / (shapeDef.textureRef || FLAT_REF_SIZE); // texture px are relative to the module size
  const jitter = (tex.jitter || 0) * k;
  const undulation = (tex.undulation || 0) * k * 0.7;
  const waves = Math.max(1, Math.min(6, Math.round(tex.waves ?? 2)));
  const waveRad = (((tex.waveAngle ?? 0) % 360) * Math.PI) / 180;
  // Skipping and random lines only read on strokes; they are ignored on filled shapes.
  const skipChance = strokeOnly ? (tex.skipChance || 0) / 100 : 0;
  // Random lines also show on filled shapes (the strands are strokes in the figure colour); not under a Space volume
  const crossing = hairsOn ? (tex.crossing || 0) / 100 : 0;
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

    // Plane wave: the whole module is bent like one sheet. A wave travels across it in one direction and every point
    // moves sideways to that direction by the wave at its own position (the same for every subpath and every module)
    if (undulation > 0 && n > 2) {
      const cosA = Math.cos(waveRad), sinA = Math.sin(waveRad);
      pts = pts.map((pt) => {
        const along = (pt.x * cosA + pt.y * sinA) / Math.max(1, size);
        const off = Math.sin(along * Math.PI * 2 * waves) * undulation;
        return { x: pt.x - sinA * off, y: pt.y + cosA * off, u: pt.u };
      });
    }

    // Jitter: per-vertex hand tremor
    if (jitter > 0) {
      pts.forEach((pt, p) => {
        pt.x += Math.sin(s * 13.1 + p * 37.3) * 0.5 * jitter;
        pt.y += Math.cos(s * 29.7 + p * 19.1) * 0.5 * jitter;
      });
    }

    // Random lines: fine strands that leave the outline like combed hair (a share of the vertices grows one).
    // They all lean the way the stroke runs, a few degrees off and with a slight bend, and the length varies: many short,
    // a few long (never more than 40 px). They are drawn thinner and fainter than the stroke (see texturedShape)
    const fract = (v) => v - Math.floor(v);
    const strays = [];
    // Line skipping decides which vertices are dropped; an edge touching a dropped vertex is not drawn, and hairs do not grow there
    const skipped = pts.map((pt, p) => skipChance > 0 && Math.abs(Math.sin(s * 43.1 + Math.floor(p / density) * 97.7)) < skipChance);
    if (crossing > 0 && n > 2) {
      // Places along the outline, one every ~0.6 % of the module (at most 500), each growing a hair by chance
      const origins = [];
      const hairGap = Math.max(1.5, size * 0.006);
      let toNext = 0; // distance left until the next place
      const segCount = sp.closed ? n : n - 1;
      for (let i = 0; i < segCount && origins.length < 500; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const L = Math.hypot(b.x - a.x, b.y - a.y);
        if (L === 0) continue;
        const ang0 = Math.atan2(b.y - a.y, b.x - a.x);
        let pos = toNext;
        while (pos <= L && origins.length < 500) {
          const t = pos / L;
          origins.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, along: ang0, gap: skipped[i] || skipped[(i + 1) % n] });
          pos += hairGap;
        }
        toNext = pos - L;
      }
      origins.forEach((pt, p) => {
        if (pt.gap) return;
        if (fract(Math.abs(Math.sin(s * 17.3 + p * 61.7)) * 1000) >= crossing) return;
        const u = fract(Math.abs(Math.cos(s * 7.9 + p * 23.1)) * 1000) * 2 - 1; // -1 to 1, squared so most are near parallel
        const ang = pt.along + u * Math.abs(u) * (Math.PI * 20) / 180;
        // Curvature: 10 to 60 % of a 90 degree bend over the length of the hair, to either side
        const cu = 0.1 + 0.5 * fract(Math.abs(Math.sin(s * 5.1 + p * 29.3)) * 1000);
        const bend = (fract(Math.abs(Math.sin(s * 8.7 + p * 41.9)) * 1000) < 0.5 ? -1 : 1) * cu * (Math.PI / 2);
        // Length: 1 to 50 % of the module (measured on a reference module of at most 100 px), many short and a few long
        const r = fract(Math.abs(Math.sin(s * 3.3 + p * 11.9)) * 1000);
        const len = Math.min(size, 100) * (0.01 + 0.49 * Math.pow(r, 2));
        // Thickness: one of four, from 10 to 80 % of the stroke (the strands are drawn in four strokes, one per thickness)
        const level = Math.min(3, Math.floor(fract(Math.abs(Math.cos(s * 2.9 + p * 17.3)) * 1000) * 4));
        const hair = [{ x: pt.x, y: pt.y }];
        for (let k = 1; k <= 4; k++) {
          const t = k / 4, a2 = ang + bend * t * t;
          const prev = hair[k - 1];
          hair.push({ x: prev.x + Math.cos(a2) * len / 4, y: prev.y + Math.sin(a2) * len / 4 });
        }
        hair.level = level;
        strays.push(hair);
      });
    }

    // Line skipping: drop vertices so the stroke breaks into segments
    const segments = [];
    if (skipChance > 0) {
      let seg = [];
      pts.forEach((pt, p) => {
        if (skipped[p]) { if (seg.length > 1) segments.push(seg); seg = []; }
        else seg.push(pt);
      });
      if (seg.length > 1) segments.push(seg);
    } else {
      segments.push(pts);
    }
    out.push({ segments, hairs: strays, closed: sp.closed && skipChance === 0 });
  });
  return out;
}

// Wraps a shape so every draw() emits the deformed geometry (works with every Space mode).
export function texturedShape(shapeDef, tex, seed, strokeOnly, hairsOn = strokeOnly) {
  return {
    ...shapeDef,
    draw(ctx, size) {
      const geo = buildTexturedGeometry(shapeDef, size, tex, seed, strokeOnly, hairsOn);
      // The strands go first, on their own: thinner and fainter than the stroke, which the caller draws afterwards
      if (geo.some(sp => sp.hairs && sp.hairs.length)) {
        ctx.save();
        if (!strokeOnly) ctx.strokeStyle = ctx.fillStyle; // a filled shape: the strands take its colour
        const baseWidth = ctx.lineWidth, baseAlpha = ctx.globalAlpha * Math.max(0.1, Math.min(1, (tex.hairOpacity ?? 85) / 100));
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let level = 0; level < 4; level++) {
          const part = 0.1 + (0.7 * level) / 3; // 10, 33, 57 and 80 % of the stroke: never as thick as the stroke
          ctx.beginPath();
          let any = false;
          for (const sp of geo) for (const hair of sp.hairs || []) {
            if (hair.level !== level) continue;
            any = true;
            hair.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
          }
          if (!any) continue;
          ctx.lineWidth = Math.max(0.3, baseWidth * part);
          ctx.globalAlpha = baseAlpha * (0.7 + 0.3 * (level / 3)); // the finer strands are fainter too
          ctx.stroke();
        }
        ctx.restore();
      }
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
