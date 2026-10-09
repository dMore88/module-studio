/**
 * The Gradation panel, described as data (see panel-builder.js): the Attribute that changes along the path (Rotate, Scale, Depth, Drift,
 * Shape, Texture, Color), the Pathway direction, Range and Cycles, and in each group's Advanced controls the Sequence, the checkboxes and
 * the Speed. Also holds the guide and accent colour helpers it shares with other panels.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const GRADATION_PANEL = {
  id: "gradation", cardId: "card-gradation", name: "Gradation",
  state: (app) => app.getActiveGradation(),
  enabled: { id: "toggle-gradation-active", key: "enabled" },
  badgeId: "badge-gradation-layer",
  help: {
    is: "Gradation is a gradual change from one state to another, step by step: it gives a design depth, direction and movement.",
    does: "Makes one attribute of the module change along a path across the structure. Attribute picks what changes, Path where, and Progression how much and how fast." },
  banner: { id: "warning-gradation-grid", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Attribute", help: {
        is: "Any quality of a module can be graded: its size, its turn, its position, its shape or its color.",
        does: "Picks the attribute that changes. Some attributes ask for a second value, such as the end color or the shape it becomes." }, controls: [
      { type: "dropdown", label: "Attribute", key: "type", attr: "data-grad-type", history: "Attribute",
        options: [["rotation", "Rotate"], ["scale", "Scale"], ["depth", "Depth"], ["drift", "Drift"], ["shape", "Shape"], ["texture", "Texture"], ["color", "Color"]] },
      { type: "color", prefix: "grad", label: "End color", key: "endColor", fallback: "#f43f5e", history: "End Color", blockId: "grad-color-block", show: (st) => st.type === "color" },
      { type: "dropdown", label: "Becomes", key: "targetShape", attr: "data-grad-target", history: "Becomes", fallback: "triangle", options: "shapes", blockId: "grad-target-block", show: (st) => st.type === "shape" },
    ] },
    { title: "Path", help: {
        is: "A gradation follows a path: the direction along which the change advances.",
        does: "Pathway direction picks the path across the structure. Advanced controls set how it restarts or bounces back, reverse it and alternate rows." }, advId: "grad-adv-path", controls: [
      { type: "dropdown", label: "Pathway direction", key: "pathway", attr: "data-grad-pathway", history: "Pathway",
        options: [["diagonal", "Diagonal"], ["horizontal", "Horizontal"], ["vertical", "Vertical"], ["concentric", "Concentric"], ["zigzag", "Zigzag"]] },
      { type: "dropdown", label: "Sequence", key: "sequence", attr: "data-grad-sequence", history: "Sequence", fallback: "restart", advanced: true,
        options: [["restart", "Restart"], ["pingpong", "Ping-pong"]] },
      // Alternate rows has nothing to do on the snake path, which already runs back and forth
      { type: "toggle", id: "toggle-grad-alternate", label: "Alternate rows", key: "alternate", history: "Alternate", advanced: true,
        enable: (st) => st.pathway !== "zigzag", why: "The zigzag path already runs back and forth" },
      { type: "toggle", id: "toggle-grad-reverse", label: "Reverse Gradient Direction", key: "reverse", history: "Reverse", advanced: true },
    ] },
    { title: "Progression", help: {
        is: "The progression is how far and how fast the change advances from the first module to the last.",
        does: "Range sets the total change; Cycles repeats the change along the path. Speed, in Advanced controls, makes it arrive early or late." }, advId: "grad-adv-prog", controls: [
      { type: "slider", id: "grad-range", label: "Range", key: "range", min: 5, max: 360, step: 5, value: 180, suffix: "º", history: "Range" },
      { type: "slider", id: "grad-steps", label: "Cycles", key: "steps", min: 1, max: 10, step: 1, value: 1, suffix: "", history: "Cycles" },
      // Speed is shown the other way round from the stored easing: + reaches the full effect early, - late
      { type: "slider", id: "grad-easing", label: "Speed", key: "easing", min: -100, max: 100, step: 5, value: 0, suffix: "", invert: true, signed: true, history: "Speed", advanced: true },
    ] },
  ],
};

class PanelGradation {
  getActiveGradation() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.gradation : null;
  }

  syncGradationInspectorWithActiveLayer() { this.syncDataPanel(GRADATION_PANEL); }

  setupGradation() { this.bindDataPanel(GRADATION_PANEL); }

  // Accent color row (swatch + hex) shared by modifiers that can highlight elements.
  syncGuideColor() {
    const color = this.engine.guideColor();
    const input = document.getElementById("input-guide-color");
    if (input) input.value = color;
    document.getElementById("btn-guide-color")?.style.setProperty("--guide-color", color);
  }

  syncAccentColorRow(prefix, color, active) {
    const hex = (color || "#f43f5e").toUpperCase();
    const input = document.getElementById(`${prefix}-accent-color`);
    if (input) input.value = hex.toLowerCase();
    const swatch = document.getElementById(`${prefix}-accent-swatch`);
    if (swatch) swatch.style.backgroundColor = hex;
    const label = document.getElementById(`${prefix}-accent-hex`);
    if (label) label.textContent = prefix.endsWith("line") || active ? hex : "None";
    document.getElementById(`${prefix}-accent-row`)?.classList.toggle("is-dimmed", !active);
  }
}
