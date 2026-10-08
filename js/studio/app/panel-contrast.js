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
