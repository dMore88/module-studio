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
          const parts = ["Radiation", pick(SCHEMES, r.scheme), byCont ? `${r.rings} rings` : `${r.rays} rays - ${r.rings} rings`, actual ? "Actual size" : r.moduleScale === "cell" ? "Shrink with cell" : "Base size",
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
          const parts = ["Repetition", pick(GRIDS, r.gridType), `C${r.cols} - R${r.rows}`, actual ? "Actual size" : r.moduleScale === "cell" ? "Shrink with cell" : "Base size", pick(PLACE, r.placement || "centers"), pick(MIX, r.cellMix || "none"),
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
