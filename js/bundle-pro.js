// Standalone self-contained script for Module Studio
// Runs on both http:// (web server) and file:/// (local direct open)
(function() {
  'use strict';

  // Canvas and mathematical utilities for Wucius Wong Design Studio
const CanvasUtils = {
  // Setup crisp HiDPI canvas with deterministic logical coordinates
  // `scale` makes the drawing denser than the screen needs (the smart module editor shows a small module big and sharp)
  setupCanvas(canvas, logicalW = 600, logicalH = 600, scale = 1) {
    const dpr = (window.devicePixelRatio || 1) * scale;
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

// ---- Letters and numbers as filled outlines ----
// Copied from the design (Figma, "Module studio" shapes), not drawn as strokes: they have an area, so they fill, combine with
// other shapes and take Space and Texture like any other shape. Each glyph is `w` x `h` (the height is 100), absolute SVG path
// commands (M L H V C Z); it is drawn with its height equal to the shape's size and centred.
const GLYPHS = {
  "A": { w: 89, h: 100, d: "M15.9432 100H0L35.8236 0H53.1764L89 100H73.0568L44.9132 18.1641H44.1354L15.9432 100ZM18.6166 60.8398H70.3348V73.5352H18.6166V60.8398Z" },
  "S": { w: 72, h: 100, d: "M56.5984 26.8246C56.0945 22.3381 54.0157 18.8626 50.3622 16.3981C46.7087 13.9021 42.1102 12.654 36.5669 12.654C32.5984 12.654 29.1654 13.2859 26.2677 14.5498C23.3701 15.782 21.1181 17.4882 19.5118 19.6682C17.937 21.8167 17.1496 24.2654 17.1496 27.0142C17.1496 29.3207 17.685 31.3112 18.7559 32.9858C19.8583 34.6603 21.2913 36.0663 23.0551 37.2038C24.8504 38.3096 26.7717 39.2417 28.8189 40C30.8661 40.7267 32.8346 41.327 34.7244 41.8009L44.1732 44.2654C47.2598 45.0237 50.4252 46.0506 53.6693 47.346C56.9134 48.6414 59.9213 50.3475 62.6929 52.4645C65.4646 54.5814 67.7008 57.2038 69.4016 60.3318C71.1339 63.4597 72 67.2038 72 71.564C72 77.0616 70.5827 81.9431 67.748 86.2085C64.9449 90.4739 60.8661 93.8389 55.5118 96.3033C50.189 98.7678 43.748 100 36.189 100C28.9449 100 22.6772 98.8468 17.3858 96.5403C12.0945 94.2338 7.95276 90.9637 4.96063 86.7299C1.9685 82.4645 0.31496 77.4092 0 71.564H14.6457C14.9291 75.0711 16.063 77.9937 18.0472 80.3318C20.063 82.6382 22.6299 84.3602 25.748 85.4976C28.8976 86.6035 32.3465 87.1564 36.0945 87.1564C40.2205 87.1564 43.8898 86.5087 47.1024 85.2133C50.3465 83.8863 52.8976 82.0537 54.7559 79.7156C56.6142 77.346 57.5433 74.5814 57.5433 71.4218C57.5433 68.5466 56.7244 66.1927 55.0866 64.3602C53.4803 62.5276 51.2913 61.0111 48.5197 59.8104C45.7795 58.6098 42.6772 57.5513 39.2126 56.6351L27.7795 53.5071C20.0315 51.3902 13.8898 48.278 9.35433 44.1706C4.85039 40.0632 2.59843 34.6288 2.59843 27.8673C2.59843 22.2749 4.11024 17.3934 7.13386 13.2227C10.1575 9.05213 14.252 5.81359 19.4173 3.50711C24.5827 1.16904 30.4094 0 36.8976 0C43.4488 0 49.2283 1.15324 54.2362 3.45972C59.2756 5.7662 63.2441 8.94155 66.1417 12.9858C69.0394 16.9984 70.5512 21.6114 70.6772 26.8246H56.5984Z" },
  "R": { w: 74, h: 100, d: "M0 100V0H35.6098C43.3496 0 49.7724 1.33464 54.878 4.00391C60.0163 6.67318 63.8537 10.3678 66.3902 15.0879C68.9268 19.7754 70.1951 25.1953 70.1951 31.3477C70.1951 37.4674 68.9106 42.8548 66.3415 47.5098C63.8049 52.1322 59.9675 55.7292 54.8293 58.3008C49.7236 60.8724 43.3008 62.1582 35.561 62.1582H8.58537V49.1699H34.1951C39.0732 49.1699 43.0406 48.4701 46.0976 47.0703C49.187 45.6706 51.4471 43.6361 52.878 40.9668C54.3089 38.2975 55.0244 35.0911 55.0244 31.3477C55.0244 27.5716 54.2927 24.3001 52.8293 21.5332C51.3984 18.7663 49.1382 16.6504 46.0488 15.1856C42.9919 13.6882 38.9756 12.9395 34 12.9395H15.0732V100H0ZM49.3171 54.8828L74 100H56.8293L32.6341 54.8828H49.3171Z" },
  "1": { w: 40, h: 100, d: "M40 0V100H24.7291V15.1367H24.1379L0 30.7617V16.3086L25.1724 0H40Z" },
  "5": { w: 66, h: 100, d: "M32.1843 100C26.1727 100 20.7687 98.8439 15.9722 96.5318C11.2078 94.1875 7.40256 90.9762 4.55665 86.8979C1.71074 82.8195 0.191859 78.1631 0 72.9287H14.3894C14.7412 77.1676 16.6118 80.6519 20.0013 83.3815C23.3908 86.1111 27.4518 87.4759 32.1843 87.4759C35.9575 87.4759 39.2991 86.6089 42.2089 84.8748C45.1508 83.1085 47.4531 80.684 49.1159 77.6012C50.8106 74.5183 51.658 71.0019 51.658 67.052C51.658 63.0379 50.7946 59.4573 49.0679 56.3102C47.3412 53.1631 44.9589 50.6904 41.9212 48.8921C38.9154 47.0938 35.4619 46.1785 31.5608 46.1464C28.587 46.1464 25.5972 46.6602 22.5914 47.6879C19.5856 48.7155 17.1554 50.0642 15.3007 51.7341L1.72673 49.711L7.24267 0H61.2509V12.7649H19.5696L16.4519 40.3661H17.0275C18.9461 38.5035 21.4882 36.9461 24.6539 35.6936C27.8515 34.4412 31.273 33.815 34.9183 33.815C40.8979 33.815 46.222 35.2441 50.8906 38.1021C55.5911 40.9602 59.2844 44.8619 61.9704 49.8073C64.6884 54.7206 66.0314 60.3725 65.9994 66.763C66.0314 73.1535 64.5925 78.8536 61.6826 83.8632C58.8047 88.8728 54.8077 92.8227 49.6914 95.7129C44.6072 98.571 38.7715 100 32.1843 100Z" },
  "9": { w: 69, h: 100, d: "M33.6251 0.00200128C37.9445 0.0336873 42.2008 0.825814 46.3941 2.37838C50.5874 3.93095 54.3708 6.46575 57.7443 9.98279C61.1494 13.4998 63.8609 18.2526 65.8787 24.2411C67.928 30.1978 68.9685 37.6122 69 46.484C69 55.0072 68.1487 62.5958 66.4462 69.2497C64.7437 75.8718 62.3002 81.4642 59.1158 86.0269C55.963 90.5895 52.1323 94.0591 47.6237 96.4354C43.1151 98.8118 38.0391 100 32.3955 100C26.6258 100 21.5024 98.8593 17.0254 96.578C12.5483 94.2967 8.90678 91.144 6.10075 87.12C3.29472 83.0643 1.54489 78.4066 0.851268 73.1469H15.2755C16.2214 77.3293 18.1446 80.7197 21.0452 83.3178C23.9774 85.8843 27.7608 87.1676 32.3955 87.1676C39.4894 87.1676 45.0226 84.0624 48.9952 77.8522C52.9678 71.6102 54.9698 62.8968 55.0014 51.712H54.2447C52.6052 54.4369 50.5559 56.7816 48.0966 58.7461C45.669 60.7105 42.9417 62.2314 39.915 63.3087C36.8883 64.386 33.6566 64.9247 30.22 64.9247C24.6395 64.9247 19.5634 63.5464 14.9918 60.7898C10.4202 58.0332 6.77861 54.2468 4.06717 49.4307C1.35572 44.6145 0 39.1172 0 32.9386C0 26.7917 1.38725 21.2151 4.16175 16.2089C6.96779 11.2027 10.8773 7.24204 15.8903 4.32701C20.9349 1.3803 26.8465 -0.0613707 33.6251 0.00200128ZM33.6724 12.3592C29.9836 12.3592 26.6573 13.278 23.6936 15.1158C20.7615 16.9218 18.4441 19.3774 16.7416 22.4825C15.0391 25.556 14.1878 28.978 14.1878 32.7485C14.1878 36.519 15.0075 39.941 16.647 43.0144C18.318 46.0562 20.5881 48.4801 23.4572 50.2862C26.3578 52.0605 29.6683 52.9477 33.3886 52.9477C36.1631 52.9477 38.7485 52.4091 41.1446 51.3318C43.5408 50.2545 45.6374 48.7653 47.4345 46.8642C49.2317 44.9314 50.6347 42.7451 51.6436 40.3054C52.6525 37.8656 53.157 35.2991 53.157 32.6059C53.157 29.0255 52.3057 25.6986 50.6032 22.6251C48.9321 19.5517 46.6306 17.0802 43.6984 15.2108C40.7663 13.3097 37.4243 12.3592 33.6724 12.3592Z" }
};

const glyphCache = {};
function glyphOps(key) {
  if (glyphCache[key]) return glyphCache[key];
  const g = GLYPHS[key];
  const tokens = g.d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const nx = (x) => (x - g.w / 2) / g.h, ny = (y) => (y - g.h / 2) / g.h; // the height becomes 1, centred on the middle
  const ops = [];
  let i = 0, cx = 0, cy = 0, cmd = "";
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLHVCZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "Z") { ops.push(["Z"]); continue; }
    if (cmd === "M" || cmd === "L") { cx = num(); cy = num(); ops.push([cmd, nx(cx), ny(cy)]); if (cmd === "M") cmd = "L"; }
    else if (cmd === "H") { cx = num(); ops.push(["L", nx(cx), ny(cy)]); }
    else if (cmd === "V") { cy = num(); ops.push(["L", nx(cx), ny(cy)]); }
    else if (cmd === "C") { const a = num(), b = num(), c = num(), d = num(); cx = num(); cy = num(); ops.push(["C", nx(a), ny(b), nx(c), ny(d), nx(cx), ny(cy)]); }
  }
  glyphCache[key] = ops;
  return ops;
}

function glyphShape(key) {
  const scaled = (size) => glyphOps(key).map(([op, ...a]) => [op, ...a.map(v => v * size)]);
  return pathShape(scaled);
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
    phIcon: "moon"
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
    name: "Digit 1",
    category: "symbolic",
    ...glyphShape("1"),
    phIcon: "number-one"
  },

  digit5: {
    id: "digit5",
    name: "Digit 5",
    category: "symbolic",
    ...glyphShape("5"),
    phIcon: "number-five"
  },

  digit9: {
    id: "digit9",
    name: "Digit 9",
    category: "symbolic",
    ...glyphShape("9"),
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
    name: "Letter A",
    category: "symbolic",
    ...glyphShape("A"),
    glyph: "A"
  },

  letterS: {
    id: "letterS",
    name: "Letter S",
    category: "symbolic",
    ...glyphShape("S"),
    glyph: "S"
  },

  letterR: {
    id: "letterR",
    name: "Letter R",
    category: "symbolic",
    ...glyphShape("R"),
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
function flattenShape(shapeDef, refSize = FLAT_REF_SIZE, spacing = FLAT_SPACING) {
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
function clippedShape(shapeDef, corners, size0, strokeOnly) {
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
function resolveFigures(figures) {
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
  if (out.length < 2) return out;
  // The outlines of one shape fill by the nonzero rule (as they are drawn): those that turn the way of the biggest one are solid,
  // the others are holes. Solid ones can overlap (the bar of an A over its legs), so they are united first.
  const areas = out.map(contourArea);
  const big = areas.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0);
  const solids = out.filter((c, i) => areas[i] * big > 0), holes = out.filter((c, i) => areas[i] * big < 0);
  let region = [solids[0]];
  for (let i = 1; i < solids.length; i++) region = regionBoolean("union", region, [solids[i]]);
  if (holes.length) {
    let h = [holes[0]];
    for (let i = 1; i < holes.length; i++) h = regionBoolean("union", h, [holes[i]]);
    region = regionBoolean("subtract", region, h);
  }
  return region;
}
function compositeShape(figures, ref = 100, combine = "none") {
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
function buildTexturedGeometry(shapeDef, size, tex, seed, strokeOnly, hairsOn = strokeOnly) {
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
function texturedShape(shapeDef, tex, seed, strokeOnly, hairsOn = strokeOnly) {
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
function inRegion(region, px, py) {
  let inside = false;
  for (const c of region) {
    for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
      const a = c[i], b = c[j];
      if ((a.y > py) !== (b.y > py) && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
  }
  return inside;
}
function contourArea(c) {
  let a = 0;
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) a += (c[j].x + c[i].x) * (c[j].y - c[i].y);
  return a / 2;
}

// Area of a region produced by regionBoolean: outlines count, holes take away
function regionArea(region) {
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
function regionBoolean(op, A, B) {
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


  // Studio Composition Engine: Unified Grammar Pipeline for Wucius Wong 2D Design
const createDefaultLayerStructure = () => ({
  enabled: false,
  mode: "repetition", // "repetition" | "radiation"
  // Block: where the layout lives on the canvas, in % of the canvas. x / y is the centre of the block and w / h its
  // size (Fit to canvas and Radiation; in Actual size the block is as big as its cells, so only x / y count)
  block: { x: 50, y: 50, w: 100, h: 100 },
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
    moduleScale: "uniform", // Fit: "uniform" (Base size: every module keeps its own size, proportional to the whole canvas) or "cell" (the module shrinks with its cell)
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
    moduleScale: "uniform", // Fit: "uniform" (Base size: the same size in every cell, proportional to the whole structure) or "cell" (the module shrinks with its cell)
    raysByContainer: false, // Actual size: every ring gets as many rays as fit the container's width (not in Centripetal)
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
    steps: 1, // cycles (1 to 10)
    sequence: "restart", // restart (1-2-3-1-2-3) or pingpong (1-2-3-2-1)
    easing: 0, // -100 (starts fast, brakes) to 100 (starts slow, accelerates); the Speed slider shows it the other way round
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
    radius: 150, // 10 to 350 px
    intensity: 60, // severity, 5 to 100
    distribution: "single", // single (one epicenter), regular or random (several scattered anomalies)
    count: 5, // number of scattered anomalies (1 to 10)
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
    scaleFactor: 2, // scale multiplier for scale contrast (0.2 to 5)
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
    focusCount: 2, // hotspots: how many foci share the density (2 to 8)
    attractorX: 0.5, // 0 to 1
    attractorY: 0.5, // 0 to 1
    power: 50, // gathering pull, 10 to 100
    radius: 250, // field radius, 10 to 500 px
    lineAxis: "horizontal", // horizontal, vertical (line mode)
    alignToField: false,
    densityScale: false,
    showAttractor: false
  },
  texture: {
    enabled: false,
    jitter: 1, // px for a 100px module, 0 to 10 (shown as 0 to 100 %)
    skipChance: 10, // line skipping %, 0 to 90 (strokes only)
    crossing: 10, // random lines %, 0 to 100: share of the points of the outline that grow a hair
    hairOpacity: 85, // random lines: opacity of the hairs, 10 to 100 %
    undulation: 9, // plane wave amount, px for a 100px module, 0 to 30 (shown as 0 to 100 %)
    waves: 2, // plane wave: how many waves cross the module (1 to 6)
    waveAngle: 0 // plane wave: the direction it travels, in degrees (0 to 360)
  },
  space: {
    enabled: false,
    mode: "isometric", // isometric, foreshortening, fluctuating, conflicting (paradox)
    depthPct: 20, // extrusion depth as a % of the module size, 5 to 100
    angle: 30, // projection angle, -180 to 180
    shading: 50, // facet shading contrast, 5 to 100
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
  containerW: 100, // the module's width in px: its container, the piece of paper the shapes are placed on (it always cuts at its edge); 10 to 1000
  containerH: 100, // the module's height in px; 10 to 1000
  wireframe: true,
  strokeWidth: 1,
  color: "#18181f",
  combine: "none", // how the shapes of the module are put together: "none" (stacked), "union", "subtract", "intersect" or "xor" (exclude)
  figures: [], // smart module: the figures it is made of ({ shape, size, x, y, rotation }, as a % of the module); empty = a plain one-shape module
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
  drawShape(ctx, shapeId, size, fgColor, strokeOnly = false, lineWidth = 2, bgColor = null, isAlternating = false, skipSpace = false, spaceConfig = null, textureConfig = null, seed = 0, clipLocal = null) {
    let shapeDef = Shapes[shapeId] || Shapes.circle;
    // The module's own edge (its perimeter, as four corners in the frame the shape is drawn in): it always cuts what is drawn
    const pendingClip = clipLocal || null;
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
        waves: base.waves, waveAngle: base.waveAngle,
        skipChance: (base.skipChance || 0) * k,
        crossing: (base.crossing || 0) * k,
        hairOpacity: base.hairOpacity
      };
    }

    // The module cuts at its perimeter. When texture or space follow, the cut is made on the geometry itself, so they treat the cut module as the shape
    let hardClip = pendingClip;
    const willTexture = !!(texture && texture.enabled);
    const willSpace = !!(space && space.enabled && !skipSpace && !shapeDef.skeleton && (space.mode || "isometric") !== "foreshortening");
    if (pendingClip && (willTexture || willSpace)) {
      shapeDef = clippedShape(shapeDef, pendingClip, size, strokeOnly);
      hardClip = null;
    }

    // Texture deforms the geometry itself, so it applies before any space mode.
    if (texture && texture.enabled) {
      // Random lines also show on filled shapes, but not under a Space volume (it draws the shape many times)
      const spaceOn = !!(space && space.enabled && !skipSpace && !shapeDef.skeleton);
      shapeDef = texturedShape(shapeDef, texture, seed, strokeOnly, strokeOnly || !spaceOn);
    }

    // Open-path shapes (lines, digits...) are strokes: they stay flat.
    // No texture and no space (or a tilt): the perimeter cuts the drawing the usual way
    if (hardClip) {
      ctx.save();
      ctx.beginPath(); hardClip.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.clip();
    }
    if (!space || !space.enabled || skipSpace || shapeDef.skeleton) {
      this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
    } else {
      this.drawSpatialShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor, isAlternating, space);
    }
    if (hardClip) ctx.restore();
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
    // The depth is a share of the module; projects saved in pixels (depth) are converted when they are opened
    const depth = (size * (space.depthPct ?? 20)) / 100;
    const angleRad = ((space.angle ?? 30) * Math.PI) / 180;
    const shading = (space.shading ?? 65) / 100;

    if (mode === "foreshortening") {
      // Fig. 73b: 3D Spatial Plane Tilt (Foreshortening)
      const tiltAmount = Math.sin(angleRad) * 0.45;
      const depthSquash = Math.max(0.2, 1 - (depth / Math.max(1, size)) * 0.6);

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
      const steps = Math.max(6, Math.min(80, Math.round(depth / 3)));

      if (strokeOnly) {
        // Wireframe fluctuating prism
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = lineWidth;
        // The front face stays where the module is; the faint far end sits at the end of the extrusion
        ctx.save();
        ctx.translate(totalDx, totalDy);
        ctx.globalAlpha = 0.35;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();

        ctx.globalAlpha = 1.0;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();
      } else {
        // Volumetric shaded slices with alternating facet contrast
        ctx.save();
        ctx.fillStyle = fgColor;
        const sideAlpha = isAlternating ? (0.2 + shading * 0.35) : (0.55 - shading * 0.25);
        ctx.globalAlpha = Math.max(0.12, Math.min(0.85, sideAlpha));

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          ctx.save();
          ctx.translate(totalDx * t, totalDy * t);
          shapeDef.draw(ctx, size);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Front face, in the module's own place
        this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
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
      const steps = Math.max(8, Math.min(120, Math.round(depth / 2.2)));

      if (strokeOnly) {
        // Wireframe extrusion: the front face stays in place, the faint far end sits at the end of the extrusion
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = lineWidth;
        ctx.save();
        ctx.translate(totalDx, totalDy);
        ctx.globalAlpha = 0.35;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();

        ctx.globalAlpha = 1.0;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();
      } else {
        // Volumetric shaded extrusion body: the side is one solid tone (the figure mixed with the ground by the
        // shading), so its silhouette is clean; stacking see-through copies left a soft, lumpy edge
        ctx.save();
        const sideAlpha = 0.15 + (1 - shading * 0.7) * 0.45;
        const ground = bgColor || (this.state.invertFigureGround ? "#111111" : "#FAFAFA");
        ctx.fillStyle = this.mixHex(ground, fgColor, Math.max(0.12, Math.min(0.85, sideAlpha)));

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          ctx.save();
          ctx.translate(totalDx * t, totalDy * t);
          shapeDef.draw(ctx, size);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Architectural facet edge contour, at the far end of the extrusion
        ctx.save();
        ctx.translate(totalDx, totalDy);
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3 * shading;
        shapeDef.draw(ctx, size);
        ctx.stroke();
        ctx.restore();

        // Front face, in the module's own place
        this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
      }
    }
  }

  // A shape's own look (Stroke or Fill, colour, stroke width); what it does not set it takes from the module
  figureStyle(f, mod) {
    return { wire: f.wireframe !== undefined ? f.wireframe !== false : mod.wireframe !== false, color: f.color || mod.color, sw: f.strokeWidth || mod.strokeWidth, explicit: !!f.color };
  }

  // Records a colour change a modifier makes to a module (a mix towards a colour; 1 replaces it), so a module whose shapes have
  // their own colours can change each of them the same way
  colorOp(cell, to, t) {
    (cell.colorOps || (cell.colorOps = [])).push({ to, t });
  }

  // Draw a single shape module for an individual layer. A smart module whose shapes look different is drawn in runs of shapes that
  // look the same, in the order of the list (a combined module is one run, with the look of its base shape)
  drawSingleLayerShape(targetCtx, mod, sizeMultiplier = 1, fgColor = "#111111", bgColor = "#FAFAFA", wireframeOverride = null, shapeOverride = null, isCutout = false, colorOverride = null, widthMultiplier = null, stretch = null) {
    const ops = this.cellColorOps;
    this.cellColorOps = null;
    if (!mod || shapeOverride || !(mod.figures && mod.figures.length)) {
      return this.drawSingleLayerShapeRun(targetCtx, mod, sizeMultiplier, fgColor, bgColor, wireframeOverride, shapeOverride, isCutout, colorOverride, widthMultiplier, stretch);
    }
    let figs = resolveFigures(mod.figures).map(f => ({ ...f, relation: "free" })); // placed already: a run is not related to what is in another
    // A hidden shape is not drawn (and is not part of a combination); the others keep the places they were given
    const shown = figs.filter(f => f.visible !== false);
    if (!shown.length) return;
    if (shown.length !== figs.length) { figs = shown; mod = { ...mod, figures: shown }; }
    const combined = mod.combine && mod.combine !== "none" && figs.length > 1;
    const runs = [];
    for (const f of figs) {
      const st = this.figureStyle(f, mod);
      const last = runs[runs.length - 1];
      if (combined && last) last.figs.push(f);
      else if (last && last.st.wire === st.wire && last.st.color === st.color && last.st.sw === st.sw) last.figs.push(f);
      else runs.push({ figs: [f], st });
    }
    const plain = runs.length === 1 && !runs[0].st.explicit && runs[0].st.wire === (mod.wireframe !== false) && runs[0].st.sw === mod.strokeWidth;
    if (plain) return this.drawSingleLayerShapeRun(targetCtx, mod, sizeMultiplier, fgColor, bgColor, wireframeOverride, shapeOverride, isCutout, colorOverride, widthMultiplier, stretch);
    const imp = this.cellImperf, morph = this.cellMorph, tex = this.cellTexScale;
    for (const run of runs) {
      this.cellImperf = imp; this.cellMorph = morph; this.cellTexScale = tex;
      const mod2 = { ...mod, figures: run.figs, wireframe: run.st.wire, color: run.st.color, strokeWidth: run.st.sw };
      let ov = colorOverride;
      if (run.st.explicit) {
        if (ops && ops.length) { let c = run.st.color; for (const op of ops) c = this.mixHex(c, op.to, op.t); ov = c; }
        else ov = colorOverride || null;
      }
      this.drawSingleLayerShapeRun(targetCtx, mod2, sizeMultiplier, fgColor, bgColor, wireframeOverride, null, isCutout, ov, widthMultiplier, stretch);
    }
  }

  // One run of the above: a plain shape or one composite
  drawSingleLayerShapeRun(targetCtx, mod, sizeMultiplier = 1, fgColor = "#111111", bgColor = "#FAFAFA", wireframeOverride = null, shapeOverride = null, isCutout = false, colorOverride = null, widthMultiplier = null, stretch = null) {
    if (!mod) return;
    // A smart module (several figures) is one composite shape for everything that follows
    // Its size is its container's (the piece of paper the figures are placed on): the larger side
    const smart = !!(mod.figures && mod.figures.length);
    const cont = this.containerSize(mod, this.logicalW || 600, this.logicalH || 600);
    const ref = Math.max(cont.w, cont.h);
    const shape = shapeOverride || (smart ? compositeShape(mod.figures, ref, mod.combine).id : mod.shape) || "circle";
    const baseW = smart ? ref : (mod.width !== undefined ? mod.width : (mod.scale || 50));
    const baseH = smart ? ref : (mod.height !== undefined ? mod.height : (mod.scale || 50));
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

    // The module's perimeter (its container: the piece of paper) in the frame the shape is drawn in. It is as big as the module
    // is scaled, and it turns with the module; half the stroke is let in so a shape that fills the module is not shaved
    const theta = ((mod.rotation || 0) * Math.PI) / 180, cs = Math.cos(theta), sn = Math.sin(theta);
    const hw = (cont.w * sizeMultiplier * kx) / 2 + (wire ? strokeW / 2 : 0), hh = (cont.h * sizeMultiplier * ky) / 2 + (wire ? strokeW / 2 : 0);
    // (a module not yet opened in the editor, with one plain shape, is drawn as it always was: it does not cut)
    const clipLocal = !smart ? null : [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([px, py]) => {
      const qx = px - ox, qy = py - oy;
      return { x: (qx * cs + qy * sn) / sx, y: (-qx * sn + qy * cs) / sy };
    });

    targetCtx.save();
    targetCtx.translate(ox, oy);
    targetCtx.rotate(theta);
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
    const drawIt = () => this.drawShape(targetCtx, shape, r, layerColor, wire, strokeW, bgColor, !!this.cellAlt, isCutout, mod.structure?.space || null, mod.structure?.texture || null, seed, clipLocal);
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
    const n = Math.max(2, Math.min(8, Math.round(conc.focusCount || 2)));
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
    const radius = conc.radius ?? 250;
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
    this.colorOp(cell, grad.endColor || "#f43f5e", mix);
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

  // Block: the rectangle a layer's layout lives in. Returns the size of the "small canvas" the layout is drawn on (w, h),
  // where its origin sits on the real canvas (tx, ty) and the rectangle the layout must be cut to, in its own coordinates.
  // Fit to canvas and Radiation: the block is the small canvas. Actual size: the cells fix the size, so the small canvas
  // is the whole canvas, moved to the block's centre. The default block (centre, 100 %) is the plain canvas.
  blockFrame(struct, width, height) {
    const b = (struct && struct.block) || {};
    const bx = Number.isFinite(b.x) ? b.x : 50, by = Number.isFinite(b.y) ? b.y : 50;
    const bw = Number.isFinite(b.w) ? b.w : 100, bh = Number.isFinite(b.h) ? b.h : 100;
    const isDefault = bx === 50 && by === 50 && bw === 100 && bh === 100;
    if (isDefault) return { w: width, h: height, tx: 0, ty: 0, clip: null, isDefault: true };
    const cx = (bx / 100) * width, cy = (by / 100) * height;
    const mode = struct.mode === "radiation" ? struct.radiation : struct.repetition;
    const actual = !!mode && (mode.sizeMode === "actual" || mode.sizeMode === "fixed");
    const w = Math.max(10, (bw / 100) * width), h = Math.max(10, (bh / 100) * height);
    // The composition container is a sheet of paper: whatever the layout draws past its edge is cut
    if (actual) {
      // Actual size draws the layout on the real canvas' scale, centred in the sheet; the sheet cuts it
      const tx = cx - width / 2, ty = cy - height / 2;
      return { w: width, h: height, tx, ty, clip: [width / 2 - w / 2, height / 2 - h / 2, w, h], isDefault: false, rect: [cx - w / 2, cy - h / 2, w, h] };
    }
    return { w, h, tx: cx - w / 2, ty: cy - h / 2, clip: null, isDefault: false, rect: [cx - w / 2, cy - h / 2, w, h] };
  }

  // The rectangle a layout is cut to: its own small canvas, or (Actual size) the real canvas seen from inside the block
  layoutClipRect(margin, usableW, usableH) {
    return this.layoutClip || [margin, margin, usableW, usableH];
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
    const n = Math.max(1, Math.min(10, anom.count || 5));
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
    const severity = (anom.intensity ?? 60) / 100;
    const accent = anom.accentColor || palette.accent;

    if (anom.type === "focal") {
      if (inZone) {
        if (on("shape")) {
          cell.shape = anom.anomalousShape || "triangle";
          cell.shapeLocked = true;
        }
        if (on("rotation")) ctx.rotate((Math.PI / 4) * severity * factor);
        if (on("scale")) cell.scaleMul *= (1 + 0.35 * severity);
        if (anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; this.colorOp(cell, accent, 1); }
      }
    } else if (anom.type === "regrid") {
      // The change of grid is made by the layout itself; the zone can still be tinted
      if (inZone && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; this.colorOp(cell, accent, 1); }
    } else if (anom.type === "fracture") {
      const corridor = anom.radius * 0.45;
      if (inZone && Math.abs(ex - epiX) < corridor) {
        const jag = Math.sin(ey * 0.08) * (18 * severity);
        const shearY = (ey > epiY ? 1 : -1) * (36 * severity) + jag;
        const shearX = (ex > epiX ? 1 : -1) * (10 * severity);
        if (on("position")) ctx.translate(shearX, shearY);
        if (on("rotation")) ctx.rotate((factor * severity * Math.PI) / 3.2);
        if (factor > 0.4 && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; this.colorOp(cell, accent, 1); }
      }
    } else if (anom.type === "swell") {
      if (inZone) {
        const angle = Math.atan2(ey - epiY, ex - epiX);
        const push = Math.sin(factor * Math.PI) * (42 * severity);
        if (on("position")) ctx.translate(Math.cos(angle) * push, Math.sin(angle) * push);
        const sFactor = 1 + factor * 0.55 * severity;
        if (on("scale")) ctx.scale(sFactor, sFactor);
        if (factor > 0.65 && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; this.colorOp(cell, accent, 1); }
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
        if (anom.highlightColor && factor > 0.3) { cell.fg = accent; cell.fgLocked = true; this.colorOp(cell, accent, 1); }
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
      cell.scaleMul *= contrast.scaleFactor ?? 2;
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
      if (!cell.fgLocked && cell.fg === palette.fg) { cell.fg = this.mixHex(cell.base || cell.fg, palette.bg, (contrast.toneAmount ?? 50) / 100); this.colorOp(cell, palette.bg, (contrast.toneAmount ?? 50) / 100); }
    } else if (contrast.dimension === "texture") {
      cell.texScale = 1; // only the minority is textured
    }
    if (contrast.highlightContrast && !cell.fgLocked) {
      cell.fg = contrast.accentColor || palette.accent;
      this.colorOp(cell, cell.fg, 1);
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
    const uniform = !isFixed && rep.moduleScale !== "cell"; // Base size: modules are not scaled by their cell
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
    ctx.rect(...this.layoutClipRect(margin, usableW, usableH));
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
    this.layoutExtent = { x: colStarts[0], y: rowStarts[0], w: colEdge - colStarts[0], h: rowEdge - rowStarts[0] }; // where the grid really is (for the Block guide)

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
        const normScale = isFixed || uniform
          ? scaleUnit * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul) * k
          : scaleUnit * cellRatio * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul) * k;
        if (cell.texScale) this.cellTexScale = Math.max(this.cellTexScale || 0, cell.texScale);
        this.cellSeed = r * cols + c + 1;
        this.cellAlt = (r + c) % 2 === 1;
        // Reflection: mirror the module in alternate columns and/or rows
        const refl = rep.reflection || "none";
        if ((refl === "columns" || refl === "both") && c % 2 === 1) ctx.scale(-1, 1);
        if ((refl === "rows" || refl === "both") && r % 2 === 1) ctx.scale(1, -1);
        const lineWidthMul = !isFixed && !uniform && (cellShapeA || targetMod.shape) === "line" ? scaleUnit * (cW / usableW) * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul) * k : null;
        this.cellColorOps = cell.colorOps || null;
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
    // Fit with "uniform" module scale: every module has the same size, taken from the whole structure (as in Actual size, but the structure still fits the canvas)
    const uniform = !isFixed && rad.moduleScale !== "cell";
    const uniformK = maxR / (Math.min(usableW, usableH) * 0.5);
    this.layoutExtent = isFixed ? { x: width / 2 + (rad.centerX || 0) - maxR, y: height / 2 + (rad.centerY || 0) - maxR, w: maxR * 2, h: maxR * 2 } : null; // Fit: the block itself
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

    // Rays per ring. The Angular rays slider; or, in Actual size with "Rays follow container", the cell is the container, so every ring gets as
    // many rays as fit its circumference at the container's width (few in the middle, more outwards)
    const contWidth = Math.max(10, this.containerSize(targetMod, width, height).w);
    const raysByContainer = isFixed && !!rad.raysByContainer && rad.scheme !== "centripetal"; // the chevrons of one wedge must nest from ring to ring
    const raysOf = (i) => raysByContainer
      ? Math.max(3, Math.round((Math.PI * 2 * (openR + ((i - 0.5) / rings) * span)) / contWidth))
      : rays;

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
    ctx.rect(...this.layoutClipRect(margin, usableW, usableH));
    ctx.clip();

    const seed = sim.seed || 42;

    centers.forEach((center, centerIdx) => {
      for (let i = 1; i <= rings; i++) {
        const rInner = openR + ((i - 1) / rings) * span;
        const rOuter = openR + (i / rings) * span;
        const ringRadius = (rInner + rOuter) * 0.5;
        const ringShift = (i - 1) * ringRotRad;
        const raysI = raysOf(i); // rays of this ring (Actual size: as many as fit the container's width)

        for (let j = 0; j < raysI; j++) {
          const rayAngleStart = (j / raysI) * Math.PI * 2 + ringShift;
          const rayAngleEnd = ((j + 1) / raysI) * Math.PI * 2 + ringShift;
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
            if (rad.scheme === "centripetal") {
              // Centripetal draws nested chevrons, so the cell is the band between this ring's chevron and the one inside it:
              // two Vs with the same arms (the directions of the rays), apexes on the middle ray at rInner and rOuter
              const mid = (rayAngleStart + rayAngleEnd) * 0.5;
              const far = (ar, ang) => {
                const ax = ar * Math.cos(mid), ay = ar * Math.sin(mid), dx = Math.cos(ang), dy = Math.sin(ang);
                const dot = ax * dx + ay * dy;
                const disc = dot * dot - ar * ar + maxR * maxR;
                const t = disc > 0 ? -dot + Math.sqrt(disc) : 0;
                return [center.x + ax + dx * t, center.y + ay + dy * t];
              };
              const q0i = far(rInner, rayAngleStart), q0o = far(rOuter, rayAngleStart);
              const q1o = far(rOuter, rayAngleEnd), q1i = far(rInner, rayAngleEnd);
              ctx.moveTo(center.x + rInner * Math.cos(mid), center.y + rInner * Math.sin(mid));
              ctx.lineTo(q0i[0], q0i[1]);
              ctx.lineTo(q0o[0], q0o[1]);
              ctx.lineTo(center.x + rOuter * Math.cos(mid), center.y + rOuter * Math.sin(mid));
              ctx.lineTo(q1o[0], q1o[1]);
              ctx.lineTo(q1i[0], q1i[1]);
              ctx.closePath();
              return;
            }
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

          // Checkerboard inversion (alternate sectors, like the cells of a grid) and Contrast > Space (the minority) draw
          // the sector in the figure colour and the module in the ground colour; the two cancel out
          const spaceFlip = !!(contrast.enabled && contrast.dimension === "space" && this.isContrastMinority(contrast, centerIdx * 1000 + i * raysI + j, { a: j, b: i, x: x / width, y: y / height }));
          const checkerFlip = !!(rad.checkerInvert && (i + j) % 2 === 1);
          const flip = checkerFlip !== spaceFlip;
          const flipFill = checkerFlip ? (targetMod.color || palette.fg) : palette.fg;
          if (flip) {
            ctx.save();
            sectorPath();
            ctx.fillStyle = flipFill;
            ctx.fill();
            ctx.restore();
          }

          const pRand = (salt) => {
            const val = Math.sin(seed * 997 + (i * 100 + j + centerIdx * 1000) * 31 + salt * 101) * 10000;
            return (val - Math.floor(val)) * 2 - 1;
          };

          if (sim && sim.enabled) {
            const reach = this.jitterReach(sim, Math.min(rOuter - rInner, (Math.PI * 2 * ringRadius) / raysI));
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

          // Gradation on polar radiation (drift slides along the module's local x axis, up to ~one ring)
          if (grad.enabled) {
            this.applyGradation(ctx, grad, this.gradationPathRadial(grad, i, j, rings, raysI), (span / rings) * 0.9);
          }

          // Similarity on radiation
          if (sim.enabled) this.applySimilarity(ctx, sim, pRand);
          const simShape = sim.enabled ? this.similarityShape(sim, pRand) : null;
          this.cellImperf = sim.enabled ? this.similarityImperfection(sim, pRand) : null;

          // Anomaly & Contrast on radiation module
          const cell = { shape: simShape, wireframe: null, fg: flip ? palette.bg : palette.fg, scaleMul: 1, unit: span / rings, base: targetMod.color || palette.fg };
          if (anom.enabled && !this.applyAnomaly(ctx, anom, x, y, width, height, palette, pRand, cell)) {
            ctx.restore();
            continue;
          }
          if (contrast.enabled) this.applyContrast(ctx, contrast, centerIdx * 1000 + i * raysI + j, palette, cell, { a: j, b: i, x: x / width, y: y / height });
          this.applyGradationColor(grad, palette, cell);
          const cellShapeA = cell.shape;
          const cellWireframe = cell.wireframe;
          const cellFg = cell.fg;
          const cellBg = flip ? flipFill : palette.bg;
          const cellScaleMul = cell.scaleMul;

          // Natural centrifugal growth scale: outer modules larger, inner smaller, proportional to sector size
          const scaleUnit = MODULE_UNIT;
          const ringThickness = span / rings;
          const arcWidth = (ringRadius * 2 * Math.PI) / raysI;
          const sectorSize = Math.min(ringThickness, Math.max(ringThickness * 0.5, arcWidth));
          const sectorRatio = sectorSize / usableW;
          const growthFactor = 0.75 + (i / rings) * 0.45;
          const radScaleMul = isMultiCenter ? 0.7 : 1.0;
          const normScale = isFixed
            ? scaleUnit * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul)
            : uniform
            ? scaleUnit * uniformK * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul)
            : scaleUnit * sectorRatio * growthFactor * radScaleMul * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul);
          if (cell.texScale) this.cellTexScale = Math.max(this.cellTexScale || 0, cell.texScale);
          this.cellSeed = i * raysI + j + 1;
          this.cellAlt = (i + j) % 2 === 1;
          this.cellColorOps = cell.colorOps || null;
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
            ctx.save();
            ctx.beginPath();
            ctx.arc(center.x, center.y, maxR, 0, Math.PI * 2);
            ctx.clip();
            for (let i = 1; i <= rings; i++) {
              const r = openR + (i / rings) * span;
              const nI = raysOf(i), delta = (Math.PI * 2) / nI;
              for (let j = 0; j < nI; j++) {
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

        if (rad.showRays && raysByContainer) {
          // Rays follow the container: every ring has its own rays, so each ring draws its own pieces
          for (let i = 1; i <= rings; i++) {
            const nI = raysOf(i), shift = (i - 1) * ringRotRad;
            const ra = openR + ((i - 1) / rings) * span, rb = openR + (i / rings) * span;
            for (let j = 0; j < nI; j++) {
              const base = (j / nI) * Math.PI * 2 + shift;
              const aa = base + (rad.scheme === "spiral" ? twistRad * (ra / maxR) : 0);
              const ab = base + (rad.scheme === "spiral" ? twistRad * (rb / maxR) : 0);
              const pa = shapeR(ra, aa, shift), pb = shapeR(rb, ab, shift);
              ctx.beginPath();
              ctx.moveTo(center.x + pa * Math.cos(aa), center.y + pa * Math.sin(aa));
              ctx.lineTo(center.x + pb * Math.cos(ab), center.y + pb * Math.sin(ab));
              ctx.stroke();
            }
          }
        } else if (rad.showRays) {
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
    // The smart module editor draws on a canvas of its own: the module (its width and height), whatever the aspect ratio
    const cfg = this.state.canvasOverride || ratioMap[this.state.aspectRatio || "1:1"] || { w: 600, h: 600 };
    const { ctx, width, height } = CanvasUtils.setupCanvas(this.canvas, cfg.w, cfg.h, this.renderScale || 1);
    this.logicalW = width; this.logicalH = height; // the canvas, for the containers that are the whole canvas

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
    const blockGuides = [];
    const usesStructure = (struct) => !!(struct && (struct.enabled || (struct.formalStructure && struct.formalStructure.enabled)));
    let anyLayerStructure = false;
    for (const layerId of renderStack) {
      const mod = layers.find(l => l.id === layerId);
      if (!mod || mod.visible === false) continue;

      const layerStruct = mod.structure;
      if (usesStructure(layerStruct)) {
        anyLayerStructure = true;
        // The layout is drawn as if the block were its own small canvas, then placed on the real one
        const bf = this.blockFrame(layerStruct, width, height);
        ctx.save();
        ctx.translate(bf.tx, bf.ty);
        this.layoutClip = bf.clip;
        this.layoutExtent = null;
        if (layerStruct.mode === "radiation") {
          this.renderRadiation(ctx, bf.w, bf.h, palette, bf.isDefault ? margin : 0, bf.isDefault ? usableW : bf.w, bf.isDefault ? usableH : bf.h, mod, layerStruct.radiation);
        } else {
          this.renderRepetitionGrid(ctx, bf.w, bf.h, palette, bf.isDefault ? margin : 0, bf.isDefault ? usableW : bf.w, bf.isDefault ? usableH : bf.h, mod, layerStruct.repetition);
        }
        this.layoutClip = null;
        ctx.restore();
        // Composition container guide: the sheet the layout is cut to (an on-screen aid for the layer being edited)
        if (!this.exporting && !bf.isDefault && this.blockGuideLayerId === mod.id) blockGuides.push(bf.rect);
      } else {
        // Layer rendered as a single element centered on the canvas
        this.renderSingleLayerModule(ctx, mod, width, height, palette);
      }
    }

    if (blockGuides.length) {
      ctx.save();
      ctx.strokeStyle = this.guideColor();
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 4]);
      for (const g of blockGuides) ctx.strokeRect(g[0], g[1], g[2], g[3]);
      ctx.restore();
    }

    // The figure being edited in the smart module editor: a thin frame around it (an on-screen guide, never exported)
    if (this.state.figureBox && !this.exporting) {
      const fb = this.state.figureBox;
      const mod = this.getLayers().find(l => l.id === fb.layerId);
      if (mod) {
        ctx.save();
        ctx.translate(width / 2 + (mod.offsetX || 0), height / 2 + (mod.offsetY || 0));
        ctx.rotate(((mod.rotation || 0) * Math.PI) / 180);
        ctx.translate(fb.x || 0, fb.y || 0);
        ctx.rotate(((fb.rotation || 0) * Math.PI) / 180);
        ctx.strokeStyle = this.guideColor();
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(-fb.width / 2, -(fb.height ?? fb.width) / 2, fb.width, fb.height ?? fb.width);
        ctx.restore();
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
    const radius = conc.radius ?? 250;

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
  getTransform() { const m = this.m; return { a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] }; }
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
 * Small pieces of interface shared by every panel: the arrow keys on the value boxes and the dropdowns.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class UiHelpers {
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
}


  /**
 * Panels described as data. A panel spec lists its groups and controls; this class draws the panel, shows the state of the
 * active layer in it and listens to its controls, the same way for every panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 *
 * A spec looks like:
 *   { id, cardId, name,                      // name starts the history labels ("Space Mode: ...")
 *     state: (app) => the settings object of the active layer,
 *     enabled: { id, key, auto?, onToggle? },  // the switch of the header; every edit turns it on unless auto is false; onToggle(app, state, checked) replaces the default
 *     badgeId,                               // the layer badge in the header
 *     banner: { id, text, hidden: (mod) => bool },   // optional notice under the header
 *     top: [ controls ],                     // controls above the groups (Layout's Repetition / Radiation switch)
 *     groups: [{ title, advId?, region?, floating?, controls: [ ... ] }],
 *     regions: { id: (state) => bool },      // a group with `region` lives in a box that shows only when its test passes (Layout's two modes)
 *     syncAll: true,                         // after an edit, refresh every panel (not only this one)
 *     place: (app, state) => {} }            // called after every refresh: puts the floating groups where they belong
 * A group with `floating: "id"` is drawn in a box of that id at the end of the panel; `place` moves it.
 *
 * Controls (every one may carry `show: (state, mod) => bool`, to appear only in some cases, and `blockId`, the id of its box;
 * `get(state, app)` and `set(state, value, app)` replace the plain `key` when a setting needs more than a number):
 *   { type: "tags",   label, key, attr, history, fallback, options: [[value, text, title?], ...] }   one choice among several
 *   { type: "dropdown", label, key, attr, history, fallback, options: [[value, text, iconHtml?], ...] | "shapes" }   a list of choices ("shapes": every shape, with its icon)
 *   { type: "modes",  label, ariaLabel, attr, options: [[value, text, id], ...], get, onSelect(app, value) }   the two-button switch (a button group)
 *   { type: "chips",  label, ariaLabel, attr, options: [{ key, text, id?, show? }],            chips that switch on and off by themselves
 *       nested }  // optional { key, defaults, history }: the chips live in an object of the setting (Anomaly's attrs: on unless set to false)
 *   { type: "slider", id, label, key, min, max, step, value, suffix, history, labelId?,
 *       unit,      // what the setting stores per 1 shown (Texture shows %, stores px: unit 0.1)
 *       divisor,   // the setting stores the shown value divided by this (0 to 100 % shown, 0 to 1 stored: divisor 100)
 *       fallback,  // what the setting holds when it has no value yet (default: value)
 *       invert,    // the setting stores the opposite sign of what is shown (Gradation's speed)
 *       signed,    // shown with a + in front when positive
 *       meta,      // (state) => { label, min, max, step, suffix, history }: the slider changes its name and range with the state (Layout's grid parameter)
 *       decimal,   // the value box asks for a decimal keyboard
 *       bind,      // false: drawn only (its controller lives elsewhere)
 *       advanced } // true: the control goes in the group's "Advanced controls" accordion (the group needs advId)
 *   { type: "toggle", id, label, key, history, labelId?, title?, show? }
 *   { type: "color",  prefix, label, key, fallback, history, get?, set? }   a colour row without an on/off (Gradation's end colour, a line colour)
 *   { type: "accent", prefix, colorKey, flagKey }   the accent colour row (swatch, hex, remove); picking a colour turns the accent on
 *   { type: "stack",  id, controls: [...], show? }   a box of controls that shows or hides as one
 *   { type: "hint",   text, blockId?, show? }
 * With two or more groups (in a region: in that region), every group gets its title and a divider; with one, only the panel has a title.
 */
// The shape names the dropdowns show (a few differ from the shapes' own names)
const SHAPE_LABELS = { line: "Line", cross: "Greek Cross", wave: "Sine Wave", digit1: "Number 1", digit5: "Number 5", digit9: "Number 9" };

// Every control of a list, the boxes (stack) and what is inside them
function* walkControls(controls) {
  for (const c of controls) {
    yield c;
    if (c.type === "stack") yield* walkControls(c.controls);
  }
}

class PanelBuilder {
  // Draws the controls of every panel described as data (once, before the controllers listen to them)
  buildDataPanels() {
    for (const spec of dataPanels()) {
      const card = document.getElementById(spec.cardId);
      if (!card) continue;
      const hid = (c) => (c.show ? " hidden" : "");
      const idAttr = (c) => (c.blockId ? ` id="${c.blockId}"` : "");
      const labelIdAttr = (c) => (c.labelId ? ` id="${c.labelId}"` : "");

      // One group: its title and divider (when the panel has several), its controls and its Advanced controls
      const drawGroup = (g, i, titled) => {
        const head = titled ? `${i > 0 ? '<div class="ds-divider" role="separator"></div>\n' : ""}<div class="ds-label ds-label--overline">${g.title}</div>\n` : "";
        return head + drawControls(g.controls, g.advId);
      };
      // A list of controls; the ones marked `advanced` go in an accordion with the id advId
      const drawControls = (controls, advId) => {
        let out = "", adv = "", toggles = [];
        let target = "out";
        const add = (t) => { if (target === "adv") adv += t; else out += t; };
        const flush = () => { if (toggles.length) { add(`<div class="ds-toggles">\n${toggles.join("\n")}\n</div>\n`); toggles = []; } };
        for (const c of controls) {
          if (!!c.advanced !== (target === "adv")) { flush(); target = c.advanced ? "adv" : "out"; }
          if (c.type === "toggle") {
            toggles.push(`<label${c.labelId ? ` id="${c.labelId}"` : ""} class="ds-toggle-item${hid(c) && c.labelId ? " hidden" : ""}"${c.title ? ` title="${c.title}"` : ""}>\n<span class="ds-toggle-label">${c.label}</span>\n<input type="checkbox" id="${c.id}" class="ds-checkbox">\n</label>`);
            continue;
          }
          if (c.type === "accent") {
            const P = c.prefix;
            toggles.push(`<div class="ds-color-row" id="${P}-accent-row">\n<span class="ds-color-label">Accent color</span>\n<span class="ds-color-hex" id="${P}-accent-hex">#F43F5E</span>\n<span class="ds-swatch">\n<input type="color" id="${P}-accent-color" value="#f43f5e">\n<span class="ds-swatch-fill" id="${P}-accent-swatch"></span>\n</span>\n<button type="button" class="ds-color-clear" id="${P}-accent-clear" aria-label="Remove accent color" title="Remove accent color"><i class="ph ph-x" aria-hidden="true"></i></button>\n</div>`);
            continue;
          }
          flush();
          if (c.type === "tags") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-tags">\n${c.options.map(([v, t, title], k) => `<button type="button" class="ds-tag${k === 0 ? " active" : ""}" ${c.attr}="${v}"${title ? ` title="${title}"` : ""}>${t}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "dropdown") {
            const opts = c.options === "shapes" ? STUDIO_SHAPE_KEYS.map(k => [k, SHAPE_LABELS[k] || Shapes[k].name.replace(/\s*\([^)]*\)\s*/g, ""), shapeIconHtml(Shapes[k])]) : c.options;
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-dropdown" data-select>\n<button type="button" class="ds-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false"><span class="ds-dropdown-current">${opts[0][2] || ""}<span>${opts[0][1]}</span></span><i class="ph ph-caret-down" aria-hidden="true"></i></button>\n<div class="ds-dropdown-menu hidden" role="listbox">\n${opts.map(([v, t, icon]) => `<button type="button" class="ds-dropdown-item" role="option" ${c.attr}="${v}">${icon || ""}<span>${t}</span></button>`).join("\n")}\n</div>\n</div>\n</div>\n`);
          } else if (c.type === "modes") {
            add(`<div${idAttr(c)} class="ds-field">\n<div class="ds-label">${c.label}</div>\n<div class="ds-btn-group" role="group" aria-label="${c.ariaLabel || c.label}">\n${c.options.map(([v, t, id], k) => `<button type="button" id="${id}" class="ds-btn-group__button${k === 0 ? " active" : ""}" ${c.attr}="${v}">${t}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "color") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-color-row" id="${c.prefix}-accent-row">\n<span class="ds-color-label">${c.label}</span>\n<span class="ds-color-hex" id="${c.prefix}-accent-hex">#F43F5E</span>\n<span class="ds-swatch">\n<input type="color" id="${c.prefix}-accent-color" value="#f43f5e">\n<span class="ds-swatch-fill" id="${c.prefix}-accent-swatch"></span>\n</span>\n</div>\n</div>\n`);
          } else if (c.type === "chips") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-tags" role="group" aria-label="${c.ariaLabel || c.label}">\n${c.options.map(o => `<button type="button"${o.id ? ` id="${o.id}"` : ""} class="ds-tag${o.show ? " hidden" : ""}" ${c.attr}="${o.key}" aria-pressed="false">${o.text}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "slider") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div${labelIdAttr(c)} class="ds-label ds-label-clip">${c.label}</div>\n<div class="ds-slider">\n<input type="range" id="input-${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}">\n<input type="text" id="num-${c.id}" class="ds-value" value="${c.value}${c.suffix}" inputmode="${c.decimal ? "decimal" : "numeric"}">\n</div>\n</div>\n`);
          } else if (c.type === "stack") {
            add(`<div id="${c.id}" class="ds-stack${hid(c)}">\n${drawControls(c.controls)}</div>\n`);
          } else if (c.type === "hint") {
            add(c.blockId ? `<div id="${c.blockId}" class="ds-stack${hid(c)}"><p class="ds-hint">${c.text}</p></div>\n` : `<p class="ds-hint">${c.text}</p>\n`);
          }
        }
        flush();
        if (adv) out += `<details id="${advId}" class="ds-advanced">\n<summary><i class="ph ph-caret-down" aria-hidden="true"></i><span>Advanced controls</span></summary>\n<div class="ds-stack">\n${adv}</div>\n</details>\n`;
        return out;
      };

      let html = spec.banner ? `<div id="${spec.banner.id}" class="ds-snackbar hidden" role="status">\n<i class="ph-fill ph-warning"></i>\n<p>${spec.banner.text}</p>\n</div>\n` : "";
      if (spec.top) html += drawControls(spec.top);
      // The groups, in order; the ones of a region share a box; the floating ones go in their own box at the end
      const plain = spec.groups.filter(g => !g.floating);
      const regionOf = (g) => g.region || "";
      const countIn = (r) => plain.filter(g => regionOf(g) === r).length;
      let open = null, index = {};
      for (const g of plain) {
        const r = regionOf(g);
        if (r !== open) {
          if (open) html += "</div>\n";
          if (r) html += `<div id="${r}" class="ds-stack${spec.regions && spec.regions[r] ? " hidden" : ""}">\n`;
          open = r;
        }
        index[r] = (index[r] ?? -1) + 1;
        html += drawGroup(g, index[r], countIn(r) > 1);
      }
      if (open) html += "</div>\n";
      for (const g of spec.groups.filter(g => g.floating)) html += `<div id="${g.floating}" class="ds-stack">\n${drawGroup(g, 1, !!g.title)}</div>\n`;
      card.insertAdjacentHTML("beforeend", html);
    }
  }

  // The value a control shows
  dataValue(c, st) {
    if (c.get) return c.get(st, this);
    const raw = st[c.key] ?? c.fallback ?? c.value;
    return Math.round(c.divisor ? raw * c.divisor : raw / (c.unit || 1));
  }

  // Shows the state of the active layer in a panel described as data
  syncDataPanel(spec) {
    const mod = this.getActiveModule();
    const st = spec.state(this);
    if (!st) return;
    if (!mod && !spec.allowNoModule) return;
    const badge = document.getElementById(spec.badgeId);
    if (badge && mod) badge.textContent = this.compositionName(mod);
    const sw = document.getElementById(spec.enabled.id);
    if (sw) sw.checked = !!st[spec.enabled.key];
    if (spec.banner) document.getElementById(spec.banner.id)?.classList.toggle("hidden", !!spec.banner.hidden(mod));
    if (spec.regions) for (const [id, test] of Object.entries(spec.regions)) document.getElementById(id)?.classList.toggle("hidden", !test(st));
    const all = [...(spec.top || []), ...spec.groups.flatMap(g => g.controls)];
    for (const c of walkControls(all)) {
      // every box that shows or hides: its own box, its stack and its label
      if (c.show && c.blockId) document.getElementById(c.blockId)?.classList.toggle("hidden", !c.show(st, mod));
      if (c.type === "tags" || c.type === "dropdown") {
        const cur = c.get ? c.get(st, this) : (st[c.key] || c.fallback);
        document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(b => b.classList.toggle("active", b.getAttribute(c.attr) === cur));
      } else if (c.type === "modes") {
        const cur = c.get(st, this);
        for (const [v, , id] of c.options) document.getElementById(id)?.classList.toggle("active", v === cur);
      } else if (c.type === "accent") {
        this.syncAccentColorRow(c.prefix, st[c.colorKey], !!st[c.flagKey]);
      } else if (c.type === "color") {
        this.syncAccentColorRow(c.prefix, c.get ? c.get(st, this, mod) : (st[c.key] || c.fallback), true);
      } else if (c.type === "chips") {
        for (const o of c.options) {
          const chip = o.id ? document.getElementById(o.id) : document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`);
          if (!chip) continue;
          const on = c.nested ? (st[c.nested.key] || {})[o.key] !== false : !!st[o.key];
          chip.classList.toggle("active", on);
          chip.setAttribute("aria-pressed", String(on));
          if (o.show) chip.classList.toggle("hidden", !o.show(st, mod));
        }
      } else if (c.type === "slider" && c.bind !== false) {
        const m = c.meta ? c.meta(st) : null;
        if (c.meta) {
          const slider = document.getElementById(`input-${c.id}`);
          if (m && slider) { slider.min = m.min; slider.max = m.max; slider.step = m.step; }
          if (m && c.labelId) { const lab = document.getElementById(c.labelId); if (lab) lab.textContent = m.label; }
        }
        let v = this.dataValue(c, st);
        if (c.invert) v = v ? -v : 0;
        this.syncControlValue(`input-${c.id}`, v);
        const num = document.getElementById(`num-${c.id}`);
        if (num) num.value = `${c.signed && v > 0 ? "+" : ""}${v}${m ? m.suffix : c.suffix}`;
      } else if (c.type === "toggle") {
        this.syncCheckbox(c.id, c.get ? !!c.get(st, this) : !!st[c.key]);
        if (c.show) {
          const row = document.getElementById(c.id)?.closest("label");
          if (row) { if (c.labelId) row.classList.toggle("hidden", !c.show(st, mod)); else row.style.display = c.show(st, mod) ? "" : "none"; }
        }
      } else if (c.type === "stack" && c.show) {
        document.getElementById(c.id)?.classList.toggle("hidden", !c.show(st, mod));
      }
      if (c.type === "chips") for (const o of c.options) if (o.show && !o.id) document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`)?.classList.toggle("hidden", !o.show(st, mod));
    }
    if (spec.place) spec.place(this, st);
    this.updateRailIndicatorDots();
  }

  // Listens to the controls of a panel described as data: any edit turns the modifier on (unless the panel says no), redraws and
  // records a history step. Returns `commit(mutate, historyLabel)`, for the panels that also react to something else (a click on the canvas).
  bindDataPanel(spec) {
    const sw = document.getElementById(spec.enabled.id);
    const resync = () => (spec.syncAll ? this.syncAllInspectorsWithActiveLayer() : this.syncDataPanel(spec));
    const commit = (mutate, historyLabel, { sync = true } = {}) => {
      const st = spec.state(this);
      if (!st) return;
      mutate(st);
      if (spec.enabled.auto !== false) {
        st[spec.enabled.key] = true;
        if (sw) sw.checked = true;
      }
      if (sync) resync();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };
    sw?.addEventListener("change", (e) => {
      const st = spec.state(this);
      if (!st) return;
      if (spec.enabled.onToggle) { spec.enabled.onToggle(this, st, e.target.checked); return; }
      st[spec.enabled.key] = e.target.checked;
      resync();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} ${spec.name}: ${st[spec.enabled.key] ? "ON" : "OFF"}`);
    });
    const all = [...(spec.top || []), ...spec.groups.flatMap(g => g.controls)];
    for (const c of walkControls(all)) {
      if (c.type === "accent") {
        document.getElementById(`${c.prefix}-accent-clear`)?.addEventListener("click", () => commit(st => { st[c.flagKey] = false; }, `${spec.name} Accent: none`));
        // Picking an accent colour also turns the accent on
        const picker = document.getElementById(`${c.prefix}-accent-color`);
        picker?.addEventListener("input", (e) => commit(st => { st[c.colorKey] = e.target.value; st[c.flagKey] = true; }, null));
        picker?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} Accent: ${e.target.value.toUpperCase()}`));
      } else if (c.type === "color") {
        // a colour without an on/off does not turn the modifier on by itself; it only repaints
        const picker = document.getElementById(`${c.prefix}-accent-color`);
        picker?.addEventListener("input", (e) => {
          const st = spec.state(this);
          if (!st) return;
          if (c.set) c.set(st, e.target.value, this); else st[c.key] = e.target.value;
          this.syncAccentColorRow(c.prefix, e.target.value, true);
          this.render();
        });
        picker?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} ${c.history}: ${e.target.value.toUpperCase()}`));
      } else if (c.type === "modes") {
        for (const [v, , id] of c.options) document.getElementById(id)?.addEventListener("click", () => c.onSelect(this, v));
      } else if (c.type === "tags" || c.type === "dropdown") {
        document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(btn => {
          btn.addEventListener("click", () => {
            const v = btn.getAttribute(c.attr);
            commit(st => { if (c.set) c.set(st, v, this); else st[c.key] = v; }, `${spec.name} ${c.history}: ${v}`);
          });
        });
      } else if (c.type === "chips") {
        for (const o of c.options) {
          const chip = o.id ? document.getElementById(o.id) : document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`);
          chip?.addEventListener("click", () => {
            if (c.nested) {
              commit(st => {
                st[c.nested.key] = Object.assign({}, c.nested.defaults, st[c.nested.key]);
                st[c.nested.key][o.key] = !st[c.nested.key][o.key];
              }, `${spec.name} ${c.nested.history} ${o.key}`);
              return;
            }
            const next = chip.getAttribute("aria-pressed") !== "true";
            commit(st => { st[o.key] = next; }, `${spec.name} ${chip.textContent}: ${next ? "ON" : "OFF"}`);
          });
        }
      } else if (c.type === "slider" && c.bind !== false) {
        const slider = document.getElementById(`input-${c.id}`), num = document.getElementById(`num-${c.id}`);
        const meta = () => (c.meta ? c.meta(spec.state(this)) : null);
        const lo = () => Number(meta() ? meta().min : c.min), hi = () => Number(meta() ? meta().max : c.max);
        const suffix = () => (meta() ? meta().suffix : c.suffix);
        const step = () => Number(meta() ? meta().step : c.step);
        const label = () => (meta() ? meta().history || meta().label : c.history);
        const parse = (s) => (step() % 1 ? parseFloat(s) : parseInt(s, 10));
        const apply = (st, val) => { if (c.set) c.set(st, val, this); else st[c.key] = c.invert ? (val ? -val : 0) : c.divisor ? val / c.divisor : val * (c.unit || 1); };
        const shown = (val) => `${c.signed && val > 0 ? "+" : ""}${val}${suffix()}`;
        slider?.addEventListener("input", (e) => {
          const val = parse(e.target.value);
          commit(st => apply(st, val), null, { sync: false });
          if (num) num.value = shown(val);
        });
        slider?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} ${label()}: ${e.target.value}${suffix()}`));
        num?.addEventListener("change", (e) => {
          const raw = parse(e.target.value.replace(/[^0-9.-]/g, ""));
          let val = isNaN(raw) ? lo() : Math.max(lo(), Math.min(hi(), raw));
          if (step() % 1) val = Math.round(val * 10) / 10;
          commit(st => apply(st, val), `${spec.name} ${label()}: ${val}${suffix()}`);
        });
      } else if (c.type === "toggle") {
        document.getElementById(c.id)?.addEventListener("change", (e) => {
          const checked = e.target.checked;
          commit(st => { if (c.set) c.set(st, checked, this); else st[c.key] = checked; }, `${spec.name} ${c.history}: ${checked ? "ON" : "OFF"}`);
        });
      }
    }
    return commit;
  }
}


  /**
 * The layers panel: every layer is a composition (add, duplicate, delete, show, hide, order, the cards).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class LayersPanel {
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
    document.getElementById("btn-art-log-copy")?.addEventListener("click", () => this.copyArtLog());
    document.getElementById("btn-duplicate-layer")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.duplicateLayer();
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

  // Duplicate: a copy of the active layer with exactly the same settings, right above it and active
  duplicateLayer() {
    const layers = this.getLayers();
    if (layers.length >= 5) return;
    const source = this.getActiveModule();
    if (!source) return;

    let maxNum = 0;
    for (const l of layers) {
      const match = (l.id || "").match(/layer-(\d+)/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
    const newId = `layer-${maxNum + 1}`;
    const newName = `Layer ${maxNum + 1}`;
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = newId;
    copy.name = newName;

    layers.push(copy);
    if (!this.state.layerOrder) this.state.layerOrder = layers.map(l => l.id);
    const at = this.state.layerOrder.indexOf(source.id);
    this.state.layerOrder.splice(at < 0 ? 0 : at, 0, newId); // above the original
    this.activeLayerId = newId;

    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
    this.render();
    this.pushHistory(`Duplicated ${source.name || source.id} as ${newName}`);
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

  updateLayerCardsUI() {
    const container = document.getElementById("layers-stack-container");
    const addBtn = document.getElementById("btn-add-pattern");
    const layersCountBadge = document.getElementById("layers-count-badge");

    const layers = this.getLayers();
    const count = layers.length;

    if (layersCountBadge) layersCountBadge.textContent = `${count}`;

    for (const btn of [addBtn, document.getElementById("btn-duplicate-layer")]) {
      if (!btn) continue;
      const isMax = count >= 5;
      btn.disabled = isMax;
      btn.classList.toggle("opacity-40", isMax);
      btn.classList.toggle("cursor-not-allowed", isMax);
    }

    const activeMod = this.getActiveModule();
    const activeName = activeMod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");
    const badgeLayout = document.getElementById("badge-layout-layer");
    if (badgeLayout) badgeLayout.textContent = activeName;
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
      // the icon and the subtitle tell the layout of the composition: Repetition (a grid), Radial, or Default (no layout)
      const s = l.structure;
      const kind = s?.enabled ? (s.mode === "radiation" ? "Radial" : "Repetition") : "Default";
      const icon = `<i class="ph ph-${{ Repetition: "table", Radial: "crosshair", Default: "shapes" }[kind]}" aria-hidden="true"></i>`;
      const name = this.compositionName(l);

      return `
        <div id="layer-card-${l.id}" class="layer-card ${isActive ? 'is-active' : ''} ${!isVis ? 'is-hidden' : ''}" data-layer-id="${l.id}" draggable="true">
          <div class="layer-preview-box pointer-events-none">
            ${icon}
          </div>
          <div class="layer-copy pointer-events-none">
            <div class="layer-title">${name}</div>
            <div class="layer-subtitle">${kind}</div>
          </div>
          <div class="layer-actions">
            <button type="button" class="layer-action-btn btn-layer-eye" data-layer="${l.id}" title="Toggle Visibility" aria-label="Toggle visibility of ${name}">
              ${isVis ? '<i class="ph ph-eye" aria-hidden="true"></i>' : '<i class="ph ph-eye-slash opacity-40" aria-hidden="true"></i>'}
            </button>
            <button type="button" class="layer-action-btn btn-layer-delete ${!canDelete ? 'opacity-25 cursor-not-allowed' : ''}" data-layer="${l.id}" title="${canDelete ? 'Delete Layer' : 'Cannot delete the only layer'}" aria-label="Delete ${name}" ${!canDelete ? 'disabled' : ''}>
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
}


  /**
 * The Art log: the recipe of the design, built from the state, with Copy.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class ArtLog {
  /* =========================================================================
     ART LOG (bottom half of the layers panel)
     Built from the state: the canvas, the modules, then the active layer (its module and one line per control that is ON).
     ========================================================================= */

  // The Art log as a list of entries: { h: "Layer 2" } for a layer heading, { k, v } for a line "key: value".
  // It lists every layer, and for each active feature all its values (checks only when they are on), with the
  // units the sliders show, so it can be copied as a quick, complete recipe of the design.
  artLogEntries() {
    const title = (s) => String(s || "").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
    const pick = (map, key) => (map && map[key]) || title(key);
    const hex = (c) => String(c || "").toUpperCase();
    const layers = this.getLayers();
    const size = this.artboardSize ? `${this.artboardSize.w} × ${this.artboardSize.h} PX` : "";
    const out = [{ k: "Canvas", v: `${size} • ${layers.length} ${layers.length === 1 ? "LAYER" : "LAYERS"}` }];
    const shapeName = (id) => (Shapes[id] || Shapes.circle).name.replace(/\s*\([^)]*\)\s*/g, "");
    const shapes = layers.filter(l => l.visible !== false).map(l => shapeName(l.shape));
    if (shapes.length) out.push({ k: "Modules", v: shapes.join(" + ") });

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
    const ORIENT = { auto: "Auto", outward: "Outward", inward: "Inward", tangent: "Tangent", fixed: "Fixed" };
    const DIRS = { repeated: "Repeated", alternated: "Alternated", undefined: "Undefined" };
    const num = (n) => (Math.round(n * 100) / 100).toString();

    for (const id of (this.state.layerOrder && this.state.layerOrder.length ? this.state.layerOrder : layers.map(l => l.id))) {
      const mod = layers.find(l => l.id === id);
      const s = mod && mod.structure;
      if (!mod || !s) continue;
      out.push({ h: `${this.compositionName(mod)}${mod.id === this.activeLayerId ? " (active)" : ""}${mod.visible === false ? " (hidden)" : ""}` });

      // The module: its size (the piece of paper), the shapes drawn on it, and how they are drawn
      const fill = mod.wireframe === false;
      const smart = !!(mod.figures && mod.figures.length);
      const cw = Math.round(mod.containerW > 0 ? mod.containerW : 100), ch = Math.round(mod.containerH > 0 ? mod.containerH : 100);
      out.push({ k: "Module", v: [`${cw} x ${ch}px`, `rotation ${num(mod.rotation || 0)}º`, ...((mod.offsetX || mod.offsetY) ? [`offset ${num(mod.offsetX || 0)}, ${num(mod.offsetY || 0)}px`] : [])].join(" / ") });
      if (smart) out.push({ k: "Shapes", v: resolveFigures(mod.figures).map(f => { const look = this.engine.figureStyle(f, mod); return `${shapeName(f.shape)}${f.visible === false ? " (hidden)" : ""} ${num(f.width ?? f.size)} x ${num(f.height ?? f.width ?? f.size)}px (${num(f.x)}, ${num(f.y)}) ${num(f.rotation)}º ${look.wire ? "Stroke" : "Fill"} ${hex(look.color || "#18181F")}${look.wire ? ` ${num(look.sw || 1)}px` : ""}${f.relation === "coincident" ? " coincident" : f.relation === "distance" ? ` ${num(f.gap || 0) === "0" ? "touching" : `gap ${num(f.gap)}px`} at ${num(f.angle || 0)}º` : ""}`; }).join(" + ") });
      if (smart && mod.combine && mod.combine !== "none") out.push({ k: "Combine", v: ({ union: "Union", subtract: "Subtract", intersect: "Intersect", xor: "Exclude" })[mod.combine] || mod.combine });
      if (!smart) out.push({ k: "Shape", v: `${shapeName(mod.shape)} ${num(mod.width ?? mod.scale ?? 100)} x ${num(mod.height ?? mod.scale ?? 100)}px` });
      if (!smart) out.push({ k: "Style", v: [fill ? "Fill" : "Stroke", hex(mod.color || "#18181F"), ...(fill ? [] : [`stroke ${num(mod.strokeWidth || 1)}px`])].join(" / ") });

      // Layout
      if (s.enabled) {
        const lines = (color) => hex(color || mod.color || "#18181F");
        if (s.mode === "radiation") {
          const r = s.radiation || {};
          const actual = r.sizeMode === "actual" || r.sizeMode === "fixed";
          const byCont = actual && !!r.raysByContainer && r.scheme !== "centripetal";
          const parts = ["Radiation", pick(SCHEMES, r.scheme), byCont ? `${r.rings} rings` : `${r.rays} rays - ${r.rings} rings`, actual ? "Actual size" : r.moduleScale === "cell" ? "Fit to canvas (modules shrink with the cell)" : "Fit to canvas",
            `Orientation ${pick(ORIENT, r.orientation || "auto")}`, `Direction ${pick(DIRS, r.direction || "repeated")}`];
          if (r.scheme !== "spiral" && r.scheme !== "centripetal") parts.push(`Ring shape ${title(r.ringShape || "circle")}`);
          parts.push(`Open center ${r.centerOpen || 0}%`, `Ring rotation ${r.ringRotation || 0}º`);
          if (r.scheme === "spiral") parts.push(`Spiral twist ${r.spiralTwist ?? 45}º`);
          if (r.scheme === "multi_center") parts.push(`Centers ${r.centerCount || 2}`);
          out.push({ k: "Structure", v: parts.join(" / ") });
          if (byCont) out.push({ k: "Rays follow container", v: "on" });
          if (r.activeClipping) out.push({ k: "Clip cell", v: "on" });
          if (r.checkerInvert) out.push({ k: "Checkerboard", v: "on" });
          if (r.showRays || r.showRings) out.push({ k: "Visible lines", v: ["on", `stroke ${num(r.lineWidth || 1)}px`, lines(r.lineColor), r.showRays && r.showRings ? "rays and rings" : (r.showRays ? "rays" : "rings")].join(" / ") });
        } else {
          const r = s.repetition || {};
          const actual = r.sizeMode === "actual" || r.sizeMode === "fixed";
          const parts = ["Repetition", pick(GRIDS, r.gridType), `C${r.cols} - R${r.rows}`, actual ? "Actual size" : r.moduleScale === "cell" ? "Fit to canvas (modules shrink with the cell)" : "Fit to canvas", pick(PLACE, r.placement || "centers"), pick(MIX, r.cellMix || "none"),
            `Direction ${pick(DIRS, r.direction || "repeated")}`, `Reflection ${title(r.reflection || "none")}`];
          if (r.gridType === "sliding") parts.push(`Row offset ${Math.round((r.slideOffset ?? 0.5) * 100)}%`);
          if (r.gridType === "sheared") parts.push(`Shear angle ${r.shearAngle ?? 15}º`);
          if (r.gridType === "curved" || r.gridType === "zigzag") parts.push(`Wave amount ${r.curveAmount !== undefined ? Math.round(r.curveAmount * 100) : Math.round(((r.curveIntensity || 0) / (600 / Math.max(1, r.cols || 4))) * 100)}%`);
          if (r.gridType === "free") parts.push(`Seed ${r.freeSeed ?? 7}`);
          if ((r.placement || "centers") !== "centers") parts.push(`Intersection size ${r.interScale ?? 50}%`);
          out.push({ k: "Structure", v: parts.join(" / ") });
          if (r.activeClipping) out.push({ k: "Clip cell", v: "on" });
          if (r.checkerInvert) out.push({ k: "Checkerboard", v: "on" });
          if (r.showGridLines) out.push({ k: "Visible lines", v: ["on", `stroke ${num(r.gridLineWidth || 1.5)}px`, lines(r.lineColor), title(r.lineDirection || "both"), r.lineSpacing === "alternate" ? "alternate lines" : "all lines"].join(" / ") });
        }
        const bp = this.blockPixels(s);
        const cur = s.mode === "radiation" ? s.radiation : s.repetition;
        out.push({ k: "Composition container", v: `${bp.w} x ${bp.h}px / offset ${bp.x}, ${bp.y}px` });
      }
      const f = s.formalStructure;
      if (f && f.enabled && s.mode !== "radiation" && s.enabled) {
        out.push({ k: "Rhythm", v: [`Col B ${Math.round(100 / (f.colRatio || 1))}% of A`, `Row B ${Math.round(100 / (f.rowRatio || 1))}% of A`, `Col gradation ${f.colGrade > 0 ? "+" : ""}${f.colGrade || 0}%`, `Row gradation ${f.rowGrade > 0 ? "+" : ""}${f.rowGrade || 0}%`].join(" / ") });
      }

      // Modifiers
      const sim = s.similarity;
      if (sim && sim.enabled) {
        const jit = sim.cellJitterAmount > 0 ? `${Math.round(sim.cellJitterAmount * 100)}%` : (sim.cellJitter > 0 ? `${sim.cellJitter}px` : "0%");
        const p = [pick(KIN, sim.kinshipType), `Intensity ${sim.intensity}%`, `Jitter ${jit}`];
        p.push(sim.association && sim.association !== "none" ? `Association ${title(sim.association)} ${sim.assocMix ?? 50}%` : "Association None");
        p.push(sim.imperfection && sim.imperfection !== "none" ? `Imperfection ${title(sim.imperfection)} ${sim.imperfAmount ?? 30}%` : "Imperfection None");
        p.push(`Seed ${sim.seed ?? 42}`);
        out.push({ k: "Similarity", v: p.join(" / ") });
      }
      const g = s.gradation;
      if (g && g.enabled) {
        const p = [pick(GATTR, g.type), pick(PATH, g.pathway)];
        if (g.type === "rotation") p.push(`Range ${g.range ?? 180}º`);
        if (g.type === "shape") p.push(`to ${title(g.targetShape || "triangle")}`);
        if (g.type === "color") p.push(`to ${hex(g.endColor || "#f43f5e")}`);
        p.push(`Cycles ${g.steps || 1}`, g.sequence === "pingpong" ? "Ping-pong" : "Restart", `Speed ${g.easing ? (g.easing < 0 ? "+" : "") + (-g.easing) : 0}`);
        if (g.alternate) p.push("Alternate rows");
        if (g.reverse) p.push("Reversed");
        out.push({ k: "Gradation", v: p.join(" / ") });
      }
      const an = s.anomaly;
      if (an && an.enabled) {
        const p = [pick(ANOM, an.type), title(an.distribution || "single")];
        if ((an.distribution || "single") !== "single") p.push(`${an.count ?? 5} zones`, `Seed ${an.seed ?? 7}`);
        else p.push(`at ${Math.round((an.epicenterX ?? 0.5) * 100)}% / ${Math.round((an.epicenterY ?? 0.5) * 100)}%`);
        p.push(`Radius ${an.radius}px`);
        if (an.type !== "regrid") {
          p.push(`Severity ${an.intensity ?? 60}%`);
          const a = an.attrs || {};
          const on = ["shape", "scale", "rotation", "position"].filter(k => a[k] !== false);
          p.push(`deviates in ${on.join(", ") || "nothing"}`);
          if (a.shape !== false) p.push(`intruder ${title(an.anomalousShape || "triangle")}`);
        } else p.push(`zone grid ${title(an.zoneGrid || "sliding")}`);
        if (an.highlightColor) p.push(`accent ${hex(an.accentColor || "#f43f5e")}`);
        if (an.showReticle !== false) p.push("reticle on");
        out.push({ k: "Anomaly", v: p.join(" / ") });
      }
      const co = s.contrast;
      if (co && co.enabled) {
        const p = [pick(DIM, co.dimension), `Dominance ${co.dominanceRatio}%`, pick(SPREAD, co.spread || "scattered")];
        if (co.dimension === "scale") p.push(`${co.scaleFactor ?? 2}x`);
        if (co.dimension === "shape") p.push(`minority ${title(co.contrastShape || "cross")}`);
        if (co.dimension === "direction") p.push(`Clash angle ${co.angle ?? 45}º`);
        if (co.dimension === "tone") p.push(`Tone ${co.toneAmount ?? 50}%`);
        if (co.dimension === "position") p.push(`Shift ${co.positionShift ?? 25}% at ${co.positionAngle ?? 45}º`);
        if (co.highlightContrast) p.push(`accent ${hex(co.accentColor || "#f43f5e")}`);
        out.push({ k: "Contrast", v: p.join(" / ") });
      }
      const cn = s.concentration;
      if (cn && cn.enabled) {
        const p = [pick(CMODE, cn.mode), title(cn.method || "move")];
        if (cn.mode === "free") p.push(`${cn.focusCount ?? 2} foci`);
        p.push(`Pull ${cn.power ?? 50}%`);
        if (cn.mode !== "dense" && cn.mode !== "sparse") p.push(`Radius ${cn.radius ?? 250}px`);
        if (cn.mode === "line" || cn.mode === "line_void") p.push(`${cn.lineAxis === "vertical" ? "vertical" : "horizontal"} axis at ${Math.round(((cn.lineAxis === "vertical" ? cn.attractorX : cn.attractorY) ?? 0.5) * 100)}%`);
        else p.push(`at ${Math.round((cn.attractorX ?? 0.5) * 100)}% / ${Math.round((cn.attractorY ?? 0.5) * 100)}%`);
        if (cn.edgeFade) p.push("edge fade on");
        if (cn.alignToField) p.push("align to field on");
        if (cn.densityScale) p.push("density scale on");
        if (cn.showAttractor) p.push("attractor guide on");
        out.push({ k: "Concentration", v: p.join(" / ") });
      }
      const tx = s.texture;
      if (tx && tx.enabled) {
        out.push({ k: "Texture", v: [`Jitter ${Math.round((tx.jitter || 0) / 0.1)}%`, `Line skipping ${Math.round(tx.skipChance || 0)}%`,
          `Random lines ${Math.round(tx.crossing || 0)}% (opacity ${tx.hairOpacity ?? 85}%)`, `Plane wave ${Math.round((tx.undulation || 0) / 0.3)}% (${tx.waves ?? 2} waves, ${tx.waveAngle ?? 0}º)`].join(" / ") });
      }
      const sp = s.space;
      if (sp && sp.enabled) {
        out.push({ k: "Space", v: [title(sp.mode), `Depth ${sp.depthPct ?? 20}%`, `Angle ${sp.angle ?? 30}º`, `Shading ${sp.shading ?? 50}%`, ...(sp.showIsoGuides ? ["iso guides on"] : [])].join(" / ") });
      }
    }
    return out;
  }

  // The same entries as plain text, for Copy
  artLogText() {
    return this.artLogEntries().map(e => (e.h !== undefined ? `\n${e.h}` : `${e.k}: ${e.v}`)).join("\n").trim();
  }

  updateArtLog() {
    const box = document.getElementById("art-log-lines");
    if (!box) return;
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = this.artLogEntries().map(e => e.h !== undefined
      ? `<p class="art-log__layer">${esc(e.h)}</p>`
      : `<p><span class="art-log__key">${esc(e.k)}</span>: ${esc(e.v)}</p>`).join("");
    if (html !== this._artLogHtml) {
      this._artLogHtml = html;
      box.innerHTML = html;
    }
  }

  // The layers are shown as compositions: "Layer 2" reads "Composition 2" (a name the user typed is left as it is)
  compositionName(layer) {
    const n = layer.name || layer.id;
    return /^Layer \d+$/.test(n) ? n.replace("Layer", "Composition") : n;
  }

  copyArtLog() {
    const text = this.artLogText();
    const btn = document.getElementById("btn-art-log-copy");
    const done = () => {
      if (!btn) return;
      const icon = btn.querySelector("i");
      if (icon) { icon.className = "ph ph-check"; setTimeout(() => { icon.className = "ph ph-copy"; }, 1200); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => this.copyArtLogFallback(text, done));
    } else this.copyArtLogFallback(text, done);
  }

  copyArtLogFallback(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* the text is still selectable in the log */ }
    ta.remove();
  }
}


  /**
 * The controls rail and its flyout, and the shared Layout pieces (container, rotation).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class ControlsRail {
  /* =========================================================================
     CONTROLS RAIL & FLYOUT CONTROLLER (Abstract Studio Dock)
     ========================================================================= */

  setupControlsRail() {
    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (this.figEdit) return; // the module editor is left with Save or Cancel
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
        if (this.figEdit) return;
        this.isFlyoutOpen = false;
        this.updateRailUI();
      });
    });

    this.updateRailUI();
    this.updateRailIndicatorDots();
  }

  updateRailUI() {
    // The Module panel is the smart module editor: opening it starts an editing session, leaving it (another panel, the
    // close button) saves it
    const editing = this.isFlyoutOpen && this.activeRailTab === "module";
    if (editing && !this.figEdit) this.beginFigureEdit();
    else if (!editing && this.figEdit) this.endFigureEdit(true);
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
    // Hide modifiers and the Block frame both depend on which panel is open
    this.render();
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

  // A click on the canvas as a position inside the active layer's layout (0 to 1 of its block), which is where the
  // anomaly's focal point and the attractor live
  layoutPointFromClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
    const struct = this.getActiveLayerStructure();
    if (!struct || !struct.enabled) return { x: px, y: py };
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const bf = this.engine.blockFrame(struct, cfg.w, cfg.h);
    return { x: (px * cfg.w - bf.tx) / bf.w, y: (py * cfg.h - bf.ty) / bf.h };
  }

  // Block (Layout): where the layout lives. The sliders show pixels of the canvas (size, and offset from its centre, like
  // Module); the project keeps percentages so the block follows the canvas if its proportion changes
  blockPixels(struct) {
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const b = { x: 50, y: 50, w: 100, h: 100, ...(struct.block || {}) };
    return { w: Math.round((b.w / 100) * cfg.w), h: Math.round((b.h / 100) * cfg.h), x: Math.round(((b.x - 50) / 100) * cfg.w), y: Math.round(((b.y - 50) / 100) * cfg.h), cfg };
  }
}


  /**
 * The Layout panel (Repetition and Radiation), described as data (see panel-builder.js). The two modes are two regions of the panel; each is
 * a list of groups (Grid or Radiation, Module, Rhythm, Lines) with its Advanced controls. The Composition container and the Module
 * rotation are shared by both modes: they are floating groups that `place` moves after the Module group of the active mode.
 * Here the controls write each in its own way (the settings live in repetition, radiation, formalStructure and block), so most carry
 * their own `get` and `set`.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const GRID_ICONS = [
      ["basic", "Grid", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M8 2v18M14 2v18M2 8h18M2 14h18\"/></svg>"],
      ["curved", "Curved", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M2 5q4.5-3 9 0t9 0M2 11q4.5-3 9 0t9 0M2 17q4.5-3 9 0t9 0\"/></svg>"],
      ["sliding", "Brick", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M2 8h18M2 14h18M8 2v6M14 8v6M8 14v6\"/></svg>"],
      ["sheared", "Diagonal", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M2 10L10 2M2 18L18 2M6 20L20 6M14 20l6-6\"/></svg>"],
      ["zigzag", "Zigzag", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M2 5l4.5 3 4.5-3 4.5 3 4.5-3M2 11l4.5 3 4.5-3 4.5 3 4.5-3M2 17l4.5 3 4.5-3 4.5 3 4.5-3\"/></svg>"],
      ["triangular", "Triangular", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M11 3l8 14H3zM7 10h8\"/></svg>"],
      ["alternating", "Alternating", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M11 2v18M2 11h18\"/><path d=\"M2 2h9v9H2zM11 11h9v9h-9z\" fill=\"currentColor\" stroke=\"none\"/></svg>"],
      ["hexagonal", "Hexagonal", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M11 2l7.5 4.3v8.6L11 19.2 3.5 14.9V6.3z\"/></svg>"],
      ["free", "Free", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"currentColor\" stroke=\"none\" aria-hidden=\"true\"><circle cx=\"5\" cy=\"6\" r=\"1.8\"/><circle cx=\"14\" cy=\"4\" r=\"1.8\"/><circle cx=\"9\" cy=\"12\" r=\"1.8\"/><circle cx=\"18\" cy=\"11\" r=\"1.8\"/><circle cx=\"4\" cy=\"18\" r=\"1.8\"/><circle cx=\"14\" cy=\"18\" r=\"1.8\"/></svg>"]
];
const LAYOUT_ISRAD = (st) => st.mode === "radiation";
const LAYOUT_ACTUAL = (o) => !!o && (o.sizeMode === "actual" || o.sizeMode === "fixed");
// The settings of the Rhythm group (created when the layer has none yet)
const LAYOUT_FORMAL = (st) => (st.formalStructure ||= { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false });
const layoutClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// A setting of the Repetition (or Radiation) settings; editing it puts the layout in that mode
const repSet = (key, fix) => (st, v) => { st.repetition[key] = fix ? fix(v) : v; st.mode = "repetition"; };
const radSet = (key, fix) => (st, v) => { st.radiation[key] = fix ? fix(v) : v; st.mode = "radiation"; };
// Rhythm: any edit turns the formal structure and the layout on, and leaves Radiation
const formalSet = (key, fix) => (st, v) => {
  const f = LAYOUT_FORMAL(st);
  f[key] = fix(v); f.enabled = true; st.enabled = true;
  if (st.mode === "radiation") st.mode = "repetition";
};
const blockSet = (key) => (st, v, app) => {
  const cfg = ASPECT_RATIOS[app.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
  st.block = { x: 50, y: 50, w: 100, h: 100, ...(st.block || {}) };
  const along = key === "x" || key === "w" ? cfg.w : cfg.h;
  if (key === "w" || key === "h") st.block[key] = (Math.max(10, v) / along) * 100;
  else st.block[key] = 50 + (v / along) * 100;
};
const blockGet = (key) => (st, app) => app.blockPixels(st)[key];

const LAYOUT_PANEL = {
  id: "layout", cardId: "card-layout-structure", name: "Layout",
  state: (app) => app.getActiveLayerStructure(),
  // the layout switch does not turn on by editing; turning it off also turns off the Rhythm
  enabled: { id: "toggle-layout-structure", key: "enabled", auto: false,
    onToggle: (app, st, on) => {
      st.enabled = on;
      if (!on && st.formalStructure) st.formalStructure.enabled = false;
      app.syncAllInspectorsWithActiveLayer(); // every collective modifier shows or hides its "turn on Layout" notice
      app.render();
      app.updateLayerCardsUI();
      app.pushHistory(`Layer ${app.activeLayerId} Layout Structure: ${on ? "ON" : "OFF"}`);
    } },
  badgeId: "badge-layout-layer",
  syncAll: true,
  allowNoModule: true,
  top: [
    { type: "modes", label: "Structure mode", attr: "data-layout-mode", get: (st) => (LAYOUT_ISRAD(st) ? "radiation" : "repetition"),
      options: [["repetition", "Repetition", "btn-layout-repetition"], ["radiation", "Radiation", "btn-layout-radiation"]],
      onSelect: (app, mode) => {
        const st = app.getActiveLayerStructure();
        if (!st) return;
        st.mode = mode;
        st.enabled = true;
        if (mode === "radiation" && st.formalStructure) st.formalStructure.enabled = false;
        app.syncAllInspectorsWithActiveLayer();
        app.render();
        app.updateLayerCardsUI();
        app.pushHistory(`Layer ${app.activeLayerId} Layout Mode: ${mode}`);
      } },
  ],
  regions: { "subpanel-repetition": (st) => !LAYOUT_ISRAD(st), "subpanel-radiation": (st) => LAYOUT_ISRAD(st) },
  // The Module rotation and the Composition container sit right after the Module group of the active mode
  place: (app, st) => {
    const modAdv = document.getElementById(LAYOUT_ISRAD(st) ? "rad-adv-module" : "rep-adv-module");
    const rotEl = document.getElementById("layout-module-rotation"), blockEl = document.getElementById("layout-block");
    if (rotEl && modAdv && modAdv.previousElementSibling !== rotEl) modAdv.parentNode.insertBefore(rotEl, modAdv);
    if (blockEl && modAdv && modAdv.nextElementSibling !== blockEl) modAdv.parentNode.insertBefore(blockEl, modAdv.nextSibling);
  },
  groups: [
    // ---- Repetition ----
    { region: "subpanel-repetition", title: "Grid", advId: "rep-adv-grid", controls: [
      { type: "dropdown", label: "Grid structure variation", attr: "data-grid-var", history: "Grid Var", options: GRID_ICONS,
        get: (st) => st.repetition.gridType,
        set: (st, v) => { st.repetition.gridType = v; st.mode = "repetition"; st.enabled = true; } },
      // Parameter of the chosen variation: Brick = row offset, Diagonal = shear angle, Curved / Zigzag = wave amount, Free = seed
      { type: "slider", id: "layout-param", label: "Row offset", labelId: "rep-param-label", blockId: "rep-param-block", min: 0, max: 100, step: 1, value: 50, suffix: "%", decimal: true,
        show: (st) => !!StudioProApp.REPETITION_PARAMS[st.repetition.gridType],
        meta: (st) => { const p = StudioProApp.REPETITION_PARAMS[st.repetition.gridType]; return p ? { label: p.label, min: p.min, max: p.max, step: p.step, suffix: p.suffix, history: p.label } : null; },
        get: (st) => {
          const r = st.repetition, p = StudioProApp.REPETITION_PARAMS[r.gridType];
          if (!p) return 0;
          // A project saved in pixels (curveIntensity) is shown as a share of the cell width, without touching the file
          const legacy = p.key === "curveAmount" && r.curveAmount === undefined && r.curveIntensity !== undefined;
          return p.toUi(legacy ? Math.min(1, (r.curveIntensity || 0) / (600 / Math.max(1, r.cols || 4))) : (r[p.key] ?? 0));
        },
        set: (st, v) => { const r = st.repetition, p = StudioProApp.REPETITION_PARAMS[r.gridType]; if (!p) return; r[p.key] = p.fromUi(layoutClamp(v, p.min, p.max)); st.mode = "repetition"; } },
      { type: "slider", id: "layout-cols", label: "Columns", min: 1, max: 100, step: 1, value: 4, suffix: "", decimal: true, history: "Columns", get: (st) => st.repetition.cols || 4, set: repSet("cols") },
      { type: "slider", id: "layout-rows", label: "Rows", min: 1, max: 100, step: 1, value: 4, suffix: "", decimal: true, history: "Rows", get: (st) => st.repetition.rows || 4, set: repSet("rows") },
      { type: "dropdown", label: "Reflection", attr: "data-rep-reflect", history: "Reflection", advanced: true, options: [["none", "None"], ["columns", "Columns"], ["rows", "Rows"], ["both", "Both"]],
        get: (st) => st.repetition.reflection || "none", set: repSet("reflection") },
      { type: "dropdown", label: "Direction", attr: "data-rep-dir", history: "Direction", advanced: true, options: [["repeated", "Repeated"], ["alternated", "Alternated"], ["undefined", "Undefined"]],
        get: (st) => st.repetition.direction || "repeated", set: repSet("direction") },
    ] },
    { region: "subpanel-repetition", title: "Module", advId: "rep-adv-module", controls: [
      { type: "tags", label: "Module size", attr: "data-rep-size", history: "Module Size", options: [["fit", "Fit to canvas"], ["actual", "Actual size"]],
        get: (st) => st.repetition.sizeMode || "fit",
        set: (st, v, app) => { st.repetition.sizeMode = v; if (v === "actual") app.startContainerFromCell(st.repetition.cols, st.repetition.rows); st.mode = "repetition"; } },
      // Placement does not apply to the honeycomb; mixed sizes only to the plain and alternating grids
      { type: "tags", label: "Module placement", attr: "data-rep-place", history: "Module Placement", blockId: "rep-placement-block", show: (st) => !["hexagonal", "free"].includes(st.repetition.gridType),
        options: [["centers", "Centers"], ["intersections", "Intersections"], ["both", "Both"]], get: (st) => st.repetition.placement || "centers", set: repSet("placement") },
      { type: "tags", label: "Cell mix", attr: "data-rep-mix", history: "Cell Mix", blockId: "rep-mix-block", show: (st) => st.repetition.gridType === "basic" || st.repetition.gridType === "alternating",
        options: [["none", "None"], ["merge", "Merged"], ["divide", "Divided"]], get: (st) => st.repetition.cellMix || "none", set: repSet("cellMix") },
      { type: "slider", id: "layout-inter", label: "Intersection size", blockId: "rep-inter-block", min: 10, max: 100, step: 5, value: 50, suffix: "%", decimal: true, history: "Intersection Size",
        show: (st) => !["hexagonal", "free"].includes(st.repetition.gridType) && (st.repetition.placement || "centers") !== "centers",
        get: (st) => st.repetition.interScale ?? 50, set: repSet("interScale", (v) => layoutClamp(v, 10, 100)) },
      { type: "tags", label: "Module scale", attr: "data-rep-modscale", history: "Module Scale", advanced: true, blockId: "rep-modscale-block", show: (st) => !LAYOUT_ACTUAL(st.repetition),
        options: [["uniform", "Base size", "Every module keeps its own size, proportional to the whole canvas"], ["cell", "Shrink with cell", "The module shrinks with its cell"]],
        get: (st) => st.repetition.moduleScale || "uniform", set: repSet("moduleScale") },
      { type: "toggle", id: "chk-rep-clip", label: "Clip cell", history: "Clip cell", advanced: true, get: (st) => !!st.repetition.activeClipping, set: (st, v) => { st.repetition.activeClipping = v; } },
      { type: "toggle", id: "chk-rep-checker", label: "Checkerboard inversion", history: "Checkerboard", advanced: true, get: (st) => !!st.repetition.checkerInvert, set: (st, v) => { st.repetition.checkerInvert = v; } },
    ] },
    { region: "subpanel-repetition", title: "Rhythm", controls: [
      { type: "slider", id: "struct-col-ratio", label: "Col B size [% of A]", min: 10, max: 100, step: 5, value: 100, suffix: "%", decimal: true, history: "Col Ratio",
        get: (st) => Math.round(100 / (LAYOUT_FORMAL(st).colRatio || 1)), set: formalSet("colRatio", (v) => layoutClamp(100 / Math.max(10, v), 1, 10)) },
      { type: "slider", id: "struct-row-ratio", label: "Row B size [% of A]", min: 10, max: 100, step: 5, value: 100, suffix: "%", decimal: true, history: "Row Ratio",
        get: (st) => Math.round(100 / (LAYOUT_FORMAL(st).rowRatio || 1)), set: formalSet("rowRatio", (v) => layoutClamp(100 / Math.max(10, v), 1, 10)) },
      { type: "slider", id: "struct-col-grade", label: "Col gradation", min: -30, max: 30, step: 1, value: 0, suffix: "%", decimal: true, history: "Col Gradation",
        get: (st) => LAYOUT_FORMAL(st).colGrade || 0, set: formalSet("colGrade", (v) => layoutClamp(v, -30, 30)) },
      { type: "slider", id: "struct-row-grade", label: "Row gradation", min: -30, max: 30, step: 1, value: 0, suffix: "%", decimal: true, history: "Row Gradation",
        get: (st) => LAYOUT_FORMAL(st).rowGrade || 0, set: formalSet("rowGrade", (v) => layoutClamp(v, -30, 30)) },
    ] },
    { region: "subpanel-repetition", title: "Lines", controls: [
      { type: "toggle", id: "chk-rep-gridlines", label: "Visible lines", history: "Visible lines", get: (st) => !!st.repetition.showGridLines,
        set: (st, v) => { st.repetition.showGridLines = v; if (st.formalStructure) st.formalStructure.showGridLines = v; } },
      // Visible lines are part of the design: they have colour and width and are exported
      { type: "stack", id: "rep-lines-block", show: (st) => !!st.repetition.showGridLines, controls: [
        { type: "hint", text: "Lines are part of the design and are exported." },
        { type: "dropdown", label: "Line direction", attr: "data-rep-linedir", history: "Line Direction", options: [["both", "Both"], ["horizontal", "Horizontal"], ["vertical", "Vertical"]],
          get: (st) => st.repetition.lineDirection || "both", set: repSet("lineDirection") },
        { type: "dropdown", label: "Line spacing", attr: "data-rep-linespace", history: "Line Spacing", options: [["all", "All lines"], ["alternate", "Every other"]],
          get: (st) => st.repetition.lineSpacing || "all", set: repSet("lineSpacing") },
        { type: "slider", id: "layout-linewidth", label: "Line width", blockId: "rep-linewidth-block", min: 0.5, max: 10, step: 0.5, value: 1.5, suffix: "px", decimal: true, history: "Grid Line Width",
          get: (st) => st.repetition.gridLineWidth ?? 1.5, set: (st, v) => { st.repetition.gridLineWidth = layoutClamp(v, 0.5, 10); } },
        { type: "color", prefix: "repline", label: "Line color", history: "Line Color",
          get: (st, app, mod) => st.repetition.lineColor || mod?.color || "#18181f", set: (st, v) => { st.repetition.lineColor = v; } },
      ] },
    ] },
    // ---- Radiation ----
    { region: "subpanel-radiation", title: "Radiation", advId: "rad-adv-radiation", controls: [
      { type: "dropdown", label: "Radiation scheme", attr: "data-rad-scheme", history: "Rad Scheme", get: (st) => st.radiation.scheme,
        options: [["centrifugal", "Centrifugal"], ["centripetal", "Centripetal"], ["concentric", "Concentric"], ["spiral", "Spiral"], ["multi_center", "Multi-center"]],
        set: (st, v) => { st.radiation.scheme = v; st.mode = "radiation"; st.enabled = true; } },
      // Actual size can let every ring take as many rays as fit the container's width; then the slider has no meaning
      { type: "slider", id: "layout-rays", label: "Angular rays", blockId: "rad-rays-block", min: 3, max: 60, step: 1, value: 12, suffix: "", decimal: true, history: "Angular Rays",
        show: (st) => !(LAYOUT_ACTUAL(st.radiation) && !!st.radiation.raysByContainer && st.radiation.scheme !== "centripetal"),
        get: (st) => st.radiation.rays || 12, set: radSet("rays") },
      { type: "slider", id: "layout-rings", label: "Concentric rings", min: 2, max: 20, step: 1, value: 6, suffix: "", decimal: true, history: "Concentric Rings", get: (st) => st.radiation.rings || 6, set: radSet("rings") },
      { type: "slider", id: "layout-centers", label: "Centers", blockId: "rad-centers-block", min: 2, max: 8, step: 1, value: 2, suffix: "", decimal: true, history: "Centers", show: (st) => st.radiation.scheme === "multi_center",
        get: (st) => st.radiation.centerCount || 2, set: (st, v) => { st.radiation.centerCount = layoutClamp(Math.round(v), 2, 8); st.mode = "radiation"; } },
      { type: "slider", id: "layout-twist", label: "Spiral twist", min: -180, max: 180, step: 1, value: 45, suffix: "", decimal: true, history: "Spiral Twist",
        get: (st) => (st.radiation.spiralTwist !== undefined ? st.radiation.spiralTwist : 45), set: radSet("spiralTwist") },
      { type: "dropdown", label: "Direction", attr: "data-rad-dir", history: "Radiation Direction", advanced: true, options: [["repeated", "Repeated"], ["alternated", "Alternated"], ["undefined", "Undefined"]],
        get: (st) => st.radiation.direction || "repeated", set: radSet("direction") },
      // Polygonal rings do not apply to spirals or chevrons
      { type: "dropdown", label: "Ring shape", attr: "data-rad-shape", history: "Ring Shape", advanced: true, blockId: "rad-ringshape-block", show: (st) => st.radiation.scheme !== "spiral" && st.radiation.scheme !== "centripetal",
        options: [["circle", "Circle"], ["triangle", "Triangle"], ["square", "Square"], ["pentagon", "Pentagon"], ["hexagon", "Hexagon"], ["octagon", "Octagon"]],
        get: (st) => st.radiation.ringShape || "circle", set: radSet("ringShape") },
      { type: "slider", id: "layout-open", label: "Open center", min: 0, max: 90, step: 1, value: 0, suffix: "%", decimal: true, history: "Open Center", advanced: true, get: (st) => st.radiation.centerOpen || 0, set: radSet("centerOpen") },
      { type: "slider", id: "layout-ringrot", label: "Ring rotation", min: -90, max: 90, step: 1, value: 0, suffix: "º", decimal: true, history: "Ring Rotation", advanced: true, get: (st) => st.radiation.ringRotation || 0, set: radSet("ringRotation") },
      { type: "toggle", id: "chk-rad-raysbycont", label: "Rays follow container", history: "Rays follow container", advanced: true, labelId: "rad-raysbycont-item",
        title: "Actual size: every ring gets as many rays as fit the container's width, so the cells are as big as the container",
        show: (st) => LAYOUT_ACTUAL(st.radiation) && st.radiation.scheme !== "centripetal", get: (st) => !!st.radiation.raysByContainer, set: (st, v) => { st.radiation.raysByContainer = v; } },
    ] },
    { region: "subpanel-radiation", title: "Module", advId: "rad-adv-module", controls: [
      { type: "tags", label: "Module size", attr: "data-rad-size", history: "Radiation Module Size", options: [["fit", "Fit to canvas"], ["actual", "Actual size"]],
        get: (st) => st.radiation.sizeMode || "fit",
        set: (st, v, app) => {
          st.radiation.sizeMode = v;
          if (v === "actual") {
            // each ring starts as thick as a Fit ring
            const mod = app.getActiveModule();
            if (mod && !(mod.containerW > 0 || mod.containerH > 0)) {
              const cfg = ASPECT_RATIOS[app.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
              mod.containerH = mod.containerW = Math.round((0.5 * Math.min(cfg.w, cfg.h)) / Math.max(2, st.radiation.rings));
            }
          }
          st.mode = "radiation";
        } },
      { type: "tags", label: "Module scale", attr: "data-rad-modscale", history: "Module scale", advanced: true, blockId: "rad-modscale-block", show: (st) => !LAYOUT_ACTUAL(st.radiation),
        options: [["uniform", "Base size", "Every module keeps its own size, proportional to the whole structure"], ["cell", "Shrink with cell", "The module shrinks with its cell"]],
        get: (st) => st.radiation.moduleScale || "uniform", set: radSet("moduleScale") },
      { type: "dropdown", label: "Module orientation", attr: "data-rad-orient", history: "Module Orientation", advanced: true,
        options: [["auto", "Auto"], ["outward", "Outward"], ["inward", "Inward"], ["tangent", "Tangent"], ["fixed", "Fixed"]], get: (st) => st.radiation.orientation || "auto", set: radSet("orientation") },
      { type: "toggle", id: "chk-rad-clip", label: "Clip cell", history: "Clip cell", advanced: true, get: (st) => !!st.radiation.activeClipping, set: (st, v) => { st.radiation.activeClipping = v; } },
      { type: "toggle", id: "chk-rad-checker", label: "Checkerboard inversion", history: "Checkerboard", advanced: true, get: (st) => !!st.radiation.checkerInvert, set: (st, v) => { st.radiation.checkerInvert = v; } },
    ] },
    { region: "subpanel-radiation", title: "Lines", controls: [
      { type: "toggle", id: "chk-rad-gridlines", label: "Visible lines", history: "Visible lines", get: (st) => !!(st.radiation.showRays || st.radiation.showRings),
        set: (st, v) => { st.radiation.showRays = v; st.radiation.showRings = v; } },
      { type: "stack", id: "rad-lines-block", show: (st) => !!(st.radiation.showRays || st.radiation.showRings), controls: [
        { type: "hint", text: "Lines are part of the design and are exported." },
        { type: "slider", id: "layout-radline", label: "Line width", blockId: "rad-linewidth-block", min: 0.5, max: 10, step: 0.5, value: 1, suffix: "px", decimal: true, history: "Radiation Line Width",
          get: (st) => st.radiation.lineWidth ?? 1, set: (st, v) => { st.radiation.lineWidth = layoutClamp(v, 0.5, 10); } },
        { type: "color", prefix: "radline", label: "Line color", history: "Radiation Line Color",
          get: (st, app, mod) => st.radiation.lineColor || mod?.color || "#18181f", set: (st, v) => { st.radiation.lineColor = v; } },
      ] },
    ] },
    // ---- Shared by both modes (placed after the Module group of the active mode) ----
    { floating: "layout-module-rotation", controls: [
      // the Module rotation is controlled with the rest of the module (the shape inspector)
      { type: "slider", id: "active-rotation", label: "Module rotation", min: 0, max: 360, step: 0.5, value: 0, suffix: "º", decimal: true, bind: false },
    ] },
    { floating: "layout-block", title: "Composition container", controls: [
      // the container's size and offset, in px of the canvas; the project keeps percentages so it follows the canvas if its proportion changes
      { type: "stack", id: "block-size-fields", controls: [
        { type: "slider", id: "block-w", label: "Composition container width", min: 10, max: 2000, step: 1, value: 600, suffix: "px", decimal: true, history: "Container Width", get: blockGet("w"), set: blockSet("w") },
        { type: "slider", id: "block-h", label: "Composition container height", min: 10, max: 2000, step: 1, value: 600, suffix: "px", decimal: true, history: "Container Height", get: blockGet("h"), set: blockSet("h") },
      ] },
      { type: "slider", id: "block-x", label: "Composition container offset X", min: -1000, max: 1000, step: 1, value: 0, suffix: "px", decimal: true, history: "Container Offset X", get: blockGet("x"), set: blockSet("x") },
      { type: "slider", id: "block-y", label: "Composition container offset Y", min: -1000, max: 1000, step: 1, value: 0, suffix: "px", decimal: true, history: "Container Offset Y", get: blockGet("y"), set: blockSet("y") },
    ] },
  ],
};

class PanelLayout {
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
    if (!mod || mod.containerW > 0 || mod.containerH > 0) return; // only the old "whole canvas" container (0) starts from the cell
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    mod.containerW = Math.round(cfg.w / Math.max(1, cols));
    mod.containerH = Math.round(cfg.h / Math.max(1, rows));
  }

  syncStructureInspectorWithActiveLayer() { this.syncDataPanel(LAYOUT_PANEL); }

  setupLayoutStructure() { this.bindDataPanel(LAYOUT_PANEL); }
}


  /**
 * The Similarity panel, described as data (see panel-builder.js): the Visual kinship type and the Fluctuation intensity, the
 * Association (family of shapes) with its mix, and the Imperfection (cut or broken) with its amount; in Imperfection's Advanced
 * controls, the Spatial cell jitter (stored as a share of the cell; a project saved in pixels is shown as a share without touching the file).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const SIMILARITY_PANEL = {
  id: "similarity", cardId: "card-similarity", name: "Similarity",
  // the settings object is created when the layer has none yet
  state: (app) => {
    const mod = app.getActiveModule();
    if (!mod) return null;
    if (!mod.structure) mod.structure = app.getActiveLayerStructure();
    if (!mod.structure.similarity) mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
    return mod.structure.similarity;
  },
  enabled: { id: "toggle-similarity-active", key: "enabled" },
  badgeId: "badge-similarity-layer",
  banner: { id: "warning-similarity-grid", text: "Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.", hidden: (mod) => !!(mod.structure && mod.structure.enabled) },
  groups: [
    { title: "Kinship", controls: [
      { type: "dropdown", label: "Visual kinship type", key: "kinshipType", attr: "data-kinship-type", history: "Kinship Type", fallback: "distortion",
        options: [["distortion", "Elastic"], ["foreshortening", "3D tilt"], ["rotation_wobble", "Wobble"], ["scale_kinship", "Scale"], ["hybrid", "Hybrid"]] },
      { type: "slider", id: "sim-intensity", label: "Fluctuation intensity", key: "intensity", min: 0, max: 100, step: 1, value: 50, suffix: "%", decimal: true, history: "Intensity" },
    ] },
    { title: "Association", controls: [
      { type: "dropdown", label: "Association (family of shapes)", key: "association", attr: "data-sim-assoc", history: "Association", fallback: "none",
        options: [["none", "None"], ["round", "Round"], ["angular", "Angular"], ["lines", "Lines"], ["characters", "Characters"]] },
      { type: "slider", id: "sim-assoc-mix", label: "Association mix", key: "assocMix", min: 0, max: 100, step: 1, value: 50, suffix: "%", decimal: true, history: "Association Mix", blockId: "sim-assoc-block", show: (st) => (st.association || "none") !== "none" },
    ] },
    { title: "Imperfection", advId: "sim-adv-imperf", controls: [
      { type: "dropdown", label: "Imperfection", key: "imperfection", attr: "data-sim-imperf", history: "Imperfection", fallback: "none",
        options: [["none", "None"], ["cut", "Cut"], ["broken", "Broken"]] },
      { type: "slider", id: "sim-imperf-amount", label: "Imperfect modules", key: "imperfAmount", min: 0, max: 100, step: 1, value: 30, suffix: "%", decimal: true, history: "Imperfect Modules", blockId: "sim-imperf-block", show: (st) => (st.imperfection || "none") !== "none" },
      { type: "slider", id: "sim-jitter", label: "Spatial cell jitter", min: 0, max: 90, step: 1, value: 0, suffix: "%", decimal: true, history: "Cell Jitter", advanced: true,
        get: (st, app) => (st.cellJitterAmount > 0 ? Math.round(st.cellJitterAmount * 100)
          : Math.min(90, Math.round(((st.cellJitter || 0) / (300 / Math.max(1, app.getActiveLayerStructure()?.repetition?.cols || 4))) * 100))),
        set: (st, v) => { st.cellJitterAmount = Math.max(0, Math.min(90, v)) / 100; st.cellJitter = 0; } },
    ] },
  ],
};

class PanelSimilarity {
  syncSimilarityInspectorWithActiveLayer() { this.syncDataPanel(SIMILARITY_PANEL); }

  setupSimilarity() { this.bindDataPanel(SIMILARITY_PANEL); }
}


  /**
 * Accessible names and states for every control.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class Accessibility {
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
}


  /**
 * The Gradation panel, described as data (see panel-builder.js): the Attribute that changes along the path (Rotate, Scale, Depth, Drift,
 * Shape, Texture, Color), the Pathway direction, Range and Cycles, and in each group's Advanced controls the Sequence, the checkboxes and
 * the Speed. Also holds the guide and accent colour helpers it shares with other panels.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const GRADATION_PANEL = {
  id: "gradation", cardId: "card-gradation", name: "Gradation",
  state: (app) => app.getActiveGradation(),
  enabled: { id: "toggle-gradation-active", key: "enabled" },
  badgeId: "badge-gradation-layer",
  banner: { id: "warning-gradation-grid", text: "Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Attribute", controls: [
      { type: "dropdown", label: "Attribute", key: "type", attr: "data-grad-type", history: "Attribute",
        options: [["rotation", "Rotate"], ["scale", "Scale"], ["depth", "Depth"], ["drift", "Drift"], ["shape", "Shape"], ["texture", "Texture"], ["color", "Color"]] },
      { type: "color", prefix: "grad", label: "End color", key: "endColor", fallback: "#f43f5e", history: "End Color", blockId: "grad-color-block", show: (st) => st.type === "color" },
      { type: "dropdown", label: "Becomes", key: "targetShape", attr: "data-grad-target", history: "Becomes", fallback: "triangle", options: "shapes", blockId: "grad-target-block", show: (st) => st.type === "shape" },
    ] },
    { title: "Path", advId: "grad-adv-path", controls: [
      { type: "dropdown", label: "Pathway direction", key: "pathway", attr: "data-grad-pathway", history: "Pathway",
        options: [["diagonal", "Diagonal"], ["horizontal", "Horizontal"], ["vertical", "Vertical"], ["concentric", "Concentric"], ["zigzag", "Zigzag"]] },
      { type: "dropdown", label: "Sequence", key: "sequence", attr: "data-grad-sequence", history: "Sequence", fallback: "restart", advanced: true,
        options: [["restart", "Restart"], ["pingpong", "Ping-pong"]] },
      // Alternate rows has nothing to do on the snake path, which already runs back and forth
      { type: "toggle", id: "toggle-grad-alternate", label: "Alternate rows", key: "alternate", history: "Alternate", advanced: true, show: (st) => st.pathway !== "zigzag" },
      { type: "toggle", id: "toggle-grad-reverse", label: "Reverse Gradient Direction", key: "reverse", history: "Reverse", advanced: true },
    ] },
    { title: "Progression", advId: "grad-adv-prog", controls: [
      { type: "slider", id: "grad-range", label: "Range", key: "range", min: 5, max: 360, step: 5, value: 180, suffix: "º", history: "Range" },
      { type: "slider", id: "grad-steps", label: "Cycles", key: "steps", min: 1, max: 10, step: 1, value: 1, suffix: "", history: "Cycles" },
      // Speed is shown the other way round from the stored easing: + reaches the full effect early, - late
      { type: "slider", id: "grad-easing", label: "Speed", key: "easing", min: -100, max: 100, step: 5, value: 0, suffix: "", invert: true, signed: true, history: "Speed", advanced: true },
    ] },
  ],
};

class PanelGradation {
  getActiveGradation() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.gradation : null;
  }

  syncGradationInspectorWithActiveLayer() { this.syncDataPanel(GRADATION_PANEL); }

  setupGradation() { this.bindDataPanel(GRADATION_PANEL); }

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
}


  /**
 * The Anomaly panel, described as data (see panel-builder.js): the Type (Focal, Rupture, Swell, Void, Another grid), where and how the
 * anomaly is spread, what it deviates in, its focal intruder shape, Radius, Severity, the accent colour and the focal point reticle.
 * Each type and distribution only shows the controls it needs. Clicking the canvas while the Anomaly tab is open sets the focal point.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const ANOMALY_PANEL = {
  id: "anomaly", cardId: "card-anomaly", name: "Anomaly",
  state: (app) => app.getActiveAnomaly(),
  enabled: { id: "toggle-anomaly-active", key: "enabled" },
  badgeId: "badge-anomaly-layer",
  banner: { id: "warning-anomaly-grid", text: "Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Anomaly", controls: [
      { type: "tags", label: "Type", key: "type", attr: "data-anom-type", history: "Type",
        options: [["focal", "Focal"], ["fracture", "Rupture"], ["swell", "Swell"], ["tear", "Void"], ["regrid", "Another grid"]] },
      // "Another grid": the zone only needs its grid variation, position and radius
      { type: "dropdown", label: "Grid inside the zone", key: "zoneGrid", attr: "data-anom-zonegrid", history: "Zone Grid", fallback: "sliding", blockId: "anom-zonegrid-block", show: (st) => st.type === "regrid",
        options: [["sliding", "Brick"], ["sheared", "Diagonal"], ["curved", "Curved"], ["zigzag", "Zigzag"], ["triangular", "Triangular"], ["alternating", "Alternating"]] },
    ] },
    { title: "Zone", controls: [
      { type: "tags", label: "Distribution", key: "distribution", attr: "data-anom-dist", history: "Distribution", fallback: "single",
        options: [["single", "Single"], ["regular", "Scattered regular"], ["random", "Scattered random"]] },
      // The attributes each anomaly type can deviate in
      { type: "chips", label: "Deviates in", attr: "data-anom-attr", blockId: "anom-attrs-block", show: (st) => st.type !== "regrid",
        nested: { key: "attrs", defaults: { shape: true, scale: true, rotation: true, position: true }, history: "Deviates in" },
        options: ["shape", "scale", "rotation", "position"].map(k => ({ key: k, text: k[0].toUpperCase() + k.slice(1), show: (st) => (StudioProApp.ANOMALY_ATTRS[st.type] || []).includes(k) })) },
      { type: "dropdown", label: "Focal Intruder Shape", key: "anomalousShape", attr: "data-anom-shape", history: "Shape", options: "shapes", blockId: "anom-shape-block",
        show: (st) => st.type === "focal" && (st.attrs || {}).shape !== false },
      { type: "hint", text: "Click anywhere on the canvas to set focal point", blockId: "anom-position-block", show: (st) => (st.distribution || "single") === "single" },
      { type: "slider", id: "anom-count", label: "Count", key: "count", min: 1, max: 10, step: 1, value: 5, suffix: "", history: "Count", blockId: "anom-count-block", show: (st) => (st.distribution || "single") !== "single" },
      { type: "slider", id: "anom-seed", label: "Seed", key: "seed", min: 1, max: 99, step: 1, value: 7, suffix: "", history: "Seed", blockId: "anom-seed-block", show: (st) => st.distribution === "random" },
      { type: "slider", id: "anom-radius", label: "Radius", key: "radius", min: 10, max: 350, step: 5, value: 150, suffix: "px", history: "Radius" },
      { type: "slider", id: "anom-intensity", label: "Severity", key: "intensity", min: 5, max: 100, step: 1, value: 60, suffix: "%", history: "Severity", blockId: "anom-severity-block", show: (st) => st.type !== "regrid" },
      { type: "accent", prefix: "anom", colorKey: "accentColor", flagKey: "highlightColor" },
      { type: "toggle", id: "toggle-anom-reticle", label: "Show focal point", key: "showReticle", history: "Reticle" },
    ] },
  ],
};

class PanelAnomaly {
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

  syncAnomalyInspectorWithActiveLayer() { this.syncDataPanel(ANOMALY_PANEL); }

  setupAnomaly() {
    const commit = this.bindDataPanel(ANOMALY_PANEL);
    // Click on the canvas sets the focal point while the Anomaly tab is open.
    this.canvas?.addEventListener("click", (e) => {
      if (!this.isFlyoutOpen || this.activeRailTab !== "anomaly") return;
      if ((this.getActiveAnomaly()?.distribution || "single") !== "single") return; // scattered layouts have no single focal point
      const at = this.layoutPointFromClick(e);
      const nx = Math.max(0.1, Math.min(0.9, at.x));
      const ny = Math.max(0.1, Math.min(0.9, at.y));
      commit(a => { a.epicenterX = nx; a.epicenterY = ny; }, "Anomaly Focal Point");
    });
  }
}


  /**
 * The Contrast panel, described as data (see panel-builder.js): the Dimension the minority differs in (Scale, Shape, Angle, Position,
 * Tone, Texture, Space), how it is spread, the Dominance ratio and the values of its dimension, and the accent colour.
 * Each dimension only shows the controls that drive it.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const CONTRAST_PANEL = {
  id: "contrast", cardId: "card-contrast", name: "Contrast",
  state: (app) => app.getActiveContrast(),
  enabled: { id: "toggle-contrast-active", key: "enabled" },
  badgeId: "badge-contrast-layer",
  banner: { id: "warning-contrast-grid", text: "Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Minority", controls: [
      { type: "dropdown", label: "Dimension", key: "dimension", attr: "data-contrast-dimension", history: "Dimension",
        options: [["scale", "Scale"], ["shape", "Shape"], ["direction", "Angle"], ["position", "Position"], ["tone", "Tone"], ["texture", "Texture"], ["space", "Space"]] },
      { type: "dropdown", label: "Minority Shape", key: "contrastShape", attr: "data-contrast-shape", history: "Shape", options: "shapes", blockId: "contrast-shape-block", show: (st) => st.dimension === "shape" },
    ] },
    { title: "Proportion", controls: [
      { type: "dropdown", label: "Minority spread", key: "spread", attr: "data-contrast-spread", history: "Spread", fallback: "scattered", blockId: "contrast-spread-block",
        options: [["scattered", "Scattered"], ["balanced", "Balanced"], ["edge", "Toward the edges"], ["center", "Toward the center"]] },
      { type: "slider", id: "contrast-dominance", label: "Dominance ratio", key: "dominanceRatio", min: 50, max: 95, step: 1, value: 80, suffix: "%", decimal: true, history: "Dominance", blockId: "contrast-dominance-block" },
      { type: "slider", id: "contrast-scale", label: "Contrast Scale Multiplier", key: "scaleFactor", min: 0.2, max: 5, step: 0.1, value: 2, suffix: "x", decimal: true, history: "Scale", blockId: "contrast-scale-block", show: (st) => st.dimension === "scale" },
      { type: "slider", id: "contrast-tone", label: "Tone", key: "toneAmount", min: 0, max: 100, step: 5, value: 50, suffix: "%", decimal: true, history: "Tone", blockId: "contrast-tone-block", show: (st) => st.dimension === "tone" },
      { type: "slider", id: "contrast-shift", label: "Shift", key: "positionShift", min: 0, max: 50, step: 1, value: 25, suffix: "%", decimal: true, history: "Shift", blockId: "contrast-shift-block", show: (st) => st.dimension === "position" },
      { type: "slider", id: "contrast-shiftangle", label: "Shift direction", key: "positionAngle", min: 0, max: 360, step: 5, value: 45, suffix: "º", decimal: true, history: "Shift direction", blockId: "contrast-shiftangle-block", show: (st) => st.dimension === "position" },
      { type: "slider", id: "contrast-angle", label: "Clash Angle", key: "angle", min: 5, max: 90, step: 5, value: 45, suffix: "º", decimal: true, history: "Angle", blockId: "contrast-angle-block", show: (st) => st.dimension === "direction" },
      { type: "accent", prefix: "contrast", colorKey: "accentColor", flagKey: "highlightContrast" },
    ] },
  ],
};

class PanelContrast {
  getActiveContrast() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.contrast : null;
  }

  syncContrastInspectorWithActiveLayer() { this.syncDataPanel(CONTRAST_PANEL); }

  setupContrast() { this.bindDataPanel(CONTRAST_PANEL); }
}


  /**
 * The Concentration panel, described as data (see panel-builder.js): Structure (Point, Void, Line, Hotspots, Dense, Sparse),
 * X/Y position, Gathering pull, Field radius, field style chips, Attractor guide.
 * Clicking the canvas while the Concentration tab is open moves the attractor.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const CONC_WHOLE = (st) => st.mode === "dense" || st.mode === "sparse"; // the whole-design modes have no field radius and no absence method
const CONCENTRATION_PANEL = {
  id: "concentration", cardId: "card-concentration", name: "Concentration",
  state: (app) => app.getActiveConcentration(),
  enabled: { id: "toggle-concentration-active", key: "enabled" },
  badgeId: "badge-concentration-layer",
  banner: { id: "warning-concentration-grid", text: "Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Concentration", controls: [
      { type: "tags", label: "Structure", key: "mode", attr: "data-conc-mode", history: "Structure",
        options: [["point", "Point"], ["void", "Void"], ["line", "Line"], ["line_void", "Away from line"], ["free", "Hotspots"], ["dense", "Dense"], ["sparse", "Sparse"]] },
      { type: "tags", label: "Method", key: "method", attr: "data-conc-method", history: "Method", fallback: "move", blockId: "conc-method-block", show: (st) => !CONC_WHOLE(st),
        options: [["move", "Move"], ["absence", "Absence"]] },
      { type: "tags", label: "Line axis", key: "lineAxis", attr: "data-conc-axis", history: "Axis", blockId: "conc-axis-block", show: (st) => st.mode === "line" || st.mode === "line_void",
        options: [["horizontal", "Horizontal"], ["vertical", "Vertical"]] },
      { type: "chips", label: "Field style", attr: "data-conc-flag", options: [
        { key: "edgeFade", text: "Soft edge", id: "conc-fade-block", show: (st) => CONC_WHOLE(st) },
        { key: "alignToField", text: "Flowing" },
        { key: "densityScale", text: "Dynamic density" } ] },
      { type: "slider", id: "conc-foci", label: "Foci", key: "focusCount", min: 2, max: 8, step: 1, value: 2, suffix: "", history: "Foci", blockId: "conc-foci-block", show: (st) => st.mode === "free" },
      { type: "slider", id: "conc-x", label: "X position", key: "attractorX", min: 0, max: 100, step: 1, value: 50, suffix: "%", divisor: 100, fallback: 0.5, history: "X" },
      { type: "slider", id: "conc-y", label: "Y position", key: "attractorY", min: 0, max: 100, step: 1, value: 50, suffix: "%", divisor: 100, fallback: 0.5, history: "Y" },
      { type: "hint", text: "Click anywhere on the canvas to reposition the attractor" },
    ] },
    { title: "Strength", controls: [
      { type: "slider", id: "conc-power", label: "Gathering pull", key: "power", min: 10, max: 100, step: 1, value: 50, suffix: "%", history: "Pull" },
      { type: "slider", id: "conc-radius", label: "Field radius", key: "radius", min: 10, max: 500, step: 5, value: 250, suffix: "px", history: "Radius", blockId: "conc-radius-field", show: (st) => !CONC_WHOLE(st) },
      { type: "toggle", id: "toggle-conc-guide", label: "Display Attractor Guide", key: "showAttractor", history: "Attractor Guide" },
    ] },
  ],
};

class PanelConcentration {
  getActiveConcentration() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.concentration : null;
  }

  syncConcentrationInspectorWithActiveLayer() { this.syncDataPanel(CONCENTRATION_PANEL); }

  setupConcentration() {
    const commit = this.bindDataPanel(CONCENTRATION_PANEL);
    // Click on the canvas moves the attractor while the Concentration tab is open.
    this.canvas?.addEventListener("click", (e) => {
      if (!this.isFlyoutOpen || this.activeRailTab !== "concentration") return;
      const at = this.layoutPointFromClick(e);
      const nx = Math.max(0, Math.min(1, at.x));
      const ny = Math.max(0, Math.min(1, at.y));
      commit(c => { c.attractorX = nx; c.attractorY = ny; }, "Concentration Attractor");
    });
  }
}


  /**
 * The Space panel, described as data (see panel-builder.js): Mode (Isometric, 3D tilt, Fluctuating, Paradox), Extrusion depth,
 * Projection angle, Facet shading contrast and the 30º isometric grid lines. Autonomous modifier: no Repetition / Radiation required.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const SPACE_PANEL = {
  id: "space", cardId: "card-space", name: "Space",
  state: (app) => app.getActiveSpace(),
  enabled: { id: "toggle-space-active", key: "enabled" },
  badgeId: "badge-space-layer",
  groups: [
    { title: "Space", controls: [
      { type: "tags", label: "Mode", key: "mode", attr: "data-space-mode", history: "Mode",
        options: [["isometric", "Isometric"], ["foreshortening", "3D tilt"], ["fluctuating", "Fluctuating"], ["conflicting", "Paradox"]] },
    ] },
    { title: "Depth", controls: [
      { type: "slider", id: "space-depth", label: "Extrusion depth", key: "depthPct", min: 5, max: 100, step: 1, value: 20, suffix: "%", history: "Depth" },
      { type: "slider", id: "space-angle", label: "Projection angle", key: "angle", min: -180, max: 180, step: 1, value: 30, suffix: "º", history: "Angle" },
      { type: "slider", id: "space-shading", label: "Facet shading contrast", key: "shading", min: 5, max: 100, step: 1, value: 50, suffix: "%", history: "Shading" },
      { type: "toggle", id: "toggle-space-guides", label: "Display 30º Isometric Grid Lines", key: "showIsoGuides", history: "Iso Guides" },
    ] },
  ],
};

class PanelSpace {
  getActiveSpace() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.space : null;
  }

  syncSpaceInspectorWithActiveLayer() { this.syncDataPanel(SPACE_PANEL); }

  setupSpace() { this.bindDataPanel(SPACE_PANEL); }
}


  /**
 * The Texture panel, described as data (see panel-builder.js): geometry deformations that read as texture: Jitter, Line skipping,
 * Random lines, Plane wave. Autonomous modifier. Jitter and undulation are stored in px for a 100 px module (scaled to the real size)
 * and shown as 0 to 100 % (unit = px per 1 %). Skipping and crossing only read on strokes.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const TEXTURE_PANEL = {
  id: "texture", cardId: "card-texture", name: "Texture",
  state: (app) => app.getActiveTexture(),
  enabled: { id: "toggle-texture-active", key: "enabled" },
  badgeId: "badge-texture-layer",
  groups: [
    { title: "Irregularity", controls: [
      { type: "slider", id: "texture-jitter", label: "Jitter", key: "jitter", min: 0, max: 100, step: 1, value: 10, suffix: "%", unit: 0.1, fallback: 1, history: "Jitter" },
    ] },
    { title: "Lines", advId: "tex-adv-lines", controls: [
      { type: "slider", id: "texture-skip", label: "Line skipping", key: "skipChance", min: 0, max: 90, step: 1, value: 10, suffix: "%", history: "Line Skipping" },
      { type: "slider", id: "texture-crossing", label: "Random lines", key: "crossing", min: 0, max: 100, step: 1, value: 10, suffix: "%", history: "Random Lines" },
      { type: "slider", id: "texture-hairopacity", label: "Random lines opacity", key: "hairOpacity", min: 10, max: 100, step: 1, value: 85, suffix: "%", history: "Random Lines Opacity", advanced: true },
    ] },
    { title: "Wave", advId: "tex-adv-wave", controls: [
      { type: "slider", id: "texture-undulation", label: "Plane wave", key: "undulation", min: 0, max: 100, step: 1, value: 30, suffix: "%", unit: 0.3, fallback: 9, history: "Plane Wave" },
      { type: "slider", id: "texture-waves", label: "Waves", key: "waves", min: 1, max: 6, step: 1, value: 2, suffix: "", history: "Waves", advanced: true },
      { type: "slider", id: "texture-waveangle", label: "Wave direction", key: "waveAngle", min: 0, max: 360, step: 5, value: 0, suffix: "º", history: "Wave Direction", advanced: true },
    ] },
  ],
};

class PanelTexture {
  getActiveTexture() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.texture : null;
  }

  syncTextureInspectorWithActiveLayer() { this.syncDataPanel(TEXTURE_PANEL); }

  setupTexture() { this.bindDataPanel(TEXTURE_PANEL); }
}


  /**
 * The smart module editor (shapes list, shape style, relations, Combine) and the shape inspector.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class ModuleEditor {
  /* =========================================================================
     CONTEXTUAL SHAPE & STYLE INSPECTOR (Applies to currently active layer)
     ========================================================================= */

  // A line has a length (Width) but no Height, so the Height control is hidden for it.
  updateHeightVisibility() {
    const f = this.currentFigure();
    document.getElementById("input-fig-h")?.closest(".ds-field")?.classList.toggle("hidden", !!f && f.shape === "line");
  }

  /* =========================================================================
     SMART MODULE EDITOR (proof of concept)
     The module as several figures drawn as one shape. The editor shows only the module, big and centred,
     with Save (keep) and Cancel (go back to how it was when the editor opened).
     ========================================================================= */

  // Alternative state used only to draw while the editor is open: the layer alone, no layout and no modifiers,
  // scaled up so the figures can be seen (the figures are a % of the module, so the proportions do not change)
  stateForFigureEdit() {
    const layer = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!layer) return null;
    // The editor is a canvas of its own, the same size as the design's and at the same scale (1:1): a pixel here is a pixel there
    const off = (b) => (b ? { ...b, enabled: false } : b);
    const s = layer.structure || {};
    const view = {
      ...layer, visible: true, offsetX: 0, offsetY: 0, rotation: 0,
      structure: { ...s, enabled: false, formalStructure: off(s.formalStructure), similarity: off(s.similarity), gradation: off(s.gradation), anomaly: off(s.anomaly), contrast: off(s.contrast), concentration: off(s.concentration), texture: off(s.texture), space: off(s.space) }
    };
    const fig = this.currentFigure() ? resolveFigures(layer.figures || [])[this.figEdit.index] : null;
    return { ...this.state, layers: [view], layerOrder: [layer.id], showSafeBounds: false, figureEdit: true, canvasOverride: { w: layer.containerW, h: layer.containerH }, figureBox: fig ? { layerId: layer.id, width: fig.width, height: fig.height, x: fig.x, y: fig.y, rotation: fig.rotation } : null };
  }

  // What the style controls edit: the shape being edited in the module editor, otherwise the module itself
  styleTarget() {
    return this.figEdit ? this.currentFigure() : this.getActiveModule();
  }

  currentFigure() {
    if (!this.figEdit) return null;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    return mod && mod.figures ? mod.figures[this.figEdit.index] || null : null;
  }

  // Starts an editing session on the active layer: a copy of the module (everything but its layout and modifiers) is kept
  // so Cancel can go back to it
  beginFigureEdit() {
    const mod = this.getActiveModule();
    if (!mod) return;
    const { structure, ...own } = mod;
    const snapshot = JSON.parse(JSON.stringify(own));
    // A plain module becomes a smart one with its own shape as the first figure, at the size it had; a module saved with figures
    // as a % of itself gets them in px
    if (!mod.figures || mod.figures.length === 0) mod.figures = [{ shape: mod.shape, width: mod.width || 100, height: mod.height || mod.width || 100, x: 0, y: 0, rotation: 0 }];
    else {
      const old = Math.max(mod.width || 100, mod.height || 100);
      mod.figures = mod.figures.map(f => (f.width !== undefined ? f : { shape: f.shape, width: Math.round((f.size ?? 100) / 100 * old), height: Math.round((f.size ?? 100) / 100 * old), x: Math.round((f.x || 0) / 100 * old), y: Math.round((f.y || 0) / 100 * old), rotation: f.rotation || 0 }));
    }
    this.figEdit = { layerId: mod.id, snapshot, index: 0, steps: [], at: -1 };
    this.syncEditShell();
    this.recordFigureStep();
    this.syncFigureEditor();
  }

  // keep = true: Save; false: Cancel (goes back to how the module was when the editor opened)
  endFigureEdit(keep) {
    if (!this.figEdit) return;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    const id = this.figEdit.layerId;
    if (mod) {
      if (keep) {
        // the layer takes the shape of its first figure (for its card and for the modifiers that swap the shape)
        mod.shape = mod.figures[0] ? mod.figures[0].shape : mod.shape;
        // and the look of its base shape (for the layer card, and as what a new shape or a modifier starts from)
        if (mod.figures[0]) { const look = this.engine.figureStyle(mod.figures[0], mod); mod.wireframe = look.wire; mod.color = look.color; mod.strokeWidth = look.sw; }
      } else {
        Object.assign(mod, JSON.parse(JSON.stringify(this.figEdit.snapshot)));
      }
    }
    this.figEdit = null;
    this.syncEditShell();
    this.fitArtboard(); // back to the design's canvas (the next draw sets its size)
    if (keep) this.pushHistory(`Layer ${id} Module saved`);
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();
  }

  // The look of the app while the module is edited: the mode chip, Save and Cancel in the header, the rest of the controls waiting
  syncEditShell() {
    const on = !!this.figEdit;
    document.body.classList.toggle("is-editing-module", on);
    const chip = document.getElementById("mode-chip");
    if (chip) {
      chip.classList.toggle("ds-mode-chip--smart", on);
      const icon = chip.querySelector("i");
      if (icon) icon.className = on ? "ph ph-shapes" : "ph ph-grid-four";
      const text = document.getElementById("mode-chip-text");
      if (text) text.textContent = on ? "Smart module mode" : "Composition mode";
    }
    const select = document.getElementById("canvas-aspect-ratio");
    if (select) select.disabled = on;
    document.querySelectorAll("#controls-rail .rail-btn").forEach(b => { if (b.dataset.railTab !== "module") b.disabled = on; });
  }

  // Save / Cancel: finish the session and close the panel
  closeFigureEditor(keep) {
    this.endFigureEdit(keep);
    this.isFlyoutOpen = false;
    this.updateRailUI();
  }

  // The editor's own undo: every change is a step (the module without its layout and modifiers); Cancel goes back to the start
  figureStepState() {
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!mod) return null;
    const { structure, ...own } = mod;
    return JSON.stringify(own);
  }

  recordFigureStep() {
    if (!this.figEdit || !this.figEdit.steps) return;
    const s = this.figureStepState();
    if (s === null || s === this.figEdit.steps[this.figEdit.at]) return;
    this.figEdit.steps = this.figEdit.steps.slice(0, this.figEdit.at + 1);
    this.figEdit.steps.push(s);
    this.figEdit.at = this.figEdit.steps.length - 1;
  }

  stepFigureEdit(d) {
    const fe = this.figEdit;
    if (!fe) return;
    this.recordFigureStep(); // whatever changed since the last step becomes one, so it can be undone
    const to = fe.at + d;
    if (to < 0 || to >= fe.steps.length) return;
    const mod = this.state.layers.find(l => l.id === fe.layerId);
    if (!mod) return;
    fe.at = to;
    Object.assign(mod, JSON.parse(fe.steps[to]));
    fe.index = Math.min(fe.index, Math.max(0, mod.figures.length - 1));
    this.syncAllInspectorsWithActiveLayer();
    this.syncFigureEditor();
  }

  syncFigureEditor() {
    if (!this.figEdit) return;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!mod) return;
    const list = document.getElementById("fig-list");
    if (list) {
      // Like the layers: the shape in front is on top, the one behind everything (the base) at the bottom; each row has its icon,
      // its name, an eye, a bin and a handle to drag it
      const canDelete = mod.figures.length > 1;
      list.innerHTML = mod.figures.map((f, i) => ({ f, i })).reverse().map(({ f, i }) => {
        const def = Shapes[f.shape] || Shapes.circle;
        const shown = f.visible !== false;
        return `
        <div class="layer-card fig-row ${i === this.figEdit.index ? "is-active" : ""} ${shown ? "" : "is-hidden"}" data-fig-index="${i}" draggable="true">
          <div class="layer-preview-box pointer-events-none">${shapeIconHtml(def)}</div>
          <div class="layer-copy pointer-events-none"><div class="layer-title">${def.name || f.shape}</div></div>
          <div class="layer-actions">
            <button type="button" class="layer-action-btn btn-fig-eye" title="Show or hide the shape" aria-label="Show or hide ${def.name || f.shape}">${shown ? '<i class="ph ph-eye" aria-hidden="true"></i>' : '<i class="ph ph-eye-slash opacity-40" aria-hidden="true"></i>'}</button>
            <button type="button" class="layer-action-btn btn-fig-trash ${canDelete ? "" : "opacity-25 cursor-not-allowed"}" title="${canDelete ? "Delete the shape" : "A module needs at least one shape"}" aria-label="Delete ${def.name || f.shape}" ${canDelete ? "" : "disabled"}><i class="ph ph-trash" aria-hidden="true"></i></button>
            <span class="layer-action-btn layer-drag-handle" title="Drag to reorder" aria-hidden="true"><i class="ph ph-dots-six-vertical"></i></span>
          </div>
        </div>`;
      }).join("");
    }
    const f = this.currentFigure();
    document.querySelectorAll("#fig-shape-grid [data-fig-shape]").forEach(b => b.classList.toggle("active", !!f && b.dataset.figShape === f.shape));
    const set = (id, v, suffix) => { this.syncControlValue(`input-${id}`, v); const n = document.getElementById(`num-${id}`); if (n) n.value = `${v}${suffix}`; };
    // The look of the shape being edited
    {
      const look = f ? this.engine.figureStyle(f, mod) : { wire: true, color: "#18181F", sw: 1 };
      document.getElementById("btn-mode-stroke")?.classList.toggle("active", look.wire);
      document.getElementById("btn-mode-fill")?.classList.toggle("active", !look.wire);
      const color = (look.color || "#18181F");
      const cp = document.getElementById("color-active-shape");
      if (cp && /^#[0-9a-f]{6}$/i.test(color)) cp.value = color;
      const sw = document.getElementById("swatch-active-color"); if (sw) sw.style.backgroundColor = color;
      const hx = document.getElementById("text-color-hex"); if (hx) hx.textContent = color.toUpperCase();
      this.syncControlValue("input-active-stroke", look.sw || 1);
      const ns = document.getElementById("num-active-stroke"); if (ns) ns.value = `${look.sw || 1}px`;
    }
    if (f) { set("fig-w", f.width, "px"); set("fig-h", f.height, "px"); set("fig-x", f.x, "px"); set("fig-y", f.y, "px"); set("fig-rot", f.rotation, "º"); }
    const badge = document.getElementById("shapes-count-badge"); if (badge) badge.textContent = String(mod.figures.length);
    document.getElementById("btn-fig-add")?.toggleAttribute("disabled", mod.figures.length >= 4);
    document.getElementById("btn-fig-duplicate")?.toggleAttribute("disabled", mod.figures.length >= 4);
    // Combine: only with two or more shapes
    const combineNow = mod.combine || "none";
    document.getElementById("fig-combine-block")?.classList.toggle("hidden", mod.figures.length < 2);
    document.querySelectorAll("[data-fig-combine]").forEach(b => b.classList.toggle("active", b.dataset.figCombine === combineNow));
    // Relation to the previous shape (the first one has none): a related shape is placed by the relation, not by its position
    const rel = this.figEdit.index > 0 ? (f && f.relation) || "free" : "free";
    document.getElementById("fig-relation-block")?.classList.toggle("hidden", this.figEdit.index === 0);
    document.querySelectorAll("[data-fig-rel]").forEach(b => b.classList.toggle("active", b.dataset.figRel === rel));
    document.getElementById("fig-relation-stack")?.classList.toggle("hidden", rel !== "distance");
    document.getElementById("fig-pos-x-field")?.classList.toggle("hidden", rel !== "free");
    document.getElementById("fig-pos-y-field")?.classList.toggle("hidden", rel !== "free");
    if (f) { set("fig-angle", f.angle ?? 0, "º"); set("fig-gap", f.gap ?? 0, "px"); }
    this.updateHeightVisibility();
    this.render();
  }

  setupSmartModule() {
    this.figEdit = null;
    document.querySelectorAll("#fig-shape-grid [data-fig-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        const f = this.currentFigure();
        if (!f) return;
        f.shape = btn.dataset.figShape;
        this.recordFigureStep();
        this.syncFigureEditor();
      });
    });

    document.getElementById("btn-fig-save")?.addEventListener("click", () => this.closeFigureEditor(true));
    document.getElementById("btn-fig-cancel")?.addEventListener("click", () => this.closeFigureEditor(false));

    const mod = () => (this.figEdit ? this.state.layers.find(l => l.id === this.figEdit.layerId) : null);
    document.getElementById("btn-fig-add")?.addEventListener("click", () => {
      const m = mod(); if (!m || m.figures.length >= 4) return;
      // a new figure is half the container (the paper), so it is easy to see and to place
      const cfg = ASPECT_RATIOS[this.state.aspectRatio] || ASPECT_RATIOS["1:1"];
      const half = Math.max(1, Math.round(Math.max(m.containerW > 0 ? m.containerW : cfg.w, m.containerH > 0 ? m.containerH : cfg.h) / 2));
      const cur = this.currentFigure();
      const look = this.engine.figureStyle(cur || {}, m);
      m.figures.push({ shape: "circle", width: half, height: half, x: 0, y: 0, rotation: 0, wireframe: look.wire, color: look.color, strokeWidth: look.sw });
      this.figEdit.index = m.figures.length - 1;
      this.recordFigureStep();
      this.syncFigureEditor();
    });
    // Duplicate: an exact copy right above the selected shape, placed where the original is
    document.getElementById("btn-fig-duplicate")?.addEventListener("click", () => {
      const m = mod(); if (!m || m.figures.length >= 4) return;
      const i = this.figEdit.index, r = resolveFigures(m.figures)[i];
      m.figures.splice(i + 1, 0, { ...m.figures[i], x: Math.round(r.x), y: Math.round(r.y), relation: "free" });
      this.figEdit.index = i + 1;
      this.recordFigureStep();
      this.syncFigureEditor();
    });

    // The rows of the list: select, show or hide, delete, and drag to reorder
    const list = document.getElementById("fig-list");
    let dragFrom = null;
    list?.addEventListener("click", (e) => {
      const row = e.target.closest(".fig-row");
      const m = mod();
      if (!row || !m) return;
      const i = Number(row.dataset.figIndex);
      if (e.target.closest(".btn-fig-eye")) {
        m.figures[i].visible = m.figures[i].visible === false;
        this.figEdit.index = i;
        this.recordFigureStep();
      } else if (e.target.closest(".btn-fig-trash")) {
        if (m.figures.length <= 1) return;
        m.figures.splice(i, 1);
        this.figEdit.index = Math.min(this.figEdit.index > i ? this.figEdit.index - 1 : this.figEdit.index, m.figures.length - 1);
        this.recordFigureStep();
      } else {
        this.figEdit.index = i;
      }
      this.syncFigureEditor();
    });
    list?.addEventListener("dragstart", (e) => {
      const row = e.target.closest(".fig-row");
      if (!row) return;
      dragFrom = Number(row.dataset.figIndex);
      row.classList.add("is-dragging");
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(dragFrom)); }
    });
    list?.addEventListener("dragend", () => {
      list.querySelectorAll(".fig-row").forEach(r => r.classList.remove("is-dragging", "drag-over"));
      dragFrom = null;
    });
    list?.addEventListener("dragover", (e) => {
      e.preventDefault();
      const row = e.target.closest(".fig-row");
      if (!row || Number(row.dataset.figIndex) === dragFrom) return;
      row.classList.add("drag-over");
    });
    list?.addEventListener("dragleave", (e) => { e.target.closest(".fig-row")?.classList.remove("drag-over"); });
    list?.addEventListener("drop", (e) => {
      e.preventDefault();
      const row = e.target.closest(".fig-row");
      const m = mod();
      list.querySelectorAll(".fig-row").forEach(r => r.classList.remove("drag-over"));
      if (!row || !m || dragFrom === null) return;
      const to = Number(row.dataset.figIndex);
      if (to === dragFrom) return;
      // the dragged shape takes the place of the one it is dropped on
      const [moved] = m.figures.splice(dragFrom, 1);
      m.figures.splice(to, 0, moved);
      this.figEdit.index = to;
      dragFrom = null;
      this.recordFigureStep();
      this.syncFigureEditor();
    });

    document.querySelectorAll("[data-fig-combine]").forEach(btn => btn.addEventListener("click", () => {
      const m = mod();
      if (!m) return;
      // the four operations toggle: pressing the one that is on goes back to none (the shapes stay stacked)
      m.combine = (m.combine || "none") === btn.dataset.figCombine ? "none" : btn.dataset.figCombine;
      this.recordFigureStep();
      this.syncFigureEditor();
    }));

    document.querySelectorAll("[data-fig-rel]").forEach(btn => btn.addEventListener("click", () => {
      const m = mod(), f = this.currentFigure();
      if (!m || !f || this.figEdit.index === 0) return;
      const next = btn.dataset.figRel;
      // leaving a relation keeps the shape where it is
      if (next === "free" && f.relation && f.relation !== "free") { const r = resolveFigures(m.figures)[this.figEdit.index]; f.x = Math.round(r.x); f.y = Math.round(r.y); }
      f.relation = next;
      if (f.angle === undefined) f.angle = 0;
      if (f.gap === undefined) f.gap = 0;
      this.recordFigureStep();
      this.syncFigureEditor();
    }));

    const pair = (id, key, lo, hi, suffix) => this.bindSliderWithNumber(`input-${id}`, `num-${id}`, (val) => {
      const f = this.currentFigure(); if (!f) return;
      f[key] = Math.max(lo, Math.min(hi, val));
      this.render();
    }, `Figure ${key}`, suffix);
    pair("fig-w", "width", 1, 2000, "px");
    pair("fig-h", "height", 1, 2000, "px");
    pair("fig-x", "x", -1000, 1000, "px");
    pair("fig-y", "y", -1000, 1000, "px");
    pair("fig-rot", "rotation", -180, 180, "º");
    pair("fig-angle", "angle", 0, 360, "º");
    pair("fig-gap", "gap", -500, 500, "px");
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

    // 3. Rotation (Rotación °)
    this.bindSliderWithNumber("input-active-rotation", "num-active-rotation", (val) => {
      const mod = this.getActiveModule();
      mod.rotation = val;
      this.render();
    }, "Rotation", "º");

    // 4. Stroke Width (Grosor Trazo)
    this.bindSliderWithNumber("input-active-stroke", "num-active-stroke", (val) => {
      const target = this.styleTarget();
      if (target) target.strokeWidth = val;
      this.render();
    }, "Stroke Width", "px");

    // The module's width and height: its container, the piece of paper the shapes are placed on (it always cuts at its edge)
    this.bindSliderWithNumber("input-active-container-w", "num-active-container-w", (val) => {
      const mod = this.getActiveModule();
      mod.containerW = Math.max(10, Math.min(1000, val));
      this.render();
    }, "Module Width", "px");
    this.bindSliderWithNumber("input-active-container-h", "num-active-container-h", (val) => {
      const mod = this.getActiveModule();
      mod.containerH = Math.max(10, Math.min(1000, val));
      this.render();
    }, "Module Height", "px");

    // 5. Drawing Mode: Stroke vs Fill (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    
    // The look (Stroke or Fill, colour, stroke width) belongs to the shape being edited; with no editor open, to the module
    btnStroke?.addEventListener("click", () => {
      const target = this.styleTarget();
      if (!target) return;
      target.wireframe = true;
      btnStroke.classList.add("active");
      btnFill?.classList.remove("active");
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Mode: Stroke`);
    });

    btnFill?.addEventListener("click", () => {
      const target = this.styleTarget();
      if (!target) return;
      target.wireframe = false;
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
        const target = this.styleTarget();
        if (target) target.color = hex;
        if (target && !this.figEdit) this.customColors.fg = hex;
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
    this.syncControlValue("input-active-rotation", mod.rotation || 0);
    this.syncControlValue("num-active-rotation", `${mod.rotation || 0}º`);
    const fig = this.figEdit ? this.currentFigure() : null;
    const look = fig ? this.engine.figureStyle(fig, mod) : { wire: mod.wireframe !== false, color: mod.color, sw: mod.strokeWidth || 1 };
    this.syncControlValue("input-active-stroke", look.sw || 1);
    this.syncControlValue("num-active-stroke", `${look.sw || 1}px`);
    const canvasCfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const contW = Math.round(mod.containerW > 0 ? mod.containerW : canvasCfg.w);
    const contH = Math.round(mod.containerH > 0 ? mod.containerH : canvasCfg.h);
    this.syncControlValue("input-active-container-w", contW);
    this.syncControlValue("num-active-container-w", `${contW}px`);
    this.syncControlValue("input-active-container-h", contH);
    this.syncControlValue("num-active-container-h", `${contH}px`);

    // Sync Mode (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    const isWireframe = look.wire;
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
    const layerColor = look.color || this.customColors.fg || "#18181F";
    const cp = document.getElementById("color-active-shape");
    if (cp && layerColor.startsWith("#") && layerColor.length === 7) {
      cp.value = layerColor;
    }
    if (swatch) swatch.style.backgroundColor = layerColor;
    if (hexText) hexText.textContent = layerColor.toUpperCase();
  }
}


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

// The panels described as data (each spec lives in its panel's file in js/studio/app/)
function dataPanels() { return [LAYOUT_PANEL, SIMILARITY_PANEL, ANOMALY_PANEL, GRADATION_PANEL, CONTRAST_PANEL, CONCENTRATION_PANEL, SPACE_PANEL, TEXTURE_PANEL]; }

// Copies the methods (and the static getters) of the area classes (js/studio/app/*.js) onto StudioProApp
function applyMixins(target, sources) {
  for (const source of sources) {
    for (const name of Object.getOwnPropertyNames(source.prototype)) {
      if (name !== "constructor") Object.defineProperty(target.prototype, name, Object.getOwnPropertyDescriptor(source.prototype, name));
    }
    for (const name of Object.getOwnPropertyNames(source)) {
      if (!["length", "name", "prototype"].includes(name)) Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
    }
  }
}
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
    this.isFlyoutOpen = false; // the Module panel is the smart module editor: opening it shows the module alone, so the app starts with the panels closed


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
    this.buildDataPanels(); // the panels described as data (js/studio/app/panel-builder.js) draw their controls first
    this.setupLayoutStructure();
    this.setupSelects();
    this.setupValueSteppers();
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
    this.setupSmartModule();

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
    if (this.figEdit && this.figEdit.layerId !== this.activeLayerId) { this.endFigureEdit(true); this.beginFigureEdit(); }
    this.syncShapeInspectorWithActiveLayer();
    this.syncStructureInspectorWithActiveLayer();
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
    this.engine.viewState = this.figEdit ? this.stateForFigureEdit() : null;
    this.syncEditorCanvas();
    // The Block frame shows only for the layer being edited, while the Layout panel is open
    this.engine.blockGuideLayerId = this.isFlyoutOpen && this.activeRailTab === "layout" ? this.activeLayerId : null;
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

  // While the module is edited the canvas is the module itself: its width and height, whatever the aspect ratio. The canvas is
  // shown scaled to fit the screen (as every canvas is), and drawn denser so a small module is big and sharp
  syncEditorCanvas() {
    const layer = this.figEdit ? this.state.layers.find(l => l.id === this.figEdit.layerId) : null;
    const key = layer ? `${layer.containerW}x${layer.containerH}` : "";
    if (key !== this._editorCanvasKey) { this._editorCanvasKey = key; this.fitArtboard(); }
    this.engine.renderScale = layer && this.artboardSize ? Math.max(1, Math.min(8, Math.ceil(this.artboardSize.w / Math.max(1, layer.containerW)))) : 1;
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
        this.syncAllInspectorsWithActiveLayer(); // the Block shows pixels of the canvas
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

    // The Download menu: opens under its button, closes after a choice, with Escape or a click outside
    {
      const menu = document.getElementById("download-menu");
      const trigger = document.getElementById("btn-download");
      const list = menu?.querySelector(".ds-menu__list");
      const setOpen = (open) => { if (!list) return; list.hidden = !open; trigger.setAttribute("aria-expanded", String(open)); };
      trigger?.addEventListener("click", (e) => { e.stopPropagation(); setOpen(list.hidden); });
      list?.addEventListener("click", () => setOpen(false));
      document.addEventListener("click", (e) => { if (menu && !menu.contains(e.target)) setOpen(false); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
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

    // Projects saved before some controls became percentages: convert their pixels (the merge below drops keys it does not know)
    const migrate = (src) => {
      const st = src && src.structure;
      if (!st || typeof st !== "object") return src;
      const rep = st.repetition;
      if (rep && typeof rep === "object" && rep.curveAmount === undefined && typeof rep.curveIntensity === "number") {
        rep.curveAmount = Math.min(1, Math.round((rep.curveIntensity / (600 / Math.max(1, rep.cols || 4))) * 100) / 100);
      }
      // Radiation modules used to shrink with their cell; the new default is Base size, so older projects keep what they had
      const rd = st.radiation;
      if (rd && typeof rd === "object" && rd.moduleScale === undefined) rd.moduleScale = "cell";
      if (rep && typeof rep === "object" && rep.moduleScale === undefined) rep.moduleScale = "cell";
      const sp = st.space;
      if (sp && typeof sp === "object" && sp.depthPct === undefined && typeof sp.depth === "number") {
        sp.depthPct = Math.max(5, Math.min(100, Math.round((sp.depth / 85) * 100)));
      }
      return src;
    };

    const used = new Set();
    const layers = raw.layers.slice(0, 5).map((src, i) => {
      migrate(src);
      const layer = merge(createDefaultLayer(`layer-${i + 1}`, `Layer ${i + 1}`), src);
      if (!STUDIO_SHAPE_KEYS.includes(layer.shape)) layer.shape = "circle";
      // Smart module: keep only well-formed figures (known shape, finite numbers in range), at most 4. Figures saved as a
      // % of the module ({ size, x, y }) become px, from the module's own size
      const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
      const old = Math.max(layer.width || 100, layer.height || 100);
      layer.figures = (Array.isArray(layer.figures) ? layer.figures : [])
        .filter(f => f && STUDIO_SHAPE_KEYS.includes(f.shape)).slice(0, 4)
        .map(f => (f.width !== undefined || f.height !== undefined)
          ? { shape: f.shape, width: num(f.width, 1, 2000, 100), height: num(f.height ?? f.width, 1, 2000, 100), x: num(f.x, -1000, 1000, 0), y: num(f.y, -1000, 1000, 0), rotation: num(f.rotation, -360, 360, 0), relation: ["coincident", "distance"].includes(f.relation) ? f.relation : "free", angle: num(f.angle, 0, 360, 0), gap: num(f.gap, -500, 500, 0), ...(typeof f.wireframe === "boolean" ? { wireframe: f.wireframe } : {}), ...(/^#[0-9a-f]{6}$/i.test(f.color || "") ? { color: f.color } : {}), ...(typeof f.strokeWidth === "number" && Number.isFinite(f.strokeWidth) ? { strokeWidth: Math.max(0.2, Math.min(10, f.strokeWidth)) } : {}) }
          : { shape: f.shape, width: Math.round(num(f.size, 5, 200, 100) / 100 * old), height: Math.round(num(f.size, 5, 200, 100) / 100 * old), x: Math.round(num(f.x, -100, 100, 0) / 100 * old), y: Math.round(num(f.y, -100, 100, 0) / 100 * old), rotation: num(f.rotation, -360, 360, 0) });
      layer.combine = ["union", "subtract", "intersect", "xor"].includes(layer.combine) ? layer.combine : "none";
      // The module's size is its container: 10 to 1000 px. Older projects used 0 for "the whole canvas"
      const ar = ASPECT_RATIOS[raw.aspectRatio] || ASPECT_RATIOS["1:1"];
      layer.containerW = Math.max(10, Math.min(1000, layer.containerW > 0 ? layer.containerW : ar.w));
      layer.containerH = Math.max(10, Math.min(1000, layer.containerH > 0 ? layer.containerH : ar.h));
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
    this.figEdit = null; // an open editing session belonged to the old project
    this.syncEditShell();
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
    const editing = this.figEdit ? this.state.layers.find(l => l.id === this.figEdit.layerId) : null;
    const cfg = editing ? { w: editing.containerW, h: editing.containerH } : (ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"]);
    const ratio = cfg.w / cfg.h;

    const flyoutWidth = flyout ? flyout.offsetWidth : 300;
    const flyoutLeft = workspace.getBoundingClientRect().right - parseFloat(getComputedStyle(workspace).getPropertyValue("--flyout-right") || 66) - flyoutWidth;
    const maxOuterW = Math.max(160, flyoutLeft - GAP - column.getBoundingClientRect().left);

    let h, w;
    if (editing) {
      // any proportion (a module is not bound to an aspect ratio): fit it in the space there is
      const f = Math.min((maxOuterW - BORDER * 2) / cfg.w, (stage.clientHeight - BORDER * 2) / cfg.h);
      w = Math.max(40, Math.floor(cfg.w * f));
      h = Math.max(40, Math.floor(cfg.h * f));
    } else {
      const innerH = Math.max(120, Math.min(stage.clientHeight - BORDER * 2, (maxOuterW - BORDER * 2) / ratio));
      h = Math.floor(innerH);
      w = Math.floor(innerH * ratio);
    }

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
    if (this.figEdit) { this.recordFigureStep(); return; } // inside the smart module editor every change is a step of its own undo; Save makes one step of the project
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
    if (this.figEdit) { this.stepFigureEdit(-1); return; } // inside the smart module editor, undo goes back one editor step
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
    if (this.figEdit) { this.stepFigureEdit(1); return; }
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

// The rest of the app's methods live in js/studio/app/*.js, one file per panel or area
applyMixins(StudioProApp, [UiHelpers, PanelBuilder, LayersPanel, ArtLog, ControlsRail, PanelLayout, PanelSimilarity, Accessibility, PanelGradation, PanelAnomaly, PanelContrast, PanelConcentration, PanelSpace, PanelTexture, ModuleEditor]);

// Auto-boot upon DOM readiness
document.addEventListener("DOMContentLoaded", () => {
  window.studioProApp = new StudioProApp();
});


  if (typeof window !== 'undefined') {
    window.StudioEngine = StudioEngine;
    window.StudioProApp = StudioProApp;
    window.CanvasUtils = CanvasUtils;
    window.Shapes = Shapes;
    window.regionBoolean = regionBoolean;
    window.regionArea = regionArea;
    window.inRegion = inRegion;
    window.StudioExporter = StudioExporter;
  }
})();
