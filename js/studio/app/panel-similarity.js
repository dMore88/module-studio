/**
 * The Similarity panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class PanelSimilarity {
  /* =========================================================================
     SIMILARITY INSPECTOR & CONTROLLER (Per Active Layer)
     Visual Kinship: Elastic, 3D tilt, Wobble, Scale, Hybrid
     Fluctuation Intensity & Spatial Cell Jitter
     ========================================================================= */

  syncSimilarityInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    if (!mod) return;

    if (!mod.structure) {
      mod.structure = this.getActiveLayerStructure();
    }
    if (!mod.structure.similarity) {
      mod.structure.similarity = {
        enabled: false,
        kinshipType: "distortion",
        intensity: 50,
        cellJitter: 0,
        seed: 42
      };
    }

    const sim = mod.structure.similarity;

    // Update layer badge
    const badge = document.getElementById("badge-similarity-layer");
    if (badge) badge.textContent = (mod ? this.compositionName(mod) : "Composition 1");

    // Dependency warning: Shown only when Similarity is ON but Layout Structure is OFF (neither Repetition nor Radiation)
    const hasGrid = !!(mod.structure && mod.structure.enabled);
    const isSimActive = !!sim.enabled;
    const showWarning = !hasGrid;

    const warnBox = document.getElementById("warning-similarity-grid");
    if (warnBox) warnBox.classList.toggle("hidden", !showWarning);

    // Sync toggle switch
    const toggle = document.getElementById("toggle-similarity-active");
    if (toggle) toggle.checked = isSimActive;

    // Sync Visual Kinship Type buttons
    const activeType = sim.kinshipType || "distortion";
    document.querySelectorAll("#card-similarity [data-kinship-type]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.kinshipType === activeType);
    });

    // Association (family of shapes) and Imperfection
    const assoc = sim.association || "none", imperf = sim.imperfection || "none";
    document.querySelectorAll("#card-similarity [data-sim-assoc]").forEach(btn => btn.classList.toggle("active", btn.dataset.simAssoc === assoc));
    document.querySelectorAll("#card-similarity [data-sim-imperf]").forEach(btn => btn.classList.toggle("active", btn.dataset.simImperf === imperf));
    document.getElementById("sim-assoc-block")?.classList.toggle("hidden", assoc === "none");
    document.getElementById("sim-imperf-block")?.classList.toggle("hidden", imperf === "none");
    this.syncControlValue("input-sim-assoc-mix", sim.assocMix ?? 50);
    this.syncControlValue("num-sim-assoc-mix", `${sim.assocMix ?? 50}%`);
    this.syncControlValue("input-sim-imperf-amount", sim.imperfAmount ?? 30);
    this.syncControlValue("num-sim-imperf-amount", `${sim.imperfAmount ?? 30}%`);

    // Sync Fluctuation Intensity slider and numeric box (50%)
    const intensity = sim.intensity !== undefined ? sim.intensity : 50;
    this.syncControlValue("input-sim-intensity", intensity);
    const numIntensity = document.getElementById("num-sim-intensity");
    if (numIntensity) numIntensity.value = `${intensity}%`;

    // Sync Spatial Cell Jitter slider and numeric box (0)
    // A project saved in pixels is shown as a share of the cell, without touching the file
    const jitter = sim.cellJitterAmount > 0 ? Math.round(sim.cellJitterAmount * 100)
      : Math.min(90, Math.round(((sim.cellJitter || 0) / (300 / Math.max(1, this.getActiveLayerStructure()?.repetition?.cols || 4))) * 100));
    this.syncControlValue("input-sim-jitter", jitter);
    this.syncControlValue("num-sim-jitter", `${jitter}%`);

    this.updateRailIndicatorDots();
  }

  setupSimilarity() {
    const toggle = document.getElementById("toggle-similarity-active");

    toggle?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.similarity) {
        mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
      const enabled = e.target.checked;
      mod.structure.similarity.enabled = enabled;
      this.syncSimilarityInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Similarity: ${enabled ? "ON" : "OFF"}`);
    });

    // Association (family of shapes), Imperfection (cut or broken) and their amounts.
    // Any edit turns Similarity on for the active layer.
    const commitSim = (mutate, label) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.similarity) {
        mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
      mutate(mod.structure.similarity);
      mod.structure.similarity.enabled = true;
      if (toggle) toggle.checked = true;
      this.syncSimilarityInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (label) this.pushHistory(`Layer ${this.activeLayerId} ${label}`);
    };
    document.querySelectorAll("#card-similarity [data-sim-assoc]").forEach(btn => {
      btn.addEventListener("click", () => commitSim(s => { s.association = btn.dataset.simAssoc; }, `Similarity Association: ${btn.dataset.simAssoc}`));
    });
    document.querySelectorAll("#card-similarity [data-sim-imperf]").forEach(btn => {
      btn.addEventListener("click", () => commitSim(s => { s.imperfection = btn.dataset.simImperf; }, `Similarity Imperfection: ${btn.dataset.simImperf}`));
    });
    const bindSimPct = (sliderId, numId, key, label) => {
      const sl = document.getElementById(sliderId), nm = document.getElementById(numId);
      sl?.addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10);
        commitSim(s => { s[key] = v; });
        if (nm) nm.value = `${v}%`;
      });
      sl?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} Similarity ${label}: ${e.target.value}%`));
      nm?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const v = isNaN(raw) ? 0 : Math.max(0, Math.min(100, raw));
        commitSim(s => { s[key] = v; }, `Similarity ${label}: ${v}%`);
      });
    };
    bindSimPct("input-sim-assoc-mix", "num-sim-assoc-mix", "assocMix", "Association Mix");
    bindSimPct("input-sim-imperf-amount", "num-sim-imperf-amount", "imperfAmount", "Imperfect Modules");

    // Visual Kinship Type Pills: Elastic, 3D tilt, Wobble, Scale, Hybrid
    document.querySelectorAll("#card-similarity [data-kinship-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.similarity) {
          mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
        }
        mod.structure.similarity.kinshipType = btn.dataset.kinshipType;
        mod.structure.similarity.enabled = true;
        if (toggle) toggle.checked = true;
        document.querySelectorAll("#card-similarity [data-kinship-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.syncSimilarityInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Layer ${this.activeLayerId} Kinship Type: ${btn.dataset.kinshipType}`);
      });
    });

    // Fluctuation Intensity Slider & % Input
    const inputIntensity = document.getElementById("input-sim-intensity");
    const numIntensity = document.getElementById("num-sim-intensity");

    if (inputIntensity) {
      inputIntensity.addEventListener("input", (e) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.similarity) {
          mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
        }
        const val = parseInt(e.target.value, 10);
        mod.structure.similarity.intensity = val;
        mod.structure.similarity.enabled = true;
        if (toggle) toggle.checked = true;
        if (numIntensity) numIntensity.value = `${val}%`;
        this.render();
      });
      inputIntensity.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Similarity Intensity: ${e.target.value}%`);
      });
    }

    if (numIntensity) {
      numIntensity.addEventListener("change", (e) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.similarity) {
          mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
        }
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? 50 : Math.max(0, Math.min(100, raw));
        mod.structure.similarity.intensity = val;
        mod.structure.similarity.enabled = true;
        if (toggle) toggle.checked = true;
        numIntensity.value = `${val}%`;
        if (inputIntensity) inputIntensity.value = val;
        this.render();
        this.pushHistory(`Layer ${this.activeLayerId} Similarity Intensity: ${val}%`);
      });
    }

    // Spatial Cell Jitter Slider
    this.bindSliderWithNumber("input-sim-jitter", "num-sim-jitter", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.similarity) {
        mod.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
      mod.structure.similarity.cellJitterAmount = Math.max(0, Math.min(90, val)) / 100;
      mod.structure.similarity.cellJitter = 0;
      mod.structure.similarity.enabled = true;
      if (toggle) toggle.checked = true;
      this.render();
    }, "Cell Jitter", "%");
  }
}
