export const STUDIO_SHAPE_KEYS = [
  "circle", "square", "triangle_eq", "triangle_right", "rhombus", "arrow_up", "hexagon",
  "star4", "teardrop", "letter_a", "letter_h", "letter_z", "cross"
];

export const Shapes = {
  // 1. Pure Geometrics
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><circle cx="0" cy="0" r="14" fill="currentColor"/></svg>`
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><rect x="-14" y="-14" width="28" height="28" fill="currentColor"/></svg>`
  },

  rect: {
    id: "rect",
    name: "Rectangle",
    category: "geometric",
    draw(ctx, size) {
      const w = size * 0.6;
      const h = size;
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.closePath();
    },
    svgPath(size) {
      const w = size * 0.6;
      const h = size;
      return `<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><rect x="-9" y="-15" width="18" height="30" fill="currentColor"/></svg>`
  },

  triangle_eq: {
    id: "triangle_eq",
    name: "Equilateral Triangle",
    category: "geometric",
    draw(ctx, size) {
      const r = size * 0.58;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.lineTo(-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.closePath();
    },
    svgPath(size) {
      const r = size * 0.58;
      const x1 = 0, y1 = -r;
      const x2 = r * Math.cos(Math.PI / 6), y2 = r * Math.sin(Math.PI / 6);
      const x3 = -r * Math.cos(Math.PI / 6), y3 = r * Math.sin(Math.PI / 6);
      return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="0,-15 14,12 -14,12" fill="currentColor"/></svg>`
  },

  triangle_right: {
    id: "triangle_right",
    name: "Right Triangle",
    category: "geometric",
    draw(ctx, size) {
      const s = size * 0.5;
      ctx.beginPath();
      ctx.moveTo(-s, -s);
      ctx.lineTo(s, s);
      ctx.lineTo(-s, s);
      ctx.closePath();
    },
    svgPath(size) {
      const s = size * 0.5;
      return `<polygon points="${-s},${-s} ${s},${s} ${-s},${s}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="-12,-12 12,12 -12,12" fill="currentColor"/></svg>`
  },

  rhombus: {
    id: "rhombus",
    name: "Rhombus (Diamond)",
    category: "polygonal",
    draw(ctx, size) {
      const rx = size * 0.45;
      const ry = size * 0.65;
      ctx.beginPath();
      ctx.moveTo(0, -ry);
      ctx.lineTo(rx, 0);
      ctx.lineTo(0, ry);
      ctx.lineTo(-rx, 0);
      ctx.closePath();
    },
    svgPath(size) {
      const rx = size * 0.45;
      const ry = size * 0.65;
      return `<polygon points="0,${-ry} ${rx},0 0,${ry} ${-rx},0" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="0,-16 11,0 0,16 -11,0" fill="currentColor"/></svg>`
  },

  trapezoid: {
    id: "trapezoid",
    name: "Trapezoid",
    category: "polygonal",
    draw(ctx, size) {
      const topW = size * 0.35;
      const botW = size * 0.7;
      const h = size * 0.55;
      ctx.beginPath();
      ctx.moveTo(-topW / 2, -h / 2);
      ctx.lineTo(topW / 2, -h / 2);
      ctx.lineTo(botW / 2, h / 2);
      ctx.lineTo(-botW / 2, h / 2);
      ctx.closePath();
    },
    svgPath(size) {
      const topW = size * 0.35;
      const botW = size * 0.7;
      const h = size * 0.55;
      return `<polygon points="${-topW/2},${-h/2} ${topW/2},${-h/2} ${botW/2},${h/2} ${-botW/2},${h/2}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="-6,-10 6,-10 14,10 -14,10" fill="currentColor"/></svg>`
  },

  arrow_up: {
    id: "arrow_up",
    name: "Arrow Up",
    category: "geometric",
    draw(ctx, size) {
      const s = size;
      const tipY = -s * 0.48;
      const wingY = -s * 0.05;
      const botY = s * 0.48;
      const wingW = s * 0.42;
      const stemW = s * 0.18;
      ctx.beginPath();
      ctx.moveTo(0, tipY);
      ctx.lineTo(wingW, wingY);
      ctx.lineTo(stemW, wingY);
      ctx.lineTo(stemW, botY);
      ctx.lineTo(-stemW, botY);
      ctx.lineTo(-stemW, wingY);
      ctx.lineTo(-wingW, wingY);
      ctx.closePath();
    },
    svgPath(size) {
      const s = size;
      const tipY = -s * 0.48;
      const wingY = -s * 0.05;
      const botY = s * 0.48;
      const wingW = s * 0.42;
      const stemW = s * 0.18;
      return `<polygon points="0,${tipY} ${wingW},${wingY} ${stemW},${wingY} ${stemW},${botY} ${-stemW},${botY} ${-stemW},${wingY} ${-wingW},${wingY}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="0,-14 12,-1 5,-1 5,14 -5,14 -5,-1 -12,-1" fill="currentColor"/></svg>`
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="0,-14 13,-7 13,8 0,15 -13,8 -13,-7" fill="currentColor"/></svg>`
  },

  star4: {
    id: "star4",
    name: "4-Point Star",
    category: "polygonal",
    draw(ctx, size) {
      const rOuter = size * 0.55;
      const rInner = size * 0.18;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? rOuter : rInner;
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    },
    svgPath(size) {
      const rOuter = size * 0.55;
      const rInner = size * 0.18;
      let pts = [];
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? rOuter : rInner;
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
      }
      return `<polygon points="${pts.join(" ")}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="0,-15 4,-4 15,0 4,4 0,15 -4,4 -15,0 -4,-4" fill="currentColor"/></svg>`
  },

  crescent: {
    id: "crescent",
    name: "Crescent (Lúnula)",
    category: "organic",
    draw(ctx, size) {
      const r = size * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.arc(r * 0.45, 0, r * 0.85, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
    },
    svgPath(size) {
      const r = size * 0.5;
      const cutX = r * 0.45;
      const cutR = r * 0.85;
      return `<path d="M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${cutR} ${cutR} 0 0 0 0 ${-r} Z" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M 0 -14 A 14 14 0 0 1 0 14 A 12 12 0 0 0 0 -14 Z" fill="currentColor"/></svg>`
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M 0 -14 C 10 -4, 9 13, 0 13 C -9 13, -10 -4, 0 -14 Z" fill="currentColor"/></svg>`
  },

  letter_a: {
    id: "letter_a",
    name: "Letter A",
    category: "typographic",
    draw(ctx, size) {
      const s = size;
      const h2 = s * 0.46;
      const w2 = s * 0.40;
      const topW = s * 0.10;
      const footW = s * 0.15;
      const barY = s * 0.10;
      const barH = s * 0.12;

      ctx.beginPath();
      ctx.moveTo(-topW, -h2);
      ctx.lineTo(topW, -h2);
      ctx.lineTo(w2, h2);
      ctx.lineTo(w2 - footW, h2);
      ctx.lineTo(s * 0.09, barY + barH);
      ctx.lineTo(-s * 0.09, barY + barH);
      ctx.lineTo(-w2 + footW, h2);
      ctx.lineTo(-w2, h2);
      ctx.closePath();

      ctx.moveTo(0, -h2 * 0.45);
      ctx.lineTo(-s * 0.12, barY - 2);
      ctx.lineTo(s * 0.12, barY - 2);
      ctx.closePath();
    },
    svgPath(size) {
      const s = size;
      const h2 = s * 0.46;
      const w2 = s * 0.40;
      const topW = s * 0.10;
      const footW = s * 0.15;
      const barY = s * 0.10;
      const barH = s * 0.12;
      return `<path fill-rule="evenodd" d="M ${-topW} ${-h2} L ${topW} ${-h2} L ${w2} ${h2} L ${w2 - footW} ${h2} L ${s * 0.09} ${barY + barH} L ${-s * 0.09} ${barY + barH} L ${-w2 + footW} ${h2} L ${-w2} ${h2} Z M 0 ${-h2 * 0.45} L ${s * 0.12} ${barY - 2} L ${-s * 0.12} ${barY - 2} Z" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><text x="0" y="5" font-family="Space Grotesk, Inter, sans-serif" font-weight="800" font-size="22" text-anchor="middle" dominant-baseline="middle" fill="currentColor">A</text></svg>`
  },

  letter_h: {
    id: "letter_h",
    name: "Letter H",
    category: "typographic",
    draw(ctx, size) {
      const s = size;
      const h2 = s * 0.46;
      const w2 = s * 0.38;
      const colW = s * 0.16;
      const barH = s * 0.14;
      ctx.beginPath();
      ctx.moveTo(-w2, -h2);
      ctx.lineTo(-w2 + colW, -h2);
      ctx.lineTo(-w2 + colW, -barH / 2);
      ctx.lineTo(w2 - colW, -barH / 2);
      ctx.lineTo(w2 - colW, -h2);
      ctx.lineTo(w2, -h2);
      ctx.lineTo(w2, h2);
      ctx.lineTo(w2 - colW, h2);
      ctx.lineTo(w2 - colW, barH / 2);
      ctx.lineTo(-w2 + colW, barH / 2);
      ctx.lineTo(-w2 + colW, h2);
      ctx.lineTo(-w2, h2);
      ctx.closePath();
    },
    svgPath(size) {
      const s = size;
      const h2 = s * 0.46;
      const w2 = s * 0.38;
      const colW = s * 0.16;
      const barH = s * 0.14;
      return `<polygon points="${-w2},${-h2} ${-w2 + colW},${-h2} ${-w2 + colW},${-barH / 2} ${w2 - colW},${-barH / 2} ${w2 - colW},${-h2} ${w2},${-h2} ${w2},${h2} ${w2 - colW},${h2} ${w2 - colW},${barH / 2} ${-w2 + colW},${barH / 2} ${-w2 + colW},${h2} ${-w2},${h2}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><text x="0" y="5" font-family="Space Grotesk, Inter, sans-serif" font-weight="800" font-size="22" text-anchor="middle" dominant-baseline="middle" fill="currentColor">H</text></svg>`
  },

  letter_z: {
    id: "letter_z",
    name: "Letter Z",
    category: "typographic",
    draw(ctx, size) {
      const s = size;
      const h2 = s * 0.46;
      const w2 = s * 0.38;
      const barH = s * 0.15;
      const diagW = s * 0.18;
      ctx.beginPath();
      ctx.moveTo(-w2, -h2);
      ctx.lineTo(w2, -h2);
      ctx.lineTo(w2, -h2 + barH);
      ctx.lineTo(-w2 + diagW * 1.5, h2 - barH);
      ctx.lineTo(w2, h2 - barH);
      ctx.lineTo(w2, h2);
      ctx.lineTo(-w2, h2);
      ctx.lineTo(-w2, h2 - barH);
      ctx.lineTo(w2 - diagW * 1.5, -h2 + barH);
      ctx.lineTo(-w2, -h2 + barH);
      ctx.closePath();
    },
    svgPath(size) {
      const s = size;
      const h2 = s * 0.46;
      const w2 = s * 0.38;
      const barH = s * 0.15;
      const diagW = s * 0.18;
      return `<polygon points="${-w2},${-h2} ${w2},${-h2} ${w2},${-h2 + barH} ${-w2 + diagW * 1.5},${h2 - barH} ${w2},${h2 - barH} ${w2},${h2} ${-w2},${h2} ${-w2},${h2 - barH} ${w2 - diagW * 1.5},${-h2 + barH} ${-w2},${-h2 + barH}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><text x="0" y="5" font-family="Space Grotesk, Inter, sans-serif" font-weight="800" font-size="22" text-anchor="middle" dominant-baseline="middle" fill="currentColor">Z</text></svg>`
  },

  capsule: {
    id: "capsule",
    name: "Capsule (Píldora)",
    category: "organic",
    draw(ctx, size) {
      const w = size * 0.5;
      const h = size * 0.9;
      const r = w / 2;
      ctx.beginPath();
      ctx.arc(0, -h / 2 + r, r, Math.PI, 0, false);
      ctx.arc(0, h / 2 - r, r, 0, Math.PI, false);
      ctx.closePath();
    },
    svgPath(size) {
      const w = size * 0.5;
      const h = size * 0.9;
      const r = w / 2;
      return `<path d="M ${-r} ${-h/2+r} A ${r} ${r} 0 0 1 ${r} ${-h/2+r} L ${r} ${h/2-r} A ${r} ${r} 0 0 1 ${-r} ${h/2-r} Z" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M -7 -6 A 7 7 0 0 1 7 -6 L 7 6 A 7 7 0 0 1 -7 6 Z" fill="currentColor"/></svg>`
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M -3 -14 L 3 -14 L 3 -3 L 14 -3 L 14 3 L 3 3 L 3 14 L -3 14 L -3 3 L -14 3 L -14 -3 L -3 -3 Z" fill="currentColor"/></svg>`
  },

  c_ring: {
    id: "c_ring",
    name: "C-Shape Ring (Wong)",
    category: "geometric",
    draw(ctx, size) {
      const outerR = size * 0.5;
      const innerR = size * 0.26;
      const cutAngle = Math.PI / 3;
      ctx.beginPath();
      const startAngle = cutAngle / 2;
      const endAngle = 2 * Math.PI - cutAngle / 2;
      ctx.arc(0, 0, outerR, startAngle, endAngle, false);
      ctx.arc(0, 0, innerR, endAngle, startAngle, true);
      ctx.closePath();
    },
    svgPath(size) {
      const outerR = size * 0.5;
      const innerR = size * 0.26;
      const cutAngle = Math.PI / 3;
      const sa = cutAngle / 2;
      const ea = 2 * Math.PI - cutAngle / 2;
      const ox1 = outerR * Math.cos(sa), oy1 = outerR * Math.sin(sa);
      const ox2 = outerR * Math.cos(ea), oy2 = outerR * Math.sin(ea);
      const ix1 = innerR * Math.cos(ea), iy1 = innerR * Math.sin(ea);
      const ix2 = innerR * Math.cos(sa), iy2 = innerR * Math.sin(sa);
      return `<path d="M ${ox1} ${oy1} A ${outerR} ${outerR} 0 1 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 1 0 ${ix2} ${iy2} Z" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M 7 12 A 14 14 0 1 1 7 -12 L 4 -7 A 8 8 0 1 0 4 7 Z" fill="currentColor"/></svg>`
  },

  line: {
    id: "line",
    name: "Straight Line",
    category: "linear",
    draw(ctx, size) {
      const len = size * 0.9;
      const th = Math.max(size * 0.14, 4);
      ctx.beginPath();
      ctx.rect(-len / 2, -th / 2, len, th);
      ctx.closePath();
    },
    svgPath(size) {
      const len = size * 0.9;
      const th = Math.max(size * 0.14, 4);
      return `<rect x="${-len/2}" y="${-th/2}" width="${len}" height="${th}" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><rect x="-14" y="-2.5" width="28" height="5" fill="currentColor"/></svg>`
  },

  arc: {
    id: "arc",
    name: "Quadrant Arc",
    category: "linear",
    draw(ctx, size) {
      const r = size * 0.55;
      const th = Math.max(size * 0.16, 4);
      ctx.beginPath();
      ctx.arc(-r / 2, r / 2, r, -Math.PI / 2, 0, false);
      ctx.arc(-r / 2, r / 2, r - th, 0, -Math.PI / 2, true);
      ctx.closePath();
    },
    svgPath(size) {
      const r = size * 0.55;
      const th = Math.max(size * 0.16, 4);
      return `<path d="M ${-r/2} ${-r/2} A ${r} ${r} 0 0 1 ${r/2} ${r/2} L ${r/2-th} ${r/2} A ${r-th} ${r-th} 0 0 0 ${-r/2} ${-r/2+th} Z" />`;
    },
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M -8 -10 A 18 18 0 0 1 10 8 L 6 8 A 14 14 0 0 0 -8 -6 Z" fill="currentColor"/></svg>`
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><polygon points="0,-14 13,11 -13,11" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`
  },

  wave: {
    id: "wave",
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M -14 0 C -7 -10, -7 -10, 0 0 C 7 10, 7 10, 14 0" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`
  },

  horseshoe: {
    id: "horseshoe",
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M -9 -12 L -9 2 A 9 9 0 0 0 9 2 L 9 -12" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><path d="M 0 13 A 13 13 0 0 1 0 -13 C 6 -9 6 9 0 13 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
  },

  hatch: {
    id: "hatch",
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
    iconSvg: `<svg viewBox="-20 -20 40 40" class="w-4 h-4"><line x1="-12" y1="12" x2="12" y2="-12" stroke="currentColor" stroke-width="2"/><line x1="-4" y1="12" x2="12" y2="-4" stroke="currentColor" stroke-width="2"/><line x1="-12" y1="4" x2="4" y2="-12" stroke="currentColor" stroke-width="2"/></svg>`
  },

  digit1: {
    id: "digit1",
    name: "Digit 1",
    category: "symbolic",
    draw(ctx, size) {
      ctx.font = `bold ${Math.round(size * 0.75)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("1", 0, 0);
    },
    svgPath(size) {
      return `<text x="0" y="0" font-family="Space Grotesk, sans-serif" font-size="${size*0.75}" font-weight="bold" text-anchor="middle" dominant-baseline="central">1</text>`;
    },
    iconSvg: `<span class="font-bold text-sm font-mono">1</span>`
  },

  digit5: {
    id: "digit5",
    name: "Digit 5",
    category: "symbolic",
    draw(ctx, size) {
      ctx.font = `bold ${Math.round(size * 0.75)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("5", 0, 0);
    },
    svgPath(size) {
      return `<text x="0" y="0" font-family="Space Grotesk, sans-serif" font-size="${size*0.75}" font-weight="bold" text-anchor="middle" dominant-baseline="central">5</text>`;
    },
    iconSvg: `<span class="font-bold text-sm font-mono">5</span>`
  },

  digit9: {
    id: "digit9",
    name: "Digit 9",
    category: "symbolic",
    draw(ctx, size) {
      ctx.font = `bold ${Math.round(size * 0.75)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("9", 0, 0);
    },
    svgPath(size) {
      return `<text x="0" y="0" font-family="Space Grotesk, sans-serif" font-size="${size*0.75}" font-weight="bold" text-anchor="middle" dominant-baseline="central">9</text>`;
    },
    iconSvg: `<span class="font-bold text-sm font-mono">9</span>`
  }
};
