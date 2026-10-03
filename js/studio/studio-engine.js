// Studio Composition Engine: Unified Grammar Pipeline for Wucius Wong 2D Design
import { Shapes } from './shapes.js';
import { CanvasUtils } from '../canvas-utils.js';

export const createDefaultLayerStructure = () => ({
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
  }
});

export const createDefaultLayer = (id = "layer-1", name = "Layer 1", shape = "circle", offsetX = 0, offsetY = 0, rotation = 0) => ({
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

export const defaultStudioState = {
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
      target: "shapes", // shapes, both, canvas
      mode: "grain", // grain, halftone, ribbing, typography
      density: 50, // 20 to 90
      scale: 14, // 6 to 36
      contrast: 40 // opacity 15 to 80
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

export class StudioEngine {
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

  // Draw a single shape helper with in-figure texture and illusory 3D space support
  drawShape(ctx, shapeId, size, fgColor, strokeOnly = false, lineWidth = 2, bgColor = null, isAlternating = false, skipSpace = false) {
    const shapeDef = Shapes[shapeId] || Shapes.circle;
    const space = this.state.modifiers.space;

    if (!space || !space.enabled || skipSpace) {
      this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
      return;
    }

    this.drawSpatialShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor, isAlternating, space);
  }

  // Draw flat shape with optional in-figure tactile texture
  drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly = false, lineWidth = 2, bgColor = null) {
    ctx.save();
    ctx.fillStyle = fgColor;
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = lineWidth;

    shapeDef.draw(ctx, size);

    if (strokeOnly) {
      ctx.stroke();
    } else {
      ctx.fill();

      // In-shape tactile texture (Texture)
      const text = this.state.modifiers.texture;
      if (text && text.enabled && (text.target === "shapes" || text.target === "both")) {
        ctx.save();
        shapeDef.draw(ctx, size);
        ctx.clip();
        const etchColor = bgColor || (this.state.invertFigureGround ? "#18181f" : "#FAFAFA");
        this.fillShapeTexture(ctx, size, fgColor, etchColor, text);
        ctx.restore();
      }
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

        // Front face (with texture if active)
        ctx.save();
        ctx.translate(totalDx, totalDy);
        this.drawFlatShape(ctx, shapeDef, size, fgColor, strokeOnly, lineWidth, bgColor);
        ctx.restore();
      }
    }
  }

  // Draw tactile texture strictly within the clipped silhouette of a shape (Texture)
  fillShapeTexture(ctx, size, fgColor, etchColor, text) {
    const alpha = (text.contrast ?? 40) / 100;
    const density = (text.density ?? 50) / 100;
    const scale = text.scale ?? 14;

    ctx.save();

    if (text.mode === "grain") {
      // Lithographic tooth / stipple grain carved into the shape
      ctx.fillStyle = etchColor;
      ctx.globalAlpha = Math.min(0.85, alpha * 1.1);
      const dotSize = Math.max(1, scale * 0.12);
      const count = Math.floor(size * size * 0.08 * (0.5 + density));
      let s = 98765;
      const rng = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return (s / 4294967296) * 2 - 1; // -1 to 1
      };
      for (let i = 0; i < count; i++) {
        const gx = rng() * size;
        const gy = rng() * size;
        ctx.fillRect(gx, gy, dotSize, dotSize);
      }
    } else if (text.mode === "halftone") {
      // Mechanical dot screen eroding the shape into a dot raster (Fig. 67c)
      ctx.fillStyle = etchColor;
      ctx.globalAlpha = Math.min(0.9, alpha * 1.25);
      const step = Math.max(4, Math.round(18 - density * 10));
      const maxDot = (step * 0.42) * (scale / 14);
      for (let y = -size; y <= size; y += step) {
        for (let x = -size; x <= size; x += step) {
          const dist = Math.hypot(x, y);
          const factor = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(dist * 0.08));
          const r = Math.max(0.6, maxDot * factor);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (text.mode === "ribbing") {
      // Parallel linear ribbing / hatching carved across the shape (Fig. 68a)
      ctx.strokeStyle = etchColor;
      ctx.lineWidth = Math.max(1, scale * 0.09);
      ctx.globalAlpha = Math.min(0.9, alpha * 1.2);
      const step = Math.max(3, Math.round(15 - density * 9));
      ctx.beginPath();
      for (let y = -size; y <= size; y += step) {
        ctx.moveTo(-size, y);
        ctx.lineTo(size, y);
      }
      ctx.stroke();
    } else if (text.mode === "typography") {
      // Typographic glyphs stamped inside the shape (Fig. 71)
      const letters = ["A", "B", "R", "X", "M", "Q", "S", "8", "■", "┼", "╱", "╲"];
      const step = Math.max(10, Math.round(24 - density * 12));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.round(scale * 0.85)}px "Space Grotesk", monospace, sans-serif`;
      ctx.fillStyle = etchColor;
      ctx.globalAlpha = Math.min(0.85, alpha * 1.15);

      for (let y = -size + step / 2; y <= size; y += step) {
        for (let x = -size + step / 2; x <= size; x += step) {
          const hash = Math.sin(y * 31.7 + x * 73.1) * 43758.5453;
          const rand = hash - Math.floor(hash);
          const char = letters[Math.floor(rand * letters.length)];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rand - 0.5) * 0.5);
          ctx.fillText(char, 0, 0);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  // Draw a single shape module for an individual layer
  drawSingleLayerShape(targetCtx, mod, sizeMultiplier = 1, fgColor = "#111111", bgColor = "#FAFAFA", wireframeOverride = null, shapeOverride = null, isCutout = false) {
    if (!mod) return;
    const shape = shapeOverride || mod.shape || "circle";
    const baseW = mod.width !== undefined ? mod.width : (mod.scale || 50);
    const baseH = mod.height !== undefined ? mod.height : (mod.scale || 50);
    const w = baseW * sizeMultiplier;
    const h = baseH * sizeMultiplier;
    const r = Math.max(w, h);
    const sx = r > 0 ? w / r : 1;
    const sy = r > 0 ? h / r : 1;
    const ox = (mod.offsetX || 0) * sizeMultiplier;
    const oy = (mod.offsetY || 0) * sizeMultiplier;
    const wire = wireframeOverride !== null ? wireframeOverride : (mod.wireframe !== false);
    const strokeW = mod.strokeWidth || 1.2;

    targetCtx.save();
    targetCtx.translate(ox, oy);
    targetCtx.rotate(((mod.rotation || 0) * Math.PI) / 180);
    targetCtx.scale(sx, sy);
    const layerColor = mod.color || fgColor;
    this.drawShape(targetCtx, shape, r, layerColor, wire, strokeW, bgColor, false, isCutout);
    targetCtx.restore();
  }

  // Render an individual layer centered on the canvas (when no repetition/radiation layout active for this layer)
  renderSingleLayerModule(ctx, mod, width, height, palette) {
    if (!mod || mod.visible === false) return;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    const aspectScale = Math.min(1.0, Math.min(width, height) / 600);
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
    const anom = this.state.modifiers.anomaly;
    const contrast = this.state.modifiers.contrast;
    const conc = this.state.modifiers.concentration;

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
            const sFactor = 0.35 + t * 1.1;
            ctx.scale(sFactor, sFactor);
          } else if (grad.type === "depth") {
            ctx.rotate(Math.PI / 6);
            ctx.scale(1, Math.max(0.18, 1 - t * 0.82));
            ctx.rotate(-Math.PI / 6);
          } else if (grad.type === "drift") {
            ctx.translate(t * (cW * 0.28), 0);
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
              if (anom.highlightColor) cellFg = palette.accent;
            }
          } else if (anom.type === "fracture") {
            const corridor = anom.radius * 0.45;
            if (inZone && Math.abs(cx - epiX) < corridor) {
              const jag = Math.sin(cy * 0.08) * (18 * severity);
              const shearY = (cy > epiY ? 1 : -1) * (36 * severity) + jag;
              const shearX = (cx > epiX ? 1 : -1) * (10 * severity);
              ctx.translate(shearX, shearY);
              ctx.rotate((factor * severity * Math.PI) / 3.2);
              if (factor > 0.4 && anom.highlightColor) cellFg = palette.accent;
            }
          } else if (anom.type === "swell") {
            if (inZone) {
              const angle = Math.atan2(cy - epiY, cx - epiX);
              const push = Math.sin(factor * Math.PI) * (42 * severity);
              ctx.translate(Math.cos(angle) * push, Math.sin(angle) * push);
              const sFactor = 1 + factor * 0.55 * severity;
              ctx.scale(sFactor, sFactor);
              if (factor > 0.65 && anom.highlightColor) cellFg = palette.accent;
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
              if (anom.highlightColor && factor > 0.3) cellFg = palette.accent;
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
              cellFg = palette.accent;
            }
          }
        }

        const scaleUnit = 1.25 * Math.min(1.0, Math.min(width, height) / 600);
        const cellRatio = Math.min(cW / usableW, cH / usableH);
        const normScale = scaleUnit * cellRatio * cellScaleMul * concScaleMul;
        this.drawSingleLayerShape(ctx, targetMod, normScale, cellFg, cellBg, cellWireframe, cellShapeA);
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
    const anom = this.state.modifiers.anomaly;
    const contrast = this.state.modifiers.contrast;
    const conc = this.state.modifiers.concentration;

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
              const sFactor = 0.35 + t * 1.1;
              ctx.scale(sFactor, sFactor);
            } else if (grad.type === "depth") {
              ctx.rotate(0.3);
              ctx.scale(1, Math.max(0.2, 1 - t * 0.75));
              ctx.rotate(-0.3);
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
                if (anom.highlightColor) cellFg = palette.accent;
              }
            } else if (anom.type === "fracture") {
              const corridor = anom.radius * 0.45;
              if (inZone && Math.abs(x - epiX) < corridor) {
                const jag = Math.sin(y * 0.08) * (18 * severity);
                const shearY = (y > epiY ? 1 : -1) * (36 * severity) + jag;
                const shearX = (x > epiX ? 1 : -1) * (10 * severity);
                ctx.translate(shearX, shearY);
                ctx.rotate((factor * severity * Math.PI) / 3.2);
                if (factor > 0.4 && anom.highlightColor) cellFg = palette.accent;
              }
            } else if (anom.type === "swell") {
              if (inZone) {
                const angleToEpi = Math.atan2(y - epiY, x - epiX);
                const push = Math.sin(factor * Math.PI) * (42 * severity);
                ctx.translate(Math.cos(angleToEpi) * push, Math.sin(angleToEpi) * push);
                const sFactor = 1 + factor * 0.55 * severity;
                ctx.scale(sFactor, sFactor);
                if (factor > 0.65 && anom.highlightColor) cellFg = palette.accent;
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
                if (anom.highlightColor && factor > 0.3) cellFg = palette.accent;
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
                cellFg = palette.accent;
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
          this.drawSingleLayerShape(ctx, targetMod, normScale, cellFg, cellBg, cellWireframe, cellShapeA);
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
    if (this.state.modifiers.space.enabled && this.state.modifiers.space.showIsoGuides) {
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

    // 5. Tactile Texture Rendering (Texture)
    if (this.state.modifiers.texture.enabled) {
      this.renderTexture(ctx, width, height, palette);
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

  // Tactile Texture Engine (Texture) - Canvas-wide surface plate
  renderTexture(ctx, width, height, palette) {
    const text = this.state.modifiers.texture;
    if (!text || !text.enabled) return;
    // Only apply canvas overlay if target is "canvas" or "both"
    if (text.target === "shapes") return;

    ctx.save();
    const fgColor = this.state.invertFigureGround ? palette.bg : palette.fg;
    const alpha = (text.contrast ?? 40) / 100;
    const density = (text.density ?? 50) / 100;
    const scale = text.scale ?? 14;

    if (text.mode === "grain") {
      // Fig. 69b: Lithographic tooth & stipple paper grain
      ctx.fillStyle = fgColor;
      const count = Math.floor(width * height * 0.00035 * (0.5 + density));
      let s = 1234567;
      const rng = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };
      ctx.globalAlpha = Math.min(0.5, alpha * 0.45);
      const dotSize = Math.max(1, scale * 0.12);
      for (let i = 0; i < count; i++) {
        const gx = rng() * width;
        const gy = rng() * height;
        ctx.fillRect(gx, gy, dotSize, dotSize);
      }
    } else if (text.mode === "halftone") {
      // Fig. 67c: Mechanical dot raster screen
      ctx.fillStyle = fgColor;
      ctx.globalAlpha = Math.min(0.55, alpha * 0.5);
      const step = Math.max(8, Math.round(34 - density * 18));
      const maxDot = (step * 0.38) * (scale / 14);
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          const dist = Math.hypot(x - width / 2, y - height / 2);
          const factor = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(dist * 0.012));
          const r = Math.max(0.6, maxDot * factor);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (text.mode === "ribbing") {
      // Fig. 68a: Woven linear ribbing / parallel hatching
      ctx.strokeStyle = fgColor;
      ctx.lineWidth = Math.max(0.8, scale * 0.08);
      ctx.globalAlpha = Math.min(0.45, alpha * 0.4);
      const step = Math.max(4, Math.round(24 - density * 16));
      ctx.beginPath();
      for (let y = 0; y < height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (text.mode === "typography") {
      // Fig. 71: Typography as Visual Texture (Wong Exercise)
      const letters = ["A", "B", "R", "X", "M", "Q", "S", "8", "■", "┼", "╱", "╲"];
      const step = Math.max(14, Math.round(48 - density * 24));
      const cols = Math.floor(width / step);
      const rows = Math.floor(height / step);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.round(scale)}px "Space Grotesk", monospace, sans-serif`;
      ctx.fillStyle = fgColor;
      ctx.globalAlpha = Math.min(0.45, alpha * 0.4);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) * step;
          const y = (r + 0.5) * step;
          const hash = Math.sin(r * 37.1 + c * 73.9) * 43758.5453;
          const rand = hash - Math.floor(hash);
          const char = letters[Math.floor(rand * letters.length)];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rand - 0.5) * 0.6);
          ctx.fillText(char, 0, 0);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }
}
