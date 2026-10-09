/**
 * The Anomaly panel, described as data (see panel-builder.js): the Type (Focal, Rupture, Swell, Void, Another grid), where and how the
 * anomaly is spread, what it deviates in, its focal intruder shape, Radius, Severity, the accent colour and the focal point reticle.
 * Each type and distribution only shows the controls it needs. Clicking the canvas while the Anomaly tab is open sets the focal point.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const ANOMALY_PANEL = {
  id: "anomaly", cardId: "card-anomaly", name: "Anomaly",
  state: (app) => app.getActiveAnomaly(),
  enabled: { id: "toggle-anomaly-active", key: "enabled" },
  badgeId: "badge-anomaly-layer",
  help: {
    is: "An anomaly is an irregularity in a regular structure: a break in the pattern that draws the eye.",
    does: "Introduces a zone where the modules depart from the structure. Anomaly picks the kind of break; Zone sets where and how strong it is." },
  banner: { id: "warning-anomaly-grid", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Anomaly", help: {
        is: "The kind of break decides how the structure is disturbed: a module that intrudes, a rupture, a swelling, a void or another grid.",
        does: "Type picks the kind of break; Deviates in picks which properties change (and the intruder's shape, with Focal). With Another grid, the zone follows a different grid." }, controls: [
      { type: "tags", label: "Type", key: "type", attr: "data-anom-type", history: "Type",
        options: [["focal", "Focal"], ["fracture", "Rupture"], ["swell", "Swell"], ["tear", "Void"], ["regrid", "Another grid"]] },
      // "Another grid": the zone only needs its grid variation, position and radius
      { type: "dropdown", label: "Grid inside the zone", key: "zoneGrid", attr: "data-anom-zonegrid", history: "Zone Grid", fallback: "sliding", blockId: "anom-zonegrid-block", show: (st) => st.type === "regrid",
        options: [["sliding", "Brick"], ["sheared", "Diagonal"], ["curved", "Curved"], ["zigzag", "Zigzag"], ["triangular", "Triangular"], ["alternating", "Alternating"]] },
      // The attributes each anomaly type can deviate in
      { type: "chips", label: "Deviates in", attr: "data-anom-attr", blockId: "anom-attrs-block", enable: (st) => st.type !== "regrid", why: "With Another grid only the grid of the zone counts",
        nested: { key: "attrs", defaults: { shape: true, scale: true, rotation: true, position: true }, history: "Deviates in" },
        options: ["shape", "scale", "rotation", "position"].map(k => ({ key: k, text: k[0].toUpperCase() + k.slice(1), enable: (st) => (StudioProApp.ANOMALY_ATTRS[st.type] || []).includes(k), why: "This type does not change this property" })) },
      { type: "dropdown", label: "Focal Intruder Shape", key: "anomalousShape", attr: "data-anom-shape", history: "Shape", options: "shapes", blockId: "anom-shape-block",
        show: (st) => st.type === "focal" && (st.attrs || {}).shape !== false },
    ] },
    { title: "Zone", help: {
        is: "The zone is the area where the irregularity acts; its size and how it is spread decide how much of the structure it disturbs.",
        does: "Distribution sets one zone or several; Radius and Severity set the size and strength of the break." }, controls: [
      { type: "tags", label: "Distribution", key: "distribution", attr: "data-anom-dist", history: "Distribution", fallback: "single",
        options: [["single", "Single"], ["regular", "Scattered regular"], ["random", "Scattered random"]] },
      { type: "hint", text: "Click anywhere on the canvas to set focal point", blockId: "anom-position-block", show: (st) => (st.distribution || "single") === "single" },
      { type: "slider", id: "anom-count", label: "Count", key: "count", min: 1, max: 10, step: 1, value: 5, suffix: "", history: "Count", blockId: "anom-count-block", show: (st) => (st.distribution || "single") !== "single" },
      { type: "slider", id: "anom-seed", label: "Seed", key: "seed", min: 1, max: 99, step: 1, value: 7, suffix: "", history: "Seed", blockId: "anom-seed-block", show: (st) => st.distribution === "random" },
      { type: "slider", id: "anom-radius", label: "Radius", key: "radius", min: 10, max: 350, step: 5, value: 150, suffix: "px", history: "Radius" },
      { type: "slider", id: "anom-intensity", label: "Severity", key: "intensity", min: 5, max: 100, step: 1, value: 60, suffix: "%", history: "Severity", blockId: "anom-severity-block", enable: (st) => st.type !== "regrid", why: "With Another grid only the grid of the zone counts" },
      { type: "accent", prefix: "anom", colorKey: "accentColor", flagKey: "highlightColor" },
      { type: "toggle", id: "toggle-anom-reticle", label: "Show focal point", key: "showReticle", history: "Reticle" },
    ] },
  ],
};

class PanelAnomaly {
  getActiveAnomaly() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.anomaly : null;
  }

  // Attributes each anomaly type can deviate in
  static get ANOMALY_ATTRS() {
    return {
      focal: ["shape", "scale", "rotation"],
      fracture: ["position", "rotation"],
      swell: ["position", "scale"],
      tear: ["position", "rotation", "scale"],
      regrid: []
    };
  }

  syncAnomalyInspectorWithActiveLayer() { this.syncDataPanel(ANOMALY_PANEL); }

  setupAnomaly() {
    const commit = this.bindDataPanel(ANOMALY_PANEL);
    // Click on the canvas sets the focal point while the Anomaly tab is open.
    this.canvas?.addEventListener("click", (e) => {
      if (!this.isFlyoutOpen || this.activeRailTab !== "anomaly") return;
      if ((this.getActiveAnomaly()?.distribution || "single") !== "single") return; // scattered layouts have no single focal point
      const at = this.layoutPointFromClick(e);
      const nx = Math.max(0.1, Math.min(0.9, at.x));
      const ny = Math.max(0.1, Math.min(0.9, at.y));
      commit(a => { a.epicenterX = nx; a.epicenterY = ny; }, "Anomaly Focal Point");
    });
  }
}
