// Studio Composition Engine: Unified Grammar Pipeline for Wucius Wong 2D Design
import { Shapes, texturedShape, morphedShape, compositeShape, clippedShape, resolveFigures } from './shapes.js';
import { CanvasUtils } from '../canvas-utils.js';

export const createDefaultLayerStructure = () => ({
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

export const createDefaultLayer = (id = "layer-1", name = "Layer 1", shape = "circle", offsetX = 0, offsetY = 0, rotation = 0) => ({
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

export const defaultStudioState = {
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

export class StudioEngine {
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
    const figs = resolveFigures(mod.figures).map(f => ({ ...f, relation: "free" })); // placed already: a run is not related to what is in another
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

