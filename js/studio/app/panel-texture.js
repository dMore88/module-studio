/**
 * The Texture panel, described as data (see panel-builder.js): geometry deformations that read as texture: Jitter, Line skipping,
 * Random lines, Plane wave. Autonomous modifier. Jitter and undulation are stored in px for a 100 px module (scaled to the real size)
 * and shown as 0 to 100 % (unit = px per 1 %). Skipping and crossing only read on strokes.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const TEXTURE_PANEL = {
  id: "texture", cardId: "card-texture", name: "Texture",
  state: (app) => app.getActiveTexture(),
  enabled: { id: "toggle-texture-active", key: "enabled" },
  badgeId: "badge-texture-layer",
  groups: [
    { title: "Irregularity", controls: [
      { type: "slider", id: "texture-jitter", label: "Jitter", key: "jitter", min: 0, max: 100, step: 1, value: 10, suffix: "%", unit: 0.1, fallback: 1, history: "Jitter" },
    ] },
    { title: "Lines", advId: "tex-adv-lines", controls: [
      { type: "slider", id: "texture-skip", label: "Line skipping", key: "skipChance", min: 0, max: 90, step: 1, value: 10, suffix: "%", history: "Line Skipping" },
      { type: "slider", id: "texture-crossing", label: "Random lines", key: "crossing", min: 0, max: 100, step: 1, value: 10, suffix: "%", history: "Random Lines" },
      { type: "slider", id: "texture-hairopacity", label: "Random lines opacity", key: "hairOpacity", min: 10, max: 100, step: 1, value: 85, suffix: "%", history: "Random Lines Opacity", advanced: true },
    ] },
    { title: "Wave", advId: "tex-adv-wave", controls: [
      { type: "slider", id: "texture-undulation", label: "Plane wave", key: "undulation", min: 0, max: 100, step: 1, value: 30, suffix: "%", unit: 0.3, fallback: 9, history: "Plane Wave" },
      { type: "slider", id: "texture-waves", label: "Waves", key: "waves", min: 1, max: 6, step: 1, value: 2, suffix: "", history: "Waves", advanced: true },
      { type: "slider", id: "texture-waveangle", label: "Wave direction", key: "waveAngle", min: 0, max: 360, step: 5, value: 0, suffix: "º", history: "Wave Direction", advanced: true },
    ] },
  ],
};

class PanelTexture {
  getActiveTexture() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.texture : null;
  }

  syncTextureInspectorWithActiveLayer() { this.syncDataPanel(TEXTURE_PANEL); }

  setupTexture() { this.bindDataPanel(TEXTURE_PANEL); }
}
