/**
 * The Concentration panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class PanelConcentration {
  /* =========================================================================
     CONCENTRATION INSPECTOR & CONTROLLER (Per Active Layer)
     Structure (Point, Void, Line, Hotspots), X/Y position, Gathering pull,
     Field radius, Orient to field flow, Dynamic density scale, Attractor guide.
     Clicking the canvas while the Concentration tab is open moves the attractor.
     ========================================================================= */

  getActiveConcentration() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.concentration : null;
  }

  syncConcentrationInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const conc = this.getActiveConcentration();
    if (!mod || !conc) return;

    const badge = document.getElementById("badge-concentration-layer");
    if (badge) badge.textContent = (mod ? this.compositionName(mod) : "Composition 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-concentration-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-concentration-active");
    if (toggle) toggle.checked = !!conc.enabled;

    document.querySelectorAll("#card-concentration [data-conc-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concMode === conc.mode);
    });
    document.querySelectorAll("#card-concentration [data-conc-axis]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concAxis === conc.lineAxis);
    });
    // The axis only matters for the line structure.
    document.getElementById("conc-axis-block")?.classList.toggle("hidden", conc.mode !== "line" && conc.mode !== "line_void");
    document.getElementById("conc-foci-block")?.classList.toggle("hidden", conc.mode !== "free");
    // The whole-design modes (Dense, Sparse) have no field radius and no absence method; they can fade at the edges
    const wholeDesign = conc.mode === "dense" || conc.mode === "sparse";
    document.getElementById("conc-method-block")?.classList.toggle("hidden", wholeDesign);
    document.getElementById("conc-radius-field")?.classList.toggle("hidden", wholeDesign);
    document.getElementById("conc-fade-block")?.classList.toggle("hidden", !wholeDesign);
    document.querySelectorAll("#card-concentration [data-conc-method]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concMethod === (conc.method || "move"));
    });
    document.querySelectorAll("#card-concentration [data-conc-flag]").forEach(chip => {
      const on = !!conc[chip.dataset.concFlag];
      chip.classList.toggle("active", on);
      chip.setAttribute("aria-pressed", String(on));
    });

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-conc-x", "num-conc-x", Math.round((conc.attractorX ?? 0.5) * 100), "%");
    setPair("input-conc-y", "num-conc-y", Math.round((conc.attractorY ?? 0.5) * 100), "%");
    setPair("input-conc-foci", "num-conc-foci", conc.focusCount ?? 2, "");
    setPair("input-conc-power", "num-conc-power", conc.power ?? 50, "%");
    setPair("input-conc-radius", "num-conc-radius", conc.radius ?? 250, "px");

    this.syncCheckbox("toggle-conc-guide", !!conc.showAttractor);

    this.updateRailIndicatorDots();
  }

  setupConcentration() {
    const toggle = document.getElementById("toggle-concentration-active");

    // Any edit enables Concentration on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const conc = this.getActiveConcentration();
      if (!conc) return;
      mutate(conc);
      conc.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncConcentrationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const conc = this.getActiveConcentration();
      if (!conc) return;
      conc.enabled = e.target.checked;
      this.syncConcentrationInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Concentration: ${conc.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-concentration [data-conc-method]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.method = btn.dataset.concMethod; }, `Concentration Method: ${btn.dataset.concMethod}`);
      });
    });
    // Field style: chips that can be mixed (each one switches on and off by itself)
    document.querySelectorAll("#card-concentration [data-conc-flag]").forEach(chip => {
      chip.addEventListener("click", () => {
        const key = chip.dataset.concFlag;
        const next = chip.getAttribute("aria-pressed") !== "true";
        commit(c => { c[key] = next; }, `Concentration ${chip.textContent}: ${next ? "ON" : "OFF"}`);
      });
    });
    document.querySelectorAll("#card-concentration [data-conc-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.mode = btn.dataset.concMode; }, `Concentration Structure: ${btn.dataset.concMode}`);
      });
    });
    document.querySelectorAll("#card-concentration [data-conc-axis]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(c => { c.lineAxis = btn.dataset.concAxis; }, `Concentration Axis: ${btn.dataset.concAxis}`);
      });
    });

    const bindPair = (sliderId, numId, { min, max, suffix, toStored, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(c => { c[key] = toStored(val); }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Concentration ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(c => { c[key] = toStored(val); }, `Concentration ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-conc-x", "num-conc-x", { min: 0, max: 100, suffix: "%", toStored: v => v / 100, label: "X", key: "attractorX" });
    bindPair("input-conc-y", "num-conc-y", { min: 0, max: 100, suffix: "%", toStored: v => v / 100, label: "Y", key: "attractorY" });
    bindPair("input-conc-foci", "num-conc-foci", { min: 2, max: 8, suffix: "", toStored: v => v, label: "Foci", key: "focusCount" });
    bindPair("input-conc-power", "num-conc-power", { min: 10, max: 100, suffix: "%", toStored: v => v, label: "Pull", key: "power" });
    bindPair("input-conc-radius", "num-conc-radius", { min: 10, max: 500, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });

    const bindCheck = (id, key, label) => {
      document.getElementById(id)?.addEventListener("change", (e) => {
        const checked = e.target.checked;
        commit(c => { c[key] = checked; }, `Concentration ${label}: ${checked ? "ON" : "OFF"}`);
      });
    };
    bindCheck("toggle-conc-guide", "showAttractor", "Attractor Guide");

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
