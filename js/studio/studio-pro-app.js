/**
 * MODULE STUDIO PRO — Master Application Controller
 * Inspired by Abstract Studio: Canvas-First, Floating Capas Stack, Shape Inspector & Procedural Stack.
 */

import { StudioEngine, defaultStudioState, createDefaultLayerStructure, createDefaultLayer } from './studio-engine.js';
import { Shapes, STUDIO_SHAPE_KEYS, resolveFigures } from './shapes.js';
import { CanvasUtils } from '../canvas-utils.js';
import { StudioExporter } from './exporter.js';

// The icon of a shape: a Phosphor icon, or its own drawing (ring) or letter (A, S, R) when Phosphor has none
export function shapeIconHtml(def) {
  if (def && def.phIcon) return `<i class="ph ph-${def.phIcon}" aria-hidden="true"></i>`;
  if (def && def.glyph) return `<span class="ph-glyph" aria-hidden="true">${def.glyph}</span>`;
  if (def && def.id === "ring") return '<svg class="ph-svg" viewBox="0 0 256 256" aria-hidden="true"><circle cx="128" cy="128" r="104" fill="none" stroke="currentColor" stroke-width="16"/><circle cx="128" cy="128" r="52" fill="none" stroke="currentColor" stroke-width="16"/></svg>';
  return '<i class="ph ph-circle" aria-hidden="true"></i>';
}

export const ASPECT_RATIOS = {
  "1:1": { label: "1:1 Square", w: 600, h: 600, css: "1 / 1" },
  "9:16": { label: "9:16 Story", w: 450, h: 800, css: "9 / 16" },
  "4:3": { label: "4:3 Editorial", w: 800, h: 600, css: "4 / 3" },
  "3:4": { label: "3:4 Poster", w: 600, h: 800, css: "3 / 4" },
  "16:9": { label: "16:9 Cinema", w: 800, h: 450, css: "16 / 9" }
};

// The panels described as data (each spec lives in its panel's file in js/studio/app/)
function dataPanels() { return [SPACE_PANEL]; }

// Copies the methods (and the static getters) of the area classes (js/studio/app/*.js) onto StudioProApp
function applyMixins(target, sources) {
  for (const source of sources) {
    for (const name of Object.getOwnPropertyNames(source.prototype)) {
      if (name !== "constructor") Object.defineProperty(target.prototype, name, Object.getOwnPropertyDescriptor(source.prototype, name));
    }
    for (const name of Object.getOwnPropertyNames(source)) {
      if (!["length", "name", "prototype"].includes(name)) Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
    }
  }
}

export class StudioProApp {
  constructor() {
    this.canvas = document.getElementById("studio-canvas");
    this.canvasContainer = document.getElementById("canvas-viewport-container");
    this.artboardWrapper = document.getElementById("artboard-wrapper");
    
    this.engine = new StudioEngine(this.canvas);
    this.state = JSON.parse(JSON.stringify(defaultStudioState));
    
    // Artboard size as shown on screen (set by fitArtboard)
    this.artboardSize = { w: 0, h: 0 };

    // Active Layer Management (Each layer is a module!)
    this.activeLayerId = "layer-1";

    // Palette (Abstract Studio default: Clean Monochrome / Paper White & Deep Ink)
    this.activePaletteId = "monochrome";
    this.customColors = {
      bg: "#ffffff",
      fg: "#18181f",
      accent: "#18181f",
      grid: "#dcdfe6"
    };

    // History Stack
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 60;
    this.historyLabels = [];

    // Controls Rail & Inspector Flyout State
    this.activeRailTab = "module";
    this.isFlyoutOpen = false; // the Module panel is the smart module editor: opening it shows the module alone, so the app starts with the panels closed


    this.init();
  }

  init() {
    this.applyAspectRatio(this.state.aspectRatio || "1:1");
    this.pushHistory("Initial Canvas State");
    this.setupViewportEvents();
    this.setupKeyboardShortcuts();
    this.setupHeaderActions();
    this.setupFloatingLayersPanel();
    this.setupControlsRail();
    this.buildDataPanels(); // the panels described as data (js/studio/app/panel-builder.js) draw their controls first
    this.setupLayoutStructure();
    this.setupSelects();
    this.setupValueSteppers();
    this.setupRepetitionExtras();
    this.setupFormalStructure();
    this.setupSimilarity();
    this.setupGradation();
    this.setupAnomaly();
    this.setupContrast();
    this.setupConcentration();
    this.setupSpace();
    this.setupTexture();
    this.setupAccessibility();
    document.addEventListener("input", (e) => { if (e.target.matches && e.target.matches('.ds-slider input[type="range"]')) this.paintRange(e.target); });
    this.paintAllRanges();
    this.setupShapeInspector();
    this.setupSmartModule();

    // Initial render
    this.updateActivePalette();
    this.render();
    this.centerArtboard();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();

    // Sync header button states
    const gridBtn = document.getElementById("btn-toggle-grid");
    if (gridBtn) gridBtn.classList.toggle("active", !!this.state.showSafeBounds);
    this.syncGuideColor();
    const invertBtn = document.getElementById("btn-toggle-invert");
    if (invertBtn) invertBtn.classList.toggle("active", !!this.state.invertFigureGround);
  }

  getActivePalette() {
    if (this.state.invertFigureGround) {
      return {
        bg: "#18181f",
        fg: "#ffffff",
        accent: "#f43f5e",
        grid: "rgba(255, 255, 255, 0.14)",
        isDark: true
      };
    } else {
      return {
        bg: "#ffffff",
        fg: this.customColors.fg || "#18181f",
        accent: "#18181f",
        grid: "rgba(0, 0, 0, 0.08)",
        isDark: false
      };
    }
  }

  updateActivePalette() {
    // Keep customColors.bg consistent
    this.customColors.bg = this.state.invertFigureGround ? "#18181f" : "#ffffff";
  }

  getLayers() {
    if (!Array.isArray(this.state.layers) || this.state.layers.length === 0) {
      this.state.layers = [createDefaultLayer("layer-1", "Layer 1", "circle", 0, 0, 4.5)];
    }
    return this.state.layers;
  }

  getActiveModule() {
    const layers = this.getLayers();
    const active = layers.find(l => l.id === this.activeLayerId);
    if (active) return active;
    return layers[0] || null;
  }

  getActiveLayerStructure() {
    const mod = this.getActiveModule();
    if (!mod) return null;
    if (!mod.structure) {
      mod.structure = createDefaultLayerStructure();
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
    if (!mod.structure.gradation) {
      mod.structure.gradation = createDefaultLayerStructure().gradation;
    }
    if (!mod.structure.anomaly) {
      mod.structure.anomaly = createDefaultLayerStructure().anomaly;
    }
    if (!mod.structure.contrast) {
      mod.structure.contrast = createDefaultLayerStructure().contrast;
    }
    if (!mod.structure.concentration) {
      mod.structure.concentration = createDefaultLayerStructure().concentration;
    }
    if (!mod.structure.space) {
      mod.structure.space = createDefaultLayerStructure().space;
    }
    if (!mod.structure.texture) {
      mod.structure.texture = createDefaultLayerStructure().texture;
    }
    return mod.structure;
  }

  syncAllInspectorsWithActiveLayer() {
    if (this.figEdit && this.figEdit.layerId !== this.activeLayerId) { this.endFigureEdit(true); this.beginFigureEdit(); }
    this.syncShapeInspectorWithActiveLayer();
    this.syncStructureInspectorWithActiveLayer();
    this.syncFormalStructureInspectorWithActiveLayer();
    this.syncSimilarityInspectorWithActiveLayer();
    this.syncGradationInspectorWithActiveLayer();
    this.syncAnomalyInspectorWithActiveLayer();
    this.syncContrastInspectorWithActiveLayer();
    this.syncConcentrationInspectorWithActiveLayer();
    this.syncSpaceInspectorWithActiveLayer();
    this.syncTextureInspectorWithActiveLayer();
    this.updateRailIndicatorDots();
    this.paintAllRanges();
  }

  render() {
    if (!this.engine || !this.canvas) return;
    this.engine.state = this.state;
    this.engine.viewState = this.figEdit ? this.stateForFigureEdit() : null;
    this.syncEditorCanvas();
    // The Block frame shows only for the layer being edited, while the Layout panel is open
    this.engine.blockGuideLayerId = this.isFlyoutOpen && this.activeRailTab === "layout" ? this.activeLayerId : null;
    const palette = this.getActivePalette();
    try {
      this.engine.render(palette);
      this.hideRenderError();
    } catch (err) {
      // A failed draw must not leave a silent blank canvas: log it and tell the user.
      console.error("Render failed:", err);
      this.showRenderError(err);
      return;
    }
    this.updateArtLog();
  }

  // While the module is edited the canvas is the module itself: its width and height, whatever the aspect ratio. The canvas is
  // shown scaled to fit the screen (as every canvas is), and drawn denser so a small module is big and sharp
  syncEditorCanvas() {
    const layer = this.figEdit ? this.state.layers.find(l => l.id === this.figEdit.layerId) : null;
    const key = layer ? `${layer.containerW}x${layer.containerH}` : "";
    if (key !== this._editorCanvasKey) { this._editorCanvasKey = key; this.fitArtboard(); }
    this.engine.renderScale = layer && this.artboardSize ? Math.max(1, Math.min(8, Math.ceil(this.artboardSize.w / Math.max(1, layer.containerW)))) : 1;
  }

  showRenderError(err) {
    let box = document.getElementById("render-error");
    if (!box) {
      box = document.createElement("div");
      box.id = "render-error";
      box.className = "render-error";
      box.setAttribute("role", "alert");
      document.body.appendChild(box);
    }
    box.textContent = `Something went wrong while drawing (${err && err.message ? err.message : "unknown error"}). Press Cmd/Ctrl+Z to go back to the last working state.`;
    box.hidden = false;
  }

  hideRenderError() {
    const box = document.getElementById("render-error");
    if (box) box.hidden = true;
  }

  applyAspectRatio(key) {
    const cfg = ASPECT_RATIOS[key] || ASPECT_RATIOS["1:1"];
    this.state.aspectRatio = key;
    this.canvas.width = cfg.w;
    this.canvas.height = cfg.h;
    this.fitArtboard();

    const selectEl = document.getElementById("canvas-aspect-ratio");
    if (selectEl && selectEl.value !== key) selectEl.value = key;
  }

  /* =========================================================================
     TOP APPLICATION BAR ACTIONS
     ========================================================================= */

  setupHeaderActions() {
    // 1. Aspect Ratio Dropdown
    const aspectSelect = document.getElementById("canvas-aspect-ratio");
    if (aspectSelect) {
      aspectSelect.addEventListener("change", (e) => {
        const ratio = e.target.value;
        this.applyAspectRatio(ratio);
        this.syncAllInspectorsWithActiveLayer(); // the Block shows pixels of the canvas
        this.render();
        this.centerArtboard();
        this.pushHistory(`Aspect Ratio: ${ratio}`);
      });
    }

    // 2. Toggle Grid Guides Button
    const gridBtn = document.getElementById("btn-toggle-grid");
    if (gridBtn) {
      gridBtn.addEventListener("click", () => {
        this.state.showSafeBounds = !this.state.showSafeBounds;
        gridBtn.classList.toggle("active", this.state.showSafeBounds);
        this.render();
        this.pushHistory(`Toggle Grid: ${this.state.showSafeBounds}`);
      });
    }

    // 2b. Guide color (one colour for every on-screen guide)
    const guideInput = document.getElementById("input-guide-color");
    guideInput?.addEventListener("input", (e) => {
      this.state.guideColor = e.target.value;
      this.syncGuideColor();
      this.render();
    });
    guideInput?.addEventListener("change", (e) => this.pushHistory(`Guide Color: ${e.target.value.toUpperCase()}`));

    // 3. Toggle Invert Tone Button
    const invertBtn = document.getElementById("btn-toggle-invert");
    if (invertBtn) {
      invertBtn.addEventListener("click", () => {
        this.state.invertFigureGround = !this.state.invertFigureGround;
        invertBtn.classList.toggle("active", this.state.invertFigureGround);
        this.updateActivePalette();
        this.render();
        this.pushHistory(`Toggle Invert Tone: ${this.state.invertFigureGround}`);
      });
    }

    // The Download menu: opens under its button, closes after a choice, with Escape or a click outside
    {
      const menu = document.getElementById("download-menu");
      const trigger = document.getElementById("btn-download");
      const list = menu?.querySelector(".ds-menu__list");
      const setOpen = (open) => { if (!list) return; list.hidden = !open; trigger.setAttribute("aria-expanded", String(open)); };
      trigger?.addEventListener("click", (e) => { e.stopPropagation(); setOpen(list.hidden); });
      list?.addEventListener("click", () => setOpen(false));
      document.addEventListener("click", (e) => { if (menu && !menu.contains(e.target)) setOpen(false); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    }

    // 4. Copy SVG Code
    const copySvgBtn = document.getElementById("btn-copy-svg-code");
    if (copySvgBtn) {
      copySvgBtn.addEventListener("click", async () => {
        const label = copySvgBtn.querySelector("span");
        const origText = label.textContent;
        try {
          const svgString = StudioExporter.buildSVG(this.engine, this.canvas, this.getActivePalette());
          await navigator.clipboard.writeText(svgString);
          label.textContent = "Copied!";
        } catch (err) {
          label.textContent = "Copy failed";
        }
        setTimeout(() => label.textContent = origText, 1500);
      });
    }

    // 5. Download SVG File
    const downloadSvgBtn = document.getElementById("btn-download-svg");
    if (downloadSvgBtn) {
      downloadSvgBtn.addEventListener("click", () => {
        StudioExporter.exportSVG(this.engine, this.canvas, this.getActivePalette(), "module-studio-composition.svg");
      });
    }

    // 6. Config Button
    const configBtn = document.getElementById("btn-open-config");
    if (configBtn) {
      configBtn.addEventListener("click", () => {
        StudioExporter.exportJSON(this.state, "module-studio-project.json");
      });
    }

    // 7. Open a saved project (.json)
    const openBtn = document.getElementById("btn-open-project");
    const fileInput = document.getElementById("file-open-project");
    if (openBtn && fileInput) {
      openBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = "";
        if (!file) return;
        try {
          this.loadProjectText(await file.text());
        } catch (err) {
          alert(`Could not open the project: ${err.message}`);
        }
      });
    }
  }

  // Validates a saved project and replaces the current state with it.
  // Anything missing or malformed falls back to the defaults, so a damaged file cannot break the app.
  loadProjectText(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("the file is not valid JSON"); }
    const raw = data && data.state && typeof data.state === "object" ? data.state : data;
    if (!raw || !Array.isArray(raw.layers) || raw.layers.length === 0) throw new Error("it does not look like a Module Studio project");

    const clone = (v) => JSON.parse(JSON.stringify(v));
    const merge = (def, src) => {
      if (def && typeof def === "object" && !Array.isArray(def)) {
        const out = {};
        for (const k of Object.keys(def)) {
          out[k] = src && typeof src === "object" && k in src ? merge(def[k], src[k]) : clone(def[k]);
        }
        return out;
      }
      if (Array.isArray(def)) return Array.isArray(src) ? clone(src) : clone(def);
      if (typeof def === "number") return typeof src === "number" && Number.isFinite(src) ? src : def;
      return typeof src === typeof def ? src : def;
    };

    // Projects saved before some controls became percentages: convert their pixels (the merge below drops keys it does not know)
    const migrate = (src) => {
      const st = src && src.structure;
      if (!st || typeof st !== "object") return src;
      const rep = st.repetition;
      if (rep && typeof rep === "object" && rep.curveAmount === undefined && typeof rep.curveIntensity === "number") {
        rep.curveAmount = Math.min(1, Math.round((rep.curveIntensity / (600 / Math.max(1, rep.cols || 4))) * 100) / 100);
      }
      // Radiation modules used to shrink with their cell; the new default is Base size, so older projects keep what they had
      const rd = st.radiation;
      if (rd && typeof rd === "object" && rd.moduleScale === undefined) rd.moduleScale = "cell";
      if (rep && typeof rep === "object" && rep.moduleScale === undefined) rep.moduleScale = "cell";
      const sp = st.space;
      if (sp && typeof sp === "object" && sp.depthPct === undefined && typeof sp.depth === "number") {
        sp.depthPct = Math.max(5, Math.min(100, Math.round((sp.depth / 85) * 100)));
      }
      return src;
    };

    const used = new Set();
    const layers = raw.layers.slice(0, 5).map((src, i) => {
      migrate(src);
      const layer = merge(createDefaultLayer(`layer-${i + 1}`, `Layer ${i + 1}`), src);
      if (!STUDIO_SHAPE_KEYS.includes(layer.shape)) layer.shape = "circle";
      // Smart module: keep only well-formed figures (known shape, finite numbers in range), at most 4. Figures saved as a
      // % of the module ({ size, x, y }) become px, from the module's own size
      const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
      const old = Math.max(layer.width || 100, layer.height || 100);
      layer.figures = (Array.isArray(layer.figures) ? layer.figures : [])
        .filter(f => f && STUDIO_SHAPE_KEYS.includes(f.shape)).slice(0, 4)
        .map(f => (f.width !== undefined || f.height !== undefined)
          ? { shape: f.shape, width: num(f.width, 1, 2000, 100), height: num(f.height ?? f.width, 1, 2000, 100), x: num(f.x, -1000, 1000, 0), y: num(f.y, -1000, 1000, 0), rotation: num(f.rotation, -360, 360, 0), relation: ["coincident", "distance"].includes(f.relation) ? f.relation : "free", angle: num(f.angle, 0, 360, 0), gap: num(f.gap, -500, 500, 0), ...(typeof f.wireframe === "boolean" ? { wireframe: f.wireframe } : {}), ...(/^#[0-9a-f]{6}$/i.test(f.color || "") ? { color: f.color } : {}), ...(typeof f.strokeWidth === "number" && Number.isFinite(f.strokeWidth) ? { strokeWidth: Math.max(0.2, Math.min(10, f.strokeWidth)) } : {}) }
          : { shape: f.shape, width: Math.round(num(f.size, 5, 200, 100) / 100 * old), height: Math.round(num(f.size, 5, 200, 100) / 100 * old), x: Math.round(num(f.x, -100, 100, 0) / 100 * old), y: Math.round(num(f.y, -100, 100, 0) / 100 * old), rotation: num(f.rotation, -360, 360, 0) });
      layer.combine = ["union", "subtract", "intersect", "xor"].includes(layer.combine) ? layer.combine : "none";
      // The module's size is its container: 10 to 1000 px. Older projects used 0 for "the whole canvas"
      const ar = ASPECT_RATIOS[raw.aspectRatio] || ASPECT_RATIOS["1:1"];
      layer.containerW = Math.max(10, Math.min(1000, layer.containerW > 0 ? layer.containerW : ar.w));
      layer.containerH = Math.max(10, Math.min(1000, layer.containerH > 0 ? layer.containerH : ar.h));
      if (!layer.id || used.has(layer.id)) layer.id = `layer-${i + 1}-${Date.now() % 100000}`;
      used.add(layer.id);
      return layer;
    });
    const ids = layers.map(l => l.id);
    let order = Array.isArray(raw.layerOrder) ? raw.layerOrder.filter(id => ids.includes(id)) : [];
    for (const id of ids.slice().reverse()) if (!order.includes(id)) order.push(id);

    const ratios = ["1:1", "9:16", "4:3", "3:4", "16:9"];
    this.state = {
      aspectRatio: ratios.includes(raw.aspectRatio) ? raw.aspectRatio : "1:1",
      layers,
      layerOrder: order,
      invertFigureGround: !!raw.invertFigureGround,
      showSafeBounds: raw.showSafeBounds !== false,
      guideColor: /^#[0-9a-f]{6}$/i.test(raw.guideColor || "") ? raw.guideColor : "#f24822"
    };
    this.activeLayerId = layers[0].id;
    this.figEdit = null; // an open editing session belonged to the old project
    this.syncEditShell();
    this.applyAspectRatio(this.state.aspectRatio);
    document.getElementById("btn-toggle-grid")?.classList.toggle("active", this.state.showSafeBounds);
    this.syncGuideColor();
    document.getElementById("btn-toggle-invert")?.classList.toggle("active", this.state.invertFigureGround);
    this.updateActivePalette();
    this.render();
    this.centerArtboard();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();
    this.pushHistory("Open project");
  }

  /* =========================================================================
     VIEWPORT: PAN, ZOOM & ARTBOARD CENTERING
     ========================================================================= */

  setupViewportEvents() {
    // The artboard is not zoomed or panned: it is sized to the free height of the workspace.
    // Refit whenever the window or the stage changes size.
    window.addEventListener("resize", () => this.fitArtboard());
    if (typeof ResizeObserver !== "undefined" && this.canvasContainer) {
      new ResizeObserver(() => this.fitArtboard()).observe(this.canvasContainer);
    }
  }

  // Sizes the canvas so its height fills the free height (the height rules), and its width follows
  // the aspect ratio. The width is capped so the artboard never slides under the controls panel.
  fitArtboard() {
    const stage = this.canvasContainer;
    const column = document.getElementById("canvas-column");
    const flyout = document.getElementById("inspector-flyout");
    const workspace = document.querySelector(".ds-workspace");
    if (!stage || !column || !workspace || !stage.clientHeight) return;

    const BORDER = 20; // white frame around the canvas, each side (Figma "Moiré artwork")
    const GAP = 24;
    const editing = this.figEdit ? this.state.layers.find(l => l.id === this.figEdit.layerId) : null;
    const cfg = editing ? { w: editing.containerW, h: editing.containerH } : (ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"]);
    const ratio = cfg.w / cfg.h;

    const flyoutWidth = flyout ? flyout.offsetWidth : 300;
    const flyoutLeft = workspace.getBoundingClientRect().right - parseFloat(getComputedStyle(workspace).getPropertyValue("--flyout-right") || 66) - flyoutWidth;
    const maxOuterW = Math.max(160, flyoutLeft - GAP - column.getBoundingClientRect().left);

    let h, w;
    if (editing) {
      // any proportion (a module is not bound to an aspect ratio): fit it in the space there is
      const f = Math.min((maxOuterW - BORDER * 2) / cfg.w, (stage.clientHeight - BORDER * 2) / cfg.h);
      w = Math.max(40, Math.floor(cfg.w * f));
      h = Math.max(40, Math.floor(cfg.h * f));
    } else {
      const innerH = Math.max(120, Math.min(stage.clientHeight - BORDER * 2, (maxOuterW - BORDER * 2) / ratio));
      h = Math.floor(innerH);
      w = Math.floor(innerH * ratio);
    }

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    column.style.setProperty("--artboard-w", `${w + BORDER * 2}px`);
    this.artboardSize = { w, h };

    this.updateArtLog();
  }

  centerArtboard() {
    this.fitArtboard();
  }

  /* =========================================================================
     KEYBOARD SHORTCUTS
     ========================================================================= */

  setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      }
    });
  }

  bindSliderWithNumber(sliderId, numberId, callback, label = "Parameter", suffix = "") {
    const slider = document.getElementById(sliderId);
    const numInput = document.getElementById(numberId);

    if (slider) {
      slider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        if (numInput) numInput.value = `${val}${suffix}`;
        callback(val);
      });
      slider.addEventListener("change", (e) => {
        this.pushHistory(`Changed ${label}: ${e.target.value}`);
      });
    }

    if (numInput) {
      numInput.addEventListener("change", (e) => {
        const val = parseFloat(e.target.value);
        if (slider) slider.value = val;
        e.target.value = `${val}${suffix}`;
        callback(val);
        this.pushHistory(`Edited ${label}: ${val}`);
      });
    }
  }

  syncControlValue(inputId, value) {
    const el = document.getElementById(inputId);
    if (el) { el.value = value; this.paintRange(el); }
  }

  // The ink part of a slider's 4 px track: how far the value is between its min and max
  paintRange(el) {
    if (!el || el.type !== "range") return;
    const min = Number(el.min || 0), max = Number(el.max || 100);
    const share = max > min ? ((Number(el.value) - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", `${Math.max(0, Math.min(100, share))}%`);
  }

  paintAllRanges() {
    document.querySelectorAll('.ds-slider input[type="range"]').forEach(el => this.paintRange(el));
  }

  syncCheckbox(id, checked) {
    const cb = document.getElementById(id);
    if (cb) cb.checked = checked;
  }

  /* =========================================================================
     HISTORY MANAGEMENT
     ========================================================================= */

  pushHistory(label = "Action") {
    if (this.figEdit) { this.recordFigureStep(); return; } // inside the smart module editor every change is a step of its own undo; Save makes one step of the project
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.historyLabels = this.historyLabels.slice(0, this.historyIndex + 1);
    }
    this.history.push(JSON.stringify(this.state));
    this.historyLabels.push(label);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyLabels.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.figEdit) { this.stepFigureEdit(-1); return; } // inside the smart module editor, undo goes back one editor step
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = JSON.parse(this.history[this.historyIndex]);
        const layers = this.getLayers();
      if (!layers.some(l => l.id === this.activeLayerId)) {
        this.activeLayerId = layers[0]?.id || "layer-1";
      }
      this.render();
      this.syncGuideColor();
      this.syncAllInspectorsWithActiveLayer();
      this.updateLayerCardsUI();
    }
  }

  redo() {
    if (this.figEdit) { this.stepFigureEdit(1); return; }
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = JSON.parse(this.history[this.historyIndex]);
        const layers = this.getLayers();
      if (!layers.some(l => l.id === this.activeLayerId)) {
        this.activeLayerId = layers[0]?.id || "layer-1";
      }
      this.render();
      this.syncGuideColor();
      this.syncAllInspectorsWithActiveLayer();
      this.updateLayerCardsUI();
    }
  }
}

// The rest of the app's methods live in js/studio/app/*.js, one file per panel or area
applyMixins(StudioProApp, [PanelBuilder, LayersPanel, ArtLog, ControlsRail, PanelLayout, PanelSimilarity, Accessibility, PanelGradation, PanelAnomaly, PanelContrast, PanelConcentration, PanelSpace, PanelTexture, ModuleEditor]);

// Auto-boot upon DOM readiness
document.addEventListener("DOMContentLoaded", () => {
  window.studioProApp = new StudioProApp();
});
