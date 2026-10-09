/**
 * The Space panel, described as data (see panel-builder.js): Mode (Isometric, 3D tilt, Fluctuating, Paradox), Extrusion depth,
 * Projection angle, Facet shading contrast and the 30º isometric grid lines. Autonomous modifier: no Repetition / Radiation required.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const SPACE_PANEL = {
  id: "space", cardId: "card-space", name: "Space",
  state: (app) => app.getActiveSpace(),
  enabled: { id: "toggle-space-active", key: "enabled" },
  badgeId: "badge-space-layer",
  help: {
    is: "Space is the illusion of depth on a flat surface: a form seems to step forward, recede or turn.",
    does: "Gives the module volume by extruding it. Space picks the kind of depth; Depth sets how far it extends and how it is lit." },
  groups: [
    { title: "Space", help: {
        is: "Different ways of showing depth read differently: an isometric view keeps parallel lines, a tilt turns the form, and a paradox contradicts itself.",
        does: "Mode picks the kind of space: Isometric, 3D tilt, Fluctuating or Paradox." }, controls: [
      { type: "dropdown", label: "Mode", key: "mode", attr: "data-space-mode", history: "Mode",
        options: [["isometric", "Isometric"], ["foreshortening", "3D tilt"], ["fluctuating", "Fluctuating"], ["conflicting", "Paradox"]] },
    ] },
    { title: "Depth", help: {
        is: "Depth is how far a form seems to extend behind its front, and how its faces are shaded.",
        does: "Extrusion depth sets the length, Projection angle the direction, and Facet shading contrast how different the faces look." }, controls: [
      { type: "slider", id: "space-depth", label: "Extrusion depth", key: "depthPct", min: 5, max: 100, step: 1, value: 20, suffix: "%", history: "Depth" },
      { type: "slider", id: "space-angle", label: "Projection angle", key: "angle", min: -180, max: 180, step: 1, value: 30, suffix: "º", history: "Angle" },
      { type: "slider", id: "space-shading", label: "Facet shading contrast", key: "shading", min: 5, max: 100, step: 1, value: 50, suffix: "%", history: "Shading" },
      { type: "toggle", id: "toggle-space-guides", label: "Display 30º Isometric Grid Lines", key: "showIsoGuides", history: "Iso Guides" },
    ] },
  ],
};

class PanelSpace {
  getActiveSpace() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.space : null;
  }

  syncSpaceInspectorWithActiveLayer() { this.syncDataPanel(SPACE_PANEL); }

  setupSpace() { this.bindDataPanel(SPACE_PANEL); }
}
