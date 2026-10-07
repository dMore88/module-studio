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

export const StudioExporter = {
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
