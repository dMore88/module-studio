/**
 * The Contrast panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class PanelContrast {
  /* =========================================================================
     CONTRAST INSPECTOR & CONTROLLER (Per Active Layer)
     Dimension (Scale, Shape, Angle, Tone), Dominance ratio,
     Contrast scale multiplier, Accentuate minority elements.
     ========================================================================= */

  getActiveContrast() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.contrast : null;
  }

  syncContrastInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const con = this.getActiveContrast();
    if (!mod || !con) return;

    const badge = document.getElementById("badge-contrast-layer");
    if (badge) badge.textContent = (mod ? this.compositionName(mod) : "Composition 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-contrast-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-contrast-active");
    if (toggle) toggle.checked = !!con.enabled;

    document.querySelectorAll("#card-contrast [data-contrast-spread]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.contrastSpread === (con.spread || "scattered"));
    });
    document.querySelectorAll("#card-contrast [data-contrast-dimension]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.contrastDimension === con.dimension);
    });

    const dominance = con.dominanceRatio ?? 80;
    this.syncControlValue("input-contrast-dominance", dominance);
    const numDominance = document.getElementById("num-contrast-dominance");
    if (numDominance) numDominance.value = `${dominance}%`;

    const scale = con.scaleFactor ?? 2;
    this.syncControlValue("input-contrast-scale", scale);
    const numScale = document.getElementById("num-contrast-scale");
    if (numScale) numScale.value = `${scale}x`;

    const tone = con.toneAmount ?? 50;
    this.syncControlValue("input-contrast-tone", tone);
    const numTone = document.getElementById("num-contrast-tone");
    if (numTone) numTone.value = `${tone}%`;
    document.getElementById("contrast-tone-block")?.classList.toggle("hidden", con.dimension !== "tone");
    const shift = con.positionShift ?? 25, shiftAngle = con.positionAngle ?? 45;
    this.syncControlValue("input-contrast-shift", shift);
    const numShift = document.getElementById("num-contrast-shift");
    if (numShift) numShift.value = `${shift}%`;
    this.syncControlValue("input-contrast-shiftangle", shiftAngle);
    const numShiftAngle = document.getElementById("num-contrast-shiftangle");
    if (numShiftAngle) numShiftAngle.value = `${shiftAngle}º`;
    document.getElementById("contrast-shift-block")?.classList.toggle("hidden", con.dimension !== "position");
    document.getElementById("contrast-shiftangle-block")?.classList.toggle("hidden", con.dimension !== "position");
    const angle = con.angle ?? 45;
    this.syncControlValue("input-contrast-angle", angle);
    const numAngle = document.getElementById("num-contrast-angle");
    if (numAngle) numAngle.value = `${angle}º`;

    document.querySelectorAll("#card-contrast [data-contrast-shape]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.contrastShape === con.contrastShape);
    });

    // Each dimension only shows the controls that drive it.
    document.getElementById("contrast-shape-block")?.classList.toggle("hidden", con.dimension !== "shape");
    document.getElementById("contrast-scale-block")?.classList.toggle("hidden", con.dimension !== "scale");
    document.getElementById("contrast-angle-block")?.classList.toggle("hidden", con.dimension !== "direction");

    this.syncAccentColorRow("contrast", con.accentColor, !!con.highlightContrast);

    this.updateRailIndicatorDots();
  }

  setupContrast() {
    const toggle = document.getElementById("toggle-contrast-active");

    // Any edit enables Contrast on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const con = this.getActiveContrast();
      if (!con) return;
      mutate(con);
      con.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncContrastInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const con = this.getActiveContrast();
      if (!con) return;
      con.enabled = e.target.checked;
      this.syncContrastInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Contrast: ${con.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-contrast [data-contrast-spread]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.spread = btn.dataset.contrastSpread; }, `Contrast Spread: ${btn.dataset.contrastSpread}`);
      });
    });
    document.querySelectorAll("#card-contrast [data-contrast-dimension]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.dimension = btn.dataset.contrastDimension; }, `Contrast Dimension: ${btn.dataset.contrastDimension}`);
      });
    });

    const bindPair = (sliderId, numId, { min, max, suffix, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        commit(c => { c[key] = val; }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Contrast ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseFloat(e.target.value.replace(/[^0-9.]/g, ""));
        const val = isNaN(raw) ? min : Math.round(Math.max(min, Math.min(max, raw)) * 10) / 10;
        commit(c => { c[key] = val; }, `Contrast ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-contrast-dominance", "num-contrast-dominance", { min: 50, max: 95, suffix: "%", label: "Dominance", key: "dominanceRatio" });
    bindPair("input-contrast-scale", "num-contrast-scale", { min: 0.2, max: 5, suffix: "x", label: "Scale", key: "scaleFactor" });
    bindPair("input-contrast-angle", "num-contrast-angle", { min: 5, max: 90, suffix: "º", label: "Angle", key: "angle" });
    bindPair("input-contrast-tone", "num-contrast-tone", { min: 0, max: 100, suffix: "%", label: "Tone", key: "toneAmount" });
    bindPair("input-contrast-shift", "num-contrast-shift", { min: 0, max: 50, suffix: "%", label: "Shift", key: "positionShift" });
    bindPair("input-contrast-shiftangle", "num-contrast-shiftangle", { min: 0, max: 360, suffix: "º", label: "Shift direction", key: "positionAngle" });

    document.querySelectorAll("#card-contrast [data-contrast-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.contrastShape = btn.dataset.contrastShape; }, `Contrast Shape: ${btn.dataset.contrastShape}`);
      });
    });

    document.getElementById("contrast-accent-clear")?.addEventListener("click", () => {
      commit(c => { c.highlightContrast = false; }, "Contrast Accent: none");
    });
    // Picking an accent color also turns the accentuation on.
    const contrastColor = document.getElementById("contrast-accent-color");
    contrastColor?.addEventListener("input", (e) => {
      commit(c => { c.accentColor = e.target.value; c.highlightContrast = true; }, null);
    });
    contrastColor?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Contrast Accent: ${e.target.value.toUpperCase()}`);
    });
  }
}
