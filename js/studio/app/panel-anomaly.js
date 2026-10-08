/**
 * The Anomaly panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class PanelAnomaly {
  /* =========================================================================
     ANOMALY INSPECTOR & CONTROLLER (Per Active Layer)
     Type (Focal, Rupture, Swell, Void), Focal intruder shape, X/Y position,
     Radius, Severity, Highlight with accent color, Epicenter reticle.
     Clicking the canvas while the Anomaly tab is open sets the focal point.
     ========================================================================= */

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

  syncAnomalyInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const anom = this.getActiveAnomaly();
    if (!mod || !anom) return;

    const badge = document.getElementById("badge-anomaly-layer");
    if (badge) badge.textContent = (mod ? this.compositionName(mod) : "Composition 1");

    const hasGrid = !!mod.structure.enabled;
    const warnBox = document.getElementById("warning-anomaly-grid");
    if (warnBox) warnBox.classList.toggle("hidden", hasGrid);

    const toggle = document.getElementById("toggle-anomaly-active");
    if (toggle) toggle.checked = !!anom.enabled;

    document.querySelectorAll("#card-anomaly [data-anom-type]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.anomType === anom.type);
    });
    document.querySelectorAll("#card-anomaly [data-anom-shape]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.anomShape === anom.anomalousShape);
    });

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-anom-radius", "num-anom-radius", anom.radius ?? 150, "px");
    setPair("input-anom-count", "num-anom-count", anom.count ?? 5, "");
    setPair("input-anom-seed", "num-anom-seed", anom.seed ?? 7, "");

    // Distribution, the attributes it can deviate in and the controls each choice needs
    const dist = anom.distribution || "single";
    document.querySelectorAll("#card-anomaly [data-anom-dist]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.anomDist === dist);
    });
    const relevant = StudioProApp.ANOMALY_ATTRS[anom.type] || [];
    document.querySelectorAll("#card-anomaly [data-anom-attr]").forEach(btn => {
      const key = btn.dataset.anomAttr;
      btn.classList.toggle("hidden", !relevant.includes(key));
      btn.classList.toggle("active", (anom.attrs || {})[key] !== false);
    });
    const shapeUsed = anom.type === "focal" && (anom.attrs || {}).shape !== false;
    document.getElementById("anom-shape-block")?.classList.toggle("hidden", !shapeUsed);
    // "Another grid": the zone only needs its grid variation, position and radius
    const regrid = anom.type === "regrid";
    document.getElementById("anom-zonegrid-block")?.classList.toggle("hidden", !regrid);
    document.getElementById("anom-attrs-block")?.classList.toggle("hidden", regrid);
    document.getElementById("anom-severity-block")?.classList.toggle("hidden", regrid);
    document.querySelectorAll("#card-anomaly [data-anom-zonegrid]").forEach(btn => btn.classList.toggle("active", btn.dataset.anomZonegrid === (anom.zoneGrid || "sliding")));
    document.getElementById("anom-position-block")?.classList.toggle("hidden", dist !== "single");
    document.getElementById("anom-count-block")?.classList.toggle("hidden", dist === "single");
    document.getElementById("anom-seed-block")?.classList.toggle("hidden", dist !== "random");
    setPair("input-anom-intensity", "num-anom-intensity", anom.intensity ?? 60, "%");

    this.syncAccentColorRow("anom", anom.accentColor, !!anom.highlightColor);
    this.syncCheckbox("toggle-anom-reticle", !!anom.showReticle);

    this.updateRailIndicatorDots();
  }

  setupAnomaly() {
    const toggle = document.getElementById("toggle-anomaly-active");

    // Any edit enables Anomaly on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const anom = this.getActiveAnomaly();
      if (!anom) return;
      mutate(anom);
      anom.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncAnomalyInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const anom = this.getActiveAnomaly();
      if (!anom) return;
      anom.enabled = e.target.checked;
      this.syncAnomalyInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Anomaly: ${anom.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-anomaly [data-anom-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.type = btn.dataset.anomType; }, `Anomaly Type: ${btn.dataset.anomType}`);
      });
    });
    document.querySelectorAll("#card-anomaly [data-anom-zonegrid]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.zoneGrid = btn.dataset.anomZonegrid; }, `Anomaly Zone Grid: ${btn.dataset.anomZonegrid}`);
      });
    });
    document.querySelectorAll("#card-anomaly [data-anom-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.anomalousShape = btn.dataset.anomShape; }, `Anomaly Shape: ${btn.dataset.anomShape}`);
      });
    });

    document.querySelectorAll("#card-anomaly [data-anom-dist]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(a => { a.distribution = btn.dataset.anomDist; }, `Anomaly Distribution: ${btn.dataset.anomDist}`);
      });
    });
    // Multi-select chips: each one switches an attribute on or off
    document.querySelectorAll("#card-anomaly [data-anom-attr]").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.anomAttr;
        commit(a => {
          a.attrs = Object.assign({ shape: true, scale: true, rotation: true, position: true }, a.attrs);
          a.attrs[key] = !a.attrs[key];
        }, `Anomaly Deviates in ${key}`);
      });
    });

    // Slider + value box pairs. `toValue` maps the UI value to the stored value.
    const bindPair = (sliderId, numId, { min, max, suffix, toStored, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(a => { a[key] = toStored(val); }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Anomaly ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(a => { a[key] = toStored(val); }, `Anomaly ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-anom-count", "num-anom-count", { min: 1, max: 10, suffix: "", toStored: v => v, label: "Count", key: "count" });
    bindPair("input-anom-seed", "num-anom-seed", { min: 1, max: 99, suffix: "", toStored: v => v, label: "Seed", key: "seed" });
    bindPair("input-anom-radius", "num-anom-radius", { min: 10, max: 350, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });
    bindPair("input-anom-intensity", "num-anom-intensity", { min: 5, max: 100, suffix: "%", toStored: v => v, label: "Severity", key: "intensity" });

    // Removing the accent colour turns the highlight off
    document.getElementById("anom-accent-clear")?.addEventListener("click", () => {
      commit(a => { a.highlightColor = false; }, "Anomaly Accent: none");
    });
    // Picking an accent color also turns the highlight on.
    const anomColor = document.getElementById("anom-accent-color");
    anomColor?.addEventListener("input", (e) => {
      commit(a => { a.accentColor = e.target.value; a.highlightColor = true; }, null);
    });
    anomColor?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Anomaly Accent: ${e.target.value.toUpperCase()}`);
    });
    document.getElementById("toggle-anom-reticle")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(a => { a.showReticle = checked; }, `Anomaly Reticle: ${checked ? "ON" : "OFF"}`);
    });

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
