/**
 * The Similarity panel, described as data (see panel-builder.js): the Visual kinship type and the Fluctuation intensity, the
 * Association (family of shapes) with its mix, and the Imperfection (cut or broken) with its amount; in Imperfection's Advanced
 * controls, the Spatial cell jitter (stored as a share of the cell; a project saved in pixels is shown as a share without touching the file).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const SIMILARITY_PANEL = {
  id: "similarity", cardId: "card-similarity", name: "Similarity",
  // the settings object is created when the layer has none yet
  state: (app) => {
    const mod = app.getActiveModule();
    if (!mod) return null;
    if (!mod.structure) mod.structure = app.getActiveLayerStructure();
    if (!mod.structure.similarity) mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
    return mod.structure.similarity;
  },
  enabled: { id: "toggle-similarity-active", key: "enabled" },
  badgeId: "badge-similarity-layer",
  banner: { id: "warning-similarity-grid", text: "Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.", hidden: (mod) => !!(mod.structure && mod.structure.enabled) },
  groups: [
    { title: "Kinship", controls: [
      { type: "dropdown", label: "Visual kinship type", key: "kinshipType", attr: "data-kinship-type", history: "Kinship Type", fallback: "distortion",
        options: [["distortion", "Elastic"], ["foreshortening", "3D tilt"], ["rotation_wobble", "Wobble"], ["scale_kinship", "Scale"], ["hybrid", "Hybrid"]] },
      { type: "slider", id: "sim-intensity", label: "Fluctuation intensity", key: "intensity", min: 0, max: 100, step: 1, value: 50, suffix: "%", decimal: true, history: "Intensity" },
    ] },
    { title: "Association", controls: [
      { type: "dropdown", label: "Association (family of shapes)", key: "association", attr: "data-sim-assoc", history: "Association", fallback: "none",
        options: [["none", "None"], ["round", "Round"], ["angular", "Angular"], ["lines", "Lines"], ["characters", "Characters"]] },
      { type: "slider", id: "sim-assoc-mix", label: "Association mix", key: "assocMix", min: 0, max: 100, step: 1, value: 50, suffix: "%", decimal: true, history: "Association Mix", blockId: "sim-assoc-block", show: (st) => (st.association || "none") !== "none" },
    ] },
    { title: "Imperfection", advId: "sim-adv-imperf", controls: [
      { type: "dropdown", label: "Imperfection", key: "imperfection", attr: "data-sim-imperf", history: "Imperfection", fallback: "none",
        options: [["none", "None"], ["cut", "Cut"], ["broken", "Broken"]] },
      { type: "slider", id: "sim-imperf-amount", label: "Imperfect modules", key: "imperfAmount", min: 0, max: 100, step: 1, value: 30, suffix: "%", decimal: true, history: "Imperfect Modules", blockId: "sim-imperf-block", show: (st) => (st.imperfection || "none") !== "none" },
      { type: "slider", id: "sim-jitter", label: "Spatial cell jitter", min: 0, max: 90, step: 1, value: 0, suffix: "%", decimal: true, history: "Cell Jitter", advanced: true,
        get: (st, app) => (st.cellJitterAmount > 0 ? Math.round(st.cellJitterAmount * 100)
          : Math.min(90, Math.round(((st.cellJitter || 0) / (300 / Math.max(1, app.getActiveLayerStructure()?.repetition?.cols || 4))) * 100))),
        set: (st, v) => { st.cellJitterAmount = Math.max(0, Math.min(90, v)) / 100; st.cellJitter = 0; } },
    ] },
  ],
};

class PanelSimilarity {
  syncSimilarityInspectorWithActiveLayer() { this.syncDataPanel(SIMILARITY_PANEL); }

  setupSimilarity() { this.bindDataPanel(SIMILARITY_PANEL); }
}
