/**
 * The Texture panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class PanelTexture {
  /* =========================================================================
     TEXTURE INSPECTOR & CONTROLLER (Per Active Layer)
     Geometry deformations that read as texture: Jitter, Line skipping,
     Random lines, Plane wave. Autonomous modifier.
     Jitter and undulation are px for a 100px module (scaled to the real size).
     Skipping and crossing only read on strokes.
     ========================================================================= */

  getActiveTexture() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.texture : null;
  }

  syncTextureInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const tex = this.getActiveTexture();
    if (!mod || !tex) return;

    const badge = document.getElementById("badge-texture-layer");
    if (badge) badge.textContent = (mod ? this.compositionName(mod) : "Composition 1");

    const toggle = document.getElementById("toggle-texture-active");
    if (toggle) toggle.checked = !!tex.enabled;

    // Jitter and undulation are stored in px for a 100 px module but shown as 0 to 100 % (unit = px per 1 %)
    const setPair = (sliderId, numId, value, suffix, unit = 1) => {
      const shown = Math.round(value / unit);
      this.syncControlValue(sliderId, shown);
      const num = document.getElementById(numId);
      if (num) num.value = `${shown}${suffix}`;
    };
    setPair("input-texture-jitter", "num-texture-jitter", tex.jitter ?? 1, "%", 0.1);
    setPair("input-texture-skip", "num-texture-skip", tex.skipChance ?? 10, "%");
    setPair("input-texture-crossing", "num-texture-crossing", tex.crossing ?? 10, "%");
    setPair("input-texture-undulation", "num-texture-undulation", tex.undulation ?? 9, "%", 0.3);
    setPair("input-texture-hairopacity", "num-texture-hairopacity", tex.hairOpacity ?? 85, "%");
    setPair("input-texture-waves", "num-texture-waves", tex.waves ?? 2, "");
    setPair("input-texture-waveangle", "num-texture-waveangle", tex.waveAngle ?? 0, "º");

    this.updateRailIndicatorDots();
  }

  setupTexture() {
    const toggle = document.getElementById("toggle-texture-active");

    // Any edit enables Texture on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const tex = this.getActiveTexture();
      if (!tex) return;
      mutate(tex);
      tex.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncTextureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const tex = this.getActiveTexture();
      if (!tex) return;
      tex.enabled = e.target.checked;
      this.syncTextureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Texture: ${tex.enabled ? "ON" : "OFF"}`);
    });

    const bindPair = (sliderId, numId, { min, max, suffix, label, key, unit = 1 }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(t => { t[key] = val * unit; }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Texture ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(t => { t[key] = val * unit; }, `Texture ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-texture-jitter", "num-texture-jitter", { min: 0, max: 100, suffix: "%", label: "Jitter", key: "jitter", unit: 0.1 });
    bindPair("input-texture-skip", "num-texture-skip", { min: 0, max: 90, suffix: "%", label: "Line Skipping", key: "skipChance" });
    bindPair("input-texture-crossing", "num-texture-crossing", { min: 0, max: 100, suffix: "%", label: "Random Lines", key: "crossing" });
    bindPair("input-texture-undulation", "num-texture-undulation", { min: 0, max: 100, suffix: "%", label: "Plane Wave", key: "undulation", unit: 0.3 });
    bindPair("input-texture-hairopacity", "num-texture-hairopacity", { min: 10, max: 100, suffix: "%", label: "Random Lines Opacity", key: "hairOpacity" });
    bindPair("input-texture-waves", "num-texture-waves", { min: 1, max: 6, suffix: "", label: "Waves", key: "waves" });
    bindPair("input-texture-waveangle", "num-texture-waveangle", { min: 0, max: 360, suffix: "º", label: "Wave Direction", key: "waveAngle" });
  }
}
