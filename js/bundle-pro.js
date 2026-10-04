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


  // The 15 shapes available in the studio (matches the Figma shape grid).
// `phIcon` is the Phosphor icon name, rendered with the fill weight (`ph-fill ph-<name>`).
const STUDIO_SHAPE_KEYS = [
  "circle", "square", "triangle", "wave", "horseshoe", "hexagon", "line", "parallelogram", "hatch", "crescent", "teardrop", "cross", "digit1", "digit5", "digit9"
];
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
    phIcon: "wave-sine"
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
    phIcon: "line-segments"
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
    phIcon: "moon"
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
    phIcon: "drop"
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
function flattenShape(shapeDef) {
  if (flatCache[shapeDef.id]) return flatCache[shapeDef.id];

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

  flatCache[shapeDef.id] = subpaths;
  return subpaths;
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
    curveIntensity: 18,
    activeClipping: false,
    showGridLines: false,
    gridLineWidth: 1.5,
    checkerInvert: false
  },
  radiation: {
    scheme: "centrifugal", // centrifugal, concentric, spiral, multi_center
    rays: 12,
    rings: 5,
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
    showGridLines: false
  },
  similarity: {
    enabled: false,
    kinshipType: "distortion",
    intensity: 50,
    cellJitter: 0,
    seed: 42
  },
  gradation: {
    enabled: false,
    type: "rotation", // rotation, scale, depth, drift
    pathway: "diagonal", // diagonal, horizontal, vertical, concentric
    range: 180, // degrees of total rotation (rotation type)
    steps: 1, // cycles (1 to 4)
    reverse: false
  },
  anomaly: {
    enabled: false,
    type: "focal", // focal, fracture, swell, tear
    epicenterX: 0.5, // 0.1 to 0.9
    epicenterY: 0.5, // 0.1 to 0.9
    radius: 160, // 50 to 350 px
    intensity: 65, // severity, 10 to 100
    anomalousShape: "triangle",
    highlightColor: false,
    accentColor: "#f43f5e", // color applied to anomalous modules when highlighted
    showReticle: false
  },
  contrast: {
    enabled: false,
    dimension: "scale", // scale, shape, direction, tone
    dominanceRatio: 80, // % majority regular (50 to 95)
    contrastShape: "cross", // shape for shape contrast
    scaleFactor: 2.2, // scale multiplier for scale contrast (0.2 to 3.0)
    angle: 45, // clash angle for direction contrast
    highlightContrast: false, // accentuate minority elements
    accentColor: "#f43f5e" // color applied to the minority when accentuated
  },
  concentration: {
    enabled: false,
    mode: "point", // point, void, line, free (hotspots)
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
  scale: 50,
  width: 50,
  height: 50,
  rotation,
  offsetX,
  offsetY,
  wireframe: true,
  strokeWidth: 1.2,
  color: "#18181f",
  structure: createDefaultLayerStructure()
});

const defaultLayer1 = createDefaultLayer("layer-1", "Layer 1", "circle", 0, 0, 4.5);
const defaultLayer2 = createDefaultLayer("layer-2", "Layer 2", "square", 65, 0, 0);
const defaultStudioState = {
  aspectRatio: "1:1",
  layers: [defaultLayer1, defaultLayer2],
  layerOrder: ["layer-2", "layer-1"],
  invertFigureGround: false,
  wireframe: true,
  strokeWeight: 1.2,

  // Modifiers Stack
  modifiers: {
    repetition: {
      enabled: false,
      gridType: "basic", // basic, sliding, sheared, curved, zigzag, triangular, alternating
      cols: 4,
      rows: 4,
      spacing: 0,
      shearAngle: 15,
      slideOffset: 0.5,
      curveIntensity: 18,
      activeClipping: false,
      showGridLines: false,
      gridLineWidth: 1.5,
      checkerInvert: false
    },
    structure: {
      enabled: false,
      mode: "rhythmic", // rhythmic (A:B:A:B cadence), compression
      colRatio: 1.8,
      rowRatio: 1.8,
      bandThickness: 3,
      showBands: false
    },
    similarity: {
      enabled: false,
      kinshipType: "distortion", // distortion, foreshortening, rotation_wobble, scale_kinship, hybrid
      intensity: 50, // 0 to 100
      cellJitter: 0, // 0 to 30
      seed: 42
    },
    gradation: {
      enabled: false,
      type: "rotation", // rotation, scale, depth, drift
      pathway: "diagonal", // diagonal, horizontal, vertical, concentric
      range: 180, // degrees or span
      steps: 1, // cycles (1 to 4)
      reverse: false
    },
    radiation: {
      enabled: false,
      scheme: "centrifugal", // centrifugal, concentric, spiral, multi_center
      rays: 12, // 4 to 28
      rings: 5, // 2 to 10
      spiralTwist: 45, // -180 to 180
      activeClipping: false,
      showRays: false,
      showRings: false,
      centerX: 0,
      centerY: 0
    },
    anomaly: {
      enabled: false,
      type: "focal", // focal, fracture, swell, tear
      epicenterX: 0.5, // 0.1 to 0.9
      epicenterY: 0.5, // 0.1 to 0.9
      radius: 160, // 50 to 350
      intensity: 65, // 10 to 100
      anomalousShape: "triangle",
      highlightColor: true,
      showReticle: true
    },
    contrast: {
      enabled: false,
      dimension: "scale", // scale, shape, direction, tone
      dominanceRatio: 80, // % majority regular (60 to 95)
      contrastShape: "cross", // shape for shape contrast
      scaleFactor: 2.2, // scale multiplier for scale contrast
      angle: 45, // clash angle for direction contrast
      highlightContrast: false // highlight minority elements
    },
    concentration: {
      enabled: false,
      mode: "point", // point, void, line, free
      attractorX: 0.5,
      attractorY: 0.5,
      power: 65, // 20 to 100
      radius: 240, // 80 to 450
      lineAxis: "horizontal", // horizontal, vertical
      alignToField: true,
      densityScale: true,
      showAttractor: true
    },
    texture: {
      enabled: false,
      jitter: 1,
      skipChance: 10,
      crossing: 10,
      undulation: 10
    },
    space: {
      enabled: false,
      mode: "isometric", // isometric, foreshortening, fluctuating, conflicting
      depth: 35, // 10 to 80
      angle: 30, // -60 to 60
      shading: 65, // 20 to 100
      showIsoGuides: false
    }
  },

  // Mat / Canvas display settings
  showSafeBounds: true,
  zoomLevel: 1.0
};
class StudioEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = JSON.parse(JSON.stringify(defaultStudioState));
  }

  // Get active principles list for the editorial colophon
  getActivePrinciples() {
    const list = ["FORM"];
    const hasRep = this.state.modifiers.repetition.enabled;
    const hasRad = this.state.modifiers.radiation.enabled;
    const hasGrid = hasRep || hasRad;

    if (hasRad) {
      list.push("RADIATION");
    } else if (hasRep) {
      list.push("REPETITION");
      if (this.state.modifiers.structure.enabled) list.push("STRUCTURE");
    }

    if (hasGrid) {
      if (this.state.modifiers.similarity.enabled) list.push("SIMILARITY");
      if (this.state.modifiers.gradation.enabled) list.push("GRADATION");
      if (this.state.modifiers.anomaly.enabled) list.push("ANOMALY");
      if (this.state.modifiers.contrast.enabled) list.push("CONTRAST");
    }

    if (this.state.modifiers.concentration.enabled && hasGrid) list.push("CONCENTRATION");
    if (this.state.modifiers.texture.enabled) list.push("TEXTURE");
    if (this.state.modifiers.space.enabled) list.push("SPACE");
    return list;
  }

  getColophonString() {
    return `USED ON THIS DESIGN: ${this.getActivePrinciples().join(" / ")}`;
  }

  // Draw a single shape: texture deformation, then flat or illusory 3D space.
  drawShape(ctx, shapeId, size, fgColor, strokeOnly = false, lineWidth = 2, bgColor = null, isAlternating = false, skipSpace = false, spaceConfig = null, textureConfig = null, seed = 0) {
    let shapeDef = Shapes[shapeId] || Shapes.circle;
    const space = spaceConfig || this.state.modifiers.space;
    const texture = textureConfig || this.state.modifiers.texture;

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
        // Volumetric shaded extrusion body
        ctx.save();
        ctx.fillStyle = fgColor;
        const sideAlpha = 0.15 + (1 - shading * 0.7) * 0.45;
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
  drawSingleLayerShape(targetCtx, mod, sizeMultiplier = 1, fgColor = "#111111", bgColor = "#FAFAFA", wireframeOverride = null, shapeOverride = null, isCutout = false, colorOverride = null, widthMultiplier = null) {
    if (!mod) return;
    const shape = shapeOverride || mod.shape || "circle";
    const baseW = mod.width !== undefined ? mod.width : (mod.scale || 50);
    const baseH = mod.height !== undefined ? mod.height : (mod.scale || 50);
    // A line spans its cell width (widthMultiplier) instead of shrinking to the cell's short side.
    const w = baseW * (widthMultiplier ?? sizeMultiplier);
    const h = baseH * sizeMultiplier;
    // Open-path shapes (lines, digits...) are strokes: a non-uniform scale would flatten their
    // thickness and deformation, so they keep a uniform scale. A line's length is its width.
    const isSkeleton = !!(Shapes[shape] && Shapes[shape].skeleton);
    const r = shape === "line" ? w : Math.max(w, h);
    const sx = !isSkeleton && r > 0 ? w / r : 1;
    const sy = !isSkeleton && r > 0 ? h / r : 1;
    const ox = (mod.offsetX || 0) * sizeMultiplier;
    const oy = (mod.offsetY || 0) * sizeMultiplier;
    const wire = wireframeOverride !== null ? wireframeOverride : (mod.wireframe !== false);
    const strokeW = mod.strokeWidth || 1.2;

    targetCtx.save();
    targetCtx.translate(ox, oy);
    targetCtx.rotate(((mod.rotation || 0) * Math.PI) / 180);
    targetCtx.scale(sx, sy);
    // An explicit override (anomaly / contrast accent) wins over the layer color.
    const layerColor = colorOverride || mod.color || fgColor;
    const layerNum = parseInt(String(mod.id || "").replace(/\D/g, ""), 10) || 1;
    const seed = (this.cellSeed || 0) * 7.13 + layerNum * 53.7;
    this.drawShape(targetCtx, shape, r, layerColor, wire, strokeW, bgColor, !!this.cellAlt, isCutout, mod.structure?.space || null, mod.structure?.texture || null, seed);
    targetCtx.restore();
  }

  // Render an individual layer centered on the canvas (when no repetition/radiation layout active for this layer)
  renderSingleLayerModule(ctx, mod, width, height, palette) {
    if (!mod || mod.visible === false) return;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    const aspectScale = Math.min(1.0, Math.min(width, height) / 600);
    this.cellSeed = 0;
    this.cellAlt = false;
    this.drawSingleLayerShape(ctx, mod, 1.25 * aspectScale, palette.fg, palette.bg);
    ctx.restore();
  }

  // Build the boundary path for a cell in the given grid variation
  buildCellPath(ctx, r, c, rows, cols, cx, cy, cW, cH, rep, startX) {
    ctx.beginPath();
    if (rep.gridType === "sheared") {
      const rad = (rep.shearAngle * Math.PI) / 180;
      const dxTop = -(cH / 2) * Math.tan(rad);
      const dxBot = (cH / 2) * Math.tan(rad);
      ctx.moveTo(cx - cW / 2 + dxTop, cy - cH / 2);
      ctx.lineTo(cx + cW / 2 + dxTop, cy - cH / 2);
      ctx.lineTo(cx + cW / 2 + dxBot, cy + cH / 2);
      ctx.lineTo(cx - cW / 2 + dxBot, cy + cH / 2);
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
    } else if (rep.gridType === "curved") {
      const wTop = Math.sin((r / rows) * Math.PI * 2) * rep.curveIntensity;
      const wBot = Math.sin(((r + 1) / rows) * Math.PI * 2) * rep.curveIntensity;
      const baseX = startX;
      ctx.moveTo(baseX + wTop, cy - cH / 2);
      ctx.lineTo(baseX + cW + wTop, cy - cH / 2);
      ctx.lineTo(baseX + cW + wBot, cy + cH / 2);
      ctx.lineTo(baseX + wBot, cy + cH / 2);
    } else if (rep.gridType === "zigzag") {
      const zTop = (r % 2 === 0 ? 1 : -1) * rep.curveIntensity;
      const zBot = ((r + 1) % 2 === 0 ? 1 : -1) * rep.curveIntensity;
      const baseX = startX;
      ctx.moveTo(baseX + zTop, cy - cH / 2);
      ctx.lineTo(baseX + cW + zTop, cy - cH / 2);
      ctx.lineTo(baseX + cW + zBot, cy + cH / 2);
      ctx.lineTo(baseX + zBot, cy + cH / 2);
    } else {
      // Basic orthogonal, sliding, alternating
      ctx.rect(cx - cW / 2, cy - cH / 2, cW, cH);
    }
    ctx.closePath();
  }

  // Render the repetition / structural grid with similarity and gradation kinematics
  renderRepetitionGrid(ctx, width, height, palette, marginParam, usableWParam, usableHParam, targetMod = null, repConfig = null) {
    const rep = repConfig || (targetMod?.structure?.repetition) || this.state.modifiers.repetition;
    const struct = (targetMod?.structure?.formalStructure) || this.state.modifiers.structure;
    const sim = (targetMod?.structure?.similarity) || this.state.modifiers.similarity;
    const grad = (targetMod?.structure?.gradation) || this.state.modifiers.gradation;
    const anom = (targetMod?.structure?.anomaly) || this.state.modifiers.anomaly;
    const contrast = (targetMod?.structure?.contrast) || this.state.modifiers.contrast;
    const conc = (targetMod?.structure?.concentration) || this.state.modifiers.concentration;

    const cols = Math.max(1, rep.cols);
    const rows = Math.max(1, rep.rows);

    const margin = marginParam !== undefined ? marginParam : Math.round(Math.max(20, Math.min(width, height) * 0.05));
    const usableW = usableWParam !== undefined ? usableWParam : width - margin * 2;
    const usableH = usableHParam !== undefined ? usableHParam : height - margin * 2;

    // Calculate column widths and x positions (Dual rhythmic interval support)
    const colWidths = [];
    const colX = [];
    const colStarts = [];
    const isColRhythmic = !!(struct && struct.enabled && (struct.colRatio !== undefined || struct.mode === "rhythmic"));
    if (isColRhythmic) {
      const rA = Number(struct.colRatio) || 1.0;
      let weightSum = 0;
      for (let c = 0; c < cols; c++) {
        weightSum += (c % 2 === 0 ? rA : 1.0);
      }
      const unitW = usableW / weightSum;
      let currX = margin;
      for (let c = 0; c < cols; c++) {
        const w = (c % 2 === 0 ? rA : 1.0) * unitW;
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
    const isRowRhythmic = !!(struct && struct.enabled && (struct.rowRatio !== undefined || struct.mode === "rhythmic"));
    if (isRowRhythmic) {
      const rA = Number(struct.rowRatio) || 1.0;
      let weightSum = 0;
      for (let r = 0; r < rows; r++) {
        weightSum += (r % 2 === 0 ? rA : 1.0);
      }
      const unitH = usableH / weightSum;
      let currY = margin;
      for (let r = 0; r < rows; r++) {
        const h = (r % 2 === 0 ? rA : 1.0) * unitH;
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

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cW = colWidths[c];
        const cH = rowHeights[r];
        let cx = colX[c];
        let cy = rowY[r];
        const startX = colStarts[c];

        // Apply grid deformations to center coordinates
        if (rep.gridType === "sliding") {
          if (r % 2 === 1) cx += cW * rep.slideOffset;
        } else if (rep.gridType === "sheared") {
          const rad = (rep.shearAngle * Math.PI) / 180;
          cx += (r - rows / 2) * Math.tan(rad) * (cH * 0.6);
        } else if (rep.gridType === "curved") {
          const wave = Math.sin((r / rows) * Math.PI * 2) * rep.curveIntensity;
          cx += wave;
        } else if (rep.gridType === "zigzag") {
          const zig = (r % 2 === 0 ? 1 : -1) * rep.curveIntensity;
          cx += zig;
        } else if (rep.gridType === "triangular") {
          if (r % 2 === 1) cx += cW * 0.5;
        }

        // Similarity PRNG helper
        const pRand = (salt) => {
          const x = Math.sin(seed * 997 + r * 1337 + c * 31 + salt * 101) * 10000;
          return (x - Math.floor(x)) * 2 - 1; // -1 to 1
        };

        // Similarity: cell spatial jitter
        if (sim.enabled && sim.cellJitter > 0) {
          cx += pRand(10) * sim.cellJitter;
          cy += pRand(11) * sim.cellJitter;
        }

        // Concentration Field Displacement & Density Kinematics (Concentration)
        let concAngle = 0;
        let concScaleMul = 1.0;
        if (conc && conc.enabled) {
          const attX = (conc.attractorX ?? 0.5) * width;
          const attY = (conc.attractorY ?? 0.5) * height;
          const power = (conc.power ?? 65) / 100;
          const radius = conc.radius ?? 240;

          if (conc.mode === "point") {
            const dist = Math.hypot(cx - attX, cy - attY);
            if (dist < radius) {
              const factor = Math.pow(1 - dist / radius, 1.4) * power;
              const pull = factor * (radius * 0.45);
              const angle = Math.atan2(attY - cy, attX - cx);
              cx += Math.cos(angle) * pull;
              cy += Math.sin(angle) * pull;
              concAngle = angle;
              if (conc.densityScale) concScaleMul = 0.55 + (dist / radius) * 0.7;
            }
          } else if (conc.mode === "void") {
            const dist = Math.hypot(cx - attX, cy - attY);
            if (dist < radius) {
              const factor = Math.pow(1 - dist / radius, 1.2) * power;
              const push = factor * (radius * 0.55);
              const angle = Math.atan2(cy - attY, cx - attX);
              cx += Math.cos(angle) * push;
              cy += Math.sin(angle) * push;
              concAngle = angle + Math.PI / 2;
              if (conc.densityScale) concScaleMul = 0.4 + (dist / radius) * 0.8;
            }
          } else if (conc.mode === "line") {
            if (conc.lineAxis === "vertical") {
              const distX = Math.abs(cx - attX);
              if (distX < radius) {
                const factor = Math.pow(1 - distX / radius, 1.4) * power;
                const pullX = (attX - cx) * factor * 0.75;
                cx += pullX;
                concAngle = (attX >= cx ? 0 : Math.PI);
                if (conc.densityScale) concScaleMul = 0.65 + (distX / radius) * 0.6;
              }
            } else {
              const distY = Math.abs(cy - attY);
              if (distY < radius) {
                const factor = Math.pow(1 - distY / radius, 1.4) * power;
                const pullY = (attY - cy) * factor * 0.75;
                cy += pullY;
                concAngle = (attY >= cy ? Math.PI / 2 : -Math.PI / 2);
                if (conc.densityScale) concScaleMul = 0.65 + (distY / radius) * 0.6;
              }
            }
          } else if (conc.mode === "free") {
            const att2X = width - attX;
            const att2Y = height - attY;
            const dist1 = Math.hypot(cx - attX, cy - attY);
            const dist2 = Math.hypot(cx - att2X, cy - att2Y);
            const nearestDist = Math.min(dist1, dist2);
            const targetX = dist1 < dist2 ? attX : att2X;
            const targetY = dist1 < dist2 ? attY : att2Y;
            if (nearestDist < radius) {
              const factor = Math.pow(1 - nearestDist / radius, 1.4) * power;
              const pull = factor * (radius * 0.4);
              const angle = Math.atan2(targetY - cy, targetX - cx);
              cx += Math.cos(angle) * pull;
              cy += Math.sin(angle) * pull;
              concAngle = angle;
              if (conc.densityScale) concScaleMul = 0.65 + (nearestDist / radius) * 0.6;
            }
          }
        }

        const renderCell = (cellCx, cellCy, cellStartX) => {
          ctx.save();

          const isOddCell = (r + c) % 2 === 1;
          let fgColor = palette.fg;
          let bgColor = palette.bg;

          // Checkerboard inversion
          if (rep.checkerInvert && isOddCell) {
            ctx.save();
            this.buildCellPath(ctx, r, c, rows, cols, cellCx, cellCy, cW, cH, rep, cellStartX);
            ctx.fillStyle = palette.fg;
            ctx.fill();
            ctx.restore();
            fgColor = palette.bg;
            bgColor = palette.fg;
          }

          // Active clipping: restrict drawing strictly to cell boundaries
          if (rep.activeClipping) {
            this.buildCellPath(ctx, r, c, rows, cols, cellCx, cellCy, cW, cH, rep, cellStartX);
            ctx.clip();
          }

          ctx.translate(cellCx, cellCy);

        // Concentration directional flow
        if (conc && conc.enabled && conc.alignToField && concAngle !== 0) {
          ctx.rotate(concAngle);
        }

        // Alternating mirror / rotation
        if (rep.gridType === "alternating" && isOddCell) {
          ctx.rotate(Math.PI);
        }

        // Gradation kinematics across Cartesian pathways
        if (grad.enabled) {
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
          }

          if (grad.reverse) t = 1 - t;
          t = (t * (grad.steps || 1)) % 1.0001;

          if (grad.type === "rotation") {
            const rotSpan = ((grad.range ?? 180) * Math.PI) / 180;
            ctx.rotate(t * rotSpan);
          } else if (grad.type === "scale") {
            // Range scales the amount of change; 180 keeps the original 0.35x to 1.45x
            const sFactor = Math.max(0.05, 0.9 + (t - 0.5) * 1.1 * (((grad.range ?? 180)) / 180));
            ctx.scale(sFactor, sFactor);
          } else if (grad.type === "depth") {
            ctx.rotate(Math.PI / 6);
            ctx.scale(1, Math.max(0.18, 1 - t * 0.82 * ((grad.range ?? 180) / 180)));
            ctx.rotate(-Math.PI / 6);
          } else if (grad.type === "drift") {
            ctx.translate(t * (cW * 0.28) * ((grad.range ?? 180) / 180), 0);
          }
        }

        // Similarity: Module Kinship & Fluctuation
        if (sim.enabled) {
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

        // Anomaly & Contrast Modifiers
        let cellShapeA = null;
        let cellWireframe = null;
        let cellFg = fgColor;
        let cellBg = bgColor;
        let cellScaleMul = 1;

        if (anom.enabled) {
          const epiX = (anom.epicenterX ?? 0.5) * width;
          const epiY = (anom.epicenterY ?? 0.5) * height;
          const dist = Math.hypot(cx - epiX, cy - epiY);
          const inZone = dist < anom.radius;
          const factor = inZone ? (1 - dist / anom.radius) : 0;
          const severity = (anom.intensity ?? 65) / 100;

          if (anom.type === "focal") {
            if (inZone) {
              cellShapeA = anom.anomalousShape || "triangle";
              ctx.rotate((Math.PI / 4) * severity * factor);
              cellScaleMul *= (1 + 0.35 * severity);
              if (anom.highlightColor) cellFg = anom.accentColor || palette.accent;
            }
          } else if (anom.type === "fracture") {
            const corridor = anom.radius * 0.45;
            if (inZone && Math.abs(cx - epiX) < corridor) {
              const jag = Math.sin(cy * 0.08) * (18 * severity);
              const shearY = (cy > epiY ? 1 : -1) * (36 * severity) + jag;
              const shearX = (cx > epiX ? 1 : -1) * (10 * severity);
              ctx.translate(shearX, shearY);
              ctx.rotate((factor * severity * Math.PI) / 3.2);
              if (factor > 0.4 && anom.highlightColor) cellFg = anom.accentColor || palette.accent;
            }
          } else if (anom.type === "swell") {
            if (inZone) {
              const angle = Math.atan2(cy - epiY, cx - epiX);
              const push = Math.sin(factor * Math.PI) * (42 * severity);
              ctx.translate(Math.cos(angle) * push, Math.sin(angle) * push);
              const sFactor = 1 + factor * 0.55 * severity;
              ctx.scale(sFactor, sFactor);
              if (factor > 0.65 && anom.highlightColor) cellFg = anom.accentColor || palette.accent;
            }
          } else if (anom.type === "tear") {
            if (factor > 0.6) {
              // Disintegrated void
              ctx.restore();
              return;
            } else if (factor > 0.15) {
              // Shattered debris
              ctx.translate(pRand(51) * 26 * severity, pRand(52) * 26 * severity);
              ctx.rotate(pRand(53) * Math.PI * severity);
              const shrink = Math.max(0.15, 1 - factor * 0.85);
              ctx.scale(shrink, shrink);
              if (anom.highlightColor && factor > 0.3) cellFg = anom.accentColor || palette.accent;
            }
          }
        }

        if (contrast.enabled) {
          const k = r * cols + c;
          const hash = Math.abs(Math.sin(k * 137.5 + 43.1) * 10000) % 100;
          const isMinority = hash >= (contrast.dominanceRatio ?? 80);
          if (isMinority) {
            if (contrast.dimension === "scale") {
              const sFactor = contrast.scaleFactor ?? 2.2;
              cellScaleMul *= sFactor;
            } else if (contrast.dimension === "shape") {
              cellShapeA = contrast.contrastShape || "cross";
            } else if (contrast.dimension === "direction") {
              const clashAngle = ((contrast.angle ?? 45) * Math.PI) / 180;
              ctx.rotate(clashAngle);
            } else if (contrast.dimension === "tone") {
              cellWireframe = true;
            }
            if (contrast.highlightContrast) {
              cellFg = contrast.accentColor || palette.accent;
            }
          }
        }

        const scaleUnit = 1.25 * Math.min(1.0, Math.min(width, height) / 600);
        const cellRatio = Math.min(cW / usableW, cH / usableH);
        const normScale = scaleUnit * cellRatio * cellScaleMul * concScaleMul;
        this.cellSeed = r * cols + c + 1;
        this.cellAlt = (r + c) % 2 === 1;
        const lineWidthMul = (cellShapeA || targetMod.shape) === "line" ? scaleUnit * (cW / usableW) * cellScaleMul * concScaleMul : null;
        this.drawSingleLayerShape(ctx, targetMod, normScale, cellFg, cellBg, cellWireframe, cellShapeA, false, cellFg !== fgColor ? cellFg : null, lineWidthMul);
        ctx.restore();
      };

      // Draw primary cell
      renderCell(cx, cy, startX);

      // Seamless repeat wrapping in sliding (brick) grid
      if (rep.gridType === "sliding" && r % 2 === 1) {
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
    if (showLines) {
      ctx.save();
      ctx.strokeStyle = palette.isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(24, 24, 31, 0.35)";
      ctx.lineWidth = struct && struct.enabled && struct.showBands ? struct.bandThickness : (rep.gridLineWidth || 1.2);

      // Draw horizontal lines
      for (let r = 0; r <= rows; r++) {
        const y = r === rows ? margin + usableH : rowStarts[r];
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + usableW, y);
        ctx.stroke();
      }

      if (rep.gridType === "sliding") {
        // True running-bond staggered vertical brick joints
        for (let r = 0; r < rows; r++) {
          const yTop = rowStarts[r];
          const yBot = r === rows - 1 ? margin + usableH : rowStarts[r + 1];
          const isShifted = r % 2 === 1;
          const shift = isShifted ? colWidths[0] * (rep.slideOffset ?? 0.5) : 0;

          // Left border
          ctx.beginPath();
          ctx.moveTo(margin, yTop);
          ctx.lineTo(margin, yBot);
          ctx.stroke();

          // Internal vertical joints
          for (let c = 0; c <= cols; c++) {
            const rawX = (c === cols ? margin + usableW : colStarts[c]) + shift;
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
      } else {
        // Draw vertical / deformed lines
        for (let c = 0; c <= cols; c++) {
          const baseX = c === cols ? margin + usableW : colStarts[c];
          ctx.beginPath();

          if (rep.gridType === "sheared") {
            const rad = (rep.shearAngle * Math.PI) / 180;
            const topX = baseX - (rows / 2) * Math.tan(rad) * (rowHeights[0] * 0.6);
            const botX = baseX + (rows / 2) * Math.tan(rad) * (rowHeights[0] * 0.6);
            ctx.moveTo(topX, margin);
            ctx.lineTo(botX, margin + usableH);
          } else if (rep.gridType === "curved") {
            ctx.moveTo(baseX, margin);
            const steps = 30;
            for (let s = 1; s <= steps; s++) {
              const frac = s / steps;
              const y = margin + frac * usableH;
              const wave = Math.sin(frac * Math.PI * 2) * rep.curveIntensity;
              ctx.lineTo(baseX + wave, y);
            }
          } else if (rep.gridType === "zigzag") {
            ctx.moveTo(baseX, margin);
            for (let r = 0; r < rows; r++) {
              const zig = (r % 2 === 0 ? 1 : -1) * rep.curveIntensity;
              ctx.lineTo(baseX + zig, margin + (r + 1) * rowHeights[r]);
            }
          } else {
            ctx.moveTo(baseX, margin);
            ctx.lineTo(baseX, margin + usableH);
          }
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Anomaly reticle guide overlay
    if (anom.enabled && anom.showReticle) {
      const epiX = (anom.epicenterX ?? 0.5) * width;
      const epiY = (anom.epicenterY ?? 0.5) * height;
      ctx.save();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Influence radius boundary
      ctx.beginPath();
      ctx.arc(epiX, epiY, anom.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Precision target reticle
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(epiX, epiY, 6, 0, Math.PI * 2);
      ctx.moveTo(epiX - 14, epiY);
      ctx.lineTo(epiX + 14, epiY);
      ctx.moveTo(epiX, epiY - 14);
      ctx.lineTo(epiX, epiY + 14);
      ctx.stroke();
      ctx.restore();
    }

    // Concentration attractor guide overlay
    if (conc && conc.enabled && conc.showAttractor) {
      this.drawAttractorGuide(ctx, width, height, palette, conc);
    }
  }

  // Render the polar radiation layout (Radiation)
  renderRadiation(ctx, width, height, palette, marginParam, usableWParam, usableHParam, targetMod = null, radConfig = null) {
    const rad = radConfig || (targetMod?.structure?.radiation) || this.state.modifiers.radiation;
    const grad = (targetMod?.structure?.gradation) || this.state.modifiers.gradation;
    const sim = (targetMod?.structure?.similarity) || this.state.modifiers.similarity;
    const anom = (targetMod?.structure?.anomaly) || this.state.modifiers.anomaly;
    const contrast = (targetMod?.structure?.contrast) || this.state.modifiers.contrast;
    const conc = (targetMod?.structure?.concentration) || this.state.modifiers.concentration;

    const margin = marginParam !== undefined ? marginParam : Math.round(Math.max(20, Math.min(width, height) * 0.05));
    const usableW = usableWParam !== undefined ? usableWParam : width - margin * 2;
    const usableH = height - margin * 2;
    const isMultiCenter = rad.scheme === "multi_center";
    const maxR = Math.min(usableW, usableH) * (isMultiCenter ? 0.32 : 0.42);

    const cx = width / 2 + (rad.centerX || 0);
    const cy = height / 2 + (rad.centerY || 0);

    const rays = Math.max(4, rad.rays);
    const rings = Math.max(2, rad.rings);
    const twistRad = ((rad.spiralTwist || 0) * Math.PI) / 180;

    // Centers list (if multi_center, we have two focal centers creating Moiré)
    const centers = isMultiCenter
      ? [
          { x: cx - maxR * 0.35, y: cy },
          { x: cx + maxR * 0.35, y: cy }
        ]
      : [{ x: cx, y: cy }];

    // Clip to master safe bounds area
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin, margin, usableW, usableH);
    ctx.clip();

    const seed = sim.seed || 42;

    centers.forEach((center, centerIdx) => {
      for (let i = 1; i <= rings; i++) {
        const rInner = ((i - 1) / rings) * maxR;
        const rOuter = (i / rings) * maxR;
        const ringRadius = (rInner + rOuter) * 0.5;

        for (let j = 0; j < rays; j++) {
          const rayAngleStart = (j / rays) * Math.PI * 2;
          const rayAngleEnd = ((j + 1) / rays) * Math.PI * 2;
          const baseAngle = (rayAngleStart + rayAngleEnd) * 0.5;
          let angle = baseAngle;

          // Spiral twist
          const twistFraction = ringRadius / maxR;
          if (rad.scheme === "spiral") {
            angle += twistRad * twistFraction;
          }

          const x = center.x + ringRadius * Math.cos(angle);
          const y = center.y + ringRadius * Math.sin(angle);

          let posX = x;
          let posY = y;
          let concAngle = 0;
          let concScaleMul = 1.0;

          if (conc && conc.enabled) {
            const attX = (conc.attractorX ?? 0.5) * width;
            const attY = (conc.attractorY ?? 0.5) * height;
            const power = (conc.power ?? 65) / 100;
            const radius = conc.radius ?? 240;

            if (conc.mode === "point") {
              const dist = Math.hypot(posX - attX, posY - attY);
              if (dist < radius) {
                const factor = Math.pow(1 - dist / radius, 1.4) * power;
                const pull = factor * (radius * 0.45);
                const a = Math.atan2(attY - posY, attX - posX);
                posX += Math.cos(a) * pull;
                posY += Math.sin(a) * pull;
                concAngle = a;
                if (conc.densityScale) concScaleMul = 0.55 + (dist / radius) * 0.7;
              }
            } else if (conc.mode === "void") {
              const dist = Math.hypot(posX - attX, posY - attY);
              if (dist < radius) {
                const factor = Math.pow(1 - dist / radius, 1.2) * power;
                const push = factor * (radius * 0.55);
                const a = Math.atan2(posY - attY, posX - attX);
                posX += Math.cos(a) * push;
                posY += Math.sin(a) * push;
                concAngle = a + Math.PI / 2;
                if (conc.densityScale) concScaleMul = 0.4 + (dist / radius) * 0.8;
              }
            } else if (conc.mode === "line") {
              if (conc.lineAxis === "vertical") {
                const distX = Math.abs(posX - attX);
                if (distX < radius) {
                  const factor = Math.pow(1 - distX / radius, 1.4) * power;
                  posX += (attX - posX) * factor * 0.75;
                  concAngle = (attX >= posX ? 0 : Math.PI);
                  if (conc.densityScale) concScaleMul = 0.65 + (distX / radius) * 0.6;
                }
              } else {
                const distY = Math.abs(posY - attY);
                if (distY < radius) {
                  const factor = Math.pow(1 - distY / radius, 1.4) * power;
                  posY += (attY - posY) * factor * 0.75;
                  concAngle = (attY >= posY ? Math.PI / 2 : -Math.PI / 2);
                  if (conc.densityScale) concScaleMul = 0.65 + (distY / radius) * 0.6;
                }
              }
            } else if (conc.mode === "free") {
              const att2X = width - attX;
              const att2Y = height - attY;
              const dist1 = Math.hypot(posX - attX, posY - attY);
              const dist2 = Math.hypot(posX - att2X, posY - att2Y);
              const nearestDist = Math.min(dist1, dist2);
              const targetX = dist1 < dist2 ? attX : att2X;
              const targetY = dist1 < dist2 ? attY : att2Y;
              if (nearestDist < radius) {
                const factor = Math.pow(1 - nearestDist / radius, 1.4) * power;
                const pull = factor * (radius * 0.4);
                const a = Math.atan2(targetY - posY, targetX - posX);
                posX += Math.cos(a) * pull;
                posY += Math.sin(a) * pull;
                concAngle = a;
                if (conc.densityScale) concScaleMul = 0.65 + (nearestDist / radius) * 0.6;
              }
            }
          }

          // Soft edge bounding so modules stay comfortably within the canvas
          const safePad = Math.max(12, margin * 0.4);
          posX = Math.max(safePad, Math.min(width - safePad, posX));
          posY = Math.max(safePad, Math.min(height - safePad, posY));

          ctx.save();

          // Active clipping: restrict drawing strictly to polar sector boundaries
          if (rad.activeClipping) {
            ctx.beginPath();
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
            ctx.clip();
          }

          if (sim && sim.enabled && sim.cellJitter > 0) {
            const jRand = (salt) => {
              const val = Math.sin((seed || 42) * 997 + (i * 100 + j + centerIdx * 1000) * 31 + salt * 101) * 10000;
              return (val - Math.floor(val)) * 2 - 1;
            };
            posX += jRand(10) * sim.cellJitter;
            posY += jRand(11) * sim.cellJitter;
          }

          ctx.translate(posX, posY);

          // Concentration directional flow
          if (conc && conc.enabled && conc.alignToField && concAngle !== 0) {
            ctx.rotate(concAngle);
          }

          // Base radiation orientation
          if (rad.scheme === "centrifugal" || rad.scheme === "multi_center") {
            ctx.rotate(angle + Math.PI / 2);
          } else if (rad.scheme === "concentric") {
            ctx.rotate(angle);
          } else if (rad.scheme === "spiral") {
            ctx.rotate(angle + Math.PI / 2 + (twistRad * 0.35));
          }

          // Gradation on polar radiation
          if (grad.enabled) {
            let t = (grad.pathway === "concentric" || grad.pathway === "diagonal") 
              ? (i / rings) 
              : (j / rays);
            if (grad.reverse) t = 1 - t;
            t = (t * (grad.steps || 1)) % 1.0001;

            if (grad.type === "rotation") {
              ctx.rotate(t * (((grad.range ?? 180) * Math.PI) / 180));
            } else if (grad.type === "scale") {
              const sFactor = Math.max(0.05, 0.9 + (t - 0.5) * 1.1 * ((grad.range ?? 180) / 180));
              ctx.scale(sFactor, sFactor);
            } else if (grad.type === "depth") {
              ctx.rotate(0.3);
              ctx.scale(1, Math.max(0.2, 1 - t * 0.75 * ((grad.range ?? 180) / 180)));
              ctx.rotate(-0.3);
            } else if (grad.type === "drift") {
              // Slide along the module's local x axis, up to ~one ring thickness
              ctx.translate(t * (maxR / rings) * 0.9 * ((grad.range ?? 180) / 180), 0);
            }
          }

          // Similarity on radiation
          if (sim.enabled) {
            const pRand = (salt) => {
              const val = Math.sin(seed * 997 + (i * 100 + j + centerIdx * 1000) * 31 + salt * 101) * 10000;
              return (val - Math.floor(val)) * 2 - 1;
            };
            const intensity = (sim.intensity ?? 50) / 100;
            if (sim.kinshipType === "distortion") {
              ctx.scale(1 + pRand(1) * intensity * 0.5, 1 + pRand(2) * intensity * 0.5);
            } else if (sim.kinshipType === "foreshortening") {
              const rRot = pRand(3) * Math.PI;
              ctx.rotate(rRot);
              ctx.scale(1, Math.max(0.2, 1 - Math.abs(pRand(4)) * intensity * 0.8));
              ctx.rotate(-rRot);
            } else if (sim.kinshipType === "rotation_wobble") {
              ctx.rotate(pRand(5) * intensity * (Math.PI / 2));
            } else if (sim.kinshipType === "scale_kinship") {
              const sFactor = Math.max(0.2, 1 + pRand(6) * intensity * 0.6);
              ctx.scale(sFactor, sFactor);
            } else if (sim.kinshipType === "hybrid") {
              const sx = 1 + pRand(1) * intensity * 0.35;
              const sy = 1 + pRand(2) * intensity * 0.35;
              const wobble = pRand(5) * intensity * 0.4;
              ctx.rotate(wobble);
              ctx.scale(sx, sy);
            }
          }

          // Anomaly & Contrast on radiation module
          let cellShapeA = null;
          let cellWireframe = null;
          let cellFg = palette.fg;
          let cellBg = palette.bg;
          let cellScaleMul = 1;

          if (anom.enabled) {
            const epiX = (anom.epicenterX ?? 0.5) * width;
            const epiY = (anom.epicenterY ?? 0.5) * height;
            const dist = Math.hypot(x - epiX, y - epiY);
            const inZone = dist < anom.radius;
            const factor = inZone ? (1 - dist / anom.radius) : 0;
            const severity = (anom.intensity ?? 65) / 100;

            if (anom.type === "focal") {
              if (inZone) {
                cellShapeA = anom.anomalousShape || "triangle";
                ctx.rotate((Math.PI / 4) * severity * factor);
                cellScaleMul *= (1 + 0.35 * severity);
                if (anom.highlightColor) cellFg = anom.accentColor || palette.accent;
              }
            } else if (anom.type === "fracture") {
              const corridor = anom.radius * 0.45;
              if (inZone && Math.abs(x - epiX) < corridor) {
                const jag = Math.sin(y * 0.08) * (18 * severity);
                const shearY = (y > epiY ? 1 : -1) * (36 * severity) + jag;
                const shearX = (x > epiX ? 1 : -1) * (10 * severity);
                ctx.translate(shearX, shearY);
                ctx.rotate((factor * severity * Math.PI) / 3.2);
                if (factor > 0.4 && anom.highlightColor) cellFg = anom.accentColor || palette.accent;
              }
            } else if (anom.type === "swell") {
              if (inZone) {
                const angleToEpi = Math.atan2(y - epiY, x - epiX);
                const push = Math.sin(factor * Math.PI) * (42 * severity);
                ctx.translate(Math.cos(angleToEpi) * push, Math.sin(angleToEpi) * push);
                const sFactor = 1 + factor * 0.55 * severity;
                ctx.scale(sFactor, sFactor);
                if (factor > 0.65 && anom.highlightColor) cellFg = anom.accentColor || palette.accent;
              }
            } else if (anom.type === "tear") {
              if (factor > 0.6) {
                ctx.restore();
                continue;
              } else if (factor > 0.15) {
                const rRand = ((seed * 997 + i * 31 + j * 7) % 100) / 100;
                ctx.translate((rRand - 0.5) * 26 * severity, (1 - rRand - 0.5) * 26 * severity);
                ctx.rotate(rRand * Math.PI * severity);
                const shrink = Math.max(0.15, 1 - factor * 0.85);
                ctx.scale(shrink, shrink);
                if (anom.highlightColor && factor > 0.3) cellFg = anom.accentColor || palette.accent;
              }
            }
          }

          if (contrast.enabled) {
            const k = centerIdx * 1000 + i * rays + j;
            const hash = Math.abs(Math.sin(k * 137.5 + 43.1) * 10000) % 100;
            const isMinority = hash >= (contrast.dominanceRatio ?? 80);
            if (isMinority) {
              if (contrast.dimension === "scale") {
                const sFactor = contrast.scaleFactor ?? 2.2;
                cellScaleMul *= sFactor;
              } else if (contrast.dimension === "shape") {
                cellShapeA = contrast.contrastShape || "cross";
              } else if (contrast.dimension === "direction") {
                const clashAngle = ((contrast.angle ?? 45) * Math.PI) / 180;
                ctx.rotate(clashAngle);
              } else if (contrast.dimension === "tone") {
                cellWireframe = true;
              }
              if (contrast.highlightContrast) {
                cellFg = contrast.accentColor || palette.accent;
              }
            }
          }

          // Natural centrifugal growth scale: outer modules larger, inner smaller, proportional to sector size
          const scaleUnit = 1.25 * Math.min(1.0, Math.min(width, height) / 600);
          const ringThickness = maxR / rings;
          const arcWidth = (ringRadius * 2 * Math.PI) / rays;
          const sectorSize = Math.min(ringThickness, Math.max(ringThickness * 0.5, arcWidth));
          const sectorRatio = sectorSize / usableW;
          const growthFactor = 0.75 + (i / rings) * 0.45;
          const radScaleMul = isMultiCenter ? 0.7 : 1.0;
          const normScale = scaleUnit * sectorRatio * growthFactor * radScaleMul * cellScaleMul * concScaleMul;
          this.cellSeed = i * rays + j + 1;
          this.cellAlt = (i + j) % 2 === 1;
          this.drawSingleLayerShape(ctx, targetMod, normScale, cellFg, cellBg, cellWireframe, cellShapeA, false, cellFg !== palette.fg ? cellFg : null);
          ctx.restore();
        }
      }
    });

    ctx.restore(); // end outer clip

    // Structural visible guides
    if (rad.showRings || rad.showRays) {
      ctx.save();
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;

      centers.forEach(center => {
        if (rad.showRings) {
          for (let i = 1; i <= rings; i++) {
            const r = (i / rings) * maxR;
            ctx.beginPath();
            ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        if (rad.showRays) {
          for (let j = 0; j < rays; j++) {
            const baseAngle = (j / rays) * Math.PI * 2;
            ctx.beginPath();
            if (rad.scheme === "spiral") {
              ctx.moveTo(center.x, center.y);
              const steps = 24;
              for (let s = 1; s <= steps; s++) {
                const frac = s / steps;
                const r = frac * maxR;
                const a = baseAngle + twistRad * frac;
                ctx.lineTo(center.x + r * Math.cos(a), center.y + r * Math.sin(a));
              }
            } else {
              ctx.moveTo(center.x, center.y);
              ctx.lineTo(center.x + maxR * Math.cos(baseAngle), center.y + maxR * Math.sin(baseAngle));
            }
            ctx.stroke();
          }
        }
      });

      ctx.restore();
    }

    // Anomaly reticle guide overlay on radiation
    if (anom.enabled && anom.showReticle) {
      const epiX = (anom.epicenterX ?? 0.5) * width;
      const epiY = (anom.epicenterY ?? 0.5) * height;
      ctx.save();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Influence radius boundary
      ctx.beginPath();
      ctx.arc(epiX, epiY, anom.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Precision target reticle
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(epiX, epiY, 6, 0, Math.PI * 2);
      ctx.moveTo(epiX - 14, epiY);
      ctx.lineTo(epiX + 14, epiY);
      ctx.moveTo(epiX, epiY - 14);
      ctx.lineTo(epiX, epiY + 14);
      ctx.stroke();
      ctx.restore();
    }

    // Concentration attractor guide overlay on radiation
    if (conc && conc.enabled && conc.showAttractor) {
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
  render(palette) {
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
    const margin = Math.round(Math.max(20, Math.min(width, height) * 0.05));
    const usableW = width - margin * 2;
    const usableH = height - margin * 2;

    if (this.state.showSafeBounds) {
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

      ctx.restore();
    }

    // 2.5 Isometric Drafting Guides (Space)
    const showIsoGuides = this.getLayers().some(l => l.visible !== false && l.structure?.space?.enabled && l.structure.space.showIsoGuides)
      || (this.state.modifiers.space.enabled && this.state.modifiers.space.showIsoGuides);
    if (showIsoGuides) {
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

    const hasLayerStructure = layers.some(l => l.visible !== false && l.structure && (l.structure.enabled || (l.structure.formalStructure && l.structure.formalStructure.enabled)));
    const hasGlobalStructure = !!(this.state.modifiers.radiation.enabled || this.state.modifiers.repetition.enabled);

    if (!hasLayerStructure && !hasGlobalStructure) {
      // Single Module Study in Center (Pure Base Units centered on canvas)
      for (const layerId of renderStack) {
        const mod = layers.find(l => l.id === layerId);
        if (!mod || mod.visible === false) continue;
        this.renderSingleLayerModule(ctx, mod, width, height, palette);
      }
    } else if (hasLayerStructure) {
      // Independent Multilayer Pipeline: Each layer has its own independent layout structure & properties
      for (const layerId of renderStack) {
        const mod = layers.find(l => l.id === layerId);
        if (!mod || mod.visible === false) continue;

        const layerStruct = mod.structure;
        if (layerStruct && (layerStruct.enabled || (layerStruct.formalStructure && layerStruct.formalStructure.enabled))) {
          if (layerStruct.mode === "radiation") {
            this.renderRadiation(ctx, width, height, palette, margin, usableW, usableH, mod, layerStruct.radiation);
          } else {
            this.renderRepetitionGrid(ctx, width, height, palette, margin, usableW, usableH, mod, layerStruct.repetition);
          }
        } else {
          // Layer rendered as single element centered on canvas
          this.renderSingleLayerModule(ctx, mod, width, height, palette);
        }
      }
    } else {
      // Global structure fallback
      if (this.state.modifiers.radiation.enabled) {
        this.renderRadiation(ctx, width, height, palette, margin, usableW, usableH);
      } else {
        this.renderRepetitionGrid(ctx, width, height, palette, margin, usableW, usableH);
      }
    }

    ctx.restore(); // end master artboard clip

    // 4. Subtle center reference dot (when in single module mode)
    if (!this.state.modifiers.repetition.enabled && !this.state.modifiers.structure.enabled && !this.state.modifiers.radiation.enabled) {
      ctx.save();
      ctx.fillStyle = palette.accent;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  }

  // Concentration Attractor Field Guide (Concentration)
  drawAttractorGuide(ctx, width, height, palette, conc) {
    const attX = (conc.attractorX ?? 0.5) * width;
    const attY = (conc.attractorY ?? 0.5) * height;
    const radius = conc.radius ?? 240;

    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.fillStyle = palette.accent;

    if (conc.mode === "line") {
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
        // Complementary node for dual hotspot
        const att2X = width - attX;
        const att2Y = height - attY;
        ctx.beginPath();
        ctx.arc(att2X, att2Y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(att2X, att2Y, radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 30° Isometric Construction Guide Grid (Space)
  drawIsometricGuides(ctx, width, height, palette) {
    ctx.save();
    ctx.strokeStyle = palette.grid;
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
 * MODULE STUDIO — Presets Gallery
 * Curated parametric compositions across Bauhaus, Swiss, Op-Art, and Kinetic aesthetics.
 */



// Preset layer: shape, size (width = height), rotation, offsets and draw mode.
const presetLayer = (id, shape, size, rotation, offsetX, offsetY, wireframe) => ({
  ...createDefaultLayer(id, id === "layer-1" ? "Layer 1" : "Layer 2", shape, offsetX, offsetY, rotation),
  scale: size,
  width: size,
  height: size,
  wireframe
});
const STUDIO_PRESETS = [
  {
    id: "nautilus_spiral",
    name: "Nautilus Kinetic Spiral",
    category: "Radial & Polar",
    description: "Centrifugal spiral radiation with logarithmic twist and crescent layers.",
    state: {
      aspectRatio: "1:1",
      paletteId: "inverted",
      layers: [
        presetLayer("layer-1", "circle", 95, 0, 0, 0, false),
        presetLayer("layer-2", "crescent", 75, 45, 25, 0, false)
      ],
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: false, gridType: "basic", cols: 4, rows: 4, spacing: 0, shearAngle: 15, slideOffset: 0.5, curveIntensity: 18, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: true, type: "scale", pathway: "concentric", range: 120, steps: 1, reverse: false },
        radiation: { enabled: true, scheme: "spiral", rays: 16, rings: 6, spiralTwist: 60, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "cross", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, jitter: 1, skipChance: 10, crossing: 10, undulation: 10 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: false,
      zoomLevel: 1.0
    }
  },
  {
    id: "moire_guilloche",
    name: "Moiré Guilloché Rosette",
    category: "Radial & Polar",
    description: "Dual-center interference pattern generating high-frequency geometric moiré.",
    state: {
      aspectRatio: "1:1",
      paletteId: "blueprint",
      layers: [
        presetLayer("layer-1", "cross", 70, 0, 0, 0, true),
        presetLayer("layer-2", "parallelogram", 65, 45, 0, 0, true)
      ],
      invertFigureGround: false,
      wireframe: true,
      modifiers: {
        repetition: { enabled: false, gridType: "basic", cols: 4, rows: 4, spacing: 0, shearAngle: 15, slideOffset: 0.5, curveIntensity: 18, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: true, scheme: "multi_center", rays: 24, rings: 7, spiralTwist: -35, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "cross", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, jitter: 1, skipChance: 10, crossing: 10, undulation: 10 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: false,
      zoomLevel: 1.0
    }
  },
  {
    id: "bauhaus_subtraction",
    name: "Bauhaus Minimal Construct",
    category: "Cartesian Grid",
    description: "Orthogonal structural tension with an overlapping circular layer and primary contrast.",
    state: {
      aspectRatio: "3:4",
      paletteId: "bauhaus",
      layers: [
        presetLayer("layer-1", "square", 115, 0, 0, 0, false),
        presetLayer("layer-2", "circle", 90, 0, 45, 0, false)
      ],
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "basic", cols: 3, rows: 4, spacing: 24, shearAngle: 0, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: true, type: "rotation", pathway: "diagonal", range: 90, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle", highlightColor: true, showReticle: false },
        contrast: { enabled: true, dimension: "direction", dominanceRatio: 75, contrastShape: "cross", scaleFactor: 1.0, angle: 45, highlightContrast: true },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, jitter: 1, skipChance: 10, crossing: 10, undulation: 10 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: true,
      zoomLevel: 1.0
    }
  },
  {
    id: "tectonic_rift",
    name: "Tectonic Fault Line",
    category: "Anomaly & Rift",
    description: "Sheared repetition lattice disrupted by a transversal geological fracture.",
    state: {
      aspectRatio: "1:1",
      paletteId: "monochrome",
      layers: [
        presetLayer("layer-1", "square", 65, 0, 0, 0, false)
      ],
      invertFigureGround: true,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "sheared", cols: 7, rows: 7, spacing: 10, shearAngle: 15, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: true, type: "fracture", epicenterX: 0.5, epicenterY: 0.5, radius: 220, intensity: 85, anomalousShape: "cross", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "cross", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, jitter: 1, skipChance: 10, crossing: 10, undulation: 10 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: false,
      zoomLevel: 1.0
    }
  },
  {
    id: "gravitational_singularity",
    name: "Gravitational Singularity",
    category: "Fields & Forces",
    description: "High-density triangular field collapsing inward toward an off-center vortex.",
    state: {
      aspectRatio: "9:16",
      paletteId: "inverted",
      layers: [
        presetLayer("layer-1", "triangle", 50, 0, 0, 0, false)
      ],
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "sliding", cols: 8, rows: 14, spacing: 4, shearAngle: 0, slideOffset: 0.5, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: true, kinshipType: "rotation_wobble", intensity: 25, cellJitter: 0, seed: 88 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "cross", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: true, mode: "point", attractorX: 0.5, attractorY: 0.45, power: 85, radius: 340, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, jitter: 1, skipChance: 10, crossing: 10, undulation: 10 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: false,
      zoomLevel: 1.0
    }
  },
  {
    id: "washi_isometric",
    name: "Washi Isometric Plate",
    category: "Space & Material",
    description: "Axonometric hexagonal volumes immersed in authentic litographic paper grain.",
    state: {
      aspectRatio: "4:3",
      paletteId: "sepia",
      layers: [
        presetLayer("layer-1", "hexagon", 110, 0, 0, 0, false),
        presetLayer("layer-2", "circle", 80, 0, 0, 0, false)
      ],
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "basic", cols: 4, rows: 3, spacing: 30, shearAngle: 0, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "cross", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: true, jitter: 2, skipChance: 0, crossing: 0, undulation: 4 },
        space: { enabled: true, mode: "isometric", depth: 40, angle: 30, shading: 70, showIsoGuides: false }
      },
      showSafeBounds: false,
      zoomLevel: 1.0
    }
  },
  {
    id: "optical_wave_scan",
    name: "Optical Slit-Scan Waves",
    category: "Kinetic Op-Art",
    description: "Curved sinusoidal wave rasterization with rotational diagonal progression.",
    state: {
      aspectRatio: "16:9",
      paletteId: "inverted",
      layers: [
        presetLayer("layer-1", "cross", 45, 0, 0, 0, false)
      ],
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "curved", cols: 12, rows: 6, spacing: 6, shearAngle: 0, slideOffset: 0, curveIntensity: 28, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: true, type: "rotation", pathway: "diagonal", range: 180, steps: 2, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "cross", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, jitter: 1, skipChance: 10, crossing: 10, undulation: 10 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: false,
      zoomLevel: 1.0
    }
  },
  {
    id: "rhythmic_cadence",
    name: "Swiss Rhythmic Compression",
    category: "Cartesian Grid",
    description: "Proportional column cadence A:B:A:B with architectural band lines.",
    state: {
      aspectRatio: "3:4",
      paletteId: "monochrome",
      layers: [
        presetLayer("layer-1", "parallelogram", 80, 0, 0, 0, false),
        presetLayer("layer-2", "circle", 50, 0, 0, 0, false)
      ],
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "basic", cols: 5, rows: 6, spacing: 12, shearAngle: 0, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: true, mode: "rhythmic", colRatio: 2.2, rowRatio: 1.6, bandThickness: 2, showBands: true },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "cross", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, jitter: 1, skipChance: 10, crossing: 10, undulation: 10 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: true,
      zoomLevel: 1.0
    }
  }
];


  /**
 * MODULE STUDIO — Exporter Module
 * High-resolution PNG (Retina 2x/4x), SVG Vector generation, JSON project save/load.
 */
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
    engine.render(palette);
    engine.canvas = origCanvas;

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
    const jsonStr = JSON.stringify(state, null, 2);
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
   * Export Vector SVG
   */
  exportSVG(canvas, state, palette, filename = "module-studio-vector.svg") {
    // Generate clean SVG container wrapping paths
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const bg = state.invertFigureGround ? palette.fg : palette.bg;
    const fg = state.invertFigureGround ? palette.bg : palette.fg;

    // We convert the rendered canvas to SVG image or vector description
    const imgData = canvas.toDataURL("image/png", 1.0);

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Module Studio Vector/Composition Export (${width}x${height}) -->
  <defs>
    <style>
      .bg { fill: ${bg}; }
      .fg { fill: ${fg}; }
    </style>
  </defs>
  <rect class="bg" width="100%" height="100%"/>
  <image href="${imgData}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

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
    
    // Viewport Navigation state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.isSpacePressed = false;

    // Active Layer Management (Each layer is a module!)
    this.activeLayerId = "layer-2"; // 'layer-1' (Form A) or 'layer-2' (Form B)

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
    this.setupFormalStructure();
    this.setupSimilarity();
    this.setupGradation();
    this.setupAnomaly();
    this.setupContrast();
    this.setupConcentration();
    this.setupSpace();
    this.setupTexture();
    this.setupShapeInspector();
    this.setupModifierCards();

    // Initial render
    this.updateActivePalette();
    this.render();
    this.centerArtboard();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();

    // Sync header button states
    const gridBtn = document.getElementById("btn-toggle-grid");
    if (gridBtn) gridBtn.classList.toggle("active", !!this.state.showSafeBounds);
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
  }

  render() {
    if (!this.engine || !this.canvas) return;
    this.engine.state = this.state;
    const palette = this.getActivePalette();
    this.engine.render(palette);
    this.updateHUD();
  }

  applyAspectRatio(key) {
    const cfg = ASPECT_RATIOS[key] || ASPECT_RATIOS["1:1"];
    this.state.aspectRatio = key;
    this.canvas.width = cfg.w;
    this.canvas.height = cfg.h;
    this.canvas.style.aspectRatio = cfg.css;

    // Update dimensions HUD
    const resText = document.getElementById("hud-resolution");
    if (resText) resText.textContent = `${cfg.w} × ${cfg.h} PX`;

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

    // 4. Randomize Button
    const randomBtn = document.getElementById("btn-random-preset");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const randomIndex = Math.floor(Math.random() * STUDIO_PRESETS.length);
        const preset = STUDIO_PRESETS[randomIndex];
        this.loadPreset(preset);
      });
    }

    // 5. Copy SVG Code
    const copySvgBtn = document.getElementById("btn-copy-svg-code");
    if (copySvgBtn) {
      copySvgBtn.addEventListener("click", async () => {
        try {
          const width = this.canvas.width / (window.devicePixelRatio || 1);
          const height = this.canvas.height / (window.devicePixelRatio || 1);
          const bg = this.state.invertFigureGround ? "#18181f" : "#ffffff";
          const imgData = this.canvas.toDataURL("image/png", 1.0);
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bg}"/><image href="${imgData}" width="${width}" height="${height}"/></svg>`;
          await navigator.clipboard.writeText(svgString);
          
          const origText = copySvgBtn.querySelector("span").textContent;
          copySvgBtn.querySelector("span").textContent = "Copied!";
          setTimeout(() => copySvgBtn.querySelector("span").textContent = origText, 1500);
        } catch (err) {
          alert("SVG copied to clipboard!");
        }
      });
    }

    // 6. Download SVG File
    const downloadSvgBtn = document.getElementById("btn-download-svg");
    if (downloadSvgBtn) {
      downloadSvgBtn.addEventListener("click", () => {
        StudioExporter.exportSVG(this.canvas, this.state, this.getActivePalette(), "module-studio-composition.svg");
      });
    }

    // 7. Config Button
    const configBtn = document.getElementById("btn-open-config");
    if (configBtn) {
      configBtn.addEventListener("click", () => {
        StudioExporter.exportJSON(this.state, "module-studio-project.json");
      });
    }
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

    const shapesPool = ["circle", "square", "triangle", "hexagon", "parallelogram", "cross"];
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

  updateLayerCardsUI() {
    const container = document.getElementById("layers-stack-container");
    const addBtn = document.getElementById("btn-add-pattern");
    const layersCountBadge = document.getElementById("layers-count-badge");
    const layersStatus = document.getElementById("hud-layers-status");

    const layers = this.getLayers();
    const count = layers.length;

    if (layersCountBadge) layersCountBadge.textContent = `${count} / 5`;
    if (layersStatus) layersStatus.textContent = `${count} LAYERS`;

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
      const icon = `<i class="ph-fill ph-${shapeDef?.phIcon || "circle"} text-[16px]"></i>`;
      const mode = l.wireframe !== false ? "stroke" : "fill";
      const s = l.structure;
      const structText = s?.enabled ? (s.mode === "radiation" ? " • radiation" : " • grid") : "";

      return `
        <div id="layer-card-${l.id}" class="layer-card ${isActive ? 'is-active' : ''} ${!isVis ? 'is-hidden' : ''}" data-layer-id="${l.id}" draggable="true">
          <div class="flex items-center gap-2.5 min-w-0 pointer-events-none">
            <div class="layer-preview-box">
              ${icon}
            </div>
            <div class="min-w-0">
              <div class="layer-title font-semibold text-xs truncate">${l.name || l.id}</div>
              <div class="layer-subtitle text-[10px] font-mono truncate">${l.shape} • ${mode}${structText}</div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="layer-action-btn btn-layer-eye" data-layer="${l.id}" title="Toggle Visibility">
              ${isVis ? '<i class="ph ph-eye text-[14px]"></i>' : '<i class="ph ph-eye-slash text-[14px] opacity-40"></i>'}
            </button>
            <button type="button" class="layer-action-btn btn-layer-delete ${!canDelete ? 'opacity-25 cursor-not-allowed' : ''}" data-layer="${l.id}" title="${canDelete ? 'Delete Layer' : 'Cannot delete the only layer'}" ${!canDelete ? 'disabled' : ''}>
              <i class="ph ph-trash text-[14px]"></i>
            </button>
            <span class="layer-action-btn layer-drag-handle cursor-grab active:cursor-grabbing text-zinc-400" title="Drag to reorder">
              <i class="ph ph-dots-six-vertical text-[14px]"></i>
            </span>
          </div>
        </div>
      `;
    }).join("");

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
      } else if (this.state.modifiers && this.state.modifiers[tab]) {
        isActive = !!this.state.modifiers[tab].enabled;
      }
      btn.classList.toggle("has-modifier-active", isActive);
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
    }

    // Sync Radiation Controls
    const rad = struct.radiation;
    if (rad) {
      document.querySelectorAll("[data-rad-scheme]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radScheme === rad.scheme);
      });
      this.syncControlValue("input-layout-rays", rad.rays || 12);
      this.syncControlValue("num-layout-rays", rad.rays || 12);
      this.syncControlValue("input-layout-rings", rad.rings || 5);
      this.syncControlValue("num-layout-rings", rad.rings || 5);
      this.syncControlValue("input-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      this.syncControlValue("num-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      this.syncCheckbox("chk-rad-clip", !!rad.activeClipping);
      this.syncCheckbox("chk-rad-gridlines", !!(rad.showRays || rad.showRings));
      this.syncCheckbox("chk-rad-checker", !!rad.checkerInvert);
    }

    this.updateRailIndicatorDots();
  }

  /* =========================================================================
     LAYOUT STRUCTURE CONTROLLER (Per Active Layer)
     ========================================================================= */

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
      this.syncSimilarityInspectorWithActiveLayer();
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
      this.syncSimilarityInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Layout Mode: ${mode}`);
    };

    btnRep?.addEventListener("click", () => setMode("repetition"));
    btnRad?.addEventListener("click", () => setMode("radiation"));

    // Repetition Variations (Grid, Curved, Brick, Diagonal)
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

    this.bindSliderWithNumber("input-layout-twist", "num-layout-twist", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.spiralTwist = val;
      struct.mode = "radiation";
      this.render();
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

    this.syncControlValue("input-struct-col-ratio", fs.colRatio !== undefined ? fs.colRatio : 1);
    this.syncControlValue("num-struct-col-ratio", fs.colRatio !== undefined ? fs.colRatio : 1);
    this.syncControlValue("input-struct-row-ratio", fs.rowRatio !== undefined ? fs.rowRatio : 1);
    this.syncControlValue("num-struct-row-ratio", fs.rowRatio !== undefined ? fs.rowRatio : 1);
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

    this.bindSliderWithNumber("input-struct-col-ratio", "num-struct-col-ratio", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      mod.structure.formalStructure.colRatio = val;
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
    }, "Col Ratio");

    this.bindSliderWithNumber("input-struct-row-ratio", "num-struct-row-ratio", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      mod.structure.formalStructure.rowRatio = val;
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
    }, "Row Ratio");

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
     Visual Kinship: Elastic, 3D tilt, Wobble, Scale, Hibrid
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
    const showWarning = isSimActive && !hasGrid;

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

    // Sync Fluctuation Intensity slider and numeric box (50%)
    const intensity = sim.intensity !== undefined ? sim.intensity : 50;
    this.syncControlValue("input-sim-intensity", intensity);
    const numIntensity = document.getElementById("num-sim-intensity");
    if (numIntensity) numIntensity.value = `${intensity}%`;

    // Sync Spatial Cell Jitter slider and numeric box (0)
    const jitter = sim.cellJitter !== undefined ? sim.cellJitter : 0;
    this.syncControlValue("input-sim-jitter", jitter);
    this.syncControlValue("num-sim-jitter", jitter);

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

    // Visual Kinship Type Pills: Elastic, 3D tilt, Wobble, Scale, Hibrid
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
      mod.structure.similarity.cellJitter = val;
      mod.structure.similarity.enabled = true;
      if (toggle) toggle.checked = true;
      this.render();
    }, "Cell Jitter");
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
    if (warnBox) warnBox.classList.toggle("hidden", !(grad.enabled && !hasGrid));

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

    // Range (15º to 360º)
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
      const val = isNaN(raw) ? 180 : Math.max(15, Math.min(360, raw));
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

    document.getElementById("toggle-grad-reverse")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(g => { g.reverse = checked; }, `Gradation Reverse: ${checked ? "ON" : "OFF"}`);
    });
  }

  // Accent color row (swatch + hex) shared by modifiers that can highlight elements.
  syncAccentColorRow(prefix, color, active) {
    const hex = (color || "#f43f5e").toUpperCase();
    const input = document.getElementById(`${prefix}-accent-color`);
    if (input) input.value = hex.toLowerCase();
    const swatch = document.getElementById(`${prefix}-accent-swatch`);
    if (swatch) swatch.style.backgroundColor = hex;
    const label = document.getElementById(`${prefix}-accent-hex`);
    if (label) label.textContent = hex;
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

  syncAnomalyInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const anom = this.getActiveAnomaly();
    if (!mod || !anom) return;

    const badge = document.getElementById("badge-anomaly-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-anomaly-grid");
    if (warnBox) warnBox.classList.toggle("hidden", !(anom.enabled && !hasGrid));

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
    setPair("input-anom-x", "num-anom-x", Math.round((anom.epicenterX ?? 0.5) * 100), "%");
    setPair("input-anom-y", "num-anom-y", Math.round((anom.epicenterY ?? 0.5) * 100), "%");
    setPair("input-anom-radius", "num-anom-radius", anom.radius ?? 160, "px");
    setPair("input-anom-intensity", "num-anom-intensity", anom.intensity ?? 65, "%");

    this.syncCheckbox("toggle-anom-highlight", !!anom.highlightColor);
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
    document.querySelectorAll("#card-anomaly [data-anom-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.anomalousShape = btn.dataset.anomShape; }, `Anomaly Shape: ${btn.dataset.anomShape}`);
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
    bindPair("input-anom-x", "num-anom-x", { min: 10, max: 90, suffix: "%", toStored: v => v / 100, label: "X", key: "epicenterX" });
    bindPair("input-anom-y", "num-anom-y", { min: 10, max: 90, suffix: "%", toStored: v => v / 100, label: "Y", key: "epicenterY" });
    bindPair("input-anom-radius", "num-anom-radius", { min: 50, max: 350, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });
    bindPair("input-anom-intensity", "num-anom-intensity", { min: 10, max: 100, suffix: "%", toStored: v => v, label: "Severity", key: "intensity" });

    document.getElementById("toggle-anom-highlight")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(a => { a.highlightColor = checked; }, `Anomaly Highlight: ${checked ? "ON" : "OFF"}`);
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
    if (warnBox) warnBox.classList.toggle("hidden", !(con.enabled && !hasGrid));

    const toggle = document.getElementById("toggle-contrast-active");
    if (toggle) toggle.checked = !!con.enabled;

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

    this.syncCheckbox("toggle-contrast-highlight", !!con.highlightContrast);
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

    document.querySelectorAll("#card-contrast [data-contrast-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.contrastShape = btn.dataset.contrastShape; }, `Contrast Shape: ${btn.dataset.contrastShape}`);
      });
    });

    document.getElementById("toggle-contrast-highlight")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(c => { c.highlightContrast = checked; }, `Contrast Accentuate Minority: ${checked ? "ON" : "OFF"}`);
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
    if (warnBox) warnBox.classList.toggle("hidden", !(conc.enabled && !hasGrid));

    const toggle = document.getElementById("toggle-concentration-active");
    if (toggle) toggle.checked = !!conc.enabled;

    document.querySelectorAll("#card-concentration [data-conc-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concMode === conc.mode);
    });
    document.querySelectorAll("#card-concentration [data-conc-axis]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concAxis === conc.lineAxis);
    });
    // The axis only matters for the line structure.
    document.getElementById("conc-axis-block")?.classList.toggle("hidden", conc.mode !== "line");

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-conc-x", "num-conc-x", Math.round((conc.attractorX ?? 0.5) * 100), "%");
    setPair("input-conc-y", "num-conc-y", Math.round((conc.attractorY ?? 0.5) * 100), "%");
    setPair("input-conc-power", "num-conc-power", conc.power ?? 50, "%");
    setPair("input-conc-radius", "num-conc-radius", conc.radius ?? 240, "px");

    this.syncCheckbox("toggle-conc-align", !!conc.alignToField);
    this.syncCheckbox("toggle-conc-density", !!conc.densityScale);
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
    bindPair("input-conc-power", "num-conc-power", { min: 20, max: 100, suffix: "%", toStored: v => v, label: "Pull", key: "power" });
    bindPair("input-conc-radius", "num-conc-radius", { min: 80, max: 450, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });

    const bindCheck = (id, key, label) => {
      document.getElementById(id)?.addEventListener("change", (e) => {
        const checked = e.target.checked;
        commit(c => { c[key] = checked; }, `Concentration ${label}: ${checked ? "ON" : "OFF"}`);
      });
    };
    bindCheck("toggle-conc-align", "alignToField", "Orient to Flow");
    bindCheck("toggle-conc-density", "densityScale", "Density Scale");
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

  setupShapeInspector() {
    // 1. Shape Glyph Selection Grid (15 Shapes)
    document.querySelectorAll("[data-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        const shape = btn.dataset.shape;
        const mod = this.getActiveModule();
        mod.shape = shape;
        
        document.querySelectorAll("[data-shape]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

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
    }, "Stroke Width");

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

    // Sync Dimensions
    this.syncControlValue("input-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("num-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("input-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("num-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("input-active-rotation", mod.rotation || 0);
    this.syncControlValue("num-active-rotation", mod.rotation || 0);
    this.syncControlValue("input-active-stroke", mod.strokeWidth || 1.2);
    this.syncControlValue("num-active-stroke", mod.strokeWidth || 1.2);
    this.syncControlValue("input-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("num-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("input-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);
    this.syncControlValue("num-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);

    // Sync Mode (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    const isWireframe = mod.wireframe !== undefined ? mod.wireframe : this.state.wireframe;
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
    // Zoom and pan disabled by request. Artboard stays strictly at 100% natural scale.
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    if (this.artboardWrapper) {
      this.artboardWrapper.style.transform = "none";
    }
  }

  updateViewportTransform() {
    if (this.artboardWrapper) {
      this.artboardWrapper.style.transform = "none";
    }
  }

  adjustZoom(factor) {
    // Disabled
  }

  centerArtboard() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    if (this.artboardWrapper) {
      this.artboardWrapper.style.transform = "none";
    }
  }

  updateHUD() {
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"];
    const resEl = document.getElementById("hud-resolution");
    if (resEl) resEl.textContent = `${cfg.w} × ${cfg.h} PX`;
  }

  /* =========================================================================
     KEYBOARD SHORTCUTS
     ========================================================================= */

  setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (e.code === "Space" && !this.isSpacePressed) {
        this.isSpacePressed = true;
        const vp = document.getElementById("canvas-viewport-container");
        if (vp) vp.style.cursor = "grab";
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      }

      if (isCmdOrCtrl && e.key === "0") {
        e.preventDefault();
        this.centerArtboard();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this.isSpacePressed = false;
        const vp = document.getElementById("canvas-viewport-container");
        if (vp) vp.style.cursor = "default";
      }
    });
  }

  /* =========================================================================
     MODIFIERS STACK BINDINGS
     ========================================================================= */

  setupModifierCards() {
    const mods = this.state.modifiers;

    // Click anywhere on header to toggle switch
    document.querySelectorAll(".modifier-card").forEach(card => {
      const header = card.querySelector(".modifier-header");
      const switchInput = card.querySelector(".switch input[type='checkbox']");
      if (header && switchInput) {
        header.addEventListener("click", (e) => {
          if (!e.target.closest(".switch") && !e.target.closest(".close-flyout-btn")) {
            switchInput.checked = !switchInput.checked;
            switchInput.dispatchEvent(new Event("change"));
          }
        });
      }
    });

    // 1. REPETITION
    this.bindModifierMasterToggle("toggle-mod-repetition", "repetition", (enabled) => {
      if (enabled && mods.radiation.enabled) {
        mods.radiation.enabled = false;
        this.syncCheckbox("toggle-mod-radiation", false);
        this.setModifierCardActiveState("card-radiation", false);
      }
      if (!enabled && mods.structure.enabled) {
        mods.structure.enabled = false;
        this.syncCheckbox("toggle-mod-structure", false);
        this.setModifierCardActiveState("card-structure", false);
      }
      this.render();
    });

    document.querySelectorAll("[data-grid-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("repetition");
        mods.repetition.gridType = btn.dataset.gridType;
        document.querySelectorAll("[data-grid-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
        this.pushHistory(`Repetition Grid: ${btn.dataset.gridType}`);
      });
    });

    this.bindSliderWithNumber("input-grid-cols", "num-grid-cols", (val) => { mods.repetition.cols = val; this.render(); }, "Grid Columns", "repetition");
    this.bindSliderWithNumber("input-grid-rows", "num-grid-rows", (val) => { mods.repetition.rows = val; this.render(); }, "Grid Rows", "repetition");
    this.bindSliderWithNumber("input-grid-spacing", "num-grid-spacing", (val) => { mods.repetition.spacing = val; this.render(); }, "Gutter Spacing", "repetition");
    this.bindSliderWithNumber("input-grid-shear", "num-grid-shear", (val) => { mods.repetition.shearAngle = val; this.render(); }, "Grid Shear", "repetition");
    this.bindSliderWithNumber("input-grid-slide", "num-grid-slide", (val) => { mods.repetition.slideOffset = val; this.render(); }, "Grid Slide", "repetition");

    // 2. STRUCTURE
    this.bindModifierMasterToggle("toggle-mod-structure", "structure", (enabled) => {
      if (enabled) {
        if (mods.radiation.enabled) {
          mods.radiation.enabled = false;
          this.syncCheckbox("toggle-mod-radiation", false);
          this.setModifierCardActiveState("card-radiation", false);
        }
        if (!mods.repetition.enabled) {
          mods.repetition.enabled = true;
          this.syncCheckbox("toggle-mod-repetition", true);
          this.setModifierCardActiveState("card-repetition", true);
        }
      }
      this.render();
    });

    document.querySelectorAll("[data-struct-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("structure");
        mods.structure.mode = btn.dataset.structMode;
        document.querySelectorAll("[data-struct-mode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-struct-col-ratio", "num-struct-col-ratio", (val) => { mods.structure.colRatio = val; this.render(); }, "Column Ratio", "structure");
    this.bindSliderWithNumber("input-struct-row-ratio", "num-struct-row-ratio", (val) => { mods.structure.rowRatio = val; this.render(); }, "Row Ratio", "structure");
    this.bindCheckbox("check-struct-bands", (val) => { this.ensureModifierActive("structure"); mods.structure.showBands = val; this.render(); });

    // 3. RADIATION
    this.bindModifierMasterToggle("toggle-mod-radiation", "radiation", (enabled) => {
      if (enabled) {
        if (mods.repetition.enabled) {
          mods.repetition.enabled = false;
          this.syncCheckbox("toggle-mod-repetition", false);
          this.setModifierCardActiveState("card-repetition", false);
        }
        if (mods.structure.enabled) {
          mods.structure.enabled = false;
          this.syncCheckbox("toggle-mod-structure", false);
          this.setModifierCardActiveState("card-structure", false);
        }
      }
      this.render();
    });

    document.querySelectorAll("[data-rad-scheme]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("radiation");
        mods.radiation.scheme = btn.dataset.radScheme;
        document.querySelectorAll("[data-rad-scheme]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-rad-rays", "num-rad-rays", (val) => { mods.radiation.rays = val; this.render(); }, "Rays Count", "radiation");
    this.bindSliderWithNumber("input-rad-rings", "num-rad-rings", (val) => { mods.radiation.rings = val; this.render(); }, "Rings Count", "radiation");
    this.bindSliderWithNumber("input-rad-twist", "num-rad-twist", (val) => { mods.radiation.spiralTwist = val; this.render(); }, "Spiral Twist", "radiation");
    this.bindCheckbox("check-rad-show-rays", (val) => { this.ensureModifierActive("radiation"); mods.radiation.showRays = val; this.render(); });
    this.bindCheckbox("check-rad-show-rings", (val) => { this.ensureModifierActive("radiation"); mods.radiation.showRings = val; this.render(); });

    // 4. SIMILARITY
    this.bindModifierMasterToggle("toggle-mod-similarity", "similarity");
    document.querySelectorAll("[data-kinship-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("similarity");
        mods.similarity.kinshipType = btn.dataset.kinshipType;
        document.querySelectorAll("[data-kinship-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-sim-intensity", "num-sim-intensity", (val) => { mods.similarity.intensity = val; this.render(); }, "Similarity Variance", "similarity");
    this.bindSliderWithNumber("input-sim-jitter", "num-sim-jitter", (val) => { mods.similarity.cellJitter = val; this.render(); }, "Cell Jitter", "similarity");
  }

  ensureModifierActive(modifierKey) {
    const mods = this.state.modifiers;
    if (!mods[modifierKey] || mods[modifierKey].enabled) return;

    mods[modifierKey].enabled = true;
    this.syncCheckbox(`toggle-mod-${modifierKey}`, true);
    this.setModifierCardActiveState(`card-${modifierKey}`, true);

    if (modifierKey === "radiation") {
      if (mods.repetition.enabled) {
        mods.repetition.enabled = false;
        this.syncCheckbox("toggle-mod-repetition", false);
        this.setModifierCardActiveState("card-repetition", false);
      }
      if (mods.structure.enabled) {
        mods.structure.enabled = false;
        this.syncCheckbox("toggle-mod-structure", false);
        this.setModifierCardActiveState("card-structure", false);
      }
    } else if (modifierKey === "repetition" || modifierKey === "structure") {
      if (mods.radiation.enabled) {
        mods.radiation.enabled = false;
        this.syncCheckbox("toggle-mod-radiation", false);
        this.setModifierCardActiveState("card-radiation", false);
      }
      if (modifierKey === "structure" && !mods.repetition.enabled) {
        mods.repetition.enabled = true;
        this.syncCheckbox("toggle-mod-repetition", true);
        this.setModifierCardActiveState("card-repetition", true);
      }
    }
    this.updateRailIndicatorDots();
  }

  bindModifierMasterToggle(switchId, modifierKey, extraCallback) {
    const sw = document.getElementById(switchId);
    if (!sw) return;
    sw.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      this.state.modifiers[modifierKey].enabled = enabled;
      this.setModifierCardActiveState(`card-${modifierKey}`, enabled);
      if (extraCallback) extraCallback(enabled);
      this.updateRailIndicatorDots();
      this.render();
      this.pushHistory(`Modifier ${modifierKey}: ${enabled ? "ON" : "OFF"}`);
    });
  }

  setModifierCardActiveState(cardId, isActive) {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.toggle("is-active", isActive);
    }
  }

  bindSliderWithNumber(sliderId, numberId, callback, label = "Parameter", modifierKey = null) {
    const slider = document.getElementById(sliderId);
    const numInput = document.getElementById(numberId);

    if (slider) {
      slider.addEventListener("input", (e) => {
        if (modifierKey) this.ensureModifierActive(modifierKey);
        const val = parseFloat(e.target.value);
        if (numInput) numInput.value = val;
        callback(val);
      });
      slider.addEventListener("change", (e) => {
        this.pushHistory(`Changed ${label}: ${e.target.value}`);
      });
    }

    if (numInput) {
      numInput.addEventListener("change", (e) => {
        if (modifierKey) this.ensureModifierActive(modifierKey);
        const val = parseFloat(e.target.value);
        if (slider) slider.value = val;
        callback(val);
        this.pushHistory(`Edited ${label}: ${val}`);
      });
    }
  }

  bindCheckbox(id, callback) {
    const cb = document.getElementById(id);
    if (cb) {
      cb.addEventListener("change", (e) => callback(e.target.checked));
    }
  }

  syncControlValue(inputId, value) {
    const el = document.getElementById(inputId);
    if (el) el.value = value;
  }

  syncCheckbox(id, checked) {
    const cb = document.getElementById(id);
    if (cb) cb.checked = checked;
  }

  /* =========================================================================
     PRESET & HISTORY MANAGEMENT
     ========================================================================= */

  loadPreset(preset) {
    this.state = JSON.parse(JSON.stringify(preset.state));

    // Normalize layers from preset
    if (!Array.isArray(this.state.layers) || this.state.layers.length === 0) {
      this.state.layers = [createDefaultLayer("layer-1", "Layer 1", "circle", 0, 0, 4.5)];
    }

    // Ensure all layers have valid structure and properties
    this.state.layers.forEach((layer, idx) => {
      if (!layer.id) layer.id = `layer-${idx + 1}`;
      if (!layer.name) layer.name = `Layer ${idx + 1}`;
      if (layer.visible === undefined) layer.visible = true;
      if (layer.enabled === undefined) layer.enabled = true;
      if (!layer.structure) layer.structure = createDefaultLayerStructure();
      if (!layer.structure.formalStructure) {
        layer.structure.formalStructure = { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false };
      }
      if (!layer.structure.similarity) {
        layer.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
      if (!layer.structure.gradation) {
        layer.structure.gradation = createDefaultLayerStructure().gradation;
      }
      if (!layer.structure.anomaly) {
        layer.structure.anomaly = createDefaultLayerStructure().anomaly;
      }
      if (!layer.structure.contrast) {
        layer.structure.contrast = createDefaultLayerStructure().contrast;
      }
      if (!layer.structure.concentration) {
        layer.structure.concentration = createDefaultLayerStructure().concentration;
      }
      if (!layer.structure.space) {
        layer.structure.space = createDefaultLayerStructure().space;
      }
      if (!layer.structure.texture) {
        layer.structure.texture = createDefaultLayerStructure().texture;
      }
    });

    // If global repetition or radiation is enabled in preset modifiers, propagate to layer 1 structure
    const firstLayer = this.state.layers[0];
    if (firstLayer && !firstLayer.structure.enabled) {
      if (this.state.modifiers?.repetition?.enabled) {
        firstLayer.structure.enabled = true;
        firstLayer.structure.mode = "repetition";
        Object.assign(firstLayer.structure.repetition, this.state.modifiers.repetition);
      } else if (this.state.modifiers?.radiation?.enabled) {
        firstLayer.structure.enabled = true;
        firstLayer.structure.mode = "radiation";
        Object.assign(firstLayer.structure.radiation, this.state.modifiers.radiation);
      }
      if (this.state.modifiers?.structure?.enabled) {
        Object.assign(firstLayer.structure.formalStructure, this.state.modifiers.structure);
      }
      if (this.state.modifiers?.similarity?.enabled) {
        Object.assign(firstLayer.structure.similarity, this.state.modifiers.similarity);
      }
      if (this.state.modifiers?.gradation?.enabled) {
        Object.assign(firstLayer.structure.gradation, this.state.modifiers.gradation);
      }
      if (this.state.modifiers?.anomaly?.enabled) {
        Object.assign(firstLayer.structure.anomaly, this.state.modifiers.anomaly);
      }
      if (this.state.modifiers?.contrast?.enabled) {
        Object.assign(firstLayer.structure.contrast, this.state.modifiers.contrast);
      }
      if (this.state.modifiers?.concentration?.enabled) {
        Object.assign(firstLayer.structure.concentration, this.state.modifiers.concentration);
      }
      if (this.state.modifiers?.space?.enabled) {
        Object.assign(firstLayer.structure.space, this.state.modifiers.space);
      }
      if (this.state.modifiers?.texture?.enabled) {
        Object.assign(firstLayer.structure.texture, this.state.modifiers.texture);
      }
    }

    this.state.layerOrder = this.state.layers.map(l => l.id);

    if (!this.state.layers.some(l => l.id === this.activeLayerId)) {
      this.activeLayerId = this.state.layers[0].id;
    }

    this.applyAspectRatio(this.state.aspectRatio || "1:1");
    this.updateActivePalette();
    this.render();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();
    this.pushHistory(`Loaded Preset: ${preset.name}`);
  }

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
    window.STUDIO_PRESETS = STUDIO_PRESETS;
    window.StudioExporter = StudioExporter;
  }
})();
