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
  help: {
    is: "Contrast appears when elements of a design differ in a visual quality: form, size, direction, position, color, texture or space. The difference lets some elements stand out against the rest and gives the design a focus.",
    does: "Turns a minority of modules into the contrasting ones. Minority chooses the quality that changes; Proportion decides how many modules change and where." },
  banner: { id: "warning-contrast-grid", text: "Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Minority", help: {
        is: "The minority is the group of elements that departs from the rest. The quality in which it departs is the dimension of the contrast: a larger scale, another shape, a turned angle, a shifted position, a different tone.",
        does: "Dimension picks the quality that differs (Scale, Shape, Angle, Position, Tone, Texture, Space). The values that appear below set how strong the difference is." }, controls: [
      { type: "dropdown", label: "Dimension", key: "dimension", attr: "data-contrast-dimension", history: "Dimension",
        options: [["scale", "Scale"], ["shape", "Shape"], ["direction", "Angle"], ["position", "Position"], ["tone", "Tone"], ["texture", "Texture"], ["space", "Space"]] },
      { type: "dropdown", label: "Minority Shape", key: "contrastShape", attr: "data-contrast-shape", history: "Shape", options: "shapes", blockId: "contrast-shape-block", show: (st) => st.dimension === "shape" },
    ] },
    { title: "Proportion", help: {
        is: "The strength of a contrast depends on proportion: a few different elements among many alike stand out more than an even split between the two.",
        does: "Minority spread sets where the minority sits (scattered, balanced, toward the edges or the center); Dominance ratio sets the share of modules that stays like the rest; the accent color can mark the minority." }, controls: [
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
