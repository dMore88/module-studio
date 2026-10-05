// Studio Composition Engine: Unified Grammar Pipeline for Wucius Wong 2D Design
import { Shapes, texturedShape, morphedShape } from './shapes.js';
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
    lineTone: "guide", // guide (faint), positive (ink) or negative (ground colour, cuts the modules)
    lineDirection: "both", // both, horizontal, vertical
    lineSpacing: "all", // all, alternate (every other line)
    reflection: "none", // none, columns, rows, both: mirror the module in alternate cells
    checkerInvert: false
  },
  radiation: {
    scheme: "centrifugal", // centrifugal, centripetal, concentric, spiral, multi_center
    orientation: "auto", // auto (by scheme), outward, inward, tangent, fixed
    centerOpen: 0, // open center: hole radius as a percentage of the radius (0 to 70)
    ringRotation: 0, // degrees each ring is rotated more than the previous one (-90 to 90)
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
    type: "rotation", // rotation, scale, depth, drift, shape, texture
    pathway: "diagonal", // diagonal, horizontal, vertical, concentric, zigzag
    range: 180, // degrees of total rotation (rotation type); 180 is the full reach for the other types
    steps: 1, // cycles (1 to 4)
    sequence: "restart", // restart (1-2-3-1-2-3) or pingpong (1-2-3-2-1)
    easing: 0, // -100 (starts fast, brakes) to 100 (starts slow, accelerates)
    alternate: false, // alternate rows (or columns) run in opposite directions
    targetShape: "triangle", // shape reached by the "shape" attribute
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
    dimension: "scale", // scale, shape, direction, tone, texture, space
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

  // Mat / Canvas display settings
  showSafeBounds: true
};

// Contrast, Anomaly and Concentration multiply the module scale; the product is capped so modules never explode
const MAX_SCALE_MUL = 8;

// Texture strength used by Gradation > Texture when the layer's own Texture is off
const GRADATION_TEXTURE = { jitter: 4, undulation: 14, skipChance: 25, crossing: 25 };

export class StudioEngine {
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
    this.cellMorph = null;
    this.cellTexScale = null;
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
    } else if (rep.gridType === "hexagonal") {
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

  // ---- Shared modifier logic (used by both the grid and the radial layouts) ----

  // Concentration: pulls/pushes a module position toward an attractor.
  // Returns the new position, the flow angle and a density scale multiplier.
  applyConcentration(conc, px, py, width, height) {
    let x = px, y = py, angle = 0, scaleMul = 1.0;
    const attX = (conc.attractorX ?? 0.5) * width;
    const attY = (conc.attractorY ?? 0.5) * height;
    const power = (conc.power ?? 65) / 100;
    const radius = conc.radius ?? 240;

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
      const att2X = width - attX;
      const att2Y = height - attY;
      const dist1 = Math.hypot(x - attX, y - attY);
      const dist2 = Math.hypot(x - att2X, y - att2Y);
      const nearestDist = Math.min(dist1, dist2);
      const targetX = dist1 < dist2 ? attX : att2X;
      const targetY = dist1 < dist2 ? attY : att2Y;
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
    return { x, y, angle, scaleMul };
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
      if (odd) t = 1 - t;
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
      if (odd) t = 1 - t;
    }
    return t;
  }

  // Gradation: turns the position t into the strength 0..1 of the effect for this cell
  // (direction, number of cycles, restart or ping-pong, acceleration).
  gradationValue(grad, t) {
    if (grad.reverse) t = 1 - t;
    let u = (t * (grad.steps || 1)) % 1.0001;
    if (grad.sequence === "pingpong") u = 1 - Math.abs(2 * u - 1);
    const easing = grad.easing || 0;
    if (easing !== 0) u = Math.pow(Math.max(u, 0), Math.pow(3, easing / 100));
    return u;
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

  // Anomaly: (ex, ey) is the module position compared with the epicenter.
  // Updates `cell` ({shape, fg, scaleMul}); returns false when the module vanishes (tear).
  // An anomaly is a local rupture, so it claims the shape and the accent colour (shapeLocked / fgLocked)
  // and Contrast, a statistical spread, does not override them.
  applyAnomaly(ctx, anom, ex, ey, width, height, palette, pRand, cell) {
    const epiX = (anom.epicenterX ?? 0.5) * width;
    const epiY = (anom.epicenterY ?? 0.5) * height;
    const dist = Math.hypot(ex - epiX, ey - epiY);
    const inZone = dist < anom.radius;
    const factor = inZone ? (1 - dist / anom.radius) : 0;
    const severity = (anom.intensity ?? 65) / 100;
    const accent = anom.accentColor || palette.accent;

    if (anom.type === "focal") {
      if (inZone) {
        cell.shape = anom.anomalousShape || "triangle";
        cell.shapeLocked = true;
        ctx.rotate((Math.PI / 4) * severity * factor);
        cell.scaleMul *= (1 + 0.35 * severity);
        if (anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; }
      }
    } else if (anom.type === "fracture") {
      const corridor = anom.radius * 0.45;
      if (inZone && Math.abs(ex - epiX) < corridor) {
        const jag = Math.sin(ey * 0.08) * (18 * severity);
        const shearY = (ey > epiY ? 1 : -1) * (36 * severity) + jag;
        const shearX = (ex > epiX ? 1 : -1) * (10 * severity);
        ctx.translate(shearX, shearY);
        ctx.rotate((factor * severity * Math.PI) / 3.2);
        if (factor > 0.4 && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; }
      }
    } else if (anom.type === "swell") {
      if (inZone) {
        const angle = Math.atan2(ey - epiY, ex - epiX);
        const push = Math.sin(factor * Math.PI) * (42 * severity);
        ctx.translate(Math.cos(angle) * push, Math.sin(angle) * push);
        const sFactor = 1 + factor * 0.55 * severity;
        ctx.scale(sFactor, sFactor);
        if (factor > 0.65 && anom.highlightColor) { cell.fg = accent; cell.fgLocked = true; }
      }
    } else if (anom.type === "tear") {
      if (factor > 0.6) {
        return false; // disintegrated void
      } else if (factor > 0.15) {
        // Shattered debris
        ctx.translate(pRand(51) * 26 * severity, pRand(52) * 26 * severity);
        ctx.rotate(pRand(53) * Math.PI * severity);
        const shrink = Math.max(0.15, 1 - factor * 0.85);
        ctx.scale(shrink, shrink);
        if (anom.highlightColor && factor > 0.3) { cell.fg = accent; cell.fgLocked = true; }
      }
    }
    return true;
  }

  // Contrast: is the module with running index `k` part of the minority?
  isContrastMinority(contrast, k) {
    const hash = Math.abs(Math.sin(k * 137.5 + 43.1) * 10000) % 100;
    return hash >= (contrast.dominanceRatio ?? 80);
  }

  // Contrast: `k` is the module's running index, used to pick the minority.
  // The "space" dimension (figure and ground reversed) is drawn by the layouts, before the module.
  applyContrast(ctx, contrast, k, palette, cell) {
    if (!this.isContrastMinority(contrast, k)) return;
    if (contrast.dimension === "scale") {
      cell.scaleMul *= contrast.scaleFactor ?? 2.2;
    } else if (contrast.dimension === "shape") {
      if (!cell.shapeLocked) cell.shape = contrast.contrastShape || "cross";
    } else if (contrast.dimension === "direction") {
      ctx.rotate(((contrast.angle ?? 45) * Math.PI) / 180);
    } else if (contrast.dimension === "tone") {
      cell.wireframe = true;
    } else if (contrast.dimension === "texture") {
      cell.texScale = 1; // only the minority is textured
    }
    if (contrast.highlightContrast && !cell.fgLocked) {
      cell.fg = contrast.accentColor || palette.accent;
    }
  }

  // Anomaly reticle guide overlay
  drawAnomalyReticle(ctx, width, height, palette, anom) {
    const epiX = (anom.epicenterX ?? 0.5) * width;
    const epiY = (anom.epicenterY ?? 0.5) * height;
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1;
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
    ctx.restore();
  }

  // Render the repetition / structural grid with similarity and gradation kinematics
  renderRepetitionGrid(ctx, width, height, palette, marginParam, usableWParam, usableHParam, targetMod = null, repConfig = null) {
    if (!targetMod || !targetMod.structure) return;
    this.cellMorph = null;
    this.cellTexScale = null;
    const rep = repConfig || targetMod.structure.repetition;
    const struct = targetMod.structure.formalStructure;
    const sim = targetMod.structure.similarity;
    const grad = targetMod.structure.gradation;
    const anom = targetMod.structure.anomaly;
    const contrast = targetMod.structure.contrast;
    const conc = targetMod.structure.concentration;

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

    // Hexagonal grid: rows interlock, so the row pitch is 0.866 of the cell width (squeezed if it does not fit)
    const isHex = rep.gridType === "hexagonal";
    const hexPitch = Math.min(colWidths[0] * 0.866, usableH / rows);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cW = colWidths[c];
        const cH = isHex ? hexPitch : rowHeights[r];
        let cx = colX[c];
        let cy = rowY[r];
        if (isHex) cy = margin + usableH / 2 + (r - (rows - 1) / 2) * hexPitch;
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
        } else if (rep.gridType === "triangular" || isHex) {
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

        // Concentration: field displacement and density
        let concAngle = 0;
        let concScaleMul = 1.0;
        if (conc && conc.enabled) {
          const f = this.applyConcentration(conc, cx, cy, width, height);
          cx = f.x;
          cy = f.y;
          concAngle = f.angle;
          concScaleMul = f.scaleMul;
        }

        const renderCell = (cellCx, cellCy, cellStartX) => {
          ctx.save();

          const isOddCell = (r + c) % 2 === 1;
          let fgColor = palette.fg;
          let bgColor = palette.bg;

          // Checkerboard inversion; Contrast > Space reverses figure and ground in the minority (the two cancel out)
          const spaceFlip = !!(contrast.enabled && contrast.dimension === "space" && this.isContrastMinority(contrast, r * cols + c));
          if ((rep.checkerInvert && isOddCell) !== spaceFlip) {
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
          this.applyGradation(ctx, grad, this.gradationPathGrid(grad, r, c, rows, cols), cW * 0.28);
        }

        // Similarity: Module Kinship & Fluctuation
        if (sim.enabled) this.applySimilarity(ctx, sim, pRand);

        // Anomaly & Contrast Modifiers
        const cell = { shape: null, wireframe: null, fg: fgColor, scaleMul: 1 };
        if (anom.enabled && !this.applyAnomaly(ctx, anom, cx, cy, width, height, palette, pRand, cell)) {
          ctx.restore();
          return;
        }
        if (contrast.enabled) this.applyContrast(ctx, contrast, r * cols + c, palette, cell);
        const cellShapeA = cell.shape;
        const cellWireframe = cell.wireframe;
        const cellFg = cell.fg;
        const cellBg = bgColor;
        const cellScaleMul = cell.scaleMul;

        const scaleUnit = 1.25 * Math.min(1.0, Math.min(width, height) / 600);
        const cellRatio = Math.min(cW / usableW, cH / usableH);
        const normScale = scaleUnit * cellRatio * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul);
        if (cell.texScale) this.cellTexScale = Math.max(this.cellTexScale || 0, cell.texScale);
        this.cellSeed = r * cols + c + 1;
        this.cellAlt = (r + c) % 2 === 1;
        // Reflection: mirror the module in alternate columns and/or rows
        const refl = rep.reflection || "none";
        if ((refl === "columns" || refl === "both") && c % 2 === 1) ctx.scale(-1, 1);
        if ((refl === "rows" || refl === "both") && r % 2 === 1) ctx.scale(1, -1);
        const lineWidthMul = (cellShapeA || targetMod.shape) === "line" ? scaleUnit * (cW / usableW) * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul) : null;
        this.drawSingleLayerShape(ctx, targetMod, normScale, cellFg, cellBg, cellWireframe, cellShapeA, false, cellFg !== fgColor ? cellFg : null, lineWidthMul);
        ctx.restore();
      };

      // Draw primary cell
      renderCell(cx, cy, startX);

      // Hexagonal grid: the half-cell shift pushes the last cell out, so it also appears at the left edge
      if (isHex && r % 2 === 1 && c === cols - 1) {
        renderCell(cx - usableW, cy, startX - usableW);
      }

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
      // Tone: faint guide, positive (drawn in ink) or negative (drawn in the ground colour, cutting the modules)
      const tone = rep.lineTone || "guide";
      ctx.strokeStyle = tone === "positive" ? (targetMod.color || palette.fg)
        : tone === "negative" ? palette.bg
        : (palette.isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(24, 24, 31, 0.35)");
      ctx.lineWidth = struct && struct.enabled && struct.showBands ? struct.bandThickness : (rep.gridLineWidth || 1.2);
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
            const y = r === rows ? margin + usableH : rowStarts[r];
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
              if (alt && c % 2 === 1) continue;
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
        } else if (showV) {
          // Draw vertical / deformed lines
          for (let c = 0; c <= cols; c++) {
            if (alt && c % 2 === 1) continue;
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
              for (let st = 1; st <= steps; st++) {
                const frac = st / steps;
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
      }

      ctx.restore();
    }

    // Anomaly reticle guide overlay
    if (anom.enabled && anom.showReticle) this.drawAnomalyReticle(ctx, width, height, palette, anom);

    // Concentration attractor guide overlay
    if (conc && conc.enabled && conc.showAttractor) {
      this.drawAttractorGuide(ctx, width, height, palette, conc);
    }
  }

  // Render the polar radiation layout (Radiation)
  renderRadiation(ctx, width, height, palette, marginParam, usableWParam, usableHParam, targetMod = null, radConfig = null) {
    if (!targetMod || !targetMod.structure) return;
    this.cellMorph = null;
    this.cellTexScale = null;
    const rad = radConfig || targetMod.structure.radiation;
    const grad = targetMod.structure.gradation;
    const sim = targetMod.structure.similarity;
    const anom = targetMod.structure.anomaly;
    const contrast = targetMod.structure.contrast;
    const conc = targetMod.structure.concentration;

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
    // Open center: the rings start at the hole radius instead of the centre
    const openR = maxR * Math.max(0, Math.min(70, rad.centerOpen || 0)) / 100;
    const span = maxR - openR;
    // Each ring is turned a bit more than the one inside it, so their subdivisions do not line up
    const ringRotRad = ((rad.ringRotation || 0) * Math.PI) / 180;

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

          const x = center.x + ringRadius * Math.cos(angle);
          const y = center.y + ringRadius * Math.sin(angle);

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
          }

          // Soft edge bounding so modules stay comfortably within the canvas
          const safePad = Math.max(12, margin * 0.4);
          posX = Math.max(safePad, Math.min(width - safePad, posX));
          posY = Math.max(safePad, Math.min(height - safePad, posY));

          ctx.save();

          // The polar sector of this module (used to clip it and to reverse figure and ground)
          const sectorPath = () => {
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
          };

          // Active clipping: restrict drawing strictly to polar sector boundaries
          if (rad.activeClipping) {
            sectorPath();
            ctx.clip();
          }

          // Contrast > Space: the minority is drawn with figure and ground reversed
          const spaceFlip = !!(contrast.enabled && contrast.dimension === "space" && this.isContrastMinority(contrast, centerIdx * 1000 + i * rays + j));
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

          if (sim && sim.enabled && sim.cellJitter > 0) {
            posX += pRand(10) * sim.cellJitter;
            posY += pRand(11) * sim.cellJitter;
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

          // Gradation on polar radiation (drift slides along the module's local x axis, up to ~one ring)
          if (grad.enabled) {
            this.applyGradation(ctx, grad, this.gradationPathRadial(grad, i, j, rings, rays), (span / rings) * 0.9);
          }

          // Similarity on radiation
          if (sim.enabled) this.applySimilarity(ctx, sim, pRand);

          // Anomaly & Contrast on radiation module
          const cell = { shape: null, wireframe: null, fg: spaceFlip ? palette.bg : palette.fg, scaleMul: 1 };
          if (anom.enabled && !this.applyAnomaly(ctx, anom, x, y, width, height, palette, pRand, cell)) {
            ctx.restore();
            continue;
          }
          if (contrast.enabled) this.applyContrast(ctx, contrast, centerIdx * 1000 + i * rays + j, palette, cell);
          const cellShapeA = cell.shape;
          const cellWireframe = cell.wireframe;
          const cellFg = cell.fg;
          const cellBg = spaceFlip ? palette.fg : palette.bg;
          const cellScaleMul = cell.scaleMul;

          // Natural centrifugal growth scale: outer modules larger, inner smaller, proportional to sector size
          const scaleUnit = 1.25 * Math.min(1.0, Math.min(width, height) / 600);
          const ringThickness = span / rings;
          const arcWidth = (ringRadius * 2 * Math.PI) / rays;
          const sectorSize = Math.min(ringThickness, Math.max(ringThickness * 0.5, arcWidth));
          const sectorRatio = sectorSize / usableW;
          const growthFactor = 0.75 + (i / rings) * 0.45;
          const radScaleMul = isMultiCenter ? 0.7 : 1.0;
          const normScale = scaleUnit * sectorRatio * growthFactor * radScaleMul * Math.min(MAX_SCALE_MUL, cellScaleMul * concScaleMul);
          if (cell.texScale) this.cellTexScale = Math.max(this.cellTexScale || 0, cell.texScale);
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
          if (openR > 0.5) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, openR, 0, Math.PI * 2);
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
              ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
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
                ctx.moveTo(center.x + ra * Math.cos(aa), center.y + ra * Math.sin(aa));
                ctx.lineTo(center.x + rb * Math.cos(ab), center.y + rb * Math.sin(ab));
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
              ctx.moveTo(center.x + openR * Math.cos(baseAngle), center.y + openR * Math.sin(baseAngle));
              ctx.lineTo(center.x + maxR * Math.cos(baseAngle), center.y + maxR * Math.sin(baseAngle));
            }
            ctx.stroke();
          }
        }
      });

      ctx.restore();
    }

    // Anomaly reticle guide overlay on radiation
    if (anom.enabled && anom.showReticle) this.drawAnomalyReticle(ctx, width, height, palette, anom);

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

    // 2.5 Isometric Drafting Guides (Space): drawn once if any visible layer asks for them
    const showIsoGuides = this.getLayers().some(l => l.visible !== false && l.structure?.space?.enabled && l.structure.space.showIsoGuides);
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
    if (!anyLayerStructure) {
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

