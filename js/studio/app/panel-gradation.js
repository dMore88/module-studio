/**
 * The Gradation panel (and the guide and accent colour helpers it shares).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class PanelGradation {
  /* =========================================================================
     GRADATION INSPECTOR & CONTROLLER (Per Active Layer)
     Attribute (Rotate, Scale, Depth, Drift), Range, Cycles,
     Pathway direction, Reverse
     ========================================================================= */

  getActiveGradation() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.gradation : null;
  }

  syncGradationInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const grad = this.getActiveGradation();
    if (!mod || !grad) return;

    const badge = document.getElementById("badge-gradation-layer");
    if (badge) badge.textContent = (mod ? this.compositionName(mod) : "Composition 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-gradation-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-gradation-active");
    if (toggle) toggle.checked = !!grad.enabled;

    document.querySelectorAll("#card-gradation [data-grad-type]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradType === grad.type);
    });
    document.querySelectorAll("#card-gradation [data-grad-pathway]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradPathway === grad.pathway);
    });

    const range = grad.range ?? 180;
    this.syncControlValue("input-grad-range", range);
    const numRange = document.getElementById("num-grad-range");
    if (numRange) numRange.value = `${range}º`;

    const steps = grad.steps ?? 1;
    this.syncControlValue("input-grad-steps", steps);
    this.syncControlValue("num-grad-steps", steps);

    // Speed is shown the other way round from the stored easing: + reaches the full effect early, - late
    const speed = grad.easing ? -grad.easing : 0;
    this.syncControlValue("input-grad-easing", speed);
    this.syncControlValue("num-grad-easing", speed > 0 ? `+${speed}` : `${speed}`);

    document.querySelectorAll("#card-gradation [data-grad-sequence]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradSequence === (grad.sequence || "restart"));
    });
    document.querySelectorAll("#card-gradation [data-grad-target]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.gradTarget === (grad.targetShape || "triangle"));
    });
    document.getElementById("grad-target-block")?.classList.toggle("hidden", grad.type !== "shape");
    document.getElementById("grad-color-block")?.classList.toggle("hidden", grad.type !== "color");
    this.syncAccentColorRow("grad", grad.endColor || "#f43f5e", true);

    // Alternate rows has nothing to do on the snake path, which already runs back and forth
    const altRow = document.getElementById("toggle-grad-alternate")?.closest("label");
    if (altRow) altRow.style.display = grad.pathway === "zigzag" ? "none" : "";
    const alternate = document.getElementById("toggle-grad-alternate");
    if (alternate) alternate.checked = !!grad.alternate;

    const reverse = document.getElementById("toggle-grad-reverse");
    if (reverse) reverse.checked = !!grad.reverse;

    this.updateRailIndicatorDots();
  }

  setupGradation() {
    const toggle = document.getElementById("toggle-gradation-active");

    // Any edit enables Gradation on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const grad = this.getActiveGradation();
      if (!grad) return;
      mutate(grad);
      grad.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncGradationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const grad = this.getActiveGradation();
      if (!grad) return;
      grad.enabled = e.target.checked;
      this.syncGradationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Gradation: ${grad.enabled ? "ON" : "OFF"}`);
    });

    const gradColor = document.getElementById("grad-accent-color");
    gradColor?.addEventListener("input", (e) => {
      const grad = this.getActiveGradation();
      if (!grad) return;
      grad.endColor = e.target.value;
      this.syncAccentColorRow("grad", e.target.value, true);
      this.render();
    });
    gradColor?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} Gradation End Color: ${e.target.value.toUpperCase()}`));

    document.querySelectorAll("#card-gradation [data-grad-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.type = btn.dataset.gradType; }, `Gradation Attribute: ${btn.dataset.gradType}`);
      });
    });
    document.querySelectorAll("#card-gradation [data-grad-pathway]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.pathway = btn.dataset.gradPathway; }, `Gradation Pathway: ${btn.dataset.gradPathway}`);
      });
    });

    // Range (5º to 360º)
    const inputRange = document.getElementById("input-grad-range");
    const numRange = document.getElementById("num-grad-range");
    inputRange?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      commit(g => { g.range = val; }, null, { resync: false });
      if (numRange) numRange.value = `${val}º`;
    });
    inputRange?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Gradation Range: ${e.target.value}º`);
    });
    numRange?.addEventListener("change", (e) => {
      const raw = parseInt(e.target.value.replace(/[^0-9-]/g, ""), 10);
      const val = isNaN(raw) ? 180 : Math.max(5, Math.min(360, raw));
      commit(g => { g.range = val; }, `Gradation Range: ${val}º`);
    });

    // Cycles (1 to 10)
    const inputSteps = document.getElementById("input-grad-steps");
    const numSteps = document.getElementById("num-grad-steps");
    inputSteps?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      commit(g => { g.steps = val; }, null, { resync: false });
      if (numSteps) numSteps.value = val;
    });
    inputSteps?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Gradation Cycles: ${e.target.value}`);
    });
    numSteps?.addEventListener("change", (e) => {
      const raw = parseInt(e.target.value, 10);
      const val = isNaN(raw) ? 1 : Math.max(1, Math.min(10, raw));
      commit(g => { g.steps = val; }, `Gradation Cycles: ${val}`);
    });

    // Speed (-100 slow, 100 fast); stored as easing with the opposite sign
    const inputEasing = document.getElementById("input-grad-easing");
    const numEasing = document.getElementById("num-grad-easing");
    const showEasing = (v) => { if (numEasing) numEasing.value = v > 0 ? `+${v}` : `${v}`; };
    inputEasing?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      commit(g => { g.easing = val ? -val : 0; }, null, { resync: false });
      showEasing(val);
    });
    inputEasing?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Gradation Speed: ${e.target.value}`);
    });
    numEasing?.addEventListener("change", (e) => {
      const raw = parseInt(e.target.value.replace(/[^0-9-]/g, ""), 10);
      const val = isNaN(raw) ? 0 : Math.max(-100, Math.min(100, raw));
      commit(g => { g.easing = val ? -val : 0; }, `Gradation Speed: ${val}`);
    });

    document.querySelectorAll("#card-gradation [data-grad-sequence]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.sequence = btn.dataset.gradSequence; }, `Gradation Sequence: ${btn.dataset.gradSequence}`);
      });
    });
    document.querySelectorAll("#card-gradation [data-grad-target]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(g => { g.targetShape = btn.dataset.gradTarget; }, `Gradation Becomes: ${btn.dataset.gradTarget}`);
      });
    });
    document.getElementById("toggle-grad-alternate")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(g => { g.alternate = checked; }, `Gradation Alternate: ${checked ? "ON" : "OFF"}`);
    });

    document.getElementById("toggle-grad-reverse")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(g => { g.reverse = checked; }, `Gradation Reverse: ${checked ? "ON" : "OFF"}`);
    });
  }

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
