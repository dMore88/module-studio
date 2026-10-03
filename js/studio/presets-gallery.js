/**
 * MODULE STUDIO — Presets Gallery
 * Curated parametric compositions across Bauhaus, Swiss, Op-Art, and Kinetic aesthetics.
 */

export const STUDIO_PRESETS = [
  {
    id: "nautilus_spiral",
    name: "Nautilus Kinetic Spiral",
    category: "Radial & Polar",
    description: "Centrifugal spiral radiation with logarithmic twist and crescent union.",
    state: {
      aspectRatio: "1:1",
      paletteId: "inverted",
      formA: { shape: "circle", scale: 95, width: 95, height: 95, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: true, shape: "crescent", scale: 75, width: 75, height: 75, rotation: 45, offsetX: 25, offsetY: 0 },
      interrelation: "union",
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: false, gridType: "basic", cols: 4, rows: 4, spacing: 0, shearAngle: 15, slideOffset: 0.5, curveIntensity: 18, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: true, type: "scale", pathway: "concentric", range: 120, steps: 1, reverse: false },
        radiation: { enabled: true, scheme: "spiral", rays: 16, rings: 6, spiralTwist: 60, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle_eq", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "star4", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, target: "shapes", mode: "grain", density: 50, scale: 14, contrast: 40 },
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
      formA: { shape: "star4", scale: 70, width: 70, height: 70, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: true, shape: "rhombus", scale: 65, width: 65, height: 65, rotation: 45, offsetX: 0, offsetY: 0 },
      interrelation: "intersection",
      invertFigureGround: false,
      wireframe: true,
      modifiers: {
        repetition: { enabled: false, gridType: "basic", cols: 4, rows: 4, spacing: 0, shearAngle: 15, slideOffset: 0.5, curveIntensity: 18, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: true, scheme: "multi_center", rays: 24, rings: 7, spiralTwist: -35, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle_eq", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "star4", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, target: "shapes", mode: "grain", density: 50, scale: 14, contrast: 40 },
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
    description: "Orthogonal structural tension with boolean circular bite and primary contrast.",
    state: {
      aspectRatio: "3:4",
      paletteId: "bauhaus",
      formA: { shape: "square", scale: 115, width: 115, height: 115, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: true, shape: "circle", scale: 90, width: 90, height: 90, rotation: 0, offsetX: 45, offsetY: 0 },
      interrelation: "subtraction",
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "basic", cols: 3, rows: 4, spacing: 24, shearAngle: 0, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: true, type: "rotation", pathway: "diagonal", range: 90, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle_eq", highlightColor: true, showReticle: false },
        contrast: { enabled: true, dimension: "direction", dominanceRatio: 75, contrastShape: "star4", scaleFactor: 1.0, angle: 45, highlightContrast: true },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, target: "shapes", mode: "grain", density: 50, scale: 14, contrast: 40 },
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
      formA: { shape: "square", scale: 65, width: 65, height: 65, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: false, shape: "circle", scale: 50, width: 50, height: 50, rotation: 0, offsetX: 20, offsetY: 0 },
      interrelation: "overlapping",
      invertFigureGround: true,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "sheared", cols: 7, rows: 7, spacing: 10, shearAngle: 15, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: true, type: "fracture", epicenterX: 0.5, epicenterY: 0.5, radius: 220, intensity: 85, anomalousShape: "cross", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "star4", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, target: "shapes", mode: "grain", density: 50, scale: 14, contrast: 40 },
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
      formA: { shape: "triangle", scale: 50, width: 50, height: 50, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: false, shape: "circle", scale: 40, width: 40, height: 40, rotation: 0, offsetX: 0, offsetY: 0 },
      interrelation: "overlapping",
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "sliding", cols: 8, rows: 14, spacing: 4, shearAngle: 0, slideOffset: 0.5, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: true, kinshipType: "rotation_wobble", intensity: 25, cellJitter: 0, seed: 88 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle_eq", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "star4", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: true, mode: "point", attractorX: 0.5, attractorY: 0.45, power: 85, radius: 340, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, target: "shapes", mode: "grain", density: 50, scale: 14, contrast: 40 },
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
      formA: { shape: "hexagon", scale: 110, width: 110, height: 110, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: true, shape: "circle", scale: 80, width: 80, height: 80, rotation: 0, offsetX: 0, offsetY: 0 },
      interrelation: "penetration",
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "basic", cols: 4, rows: 3, spacing: 30, shearAngle: 0, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle_eq", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "star4", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: true, target: "both", mode: "grain", density: 60, scale: 16, contrast: 45 },
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
      formA: { shape: "cross", scale: 45, width: 45, height: 45, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: false, shape: "circle", scale: 35, width: 35, height: 35, rotation: 0, offsetX: 0, offsetY: 0 },
      interrelation: "overlapping",
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "curved", cols: 12, rows: 6, spacing: 6, shearAngle: 0, slideOffset: 0, curveIntensity: 28, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: true, type: "rotation", pathway: "diagonal", range: 180, steps: 2, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle_eq", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "star4", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, target: "shapes", mode: "grain", density: 50, scale: 14, contrast: 40 },
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
      formA: { shape: "rhombus", scale: 80, width: 80, height: 80, rotation: 0, offsetX: 0, offsetY: 0 },
      formB: { enabled: true, shape: "circle", scale: 50, width: 50, height: 50, rotation: 0, offsetX: 0, offsetY: 0 },
      interrelation: "detachment",
      invertFigureGround: false,
      wireframe: false,
      modifiers: {
        repetition: { enabled: true, gridType: "basic", cols: 5, rows: 6, spacing: 12, shearAngle: 0, slideOffset: 0, curveIntensity: 0, activeClipping: false, showGridLines: false, gridLineWidth: 1.5, checkerInvert: false },
        structure: { enabled: true, mode: "rhythmic", colRatio: 2.2, rowRatio: 1.6, bandThickness: 2, showBands: true },
        similarity: { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 },
        gradation: { enabled: false, type: "rotation", pathway: "diagonal", range: 180, steps: 1, reverse: false },
        radiation: { enabled: false, scheme: "centrifugal", rays: 12, rings: 5, spiralTwist: 45, activeClipping: false, showRays: false, showRings: false, centerX: 0, centerY: 0 },
        anomaly: { enabled: false, type: "focal", epicenterX: 0.5, epicenterY: 0.5, radius: 160, intensity: 65, anomalousShape: "triangle_eq", highlightColor: true, showReticle: false },
        contrast: { enabled: false, dimension: "scale", dominanceRatio: 80, contrastShape: "star4", scaleFactor: 2.2, angle: 45, highlightContrast: false },
        concentration: { enabled: false, mode: "point", attractorX: 0.5, attractorY: 0.5, power: 65, radius: 240, lineAxis: "horizontal", alignToField: true, densityScale: true, showAttractor: false },
        texture: { enabled: false, target: "shapes", mode: "grain", density: 50, scale: 14, contrast: 40 },
        space: { enabled: false, mode: "isometric", depth: 35, angle: 30, shading: 65, showIsoGuides: false }
      },
      showSafeBounds: true,
      zoomLevel: 1.0
    }
  }
];
