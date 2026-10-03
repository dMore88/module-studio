// The 15 shapes available in the studio (matches the Figma shape grid).
// `phIcon` is the Phosphor icon name, rendered with the fill weight (`ph-fill ph-<name>`).
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
    phIcon: "number-one"
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
    phIcon: "number-five"
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
    phIcon: "number-nine"
  }
};
