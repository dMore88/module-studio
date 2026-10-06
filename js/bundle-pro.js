// Standalone self-contained script for Module Studio
// Runs on both http:// (web server) and file:/// (local direct open)
(function() {
  'use strict';

  // Canvas and mathematical utilities for Wucius Wong Design Studio
const CanvasUtils = {
  // Setup crisp HiDPI canvas with deterministic logical coordinates
  setupCanvas(canvas, logicalW = 600, logicalH = 600) {
    const dpr = window.devicePixelRatio || 1;
    const targetW = logicalW;
    const targetH = logicalH;

    if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
      canvas.width = targetW * dpr;
      canvas.height = targetH * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { ctx, width: targetW, height: targetH, dpr };
  },

  // Color Palettes inspired by Swiss & Bauhaus Graphic Design
  palettes: {
    monochrome: {
      id: "monochrome",
      name: "Monochrome (Ink & Paper)",
      bg: "#FAFAFA",
      fg: "#111111",
      accent: "#E11D48",
      grid: "#E5E5E5",
      isDark: false
    },
    inverted: {
      id: "inverted",
      name: "Inverted (Chalkboard)",
      bg: "#121212",
      fg: "#F4F4F5",
      accent: "#F43F5E",
      grid: "#27272A",
      isDark: true
    },
    bauhaus: {
      id: "bauhaus",
      name: "Bauhaus Primary",
      bg: "#F7F4EB",
      fg: "#1E1E1E",
      accent: "#D9381E",
      secondary: "#0047AB",
      grid: "#E0DCCE",
      isDark: false
    },
    blueprint: {
      id: "blueprint",
      name: "Architectural Blueprint",
      bg: "#0B2545",
      fg: "#EEF4F8",
      accent: "#134074",
      grid: "#134074",
      isDark: true
    },
    sepia: {
      id: "sepia",
      name: "Warm Editorial Archive",
      bg: "#F5EFE6",
      fg: "#2F2519",
      accent: "#994D1C",
      grid: "#E4D9C8",
      isDark: false
    }
  },

  // Draw background and optional grid
  clear(ctx, width, height, palette, showGrid = false, gridSize = 40) {
    ctx.save();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    if (showGrid) {
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Subtle center crosshair
      ctx.strokeStyle = palette.accent;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }
    ctx.restore();
  },

  // Draw regular polygon
  drawPolygon(ctx, x, y, radius, sides, rotation = 0) {
    if (sides < 3) return;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = rotation + (i * 2 * Math.PI) / sides;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  },

  // Draw smooth teardrop shape (frequently used in Wong's similarity & concentration principles)
  drawTeardrop(ctx, x, y, width, length, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, length / 2);
    ctx.bezierCurveTo(width / 2, length / 4, width / 2, -length / 4, 0, -length / 2);
    ctx.bezierCurveTo(-width / 2, -length / 4, -width / 2, length / 4, 0, length / 2);
    ctx.closePath();
    ctx.restore();
  },

  // Draw Wong's classic "C-shape" / hollow cut-out ring
  drawCShape(ctx, x, y, outerR, innerR, cutAngle = Math.PI / 4, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    const startAngle = cutAngle / 2;
    const endAngle = 2 * Math.PI - cutAngle / 2;
    ctx.arc(0, 0, outerR, startAngle, endAngle, false);
    ctx.arc(0, 0, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.restore();
  },

  // Export current canvas to PNG download
  exportPNG(canvas, filename = "wong-design-study.png") {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  },

  // Export as SVG
  exportSVG(svgString, filename = "wong-design-study.svg") {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
};


  // The shapes available in the studio, in the order of the shape grid (6 per row).
// `phIcon` is the Phosphor icon name, rendered with the regular weight (`ph ph-<name>`); the ring has no Phosphor icon
// and the letters show their own glyph (see `glyph`).
const STUDIO_SHAPE_KEYS = [
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
const Shapes = {
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
// flattened into a polyline once, then jitter, undulation, strand crossing and
// line skipping are applied to its vertices. Deterministic per seed.
// ============================================================================

const FLAT_REF_SIZE = 100;
const FLAT_SPACING = 1.5; // dense sampling step at the reference size

const flatCache = {};

// Records a shape's draw() commands into dense polylines at the reference size.
function flattenShape(shapeDef) {
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
function morphedShape(defA, defB, amount) {
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
function buildTexturedGeometry(shapeDef, size, tex, seed, strokeOnly) {
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
function texturedShape(shapeDef, tex, seed, strokeOnly) {
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


  // Studio Composition Engine: Unified Grammar Pipeline for Wucius Wong 2D Design
const createDefaultLayerStructure = () => ({
  enabled: false,
  mode: "repetition", // "repetition" | "radiation"
  repetition: {
    gridType: "basic", // basic, sliding, sheared, curved, zigzag, triangular
    cols: 4,
    rows: 4,
    spacing: 0,
    shearAngle: 15,
    slideOffset: 0.5,
    freeSeed: 7, // Free distribution: changes the layout of the modules (1 to 99)
    curveAmount: 0.1, // Curved / Zigzag: how far the lines swing, as a share of the cell width (0 to 1)
    activeClipping: false,
    showGridLines: false,
    gridLineWidth: 1.5,
        lineColor: "", // empty = the layer's ink colour
    lineDirection: "both", // both, horizontal, vertical
    lineSpacing: "all", // all, alternate (every other line)
    reflection: "none", // none, columns, rows, both: mirror the module in alternate cells
    placement: "centers", // modules at the cell centres, at the line intersections or both (two classes interwoven, fig. 23)
    interScale: 50, // size (%) of the modules placed at the intersections
    cellMix: "none", // none, merge (some blocks of 2x2 cells become one big cell) or divide (some blocks split into smaller ones), fig. 22f-g
    direction: "repeated", // repeated (every module the same way), alternated (alternate cells turn 180°) or undefined (every module faces a different way)
    sizeMode: "fit", // fit (Fit to canvas: columns and rows divide the canvas, the module scales to its cell) or actual (Actual size: the module keeps its real size and is repeated columns x rows times)
    checkerInvert: false
  },
  radiation: {
    scheme: "centrifugal", // centrifugal, centripetal, concentric, spiral, multi_center
    orientation: "auto", // auto (by scheme), outward, inward, tangent, fixed
    centerOpen: 0, // open center: hole radius as a percentage of the radius (0 to 90)
    ringRotation: 0,
    centerCount: 2, // number of focal centres of the multi-center scheme (2 to 6)
    ringShape: "circle", // circle, triangle, square, pentagon, hexagon or octagon: the shape of every ring (Wong, fig. 49) // degrees each ring is rotated more than the previous one (-90 to 90)
    sizeMode: "fit", // fit (Fit to canvas) or actual (Actual size: each ring is as thick as the module)
    direction: "repeated", // repeated, alternated or undefined (see the repetition)
        lineColor: "", // empty = the layer's ink colour
    lineWidth: 1, // thickness of the visible rays and rings, 0.5 to 6 px
    rays: 12,
    rings: 6,
    spiralTwist: 45,
    activeClipping: false,
    showRays: false,
    showRings: false,
    checkerInvert: false,
    centerX: 0,
    centerY: 0
  },
  formalStructure: {
    enabled: false,
    colRatio: 1.0,
    rowRatio: 1.0,
    colGrade: 0, // gradation of structure: each column is this % wider (or narrower) than the one before (-30 to 30)
    rowGrade: 0, // the same for rows
    showGridLines: false
  },
  similarity: {
    enabled: false,
    kinshipType: "distortion",
    intensity: 50,
    cellJitter: 0, // old projects: random offset in px (kept only when cellJitterAmount is 0)
    cellJitterAmount: 0, // random offset as a share of the cell (0 to 0.9): 1 would take the centre to the cell edge
    association: "none", // none, round, angular, lines, characters: shapes of one family mixed into the population
    assocMix: 50, // % of the modules that change to another shape of the family
    imperfection: "none", // none, cut (a slice is cut off) or broken (split in two and shifted)
    imperfAmount: 30, // % of the modules that are imperfect
    seed: 42
  },
  gradation: {
    enabled: false,
    type: "rotation", // rotation, scale, depth, drift, shape, texture, color
    pathway: "diagonal", // diagonal, horizontal, vertical, concentric, zigzag
    range: 180, // degrees of total rotation (rotation type); 180 is the full reach for the other types
    steps: 1, // cycles (1 to 4)
    sequence: "restart", // restart (1-2-3-1-2-3) or pingpong (1-2-3-2-1)
    easing: 0, // -100 (starts fast, brakes) to 100 (starts slow, accelerates)
    alternate: false, // alternate rows (or columns) run in opposite directions
    targetShape: "triangle", // shape reached by the "shape" attribute
    endColor: "#f43f5e", // colour reached by the "color" attribute (the module colour is the start)
    reverse: false
  },
  anomaly: {
    enabled: false,
    type: "focal", // focal, fracture, swell, tear
    epicenterX: 0.5, // 0.1 to 0.9
    epicenterY: 0.5, // 0.1 to 0.9
    radius: 160, // 50 to 350 px
    intensity: 65, // severity, 10 to 100
    distribution: "single", // single (one epicenter), regular or random (several scattered anomalies)
    count: 5, // number of scattered anomalies (2 to 12)
    seed: 7, // random layout seed (1 to 99)
    attrs: { shape: true, scale: true, rotation: true, position: true }, // which attributes the anomaly deviates in
    anomalousShape: "triangle",
    zoneGrid: "sliding", // type "regrid": the grid variation inside the zone (brick, diagonal, curved, zigzag, triangular, alternating)
    highlightColor: false,
    accentColor: "#f43f5e", // color applied to anomalous modules when highlighted
    showReticle: true // the focal point is visible by default (click the canvas to move it)
  },
  contrast: {
    enabled: false,
    dimension: "scale", // scale, shape, direction, position, tone, texture, space
    dominanceRatio: 80, // % majority regular (50 to 95)
    spread: "scattered", // where the minority sits: scattered (at random), balanced (evenly spread), edge (pulled to the borders) or center
    contrastShape: "cross", // shape for shape contrast
    scaleFactor: 2.2, // scale multiplier for scale contrast (0.2 to 3.0)
    angle: 45, // clash angle for direction contrast
    toneAmount: 50, // tone contrast: how far the minority moves toward the ground colour (0 = same colour, 100 = the ground)
    positionShift: 25, // position contrast: how far the minority moves inside its cell (% of the cell)
    positionAngle: 45, // position contrast: the direction of that move (0 to 360 degrees)
    highlightContrast: false, // accentuate minority elements
    accentColor: "#f43f5e" // color applied to the minority when accentuated
  },
  concentration: {
    enabled: false,
    mode: "point", // point, void, line, line_void (away from a line), free (hotspots), dense, sparse (the whole design)
    method: "move", // move (modules are displaced) or absence (modules vanish with the density)
    edgeFade: false, // dense / sparse: the effect fades toward the edges of the canvas
    focusCount: 2, // hotspots: how many foci share the density (2 to 6)
    attractorX: 0.5, // 0.05 to 0.95
    attractorY: 0.5, // 0.05 to 0.95
    power: 50, // gathering pull, 20 to 100
    radius: 240, // field radius, 80 to 450 px
    lineAxis: "horizontal", // horizontal, vertical (line mode)
    alignToField: false,
    densityScale: false,
    showAttractor: false
  },
  texture: {
    enabled: false,
    jitter: 1, // px for a 100px module, 0 to 8
    skipChance: 10, // line skipping %, 0 to 60 (strokes only)
    crossing: 10, // strand crossing %, 0 to 60 (strokes only)
    undulation: 10 // perimeter undulation, px for a 100px module, 0 to 30
  },
  space: {
    enabled: false,
    mode: "isometric", // isometric, foreshortening, fluctuating, conflicting (paradox)
    depth: 10, // extrusion depth, 10 to 80 px
    angle: 30, // projection angle, -60 to 60
    shading: 50, // facet shading contrast, 20 to 100
    showIsoGuides: false
  }
});
const createDefaultLayer = (id = "layer-1", name = "Layer 1", shape = "circle", offsetX = 0, offsetY = 0, rotation = 0) => ({
  id,
  name,
  visible: true,
  enabled: true,
  shape,
  scale: 100,
  width: 100,
  height: 100,
  rotation,
  offsetX,
  offsetY,
  containerW: 0, // width of the module's container in px (0 = the whole canvas)
  containerH: 0, // height of the module's container in px (0 = the whole canvas)
  showContainer: true, // draw the container as a dashed frame on the canvas (an on-screen guide, never exported)
  clipContainer: false, // cut the module at the edge of its container (Clip cell, in Layout, cuts at the cell instead)
  wireframe: true,
  strokeWidth: 1,
  color: "#18181f",
  structure: createDefaultLayerStructure()
});

// The app opens with one round layer: a circle, 1 px stroke, no turn, 100 x 100, centred
const defaultLayer1 = createDefaultLayer("layer-1", "Layer 1", "circle", 0, 0, 0);
const defaultStudioState = {
  aspectRatio: "1:1",
  layers: [defaultLayer1],
  layerOrder: ["layer-1"],
  invertFigureGround: false,

  // Mat / Canvas display settings
  showSafeBounds: true,
  guideColor: "#f24822" // colour of every on-screen guide (container frame, reticle, attractor, isometric grid)
};

// Shapes of the same family, mixed by Similarity > Association
const SIMILARITY_FAMILIES = {
  round: ["circle", "ring", "semicircle", "quarter", "crescent", "spiral"],
  angular: ["square", "triangle", "pentagon", "hexagon", "octagon", "star", "arrow"],
  lines: ["line", "wave", "cross", "spiral"],
  characters: ["letterA", "letterS", "letterR", "digit1", "digit5", "digit9"]
};

// A module is drawn at exactly the size its Width and Height say (1 px per unit), on any canvas
const MODULE_UNIT = 1;

// Contrast, Anomaly and Concentration multiply the module scale; the product is capped so modules never explode
const MAX_SCALE_MUL = 8;

// Texture strength used by Gradation > Texture when the layer's own Texture is off
const GRADATION_TEXTURE = { jitter: 4, undulation: 14, skipChance: 25, crossing: 25 };
class StudioEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = JSON.parse(JSON.stringify(defaultStudioState));
  }

  // Draw a single shape: texture deformation, then flat or illusory 3D space.
  drawShape(ctx, shapeId, size, fgColor, strokeOnly = false, lineWidth = 2, bgColor = null, isAlternating = false, skipSpace = false, spaceConfig = null, textureConfig = null, seed = 0) {
    let shapeDef = Shapes[shapeId] || Shapes.circle;
    const space = spaceConfig;
    let texture = textureConfig;

    // Gradation > Shape: this module is part of the way to another shape
    if (this.cellMorph && Shapes[this.cellMorph.to] && this.cellMorph.amount > 0) {
      shapeDef = morphedShape(shapeDef, Shapes[this.cellMorph.to], this.cellMorph.amount);
    }
    // Gradation > Texture: the deformation grows along the path
    if (this.cellTexScale !== null && this.cellTexScale !== undefined) {
      const base = texture && texture.enabled ? texture : GRADATION_TEXTURE;
      const k = this.cellTexScale;
      texture = {
        enabled: true,
        jitter: (base.jitter || 0) * k,
        undulation: (base.undulation || 0) * k,
        skipChance: (base.skipChance || 0) * k,
        crossing: (base.crossing || 0) * k
      };
    }

    // Texture deforms the geometry itself, so it applies before any space mode.
    if (texture && texture.enabled) {
      shapeDef = texturedShape(shapeDef, texture, seed, strokeOnly);
    }

    // Open-path shapes (lines, digits...) are strokes: they stay flat.
    if (!space || !space.enabled || skipSpace || shapeDef.skeleton) {
      this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
      return;
    }

    this.drawSpatialShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor, isAlternating, space);
  }

  // Draw flat shape. Open-path shapes are strokes: thin in stroke mode, thick in fill mode.
  drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly = false, lineWidth = 2, bgColor = null) {
    ctx.save();
    ctx.fillStyle = fgColor;
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lineWidth;

    shapeDef.draw(ctx, size);

    if (shapeDef.skeleton) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = strokeOnly ? lineWidth : Math.max(size * 0.14, 2);
      ctx.stroke();
    } else if (strokeOnly) {
      ctx.stroke();
    } else {
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw illusory 3D spatial form (Space)
  drawSpatialShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor, isAlternating, space) {
    const mode = space.mode || "isometric";
    const rawDepth = space.depth ?? 35;
    const depth = rawDepth * Math.max(0.18, Math.min(1.4, size / 85));
    const angleRad = ((space.angle ?? 30) * Math.PI) / 180;
    const shading = (space.shading ?? 65) / 100;

    if (mode === "foreshortening") {
      // Fig. 73b: 3D Spatial Plane Tilt (Foreshortening)
      const tiltAmount = Math.sin(angleRad) * 0.45;
      const depthSquash = Math.max(0.2, 1 - (depth / 100) * 0.6);

      // Subtle cast shadow on ground plane
      ctx.save();
      ctx.translate(Math.cos(angleRad) * depth * 0.35, Math.sin(Math.abs(angleRad)) * depth * 0.4);
      ctx.scale(1, 0.28);
      ctx.fillStyle = fgColor;
      ctx.globalAlpha = 0.2 * shading;
      shapeDef.draw(ctx, size);
      ctx.fill();
      ctx.restore();

      // Floating tilted plane with depth projection
      ctx.save();
      ctx.transform(1, 0, tiltAmount, depthSquash, 0, 0);
      this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
      ctx.restore();

    } else if (mode === "fluctuating") {
      // Fig. 76b: Fluctuating Reversible Spatial Planes
      const dir = isAlternating ? -1 : 1;
      const totalDx = Math.cos(angleRad) * depth * dir;
      const totalDy = -Math.sin(angleRad) * depth * dir;
      const steps = Math.max(6, Math.min(20, Math.round(depth / 3)));

      if (strokeOnly) {
        // Wireframe fluctuating prism
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 0.35;
        shapeDef.draw(ctx, size);
        ctx.stroke();

        ctx.save();
        ctx.translate(totalDx, totalDy);
        ctx.globalAlpha = 1.0;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      } else {
        // Volumetric shaded slices with alternating facet contrast
        ctx.save();
        ctx.fillStyle = fgColor;
        const sideAlpha = isAlternating ? (0.2 + shading * 0.35) : (0.55 - shading * 0.25);
        ctx.globalAlpha = Math.max(0.12, Math.min(0.85, sideAlpha));

        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          ctx.save();
          ctx.translate(totalDx * t, totalDy * t);
          shapeDef.draw(ctx, size);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Front face
        ctx.save();
        ctx.translate(totalDx, totalDy);
        this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
        ctx.restore();
      }

    } else if (mode === "conflicting") {
      // Fig. 77: Conflicting Paradoxical Depth & Interlock
      const dx1 = Math.cos(angleRad) * depth * 0.85;
      const dy1 = -Math.sin(angleRad) * depth * 0.85;
      const dx2 = -Math.cos(angleRad) * depth * 0.65;
      const dy2 = Math.sin(angleRad) * depth * 0.65;

      if (strokeOnly) {
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = lineWidth;

        // Facet 1
        ctx.save();
        ctx.translate(dx1, dy1);
        ctx.globalAlpha = 0.5;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();

        // Center
        ctx.globalAlpha = 1.0;
        shapeDef.draw(ctx, size);
        ctx.stroke();

        // Facet 2
        ctx.save();
        ctx.translate(dx2, dy2);
        ctx.globalAlpha = 0.5;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      } else {
        // Secondary opposing paradoxical facet
        ctx.save();
        ctx.fillStyle = fgColor;
        ctx.globalAlpha = 0.3 * shading;
        for (let s = 1; s <= 6; s++) {
          const t = s / 6;
          ctx.save();
          ctx.translate(dx2 * t, dy2 * t);
          shapeDef.draw(ctx, size);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Primary forward facet
        ctx.save();
        ctx.fillStyle = fgColor;
        ctx.globalAlpha = 0.45 * shading;
        for (let s = 1; s <= 8; s++) {
          const t = s / 8;
          ctx.save();
          ctx.translate(dx1 * t, dy1 * t);
          shapeDef.draw(ctx, size);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Central plane
        this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);

        // Paradoxical interlock cut line
        ctx.save();
        ctx.strokeStyle = bgColor || (this.state.invertFigureGround ? "#111111" : "#FAFAFA");
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(dx1 * 0.45, dy1 * 0.45);
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      }

    } else {
      // Default: Fig. 74d Isometric Volumetric Extrusion
      const totalDx = Math.cos(angleRad) * depth;
      const totalDy = -Math.sin(angleRad) * depth;
      const steps = Math.max(8, Math.min(28, Math.round(depth / 2.2)));

      if (strokeOnly) {
        // Wireframe extrusion
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 0.35;
        shapeDef.draw(ctx, size);
        ctx.stroke();

        ctx.save();
        ctx.translate(totalDx, totalDy);
        ctx.globalAlpha = 1.0;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      } else {
        // Volumetric shaded extrusion body: the side is one solid tone (the figure mixed with the ground by the
        // shading), so its silhouette is clean; stacking see-through copies left a soft, lumpy edge
        ctx.save();
        const sideAlpha = 0.15 + (1 - shading * 0.7) * 0.45;
        const ground = bgColor || (this.state.invertFigureGround ? "#111111" : "#FAFAFA");
        ctx.fillStyle = this.mixHex(ground, fgColor, Math.max(0.12, Math.min(0.85, sideAlpha)));

        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          ctx.save();
          ctx.translate(totalDx * t, totalDy * t);
          shapeDef.draw(ctx, size);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Architectural facet edge contour
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3 * shading;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();

        // Front face
        ctx.save();
        ctx.translate(totalDx, totalDy);
        this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
        ctx.restore();
      }
    }
  }

  // Draw a single shape module for an individual layer
  drawSingleLayerShape(targetCtx, mod, sizeMultiplier = 1, fgColor = "#111111", bgColor = "#FAFAFA", wireframeOverride = null, shapeOverride = null, isCutout = false, colorOverride = null, widthMultiplier = null, stretch = null) {
    if (!mod) return;
    const shape = shapeOverride || mod.shape || "circle";
    const baseW = mod.width !== undefined ? mod.width : (mod.scale || 50);
    const baseH = mod.height !== undefined ? mod.height : (mod.scale || 50);
    // A line spans its cell width (widthMultiplier) instead of shrinking to the cell's short side.
    const kx = stretch ? stretch.x : 1, ky = stretch ? stretch.y : 1;
    const w = baseW * (widthMultiplier ?? sizeMultiplier * kx);
    const h = baseH * sizeMultiplier * ky;
    // Open-path shapes (lines, digits...) are strokes: a non-uniform scale would flatten their
    // thickness and deformation, so they keep a uniform scale. A line's length is its width.
    const isSkeleton = !!(Shapes[shape] && Shapes[shape].skeleton);
    const r = shape === "line" ? w : Math.max(w, h);
    const sx = !isSkeleton && r > 0 ? w / r : 1;
    const sy = !isSkeleton && r > 0 ? h / r : 1;
    const ox = (mod.offsetX || 0) * sizeMultiplier * kx;
    const oy = (mod.offsetY || 0) * sizeMultiplier * ky;
    const wire = wireframeOverride !== null ? wireframeOverride : (mod.wireframe !== false);
    const strokeW = mod.strokeWidth || 1.2;

    targetCtx.save();
    targetCtx.translate(ox, oy);
    targetCtx.rotate(((mod.rotation || 0) * Math.PI) / 180);
    targetCtx.scale(sx, sy);
    // A stretched shape keeps a uniform stroke: the outline is stretched, but the pen is not
    const stretched = Math.abs(sx - sy) > 1e-6;
    if (stretched) {
      targetCtx.stroke = function (...a) {
        this.save();
        this.scale(1 / sx, 1 / sy);
        Object.getPrototypeOf(this).stroke.apply(this, a);
        this.restore();
      };
    }
    // An explicit override (anomaly / contrast accent) wins over the layer color.
    const layerColor = colorOverride || mod.color || fgColor;
    const layerNum = parseInt(String(mod.id || "").replace(/\D/g, ""), 10) || 1;
    const seed = (this.cellSeed || 0) * 7.13 + layerNum * 53.7;
    const imp = this.cellImperf;
    this.cellImperf = null;
    const drawIt = () => this.drawShape(targetCtx, shape, r, layerColor, wire, strokeW, bgColor, !!this.cellAlt, isCutout, mod.structure?.space || null, mod.structure?.texture || null, seed);
    try {
      if (imp) this.drawImperfect(targetCtx, r, imp, drawIt); else drawIt();
    } finally {
      if (stretched) delete targetCtx.stroke;
    }
    this.cellMorph = null;
    this.cellTexScale = null;
    targetCtx.restore();
  }

  // Render an individual layer centered on the canvas (when no repetition/radiation layout active for this layer)
  renderSingleLayerModule(ctx, mod, width, height, palette) {
    if (!mod || mod.visible === false) return;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    this.cellSeed = 0;
    this.cellAlt = false;
    if (mod.clipContainer) {
      const cs = this.containerSize(mod, width, height);
      ctx.beginPath();
      ctx.rect(-cs.w / 2, -cs.h / 2, cs.w, cs.h);
      ctx.clip();
    }
    this.drawSingleLayerShape(ctx, mod, MODULE_UNIT, palette.fg, palette.bg);
    ctx.restore();
  }

  // Spatial cell jitter: the most a module can move away from its place, given the size of its cell.
  // cellJitterAmount is a share of the cell (the centre reaches the edge at 1); older projects kept pixels.
  jitterReach(sim, span) {
    if (sim.cellJitterAmount > 0) return sim.cellJitterAmount * span * 0.5;
    return sim.cellJitter > 0 ? sim.cellJitter : 0;
  }

  // Build the boundary path for a cell in the given grid variation
  // Curved, zigzag and sheared grids: how far the vertical lines are pushed sideways at height y.
  // Curved is one wave over the whole grid; zigzag goes through the middle of each row (alternately + and -).
  gridShift(rep, y) {
    const f = this.gridFrame;
    if (!f) return 0;
    // curveAmount is a share of the cell width; projects saved before it existed keep their pixels (curveIntensity)
    const I = rep.curveAmount !== undefined ? rep.curveAmount * (f.cw || 0) : (rep.curveIntensity || 0);
    if (rep.gridType === "curved") return Math.sin(((y - f.top) / Math.max(1, f.h)) * Math.PI * 2) * I;
    if (rep.gridType === "sheared") return (y - (f.top + f.h / 2)) * 0.6 * Math.tan(((rep.shearAngle || 0) * Math.PI) / 180);
    const mids = f.rowY, n = mids.length;
    const z = (r) => (r % 2 === 0 ? 1 : -1) * I;
    if (y <= mids[0]) return z(0);
    if (y >= mids[n - 1]) return z(n - 1);
    let r = 0;
    while (r < n - 2 && y > mids[r + 1]) r++;
    const t = (y - mids[r]) / Math.max(1e-6, mids[r + 1] - mids[r]);
    return z(r) + (z(r + 1) - z(r)) * t;
  }

  buildCellPath(ctx, r, c, rows, cols, cx, cy, cW, cH, rep, startX) {
    ctx.beginPath();
    if (rep.gridType === "hexagonal") {
      const s = cH / 1.5; // vertical radius of the hexagon
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + cW / 2, cy - s / 2);
      ctx.lineTo(cx + cW / 2, cy + s / 2);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - cW / 2, cy + s / 2);
      ctx.lineTo(cx - cW / 2, cy - s / 2);
    } else if (rep.gridType === "triangular") {
      const isUp = (r + c) % 2 === 0;
      if (isUp) {
        ctx.moveTo(cx, cy - cH / 2);
        ctx.lineTo(cx + cW * 0.55, cy + cH / 2);
        ctx.lineTo(cx - cW * 0.55, cy + cH / 2);
      } else {
        ctx.moveTo(cx, cy + cH / 2);
        ctx.lineTo(cx + cW * 0.55, cy - cH / 2);
        ctx.lineTo(cx - cW * 0.55, cy - cH / 2);
      }
    } else if (rep.gridType === "curved" || rep.gridType === "zigzag" || rep.gridType === "sheared") {
      // The cell's sides follow the very same line the grid draws (see gridShift), so what is clipped matches what is seen
      const top = cy - cH / 2, steps = rep.gridType === "curved" ? 8 : rep.gridType === "sheared" ? 1 : 2;
      const ys = Array.from({ length: steps + 1 }, (_, i) => top + (cH * i) / steps);
      ys.forEach((y, i) => { const x = startX + this.gridShift(rep, y); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      for (let i = steps; i >= 0; i--) ctx.lineTo(startX + cW + this.gridShift(rep, ys[i]), ys[i]);
    } else {
      // Basic orthogonal, sliding, alternating
      ctx.rect(cx - cW / 2, cy - cH / 2, cW, cH);
    }
    ctx.closePath();
  }

  // ---- Shared modifier logic (used by both the grid and the radial layouts) ----

  // Concentration: pulls/pushes a module position toward an attractor.
  // Returns the new position, the flow angle and a density scale multiplier.
  // Hotspot foci: the attractor and its copies turned around the centre of the canvas (two foci = the mirror pair)
  hotspots(conc, width, height) {
    const attX = (conc.attractorX ?? 0.5) * width, attY = (conc.attractorY ?? 0.5) * height;
    const n = Math.max(2, Math.min(6, Math.round(conc.focusCount || 2)));
    if (n === 2) return [{ x: attX, y: attY }, { x: width - attX, y: height - attY }];
    const cx = width / 2, cy = height / 2, dx = attX - cx, dy = attY - cy;
    return Array.from({ length: n }, (_, k) => {
      const a = (k * Math.PI * 2) / n, c = Math.cos(a), s = Math.sin(a);
      return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
    });
  }

  applyConcentration(conc, px, py, width, height) {
    let x = px, y = py, angle = 0, scaleMul = 1.0;
    const attX = (conc.attractorX ?? 0.5) * width;
    const attY = (conc.attractorY ?? 0.5) * height;
    const power = (conc.power ?? 65) / 100;
    const radius = conc.radius ?? 240;
    const vertical = conc.lineAxis === "vertical";

    // Concentration by absence: modules stay where they are and vanish with the density field.
    // `keep` is the chance (0..1) that this module is drawn; the caller rolls the dice.
    if (conc.method === "absence" && conc.mode !== "dense" && conc.mode !== "sparse") {
      let dist;
      if (conc.mode === "line" || conc.mode === "line_void") dist = vertical ? Math.abs(x - attX) : Math.abs(y - attY);
      else if (conc.mode === "free") dist = Math.min(...this.hotspots(conc, width, height).map(f => Math.hypot(x - f.x, y - f.y)));
      else dist = Math.hypot(x - attX, y - attY);
      const prox = Math.pow(Math.max(0, 1 - dist / radius), 1.4);
      const repel = conc.mode === "void" || conc.mode === "line_void";
      return { x, y, angle: 0, scaleMul: 1, keep: repel ? 1 - power * prox : 1 - power * (1 - prox) };
    }

    // The whole design: super-concentration pulls every module toward the centre, de-concentration
    // pushes them away. With the edge fade the effect weakens toward the edges of the canvas.
    if (conc.mode === "dense" || conc.mode === "sparse") {
      const k = conc.mode === "dense" ? 1 - power * 0.6 : 1 + power * 0.8;
      let t = 1;
      if (conc.edgeFade) {
        const reach = Math.hypot(Math.max(attX, width - attX), Math.max(attY, height - attY)) || 1;
        t = Math.max(0, 1 - Math.hypot(x - attX, y - attY) / reach);
      }
      const kk = 1 + (k - 1) * t;
      return { x: attX + (x - attX) * kk, y: attY + (y - attY) * kk, angle: 0, scaleMul: 1, keep: 1 };
    }

    // From a line: the inverse of Line, modules are pushed away from it
    if (conc.mode === "line_void") {
      const d = vertical ? x - attX : y - attY;
      const dist = Math.abs(d);
      if (dist < radius) {
        const factor = Math.pow(1 - dist / radius, 1.2) * power;
        const push = (d >= 0 ? 1 : -1) * factor * (radius * 0.55);
        if (vertical) { x += push; angle = d >= 0 ? 0 : Math.PI; } else { y += push; angle = d >= 0 ? Math.PI / 2 : -Math.PI / 2; }
        if (conc.densityScale) scaleMul = 0.4 + (dist / radius) * 0.8;
      }
      return { x, y, angle, scaleMul, keep: 1 };
    }

    if (conc.mode === "point") {
      const dist = Math.hypot(x - attX, y - attY);
      if (dist < radius) {
        const factor = Math.pow(1 - dist / radius, 1.4) * power;
        const pull = factor * (radius * 0.45);
        const a = Math.atan2(attY - y, attX - x);
        x += Math.cos(a) * pull;
        y += Math.sin(a) * pull;
        angle = a;
        if (conc.densityScale) scaleMul = 0.55 + (dist / radius) * 0.7;
      }
    } else if (conc.mode === "void") {
      const dist = Math.hypot(x - attX, y - attY);
      if (dist < radius) {
        const factor = Math.pow(1 - dist / radius, 1.2) * power;
        const push = factor * (radius * 0.55);
        const a = Math.atan2(y - attY, x - attX);
        x += Math.cos(a) * push;
        y += Math.sin(a) * push;
        angle = a + Math.PI / 2;
        if (conc.densityScale) scaleMul = 0.4 + (dist / radius) * 0.8;
      }
    } else if (conc.mode === "line") {
      if (conc.lineAxis === "vertical") {
        const distX = Math.abs(x - attX);
        if (distX < radius) {
          const factor = Math.pow(1 - distX / radius, 1.4) * power;
          x += (attX - x) * factor * 0.75;
          angle = (attX >= x ? 0 : Math.PI);
          if (conc.densityScale) scaleMul = 0.65 + (distX / radius) * 0.6;
        }
      } else {
        const distY = Math.abs(y - attY);
        if (distY < radius) {
          const factor = Math.pow(1 - distY / radius, 1.4) * power;
          y += (attY - y) * factor * 0.75;
          angle = (attY >= y ? Math.PI / 2 : -Math.PI / 2);
          if (conc.densityScale) scaleMul = 0.65 + (distY / radius) * 0.6;
        }
      }
    } else if (conc.mode === "free") {
      let nearestDist = Infinity, targetX = attX, targetY = attY;
      for (const f of this.hotspots(conc, width, height)) {
        const d = Math.hypot(x - f.x, y - f.y);
        if (d < nearestDist) { nearestDist = d; targetX = f.x; targetY = f.y; }
      }
      if (nearestDist < radius) {
        const factor = Math.pow(1 - nearestDist / radius, 1.4) * power;
        const pull = factor * (radius * 0.4);
        const a = Math.atan2(targetY - y, targetX - x);
        x += Math.cos(a) * pull;
        y += Math.sin(a) * pull;
        angle = a;
        if (conc.densityScale) scaleMul = 0.65 + (nearestDist / radius) * 0.6;
      }
    }
    return { x, y, angle, scaleMul, keep: 1 };
  }

  // Gradation: position along the pathway (0..1) of a grid cell.
  gradationPathGrid(grad, r, c, rows, cols) {
    let t = 0;
    if (grad.pathway === "horizontal") {
      t = cols > 1 ? c / (cols - 1) : 0;
    } else if (grad.pathway === "vertical") {
      t = rows > 1 ? r / (rows - 1) : 0;
    } else if (grad.pathway === "diagonal") {
      t = (cols + rows > 2) ? (c + r) / (cols + rows - 2) : 0;
    } else if (grad.pathway === "concentric") {
      const dc = c - (cols - 1) / 2;
      const dr = r - (rows - 1) / 2;
      const maxD = Math.sqrt(Math.pow((cols - 1) / 2, 2) + Math.pow((rows - 1) / 2, 2)) || 1;
      t = Math.sqrt(dc * dc + dr * dr) / maxD;
    } else if (grad.pathway === "zigzag") {
      // Snake: even rows run left to right, odd rows right to left
      const n = rows * cols;
      t = n > 1 ? (r * cols + (r % 2 === 0 ? c : cols - 1 - c)) / (n - 1) : 0;
      return t;
    }
    if (grad.alternate) {
      const odd = grad.pathway === "vertical" ? c % 2 === 1 : r % 2 === 1;
      if (odd) t = this.gradationFlip(grad, t);
    }
    return t;
  }

  // Same for a polar cell: ring i (1..rings), ray j (0..rays-1).
  gradationPathRadial(grad, i, j, rings, rays) {
    if (grad.pathway === "zigzag") {
      const n = rings * rays;
      const ring = i - 1;
      return n > 1 ? (ring * rays + (ring % 2 === 0 ? j : rays - 1 - j)) / (n - 1) : 0;
    }
    const byRing = grad.pathway === "concentric" || grad.pathway === "diagonal";
    let t = byRing ? i / rings : j / rays;
    if (grad.alternate) {
      const odd = byRing ? j % 2 === 1 : (i - 1) % 2 === 1;
      if (odd) t = this.gradationFlip(grad, t);
    }
    return t;
  }

  // Gradation > Alternate rows: the odd rows run the other way. A ping-pong goes up and back down the same
  // way whichever side it starts from, so there the odd rows are half a cycle out of step instead.
  gradationFlip(grad, t) {
    return grad.sequence === "pingpong" ? t + 0.5 / (grad.steps || 1) : 1 - t;
  }

  // Gradation: turns the position t into the strength 0..1 of the effect for this cell
  // (direction, number of cycles, restart or ping-pong, acceleration).
  gradationValue(grad, t) {
    const pingpong = grad.sequence === "pingpong";
    // Reverse: the path runs the other way; a ping-pong is the same both ways, so it starts at the other end instead
    if (grad.reverse && !pingpong) t = 1 - t;
    let u = (t * (grad.steps || 1)) % 1.0001;
    if (pingpong) u = 1 - Math.abs(2 * u - 1);
    const easing = grad.easing || 0;
    if (easing !== 0) u = Math.pow(Math.max(u, 0), Math.pow(3, easing / 100));
    if (grad.reverse && pingpong) u = 1 - u;
    return u;
  }

  // Gradation > Color: the module colour moves toward the end colour (set by applyGradation for this cell)
  applyGradationColor(grad, palette, cell) {
    const mix = this.cellColorMix;
    this.cellColorMix = null;
    if (mix === null || mix === undefined || !grad.enabled || cell.fgLocked) return;
    const start = cell.fg === palette.fg ? (cell.base || cell.fg) : cell.fg;
    cell.fg = this.mixHex(start, grad.endColor || "#f43f5e", mix);
  }

  // Gradation: applies the attribute for position t along the pathway.
  // `driftDistance` is the full slide length for the current layout.
  applyGradation(ctx, grad, pathT, driftDistance) {
    const t = this.gradationValue(grad, pathT);
    const rangeK = (grad.range ?? 180) / 180;

    if (grad.type === "rotation") {
      ctx.rotate(t * (((grad.range ?? 180) * Math.PI) / 180));
    } else if (grad.type === "scale") {
      // Range scales the amount of change; 180 keeps the original 0.35x to 1.45x
      const sFactor = Math.max(0.05, 0.9 + (t - 0.5) * 1.1 * rangeK);
      ctx.scale(sFactor, sFactor);
    } else if (grad.type === "depth") {
      ctx.rotate(Math.PI / 6);
      ctx.scale(1, Math.max(0.18, 1 - t * 0.82 * rangeK));
      ctx.rotate(-Math.PI / 6);
    } else if (grad.type === "drift") {
      ctx.translate(t * driftDistance * rangeK, 0);
    } else if (grad.type === "shape") {
      this.cellMorph = { to: grad.targetShape || "triangle", amount: Math.min(1, t * rangeK) };
    } else if (grad.type === "texture") {
      this.cellTexScale = Math.min(2, t * rangeK);
    } else if (grad.type === "color") {
      this.cellColorMix = Math.min(1, t * rangeK);
    }
  }

  // Similarity > Association: a shape of the chosen family for this module, or null to keep its own.
  similarityShape(sim, pRand) {
    const family = SIMILARITY_FAMILIES[sim.association];
    if (!family) return null;
    if ((pRand(61) + 1) / 2 >= (sim.assocMix ?? 50) / 100) return null;
    return family[Math.floor(((pRand(62) + 1) / 2) * family.length) % family.length];
  }

  // Similarity > Imperfection: how this module is cut or broken, or null when it is whole.
  similarityImperfection(sim, pRand) {
    if (sim.imperfection !== "cut" && sim.imperfection !== "broken") return null;
    if ((pRand(63) + 1) / 2 >= (sim.imperfAmount ?? 30) / 100) return null;
    return { mode: sim.imperfection, angle: pRand(64) * Math.PI, pos: pRand(65) * 0.3, gap: 0.05 + 0.07 * Math.abs(pRand(66)) };
  }

  // Draws a module cut by a straight line (cut: one side is lost) or split along it (broken: the two
  // halves are pulled apart and slid). `size` is the module's size; `drawIt` draws it whole.
  drawImperfect(ctx, size, imp, drawIt) {
    const R = size * 2 + 100;
    const cut = imp.pos * size;
    const half = (side) => {
      ctx.beginPath();
      if (side < 0) ctx.rect(-R, -R, R + cut, 2 * R); else ctx.rect(cut, -R, R, 2 * R);
      ctx.clip();
    };
    if (imp.mode === "cut") {
      ctx.save();
      ctx.rotate(imp.angle);
      half(-1);
      ctx.rotate(-imp.angle);
      drawIt();
      ctx.restore();
      return;
    }
    const g = imp.gap * size;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(imp.angle);
      half(side);
      ctx.translate(side * g * 0.5, side * g * 0.4);
      ctx.rotate(-imp.angle);
      drawIt();
      ctx.restore();
    }
  }

  // Similarity: module kinship transform driven by the cell's PRNG.
  applySimilarity(ctx, sim, pRand) {
    const intensity = (sim.intensity ?? 50) / 100;
    if (sim.kinshipType === "distortion") {
      const sx = 1 + pRand(1) * intensity * 0.65;
      const sy = 1 + pRand(2) * intensity * 0.65;
      ctx.scale(sx, sy);
    } else if (sim.kinshipType === "foreshortening") {
      const rot = pRand(3) * Math.PI;
      const tilt = Math.max(0.18, 1 - Math.abs(pRand(4)) * intensity * 0.82);
      ctx.rotate(rot);
      ctx.scale(1, tilt);
      ctx.rotate(-rot);
    } else if (sim.kinshipType === "rotation_wobble") {
      const wobble = pRand(5) * intensity * (Math.PI / 2);
      ctx.rotate(wobble);
    } else if (sim.kinshipType === "scale_kinship") {
      const sFactor = Math.max(0.2, 1 + pRand(6) * intensity * 0.7);
      ctx.scale(sFactor, sFactor);
    } else if (sim.kinshipType === "hybrid") {
      const sx = 1 + pRand(1) * intensity * 0.35;
      const sy = 1 + pRand(2) * intensity * 0.35;
      const wobble = pRand(5) * intensity * 0.4;
      ctx.rotate(wobble);
      ctx.scale(sx, sy);
    }
  }

  // The canvas margin where layouts stop. 0: the design runs to the edge of the canvas.
  safeMargin(width, height) {
    return 0;
  }

  // Direction "undefined": an angle (0..2π) that looks random but is always the same for a given cell
  cellDirection(a, b) {
    const h = Math.sin((a * 127.1 + b * 311.7 + 74.7) * 43758.5453);
    return (h - Math.floor(h)) * Math.PI * 2;
  }

  // The module's container: a frame centred on the canvas that the module is composed in.
  // Actual size repeats it as it is; 0 means the whole canvas.
  containerSize(mod, width, height) {
    return {
      w: mod && mod.containerW > 0 ? mod.containerW : width,
      h: mod && mod.containerH > 0 ? mod.containerH : height
    };
  }

  // Epicenters of the anomaly: one, or several scattered in a regular or random layout.
  anomalySpots(anom, width, height) {
    const mode = anom.distribution || "single";
    if (mode === "single") return [{ x: (anom.epicenterX ?? 0.5) * width, y: (anom.epicenterY ?? 0.5) * height }];
    const n = Math.max(2, Math.min(12, anom.count || 5));
    const key = `${mode}|${n}|${anom.seed}|${width}|${height}`;
    if (this._spotsKey === key) return this._spots;
    const spots = [];
    if (mode === "regular") {
      const cols = Math.max(1, Math.round(Math.sqrt(n * width / height)));
      const rows = Math.ceil(n / cols);
      for (let k = 0; k < n; k++) {
        const r = Math.floor(k / cols), c = k % cols;
        spots.push({ x: ((c + 0.5 + (r % 2 === 1 ? 0.5 : 0)) / (cols + 0.5)) * width, y: ((r + 0.5) / rows) * height });
      }
    } else {
      // seeded random positions, kept apart from each other
      let s = ((anom.seed || 7) * 2654435761) >>> 0;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const minGap = Math.min(width, height) * 0.2;
      for (let k = 0; k < n; k++) {
        let p;
        for (let tries = 0; tries < 40; tries++) {
          p = { x: width * (0.08 + 0.84 * rnd()), y: height * (0.08 + 0.84 * rnd()) };
          if (spots.every(q => Math.hypot(q.x - p.x, q.y - p.y) >= minGap)) break;
        }
        spots.push(p);
      }
    }
    this._spotsKey = key;
    this._spots = spots;
    return spots;
  }

  // Anomaly: (ex, ey) is the module position compared with the nearest epicenter.
  // Updates `cell` ({shape, fg, scaleMul}); returns false when the module vanishes (tear).
  // An anomaly is a local rupture, so it claims the shape and the accent colour (shapeLocked / fgLocked)
  // and Contrast, a statistical spread, does not override them.
  applyAnomaly(ctx, anom, ex, ey, width, height, palette, pRand, cell) {
    let epiX = 0, epiY = 0, dist = Infinity;
    for (const spot of this.anomalySpots(anom, width, height)) {
      const d = Math.hypot(ex - spot.x, ey - spot.y);
      if (d < dist) { dist = d; epiX = spot.x; epiY = spot.y; }
    }
    // The anomaly may deviate in some attributes only and respect the others
    const attrs = anom.attrs || {};
    const on = (k) => attrs[k] !== false;
    const inZone = dist < anom.radius;
    const factor = inZone ? (1 - dist / anom.radius) : 0;
    const severity = (anom.intensity ?? 65) / 100;
    const accent = anom.accentColor || palette.accent;

    if (anom.type === "focal") {
      if (inZone) {
        if (on("shape")) {
          cell.shape = anom.anomalousShape || "triangle";
          cell.shapeLocked = true;
        }
        if (on("rotation")) ctx.rotate((Math.PI / 4) * severity * factor);
        if (on("scale")) cell.scaleMul *= (1 + 0.35 * severity);
        if (anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; }
      }
    } else if (anom.type === "regrid") {
      // The change of grid is made by the layout itself; the zone can still be tinted
      if (inZone && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; }
    } else if (anom.type === "fracture") {
      const corridor = anom.radius * 0.45;
      if (inZone && Math.abs(ex - epiX) < corridor) {
        const jag = Math.sin(ey * 0.08) * (18 * severity);
        const shearY = (ey > epiY ? 1 : -1) * (36 * severity) + jag;
        const shearX = (ex > epiX ? 1 : -1) * (10 * severity);
        if (on("position")) ctx.translate(shearX, shearY);
        if (on("rotation")) ctx.rotate((factor * severity * Math.PI) / 3.2);
        if (factor > 0.4 && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; }
      }
    } else if (anom.type === "swell") {
      if (inZone) {
        const angle = Math.atan2(ey - epiY, ex - epiX);
        const push = Math.sin(factor * Math.PI) * (42 * severity);
        if (on("position")) ctx.translate(Math.cos(angle) * push, Math.sin(angle) * push);
        const sFactor = 1 + factor * 0.55 * severity;
        if (on("scale")) ctx.scale(sFactor, sFactor);
        if (factor > 0.65 && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; }
      }
    } else if (anom.type === "tear") {
      if (factor > 0.6) {
        return false; // disintegrated void
      } else if (factor > 0.15) {
        // Shattered debris
        if (on("position")) ctx.translate(pRand(51) * 26 * severity, pRand(52) * 26 * severity);
        if (on("rotation")) ctx.rotate(pRand(53) * Math.PI * severity);
        const shrink = Math.max(0.15, 1 - factor * 0.85);
        if (on("scale")) ctx.scale(shrink, shrink);
        if (anom.highlightColor && factor > 0.3) { cell.fg = accent; cell.fgLocked = true; }
      }
    }
    return true;
  }

  // Contrast: is the module with running index `k` part of the minority?
  // `loc` is the module's place: its column and row (a, b) and its position in the canvas (x, y, 0 to 1).
  isContrastMinority(contrast, k, loc = null) {
    const hash = Math.abs(Math.sin(k * 137.5 + 43.1) * 10000) % 100;
    const ratio = contrast.dominanceRatio ?? 80;
    const spread = contrast.spread || "scattered";
    if (!loc || spread === "scattered") return hash >= ratio;
    if (spread === "balanced") {
      // A lattice sequence: the minority is spread evenly, with no clumps and no gaps
      const u = (loc.a * 0.7548776662 + loc.b * 0.5698402910) % 1;
      return u * 100 >= ratio;
    }
    // Edge / center: the farther toward the edge (or the middle), the likelier; a little chance keeps it alive
    const d = Math.min(1, Math.max(Math.abs(loc.x - 0.5), Math.abs(loc.y - 0.5)) * 2);
    const p = spread === "edge" ? d * d : 1 - d * d;
    return (p * 0.8 + (hash / 100) * 0.2) * 100 >= ratio;
  }

  // Contrast: `k` is the module's running index, used to pick the minority.
  // The "space" dimension (figure and ground reversed) is drawn by the layouts, before the module.
  // Mix two #rrggbb colours: t = 0 gives a, t = 1 gives b
  mixHex(a, b, t) {
    const parse = (c) => {
      const m = /^#([0-9a-f]{6})$/i.exec(c || "");
      return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) : null;
    };
    const pa = parse(a), pb = parse(b);
    if (!pa || !pb) return a;
    return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  applyContrast(ctx, contrast, k, palette, cell, loc = null) {
    if (!this.isContrastMinority(contrast, k, loc)) return;
    if (contrast.dimension === "scale") {
      cell.scaleMul *= contrast.scaleFactor ?? 2.2;
    } else if (contrast.dimension === "shape") {
      if (!cell.shapeLocked) cell.shape = contrast.contrastShape || "cross";
    } else if (contrast.dimension === "direction") {
      ctx.rotate(((contrast.angle ?? 45) * Math.PI) / 180);
    } else if (contrast.dimension === "position") {
      // The minority sits off-centre in its cell (a share of the cell's smaller side, in the chosen direction)
      const a = ((contrast.positionAngle ?? 45) * Math.PI) / 180, d = ((contrast.positionShift ?? 25) / 100) * (cell.unit || 0);
      ctx.translate(Math.cos(a) * d, Math.sin(a) * d);
    } else if (contrast.dimension === "tone") {
      // A different tone of the module's own colour (lighter, toward the ground): works for fill and for stroke
      if (!cell.fgLocked && cell.fg === palette.fg) cell.fg = this.mixHex(cell.base || cell.fg, palette.bg, (contrast.toneAmount ?? 50) / 100);
    } else if (contrast.dimension === "texture") {
      cell.texScale = 1; // only the minority is textured
    }
    if (contrast.highlightContrast && !cell.fgLocked) {
      cell.fg = contrast.accentColor || palette.accent;
    }
  }

  // Anomaly reticle guide overlay
  drawAnomalyReticle(ctx, width, height, palette, anom) {
    ctx.save();
    ctx.strokeStyle = this.guideColor();
    ctx.lineWidth = 1;
    for (const spot of this.anomalySpots(anom, width, height)) {
      const epiX = spot.x, epiY = spot.y;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(epiX, epiY, anom.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(epiX, epiY, 6, 0, Math.PI * 2);
      ctx.moveTo(epiX - 14, epiY);
      ctx.lineTo(epiX + 14, epiY);
      ctx.moveTo(epiX, epiY - 14);
      ctx.lineTo(epiX, epiY + 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Free distribution: n points that keep a similar space around each one (best-candidate blue noise),
  // ordered row by row so the (row, column) index still follows the layout. Deterministic for a given seed.
  freePoints(n, x0, y0, x1, y1, seed, cols, rows) {
    let a = (seed * 2654435761) >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    const bs = Math.max(1, Math.sqrt((w * h) / Math.max(1, n)));
    const bw = Math.ceil(w / bs) + 1;
    const buckets = new Map();
    const key = (x, y) => Math.floor((y - y0) / bs) * bw + Math.floor((x - x0) / bs);
    const pts = [];
    const nearest = (x, y) => {
      let best = Infinity;
      const bx = Math.floor((x - x0) / bs), by = Math.floor((y - y0) / bs);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const list = buckets.get((by + dy) * bw + (bx + dx));
        if (!list) continue;
        for (const p of list) { const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < best) best = d; }
      }
      return best;
    };
    for (let i = 0; i < n; i++) {
      let bestPt = null, bestD = -1;
      const tries = i === 0 ? 1 : 8;
      for (let k = 0; k < tries; k++) {
        const x = x0 + rnd() * w, y = y0 + rnd() * h;
        const d = i === 0 ? 0 : Math.min(nearest(x, y), bs * bs * 9);
        if (d > bestD) { bestD = d; bestPt = { x, y }; }
      }
      pts.push(bestPt);
      const kk = key(bestPt.x, bestPt.y);
      if (!buckets.has(kk)) buckets.set(kk, []);
      buckets.get(kk).push(bestPt);
    }
    // Row by row: sort by height, then each row of `cols` points left to right
    pts.sort((p, q) => p.y - q.y);
    const out = [];
    for (let r = 0; r < rows; r++) out.push(...pts.slice(r * cols, (r + 1) * cols).sort((p, q) => p.x - q.x));
    return out;
  }

  // Render the repetition / structural grid with similarity and gradation kinematics
  renderRepetitionGrid(ctx, width, height, palette, marginParam, usableWParam, usableHParam, targetMod = null, repConfig = null) {
    if (!targetMod || !targetMod.structure) return;
    this.cellMorph = null;
    this.cellTexScale = null;
    this.cellColorMix = null;
    this.cellImperf = null;
    const rep = repConfig || targetMod.structure.repetition;
    const struct = targetMod.structure.formalStructure;
    const sim = targetMod.structure.similarity;
    const grad = targetMod.structure.gradation;
    const anom = targetMod.structure.anomaly;
    const contrast = targetMod.structure.contrast;
    const conc = targetMod.structure.concentration;

    const margin = marginParam !== undefined ? marginParam : this.safeMargin(width, height);
    const usableW = usableWParam !== undefined ? usableWParam : width - margin * 2;
    const usableH = usableHParam !== undefined ? usableHParam : height - margin * 2;

    // Actual size: the container (a frame the module is composed in) is the cell and is repeated as it
    // is, columns x rows times, in a block centred on the canvas. A block bigger than the canvas runs
    // past its edges. Fit to canvas: the cell is the canvas divided by columns and rows.
    const isFixed = rep.sizeMode === "actual" || rep.sizeMode === "fixed";
    const cont = this.containerSize(targetMod, width, height);
    const customContainer = targetMod.containerW > 0 || targetMod.containerH > 0;
    const fixedCW = Math.max(10, cont.w);
    const fixedCH = Math.max(10, cont.h);
    const hexFixedPitch = fixedCW * 0.866;
    const cols = Math.max(1, rep.cols);
    const rows = Math.max(1, rep.rows);

    // Gradation of structure: every column / row is a fixed % bigger than the one before (kept in a sane range)
    const gC = Math.max(-0.3, Math.min(0.3, (Number(struct && struct.enabled ? struct.colGrade : 0) || 0) / 100));
    const gR = Math.max(-0.3, Math.min(0.3, (Number(struct && struct.enabled ? struct.rowGrade : 0) || 0) / 100));
    const gradeC = (c) => Math.max(0.05, Math.min(20, Math.pow(1 + gC, c)));
    const gradeR = (r) => Math.max(0.05, Math.min(20, Math.pow(1 + gR, r)));
    // Calculate column widths and x positions (Dual rhythmic interval support)
    const colWidths = [];
    const colX = [];
    const colStarts = [];
    const isColRhythmic = !isFixed && !!(struct && struct.enabled && (struct.colRatio !== undefined || struct.mode === "rhythmic"));
    if (isFixed) {
      // Rhythm in Actual size: the A columns are the container; the B columns are Col ratio times narrower
      const rhythmic = !!(struct && struct.enabled && rep.gridType !== "hexagonal");
      const rA = rhythmic ? Math.max(1, Number(struct.colRatio) || 1) : 1;
      const widths = Array.from({ length: cols }, (_, c) => (fixedCW * gradeC(c)) / (c % 2 === 0 ? 1 : rA));
      const total = widths.reduce((a, b) => a + b, 0);
      let currX = margin + usableW / 2 - total / 2;
      for (let c = 0; c < cols; c++) {
        colStarts.push(currX);
        colWidths.push(widths[c]);
        colX.push(currX + widths[c] / 2);
        currX += widths[c];
      }
    } else if (isColRhythmic) {
      const rA = Number(struct.colRatio) || 1.0;
      let weightSum = 0;
      for (let c = 0; c < cols; c++) {
        weightSum += (c % 2 === 0 ? rA : 1.0) * gradeC(c);
      }
      const unitW = usableW / weightSum;
      let currX = margin;
      for (let c = 0; c < cols; c++) {
        const w = (c % 2 === 0 ? rA : 1.0) * gradeC(c) * unitW;
        colStarts.push(currX);
        colWidths.push(w);
        colX.push(currX + w / 2);
        currX += w;
      }
    } else {
      const cellW = usableW / cols;
      for (let c = 0; c < cols; c++) {
        colStarts.push(margin + c * cellW);
        colWidths.push(cellW);
        colX.push(margin + (c + 0.5) * cellW);
      }
    }

    // Calculate row heights and y positions (Dual rhythmic interval support)
    const rowHeights = [];
    const rowY = [];
    const rowStarts = [];
    const isRowRhythmic = !isFixed && !!(struct && struct.enabled && (struct.rowRatio !== undefined || struct.mode === "rhythmic"));
    if (isFixed) {
      const isHexRows = rep.gridType === "hexagonal";
      const rowRhythm = !!(struct && struct.enabled && !isHexRows);
      const rB = rowRhythm ? Math.max(1, Number(struct.rowRatio) || 1) : 1;
      const heights = Array.from({ length: rows }, (_, r) => ((isHexRows ? hexFixedPitch : fixedCH) * gradeR(r)) / (r % 2 === 0 ? 1 : rB));
      const totalH = heights.reduce((a, b) => a + b, 0);
      let currY = margin + usableH / 2 - totalH / 2;
      for (let r = 0; r < rows; r++) {
        rowStarts.push(currY);
        rowHeights.push(heights[r]);
        rowY.push(currY + heights[r] / 2);
        currY += heights[r];
      }
    } else if (isRowRhythmic) {
      const rA = Number(struct.rowRatio) || 1.0;
      let weightSum = 0;
      for (let r = 0; r < rows; r++) {
        weightSum += (r % 2 === 0 ? rA : 1.0) * gradeR(r);
      }
      const unitH = usableH / weightSum;
      let currY = margin;
      for (let r = 0; r < rows; r++) {
        const h = (r % 2 === 0 ? rA : 1.0) * gradeR(r) * unitH;
        rowStarts.push(currY);
        rowHeights.push(h);
        rowY.push(currY + h / 2);
        currY += h;
      }
    } else {
      const cellH = usableH / rows;
      for (let r = 0; r < rows; r++) {
        rowStarts.push(margin + r * cellH);
        rowHeights.push(cellH);
        rowY.push(margin + (r + 0.5) * cellH);
      }
    }

    // Wrap in outer bounding clip so shapes never bleed outside master safe bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin, margin, usableW, usableH);
    ctx.clip();

    const seed = sim.seed || 42;

    // Hexagonal grid: rows interlock, so the row pitch is 0.866 of the cell width (squeezed if it does not fit)
    const isHex = rep.gridType === "hexagonal";
    // Free distribution: no grid, modules keep a similar space around each one
    const isFree = rep.gridType === "free";
    let freePts = null, freeW = 0, freeH = 0;
    if (isFree) {
      freeW = isFixed ? fixedCW : usableW / cols;
      freeH = isFixed ? fixedCH : usableH / rows;
      const bw = isFixed ? cols * fixedCW : usableW, bh = isFixed ? rows * fixedCH : usableH;
      const fx0 = isFixed ? margin + usableW / 2 - bw / 2 : margin, fy0 = isFixed ? margin + usableH / 2 - bh / 2 : margin;
      freePts = this.freePoints(cols * rows, fx0 + freeW / 2, fy0 + freeH / 2, fx0 + bw - freeW / 2, fy0 + bh - freeH / 2, rep.freeSeed || 7, cols, rows);
    }
    // Rhythm scales the space: the A column and row keep the module's size, the B ones shrink it in proportion
    const rhythmOn = !isHex && !isFree && !!(struct && struct.enabled) && ((Number(struct.colRatio) || 1) !== 1 || (Number(struct.rowRatio) || 1) !== 1 || gC !== 0 || gR !== 0);
    const refW = colWidths[0], refH = rowHeights[0];
    const hexPitch = isFixed ? hexFixedPitch : Math.min(colWidths[0] * 0.866, usableH / rows);
    // Far edges of the grid (the canvas edge in fit mode; past it in fixed mode)
    const colEdge = isFixed ? colStarts[cols - 1] + colWidths[cols - 1] : margin + usableW;
    const rowEdge = isFixed ? rowStarts[rows - 1] + rowHeights[rows - 1] : margin + usableH;
    this.gridFrame = { top: rowStarts[0], h: rowEdge - rowStarts[0], rowY, cw: (colEdge - colStarts[0]) / cols };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cW = colWidths[c];
        let cH = isHex ? hexPitch : rowHeights[r];
        let cx = colX[c];
        let cy = rowY[r];
        if (isHex) cy = margin + usableH / 2 + (r - (rows - 1) / 2) * hexPitch;
        let startX = colStarts[c];
        if (isFree) { const fp = freePts[r * cols + c]; cW = freeW; cH = freeH; cx = fp.x; cy = fp.y; startX = cx - cW / 2; }

        // Anomaly "Another grid": inside the zone the cells follow a different grid variation
        let gt = rep.gridType;
        if (anom && anom.enabled && anom.type === "regrid" && anom.zoneGrid && anom.zoneGrid !== gt && !isHex && !isFree && anom.zoneGrid !== "hexagonal") {
          for (const spot of this.anomalySpots(anom, width, height)) {
            if (Math.hypot(colX[c] - spot.x, rowY[r] - spot.y) < anom.radius) { gt = anom.zoneGrid; break; }
          }
        }
        const repCell = gt === rep.gridType ? rep : Object.assign(Object.create(rep), { gridType: gt });

        // Apply grid deformations to center coordinates
        if (gt === "sliding") {
          if (r % 2 === 1) cx += cW * rep.slideOffset;
        } else if (gt === "curved" || gt === "zigzag" || gt === "sheared") {
          cx += this.gridShift(repCell, cy);
        } else if (gt === "triangular" || isHex) {
          if (r % 2 === 1) cx += cW * 0.5;
        }

        // Similarity PRNG helper
        const pRand = (salt) => {
          const x = Math.sin(seed * 997 + r * 1337 + c * 31 + salt * 101) * 10000;
          return (x - Math.floor(x)) * 2 - 1; // -1 to 1
        };

        // Similarity: cell spatial jitter
        if (sim.enabled) {
          cx += pRand(10) * this.jitterReach(sim, cW);
          cy += pRand(11) * this.jitterReach(sim, cH);
        }

        // Concentration: field displacement and density
        let concAngle = 0;
        let concScaleMul = 1.0;
        if (conc && conc.enabled) {
          const f = this.applyConcentration(conc, cx, cy, width, height);
          cx = f.x;
          cy = f.y;
          concAngle = f.angle;
          concScaleMul = f.scaleMul;
          // Concentration by absence: this module vanishes with the density
          if (f.keep < 1 && (pRand(70) + 1) / 2 >= f.keep) continue;
        }

        const renderCell = (cellCx, cellCy, cellStartX, k = 1) => {
          ctx.save();
          const extra = k !== 1; // an interwoven, merged or divided module: it keeps the cell's look but not its frame

          const isOddCell = (r + c) % 2 === 1;
          let fgColor = palette.fg;
          let bgColor = palette.bg;
          let flipped = false;

          // Checkerboard inversion; Contrast > Space reverses figure and ground in the minority (the two cancel out)
          const spaceFlip = !!(contrast.enabled && contrast.dimension === "space" && this.isContrastMinority(contrast, r * cols + c, { a: c, b: r, x: cx / width, y: cy / height }));
          if (!extra && (rep.checkerInvert && isOddCell) !== spaceFlip) {
            ctx.save();
            this.buildCellPath(ctx, r, c, rows, cols, cellCx, cellCy, cW, cH, repCell, cellStartX);
            // The cell takes the module's own colour and the module is drawn in the ground colour
            const figColor = targetMod.color || palette.fg;
            ctx.fillStyle = figColor;
            ctx.fill();
            ctx.restore();
            fgColor = palette.bg;
            bgColor = figColor;
            flipped = true;
          }

          // Clip cell: cut the module at the edge of its cell (the real shape of the cell in every grid variation)
          if (rep.activeClipping && !extra) {
            this.buildCellPath(ctx, r, c, rows, cols, cellCx, cellCy, cW, cH, repCell, cellStartX);
            ctx.clip();
          }
          // Clip container: cut it at the edge of its container (in Fit to canvas the container shrinks with the cell;
          // in Actual size it is the cell). Both clips can be on: the module is cut by the two
          if (targetMod.clipContainer && !extra) {
            // The container keeps its own proportions and shrinks with the same scale as the module (Figma frame inside a frame)
            const rk = rhythmOn ? Math.min(MAX_SCALE_MUL, Math.min(cW / refW, rowHeights[r] / refH)) : 1;
            const sBase = isFixed ? rk : (rhythmOn ? Math.min(refW / usableW, refH / usableH) * rk : Math.min(cW / usableW, cH / usableH));
            const bw = cont.w * sBase, bh = cont.h * sBase;
            ctx.beginPath();
            ctx.rect(cellCx - bw / 2, cellCy - bh / 2, bw, bh);
            ctx.clip();
          }

          ctx.translate(cellCx, cellCy);

        // Concentration directional flow
        if (conc && conc.enabled && conc.alignToField && concAngle !== 0) {
          ctx.rotate(concAngle);
        }

        // Alternating mirror / rotation
        if (gt === "alternating" && isOddCell) {
          ctx.rotate(Math.PI);
        }
        // Direction: repeated (as it is), alternated (alternate cells turn 180°) or undefined (each one different)
        if (rep.direction === "alternated" && isOddCell && gt !== "alternating") {
          ctx.rotate(Math.PI);
        } else if (rep.direction === "undefined") {
          ctx.rotate(this.cellDirection(r, c));
        }

        // Gradation kinematics across Cartesian pathways
        if (grad.enabled) {
          this.applyGradation(ctx, grad, this.gradationPathGrid(grad, r, c, rows, cols), cW * 0.28);
        }

        // Similarity: Module Kinship & Fluctuation
        if (sim.enabled) this.applySimilarity(ctx, sim, pRand);
        const simShape = sim.enabled ? this.similarityShape(sim, pRand) : null;
        this.cellImperf = sim.enabled ? this.similarityImperfection(sim, pRand) : null;

        // Anomaly & Contrast Modifiers
        const cell = { shape: simShape, wireframe: null, fg: fgColor, scaleMul: 1, unit: Math.min(cW, cH) * k, base: targetMod.color || fgColor };
        if (anom.enabled && !this.applyAnomaly(ctx, anom, cx, cy, width, height, palette, pRand, cell)) {
          ctx.restore();
          return;
        }
        if (contrast.enabled) this.applyContrast(ctx, contrast, r * cols + c, palette, cell, { a: c, b: r, x: cx / width, y: cy / height });
        this.applyGradationColor(grad, palette, cell);
        const cellShapeA = cell.shape;
        const cellWireframe = cell.wireframe;
        const cellFg = cell.fg;
        const cellBg = bgColor;
        const cellScaleMul = cell.scaleMul;

        const scaleUnit = MODULE_UNIT;
        const cellRatio = rhythmOn ? Math.min(refW / usableW, refH / usableH) : Math.min(cW / usableW, cH / usableH);
        // A module keeps its proportions: it shrinks with the smaller side of its column and row (Wong: a repeated figure is not deformed)
        const rhythmK = rhythmOn ? Math.min(MAX_SCALE_MUL, Math.min(cW / refW, rowHeights[r] / refH)) : 1;
        const stretch = rhythmOn ? { x: rhythmK, y: rhythmK } : null;
        const normScale = isFixed
          ? scaleUnit * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul) * k
          : scaleUnit * cellRatio * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul) * k;
        if (cell.texScale) this.cellTexScale = Math.max(this.cellTexScale || 0, cell.texScale);
        this.cellSeed = r * cols + c + 1;
        this.cellAlt = (r + c) % 2 === 1;
        // Reflection: mirror the module in alternate columns and/or rows
        const refl = rep.reflection || "none";
        if ((refl === "columns" || refl === "both") && c % 2 === 1) ctx.scale(-1, 1);
        if ((refl === "rows" || refl === "both") && r % 2 === 1) ctx.scale(1, -1);
        const lineWidthMul = !isFixed && (cellShapeA || targetMod.shape) === "line" ? scaleUnit * (cW / usableW) * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul) * k : null;
        this.drawSingleLayerShape(ctx, targetMod, normScale, cellFg, cellBg, cellWireframe, cellShapeA, false, cellFg !== fgColor || flipped ? cellFg : null, lineWidthMul, stretch);
        ctx.restore();
      };

      // Placement: centres, intersections or both; mixed sizes: some 2x2 blocks merged or divided
      const place = isHex || isFree ? "centers" : (rep.placement || "centers");
      const mix = rep.gridType === "basic" || rep.gridType === "alternating" ? (rep.cellMix || "none") : "none";
      const bigBlock = mix !== "none" && ((r >> 1) + (c >> 1)) % 2 === 0 && 2 * (r >> 1) + 1 < rows && 2 * (c >> 1) + 1 < cols;
      if (place !== "intersections") {
        if (bigBlock && mix === "merge") {
          if (r % 2 === 0 && c % 2 === 0) {
            renderCell((colX[c] + colX[c + 1]) / 2 + (cx - colX[c]), (rowY[r] + rowY[r + 1]) / 2 + (cy - rowY[r]), startX, 2);
          }
        } else if (bigBlock && mix === "divide") {
          for (const dy of [-1, 1]) for (const dx of [-1, 1]) renderCell(cx + dx * cW / 4, cy + dy * cH / 4, startX, 0.5);
        } else {
          renderCell(cx, cy, startX);
        }
      }
      if (place !== "centers") {
        const interK = Math.max(0.05, (rep.interScale ?? 50) / 100);
        const left = cx - cW / 2, top = cy - cH / 2, right = cx + cW / 2, bottom = cy + cH / 2;
        renderCell(left, top, startX, interK);
        if (c === cols - 1) renderCell(right, top, startX, interK);
        if (r === rows - 1) renderCell(left, bottom, startX, interK);
        if (c === cols - 1 && r === rows - 1) renderCell(right, bottom, startX, interK);
      }

      // Hexagonal grid: the half-cell shift pushes the last cell out, so it also appears at the left edge
      if (place !== "intersections" && isHex && r % 2 === 1 && c === cols - 1) {
        renderCell(cx - usableW, cy, startX - usableW);
      }

      // Seamless repeat wrapping in sliding (brick) grid
      if (place !== "intersections" && rep.gridType === "sliding" && r % 2 === 1) {
        const slide = rep.slideOffset ?? 0.5;
        if (slide > 0 && c === cols - 1) {
          renderCell(cx - usableW, cy, startX - usableW);
        } else if (slide < 0 && c === 0) {
          renderCell(cx + usableW, cy, startX + usableW);
        }
      }
    }
  }

    ctx.restore(); // end outer clip

    // Optional visible structure grid lines
    const showLines = !!(rep.showGridLines || (struct && (struct.showGridLines || (struct.enabled && struct.showBands))));
    const bandLines = !!(struct && struct.enabled && struct.showBands);
    // Visible lines are part of the design (Wong): they have their own colour and width and are exported
    if (showLines && !isFree) {
      ctx.save();
      ctx.strokeStyle = rep.lineColor || targetMod.color || palette.fg;
      ctx.lineWidth = bandLines ? struct.bandThickness : (rep.gridLineWidth || 1.2);
      const dir = rep.lineDirection || "both";
      const showH = dir !== "vertical";
      const showV = dir !== "horizontal";
      const alt = rep.lineSpacing === "alternate"; // every other line

      if (isHex) {
        // Honeycomb: every cell outline (direction and spacing do not apply)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cy = margin + usableH / 2 + (r - (rows - 1) / 2) * hexPitch;
            const shiftX = r % 2 === 1 ? colWidths[c] * 0.5 : 0;
            for (const off of (r % 2 === 1 && c === cols - 1 ? [0, -usableW] : [0])) {
              this.buildCellPath(ctx, r, c, rows, cols, colX[c] + shiftX + off, cy, colWidths[c], hexPitch, rep, colStarts[c]);
              ctx.closePath();
              ctx.stroke();
            }
          }
        }
      } else {
        // Draw horizontal lines
        if (showH) {
          for (let r = 0; r <= rows; r++) {
            if (alt && r % 2 === 1) continue;
            const y = r === rows ? rowEdge : rowStarts[r];
            ctx.beginPath();
            ctx.moveTo(margin, y);
            ctx.lineTo(margin + usableW, y);
            ctx.stroke();
          }
        }

        if (showV && rep.gridType === "sliding") {
          // True running-bond staggered vertical brick joints
          for (let r = 0; r < rows; r++) {
            const yTop = rowStarts[r];
            const yBot = r === rows - 1 ? rowEdge : rowStarts[r + 1];
            const isShifted = r % 2 === 1;
            const shift = isShifted ? colWidths[0] * (rep.slideOffset ?? 0.5) : 0;

            // Left border
            ctx.beginPath();
            ctx.moveTo(margin, yTop);
            ctx.lineTo(margin, yBot);
            ctx.stroke();

            // Internal vertical joints
            for (let c = 0; c <= cols; c++) {
              if (alt && c % 2 === 1) continue;
              const rawX = (c === cols ? colEdge : colStarts[c]) + shift;
              let x = rawX;
              if (isShifted && x > margin + usableW + 0.1) {
                x -= usableW;
              }
              if (x > margin + 0.5 && x < margin + usableW - 0.5) {
                ctx.beginPath();
                ctx.moveTo(x, yTop);
                ctx.lineTo(x, yBot);
                ctx.stroke();
              }
            }

            // Right border
            ctx.beginPath();
            ctx.moveTo(margin + usableW, yTop);
            ctx.lineTo(margin + usableW, yBot);
            ctx.stroke();
          }
        } else if (showV) {
          // Draw vertical / deformed lines
          for (let c = 0; c <= cols; c++) {
            if (alt && c % 2 === 1) continue;
            const baseX = c === cols ? colEdge : colStarts[c];
            ctx.beginPath();

            if (rep.gridType === "sheared") {
              const gt0 = this.gridFrame.top, gt1 = gt0 + this.gridFrame.h;
              ctx.moveTo(baseX + this.gridShift(rep, gt0), gt0);
              ctx.lineTo(baseX + this.gridShift(rep, gt1), gt1);
            } else if (rep.gridType === "curved") {
              const top = this.gridFrame.top, steps = 40;
              for (let st = 0; st <= steps; st++) {
                const y = top + (st / steps) * this.gridFrame.h;
                if (st === 0) ctx.moveTo(baseX + this.gridShift(rep, y), y); else ctx.lineTo(baseX + this.gridShift(rep, y), y);
              }
            } else if (rep.gridType === "zigzag") {
              // Through the top, the middle and the bottom of every row: the same line the cells are cut by
              const ys = [rowStarts[0]];
              for (let r = 0; r < rows; r++) ys.push(rowY[r], r === rows - 1 ? rowEdge : rowStarts[r + 1]);
              ys.forEach((y, i) => { if (i === 0) ctx.moveTo(baseX + this.gridShift(rep, y), y); else ctx.lineTo(baseX + this.gridShift(rep, y), y); });
            } else {
              ctx.moveTo(baseX, margin);
              ctx.lineTo(baseX, margin + usableH);
            }
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }

    // Anomaly reticle guide overlay
    if (anom.enabled && anom.showReticle && !this.exporting) this.drawAnomalyReticle(ctx, width, height, palette, anom);

    // Concentration attractor guide overlay
    if (conc && conc.enabled && conc.showAttractor && !this.exporting) {
      this.drawAttractorGuide(ctx, width, height, palette, conc);
    }
  }

  // Render the polar radiation layout (Radiation)
  renderRadiation(ctx, width, height, palette, marginParam, usableWParam, usableHParam, targetMod = null, radConfig = null) {
    if (!targetMod || !targetMod.structure) return;
    this.cellMorph = null;
    this.cellTexScale = null;
    this.cellColorMix = null;
    this.cellImperf = null;
    const rad = radConfig || targetMod.structure.radiation;
    const grad = targetMod.structure.gradation;
    const sim = targetMod.structure.similarity;
    const anom = targetMod.structure.anomaly;
    const contrast = targetMod.structure.contrast;
    const conc = targetMod.structure.concentration;

    const margin = marginParam !== undefined ? marginParam : this.safeMargin(width, height);
    const usableW = usableWParam !== undefined ? usableWParam : width - margin * 2;
    const usableH = height - margin * 2;
    const isMultiCenter = rad.scheme === "multi_center";
    // Fit: the last ring reaches the edge of the canvas (a circle inscribed in it), like the cells of a grid; with several centres the foci sit 35 % of the radius from the middle, so the whole stays inside
    const refR = Math.min(usableW, usableH) * (isMultiCenter ? 0.37 : 0.5);

    const cx = width / 2 + (rad.centerX || 0);
    const cy = height / 2 + (rad.centerY || 0);

    const rays = Math.max(3, rad.rays);
    const twistRad = ((rad.spiralTwist || 0) * Math.PI) / 180;
    // Open center: the rings start at the hole radius instead of the centre
    const openR = refR * Math.max(0, Math.min(90, rad.centerOpen || 0)) / 100;

    // Actual size: the module keeps its real size and each ring is as thick as the container's height, so the
    // structure can run past the canvas. In fit mode the rings divide a set radius.
    const isFixed = rad.sizeMode === "actual" || rad.sizeMode === "fixed";
    const spacing = Math.max(10, this.containerSize(targetMod, width, height).h);
    const rings = Math.max(2, rad.rings);
    let maxR = refR;
    if (isFixed) maxR = openR + rings * spacing;
    const span = maxR - openR;
    // Each ring is turned a bit more than the one inside it, so their subdivisions do not line up
    const ringRotRad = ((rad.ringRotation || 0) * Math.PI) / 180;

    // Ring shape: a regular polygon (circumradius = the ring radius) instead of a circle. Not for spirals or chevrons.
    const polySides = ({ triangle: 3, square: 4, pentagon: 5, hexagon: 6, octagon: 8 })[rad.ringShape] || 0;
    const polyOn = polySides > 0 && rad.scheme !== "spiral" && rad.scheme !== "centripetal";
    const polyOff = -Math.PI / 2 + (polySides % 2 === 0 ? Math.PI / Math.max(1, polySides) : 0); // a point up, or a flat side up
    // Radius of the polygon along the angle th, once the polygon is turned by `shift`
    const shapeR = (r, th, shift = 0) => {
      if (!polyOn) return r;
      const step = (Math.PI * 2) / polySides;
      let a = (th - shift - polyOff) % step;
      if (a < 0) a += step;
      return (r * Math.cos(Math.PI / polySides)) / Math.cos(a - Math.PI / polySides);
    };
    const polyPath = (c, r, shift) => {
      for (let k = 0; k < polySides; k++) {
        const a = polyOff + shift + (k * Math.PI * 2) / polySides;
        if (k === 0) ctx.moveTo(c.x + r * Math.cos(a), c.y + r * Math.sin(a));
        else ctx.lineTo(c.x + r * Math.cos(a), c.y + r * Math.sin(a));
      }
      ctx.closePath();
    };

    // Centers list (if multi_center, we have two focal centers creating Moiré)
    // Multi-center: 2 to 8 foci spread evenly on a small circle (two foci sit left and right of the middle)
    const centerCount = Math.max(2, Math.min(8, Math.round(rad.centerCount || 2)));
    const centers = isMultiCenter
      ? centerCount === 2
        ? [{ x: cx - refR * 0.35, y: cy }, { x: cx + refR * 0.35, y: cy }]
        : Array.from({ length: centerCount }, (_, k) => {
            const a = Math.PI + (k * Math.PI * 2) / centerCount;
            return { x: cx + refR * 0.35 * Math.cos(a), y: cy + refR * 0.35 * Math.sin(a) };
          })
      : [{ x: cx, y: cy }];

    // Clip to master safe bounds area
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin, margin, usableW, usableH);
    ctx.clip();

    const seed = sim.seed || 42;

    centers.forEach((center, centerIdx) => {
      for (let i = 1; i <= rings; i++) {
        const rInner = openR + ((i - 1) / rings) * span;
        const rOuter = openR + (i / rings) * span;
        const ringRadius = (rInner + rOuter) * 0.5;
        const ringShift = (i - 1) * ringRotRad;

        for (let j = 0; j < rays; j++) {
          const rayAngleStart = (j / rays) * Math.PI * 2 + ringShift;
          const rayAngleEnd = ((j + 1) / rays) * Math.PI * 2 + ringShift;
          const baseAngle = (rayAngleStart + rayAngleEnd) * 0.5;
          let angle = baseAngle;

          // Spiral twist
          const twistFraction = ringRadius / maxR;
          if (rad.scheme === "spiral") {
            angle += twistRad * twistFraction;
          }

          const posR = shapeR(ringRadius, angle, ringShift);
          const x = center.x + posR * Math.cos(angle);
          const y = center.y + posR * Math.sin(angle);

          let posX = x;
          let posY = y;
          let concAngle = 0;
          let concScaleMul = 1.0;

          if (conc && conc.enabled) {
            const f = this.applyConcentration(conc, posX, posY, width, height);
            posX = f.x;
            posY = f.y;
            concAngle = f.angle;
            concScaleMul = f.scaleMul;
            if (f.keep < 1) {
              const h = Math.sin(seed * 997 + (i * 100 + j + centerIdx * 1000) * 31 + 70 * 101) * 10000;
              if ((h - Math.floor(h)) >= f.keep) continue;
            }
          }

          // Soft edge bounding so modules stay comfortably within the canvas
          if (!isFixed) {
            const safePad = Math.max(12, margin * 0.4);
            posX = Math.max(safePad, Math.min(width - safePad, posX));
            posY = Math.max(safePad, Math.min(height - safePad, posY));
          }

          ctx.save();

          // The polar sector of this module (used to clip it and to reverse figure and ground)
          const sectorPath = () => {
            ctx.beginPath();
            if (polyOn) {
              const N = 8;
              for (let s = 0; s <= N; s++) {
                const a = rayAngleStart + ((rayAngleEnd - rayAngleStart) * s) / N;
                const rr = shapeR(rOuter, a, ringShift);
                if (s === 0) ctx.moveTo(center.x + rr * Math.cos(a), center.y + rr * Math.sin(a));
                else ctx.lineTo(center.x + rr * Math.cos(a), center.y + rr * Math.sin(a));
              }
              if (rInner > 0.5) {
                for (let s = N; s >= 0; s--) {
                  const a = rayAngleStart + ((rayAngleEnd - rayAngleStart) * s) / N;
                  const rr = shapeR(rInner, a, ringShift);
                  ctx.lineTo(center.x + rr * Math.cos(a), center.y + rr * Math.sin(a));
                }
              } else {
                ctx.lineTo(center.x, center.y);
              }
              ctx.closePath();
              return;
            }
            let aOuterStart = rayAngleStart;
            let aOuterEnd = rayAngleEnd;
            let aInnerStart = rayAngleStart;
            let aInnerEnd = rayAngleEnd;

            if (rad.scheme === "spiral") {
              aOuterStart += twistRad * (rOuter / maxR);
              aOuterEnd += twistRad * (rOuter / maxR);
              aInnerStart += twistRad * (rInner / maxR);
              aInnerEnd += twistRad * (rInner / maxR);
            }

            ctx.arc(center.x, center.y, rOuter, aOuterStart, aOuterEnd, false);
            if (rInner > 0.5) {
              ctx.arc(center.x, center.y, rInner, aInnerEnd, aInnerStart, true);
            } else {
              ctx.lineTo(center.x, center.y);
            }
            ctx.closePath();
          };

          // Active clipping: restrict drawing strictly to polar sector boundaries
          if (rad.activeClipping) {
            sectorPath();
            ctx.clip();
          }

          // Contrast > Space: the minority is drawn with figure and ground reversed
          const spaceFlip = !!(contrast.enabled && contrast.dimension === "space" && this.isContrastMinority(contrast, centerIdx * 1000 + i * rays + j, { a: j, b: i, x: x / width, y: y / height }));
          if (spaceFlip) {
            ctx.save();
            sectorPath();
            ctx.fillStyle = palette.fg;
            ctx.fill();
            ctx.restore();
          }

          const pRand = (salt) => {
            const val = Math.sin(seed * 997 + (i * 100 + j + centerIdx * 1000) * 31 + salt * 101) * 10000;
            return (val - Math.floor(val)) * 2 - 1;
          };

          if (sim && sim.enabled) {
            const reach = this.jitterReach(sim, Math.min(rOuter - rInner, (Math.PI * 2 * ringRadius) / rays));
            posX += pRand(10) * reach;
            posY += pRand(11) * reach;
          }

          ctx.translate(posX, posY);

          // Concentration directional flow
          if (conc && conc.enabled && conc.alignToField && concAngle !== 0) {
            ctx.rotate(concAngle);
          }

          // Base radiation orientation: where the top of the module points
          const orient = rad.orientation || "auto";
          if (orient === "outward") {
            ctx.rotate(angle + Math.PI / 2);
          } else if (orient === "inward") {
            ctx.rotate(angle - Math.PI / 2);
          } else if (orient === "tangent") {
            ctx.rotate(angle);
          } else if (orient === "auto") {
            if (rad.scheme === "centrifugal" || rad.scheme === "multi_center") {
              ctx.rotate(angle + Math.PI / 2);
            } else if (rad.scheme === "centripetal") {
              ctx.rotate(angle - Math.PI / 2); // the angles of the structure point at the centre
            } else if (rad.scheme === "concentric") {
              ctx.rotate(angle);
            } else if (rad.scheme === "spiral") {
              ctx.rotate(angle + Math.PI / 2 + (twistRad * 0.35));
            }
          } // "fixed": no turn, only the layer's own rotation applies
          // Direction on top of the orientation: alternated (alternate cells turn 180°) or undefined (each one different)
          if (rad.direction === "alternated" && (i + j) % 2 === 1) {
            ctx.rotate(Math.PI);
          } else if (rad.direction === "undefined") {
            ctx.rotate(this.cellDirection(i + centerIdx * 100, j));
          }

          // Clip container: the container turns with the module's place in the ring and shrinks with its sector
          if (targetMod.clipContainer) {
            const cs = this.containerSize(targetMod, width, height);
            const rt = span / rings, aw = (ringRadius * 2 * Math.PI) / rays;
            const sector = Math.min(rt, Math.max(rt * 0.5, aw));
            const base = isFixed ? 1 : (sector / usableW) * (0.75 + (i / rings) * 0.45) * (isMultiCenter ? 0.7 : 1);
            ctx.beginPath();
            ctx.rect((-cs.w * base) / 2, (-cs.h * base) / 2, cs.w * base, cs.h * base);
            ctx.clip();
          }

          // Gradation on polar radiation (drift slides along the module's local x axis, up to ~one ring)
          if (grad.enabled) {
            this.applyGradation(ctx, grad, this.gradationPathRadial(grad, i, j, rings, rays), (span / rings) * 0.9);
          }

          // Similarity on radiation
          if (sim.enabled) this.applySimilarity(ctx, sim, pRand);
          const simShape = sim.enabled ? this.similarityShape(sim, pRand) : null;
          this.cellImperf = sim.enabled ? this.similarityImperfection(sim, pRand) : null;

          // Anomaly & Contrast on radiation module
          const cell = { shape: simShape, wireframe: null, fg: spaceFlip ? palette.bg : palette.fg, scaleMul: 1, unit: span / rings, base: targetMod.color || palette.fg };
          if (anom.enabled && !this.applyAnomaly(ctx, anom, x, y, width, height, palette, pRand, cell)) {
            ctx.restore();
            continue;
          }
          if (contrast.enabled) this.applyContrast(ctx, contrast, centerIdx * 1000 + i * rays + j, palette, cell, { a: j, b: i, x: x / width, y: y / height });
          this.applyGradationColor(grad, palette, cell);
          const cellShapeA = cell.shape;
          const cellWireframe = cell.wireframe;
          const cellFg = cell.fg;
          const cellBg = spaceFlip ? palette.fg : palette.bg;
          const cellScaleMul = cell.scaleMul;

          // Natural centrifugal growth scale: outer modules larger, inner smaller, proportional to sector size
          const scaleUnit = MODULE_UNIT;
          const ringThickness = span / rings;
          const arcWidth = (ringRadius * 2 * Math.PI) / rays;
          const sectorSize = Math.min(ringThickness, Math.max(ringThickness * 0.5, arcWidth));
          const sectorRatio = sectorSize / usableW;
          const growthFactor = 0.75 + (i / rings) * 0.45;
          const radScaleMul = isMultiCenter ? 0.7 : 1.0;
          const normScale = isFixed
            ? scaleUnit * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul)
            : scaleUnit * sectorRatio * growthFactor * radScaleMul * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul);
          if (cell.texScale) this.cellTexScale = Math.max(this.cellTexScale || 0, cell.texScale);
          this.cellSeed = i * rays + j + 1;
          this.cellAlt = (i + j) % 2 === 1;
          this.drawSingleLayerShape(ctx, targetMod, normScale, cellFg, cellBg, cellWireframe, cellShapeA, false, cellFg !== palette.fg ? cellFg : null);
          ctx.restore();
        }
      }
    });

    ctx.restore(); // end outer clip

    // Visible rays and rings: part of the design, with their own colour and width
    if (rad.showRings || rad.showRays) {
      ctx.save();
      ctx.strokeStyle = rad.lineColor || targetMod.color || palette.fg;
      ctx.lineWidth = rad.lineWidth || 1;

      centers.forEach(center => {
        if (rad.showRings) {
          if (openR > 0.5) {
            ctx.beginPath();
            if (polyOn) polyPath(center, openR, 0); else ctx.arc(center.x, center.y, openR, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (rad.scheme === "centripetal") {
            // Nested chevrons: each is the sector wedge pushed outward, its point aimed at the centre
            const delta = (Math.PI * 2) / rays;
            ctx.save();
            ctx.beginPath();
            ctx.arc(center.x, center.y, maxR, 0, Math.PI * 2);
            ctx.clip();
            for (let i = 1; i <= rings; i++) {
              const r = openR + (i / rings) * span;
              for (let j = 0; j < rays; j++) {
                const a0 = j * delta + (i - 1) * ringRotRad;
                const mid = a0 + delta / 2;
                const ax = r * Math.cos(mid), ay = r * Math.sin(mid);
                const arm = (ang) => {
                  const dx = Math.cos(ang), dy = Math.sin(ang);
                  const dot = ax * dx + ay * dy;
                  const disc = dot * dot - r * r + maxR * maxR;
                  const t = disc > 0 ? -dot + Math.sqrt(disc) : 0;
                  return [center.x + ax + dx * t, center.y + ay + dy * t];
                };
                const p1 = arm(a0), p2 = arm(a0 + delta);
                ctx.beginPath();
                ctx.moveTo(p1[0], p1[1]);
                ctx.lineTo(center.x + ax, center.y + ay);
                ctx.lineTo(p2[0], p2[1]);
                ctx.stroke();
              }
            }
            ctx.restore();
          } else {
            for (let i = 1; i <= rings; i++) {
              const r = openR + (i / rings) * span;
              ctx.beginPath();
              if (polyOn) polyPath(center, r, (i - 1) * ringRotRad); else ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }

        if (rad.showRays) {
          const f0 = openR / maxR;
          for (let j = 0; j < rays; j++) {
            const baseAngle = (j / rays) * Math.PI * 2;
            if (ringRotRad !== 0) {
              // Rotated rings: every ring has its own piece of the ray
              for (let i = 1; i <= rings; i++) {
                const shift = (i - 1) * ringRotRad;
                const ra = openR + ((i - 1) / rings) * span, rb = openR + (i / rings) * span;
                const aa = baseAngle + shift + (rad.scheme === "spiral" ? twistRad * (ra / maxR) : 0);
                const ab = baseAngle + shift + (rad.scheme === "spiral" ? twistRad * (rb / maxR) : 0);
                ctx.beginPath();
                const pa = shapeR(ra, aa, shift), pb = shapeR(rb, ab, shift);
                ctx.moveTo(center.x + pa * Math.cos(aa), center.y + pa * Math.sin(aa));
                ctx.lineTo(center.x + pb * Math.cos(ab), center.y + pb * Math.sin(ab));
                ctx.stroke();
              }
              continue;
            }
            ctx.beginPath();
            if (rad.scheme === "spiral") {
              ctx.moveTo(center.x + openR * Math.cos(baseAngle + twistRad * f0), center.y + openR * Math.sin(baseAngle + twistRad * f0));
              const steps = 24;
              for (let s = 1; s <= steps; s++) {
                const frac = f0 + (1 - f0) * (s / steps);
                const r = frac * maxR;
                const a = baseAngle + twistRad * frac;
                ctx.lineTo(center.x + r * Math.cos(a), center.y + r * Math.sin(a));
              }
            } else {
              const r0 = shapeR(openR, baseAngle), r1 = shapeR(maxR, baseAngle);
              ctx.moveTo(center.x + r0 * Math.cos(baseAngle), center.y + r0 * Math.sin(baseAngle));
              ctx.lineTo(center.x + r1 * Math.cos(baseAngle), center.y + r1 * Math.sin(baseAngle));
            }
            ctx.stroke();
          }
        }
      });

      ctx.restore();
    }

    // Anomaly reticle guide overlay on radiation
    if (anom.enabled && anom.showReticle && !this.exporting) this.drawAnomalyReticle(ctx, width, height, palette, anom);

    // Concentration attractor guide overlay on radiation
    if (conc && conc.enabled && conc.showAttractor && !this.exporting) {
      this.drawAttractorGuide(ctx, width, height, palette, conc);
    }
  }

  getLayers() {
    if (Array.isArray(this.state.layers) && this.state.layers.length > 0) {
      return this.state.layers;
    }
    return [];
  }

  // Master render method
  // `viewState`: an alternative state used only to draw on screen (an editing aid such as Hide modifiers);
  // an export never uses it
  render(palette) {
    const real = this.state;
    if (this.viewState && !this.exporting) this.state = this.viewState;
    try {
      return this.renderState(palette);
    } finally {
      this.state = real;
    }
  }

  renderState(palette) {
    if (!this.canvas) return;

    const ratioMap = {
      "1:1": { w: 600, h: 600 },
      "9:16": { w: 450, h: 800 },
      "4:3": { w: 800, h: 600 },
      "3:4": { w: 600, h: 800 },
      "16:9": { w: 800, h: 450 }
    };
    const cfg = ratioMap[this.state.aspectRatio || "1:1"] || { w: 600, h: 600 };
    const { ctx, width, height } = CanvasUtils.setupCanvas(this.canvas, cfg.w, cfg.h);

    // 1. Clear background using current effective palette background
    ctx.save();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    this.canvas.style.backgroundColor = palette.bg;

    const fgColor = palette.fg;
    const bgColor = palette.bg;

    // 2. Architectural Guide Grid & Safe Bounds
    const margin = this.safeMargin(width, height);
    const usableW = width - margin * 2;
    const usableH = height - margin * 2;

    // Guides (coordinate grid, safe bounds, containers) are an on-screen aid and never reach an export
    if (this.state.showSafeBounds && !this.exporting) {
      ctx.save();
      // Draw faint architectural coordinate grid (clean and theme-adaptive)
      ctx.strokeStyle = palette.isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(24, 24, 31, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      const gridSize = 40;
      for (let x = margin; x <= width - margin; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, height - margin);
        ctx.stroke();
      }
      for (let y = margin; y <= height - margin; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }

      // Dashed outer safe boundary
      ctx.strokeStyle = palette.isDark ? "rgba(255, 255, 255, 0.28)" : "rgba(24, 24, 31, 0.2)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(margin, margin, usableW, usableH);

      // The container of each module that has one: a frame centred on the canvas
      ctx.strokeStyle = this.guideColor();
      for (const l of this.getLayers()) {
        if (l.visible === false || l.showContainer === false || !(l.containerW > 0 || l.containerH > 0)) continue;
        const cs = this.containerSize(l, width, height);
        ctx.strokeRect(width / 2 - cs.w / 2, height / 2 - cs.h / 2, cs.w, cs.h);
      }

      ctx.restore();
    }

    // 2.5 Isometric Drafting Guides (Space): drawn once if any visible layer asks for them
    const showIsoGuides = this.getLayers().some(l => l.visible !== false && l.structure?.space?.enabled && l.structure.space.showIsoGuides);
    if (showIsoGuides && !this.exporting) {
      this.drawIsometricGuides(ctx, width, height, palette);
    }

    // 3. Render Pipeline (Artboard Safe-Frame clipping: strictly contained within red master guides)
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin, margin, usableW, usableH);
    ctx.clip();

    const layers = this.getLayers();
    const order = (this.state.layerOrder && this.state.layerOrder.length > 0)
      ? this.state.layerOrder
      : layers.map(l => l.id);
    const renderStack = [...order].reverse();

    // Each layer has its own independent layout structure & properties
    const usesStructure = (struct) => !!(struct && (struct.enabled || (struct.formalStructure && struct.formalStructure.enabled)));
    let anyLayerStructure = false;
    for (const layerId of renderStack) {
      const mod = layers.find(l => l.id === layerId);
      if (!mod || mod.visible === false) continue;

      const layerStruct = mod.structure;
      if (usesStructure(layerStruct)) {
        anyLayerStructure = true;
        if (layerStruct.mode === "radiation") {
          this.renderRadiation(ctx, width, height, palette, margin, usableW, usableH, mod, layerStruct.radiation);
        } else {
          this.renderRepetitionGrid(ctx, width, height, palette, margin, usableW, usableH, mod, layerStruct.repetition);
        }
      } else {
        // Layer rendered as a single element centered on the canvas
        this.renderSingleLayerModule(ctx, mod, width, height, palette);
      }
    }

    ctx.restore(); // end master artboard clip

    // 4. Subtle center reference dot (only in single module mode, when no layer uses a layout)
    if (!anyLayerStructure && !this.exporting) {
      ctx.save();
      ctx.fillStyle = this.guideColor();
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  }

  // One colour for every on-screen guide (Figma-style), chosen next to the canvas buttons
  guideColor() {
    return /^#[0-9a-f]{6}$/i.test(this.state.guideColor || "") ? this.state.guideColor : "#f24822";
  }

  // Concentration Attractor Field Guide (Concentration)
  drawAttractorGuide(ctx, width, height, palette, conc) {
    const attX = (conc.attractorX ?? 0.5) * width;
    const attY = (conc.attractorY ?? 0.5) * height;
    const radius = conc.radius ?? 240;

    ctx.save();
    ctx.strokeStyle = this.guideColor();
    ctx.fillStyle = this.guideColor();

    if (conc.mode === "line" || conc.mode === "line_void") {
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      if (conc.lineAxis === "vertical") {
        ctx.moveTo(attX, 0);
        ctx.lineTo(attX, height);
      } else {
        ctx.moveTo(0, attY);
        ctx.lineTo(width, attY);
      }
      ctx.stroke();

      // Influence boundary lines
      ctx.globalAlpha = 0.18;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      if (conc.lineAxis === "vertical") {
        ctx.moveTo(attX - radius, 0);
        ctx.lineTo(attX - radius, height);
        ctx.moveTo(attX + radius, 0);
        ctx.lineTo(attX + radius, height);
      } else {
        ctx.moveTo(0, attY - radius);
        ctx.lineTo(width, attY - radius);
        ctx.moveTo(0, attY + radius);
        ctx.lineTo(width, attY + radius);
      }
      ctx.stroke();
    } else {
      // Concentric gravitational rings
      const rings = [radius * 0.35, radius * 0.7, radius];
      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.15 + (3 - idx) * 0.12;
        ctx.arc(attX, attY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Central attractor point
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(attX, attY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (conc.mode === "free") {
        // The other foci of the hotspots
        this.hotspots(conc, width, height).slice(1).forEach((f) => {
          ctx.setLineDash([]);
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.arc(f.x, f.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.setLineDash([3, 4]);
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.arc(f.x, f.y, radius * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        });
      }
    }

    ctx.restore();
  }

  // 30° Isometric Construction Guide Grid (Space)
  drawIsometricGuides(ctx, width, height, palette) {
    ctx.save();
    ctx.strokeStyle = this.guideColor();
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([2, 4]);

    const spacing = 36;
    const tan30 = Math.tan((30 * Math.PI) / 180); // ~0.57735
    const extendX = height / tan30;

    // 30 degree diagonal lines (ascending)
    for (let x = -extendX; x <= width + extendX; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + extendX, 0);
      ctx.stroke();
    }

    // -30 degree diagonal lines (descending)
    for (let x = -extendX; x <= width + extendX; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + extendX, height);
      ctx.stroke();
    }

    // Vertical construction lines
    for (let x = 0; x <= width; x += spacing * 1.5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.restore();
  }
}



  /**
 * MODULE STUDIO — Exporter Module
 * High-resolution PNG (Retina 2x/4x), SVG Vector generation, JSON project save/load.
 */

/**
 * Minimal Canvas 2D context that records drawing calls as SVG elements.
 * It supports only what the engine uses (paths, transforms, fill/stroke, clip,
 * alpha, dashes). The engine renders into it exactly as it does into the canvas.
 */
class SvgRecorder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.m = [1, 0, 0, 1, 0, 0];
    this.fillStyle = "#000000";
    this.strokeStyle = "#000000";
    this.lineWidth = 1;
    this.lineCap = "butt";
    this.lineJoin = "miter";
    this.globalAlpha = 1;
    this.dash = [];
    this.path = [];
    this.cur = null;
    this.out = [];
    this.defs = [];
    this.clipCount = 0;
    this.openGroups = 0;
    this.stack = [];
  }

  static num(n) { return Math.round(n * 1000) / 1000; }
  static mul(a, b) {
    return [
      a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  }
  pt(x, y) { const m = this.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }

  // --- state ---
  save() {
    this.stack.push({
      m: this.m.slice(), fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth,
      lineCap: this.lineCap, lineJoin: this.lineJoin, globalAlpha: this.globalAlpha, dash: this.dash.slice(), groups: this.openGroups
    });
  }
  restore() {
    const st = this.stack.pop();
    if (!st) return;
    while (this.openGroups > st.groups) { this.out.push("</g>"); this.openGroups--; }
    this.m = st.m; this.fillStyle = st.fillStyle; this.strokeStyle = st.strokeStyle; this.lineWidth = st.lineWidth;
    this.lineCap = st.lineCap; this.lineJoin = st.lineJoin; this.globalAlpha = st.globalAlpha; this.dash = st.dash;
  }
  setLineDash(a) { this.dash = Array.isArray(a) ? a.slice() : []; }

  // --- transforms ---
  setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; }
  transform(a, b, c, d, e, f) { this.m = SvgRecorder.mul(this.m, [a, b, c, d, e, f]); }
  translate(x, y) { this.transform(1, 0, 0, 1, x, y); }
  scale(x, y) { this.transform(x, 0, 0, y === undefined ? x : y, 0, 0); }
  rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.transform(c, s, -s, c, 0, 0); }

  // --- path (stored in device space) ---
  beginPath() { this.path = []; this.cur = null; }
  moveTo(x, y) { const p = this.pt(x, y); this.path.push(["M", p]); this.cur = p; this.start = p; }
  lineTo(x, y) {
    if (!this.cur) return this.moveTo(x, y);
    const p = this.pt(x, y); this.path.push(["L", p]); this.cur = p;
  }
  bezierCurveTo(x1, y1, x2, y2, x3, y3) {
    if (!this.cur) this.moveTo(x1, y1);
    const p3 = this.pt(x3, y3);
    this.path.push(["C", this.pt(x1, y1), this.pt(x2, y2), p3]); this.cur = p3;
  }
  quadraticCurveTo(x1, y1, x2, y2) {
    if (!this.cur) this.moveTo(x1, y1);
    const p2 = this.pt(x2, y2);
    this.path.push(["Q", this.pt(x1, y1), p2]); this.cur = p2;
  }
  closePath() { if (this.cur) { this.path.push(["Z"]); this.cur = this.start; } }
  rect(x, y, w, h) {
    this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath();
  }
  arc(cx, cy, r, a0, a1, ccw = false) {
    const TAU = Math.PI * 2;
    let d = a1 - a0;
    if (!ccw) { if (d >= TAU) d = TAU; else { d %= TAU; if (d < 0) d += TAU; } }
    else { if (d <= -TAU) d = -TAU; else { d %= TAU; if (d > 0) d -= TAU; } }
    const sx = cx + r * Math.cos(a0), sy = cy + r * Math.sin(a0);
    this.lineTo(sx, sy);
    if (d === 0) return;
    const n = Math.max(1, Math.ceil(Math.abs(d) / (Math.PI / 2)));
    const step = d / n;
    const k = (4 / 3) * Math.tan(step / 4);
    let a = a0;
    for (let i = 0; i < n; i++) {
      const b = a + step;
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      this.bezierCurveTo(
        cx + r * (ca - k * sa), cy + r * (sa + k * ca),
        cx + r * (cb + k * sb), cy + r * (sb - k * cb),
        cx + r * cb, cy + r * sb
      );
      a = b;
    }
  }

  // --- painting ---
  pathData(mapper) {
    const n = SvgRecorder.num;
    const f = (p) => { const q = mapper ? mapper(p) : p; return `${n(q[0])} ${n(q[1])}`; };
    return this.path.map(seg => {
      if (seg[0] === "Z") return "Z";
      return seg[0] + seg.slice(1).map(f).join(" ");
    }).join("");
  }
  fill(rule) {
    if (!this.path.length) return;
    const rl = rule === "evenodd" ? ' fill-rule="evenodd"' : "";
    this.out.push(`<path d="${this.pathData()}" fill="${this.fillStyle}" fill-opacity="${SvgRecorder.num(this.globalAlpha)}"${rl}/>`);
  }
  stroke() {
    if (!this.path.length) return;
    const [a, b, c, d, e, f] = this.m;
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-9) return; // a collapsed transform draws nothing visible
    // Canvas strokes with the transform active at stroke time, so the path goes back to that space
    const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
    const ie = (c * f - d * e) / det, iff = (b * e - a * f) / det;
    const inv = (p) => [ia * p[0] + ic * p[1] + ie, ib * p[0] + id * p[1] + iff];
    const n = SvgRecorder.num;
    const dash = this.dash.length ? ` stroke-dasharray="${this.dash.map(n).join(",")}"` : "";
    this.out.push(
      `<path d="${this.pathData(inv)}" transform="matrix(${[a, b, c, d, e, f].map(n).join(" ")})" fill="none" stroke="${this.strokeStyle}" ` +
      `stroke-opacity="${n(this.globalAlpha)}" stroke-width="${n(this.lineWidth)}" stroke-linecap="${this.lineCap}" ` +
      `stroke-linejoin="${this.lineJoin}" stroke-miterlimit="10"${dash}/>`
    );
  }
  clip() {
    const id = `clip${++this.clipCount}`;
    this.defs.push(`<clipPath id="${id}"><path d="${this.pathData()}"/></clipPath>`);
    this.out.push(`<g clip-path="url(#${id})">`);
    this.openGroups++;
  }
  // Rectangle helpers must not disturb the current path
  withTempPath(fn) {
    const sp = this.path, sc = this.cur, ss = this.start;
    this.beginPath(); fn(); this.path = sp; this.cur = sc; this.start = ss;
  }
  fillRect(x, y, w, h) { this.withTempPath(() => { this.rect(x, y, w, h); this.fill(); }); }
  strokeRect(x, y, w, h) { this.withTempPath(() => { this.rect(x, y, w, h); this.stroke(); }); }

  toSVG(logicalW, logicalH) {
    while (this.openGroups > 0) { this.out.push("</g>"); this.openGroups--; }
    const n = SvgRecorder.num;
    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(this.width)} ${n(this.height)}" width="${n(logicalW)}" height="${n(logicalH)}">\n` +
      `<!-- Module Studio: vector export -->\n` +
      (this.defs.length ? `<defs>${this.defs.join("")}</defs>\n` : "") +
      this.out.join("\n") + `\n</svg>\n`;
  }
}
const StudioExporter = {
  /**
   * Export high-res raster PNG
   */
  exportPNG(canvas, engine, palette, scaleMultiplier = 2, filename = "module-studio-composition.png") {
    const origW = canvas.width;
    const origH = canvas.height;
    
    // Create high-res offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = origW * (scaleMultiplier / (window.devicePixelRatio || 1));
    offscreen.height = origH * (scaleMultiplier / (window.devicePixelRatio || 1));
    
    // Temporarily attach engine to offscreen canvas
    const origCanvas = engine.canvas;
    engine.canvas = offscreen;
    engine.exporting = true;
    try { engine.render(palette); } finally { engine.exporting = false; engine.canvas = origCanvas; }

    // Trigger download
    const link = document.createElement("a");
    link.download = filename;
    link.href = offscreen.toDataURL("image/png", 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export JSON project state
   */
  exportJSON(state, filename = "module-studio-project.json") {
    const jsonStr = JSON.stringify({ app: "module-studio", version: 1, state }, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Build a real vector SVG by running the engine against a recording context
   */
  buildSVG(engine, canvas, palette) {
    const dpr = window.devicePixelRatio || 1;
    const rec = new SvgRecorder(canvas.width, canvas.height);
    const fake = { width: canvas.width, height: canvas.height, style: {}, getContext: () => rec };
    const origCanvas = engine.canvas;
    engine.canvas = fake;
    engine.exporting = true;
    try {
      engine.render(palette);
    } finally {
      engine.exporting = false;
      engine.canvas = origCanvas;
    }
    return rec.toSVG(canvas.width / dpr, canvas.height / dpr);
  },

  /**
   * Export Vector SVG
   */
  exportSVG(engine, canvas, palette, filename = "module-studio-vector.svg") {
    const svgContent = this.buildSVG(engine, canvas, palette);
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Copy to clipboard as Data URL
   */
  async copyDataURL(canvas) {
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    await navigator.clipboard.writeText(dataUrl);
  }
};


  /**
 * MODULE STUDIO PRO — Master Application Controller
 * Inspired by Abstract Studio: Canvas-First, Floating Capas Stack, Shape Inspector & Procedural Stack.
 */






// The icon of a shape: a Phosphor icon, or its own drawing (ring) or letter (A, S, R) when Phosphor has none
function shapeIconHtml(def) {
  if (def && def.phIcon) return `<i class="ph ph-${def.phIcon}" aria-hidden="true"></i>`;
  if (def && def.glyph) return `<span class="ph-glyph" aria-hidden="true">${def.glyph}</span>`;
  if (def && def.id === "ring") return '<svg class="ph-svg" viewBox="0 0 256 256" aria-hidden="true"><circle cx="128" cy="128" r="104" fill="none" stroke="currentColor" stroke-width="16"/><circle cx="128" cy="128" r="52" fill="none" stroke="currentColor" stroke-width="16"/></svg>';
  return '<i class="ph ph-circle" aria-hidden="true"></i>';
}
const ASPECT_RATIOS = {
  "1:1": { label: "1:1 Square", w: 600, h: 600, css: "1 / 1" },
  "9:16": { label: "9:16 Story", w: 450, h: 800, css: "9 / 16" },
  "4:3": { label: "4:3 Editorial", w: 800, h: 600, css: "4 / 3" },
  "3:4": { label: "3:4 Poster", w: 600, h: 800, css: "3 / 4" },
  "16:9": { label: "16:9 Cinema", w: 800, h: 450, css: "16 / 9" }
};
class StudioProApp {
  constructor() {
    this.canvas = document.getElementById("studio-canvas");
    this.canvasContainer = document.getElementById("canvas-viewport-container");
    this.artboardWrapper = document.getElementById("artboard-wrapper");
    
    this.engine = new StudioEngine(this.canvas);
    this.state = JSON.parse(JSON.stringify(defaultStudioState));
    
    // Artboard size as shown on screen (set by fitArtboard)
    this.artboardSize = { w: 0, h: 0 };

    // Active Layer Management (Each layer is a module!)
    this.activeLayerId = "layer-1";

    // Palette (Abstract Studio default: Clean Monochrome / Paper White & Deep Ink)
    this.activePaletteId = "monochrome";
    this.customColors = {
      bg: "#ffffff",
      fg: "#18181f",
      accent: "#18181f",
      grid: "#dcdfe6"
    };

    // History Stack
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 60;
    this.historyLabels = [];

    // Controls Rail & Inspector Flyout State
    this.activeRailTab = "module";
    this.isFlyoutOpen = true;


    this.init();
  }

  init() {
    this.applyAspectRatio(this.state.aspectRatio || "1:1");
    this.pushHistory("Initial Canvas State");
    this.setupViewportEvents();
    this.setupKeyboardShortcuts();
    this.setupHeaderActions();
    this.setupFloatingLayersPanel();
    this.setupControlsRail();
    this.setupLayoutStructure();
    this.setupSelects();
    this.setupValueSteppers();
    this.setupRepetitionExtras();
    this.setupFormalStructure();
    this.setupSimilarity();
    this.setupGradation();
    this.setupAnomaly();
    this.setupContrast();
    this.setupConcentration();
    this.setupSpace();
    this.setupTexture();
    this.setupAccessibility();
    document.addEventListener("input", (e) => { if (e.target.matches && e.target.matches('.ds-slider input[type="range"]')) this.paintRange(e.target); });
    this.paintAllRanges();
    this.setupShapeInspector();

    // Initial render
    this.updateActivePalette();
    this.render();
    this.centerArtboard();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();

    // Sync header button states
    const gridBtn = document.getElementById("btn-toggle-grid");
    if (gridBtn) gridBtn.classList.toggle("active", !!this.state.showSafeBounds);
    this.syncGuideColor();
    const invertBtn = document.getElementById("btn-toggle-invert");
    if (invertBtn) invertBtn.classList.toggle("active", !!this.state.invertFigureGround);
  }

  getActivePalette() {
    if (this.state.invertFigureGround) {
      return {
        bg: "#18181f",
        fg: "#ffffff",
        accent: "#f43f5e",
        grid: "rgba(255, 255, 255, 0.14)",
        isDark: true
      };
    } else {
      return {
        bg: "#ffffff",
        fg: this.customColors.fg || "#18181f",
        accent: "#18181f",
        grid: "rgba(0, 0, 0, 0.08)",
        isDark: false
      };
    }
  }

  updateActivePalette() {
    // Keep customColors.bg consistent
    this.customColors.bg = this.state.invertFigureGround ? "#18181f" : "#ffffff";
  }

  getLayers() {
    if (!Array.isArray(this.state.layers) || this.state.layers.length === 0) {
      this.state.layers = [createDefaultLayer("layer-1", "Layer 1", "circle", 0, 0, 4.5)];
    }
    return this.state.layers;
  }

  getActiveModule() {
    const layers = this.getLayers();
    const active = layers.find(l => l.id === this.activeLayerId);
    if (active) return active;
    return layers[0] || null;
  }

  getActiveLayerStructure() {
    const mod = this.getActiveModule();
    if (!mod) return null;
    if (!mod.structure) {
      mod.structure = createDefaultLayerStructure();
    }
    if (!mod.structure.similarity) {
      mod.structure.similarity = {
        enabled: false,
        kinshipType: "distortion",
        intensity: 50,
        cellJitter: 0,
        seed: 42
      };
    }
    if (!mod.structure.gradation) {
      mod.structure.gradation = createDefaultLayerStructure().gradation;
    }
    if (!mod.structure.anomaly) {
      mod.structure.anomaly = createDefaultLayerStructure().anomaly;
    }
    if (!mod.structure.contrast) {
      mod.structure.contrast = createDefaultLayerStructure().contrast;
    }
    if (!mod.structure.concentration) {
      mod.structure.concentration = createDefaultLayerStructure().concentration;
    }
    if (!mod.structure.space) {
      mod.structure.space = createDefaultLayerStructure().space;
    }
    if (!mod.structure.texture) {
      mod.structure.texture = createDefaultLayerStructure().texture;
    }
    return mod.structure;
  }

  syncAllInspectorsWithActiveLayer() {
    this.syncShapeInspectorWithActiveLayer();
    this.syncStructureInspectorWithActiveLayer();
    this.syncFormalStructureInspectorWithActiveLayer();
    this.syncSimilarityInspectorWithActiveLayer();
    this.syncGradationInspectorWithActiveLayer();
    this.syncAnomalyInspectorWithActiveLayer();
    this.syncContrastInspectorWithActiveLayer();
    this.syncConcentrationInspectorWithActiveLayer();
    this.syncSpaceInspectorWithActiveLayer();
    this.syncTextureInspectorWithActiveLayer();
    this.updateRailIndicatorDots();
    this.paintAllRanges();
  }

  render() {
    if (!this.engine || !this.canvas) return;
    this.engine.state = this.state;
    this.engine.viewState = this.isHidingModifiers() ? this.stateWithoutModifiers() : null;
    const palette = this.getActivePalette();
    try {
      this.engine.render(palette);
      this.hideRenderError();
    } catch (err) {
      // A failed draw must not leave a silent blank canvas: log it and tell the user.
      console.error("Render failed:", err);
      this.showRenderError(err);
      return;
    }
    this.updateArtLog();
  }

  // Hide modifiers (an editing aid, never exported): while the Module panel is open and the box is ticked, the
  // active layer is drawn without its modifiers, so the module can be adjusted with its neighbours around it
  isHidingModifiers() {
    return !!(this.hideModifiers && this.isFlyoutOpen && this.activeRailTab === "module");
  }

  stateWithoutModifiers() {
    const off = (b) => (b ? { ...b, enabled: false } : b);
    const layers = this.state.layers.map((l) => {
      if (l.id !== this.activeLayerId || !l.structure) return l;
      const s = l.structure;
      return { ...l, structure: { ...s, enabled: false, similarity: off(s.similarity), gradation: off(s.gradation), anomaly: off(s.anomaly), contrast: off(s.contrast), concentration: off(s.concentration), texture: off(s.texture), space: off(s.space) } };
    });
    return { ...this.state, layers };
  }

  showRenderError(err) {
    let box = document.getElementById("render-error");
    if (!box) {
      box = document.createElement("div");
      box.id = "render-error";
      box.className = "render-error";
      box.setAttribute("role", "alert");
      document.body.appendChild(box);
    }
    box.textContent = `Something went wrong while drawing (${err && err.message ? err.message : "unknown error"}). Press Cmd/Ctrl+Z to go back to the last working state.`;
    box.hidden = false;
  }

  hideRenderError() {
    const box = document.getElementById("render-error");
    if (box) box.hidden = true;
  }

  applyAspectRatio(key) {
    const cfg = ASPECT_RATIOS[key] || ASPECT_RATIOS["1:1"];
    this.state.aspectRatio = key;
    this.canvas.width = cfg.w;
    this.canvas.height = cfg.h;
    this.fitArtboard();

    const selectEl = document.getElementById("canvas-aspect-ratio");
    if (selectEl && selectEl.value !== key) selectEl.value = key;
  }

  /* =========================================================================
     TOP APPLICATION BAR ACTIONS
     ========================================================================= */

  setupHeaderActions() {
    // 1. Aspect Ratio Dropdown
    const aspectSelect = document.getElementById("canvas-aspect-ratio");
    if (aspectSelect) {
      aspectSelect.addEventListener("change", (e) => {
        const ratio = e.target.value;
        this.applyAspectRatio(ratio);
        this.render();
        this.centerArtboard();
        this.pushHistory(`Aspect Ratio: ${ratio}`);
      });
    }

    // 2. Toggle Grid Guides Button
    const gridBtn = document.getElementById("btn-toggle-grid");
    if (gridBtn) {
      gridBtn.addEventListener("click", () => {
        this.state.showSafeBounds = !this.state.showSafeBounds;
        gridBtn.classList.toggle("active", this.state.showSafeBounds);
        this.render();
        this.pushHistory(`Toggle Grid: ${this.state.showSafeBounds}`);
      });
    }

    // 2b. Guide color (one colour for every on-screen guide)
    const guideInput = document.getElementById("input-guide-color");
    guideInput?.addEventListener("input", (e) => {
      this.state.guideColor = e.target.value;
      this.syncGuideColor();
      this.render();
    });
    guideInput?.addEventListener("change", (e) => this.pushHistory(`Guide Color: ${e.target.value.toUpperCase()}`));

    // 3. Toggle Invert Tone Button
    const invertBtn = document.getElementById("btn-toggle-invert");
    if (invertBtn) {
      invertBtn.addEventListener("click", () => {
        this.state.invertFigureGround = !this.state.invertFigureGround;
        invertBtn.classList.toggle("active", this.state.invertFigureGround);
        this.updateActivePalette();
        this.render();
        this.pushHistory(`Toggle Invert Tone: ${this.state.invertFigureGround}`);
      });
    }

    // 4. Copy SVG Code
    const copySvgBtn = document.getElementById("btn-copy-svg-code");
    if (copySvgBtn) {
      copySvgBtn.addEventListener("click", async () => {
        const label = copySvgBtn.querySelector("span");
        const origText = label.textContent;
        try {
          const svgString = StudioExporter.buildSVG(this.engine, this.canvas, this.getActivePalette());
          await navigator.clipboard.writeText(svgString);
          label.textContent = "Copied!";
        } catch (err) {
          label.textContent = "Copy failed";
        }
        setTimeout(() => label.textContent = origText, 1500);
      });
    }

    // 5. Download SVG File
    const downloadSvgBtn = document.getElementById("btn-download-svg");
    if (downloadSvgBtn) {
      downloadSvgBtn.addEventListener("click", () => {
        StudioExporter.exportSVG(this.engine, this.canvas, this.getActivePalette(), "module-studio-composition.svg");
      });
    }

    // 6. Config Button
    const configBtn = document.getElementById("btn-open-config");
    if (configBtn) {
      configBtn.addEventListener("click", () => {
        StudioExporter.exportJSON(this.state, "module-studio-project.json");
      });
    }

    // 7. Open a saved project (.json)
    const openBtn = document.getElementById("btn-open-project");
    const fileInput = document.getElementById("file-open-project");
    if (openBtn && fileInput) {
      openBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = "";
        if (!file) return;
        try {
          this.loadProjectText(await file.text());
        } catch (err) {
          alert(`Could not open the project: ${err.message}`);
        }
      });
    }
  }

  // Validates a saved project and replaces the current state with it.
  // Anything missing or malformed falls back to the defaults, so a damaged file cannot break the app.
  loadProjectText(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("the file is not valid JSON"); }
    const raw = data && data.state && typeof data.state === "object" ? data.state : data;
    if (!raw || !Array.isArray(raw.layers) || raw.layers.length === 0) throw new Error("it does not look like a Module Studio project");

    const clone = (v) => JSON.parse(JSON.stringify(v));
    const merge = (def, src) => {
      if (def && typeof def === "object" && !Array.isArray(def)) {
        const out = {};
        for (const k of Object.keys(def)) {
          out[k] = src && typeof src === "object" && k in src ? merge(def[k], src[k]) : clone(def[k]);
        }
        return out;
      }
      if (Array.isArray(def)) return Array.isArray(src) ? clone(src) : clone(def);
      if (typeof def === "number") return typeof src === "number" && Number.isFinite(src) ? src : def;
      return typeof src === typeof def ? src : def;
    };

    const used = new Set();
    const layers = raw.layers.slice(0, 5).map((src, i) => {
      const layer = merge(createDefaultLayer(`layer-${i + 1}`, `Layer ${i + 1}`), src);
      if (!STUDIO_SHAPE_KEYS.includes(layer.shape)) layer.shape = "circle";
      if (!layer.id || used.has(layer.id)) layer.id = `layer-${i + 1}-${Date.now() % 100000}`;
      used.add(layer.id);
      return layer;
    });
    const ids = layers.map(l => l.id);
    let order = Array.isArray(raw.layerOrder) ? raw.layerOrder.filter(id => ids.includes(id)) : [];
    for (const id of ids.slice().reverse()) if (!order.includes(id)) order.push(id);

    const ratios = ["1:1", "9:16", "4:3", "3:4", "16:9"];
    this.state = {
      aspectRatio: ratios.includes(raw.aspectRatio) ? raw.aspectRatio : "1:1",
      layers,
      layerOrder: order,
      invertFigureGround: !!raw.invertFigureGround,
      showSafeBounds: raw.showSafeBounds !== false,
      guideColor: /^#[0-9a-f]{6}$/i.test(raw.guideColor || "") ? raw.guideColor : "#f24822"
    };
    this.activeLayerId = layers[0].id;
    this.applyAspectRatio(this.state.aspectRatio);
    document.getElementById("btn-toggle-grid")?.classList.toggle("active", this.state.showSafeBounds);
    this.syncGuideColor();
    document.getElementById("btn-toggle-invert")?.classList.toggle("active", this.state.invertFigureGround);
    this.updateActivePalette();
    this.render();
    this.centerArtboard();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();
    this.pushHistory("Open project");
  }

  /* =========================================================================
     FLOATING CAPAS (LAYERS) STACK — EACH LAYER IS A MODULE!
     ========================================================================= */

  setupFloatingLayersPanel() {
    const addBtn = document.getElementById("btn-add-pattern");
    const container = document.getElementById("layers-stack-container");

    // Add Pattern Button (Adds new layer up to 5)
    addBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.addLayer();
    });

    if (container) {
      // Event delegation for layer cards clicks
      container.addEventListener("click", (e) => {
        const eyeBtn = e.target.closest(".btn-layer-eye");
        if (eyeBtn) {
          e.stopPropagation();
          const layerId = eyeBtn.dataset.layer;
          this.toggleLayerVisibility(layerId);
          return;
        }

        const delBtn = e.target.closest(".btn-layer-delete");
        if (delBtn) {
          e.stopPropagation();
          if (delBtn.disabled) return;
          const layerId = delBtn.dataset.layer;
          this.deleteLayer(layerId);
          return;
        }

        const gripHandle = e.target.closest(".layer-drag-handle");
        if (gripHandle) {
          e.stopPropagation();
          const card = gripHandle.closest(".layer-card");
          if (card && container.children.length > 1) {
            const next = card.nextElementSibling;
            if (next) {
              container.insertBefore(next, card);
            } else {
              container.insertBefore(card, container.firstElementChild);
            }
            const newOrder = Array.from(container.children).map(c => c.dataset.layerId).filter(Boolean);
            this.state.layerOrder = newOrder;
            this.render();
            this.updateLayerCardsUI();
            this.pushHistory(`Reorder Layers: ${newOrder.join(" > ")}`);
          }
          return;
        }

        const card = e.target.closest(".layer-card");
        if (card) {
          const layerId = card.dataset.layerId;
          if (layerId && layerId !== this.activeLayerId) {
            this.selectLayer(layerId);
          }
        }
      });

      // HTML5 Drag and Drop Sorting for Layer Cards
      let draggedCard = null;

      container.addEventListener("dragstart", (e) => {
        const card = e.target.closest(".layer-card");
        if (!card) return;
        draggedCard = card;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.layerId || "");
      });

      container.addEventListener("dragend", () => {
        if (draggedCard) draggedCard.classList.remove("is-dragging");
        container.querySelectorAll(".layer-card").forEach(c => c.classList.remove("drag-over"));
        draggedCard = null;
      });

      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        const card = e.target.closest(".layer-card");
        if (!card || card === draggedCard) return;
        e.dataTransfer.dropEffect = "move";
        card.classList.add("drag-over");
      });

      container.addEventListener("dragleave", (e) => {
        const card = e.target.closest(".layer-card");
        if (card) card.classList.remove("drag-over");
      });

      container.addEventListener("drop", (e) => {
        e.preventDefault();
        container.querySelectorAll(".layer-card").forEach(c => c.classList.remove("drag-over"));
        const card = e.target.closest(".layer-card");
        if (draggedCard && card && draggedCard !== card) {
          const cards = Array.from(container.children);
          const draggedIdx = cards.indexOf(draggedCard);
          const targetIdx = cards.indexOf(card);
          if (draggedIdx < targetIdx) {
            container.insertBefore(draggedCard, card.nextSibling);
          } else {
            container.insertBefore(draggedCard, card);
          }
          const newOrder = Array.from(container.children).map(c => c.dataset.layerId).filter(Boolean);
          this.state.layerOrder = newOrder;
          this.render();
          this.updateLayerCardsUI();
          this.pushHistory(`Reorder Layers: ${newOrder.join(" > ")}`);
        }
      });
    }
  }

  addLayer() {
    const layers = this.getLayers();
    if (layers.length >= 5) return;

    let maxNum = 0;
    for (const l of layers) {
      const match = (l.id || "").match(/layer-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    const newId = `layer-${nextNum}`;
    const newName = `Layer ${nextNum}`;

    const shapesPool = ["circle", "square", "triangle", "hexagon", "star", "cross"];
    const newShape = shapesPool[layers.length % shapesPool.length];
    const newLayer = createDefaultLayer(newId, newName, newShape, 0, 0, 0);

    layers.push(newLayer);
    if (!this.state.layerOrder) {
      this.state.layerOrder = layers.map(l => l.id);
    }
    this.state.layerOrder.unshift(newId);
    this.activeLayerId = newId;

    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
    this.render();
    this.pushHistory(`Added ${newName}`);
  }

  deleteLayer(layerId) {
    const layers = this.getLayers();
    if (layers.length <= 1) return;

    this.state.layers = layers.filter(l => l.id !== layerId);
    this.state.layerOrder = (this.state.layerOrder || []).filter(id => id !== layerId);

    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.state.layers[0]?.id || "layer-1";
    }

    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
    this.render();
    this.pushHistory(`Deleted Layer ${layerId}`);
  }

  toggleLayerVisibility(layerId) {
    const layers = this.getLayers();
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    layer.visible = layer.visible === false ? true : false;
    this.updateLayerCardsUI();
    this.render();
    this.pushHistory(`Toggled Visibility: ${layer.name || layerId}`);
  }

  selectLayer(layerId) {
    this.activeLayerId = layerId;
    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
  }

  /* =========================================================================
     ART LOG (bottom half of the layers panel)
     Built from the state: the canvas, the modules, then the active layer (its module and one line per control that is ON).
     ========================================================================= */

  updateArtLog() {
    const box = document.getElementById("art-log-lines");
    if (!box) return;
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const title = (s) => String(s || "").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
    const pick = (map, key) => (map && map[key]) || title(key);
    const line = (key, value) => `<p><span class="art-log__key">${esc(key)}</span>: ${esc(value)}</p>`;

    const layers = this.getLayers();
    const size = this.artboardSize ? `${this.artboardSize.w} × ${this.artboardSize.h} PX` : "";
    const out = [`<p><span class="art-log__key">Canvas</span>: <span id="hud-resolution">${esc(size)}</span> • <span id="hud-layers-status">${layers.length} ${layers.length === 1 ? "LAYER" : "LAYERS"}</span></p>`];

    const shapeName = (id) => (Shapes[id] || Shapes.circle).name.replace(/\s*\([^)]*\)\s*/g, "");
    const shapes = layers.filter(l => l.visible !== false).map(l => shapeName(l.shape));
    if (shapes.length) out.push(line("Modules", shapes.join(" + ")));

    const mod = this.getActiveModule();
    const s = mod && mod.structure;
    if (mod && s) {
      out.push(`<p class="art-log__layer">${esc(mod.name || mod.id)}</p>`);
      out.push(line("Module", shapeName(mod.shape)));
      if (this.isHidingModifiers()) out.push(line("Modifiers", "hidden"));
      const GRIDS = { basic: "Grid", sliding: "Brick", sheared: "Diagonal", curved: "Curved", zigzag: "Zigzag", triangular: "Triangular", alternating: "Alternating", hexagonal: "Hexagonal", free: "Free" };
      const SCHEMES = { centrifugal: "Centrifugal", concentric: "Concentric", centripetal: "Centripetal", spiral: "Spiral", multi_center: "Multiple centers" };
      const PLACE = { centers: "Centers", intersections: "Intersections", both: "Both" };
      const MIX = { none: "None", merge: "Merged", divide: "Divided" };
      const KIN = { distortion: "Elastic", foreshortening: "3D tilt", rotation_wobble: "Wobble", scale_kinship: "Scale", hybrid: "Hybrid" };
      const GATTR = { rotation: "Rotate", scale: "Scale", depth: "Depth", drift: "Drift", shape: "Shape", texture: "Texture", color: "Color" };
      const PATH = { diagonal: "Diagonal", horizontal: "Horizontal", vertical: "Vertical", concentric: "Concentric", zigzag: "Zigzag" };
      const ANOM = { focal: "Focal", fracture: "Rupture", swell: "Swell", tear: "Void", regrid: "Another grid" };
      const DIM = { scale: "Scale", shape: "Shape", direction: "Angle", position: "Position", tone: "Tone", texture: "Texture", space: "Space" };
      const SPREAD = { scattered: "Scattered", balanced: "Balanced", edge: "Toward the edges", center: "Toward the center" };
      const CMODE = { point: "Point", void: "Void", line: "Line", line_void: "Away from line", free: "Hotspots", dense: "Dense", sparse: "Sparse" };

      if (s.enabled) {
        if (s.mode === "radiation") {
          const r = s.radiation || {};
          out.push(line("Structure", ["Radiation", pick(SCHEMES, r.scheme), `${r.rays} rays - ${r.rings} rings`, r.sizeMode === "actual" ? "Actual size" : "Fit to canvas"].join(" / ")));
        } else {
          const r = s.repetition || {};
          out.push(line("Structure", ["Repetition", pick(GRIDS, r.gridType), `C${r.cols} - R${r.rows}`, r.sizeMode === "actual" ? "Actual size" : "Fit to canvas", pick(PLACE, r.placement || "centers"), pick(MIX, r.cellMix || "none")].join(" / ")));
        }
        const f = s.formalStructure;
        if (f && f.enabled && s.mode !== "radiation") {
          const parts = [];
          if ((f.colRatio || 1) !== 1) parts.push(`Col B ${Math.round(100 / f.colRatio)}% of A`);
          if ((f.rowRatio || 1) !== 1) parts.push(`Row B ${Math.round(100 / f.rowRatio)}% of A`);
          if (f.colGrade) parts.push(`Col ${f.colGrade > 0 ? "+" : ""}${f.colGrade}%`);
          if (f.rowGrade) parts.push(`Row ${f.rowGrade > 0 ? "+" : ""}${f.rowGrade}%`);
          if (parts.length) out.push(line("Rhythm", parts.join(" / ")));
        }
      }
      const sim = s.similarity;
      if (sim && sim.enabled) {
        const p = [pick(KIN, sim.kinshipType), `${sim.intensity}%`];
        if (sim.association && sim.association !== "none") p.push(title(sim.association));
        if (sim.imperfection && sim.imperfection !== "none") p.push(title(sim.imperfection));
        out.push(line("Similarity", p.join(" / ")));
      }
      const g = s.gradation;
      if (g && g.enabled) {
        const p = [pick(GATTR, g.type), pick(PATH, g.pathway)];
        if ((g.steps || 1) > 1) p.push(`${g.steps} cycles`);
        if (g.reverse) p.push("Reversed");
        out.push(line("Gradation", p.join(" / ")));
      }
      const an = s.anomaly;
      if (an && an.enabled) out.push(line("Anomaly", [pick(ANOM, an.type), title(an.distribution || "single"), `${an.radius}px`].join(" / ")));
      const co = s.contrast;
      if (co && co.enabled) out.push(line("Contrast", [pick(DIM, co.dimension), `${co.dominanceRatio}%`, pick(SPREAD, co.spread || "scattered")].join(" / ")));
      const cn = s.concentration;
      if (cn && cn.enabled) out.push(line("Concentration", [pick(CMODE, cn.mode), title(cn.method || "move")].join(" / ")));
      const tx = s.texture;
      if (tx && tx.enabled) out.push(line("Texture", `Jitter ${tx.jitter} / Undulation ${tx.undulation}`));
      const sp = s.space;
      if (sp && sp.enabled) out.push(line("Space", `${title(sp.mode)} / Depth ${sp.depth}`));
    }

    const html = out.join("");
    if (html !== this._artLogHtml) {
      this._artLogHtml = html;
      box.innerHTML = html;
    }
  }

  updateLayerCardsUI() {
    const container = document.getElementById("layers-stack-container");
    const addBtn = document.getElementById("btn-add-pattern");
    const layersCountBadge = document.getElementById("layers-count-badge");

    const layers = this.getLayers();
    const count = layers.length;

    if (layersCountBadge) layersCountBadge.textContent = `${count}`;

    if (addBtn) {
      const isMax = count >= 5;
      addBtn.disabled = isMax;
      addBtn.classList.toggle("opacity-40", isMax);
      addBtn.classList.toggle("cursor-not-allowed", isMax);
    }

    const activeMod = this.getActiveModule();
    const activeName = activeMod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");
    const badgeModule = document.getElementById("active-layer-indicator-badge");
    if (badgeModule) badgeModule.textContent = activeName;
    const badgeLayout = document.getElementById("badge-layout-layer");
    if (badgeLayout) badgeLayout.textContent = activeName;
    const badgeStructure = document.getElementById("badge-structure-layer");
    if (badgeStructure) badgeStructure.textContent = activeName;
    const badgeSimilarity = document.getElementById("badge-similarity-layer");
    if (badgeSimilarity) badgeSimilarity.textContent = activeName;
    const badgeGradation = document.getElementById("badge-gradation-layer");
    if (badgeGradation) badgeGradation.textContent = activeName;
    const badgeAnomaly = document.getElementById("badge-anomaly-layer");
    if (badgeAnomaly) badgeAnomaly.textContent = activeName;
    const badgeContrast = document.getElementById("badge-contrast-layer");
    if (badgeContrast) badgeContrast.textContent = activeName;
    const badgeConcentration = document.getElementById("badge-concentration-layer");
    if (badgeConcentration) badgeConcentration.textContent = activeName;
    const badgeSpace = document.getElementById("badge-space-layer");
    if (badgeSpace) badgeSpace.textContent = activeName;
    const badgeTexture = document.getElementById("badge-texture-layer");
    if (badgeTexture) badgeTexture.textContent = activeName;

    if (!container) return;

    const order = (this.state.layerOrder && this.state.layerOrder.length > 0)
      ? this.state.layerOrder
      : layers.map(l => l.id);

    const orderedLayers = [];
    for (const id of order) {
      const found = layers.find(l => l.id === id);
      if (found) orderedLayers.push(found);
    }
    for (const l of layers) {
      if (!orderedLayers.includes(l)) orderedLayers.push(l);
    }
    this.state.layerOrder = orderedLayers.map(l => l.id);

    const canDelete = count > 1;
    container.innerHTML = orderedLayers.map(l => {
      const isActive = l.id === this.activeLayerId;
      const isVis = l.visible !== false;
      const shapeDef = Shapes[l.shape] || Shapes.circle;
      const icon = shapeIconHtml(shapeDef);
      const mode = l.wireframe !== false ? "stroke" : "fill";
      const s = l.structure;
      const structText = s?.enabled ? (s.mode === "radiation" ? " • radiation" : " • grid") : "";

      return `
        <div id="layer-card-${l.id}" class="layer-card ${isActive ? 'is-active' : ''} ${!isVis ? 'is-hidden' : ''}" data-layer-id="${l.id}" draggable="true">
          <div class="layer-preview-box pointer-events-none">
            ${icon}
          </div>
          <div class="layer-copy pointer-events-none">
            <div class="layer-title">${l.name || l.id}</div>
            <div class="layer-subtitle">${l.shape} • ${mode}${structText}</div>
          </div>
          <div class="layer-actions">
            <button type="button" class="layer-action-btn btn-layer-eye" data-layer="${l.id}" title="Toggle Visibility" aria-label="Toggle visibility of ${l.name || l.id}">
              ${isVis ? '<i class="ph ph-eye" aria-hidden="true"></i>' : '<i class="ph ph-eye-slash opacity-40" aria-hidden="true"></i>'}
            </button>
            <button type="button" class="layer-action-btn btn-layer-delete ${!canDelete ? 'opacity-25 cursor-not-allowed' : ''}" data-layer="${l.id}" title="${canDelete ? 'Delete Layer' : 'Cannot delete the only layer'}" aria-label="Delete ${l.name || l.id}" ${!canDelete ? 'disabled' : ''}>
              <i class="ph ph-trash" aria-hidden="true"></i>
            </button>
            <span class="layer-action-btn layer-drag-handle cursor-grab active:cursor-grabbing" title="Drag to reorder" aria-hidden="true">
              <i class="ph ph-dots-six-vertical"></i>
            </span>
          </div>
        </div>
      `;
    }).join("");

    this.updateArtLog();
  }

  /* =========================================================================
     CONTROLS RAIL & FLYOUT CONTROLLER (Abstract Studio Dock)
     ========================================================================= */

  setupControlsRail() {
    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.railTab;
        if (this.activeRailTab === tab && this.isFlyoutOpen) {
          // Clicking active button toggles flyout closed
          this.isFlyoutOpen = false;
        } else {
          this.activeRailTab = tab;
          this.isFlyoutOpen = true;
        }
        this.updateRailUI();
      });
    });

    // Close button inside any flyout tab header
    document.querySelectorAll(".close-flyout-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isFlyoutOpen = false;
        this.updateRailUI();
      });
    });

    this.updateRailUI();
    this.updateRailIndicatorDots();
  }

  updateRailUI() {
    const flyout = document.getElementById("inspector-flyout");
    if (flyout) {
      flyout.classList.toggle("is-closed", !this.isFlyoutOpen);
    }

    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      const isSelected = this.isFlyoutOpen && btn.dataset.railTab === this.activeRailTab;
      btn.classList.toggle("active", isSelected);
    });

    const tabContents = document.querySelectorAll(".flyout-tab-content");
    tabContents.forEach(tabEl => {
      const match = tabEl.dataset.flyoutTab === this.activeRailTab;
      tabEl.classList.toggle("hidden", !match);
    });

    // Hide modifiers only acts while the Module panel is open
    if (this.hideModifiers) this.render();
  }

  updateRailIndicatorDots() {
    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      const tab = btn.dataset.railTab;
      let isActive = false;
      const mod = this.getActiveModule();
      if (tab === "module") {
        isActive = true;
      } else if (tab === "layout") {
        isActive = !!mod?.structure?.enabled;
      } else if (tab === "structure") {
        isActive = !!mod?.structure?.formalStructure?.enabled;
      } else if (tab === "similarity") {
        isActive = !!mod?.structure?.similarity?.enabled;
      } else if (tab === "gradation") {
        isActive = !!mod?.structure?.gradation?.enabled;
      } else if (tab === "anomaly") {
        isActive = !!mod?.structure?.anomaly?.enabled;
      } else if (tab === "contrast") {
        isActive = !!mod?.structure?.contrast?.enabled;
      } else if (tab === "concentration") {
        isActive = !!mod?.structure?.concentration?.enabled;
      } else if (tab === "space") {
        isActive = !!mod?.structure?.space?.enabled;
      } else if (tab === "texture") {
        isActive = !!mod?.structure?.texture?.enabled;
      }
      btn.classList.toggle("has-modifier-active", isActive);
      // The name says whether the modifier is on for this layer
      const base = btn.dataset.railLabel || (btn.dataset.railLabel = btn.getAttribute("title") || tab);
      btn.setAttribute("aria-label", `${base}, ${isActive ? "on" : "off"}`);
    });
  }

  syncStructureInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const struct = this.getActiveLayerStructure();
    if (!struct) return;

    const toggleSwitch = document.getElementById("toggle-layout-structure");
    const btnRep = document.getElementById("btn-layout-repetition");
    const btnRad = document.getElementById("btn-layout-radiation");
    const pnlRep = document.getElementById("subpanel-repetition");
    const pnlRad = document.getElementById("subpanel-radiation");

    const layoutBadge = document.getElementById("badge-layout-layer");
    if (layoutBadge) layoutBadge.textContent = mod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    if (toggleSwitch) toggleSwitch.checked = !!struct.enabled;

    const isRad = struct.mode === "radiation";
    btnRep?.classList.toggle("active", !isRad);
    btnRad?.classList.toggle("active", isRad);

    if (isRad) {
      pnlRep?.classList.add("hidden");
      pnlRad?.classList.remove("hidden");
    } else {
      pnlRep?.classList.remove("hidden");
      pnlRad?.classList.add("hidden");
    }

    // Sync Repetition Controls
    const rep = struct.repetition;
    if (rep) {
      document.querySelectorAll("[data-grid-var]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.gridVar === rep.gridType);
      });
      this.syncControlValue("input-layout-cols", rep.cols || 4);
      this.syncControlValue("num-layout-cols", rep.cols || 4);
      this.syncControlValue("input-layout-rows", rep.rows || 4);
      this.syncControlValue("num-layout-rows", rep.rows || 4);
      this.syncCheckbox("chk-rep-clip", !!rep.activeClipping);
      this.syncCheckbox("chk-rep-gridlines", !!rep.showGridLines);
      this.syncCheckbox("chk-rep-checker", !!rep.checkerInvert);
      this.syncRepetitionExtras(rep);
    }

    // Sync Radiation Controls
    const rad = struct.radiation;
    if (rad) {
      document.querySelectorAll("[data-rad-scheme]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radScheme === rad.scheme);
      });
      this.syncControlValue("input-layout-rays", rad.rays || 12);
      this.syncControlValue("num-layout-rays", rad.rays || 12);
      this.syncControlValue("input-layout-rings", rad.rings || 6);
      this.syncControlValue("num-layout-rings", rad.rings || 6);
      this.syncControlValue("input-layout-centers", rad.centerCount || 2);
      this.syncControlValue("num-layout-centers", rad.centerCount || 2);
      document.getElementById("rad-centers-block")?.classList.toggle("hidden", rad.scheme !== "multi_center");
      this.syncControlValue("input-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      this.syncControlValue("num-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      document.querySelectorAll("[data-rad-size]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radSize === (rad.sizeMode || "fit"));
      });
      document.querySelectorAll("[data-rad-dir]").forEach(btn => btn.classList.toggle("active", btn.dataset.radDir === (rad.direction || "repeated")));
      document.querySelectorAll("[data-rad-shape]").forEach(btn => btn.classList.toggle("active", btn.dataset.radShape === (rad.ringShape || "circle")));
      // Polygonal rings do not apply to spirals or chevrons
      document.getElementById("rad-ringshape-block")?.classList.toggle("hidden", rad.scheme === "spiral" || rad.scheme === "centripetal");
      document.getElementById("rad-lines-block")?.classList.toggle("hidden", !(rad.showRays || rad.showRings));
      this.syncAccentColorRow("radline", rad.lineColor || mod?.color || "#18181f", true);
      this.syncControlValue("input-layout-radline", rad.lineWidth ?? 1);
      this.syncControlValue("num-layout-radline", `${rad.lineWidth ?? 1}px`);
      this.syncControlValue("input-layout-open", rad.centerOpen || 0);
      this.syncControlValue("num-layout-open", `${rad.centerOpen || 0}%`);
      this.syncControlValue("input-layout-ringrot", rad.ringRotation || 0);
      this.syncControlValue("num-layout-ringrot", `${rad.ringRotation || 0}º`);
      document.querySelectorAll("[data-rad-orient]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radOrient === (rad.orientation || "auto"));
      });
      this.syncCheckbox("chk-rad-clip", !!rad.activeClipping);
      this.syncCheckbox("chk-rad-gridlines", !!(rad.showRays || rad.showRings));
      this.syncCheckbox("chk-rad-checker", !!rad.checkerInvert);
    }

    this.updateRailIndicatorDots();
  }

  /* =========================================================================
     LAYOUT STRUCTURE CONTROLLER (Per Active Layer)
     ========================================================================= */

  // Parameter each grid variation exposes (stored value <-> shown value)
  static get REPETITION_PARAMS() {
    return {
      sliding: { label: "Row offset", key: "slideOffset", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      sheared: { label: "Shear angle", key: "shearAngle", min: 0, max: 45, step: 1, suffix: "º", toUi: v => v, fromUi: v => v },
      curved: { label: "Wave amount", key: "curveAmount", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      zigzag: { label: "Wave amount", key: "curveAmount", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      free: { label: "Seed", key: "freeSeed", min: 1, max: 99, step: 1, suffix: "", toUi: v => v, fromUi: v => v }
    };
  }

  // Switching to Actual size with the default container: the container starts as big as a Fit cell,
  // so the structure keeps its rhythm. A container that was already set is left alone.
  startContainerFromCell(cols, rows) {
    const mod = this.getActiveModule();
    if (!mod || mod.containerW > 0 || mod.containerH > 0) return;
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    mod.containerW = Math.round(cfg.w / Math.max(1, cols));
    mod.containerH = Math.round(cfg.h / Math.max(1, rows));
  }

  syncRepetitionExtras(rep) {
    const spec = StudioProApp.REPETITION_PARAMS[rep.gridType];
    const block = document.getElementById("rep-param-block");
    block?.classList.toggle("hidden", !spec);
    if (spec) {
      const slider = document.getElementById("input-layout-param");
      if (slider) { slider.min = spec.min; slider.max = spec.max; slider.step = spec.step; }
      const label = document.getElementById("rep-param-label");
      if (label) label.textContent = spec.label;
      // A project saved in pixels (curveIntensity) is shown as a share of the cell width, without touching the file
      const legacy = spec.key === "curveAmount" && rep.curveAmount === undefined && rep.curveIntensity !== undefined;
      const val = spec.toUi(legacy ? Math.min(1, (rep.curveIntensity || 0) / (600 / Math.max(1, rep.cols || 4))) : (rep[spec.key] ?? 0));
      this.syncControlValue("input-layout-param", val);
      const num = document.getElementById("num-layout-param");
      if (num) num.value = `${val}${spec.suffix}`;
    }
    document.getElementById("rep-lines-block")?.classList.toggle("hidden", !rep.showGridLines);
    this.syncAccentColorRow("repline", rep.lineColor || this.getActiveModule()?.color || "#18181f", true);
    const mark = (attr, value) => document.querySelectorAll(`[${attr}]`).forEach(b => {
      const v = b.getAttribute(attr);
      b.classList.toggle("active", v === value);
    });
    mark("data-rep-size", rep.sizeMode || "fit");
    mark("data-rep-dir", rep.direction || "repeated");
    mark("data-rep-place", rep.placement || "centers");
    mark("data-rep-mix", rep.cellMix || "none");
    // Placement does not apply to the honeycomb; mixed sizes only to the plain and alternating grids
    document.getElementById("rep-placement-block")?.classList.toggle("hidden", rep.gridType === "hexagonal" || rep.gridType === "free");
    document.getElementById("rep-mix-block")?.classList.toggle("hidden", !(rep.gridType === "basic" || rep.gridType === "alternating"));
    const interOn = rep.gridType !== "hexagonal" && rep.gridType !== "free" && (rep.placement || "centers") !== "centers";
    document.getElementById("rep-inter-block")?.classList.toggle("hidden", !interOn);
    this.syncControlValue("input-layout-inter", rep.interScale ?? 50);
    const ni = document.getElementById("num-layout-inter");
    if (ni) ni.value = `${rep.interScale ?? 50}%`;
    mark("data-rep-linedir", rep.lineDirection || "both");
    mark("data-rep-linespace", rep.lineSpacing || "all");
    mark("data-rep-reflect", rep.reflection || "none");
    const w = rep.gridLineWidth ?? 1.5;
    this.syncControlValue("input-layout-linewidth", w);
    const nw = document.getElementById("num-layout-linewidth");
    if (nw) nw.value = `${w}px`;
  }

  // Value boxes: the up and down arrow keys nudge the number by the slider's step (Shift = ten steps, Alt = a tenth of a step)
  setupValueSteppers() {
    document.addEventListener("keydown", (e) => {
      const box = e.target;
      if (!box || !box.classList || !box.classList.contains("ds-value")) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const slider = box.closest(".ds-slider")?.querySelector('input[type="range"]');
      const m = String(box.value).match(/^\s*(-?\d*\.?\d+)(.*)$/);
      if (!slider || !m) return;
      e.preventDefault();
      const step = parseFloat(slider.step) || 1;
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const decimals = Math.max((String(step).split(".")[1] || "").length, e.altKey ? 2 : 0);
      const min = slider.min !== "" ? parseFloat(slider.min) : -Infinity, max = slider.max !== "" ? parseFloat(slider.max) : Infinity;
      let next = parseFloat(m[1]) + (e.key === "ArrowUp" ? 1 : -1) * step * mult;
      next = Math.max(min, Math.min(max, parseFloat(next.toFixed(decimals))));
      box.value = `${next}${m[2]}`;
      box.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  // Dropdowns (.ds-select): the items are the same buttons the controllers already listen to, so a click
  // only has to close the menu. The trigger always shows whichever item is marked active.
  setupSelects() {
    const selects = document.querySelectorAll("[data-select]");
    const closeAll = (except) => selects.forEach(sel => {
      if (sel === except) return;
      sel.querySelector(".ds-dropdown-menu")?.classList.add("hidden");
      sel.querySelector(".ds-dropdown-trigger")?.setAttribute("aria-expanded", "false");
    });
    selects.forEach(sel => {
      const trigger = sel.querySelector(".ds-dropdown-trigger");
      const menu = sel.querySelector(".ds-dropdown-menu");
      const current = sel.querySelector(".ds-dropdown-current");
      const refresh = () => {
        const active = menu.querySelector(".ds-dropdown-item.active") || menu.querySelector(".ds-dropdown-item");
        if (active && current) current.innerHTML = active.innerHTML;
      };
      // The menu floats above the panel (fixed), below the trigger, or above it when there is no room below
      const place = () => {
        const r = trigger.getBoundingClientRect();
        const gap = 6, below = window.innerHeight - r.bottom - gap - 8, above = r.top - gap - 8;
        const want = Math.min(320, menu.scrollHeight);
        const up = below < want && above > below;
        const room = Math.max(120, up ? above : below);
        menu.style.left = `${r.left}px`;
        menu.style.width = `${r.width}px`;
        menu.style.maxHeight = `${Math.min(320, room)}px`;
        const h = Math.min(want, room);
        menu.style.top = `${up ? r.top - gap - h : r.bottom + gap}px`;
      };
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = menu.classList.contains("hidden");
        closeAll(sel);
        menu.classList.toggle("hidden", !open);
        trigger.setAttribute("aria-expanded", String(open));
        if (open) place();
      });
      menu.addEventListener("click", () => {
        menu.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
        refresh();
      });
      new MutationObserver(refresh).observe(menu, { attributes: true, attributeFilter: ["class"], subtree: true });
      refresh();
    });
    document.addEventListener("click", () => closeAll(null));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(null); });
    // A floating menu would stay behind when the panel scrolls or the window changes size
    window.addEventListener("resize", () => closeAll(null));
    document.querySelectorAll(".inspector-flyout-card").forEach(card => card.addEventListener("scroll", () => closeAll(null), { passive: true }));
  }

  setupRepetitionExtras() {
    const rep = () => this.getActiveLayerStructure()?.repetition;

    // Variation parameter (row offset / shear angle / wave amount)
    const slider = document.getElementById("input-layout-param");
    const num = document.getElementById("num-layout-param");
    const applyParam = (uiVal, label, push) => {
      const r = rep(); const spec = r && StudioProApp.REPETITION_PARAMS[r.gridType];
      if (!spec) return;
      const v = Math.max(spec.min, Math.min(spec.max, uiVal));
      r[spec.key] = spec.fromUi(v);
      this.getActiveLayerStructure().mode = "repetition";
      this.syncRepetitionExtras(r);
      this.render();
      if (push) this.pushHistory(`Layer ${this.activeLayerId} ${spec.label}: ${v}${spec.suffix}`);
    };
    slider?.addEventListener("input", (e) => applyParam(parseFloat(e.target.value), "", false));
    slider?.addEventListener("change", (e) => applyParam(parseFloat(e.target.value), "", true));
    num?.addEventListener("change", (e) => {
      const raw = parseFloat(e.target.value.replace(/[^0-9.-]/g, ""));
      applyParam(isNaN(raw) ? 0 : raw, "", true);
    });

    // Tags of the line style and of the reflection (one stored value each)
    const bindTags = (selector, attr, key, label) => {
      document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener("click", () => {
          const r = rep(); if (!r) return;
          r[key] = btn.getAttribute(attr);
          if (key === "sizeMode" && r.sizeMode === "actual") this.startContainerFromCell(r.cols, r.rows);
          this.getActiveLayerStructure().mode = "repetition";
          this.syncAllInspectorsWithActiveLayer();
          this.syncRepetitionExtras(r);
          this.render();
          this.pushHistory(`Layer ${this.activeLayerId} ${label}: ${r[key]}`);
        });
      });
    };
    const bindGuideColor = (id, getBlock, label) => {
      const input = document.getElementById(id);
      input?.addEventListener("input", (e) => {
        const b = getBlock();
        if (!b) return;
        b.lineColor = e.target.value;
        this.syncAccentColorRow(id.replace("-accent-color", ""), e.target.value, true);
        this.render();
      });
      input?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${label}: ${e.target.value.toUpperCase()}`));
    };
    bindGuideColor("repline-accent-color", () => this.getActiveLayerStructure()?.repetition, "Line Color");
    bindGuideColor("radline-accent-color", () => this.getActiveLayerStructure()?.radiation, "Radiation Line Color");
    bindTags("[data-rep-linedir]", "data-rep-linedir", "lineDirection", "Line Direction");
    bindTags("[data-rep-linespace]", "data-rep-linespace", "lineSpacing", "Line Spacing");
    bindTags("[data-rep-reflect]", "data-rep-reflect", "reflection", "Reflection");
    bindTags("[data-rep-size]", "data-rep-size", "sizeMode", "Module Size");
    bindTags("[data-rep-dir]", "data-rep-dir", "direction", "Direction");
    bindTags("[data-rep-place]", "data-rep-place", "placement", "Module Placement");
    bindTags("[data-rep-mix]", "data-rep-mix", "cellMix", "Cell Mix");
    this.bindSliderWithNumber("input-layout-inter", "num-layout-inter", (val) => {
      const r = rep(); if (!r) return;
      r.interScale = Math.max(10, Math.min(100, val));
      this.getActiveLayerStructure().mode = "repetition";
      this.render();
    }, "Intersection Size", "%");

    // Line width of the visible grid lines
    const lw = document.getElementById("input-layout-linewidth");
    const nlw = document.getElementById("num-layout-linewidth");
    const applyWidth = (val, push) => {
      const r = rep(); if (!r) return;
      const v = Math.max(0.5, Math.min(10, val));
      r.gridLineWidth = v;
      this.syncRepetitionExtras(r);
      this.render();
      if (push) this.pushHistory(`Layer ${this.activeLayerId} Grid Line Width: ${v}px`);
    };
    lw?.addEventListener("input", (e) => applyWidth(parseFloat(e.target.value), false));
    lw?.addEventListener("change", (e) => applyWidth(parseFloat(e.target.value), true));
    nlw?.addEventListener("change", (e) => {
      const raw = parseFloat(e.target.value.replace(/[^0-9.]/g, ""));
      applyWidth(isNaN(raw) ? 1.5 : raw, true);
    });
  }

  setupLayoutStructure() {
    const toggleSwitch = document.getElementById("toggle-layout-structure");
    const btnRep = document.getElementById("btn-layout-repetition");
    const btnRad = document.getElementById("btn-layout-radiation");

    // Header Toggle Switch
    toggleSwitch?.addEventListener("change", (e) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      const enabled = e.target.checked;
      struct.enabled = enabled;
      if (!enabled && struct.formalStructure) {
        struct.formalStructure.enabled = false;
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.syncAllInspectorsWithActiveLayer(); // every collective modifier shows or hides its "turn on Layout" notice
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Layout Structure: ${enabled ? "ON" : "OFF"}`);
    });

    const setMode = (mode) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.mode = mode;
      struct.enabled = true;
      if (mode === "radiation" && struct.formalStructure) {
        struct.formalStructure.enabled = false;
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.syncAllInspectorsWithActiveLayer(); // every collective modifier shows or hides its "turn on Layout" notice
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Layout Mode: ${mode}`);
    };

    btnRep?.addEventListener("click", () => setMode("repetition"));
    btnRad?.addEventListener("click", () => setMode("radiation"));

    // Repetition Variations (Grid, Curved, Brick, Diagonal, Zigzag, Triangular, Alternating)
    document.querySelectorAll("[data-grid-var]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.repetition.gridType = btn.dataset.gridVar;
        struct.mode = "repetition";
        struct.enabled = true;
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Layer ${this.activeLayerId} Grid Var: ${btn.dataset.gridVar}`);
      });
    });

    // Repetition Sliders (Columns, Rows)
    this.bindSliderWithNumber("input-layout-cols", "num-layout-cols", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.repetition.cols = val;
      struct.mode = "repetition";
      this.render();
    });

    this.bindSliderWithNumber("input-layout-rows", "num-layout-rows", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.repetition.rows = val;
      struct.mode = "repetition";
      this.render();
    });

    // Repetition Checkboxes
    const chkRepClip = document.getElementById("chk-rep-clip");
    if (chkRepClip) {
      chkRepClip.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.repetition.activeClipping = e.target.checked;
        this.render();
      });
    }

    const chkRepGrid = document.getElementById("chk-rep-gridlines");
    if (chkRepGrid) {
      chkRepGrid.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) {
          struct.repetition.showGridLines = e.target.checked;
          if (struct.formalStructure) {
            struct.formalStructure.showGridLines = e.target.checked;
          }
        }
        const structGrid = document.getElementById("chk-struct-gridlines");
        if (structGrid) structGrid.checked = e.target.checked;
        if (struct) this.syncRepetitionExtras(struct.repetition);
        this.render();
      });
    }

    const chkRepChecker = document.getElementById("chk-rep-checker");
    if (chkRepChecker) {
      chkRepChecker.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.repetition.checkerInvert = e.target.checked;
        this.render();
      });
    }

    // Radiation Schemes (Centrifugal, Concentric, Spiral, Dual-center)
    document.querySelectorAll("[data-rad-scheme]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.radiation.scheme = btn.dataset.radScheme;
        struct.mode = "radiation";
        struct.enabled = true;
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Layer ${this.activeLayerId} Rad Scheme: ${btn.dataset.radScheme}`);
      });
    });

    // Radiation Sliders
    this.bindSliderWithNumber("input-layout-rays", "num-layout-rays", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.rays = val;
      struct.mode = "radiation";
      this.render();
    });

    this.bindSliderWithNumber("input-layout-rings", "num-layout-rings", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.rings = val;
      struct.mode = "radiation";
      this.render();
    });

    this.bindSliderWithNumber("input-layout-centers", "num-layout-centers", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.centerCount = Math.max(2, Math.min(8, Math.round(val)));
      struct.mode = "radiation";
      this.render();
    }, "Centers");

    this.bindSliderWithNumber("input-layout-twist", "num-layout-twist", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.spiralTwist = val;
      struct.mode = "radiation";
      this.render();
    });

    const bindRadTags = (selector, dataKey, prop, label) => {
      document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener("click", () => {
          const struct = this.getActiveLayerStructure();
          if (!struct) return;
          struct.radiation[prop] = btn.dataset[dataKey];
          struct.mode = "radiation";
          this.syncStructureInspectorWithActiveLayer();
          this.render();
          this.pushHistory(`Layer ${this.activeLayerId} ${label}: ${btn.dataset[dataKey]}`);
        });
      });
    };
    bindRadTags("[data-rad-dir]", "radDir", "direction", "Radiation Direction");
    bindRadTags("[data-rad-shape]", "radShape", "ringShape", "Ring Shape");
    this.bindSliderWithNumber("input-layout-radline", "num-layout-radline", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.lineWidth = Math.max(0.5, Math.min(10, val));
      this.render();
    }, "Radiation Line Width", "px");

    document.querySelectorAll("[data-rad-size]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.radiation.sizeMode = btn.dataset.radSize;
        if (struct.radiation.sizeMode === "actual") {
          // each ring starts as thick as a Fit ring
          const mod = this.getActiveModule();
          if (mod && !(mod.containerW > 0 || mod.containerH > 0)) {
            const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
            mod.containerH = mod.containerW = Math.round((0.5 * Math.min(cfg.w, cfg.h)) / Math.max(2, struct.radiation.rings));
          }
        }
        struct.mode = "radiation";
        this.syncAllInspectorsWithActiveLayer();
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.pushHistory(`Layer ${this.activeLayerId} Radiation Module Size: ${btn.dataset.radSize}`);
      });
    });

    this.bindSliderWithNumber("input-layout-open", "num-layout-open", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.centerOpen = val;
      struct.mode = "radiation";
      this.render();
    }, "Open Center", "%");

    this.bindSliderWithNumber("input-layout-ringrot", "num-layout-ringrot", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.ringRotation = val;
      struct.mode = "radiation";
      this.render();
    }, "Ring Rotation", "º");

    document.querySelectorAll("[data-rad-orient]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.radiation.orientation = btn.dataset.radOrient;
        struct.mode = "radiation";
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.pushHistory(`Layer ${this.activeLayerId} Module Orientation: ${btn.dataset.radOrient}`);
      });
    });

    // Radiation Checkboxes
    const chkRadClip = document.getElementById("chk-rad-clip");
    if (chkRadClip) {
      chkRadClip.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.radiation.activeClipping = e.target.checked;
        this.render();
      });
    }

    const chkRadGrid = document.getElementById("chk-rad-gridlines");
    if (chkRadGrid) {
      chkRadGrid.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) {
          struct.radiation.showRays = e.target.checked;
          struct.radiation.showRings = e.target.checked;
        }
        this.syncStructureInspectorWithActiveLayer();
        this.render();
      });
    }

    const chkRadChecker = document.getElementById("chk-rad-checker");
    if (chkRadChecker) {
      chkRadChecker.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.radiation.checkerInvert = e.target.checked;
        this.render();
      });
    }
  }

  /* =========================================================================
     FORMAL STRUCTURE CONTROLLER (Exact match to mockup media_1790991477208.png)
     Rhythmic Col & Row Ratios, Warning Alert Banner, Visible Grid Lines
     ========================================================================= */

  syncFormalStructureInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    if (!mod) return;

    if (!mod.structure) {
      mod.structure = this.getActiveLayerStructure();
    }
    if (!mod.structure.formalStructure) {
      mod.structure.formalStructure = {
        enabled: false,
        colRatio: 1.0,
        rowRatio: 1.0,
        showGridLines: false
      };
    }

    const fs = mod.structure.formalStructure;

    // Update layer badge
    const badge = document.getElementById("badge-structure-layer");
    if (badge) badge.textContent = mod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    // Dynamic warning: This control cannot be used when Radiation is active in Layout structure control
    const isRadActive = !!(mod.structure.enabled && mod.structure.mode === "radiation");
    const warnBox = document.getElementById("warning-structure-radiation");
    const controlsGroup = document.getElementById("struct-controls-group");
    const toggle = document.getElementById("toggle-structure-active");

    if (warnBox) warnBox.classList.toggle("hidden", !isRadActive);
    if (controlsGroup) {
      controlsGroup.classList.toggle("opacity-40", isRadActive);
      controlsGroup.classList.toggle("pointer-events-none", isRadActive);
    }

    if (toggle) {
      toggle.checked = !!fs.enabled;
      toggle.disabled = isRadActive;
    }

    this.syncControlValue("input-struct-col-ratio", Math.round(100 / (fs.colRatio || 1)));
    this.syncControlValue("num-struct-col-ratio", `${Math.round(100 / (fs.colRatio || 1))}%`);
    this.syncControlValue("input-struct-col-grade", fs.colGrade || 0);
    this.syncControlValue("num-struct-col-grade", `${fs.colGrade || 0}%`);
    this.syncControlValue("input-struct-row-grade", fs.rowGrade || 0);
    this.syncControlValue("num-struct-row-grade", `${fs.rowGrade || 0}%`);
    this.syncControlValue("input-struct-row-ratio", Math.round(100 / (fs.rowRatio || 1)));
    this.syncControlValue("num-struct-row-ratio", `${Math.round(100 / (fs.rowRatio || 1))}%`);
    this.syncCheckbox("chk-struct-gridlines", !!fs.showGridLines);

    this.updateRailIndicatorDots();
  }

  setupFormalStructure() {
    const toggle = document.getElementById("toggle-structure-active");

    toggle?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      const enabled = e.target.checked;
      mod.structure.formalStructure.enabled = enabled;
      if (enabled) {
        mod.structure.enabled = true;
        if (mod.structure.mode === "radiation") {
          mod.structure.mode = "repetition";
        }
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Formal Structure: ${enabled ? "ON" : "OFF"}`);
    });

    // Gradation of structure: columns / rows that grow or shrink step by step
    const bindGrade = (inputId, numId, key, label, lo = -30, hi = 30, suffix = "%") => {
      this.bindSliderWithNumber(inputId, numId, (val) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.formalStructure) {
          mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
        }
        mod.structure.formalStructure[key] = Math.max(lo, Math.min(hi, val));
        mod.structure.formalStructure.enabled = true;
        mod.structure.enabled = true;
        if (mod.structure.mode === "radiation") mod.structure.mode = "repetition";
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
      }, label, suffix);
    };
    bindGrade("input-struct-col-grade", "num-struct-col-grade", "colGrade", "Col Gradation");
    bindGrade("input-struct-row-grade", "num-struct-row-grade", "rowGrade", "Row Gradation");

    this.bindSliderWithNumber("input-struct-col-ratio", "num-struct-col-ratio", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      mod.structure.formalStructure.colRatio = Math.max(1, Math.min(10, 100 / Math.max(10, val)));
      mod.structure.formalStructure.enabled = true;
      mod.structure.enabled = true;
      if (mod.structure.mode === "radiation") {
        mod.structure.mode = "repetition";
      }
      if (toggle) toggle.checked = true;
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
    }, "Col Ratio", "%");

    this.bindSliderWithNumber("input-struct-row-ratio", "num-struct-row-ratio", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      mod.structure.formalStructure.rowRatio = Math.max(1, Math.min(10, 100 / Math.max(10, val)));
      mod.structure.formalStructure.enabled = true;
      mod.structure.enabled = true;
      if (mod.structure.mode === "radiation") {
        mod.structure.mode = "repetition";
      }
      if (toggle) toggle.checked = true;
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
    }, "Row Ratio", "%");

    const chkGrid = document.getElementById("chk-struct-gridlines");
    if (chkGrid) {
      chkGrid.addEventListener("change", (e) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.formalStructure) {
          mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
        }
        mod.structure.formalStructure.showGridLines = e.target.checked;
        if (mod.structure.repetition) {
          mod.structure.repetition.showGridLines = e.target.checked;
        }
        const repGrid = document.getElementById("chk-rep-gridlines");
        if (repGrid) repGrid.checked = e.target.checked;
        this.render();
      });
    }
  }

  /* =========================================================================
     SIMILARITY INSPECTOR & CONTROLLER (Per Active Layer)
     Visual Kinship: Elastic, 3D tilt, Wobble, Scale, Hybrid
     Fluctuation Intensity & Spatial Cell Jitter
     ========================================================================= */

  syncSimilarityInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    if (!mod) return;

    if (!mod.structure) {
      mod.structure = this.getActiveLayerStructure();
    }
    if (!mod.structure.similarity) {
      mod.structure.similarity = {
        enabled: false,
        kinshipType: "distortion",
        intensity: 50,
        cellJitter: 0,
        seed: 42
      };
    }

    const sim = mod.structure.similarity;

    // Update layer badge
    const badge = document.getElementById("badge-similarity-layer");
    if (badge) badge.textContent = mod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    // Dependency warning: Shown only when Similarity is ON but Layout Structure is OFF (neither Repetition nor Radiation)
    const hasGrid = !!(mod.structure && mod.structure.enabled);
    const isSimActive = !!sim.enabled;
    const showWarning = !hasGrid;

    const warnBox = document.getElementById("warning-similarity-grid");
    if (warnBox) warnBox.classList.toggle("hidden", !showWarning);

    // Sync toggle switch
    const toggle = document.getElementById("toggle-similarity-active");
    if (toggle) toggle.checked = isSimActive;

    // Sync Visual Kinship Type buttons
    const activeType = sim.kinshipType || "distortion";
    document.querySelectorAll("#card-similarity [data-kinship-type]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.kinshipType === activeType);
    });

    // Association (family of shapes) and Imperfection
    const assoc = sim.association || "none", imperf = sim.imperfection || "none";
    document.querySelectorAll("#card-similarity [data-sim-assoc]").forEach(btn => btn.classList.toggle("active", btn.dataset.simAssoc === assoc));
    document.querySelectorAll("#card-similarity [data-sim-imperf]").forEach(btn => btn.classList.toggle("active", btn.dataset.simImperf === imperf));
    document.getElementById("sim-assoc-block")?.classList.toggle("hidden", assoc === "none");
    document.getElementById("sim-imperf-block")?.classList.toggle("hidden", imperf === "none");
    this.syncControlValue("input-sim-assoc-mix", sim.assocMix ?? 50);
    this.syncControlValue("num-sim-assoc-mix", `${sim.assocMix ?? 50}%`);
    this.syncControlValue("input-sim-imperf-amount", sim.imperfAmount ?? 30);
    this.syncControlValue("num-sim-imperf-amount", `${sim.imperfAmount ?? 30}%`);

    // Sync Fluctuation Intensity slider and numeric box (50%)
    const intensity = sim.intensity !== undefined ? sim.intensity : 50;
    this.syncControlValue("input-sim-intensity", intensity);
    const numIntensity = document.getElementById("num-sim-intensity");
    if (numIntensity) numIntensity.value = `${intensity}%`;

    // Sync Spatial Cell Jitter slider and numeric box (0)
    // A project saved in pixels is shown as a share of the cell, without touching the file
    const jitter = sim.cellJitterAmount > 0 ? Math.round(sim.cellJitterAmount * 100)
      : Math.min(90, Math.round(((sim.cellJitter || 0) / (300 / Math.max(1, this.getActiveLayerStructure()?.repetition?.cols || 4))) * 100));
    this.syncControlValue("input-sim-jitter", jitter);
    this.syncControlValue("num-sim-jitter", `${jitter}%`);

    this.updateRailIndicatorDots();
  }

  setupSimilarity() {
    const toggle = document.getElementById("toggle-similarity-active");

    toggle?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.similarity) {
        mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
      const enabled = e.target.checked;
      mod.structure.similarity.enabled = enabled;
      this.syncSimilarityInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Similarity: ${enabled ? "ON" : "OFF"}`);
    });

    // Association (family of shapes), Imperfection (cut or broken) and their amounts.
    // Any edit turns Similarity on for the active layer.
    const commitSim = (mutate, label) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.similarity) {
        mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
      mutate(mod.structure.similarity);
      mod.structure.similarity.enabled = true;
      if (toggle) toggle.checked = true;
      this.syncSimilarityInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (label) this.pushHistory(`Layer ${this.activeLayerId} ${label}`);
    };
    document.querySelectorAll("#card-similarity [data-sim-assoc]").forEach(btn => {
      btn.addEventListener("click", () => commitSim(s => { s.association = btn.dataset.simAssoc; }, `Similarity Association: ${btn.dataset.simAssoc}`));
    });
    document.querySelectorAll("#card-similarity [data-sim-imperf]").forEach(btn => {
      btn.addEventListener("click", () => commitSim(s => { s.imperfection = btn.dataset.simImperf; }, `Similarity Imperfection: ${btn.dataset.simImperf}`));
    });
    const bindSimPct = (sliderId, numId, key, label) => {
      const sl = document.getElementById(sliderId), nm = document.getElementById(numId);
      sl?.addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10);
        commitSim(s => { s[key] = v; });
        if (nm) nm.value = `${v}%`;
      });
      sl?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} Similarity ${label}: ${e.target.value}%`));
      nm?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const v = isNaN(raw) ? 0 : Math.max(0, Math.min(100, raw));
        commitSim(s => { s[key] = v; }, `Similarity ${label}: ${v}%`);
      });
    };
    bindSimPct("input-sim-assoc-mix", "num-sim-assoc-mix", "assocMix", "Association Mix");
    bindSimPct("input-sim-imperf-amount", "num-sim-imperf-amount", "imperfAmount", "Imperfect Modules");

    // Visual Kinship Type Pills: Elastic, 3D tilt, Wobble, Scale, Hybrid
    document.querySelectorAll("#card-similarity [data-kinship-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.similarity) {
          mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
        }
        mod.structure.similarity.kinshipType = btn.dataset.kinshipType;
        mod.structure.similarity.enabled = true;
        if (toggle) toggle.checked = true;
        document.querySelectorAll("#card-similarity [data-kinship-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.syncSimilarityInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Layer ${this.activeLayerId} Kinship Type: ${btn.dataset.kinshipType}`);
      });
    });

    // Fluctuation Intensity Slider & % Input
    const inputIntensity = document.getElementById("input-sim-intensity");
    const numIntensity = document.getElementById("num-sim-intensity");

    if (inputIntensity) {
      inputIntensity.addEventListener("input", (e) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.similarity) {
          mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
        }
        const val = parseInt(e.target.value, 10);
        mod.structure.similarity.intensity = val;
        mod.structure.similarity.enabled = true;
        if (toggle) toggle.checked = true;
        if (numIntensity) numIntensity.value = `${val}%`;
        this.render();
      });
      inputIntensity.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Similarity Intensity: ${e.target.value}%`);
      });
    }

    if (numIntensity) {
      numIntensity.addEventListener("change", (e) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.similarity) {
          mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
        }
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? 50 : Math.max(0, Math.min(100, raw));
        mod.structure.similarity.intensity = val;
        mod.structure.similarity.enabled = true;
        if (toggle) toggle.checked = true;
        numIntensity.value = `${val}%`;
        if (inputIntensity) inputIntensity.value = val;
        this.render();
        this.pushHistory(`Layer ${this.activeLayerId} Similarity Intensity: ${val}%`);
      });
    }

    // Spatial Cell Jitter Slider
    this.bindSliderWithNumber("input-sim-jitter", "num-sim-jitter", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.similarity) {
        mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
      mod.structure.similarity.cellJitterAmount = Math.max(0, Math.min(90, val)) / 100;
      mod.structure.similarity.cellJitter = 0;
      mod.structure.similarity.enabled = true;
      if (toggle) toggle.checked = true;
      this.render();
    }, "Cell Jitter", "%");
  }

  /* =========================================================================
     ACCESSIBILITY
     Gives every control an accessible name, keeps aria-pressed in sync with the
     visual "active" state, and makes layer cards reachable from the keyboard.
     ========================================================================= */

  setupAccessibility() {
    const flyout = document.getElementById("inspector-flyout");
    if (flyout) { flyout.setAttribute("role", "region"); flyout.setAttribute("aria-label", "Inspector"); }

    this.enhanceAccessibility(document);

    // Keep aria-pressed / aria-current in sync with the .active / .is-active classes
    const toggleSel = ".ds-tag, .ds-btn-group__button, .shape-circle-btn, .ds-icon-btn";
    const syncState = (el) => {
      if (el.matches(".layer-card")) el.setAttribute("aria-current", el.classList.contains("is-active") ? "true" : "false");
      else if (el.matches(".rail-btn")) el.setAttribute("aria-expanded", el.classList.contains("active") ? "true" : "false"); // is its panel open
      else el.setAttribute("aria-pressed", el.classList.contains("active") ? "true" : "false");
    };
    const stateSel = toggleSel + ", .layer-card, .rail-btn";
    document.querySelectorAll(stateSel).forEach(syncState);

    this.a11yObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes") {
          if (m.target.matches && m.target.matches(stateSel)) syncState(m.target);
        } else {
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            this.enhanceAccessibility(n);
            if (n.matches(stateSel)) syncState(n);
            n.querySelectorAll(stateSel).forEach(syncState);
          });
        }
      }
    });
    this.a11yObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });

    // Layer cards: Enter or Space selects the layer
    document.getElementById("layers-stack-container")?.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("layer-card")) {
        e.preventDefault();
        e.target.click();
      }
    });
  }

  enhanceAccessibility(root) {
    const all = (sel) => {
      const list = Array.from(root.querySelectorAll ? root.querySelectorAll(sel) : []);
      if (root.matches && root.matches(sel)) list.unshift(root);
      return list;
    };
    let uid = this._a11yUid || 0;
    const labelId = (el) => { if (!el.id) el.id = `a11y-label-${++uid}`; return el.id; };

    // Fields: the overline label names the slider, its value box and any group inside
    all(".ds-field").forEach((field) => {
      const label = field.querySelector(":scope > .ds-label");
      if (!label) return;
      const id = labelId(label);
      field.querySelectorAll(":scope > .ds-slider input, :scope > .ds-color-picker input, :scope > .ds-select select").forEach((inp) => {
        if (!inp.hasAttribute("aria-label") && !inp.hasAttribute("aria-labelledby")) inp.setAttribute("aria-labelledby", id);
      });
      field.querySelectorAll(":scope > .ds-tags, :scope > .shape-grid, :scope > .ds-btn-group").forEach((grp) => {
        grp.setAttribute("role", "group");
        if (!grp.hasAttribute("aria-label") && !grp.hasAttribute("aria-labelledby")) grp.setAttribute("aria-labelledby", id);
      });
    });

    // Accent color rows (Anomaly, Contrast): the row label names the color input
    all(".ds-color-row").forEach((row) => {
      const text = row.querySelector(".ds-color-label")?.textContent.trim();
      const inp = row.querySelector("input[type='color']");
      if (inp && text && !inp.hasAttribute("aria-label")) inp.setAttribute("aria-label", text);
    });

    // Switches: named after the card they enable
    all(".ds-switch input").forEach((inp) => {
      if (inp.hasAttribute("aria-label")) return;
      const title = inp.closest("label")?.getAttribute("title") || inp.closest(".ds-card")?.querySelector(".ds-card-title-text")?.textContent || "Toggle";
      inp.setAttribute("aria-label", title);
    });

    // Icon-only buttons take their name from the tooltip
    all("button").forEach((b) => {
      if (b.hasAttribute("aria-label") || b.textContent.trim()) return;
      const t = b.getAttribute("title");
      if (t) b.setAttribute("aria-label", t);
    });
    all(".close-flyout-btn").forEach((b) => b.setAttribute("aria-label", "Close panel"));

    // Layer cards behave like buttons
    all(".layer-card").forEach((c) => { c.setAttribute("role", "button"); c.setAttribute("tabindex", "0"); });

    this._a11yUid = uid;
  }

  /* =========================================================================
     GRADATION INSPECTOR & CONTROLLER (Per Active Layer)
     Attribute (Rotate, Scale, Depth, Drift), Range, Cycles,
     Pathway direction, Reverse
     ========================================================================= */

  getActiveGradation() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.gradation : null;
  }

  syncGradationInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const grad = this.getActiveGradation();
    if (!mod || !grad) return;

    const badge = document.getElementById("badge-gradation-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-gradation-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-gradation-active");
    if (toggle) toggle.checked = !!grad.enabled;

    document.querySelectorAll("#card-gradation [data-grad-type]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradType === grad.type);
    });
    document.querySelectorAll("#card-gradation [data-grad-pathway]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradPathway === grad.pathway);
    });

    const range = grad.range ?? 180;
    this.syncControlValue("input-grad-range", range);
    const numRange = document.getElementById("num-grad-range");
    if (numRange) numRange.value = `${range}º`;

    const steps = grad.steps ?? 1;
    this.syncControlValue("input-grad-steps", steps);
    this.syncControlValue("num-grad-steps", steps);

    const easing = grad.easing ?? 0;
    this.syncControlValue("input-grad-easing", easing);
    this.syncControlValue("num-grad-easing", easing > 0 ? `+${easing}` : `${easing}`);

    document.querySelectorAll("#card-gradation [data-grad-sequence]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradSequence === (grad.sequence || "restart"));
    });
    document.querySelectorAll("#card-gradation [data-grad-target]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradTarget === (grad.targetShape || "triangle"));
    });
    document.getElementById("grad-target-block")?.classList.toggle("hidden", grad.type !== "shape");
    document.getElementById("grad-color-block")?.classList.toggle("hidden", grad.type !== "color");
    this.syncAccentColorRow("grad", grad.endColor || "#f43f5e", true);

    // Alternate rows has nothing to do on the snake path, which already runs back and forth
    const altRow = document.getElementById("toggle-grad-alternate")?.closest("label");
    if (altRow) altRow.style.display = grad.pathway === "zigzag" ? "none" : "";
    const alternate = document.getElementById("toggle-grad-alternate");
    if (alternate) alternate.checked = !!grad.alternate;

    const reverse = document.getElementById("toggle-grad-reverse");
    if (reverse) reverse.checked = !!grad.reverse;

    this.updateRailIndicatorDots();
  }

  setupGradation() {
    const toggle = document.getElementById("toggle-gradation-active");

    // Any edit enables Gradation on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const grad = this.getActiveGradation();
      if (!grad) return;
      mutate(grad);
      grad.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncGradationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const grad = this.getActiveGradation();
      if (!grad) return;
      grad.enabled = e.target.checked;
      this.syncGradationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Gradation: ${grad.enabled ? "ON" : "OFF"}`);
    });

    const gradColor = document.getElementById("grad-accent-color");
    gradColor?.addEventListener("input", (e) => {
      const grad = this.getActiveGradation();
      if (!grad) return;
      grad.endColor = e.target.value;
      this.syncAccentColorRow("grad", e.target.value, true);
      this.render();
    });
    gradColor?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} Gradation End Color: ${e.target.value.toUpperCase()}`));

    document.querySelectorAll("#card-gradation [data-grad-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.type = btn.dataset.gradType; }, `Gradation Attribute: ${btn.dataset.gradType}`);
      });
    });
    document.querySelectorAll("#card-gradation [data-grad-pathway]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.pathway = btn.dataset.gradPathway; }, `Gradation Pathway: ${btn.dataset.gradPathway}`);
      });
    });

    // Range (5º to 360º)
    const inputRange = document.getElementById("input-grad-range");
    const numRange = document.getElementById("num-grad-range");
    inputRange?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      commit(g => { g.range = val; }, null, { resync: false });
      if (numRange) numRange.value = `${val}º`;
    });
    inputRange?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Gradation Range: ${e.target.value}º`);
    });
    numRange?.addEventListener("change", (e) => {
      const raw = parseInt(e.target.value.replace(/[^0-9-]/g, ""), 10);
      const val = isNaN(raw) ? 180 : Math.max(5, Math.min(360, raw));
      commit(g => { g.range = val; }, `Gradation Range: ${val}º`);
    });

    // Cycles (1 to 4)
    const inputSteps = document.getElementById("input-grad-steps");
    const numSteps = document.getElementById("num-grad-steps");
    inputSteps?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      commit(g => { g.steps = val; }, null, { resync: false });
      if (numSteps) numSteps.value = val;
    });
    inputSteps?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Gradation Cycles: ${e.target.value}`);
    });
    numSteps?.addEventListener("change", (e) => {
      const raw = parseInt(e.target.value, 10);
      const val = isNaN(raw) ? 1 : Math.max(1, Math.min(4, raw));
      commit(g => { g.steps = val; }, `Gradation Cycles: ${val}`);
    });

    // Acceleration (-100 brakes, 100 accelerates)
    const inputEasing = document.getElementById("input-grad-easing");
    const numEasing = document.getElementById("num-grad-easing");
    const showEasing = (v) => { if (numEasing) numEasing.value = v > 0 ? `+${v}` : `${v}`; };
    inputEasing?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      commit(g => { g.easing = val; }, null, { resync: false });
      showEasing(val);
    });
    inputEasing?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Gradation Acceleration: ${e.target.value}`);
    });
    numEasing?.addEventListener("change", (e) => {
      const raw = parseInt(e.target.value.replace(/[^0-9-]/g, ""), 10);
      const val = isNaN(raw) ? 0 : Math.max(-100, Math.min(100, raw));
      commit(g => { g.easing = val; }, `Gradation Acceleration: ${val}`);
    });

    document.querySelectorAll("#card-gradation [data-grad-sequence]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.sequence = btn.dataset.gradSequence; }, `Gradation Sequence: ${btn.dataset.gradSequence}`);
      });
    });
    document.querySelectorAll("#card-gradation [data-grad-target]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.targetShape = btn.dataset.gradTarget; }, `Gradation Becomes: ${btn.dataset.gradTarget}`);
      });
    });
    document.getElementById("toggle-grad-alternate")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(g => { g.alternate = checked; }, `Gradation Alternate: ${checked ? "ON" : "OFF"}`);
    });

    document.getElementById("toggle-grad-reverse")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(g => { g.reverse = checked; }, `Gradation Reverse: ${checked ? "ON" : "OFF"}`);
    });
  }

  // Accent color row (swatch + hex) shared by modifiers that can highlight elements.
  syncGuideColor() {
    const color = this.engine.guideColor();
    const input = document.getElementById("input-guide-color");
    if (input) input.value = color;
    document.getElementById("btn-guide-color")?.style.setProperty("--guide-color", color);
  }

  syncAccentColorRow(prefix, color, active) {
    const hex = (color || "#f43f5e").toUpperCase();
    const input = document.getElementById(`${prefix}-accent-color`);
    if (input) input.value = hex.toLowerCase();
    const swatch = document.getElementById(`${prefix}-accent-swatch`);
    if (swatch) swatch.style.backgroundColor = hex;
    const label = document.getElementById(`${prefix}-accent-hex`);
    if (label) label.textContent = prefix.endsWith("line") || active ? hex : "None";
    document.getElementById(`${prefix}-accent-row`)?.classList.toggle("is-dimmed", !active);
  }

  /* =========================================================================
     ANOMALY INSPECTOR & CONTROLLER (Per Active Layer)
     Type (Focal, Rupture, Swell, Void), Focal intruder shape, X/Y position,
     Radius, Severity, Highlight with accent color, Epicenter reticle.
     Clicking the canvas while the Anomaly tab is open sets the focal point.
     ========================================================================= */

  getActiveAnomaly() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.anomaly : null;
  }

  // Attributes each anomaly type can deviate in
  static get ANOMALY_ATTRS() {
    return {
      focal: ["shape", "scale", "rotation"],
      fracture: ["position", "rotation"],
      swell: ["position", "scale"],
      tear: ["position", "rotation", "scale"],
      regrid: []
    };
  }

  syncAnomalyInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const anom = this.getActiveAnomaly();
    if (!mod || !anom) return;

    const badge = document.getElementById("badge-anomaly-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-anomaly-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-anomaly-active");
    if (toggle) toggle.checked = !!anom.enabled;

    document.querySelectorAll("#card-anomaly [data-anom-type]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.anomType === anom.type);
    });
    document.querySelectorAll("#card-anomaly [data-anom-shape]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.anomShape === anom.anomalousShape);
    });

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-anom-radius", "num-anom-radius", anom.radius ?? 160, "px");
    setPair("input-anom-count", "num-anom-count", anom.count ?? 5, "");
    setPair("input-anom-seed", "num-anom-seed", anom.seed ?? 7, "");

    // Distribution, the attributes it can deviate in and the controls each choice needs
    const dist = anom.distribution || "single";
    document.querySelectorAll("#card-anomaly [data-anom-dist]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.anomDist === dist);
    });
    const relevant = StudioProApp.ANOMALY_ATTRS[anom.type] || [];
    document.querySelectorAll("#card-anomaly [data-anom-attr]").forEach(btn => {
      const key = btn.dataset.anomAttr;
      btn.classList.toggle("hidden", !relevant.includes(key));
      btn.classList.toggle("active", (anom.attrs || {})[key] !== false);
    });
    const shapeUsed = anom.type === "focal" && (anom.attrs || {}).shape !== false;
    document.getElementById("anom-shape-block")?.classList.toggle("hidden", !shapeUsed);
    // "Another grid": the zone only needs its grid variation, position and radius
    const regrid = anom.type === "regrid";
    document.getElementById("anom-zonegrid-block")?.classList.toggle("hidden", !regrid);
    document.getElementById("anom-attrs-block")?.classList.toggle("hidden", regrid);
    document.getElementById("anom-severity-block")?.classList.toggle("hidden", regrid);
    document.querySelectorAll("#card-anomaly [data-anom-zonegrid]").forEach(btn => btn.classList.toggle("active", btn.dataset.anomZonegrid === (anom.zoneGrid || "sliding")));
    document.getElementById("anom-position-block")?.classList.toggle("hidden", dist !== "single");
    document.getElementById("anom-count-block")?.classList.toggle("hidden", dist === "single");
    document.getElementById("anom-seed-block")?.classList.toggle("hidden", dist !== "random");
    setPair("input-anom-intensity", "num-anom-intensity", anom.intensity ?? 65, "%");

    this.syncAccentColorRow("anom", anom.accentColor, !!anom.highlightColor);
    this.syncCheckbox("toggle-anom-reticle", !!anom.showReticle);

    this.updateRailIndicatorDots();
  }

  setupAnomaly() {
    const toggle = document.getElementById("toggle-anomaly-active");

    // Any edit enables Anomaly on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const anom = this.getActiveAnomaly();
      if (!anom) return;
      mutate(anom);
      anom.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncAnomalyInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const anom = this.getActiveAnomaly();
      if (!anom) return;
      anom.enabled = e.target.checked;
      this.syncAnomalyInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Anomaly: ${anom.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-anomaly [data-anom-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.type = btn.dataset.anomType; }, `Anomaly Type: ${btn.dataset.anomType}`);
      });
    });
    document.querySelectorAll("#card-anomaly [data-anom-zonegrid]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.zoneGrid = btn.dataset.anomZonegrid; }, `Anomaly Zone Grid: ${btn.dataset.anomZonegrid}`);
      });
    });
    document.querySelectorAll("#card-anomaly [data-anom-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.anomalousShape = btn.dataset.anomShape; }, `Anomaly Shape: ${btn.dataset.anomShape}`);
      });
    });

    document.querySelectorAll("#card-anomaly [data-anom-dist]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.distribution = btn.dataset.anomDist; }, `Anomaly Distribution: ${btn.dataset.anomDist}`);
      });
    });
    // Multi-select chips: each one switches an attribute on or off
    document.querySelectorAll("#card-anomaly [data-anom-attr]").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.anomAttr;
        commit(a => {
          a.attrs = Object.assign({ shape: true, scale: true, rotation: true, position: true }, a.attrs);
          a.attrs[key] = !a.attrs[key];
        }, `Anomaly Deviates in ${key}`);
      });
    });

    // Slider + value box pairs. `toValue` maps the UI value to the stored value.
    const bindPair = (sliderId, numId, { min, max, suffix, toStored, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(a => { a[key] = toStored(val); }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Anomaly ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(a => { a[key] = toStored(val); }, `Anomaly ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-anom-count", "num-anom-count", { min: 2, max: 12, suffix: "", toStored: v => v, label: "Count", key: "count" });
    bindPair("input-anom-seed", "num-anom-seed", { min: 1, max: 99, suffix: "", toStored: v => v, label: "Seed", key: "seed" });
    bindPair("input-anom-radius", "num-anom-radius", { min: 50, max: 350, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });
    bindPair("input-anom-intensity", "num-anom-intensity", { min: 10, max: 100, suffix: "%", toStored: v => v, label: "Severity", key: "intensity" });

    // Removing the accent colour turns the highlight off
    document.getElementById("anom-accent-clear")?.addEventListener("click", () => {
      commit(a => { a.highlightColor = false; }, "Anomaly Accent: none");
    });
    // Picking an accent color also turns the highlight on.
    const anomColor = document.getElementById("anom-accent-color");
    anomColor?.addEventListener("input", (e) => {
      commit(a => { a.accentColor = e.target.value; a.highlightColor = true; }, null);
    });
    anomColor?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Anomaly Accent: ${e.target.value.toUpperCase()}`);
    });
    document.getElementById("toggle-anom-reticle")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(a => { a.showReticle = checked; }, `Anomaly Reticle: ${checked ? "ON" : "OFF"}`);
    });

    // Click on the canvas sets the focal point while the Anomaly tab is open.
    this.canvas?.addEventListener("click", (e) => {
      if (!this.isFlyoutOpen || this.activeRailTab !== "anomaly") return;
      if ((this.getActiveAnomaly()?.distribution || "single") !== "single") return; // scattered layouts have no single focal point
      const rect = this.canvas.getBoundingClientRect();
      const nx = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0.1, Math.min(0.9, (e.clientY - rect.top) / rect.height));
      commit(a => { a.epicenterX = nx; a.epicenterY = ny; }, "Anomaly Focal Point");
    });
  }

  /* =========================================================================
     CONTRAST INSPECTOR & CONTROLLER (Per Active Layer)
     Dimension (Scale, Shape, Angle, Tone), Dominance ratio,
     Contrast scale multiplier, Accentuate minority elements.
     ========================================================================= */

  getActiveContrast() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.contrast : null;
  }

  syncContrastInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const con = this.getActiveContrast();
    if (!mod || !con) return;

    const badge = document.getElementById("badge-contrast-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-contrast-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-contrast-active");
    if (toggle) toggle.checked = !!con.enabled;

    document.querySelectorAll("#card-contrast [data-contrast-spread]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.contrastSpread === (con.spread || "scattered"));
    });
    document.querySelectorAll("#card-contrast [data-contrast-dimension]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.contrastDimension === con.dimension);
    });

    const dominance = con.dominanceRatio ?? 80;
    this.syncControlValue("input-contrast-dominance", dominance);
    const numDominance = document.getElementById("num-contrast-dominance");
    if (numDominance) numDominance.value = `${dominance}%`;

    const scale = con.scaleFactor ?? 2.2;
    this.syncControlValue("input-contrast-scale", scale);
    const numScale = document.getElementById("num-contrast-scale");
    if (numScale) numScale.value = `${scale}x`;

    const tone = con.toneAmount ?? 50;
    this.syncControlValue("input-contrast-tone", tone);
    const numTone = document.getElementById("num-contrast-tone");
    if (numTone) numTone.value = `${tone}%`;
    document.getElementById("contrast-tone-block")?.classList.toggle("hidden", con.dimension !== "tone");
    const shift = con.positionShift ?? 25, shiftAngle = con.positionAngle ?? 45;
    this.syncControlValue("input-contrast-shift", shift);
    const numShift = document.getElementById("num-contrast-shift");
    if (numShift) numShift.value = `${shift}%`;
    this.syncControlValue("input-contrast-shiftangle", shiftAngle);
    const numShiftAngle = document.getElementById("num-contrast-shiftangle");
    if (numShiftAngle) numShiftAngle.value = `${shiftAngle}º`;
    document.getElementById("contrast-shift-block")?.classList.toggle("hidden", con.dimension !== "position");
    document.getElementById("contrast-shiftangle-block")?.classList.toggle("hidden", con.dimension !== "position");
    const angle = con.angle ?? 45;
    this.syncControlValue("input-contrast-angle", angle);
    const numAngle = document.getElementById("num-contrast-angle");
    if (numAngle) numAngle.value = `${angle}º`;

    document.querySelectorAll("#card-contrast [data-contrast-shape]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.contrastShape === con.contrastShape);
    });

    // Each dimension only shows the controls that drive it.
    document.getElementById("contrast-shape-block")?.classList.toggle("hidden", con.dimension !== "shape");
    document.getElementById("contrast-scale-block")?.classList.toggle("hidden", con.dimension !== "scale");
    document.getElementById("contrast-angle-block")?.classList.toggle("hidden", con.dimension !== "direction");

    this.syncAccentColorRow("contrast", con.accentColor, !!con.highlightContrast);

    this.updateRailIndicatorDots();
  }

  setupContrast() {
    const toggle = document.getElementById("toggle-contrast-active");

    // Any edit enables Contrast on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const con = this.getActiveContrast();
      if (!con) return;
      mutate(con);
      con.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncContrastInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const con = this.getActiveContrast();
      if (!con) return;
      con.enabled = e.target.checked;
      this.syncContrastInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Contrast: ${con.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-contrast [data-contrast-spread]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.spread = btn.dataset.contrastSpread; }, `Contrast Spread: ${btn.dataset.contrastSpread}`);
      });
    });
    document.querySelectorAll("#card-contrast [data-contrast-dimension]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.dimension = btn.dataset.contrastDimension; }, `Contrast Dimension: ${btn.dataset.contrastDimension}`);
      });
    });

    const bindPair = (sliderId, numId, { min, max, suffix, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        commit(c => { c[key] = val; }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Contrast ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseFloat(e.target.value.replace(/[^0-9.]/g, ""));
        const val = isNaN(raw) ? min : Math.round(Math.max(min, Math.min(max, raw)) * 10) / 10;
        commit(c => { c[key] = val; }, `Contrast ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-contrast-dominance", "num-contrast-dominance", { min: 50, max: 95, suffix: "%", label: "Dominance", key: "dominanceRatio" });
    bindPair("input-contrast-scale", "num-contrast-scale", { min: 0.2, max: 3, suffix: "x", label: "Scale", key: "scaleFactor" });
    bindPair("input-contrast-angle", "num-contrast-angle", { min: 15, max: 90, suffix: "º", label: "Angle", key: "angle" });
    bindPair("input-contrast-tone", "num-contrast-tone", { min: 10, max: 90, suffix: "%", label: "Tone", key: "toneAmount" });
    bindPair("input-contrast-shift", "num-contrast-shift", { min: 5, max: 50, suffix: "%", label: "Shift", key: "positionShift" });
    bindPair("input-contrast-shiftangle", "num-contrast-shiftangle", { min: 0, max: 360, suffix: "º", label: "Shift direction", key: "positionAngle" });

    document.querySelectorAll("#card-contrast [data-contrast-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.contrastShape = btn.dataset.contrastShape; }, `Contrast Shape: ${btn.dataset.contrastShape}`);
      });
    });

    document.getElementById("contrast-accent-clear")?.addEventListener("click", () => {
      commit(c => { c.highlightContrast = false; }, "Contrast Accent: none");
    });
    // Picking an accent color also turns the accentuation on.
    const contrastColor = document.getElementById("contrast-accent-color");
    contrastColor?.addEventListener("input", (e) => {
      commit(c => { c.accentColor = e.target.value; c.highlightContrast = true; }, null);
    });
    contrastColor?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Contrast Accent: ${e.target.value.toUpperCase()}`);
    });
  }

  /* =========================================================================
     CONCENTRATION INSPECTOR & CONTROLLER (Per Active Layer)
     Structure (Point, Void, Line, Hotspots), X/Y position, Gathering pull,
     Field radius, Orient to field flow, Dynamic density scale, Attractor guide.
     Clicking the canvas while the Concentration tab is open moves the attractor.
     ========================================================================= */

  getActiveConcentration() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.concentration : null;
  }

  syncConcentrationInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const conc = this.getActiveConcentration();
    if (!mod || !conc) return;

    const badge = document.getElementById("badge-concentration-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-concentration-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-concentration-active");
    if (toggle) toggle.checked = !!conc.enabled;

    document.querySelectorAll("#card-concentration [data-conc-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concMode === conc.mode);
    });
    document.querySelectorAll("#card-concentration [data-conc-axis]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concAxis === conc.lineAxis);
    });
    // The axis only matters for the line structure.
    document.getElementById("conc-axis-block")?.classList.toggle("hidden", conc.mode !== "line" && conc.mode !== "line_void");
    document.getElementById("conc-foci-block")?.classList.toggle("hidden", conc.mode !== "free");
    // The whole-design modes (Dense, Sparse) have no field radius and no absence method; they can fade at the edges
    const wholeDesign = conc.mode === "dense" || conc.mode === "sparse";
    document.getElementById("conc-method-block")?.classList.toggle("hidden", wholeDesign);
    document.getElementById("conc-radius-field")?.classList.toggle("hidden", wholeDesign);
    document.getElementById("conc-fade-block")?.classList.toggle("hidden", !wholeDesign);
    document.querySelectorAll("#card-concentration [data-conc-method]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concMethod === (conc.method || "move"));
    });
    document.querySelectorAll("#card-concentration [data-conc-flag]").forEach(chip => {
      const on = !!conc[chip.dataset.concFlag];
      chip.classList.toggle("active", on);
      chip.setAttribute("aria-pressed", String(on));
    });

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-conc-x", "num-conc-x", Math.round((conc.attractorX ?? 0.5) * 100), "%");
    setPair("input-conc-y", "num-conc-y", Math.round((conc.attractorY ?? 0.5) * 100), "%");
    setPair("input-conc-foci", "num-conc-foci", conc.focusCount ?? 2, "");
    setPair("input-conc-power", "num-conc-power", conc.power ?? 50, "%");
    setPair("input-conc-radius", "num-conc-radius", conc.radius ?? 240, "px");

    this.syncCheckbox("toggle-conc-guide", !!conc.showAttractor);

    this.updateRailIndicatorDots();
  }

  setupConcentration() {
    const toggle = document.getElementById("toggle-concentration-active");

    // Any edit enables Concentration on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const conc = this.getActiveConcentration();
      if (!conc) return;
      mutate(conc);
      conc.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncConcentrationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const conc = this.getActiveConcentration();
      if (!conc) return;
      conc.enabled = e.target.checked;
      this.syncConcentrationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Concentration: ${conc.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-concentration [data-conc-method]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.method = btn.dataset.concMethod; }, `Concentration Method: ${btn.dataset.concMethod}`);
      });
    });
    // Field style: chips that can be mixed (each one switches on and off by itself)
    document.querySelectorAll("#card-concentration [data-conc-flag]").forEach(chip => {
      chip.addEventListener("click", () => {
        const key = chip.dataset.concFlag;
        const next = chip.getAttribute("aria-pressed") !== "true";
        commit(c => { c[key] = next; }, `Concentration ${chip.textContent}: ${next ? "ON" : "OFF"}`);
      });
    });
    document.querySelectorAll("#card-concentration [data-conc-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.mode = btn.dataset.concMode; }, `Concentration Structure: ${btn.dataset.concMode}`);
      });
    });
    document.querySelectorAll("#card-concentration [data-conc-axis]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.lineAxis = btn.dataset.concAxis; }, `Concentration Axis: ${btn.dataset.concAxis}`);
      });
    });

    const bindPair = (sliderId, numId, { min, max, suffix, toStored, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(c => { c[key] = toStored(val); }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Concentration ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(c => { c[key] = toStored(val); }, `Concentration ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-conc-x", "num-conc-x", { min: 5, max: 95, suffix: "%", toStored: v => v / 100, label: "X", key: "attractorX" });
    bindPair("input-conc-y", "num-conc-y", { min: 5, max: 95, suffix: "%", toStored: v => v / 100, label: "Y", key: "attractorY" });
    bindPair("input-conc-foci", "num-conc-foci", { min: 2, max: 6, suffix: "", toStored: v => v, label: "Foci", key: "focusCount" });
    bindPair("input-conc-power", "num-conc-power", { min: 20, max: 100, suffix: "%", toStored: v => v, label: "Pull", key: "power" });
    bindPair("input-conc-radius", "num-conc-radius", { min: 80, max: 450, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });

    const bindCheck = (id, key, label) => {
      document.getElementById(id)?.addEventListener("change", (e) => {
        const checked = e.target.checked;
        commit(c => { c[key] = checked; }, `Concentration ${label}: ${checked ? "ON" : "OFF"}`);
      });
    };
    bindCheck("toggle-conc-guide", "showAttractor", "Attractor Guide");

    // Click on the canvas moves the attractor while the Concentration tab is open.
    this.canvas?.addEventListener("click", (e) => {
      if (!this.isFlyoutOpen || this.activeRailTab !== "concentration") return;
      const rect = this.canvas.getBoundingClientRect();
      const nx = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
      commit(c => { c.attractorX = nx; c.attractorY = ny; }, "Concentration Attractor");
    });
  }

  /* =========================================================================
     SPACE INSPECTOR & CONTROLLER (Per Active Layer)
     Mode (Isometric, 3D tilt, Fluctuating, Paradox), Extrusion depth,
     Projection angle, Facet shading contrast, 30º isometric grid lines.
     Autonomous modifier: no Repetition / Radiation required.
     ========================================================================= */

  getActiveSpace() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.space : null;
  }

  syncSpaceInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const space = this.getActiveSpace();
    if (!mod || !space) return;

    const badge = document.getElementById("badge-space-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const toggle = document.getElementById("toggle-space-active");
    if (toggle) toggle.checked = !!space.enabled;

    document.querySelectorAll("#card-space [data-space-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.spaceMode === space.mode);
    });

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-space-depth", "num-space-depth", space.depth ?? 10, "px");
    setPair("input-space-angle", "num-space-angle", space.angle ?? 30, "º");
    setPair("input-space-shading", "num-space-shading", space.shading ?? 50, "%");

    this.syncCheckbox("toggle-space-guides", !!space.showIsoGuides);

    this.updateRailIndicatorDots();
  }

  setupSpace() {
    const toggle = document.getElementById("toggle-space-active");

    // Any edit enables Space on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const space = this.getActiveSpace();
      if (!space) return;
      mutate(space);
      space.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncSpaceInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const space = this.getActiveSpace();
      if (!space) return;
      space.enabled = e.target.checked;
      this.syncSpaceInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Space: ${space.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-space [data-space-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(sp => { sp.mode = btn.dataset.spaceMode; }, `Space Mode: ${btn.dataset.spaceMode}`);
      });
    });

    const bindPair = (sliderId, numId, { min, max, suffix, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(sp => { sp[key] = val; }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Space ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9-]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(sp => { sp[key] = val; }, `Space ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-space-depth", "num-space-depth", { min: 10, max: 80, suffix: "px", label: "Depth", key: "depth" });
    bindPair("input-space-angle", "num-space-angle", { min: -60, max: 60, suffix: "º", label: "Angle", key: "angle" });
    bindPair("input-space-shading", "num-space-shading", { min: 20, max: 100, suffix: "%", label: "Shading", key: "shading" });

    document.getElementById("toggle-space-guides")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(sp => { sp.showIsoGuides = checked; }, `Space Iso Guides: ${checked ? "ON" : "OFF"}`);
    });
  }

  /* =========================================================================
     TEXTURE INSPECTOR & CONTROLLER (Per Active Layer)
     Geometry deformations that read as texture: Jitter, Line skipping,
     Strand crossing, Perimeter undulation. Autonomous modifier.
     Jitter and undulation are px for a 100px module (scaled to the real size).
     Skipping and crossing only read on strokes.
     ========================================================================= */

  getActiveTexture() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.texture : null;
  }

  syncTextureInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const tex = this.getActiveTexture();
    if (!mod || !tex) return;

    const badge = document.getElementById("badge-texture-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const toggle = document.getElementById("toggle-texture-active");
    if (toggle) toggle.checked = !!tex.enabled;

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-texture-jitter", "num-texture-jitter", tex.jitter ?? 1, "px");
    setPair("input-texture-skip", "num-texture-skip", tex.skipChance ?? 10, "%");
    setPair("input-texture-crossing", "num-texture-crossing", tex.crossing ?? 10, "%");
    setPair("input-texture-undulation", "num-texture-undulation", tex.undulation ?? 10, "px");

    this.updateRailIndicatorDots();
  }

  setupTexture() {
    const toggle = document.getElementById("toggle-texture-active");

    // Any edit enables Texture on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const tex = this.getActiveTexture();
      if (!tex) return;
      mutate(tex);
      tex.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncTextureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const tex = this.getActiveTexture();
      if (!tex) return;
      tex.enabled = e.target.checked;
      this.syncTextureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Texture: ${tex.enabled ? "ON" : "OFF"}`);
    });

    const bindPair = (sliderId, numId, { min, max, suffix, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(t => { t[key] = val; }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Texture ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(t => { t[key] = val; }, `Texture ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-texture-jitter", "num-texture-jitter", { min: 0, max: 8, suffix: "px", label: "Jitter", key: "jitter" });
    bindPair("input-texture-skip", "num-texture-skip", { min: 0, max: 60, suffix: "%", label: "Line Skipping", key: "skipChance" });
    bindPair("input-texture-crossing", "num-texture-crossing", { min: 0, max: 60, suffix: "%", label: "Strand Crossing", key: "crossing" });
    bindPair("input-texture-undulation", "num-texture-undulation", { min: 0, max: 30, suffix: "px", label: "Undulation", key: "undulation" });
  }

  /* =========================================================================
     CONTEXTUAL SHAPE & STYLE INSPECTOR (Applies to currently active layer)
     ========================================================================= */

  // A line has a length (Width) but no Height, so the Height control is hidden for it.
  updateHeightVisibility(mod) {
    document.getElementById("input-active-height")?.closest(".ds-field")?.classList.toggle("hidden", !!mod && mod.shape === "line");
  }

  setupShapeInspector() {
    // 1. Shape Glyph Selection Grid (15 Shapes)
    document.querySelectorAll("[data-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        const shape = btn.dataset.shape;
        const mod = this.getActiveModule();
        mod.shape = shape;
        
        document.querySelectorAll("[data-shape]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.updateHeightVisibility(mod);

        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Changed Shape: ${shape}`);
      });
    });

    // 2. Width (Ancho) & Height (Alto)
    this.bindSliderWithNumber("input-active-width", "num-active-width", (val) => {
      const mod = this.getActiveModule();
      mod.width = val;
      mod.scale = val;
      this.render();
      this.updateLayerCardsUI();
    }, "Width");

    this.bindSliderWithNumber("input-active-height", "num-active-height", (val) => {
      const mod = this.getActiveModule();
      mod.height = val;
      this.render();
      this.updateLayerCardsUI();
    }, "Height");

    // 3. Rotation (Rotación °)
    this.bindSliderWithNumber("input-active-rotation", "num-active-rotation", (val) => {
      const mod = this.getActiveModule();
      mod.rotation = val;
      this.render();
    }, "Rotation");

    // 4. Stroke Width (Grosor Trazo)
    this.bindSliderWithNumber("input-active-stroke", "num-active-stroke", (val) => {
      const mod = this.getActiveModule();
      mod.strokeWidth = val;
      this.render();
    }, "Stroke Width", "px");

    // 4.5 Position Offset (Offset X & Offset Y)
    this.bindSliderWithNumber("input-active-offset-x", "num-active-offset-x", (val) => {
      const mod = this.getActiveModule();
      mod.offsetX = val;
      this.render();
    }, "Offset X");

    this.bindSliderWithNumber("input-active-offset-y", "num-active-offset-y", (val) => {
      const mod = this.getActiveModule();
      mod.offsetY = val;
      this.render();
    }, "Offset Y");

    // Container (the frame the module is composed in, centred on the canvas)
    this.bindSliderWithNumber("input-active-container-w", "num-active-container-w", (val) => {
      const mod = this.getActiveModule();
      mod.containerW = Math.max(10, val);
      this.render();
    }, "Container Width", "px");
    this.bindSliderWithNumber("input-active-container-h", "num-active-container-h", (val) => {
      const mod = this.getActiveModule();
      mod.containerH = Math.max(10, val);
      this.render();
    }, "Container Height", "px");

    document.getElementById("chk-active-clip-container")?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      mod.clipContainer = e.target.checked;
      this.render();
      this.pushHistory(`Layer ${this.activeLayerId} Clip Container: ${e.target.checked ? "ON" : "OFF"}`);
    });

    // The browser may restore a ticked box after a reload while the app starts with the aid off: start them in step
    const hideBox = document.getElementById("chk-hide-modifiers");
    if (hideBox) hideBox.checked = !!this.hideModifiers;
    hideBox?.addEventListener("change", (e) => {
      this.hideModifiers = e.target.checked;
      this.render();
    });

    document.getElementById("chk-active-show-container")?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      mod.showContainer = e.target.checked;
      this.render();
      this.pushHistory(`Layer ${this.activeLayerId} Show Container: ${e.target.checked ? "ON" : "OFF"}`);
    });

    // 5. Drawing Mode: Stroke vs Fill (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    
    btnStroke?.addEventListener("click", () => {
      const mod = this.getActiveModule();
      mod.wireframe = true;
      btnStroke.classList.add("active");
      btnFill?.classList.remove("active");
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Mode: Stroke`);
    });

    btnFill?.addEventListener("click", () => {
      const mod = this.getActiveModule();
      mod.wireframe = false;
      btnFill.classList.add("active");
      btnStroke?.classList.remove("active");
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Mode: Fill`);
    });

    // 6. Color Picker & Hex Code
    const colorPicker = document.getElementById("color-active-shape");
    const colorText = document.getElementById("text-color-hex");
    if (colorPicker) {
      colorPicker.addEventListener("input", (e) => {
        const hex = e.target.value.toUpperCase();
        if (colorText) colorText.textContent = hex;
        const mod = this.getActiveModule();
        if (mod) mod.color = hex;
        this.customColors.fg = hex;
        const swatch = document.getElementById("swatch-active-color");
        if (swatch) swatch.style.backgroundColor = hex;
        this.render();
      });
      colorPicker.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Color: ${e.target.value.toUpperCase()}`);
      });
    }
  }

  syncShapeInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    if (!mod) return;

    // Sync Shape Buttons
    document.querySelectorAll("[data-shape]").forEach(b => {
      b.classList.toggle("active", b.dataset.shape === mod.shape);
    });
    this.updateHeightVisibility(mod);

    // Sync Dimensions
    this.syncControlValue("input-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("num-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("input-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("num-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("input-active-rotation", mod.rotation || 0);
    this.syncControlValue("num-active-rotation", mod.rotation || 0);
    this.syncControlValue("input-active-stroke", mod.strokeWidth || 1);
    this.syncControlValue("num-active-stroke", `${mod.strokeWidth || 1}px`);
    this.syncControlValue("input-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("num-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("input-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);
    this.syncControlValue("num-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);
    const canvasCfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const contW = Math.round(mod.containerW > 0 ? mod.containerW : canvasCfg.w);
    const contH = Math.round(mod.containerH > 0 ? mod.containerH : canvasCfg.h);
    this.syncControlValue("input-active-container-w", contW);
    this.syncControlValue("num-active-container-w", `${contW}px`);
    this.syncControlValue("input-active-container-h", contH);
    this.syncControlValue("num-active-container-h", `${contH}px`);
    this.syncCheckbox("chk-active-show-container", mod.showContainer !== false);
    this.syncCheckbox("chk-active-clip-container", !!mod.clipContainer);

    // Sync Mode (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    const isWireframe = mod.wireframe !== false;
    if (isWireframe) {
      btnStroke?.classList.add("active");
      btnFill?.classList.remove("active");
    } else {
      btnFill?.classList.add("active");
      btnStroke?.classList.remove("active");
    }

    // Sync Swatch & Color Picker
    const swatch = document.getElementById("swatch-active-color");
    const hexText = document.getElementById("text-color-hex");
    const layerColor = mod.color || this.customColors.fg || "#18181F";
    const cp = document.getElementById("color-active-shape");
    if (cp && layerColor.startsWith("#") && layerColor.length === 7) {
      cp.value = layerColor;
    }
    if (swatch) swatch.style.backgroundColor = layerColor;
    if (hexText) hexText.textContent = layerColor.toUpperCase();
  }

  /* =========================================================================
     VIEWPORT: PAN, ZOOM & ARTBOARD CENTERING
     ========================================================================= */

  setupViewportEvents() {
    // The artboard is not zoomed or panned: it is sized to the free height of the workspace.
    // Refit whenever the window or the stage changes size.
    window.addEventListener("resize", () => this.fitArtboard());
    if (typeof ResizeObserver !== "undefined" && this.canvasContainer) {
      new ResizeObserver(() => this.fitArtboard()).observe(this.canvasContainer);
    }
  }

  // Sizes the canvas so its height fills the free height (the height rules), and its width follows
  // the aspect ratio. The width is capped so the artboard never slides under the controls panel.
  fitArtboard() {
    const stage = this.canvasContainer;
    const column = document.getElementById("canvas-column");
    const flyout = document.getElementById("inspector-flyout");
    const workspace = document.querySelector(".ds-workspace");
    if (!stage || !column || !workspace || !stage.clientHeight) return;

    const BORDER = 20; // white frame around the canvas, each side (Figma "Moiré artwork")
    const GAP = 24;
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const ratio = cfg.w / cfg.h;

    const flyoutWidth = flyout ? flyout.offsetWidth : 300;
    const flyoutLeft = workspace.getBoundingClientRect().right - parseFloat(getComputedStyle(workspace).getPropertyValue("--flyout-right") || 66) - flyoutWidth;
    const maxOuterW = Math.max(160, flyoutLeft - GAP - column.getBoundingClientRect().left);

    const innerH = Math.max(120, Math.min(stage.clientHeight - BORDER * 2, (maxOuterW - BORDER * 2) / ratio));
    const h = Math.floor(innerH);
    const w = Math.floor(innerH * ratio);

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    column.style.setProperty("--artboard-w", `${w + BORDER * 2}px`);
    this.artboardSize = { w, h };

    this.updateArtLog();
  }

  centerArtboard() {
    this.fitArtboard();
  }

  /* =========================================================================
     KEYBOARD SHORTCUTS
     ========================================================================= */

  setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      }
    });
  }

  bindSliderWithNumber(sliderId, numberId, callback, label = "Parameter", suffix = "") {
    const slider = document.getElementById(sliderId);
    const numInput = document.getElementById(numberId);

    if (slider) {
      slider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        if (numInput) numInput.value = `${val}${suffix}`;
        callback(val);
      });
      slider.addEventListener("change", (e) => {
        this.pushHistory(`Changed ${label}: ${e.target.value}`);
      });
    }

    if (numInput) {
      numInput.addEventListener("change", (e) => {
        const val = parseFloat(e.target.value);
        if (slider) slider.value = val;
        e.target.value = `${val}${suffix}`;
        callback(val);
        this.pushHistory(`Edited ${label}: ${val}`);
      });
    }
  }

  syncControlValue(inputId, value) {
    const el = document.getElementById(inputId);
    if (el) { el.value = value; this.paintRange(el); }
  }

  // The ink part of a slider's 4 px track: how far the value is between its min and max
  paintRange(el) {
    if (!el || el.type !== "range") return;
    const min = Number(el.min || 0), max = Number(el.max || 100);
    const share = max > min ? ((Number(el.value) - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", `${Math.max(0, Math.min(100, share))}%`);
  }

  paintAllRanges() {
    document.querySelectorAll('.ds-slider input[type="range"]').forEach(el => this.paintRange(el));
  }

  syncCheckbox(id, checked) {
    const cb = document.getElementById(id);
    if (cb) cb.checked = checked;
  }

  /* =========================================================================
     HISTORY MANAGEMENT
     ========================================================================= */

  pushHistory(label = "Action") {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.historyLabels = this.historyLabels.slice(0, this.historyIndex + 1);
    }
    this.history.push(JSON.stringify(this.state));
    this.historyLabels.push(label);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyLabels.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = JSON.parse(this.history[this.historyIndex]);
        const layers = this.getLayers();
      if (!layers.some(l => l.id === this.activeLayerId)) {
        this.activeLayerId = layers[0]?.id || "layer-1";
      }
      this.render();
      this.syncGuideColor();
      this.syncAllInspectorsWithActiveLayer();
      this.updateLayerCardsUI();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = JSON.parse(this.history[this.historyIndex]);
        const layers = this.getLayers();
      if (!layers.some(l => l.id === this.activeLayerId)) {
        this.activeLayerId = layers[0]?.id || "layer-1";
      }
      this.render();
      this.syncGuideColor();
      this.syncAllInspectorsWithActiveLayer();
      this.updateLayerCardsUI();
    }
  }
}

// Auto-boot upon DOM readiness
document.addEventListener("DOMContentLoaded", () => {
  window.studioProApp = new StudioProApp();
});


  if (typeof window !== 'undefined') {
    window.StudioEngine = StudioEngine;
    window.StudioProApp = StudioProApp;
    window.CanvasUtils = CanvasUtils;
    window.Shapes = Shapes;
    window.StudioExporter = StudioExporter;
  }
})();
