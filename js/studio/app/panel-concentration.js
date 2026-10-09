/**
 * The Concentration panel, described as data (see panel-builder.js): Structure (Point, Void, Line, Hotspots, Dense, Sparse),
 * X/Y position, Gathering pull, Field radius, field style chips, Attractor guide.
 * Clicking the canvas while the Concentration tab is open moves the attractor.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const CONC_WHOLE = (st) => st.mode === "dense" || st.mode === "sparse"; // the whole-design modes have no field radius and no absence method
const CONCENTRATION_PANEL = {
  id: "concentration", cardId: "card-concentration", name: "Concentration",
  state: (app) => app.getActiveConcentration(),
  enabled: { id: "toggle-concentration-active", key: "enabled" },
  badgeId: "badge-concentration-layer",
  help: {
    is: "Concentration is the gathering of elements in one part of a design and their scarcity in another: density builds focus and rest.",
    does: "Attracts or repels modules around a point, a line or several hotspots. Concentration picks the structure; Strength sets its pull and its reach." },
  banner: { id: "warning-concentration-grid", hidden: (mod) => !!mod.structure.enabled },
  groups: [
    { title: "Concentration", help: {
        is: "Elements can gather around a point, keep away from it, follow a line or form several spots, or thin out across the whole design.",
        does: "Structure picks how they gather; Method moves modules or removes them; Field style shapes how the density fades." }, controls: [
      { type: "dropdown", label: "Structure", key: "mode", attr: "data-conc-mode", history: "Structure",
        options: [["point", "Point"], ["void", "Void"], ["line", "Line"], ["line_void", "Away from line"], ["free", "Hotspots"], ["dense", "Dense"], ["sparse", "Sparse"]] },
      { type: "dropdown", label: "Method", key: "method", attr: "data-conc-method", history: "Method", fallback: "move", blockId: "conc-method-block", enable: (st) => !CONC_WHOLE(st), why: "Dense and Sparse work on the whole design",
        options: [["move", "Move"], ["absence", "Absence"]] },
      { type: "dropdown", label: "Line axis", key: "lineAxis", attr: "data-conc-axis", history: "Axis", blockId: "conc-axis-block", show: (st) => st.mode === "line" || st.mode === "line_void",
        options: [["horizontal", "Horizontal"], ["vertical", "Vertical"]] },
      { type: "chips", label: "Field style", attr: "data-conc-flag", options: [
        { key: "edgeFade", text: "Soft edge", id: "conc-fade-block", enable: (st) => CONC_WHOLE(st), why: "Only with Dense or Sparse" },
        { key: "alignToField", text: "Flowing" },
        { key: "densityScale", text: "Dynamic density" } ] },
      { type: "slider", id: "conc-foci", label: "Number of hotspots", key: "focusCount", min: 2, max: 8, step: 1, value: 2, suffix: "", history: "Foci", blockId: "conc-foci-block", show: (st) => st.mode === "free" },
      { type: "slider", id: "conc-x", label: "X position", key: "attractorX", min: 0, max: 100, step: 1, value: 50, suffix: "%", divisor: 100, fallback: 0.5, history: "X" },
      { type: "slider", id: "conc-y", label: "Y position", key: "attractorY", min: 0, max: 100, step: 1, value: 50, suffix: "%", divisor: 100, fallback: 0.5, history: "Y" },
      { type: "hint", text: "Click anywhere on the canvas to reposition the attractor" },
    ] },
    { title: "Strength", help: {
        is: "How strongly elements gather depends on the pull of their center and how far its reach goes.",
        does: "Gathering pull sets how strongly modules are drawn; Field radius sets how far the effect reaches; the attractor guide marks its center on screen." }, controls: [
      { type: "slider", id: "conc-power", label: "Gathering pull", key: "power", min: 10, max: 100, step: 1, value: 50, suffix: "%", history: "Pull" },
      { type: "slider", id: "conc-radius", label: "Field radius", key: "radius", min: 10, max: 500, step: 5, value: 250, suffix: "px", history: "Radius", blockId: "conc-radius-field", enable: (st) => !CONC_WHOLE(st), why: "Dense and Sparse work on the whole design" },
      { type: "toggle", id: "toggle-conc-guide", label: "Display Attractor Guide", key: "showAttractor", history: "Attractor Guide" },
    ] },
  ],
};

class PanelConcentration {
  getActiveConcentration() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.concentration : null;
  }

  syncConcentrationInspectorWithActiveLayer() { this.syncDataPanel(CONCENTRATION_PANEL); }

  setupConcentration() {
    const commit = this.bindDataPanel(CONCENTRATION_PANEL);
    // Click on the canvas moves the attractor while the Concentration tab is open.
    this.canvas?.addEventListener("click", (e) => {
      if (!this.isFlyoutOpen || this.activeRailTab !== "concentration") return;
      const at = this.layoutPointFromClick(e);
      const nx = Math.max(0, Math.min(1, at.x));
      const ny = Math.max(0, Math.min(1, at.y));
      commit(c => { c.attractorX = nx; c.attractorY = ny; }, "Concentration Attractor");
    });
  }
}
