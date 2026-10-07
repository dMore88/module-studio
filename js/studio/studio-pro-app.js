/**
 * MODULE STUDIO PRO — Master Application Controller
 * Inspired by Abstract Studio: Canvas-First, Floating Capas Stack, Shape Inspector & Procedural Stack.
 */

import { StudioEngine, defaultStudioState, createDefaultLayerStructure, createDefaultLayer } from './studio-engine.js';
import { Shapes, STUDIO_SHAPE_KEYS } from './shapes.js';
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
    this.isFlyoutOpen = true;


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
    this.engine.viewState = this.figEdit ? this.stateForFigureEdit() : (this.isHidingModifiers() ? this.stateWithoutModifiers() : null);
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

  // Hide modifiers (an editing aid, never exported): while the Module panel is open and the box is ticked, the
  // active layer is drawn without its modifiers, so the module can be adjusted with its neighbours around it
  isHidingModifiers() {
    return !!(this.hideModifiers && this.isFlyoutOpen && this.activeRailTab === "module");
  }

  stateWithoutModifiers() {
    const off = (b) => (b ? { ...b, enabled: false } : b);
    const layers = this.state.layers.map((l) => {
      if (l.id !== this.activeLayerId || !l.structure) return l;
      const s = l.structure;
      return { ...l, structure: { ...s, enabled: false, formalStructure: off(s.formalStructure), similarity: off(s.similarity), gradation: off(s.gradation), anomaly: off(s.anomaly), contrast: off(s.contrast), concentration: off(s.concentration), texture: off(s.texture), space: off(s.space) } };
    });
    return { ...this.state, layers };
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
      // Smart module: keep only well-formed figures (known shape, finite numbers in range), at most 4
      const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
      layer.figures = (Array.isArray(layer.figures) ? layer.figures : [])
        .filter(f => f && STUDIO_SHAPE_KEYS.includes(f.shape)).slice(0, 4)
        .map(f => ({ shape: f.shape, size: num(f.size, 5, 200, 100), x: num(f.x, -100, 100, 0), y: num(f.y, -100, 100, 0), rotation: num(f.rotation, -360, 360, 0) }));
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
     FLOATING CAPAS (LAYERS) STACK — EACH LAYER IS A MODULE!
     ========================================================================= */

  setupFloatingLayersPanel() {
    const addBtn = document.getElementById("btn-add-pattern");
    const container = document.getElementById("layers-stack-container");

    // Add Pattern Button (Adds new layer up to 5)
    addBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.addLayer();
    });
    document.getElementById("btn-art-log-copy")?.addEventListener("click", () => this.copyArtLog());
    document.getElementById("btn-duplicate-layer")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.duplicateLayer();
    });

    if (container) {
      // Event delegation for layer cards clicks
      container.addEventListener("click", (e) => {
        const eyeBtn = e.target.closest(".btn-layer-eye");
        if (eyeBtn) {
          e.stopPropagation();
          const layerId = eyeBtn.dataset.layer;
          this.toggleLayerVisibility(layerId);
          return;
        }

        const delBtn = e.target.closest(".btn-layer-delete");
        if (delBtn) {
          e.stopPropagation();
          if (delBtn.disabled) return;
          const layerId = delBtn.dataset.layer;
          this.deleteLayer(layerId);
          return;
        }

        const gripHandle = e.target.closest(".layer-drag-handle");
        if (gripHandle) {
          e.stopPropagation();
          const card = gripHandle.closest(".layer-card");
          if (card && container.children.length > 1) {
            const next = card.nextElementSibling;
            if (next) {
              container.insertBefore(next, card);
            } else {
              container.insertBefore(card, container.firstElementChild);
            }
            const newOrder = Array.from(container.children).map(c => c.dataset.layerId).filter(Boolean);
            this.state.layerOrder = newOrder;
            this.render();
            this.updateLayerCardsUI();
            this.pushHistory(`Reorder Layers: ${newOrder.join(" > ")}`);
          }
          return;
        }

        const card = e.target.closest(".layer-card");
        if (card) {
          const layerId = card.dataset.layerId;
          if (layerId && layerId !== this.activeLayerId) {
            this.selectLayer(layerId);
          }
        }
      });

      // HTML5 Drag and Drop Sorting for Layer Cards
      let draggedCard = null;

      container.addEventListener("dragstart", (e) => {
        const card = e.target.closest(".layer-card");
        if (!card) return;
        draggedCard = card;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.layerId || "");
      });

      container.addEventListener("dragend", () => {
        if (draggedCard) draggedCard.classList.remove("is-dragging");
        container.querySelectorAll(".layer-card").forEach(c => c.classList.remove("drag-over"));
        draggedCard = null;
      });

      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        const card = e.target.closest(".layer-card");
        if (!card || card === draggedCard) return;
        e.dataTransfer.dropEffect = "move";
        card.classList.add("drag-over");
      });

      container.addEventListener("dragleave", (e) => {
        const card = e.target.closest(".layer-card");
        if (card) card.classList.remove("drag-over");
      });

      container.addEventListener("drop", (e) => {
        e.preventDefault();
        container.querySelectorAll(".layer-card").forEach(c => c.classList.remove("drag-over"));
        const card = e.target.closest(".layer-card");
        if (draggedCard && card && draggedCard !== card) {
          const cards = Array.from(container.children);
          const draggedIdx = cards.indexOf(draggedCard);
          const targetIdx = cards.indexOf(card);
          if (draggedIdx < targetIdx) {
            container.insertBefore(draggedCard, card.nextSibling);
          } else {
            container.insertBefore(draggedCard, card);
          }
          const newOrder = Array.from(container.children).map(c => c.dataset.layerId).filter(Boolean);
          this.state.layerOrder = newOrder;
          this.render();
          this.updateLayerCardsUI();
          this.pushHistory(`Reorder Layers: ${newOrder.join(" > ")}`);
        }
      });
    }
  }

  // Duplicate: a copy of the active layer with exactly the same settings, right above it and active
  duplicateLayer() {
    const layers = this.getLayers();
    if (layers.length >= 5) return;
    const source = this.getActiveModule();
    if (!source) return;

    let maxNum = 0;
    for (const l of layers) {
      const match = (l.id || "").match(/layer-(\d+)/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
    const newId = `layer-${maxNum + 1}`;
    const newName = `Layer ${maxNum + 1}`;
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = newId;
    copy.name = newName;

    layers.push(copy);
    if (!this.state.layerOrder) this.state.layerOrder = layers.map(l => l.id);
    const at = this.state.layerOrder.indexOf(source.id);
    this.state.layerOrder.splice(at < 0 ? 0 : at, 0, newId); // above the original
    this.activeLayerId = newId;

    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
    this.render();
    this.pushHistory(`Duplicated ${source.name || source.id} as ${newName}`);
  }

  addLayer() {
    const layers = this.getLayers();
    if (layers.length >= 5) return;

    let maxNum = 0;
    for (const l of layers) {
      const match = (l.id || "").match(/layer-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    const newId = `layer-${nextNum}`;
    const newName = `Layer ${nextNum}`;

    const shapesPool = ["circle", "square", "triangle", "hexagon", "star", "cross"];
    const newShape = shapesPool[layers.length % shapesPool.length];
    const newLayer = createDefaultLayer(newId, newName, newShape, 0, 0, 0);

    layers.push(newLayer);
    if (!this.state.layerOrder) {
      this.state.layerOrder = layers.map(l => l.id);
    }
    this.state.layerOrder.unshift(newId);
    this.activeLayerId = newId;

    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
    this.render();
    this.pushHistory(`Added ${newName}`);
  }

  deleteLayer(layerId) {
    const layers = this.getLayers();
    if (layers.length <= 1) return;

    this.state.layers = layers.filter(l => l.id !== layerId);
    this.state.layerOrder = (this.state.layerOrder || []).filter(id => id !== layerId);

    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.state.layers[0]?.id || "layer-1";
    }

    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
    this.render();
    this.pushHistory(`Deleted Layer ${layerId}`);
  }

  toggleLayerVisibility(layerId) {
    const layers = this.getLayers();
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    layer.visible = layer.visible === false ? true : false;
    this.updateLayerCardsUI();
    this.render();
    this.pushHistory(`Toggled Visibility: ${layer.name || layerId}`);
  }

  selectLayer(layerId) {
    this.activeLayerId = layerId;
    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
  }

  /* =========================================================================
     ART LOG (bottom half of the layers panel)
     Built from the state: the canvas, the modules, then the active layer (its module and one line per control that is ON).
     ========================================================================= */

  // The Art log as a list of entries: { h: "Layer 2" } for a layer heading, { k, v } for a line "key: value".
  // It lists every layer, and for each active feature all its values (checks only when they are on), with the
  // units the sliders show, so it can be copied as a quick, complete recipe of the design.
  artLogEntries() {
    const title = (s) => String(s || "").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
    const pick = (map, key) => (map && map[key]) || title(key);
    const hex = (c) => String(c || "").toUpperCase();
    const layers = this.getLayers();
    const size = this.artboardSize ? `${this.artboardSize.w} × ${this.artboardSize.h} PX` : "";
    const out = [{ k: "Canvas", v: `${size} • ${layers.length} ${layers.length === 1 ? "LAYER" : "LAYERS"}` }];
    const shapeName = (id) => (Shapes[id] || Shapes.circle).name.replace(/\s*\([^)]*\)\s*/g, "");
    const shapes = layers.filter(l => l.visible !== false).map(l => shapeName(l.shape));
    if (shapes.length) out.push({ k: "Modules", v: shapes.join(" + ") });

    const GRIDS = { basic: "Grid", sliding: "Brick", sheared: "Diagonal", curved: "Curved", zigzag: "Zigzag", triangular: "Triangular", alternating: "Alternating", hexagonal: "Hexagonal", free: "Free" };
    const SCHEMES = { centrifugal: "Centrifugal", concentric: "Concentric", centripetal: "Centripetal", spiral: "Spiral", multi_center: "Multiple centers" };
    const PLACE = { centers: "Centers", intersections: "Intersections", both: "Both" };
    const MIX = { none: "None", merge: "Merged", divide: "Divided" };
    const KIN = { distortion: "Elastic", foreshortening: "3D tilt", rotation_wobble: "Wobble", scale_kinship: "Scale", hybrid: "Hybrid" };
    const GATTR = { rotation: "Rotate", scale: "Scale", depth: "Depth", drift: "Drift", shape: "Shape", texture: "Texture", color: "Color" };
    const PATH = { diagonal: "Diagonal", horizontal: "Horizontal", vertical: "Vertical", concentric: "Concentric", zigzag: "Zigzag" };
    const ANOM = { focal: "Focal", fracture: "Rupture", swell: "Swell", tear: "Void", regrid: "Another grid" };
    const DIM = { scale: "Scale", shape: "Shape", direction: "Angle", position: "Position", tone: "Tone", texture: "Texture", space: "Space" };
    const SPREAD = { scattered: "Scattered", balanced: "Balanced", edge: "Toward the edges", center: "Toward the center" };
    const CMODE = { point: "Point", void: "Void", line: "Line", line_void: "Away from line", free: "Hotspots", dense: "Dense", sparse: "Sparse" };
    const ORIENT = { auto: "Auto", outward: "Outward", inward: "Inward", tangent: "Tangent", fixed: "Fixed" };
    const DIRS = { repeated: "Repeated", alternated: "Alternated", undefined: "Undefined" };
    const num = (n) => (Math.round(n * 100) / 100).toString();

    for (const id of (this.state.layerOrder && this.state.layerOrder.length ? this.state.layerOrder : layers.map(l => l.id))) {
      const mod = layers.find(l => l.id === id);
      const s = mod && mod.structure;
      if (!mod || !s) continue;
      out.push({ h: `${mod.name || mod.id}${mod.id === this.activeLayerId ? " (active)" : ""}${mod.visible === false ? " (hidden)" : ""}` });

      // The module
      const fill = mod.wireframe === false;
      if (mod.figures && mod.figures.length) out.push({ k: "Figures", v: mod.figures.map(f => `${shapeName(f.shape)} ${num(f.size)}% (${num(f.x)}, ${num(f.y)}) ${num(f.rotation)}º`).join(" + ") });
      out.push({ k: "Module", v: [shapeName(mod.shape), fill ? "Fill" : "Stroke", hex(mod.color || "#18181F"), ...(fill ? [] : [`stroke ${num(mod.strokeWidth || 1)}px`])].join(" / ") });
      const w = mod.width ?? mod.scale ?? 100, h = mod.height ?? mod.scale ?? 100;
      out.push({ k: "Size", v: [mod.shape === "line" ? `${num(w)}px` : `${num(w)} x ${num(h)}px`, `rotation ${num(mod.rotation || 0)}º`, `offset ${num(mod.offsetX || 0)}, ${num(mod.offsetY || 0)}px`].join(" / ") });
      const cw = mod.containerW > 0 ? `${num(mod.containerW)} x ${num(mod.containerH > 0 ? mod.containerH : mod.containerW)}px` : "canvas";
      out.push({ k: "Container", v: [cw, ...(mod.showContainer !== false ? ["shown"] : []), ...(mod.clipContainer ? ["clip"] : [])].join(" / ") });
      if (mod.id === this.activeLayerId && this.isHidingModifiers()) out.push({ k: "Modifiers", v: "hidden" });

      // Layout
      if (s.enabled) {
        const lines = (color) => hex(color || mod.color || "#18181F");
        if (s.mode === "radiation") {
          const r = s.radiation || {};
          const actual = r.sizeMode === "actual" || r.sizeMode === "fixed";
          const byCont = actual && !!r.raysByContainer && r.scheme !== "centripetal";
          const parts = ["Radiation", pick(SCHEMES, r.scheme), byCont ? `${r.rings} rings` : `${r.rays} rays - ${r.rings} rings`, actual ? "Actual size" : r.moduleScale === "cell" ? "Fit to canvas (modules shrink with the cell)" : "Fit to canvas",
            `Orientation ${pick(ORIENT, r.orientation || "auto")}`, `Direction ${pick(DIRS, r.direction || "repeated")}`];
          if (r.scheme !== "spiral" && r.scheme !== "centripetal") parts.push(`Ring shape ${title(r.ringShape || "circle")}`);
          parts.push(`Open center ${r.centerOpen || 0}%`, `Ring rotation ${r.ringRotation || 0}º`);
          if (r.scheme === "spiral") parts.push(`Spiral twist ${r.spiralTwist ?? 45}º`);
          if (r.scheme === "multi_center") parts.push(`Centers ${r.centerCount || 2}`);
          out.push({ k: "Structure", v: parts.join(" / ") });
          if (byCont) out.push({ k: "Rays follow container", v: "on" });
          if (r.activeClipping) out.push({ k: "Clip cell", v: "on" });
          if (r.checkerInvert) out.push({ k: "Checkerboard", v: "on" });
          if (r.showRays || r.showRings) out.push({ k: "Visible lines", v: ["on", `stroke ${num(r.lineWidth || 1)}px`, lines(r.lineColor), r.showRays && r.showRings ? "rays and rings" : (r.showRays ? "rays" : "rings")].join(" / ") });
        } else {
          const r = s.repetition || {};
          const actual = r.sizeMode === "actual" || r.sizeMode === "fixed";
          const parts = ["Repetition", pick(GRIDS, r.gridType), `C${r.cols} - R${r.rows}`, actual ? "Actual size" : r.moduleScale === "cell" ? "Fit to canvas (modules shrink with the cell)" : "Fit to canvas", pick(PLACE, r.placement || "centers"), pick(MIX, r.cellMix || "none"),
            `Direction ${pick(DIRS, r.direction || "repeated")}`, `Reflection ${title(r.reflection || "none")}`];
          if (r.gridType === "sliding") parts.push(`Row offset ${Math.round((r.slideOffset ?? 0.5) * 100)}%`);
          if (r.gridType === "sheared") parts.push(`Shear angle ${r.shearAngle ?? 15}º`);
          if (r.gridType === "curved" || r.gridType === "zigzag") parts.push(`Wave amount ${r.curveAmount !== undefined ? Math.round(r.curveAmount * 100) : Math.round(((r.curveIntensity || 0) / (600 / Math.max(1, r.cols || 4))) * 100)}%`);
          if (r.gridType === "free") parts.push(`Seed ${r.freeSeed ?? 7}`);
          if ((r.placement || "centers") !== "centers") parts.push(`Intersection size ${r.interScale ?? 50}%`);
          out.push({ k: "Structure", v: parts.join(" / ") });
          if (r.activeClipping) out.push({ k: "Clip cell", v: "on" });
          if (r.checkerInvert) out.push({ k: "Checkerboard", v: "on" });
          if (r.showGridLines) out.push({ k: "Visible lines", v: ["on", `stroke ${num(r.gridLineWidth || 1.5)}px`, lines(r.lineColor), title(r.lineDirection || "both"), r.lineSpacing === "alternate" ? "alternate lines" : "all lines"].join(" / ") });
        }
        const bp = this.blockPixels(s);
        const cur = s.mode === "radiation" ? s.radiation : s.repetition;
        const actualBlock = !!cur && (cur.sizeMode === "actual" || cur.sizeMode === "fixed");
        out.push({ k: "Block", v: `${actualBlock ? "" : `${bp.w} x ${bp.h}px / `}offset ${bp.x}, ${bp.y}px` });
      }
      const f = s.formalStructure;
      if (f && f.enabled && s.mode !== "radiation" && s.enabled) {
        out.push({ k: "Rhythm", v: [`Col B ${Math.round(100 / (f.colRatio || 1))}% of A`, `Row B ${Math.round(100 / (f.rowRatio || 1))}% of A`, `Col gradation ${f.colGrade > 0 ? "+" : ""}${f.colGrade || 0}%`, `Row gradation ${f.rowGrade > 0 ? "+" : ""}${f.rowGrade || 0}%`].join(" / ") });
      }

      // Modifiers
      const sim = s.similarity;
      if (sim && sim.enabled) {
        const jit = sim.cellJitterAmount > 0 ? `${Math.round(sim.cellJitterAmount * 100)}%` : (sim.cellJitter > 0 ? `${sim.cellJitter}px` : "0%");
        const p = [pick(KIN, sim.kinshipType), `Intensity ${sim.intensity}%`, `Jitter ${jit}`];
        p.push(sim.association && sim.association !== "none" ? `Association ${title(sim.association)} ${sim.assocMix ?? 50}%` : "Association None");
        p.push(sim.imperfection && sim.imperfection !== "none" ? `Imperfection ${title(sim.imperfection)} ${sim.imperfAmount ?? 30}%` : "Imperfection None");
        p.push(`Seed ${sim.seed ?? 42}`);
        out.push({ k: "Similarity", v: p.join(" / ") });
      }
      const g = s.gradation;
      if (g && g.enabled) {
        const p = [pick(GATTR, g.type), pick(PATH, g.pathway)];
        if (g.type === "rotation") p.push(`Range ${g.range ?? 180}º`);
        if (g.type === "shape") p.push(`to ${title(g.targetShape || "triangle")}`);
        if (g.type === "color") p.push(`to ${hex(g.endColor || "#f43f5e")}`);
        p.push(`Cycles ${g.steps || 1}`, g.sequence === "pingpong" ? "Ping-pong" : "Restart", `Speed ${g.easing ? (g.easing < 0 ? "+" : "") + (-g.easing) : 0}`);
        if (g.alternate) p.push("Alternate rows");
        if (g.reverse) p.push("Reversed");
        out.push({ k: "Gradation", v: p.join(" / ") });
      }
      const an = s.anomaly;
      if (an && an.enabled) {
        const p = [pick(ANOM, an.type), title(an.distribution || "single")];
        if ((an.distribution || "single") !== "single") p.push(`${an.count ?? 5} zones`, `Seed ${an.seed ?? 7}`);
        else p.push(`at ${Math.round((an.epicenterX ?? 0.5) * 100)}% / ${Math.round((an.epicenterY ?? 0.5) * 100)}%`);
        p.push(`Radius ${an.radius}px`);
        if (an.type !== "regrid") {
          p.push(`Severity ${an.intensity ?? 60}%`);
          const a = an.attrs || {};
          const on = ["shape", "scale", "rotation", "position"].filter(k => a[k] !== false);
          p.push(`deviates in ${on.join(", ") || "nothing"}`);
          if (a.shape !== false) p.push(`intruder ${title(an.anomalousShape || "triangle")}`);
        } else p.push(`zone grid ${title(an.zoneGrid || "sliding")}`);
        if (an.highlightColor) p.push(`accent ${hex(an.accentColor || "#f43f5e")}`);
        if (an.showReticle !== false) p.push("reticle on");
        out.push({ k: "Anomaly", v: p.join(" / ") });
      }
      const co = s.contrast;
      if (co && co.enabled) {
        const p = [pick(DIM, co.dimension), `Dominance ${co.dominanceRatio}%`, pick(SPREAD, co.spread || "scattered")];
        if (co.dimension === "scale") p.push(`${co.scaleFactor ?? 2}x`);
        if (co.dimension === "shape") p.push(`minority ${title(co.contrastShape || "cross")}`);
        if (co.dimension === "direction") p.push(`Clash angle ${co.angle ?? 45}º`);
        if (co.dimension === "tone") p.push(`Tone ${co.toneAmount ?? 50}%`);
        if (co.dimension === "position") p.push(`Shift ${co.positionShift ?? 25}% at ${co.positionAngle ?? 45}º`);
        if (co.highlightContrast) p.push(`accent ${hex(co.accentColor || "#f43f5e")}`);
        out.push({ k: "Contrast", v: p.join(" / ") });
      }
      const cn = s.concentration;
      if (cn && cn.enabled) {
        const p = [pick(CMODE, cn.mode), title(cn.method || "move")];
        if (cn.mode === "free") p.push(`${cn.focusCount ?? 2} foci`);
        p.push(`Pull ${cn.power ?? 50}%`);
        if (cn.mode !== "dense" && cn.mode !== "sparse") p.push(`Radius ${cn.radius ?? 250}px`);
        if (cn.mode === "line" || cn.mode === "line_void") p.push(`${cn.lineAxis === "vertical" ? "vertical" : "horizontal"} axis at ${Math.round(((cn.lineAxis === "vertical" ? cn.attractorX : cn.attractorY) ?? 0.5) * 100)}%`);
        else p.push(`at ${Math.round((cn.attractorX ?? 0.5) * 100)}% / ${Math.round((cn.attractorY ?? 0.5) * 100)}%`);
        if (cn.edgeFade) p.push("edge fade on");
        if (cn.alignToField) p.push("align to field on");
        if (cn.densityScale) p.push("density scale on");
        if (cn.showAttractor) p.push("attractor guide on");
        out.push({ k: "Concentration", v: p.join(" / ") });
      }
      const tx = s.texture;
      if (tx && tx.enabled) {
        out.push({ k: "Texture", v: [`Jitter ${Math.round((tx.jitter || 0) / 0.1)}%`, `Line skipping ${Math.round(tx.skipChance || 0)}%`,
          `Random lines ${Math.round(tx.crossing || 0)}% (opacity ${tx.hairOpacity ?? 85}%)`, `Plane wave ${Math.round((tx.undulation || 0) / 0.3)}% (${tx.waves ?? 2} waves, ${tx.waveAngle ?? 0}º)`].join(" / ") });
      }
      const sp = s.space;
      if (sp && sp.enabled) {
        out.push({ k: "Space", v: [title(sp.mode), `Depth ${sp.depthPct ?? 20}%`, `Angle ${sp.angle ?? 30}º`, `Shading ${sp.shading ?? 50}%`, ...(sp.showIsoGuides ? ["iso guides on"] : [])].join(" / ") });
      }
    }
    return out;
  }

  // The same entries as plain text, for Copy
  artLogText() {
    return this.artLogEntries().map(e => (e.h !== undefined ? `\n${e.h}` : `${e.k}: ${e.v}`)).join("\n").trim();
  }

  updateArtLog() {
    const box = document.getElementById("art-log-lines");
    if (!box) return;
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = this.artLogEntries().map(e => e.h !== undefined
      ? `<p class="art-log__layer">${esc(e.h)}</p>`
      : `<p><span class="art-log__key">${esc(e.k)}</span>: ${esc(e.v)}</p>`).join("");
    if (html !== this._artLogHtml) {
      this._artLogHtml = html;
      box.innerHTML = html;
    }
  }

  copyArtLog() {
    const text = this.artLogText();
    const btn = document.getElementById("btn-art-log-copy");
    const done = () => {
      if (!btn) return;
      const label = btn.querySelector("span");
      if (label) { label.textContent = "Copied"; setTimeout(() => { label.textContent = "Copy"; }, 1200); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => this.copyArtLogFallback(text, done));
    } else this.copyArtLogFallback(text, done);
  }

  copyArtLogFallback(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* the text is still selectable in the log */ }
    ta.remove();
  }

  updateLayerCardsUI() {
    const container = document.getElementById("layers-stack-container");
    const addBtn = document.getElementById("btn-add-pattern");
    const layersCountBadge = document.getElementById("layers-count-badge");

    const layers = this.getLayers();
    const count = layers.length;

    if (layersCountBadge) layersCountBadge.textContent = `${count}`;

    for (const btn of [addBtn, document.getElementById("btn-duplicate-layer")]) {
      if (!btn) continue;
      const isMax = count >= 5;
      btn.disabled = isMax;
      btn.classList.toggle("opacity-40", isMax);
      btn.classList.toggle("cursor-not-allowed", isMax);
    }

    const activeMod = this.getActiveModule();
    const activeName = activeMod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");
    const badgeLayout = document.getElementById("badge-layout-layer");
    if (badgeLayout) badgeLayout.textContent = activeName;
    const badgeSimilarity = document.getElementById("badge-similarity-layer");
    if (badgeSimilarity) badgeSimilarity.textContent = activeName;
    const badgeGradation = document.getElementById("badge-gradation-layer");
    if (badgeGradation) badgeGradation.textContent = activeName;
    const badgeAnomaly = document.getElementById("badge-anomaly-layer");
    if (badgeAnomaly) badgeAnomaly.textContent = activeName;
    const badgeContrast = document.getElementById("badge-contrast-layer");
    if (badgeContrast) badgeContrast.textContent = activeName;
    const badgeConcentration = document.getElementById("badge-concentration-layer");
    if (badgeConcentration) badgeConcentration.textContent = activeName;
    const badgeSpace = document.getElementById("badge-space-layer");
    if (badgeSpace) badgeSpace.textContent = activeName;
    const badgeTexture = document.getElementById("badge-texture-layer");
    if (badgeTexture) badgeTexture.textContent = activeName;

    if (!container) return;

    const order = (this.state.layerOrder && this.state.layerOrder.length > 0)
      ? this.state.layerOrder
      : layers.map(l => l.id);

    const orderedLayers = [];
    for (const id of order) {
      const found = layers.find(l => l.id === id);
      if (found) orderedLayers.push(found);
    }
    for (const l of layers) {
      if (!orderedLayers.includes(l)) orderedLayers.push(l);
    }
    this.state.layerOrder = orderedLayers.map(l => l.id);

    const canDelete = count > 1;
    container.innerHTML = orderedLayers.map(l => {
      const isActive = l.id === this.activeLayerId;
      const isVis = l.visible !== false;
      const shapeDef = Shapes[l.shape] || Shapes.circle;
      const icon = shapeIconHtml(shapeDef);
      const mode = l.wireframe !== false ? "stroke" : "fill";
      const s = l.structure;
      const structText = s?.enabled ? (s.mode === "radiation" ? " • radiation" : " • grid") : "";

      return `
        <div id="layer-card-${l.id}" class="layer-card ${isActive ? 'is-active' : ''} ${!isVis ? 'is-hidden' : ''}" data-layer-id="${l.id}" draggable="true">
          <div class="layer-preview-box pointer-events-none">
            ${icon}
          </div>
          <div class="layer-copy pointer-events-none">
            <div class="layer-title">${l.name || l.id}</div>
            <div class="layer-subtitle">${l.shape} • ${mode}${structText}</div>
          </div>
          <div class="layer-actions">
            <button type="button" class="layer-action-btn btn-layer-eye" data-layer="${l.id}" title="Toggle Visibility" aria-label="Toggle visibility of ${l.name || l.id}">
              ${isVis ? '<i class="ph ph-eye" aria-hidden="true"></i>' : '<i class="ph ph-eye-slash opacity-40" aria-hidden="true"></i>'}
            </button>
            <button type="button" class="layer-action-btn btn-layer-delete ${!canDelete ? 'opacity-25 cursor-not-allowed' : ''}" data-layer="${l.id}" title="${canDelete ? 'Delete Layer' : 'Cannot delete the only layer'}" aria-label="Delete ${l.name || l.id}" ${!canDelete ? 'disabled' : ''}>
              <i class="ph ph-trash" aria-hidden="true"></i>
            </button>
            <span class="layer-action-btn layer-drag-handle cursor-grab active:cursor-grabbing" title="Drag to reorder" aria-hidden="true">
              <i class="ph ph-dots-six-vertical"></i>
            </span>
          </div>
        </div>
      `;
    }).join("");

    this.updateArtLog();
  }

  /* =========================================================================
     CONTROLS RAIL & FLYOUT CONTROLLER (Abstract Studio Dock)
     ========================================================================= */

  setupControlsRail() {
    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.railTab;
        if (this.figEdit) this.leaveFigureEditor(true); // moving to another panel keeps what was edited
        if (this.activeRailTab === tab && this.isFlyoutOpen) {
          // Clicking active button toggles flyout closed
          this.isFlyoutOpen = false;
        } else {
          this.activeRailTab = tab;
          this.isFlyoutOpen = true;
        }
        this.updateRailUI();
      });
    });

    // Close button inside any flyout tab header
    document.querySelectorAll(".close-flyout-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isFlyoutOpen = false;
        this.updateRailUI();
      });
    });

    this.updateRailUI();
    this.updateRailIndicatorDots();
  }

  updateRailUI() {
    const flyout = document.getElementById("inspector-flyout");
    if (flyout) {
      flyout.classList.toggle("is-closed", !this.isFlyoutOpen);
    }

    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      const isSelected = this.isFlyoutOpen && btn.dataset.railTab === this.activeRailTab;
      btn.classList.toggle("active", isSelected);
    });

    const tabContents = document.querySelectorAll(".flyout-tab-content");
    tabContents.forEach(tabEl => {
      const match = tabEl.dataset.flyoutTab === this.activeRailTab;
      tabEl.classList.toggle("hidden", !match);
    });

    // Hide modifiers only acts while the Module panel is open
    // Hide modifiers and the Block frame both depend on which panel is open
    this.render();
  }

  updateRailIndicatorDots() {
    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      const tab = btn.dataset.railTab;
      let isActive = false;
      const mod = this.getActiveModule();
      if (tab === "module") {
        isActive = true;
      } else if (tab === "layout") {
        isActive = !!mod?.structure?.enabled;
      } else if (tab === "structure") {
        isActive = !!mod?.structure?.formalStructure?.enabled;
      } else if (tab === "similarity") {
        isActive = !!mod?.structure?.similarity?.enabled;
      } else if (tab === "gradation") {
        isActive = !!mod?.structure?.gradation?.enabled;
      } else if (tab === "anomaly") {
        isActive = !!mod?.structure?.anomaly?.enabled;
      } else if (tab === "contrast") {
        isActive = !!mod?.structure?.contrast?.enabled;
      } else if (tab === "concentration") {
        isActive = !!mod?.structure?.concentration?.enabled;
      } else if (tab === "space") {
        isActive = !!mod?.structure?.space?.enabled;
      } else if (tab === "texture") {
        isActive = !!mod?.structure?.texture?.enabled;
      }
      btn.classList.toggle("has-modifier-active", isActive);
      // The name says whether the modifier is on for this layer
      const base = btn.dataset.railLabel || (btn.dataset.railLabel = btn.getAttribute("title") || tab);
      btn.setAttribute("aria-label", `${base}, ${isActive ? "on" : "off"}`);
    });
  }

  // A click on the canvas as a position inside the active layer's layout (0 to 1 of its block), which is where the
  // anomaly's focal point and the attractor live
  layoutPointFromClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
    const struct = this.getActiveLayerStructure();
    if (!struct || !struct.enabled) return { x: px, y: py };
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const bf = this.engine.blockFrame(struct, cfg.w, cfg.h);
    return { x: (px * cfg.w - bf.tx) / bf.w, y: (py * cfg.h - bf.ty) / bf.h };
  }

  // Block (Layout): where the layout lives. The sliders show pixels of the canvas (size, and offset from its centre, like
  // Module); the project keeps percentages so the block follows the canvas if its proportion changes
  blockPixels(struct) {
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const b = { x: 50, y: 50, w: 100, h: 100, ...(struct.block || {}) };
    return { w: Math.round((b.w / 100) * cfg.w), h: Math.round((b.h / 100) * cfg.h), x: Math.round(((b.x - 50) / 100) * cfg.w), y: Math.round(((b.y - 50) / 100) * cfg.h), cfg };
  }

  syncBlockInspector(struct) {
    const px = this.blockPixels(struct);
    for (const [k, id] of [["x", "block-x"], ["y", "block-y"], ["w", "block-w"], ["h", "block-h"]]) {
      this.syncControlValue(`input-${id}`, px[k]);
      const num = document.getElementById(`num-${id}`);
      if (num) num.value = `${px[k]}px`;
    }
    const cur = struct.mode === "radiation" ? struct.radiation : struct.repetition;
    const actual = !!cur && (cur.sizeMode === "actual" || cur.sizeMode === "fixed");
    document.getElementById("block-size-fields")?.classList.toggle("hidden", actual);
    // The Block sits right under the design controls of the active mode, before its Advanced section
    const blockEl = document.getElementById("layout-block");
    const adv = document.getElementById(struct.mode === "radiation" ? "rad-advanced" : "rep-advanced");
    if (blockEl && adv && blockEl.nextElementSibling !== adv) adv.parentNode.insertBefore(blockEl, adv);
  }

  syncStructureInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const struct = this.getActiveLayerStructure();
    if (!struct) return;
    this.syncBlockInspector(struct);

    const toggleSwitch = document.getElementById("toggle-layout-structure");
    const btnRep = document.getElementById("btn-layout-repetition");
    const btnRad = document.getElementById("btn-layout-radiation");
    const pnlRep = document.getElementById("subpanel-repetition");
    const pnlRad = document.getElementById("subpanel-radiation");

    const layoutBadge = document.getElementById("badge-layout-layer");
    if (layoutBadge) layoutBadge.textContent = mod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    if (toggleSwitch) toggleSwitch.checked = !!struct.enabled;

    const isRad = struct.mode === "radiation";
    btnRep?.classList.toggle("active", !isRad);
    btnRad?.classList.toggle("active", isRad);

    if (isRad) {
      pnlRep?.classList.add("hidden");
      pnlRad?.classList.remove("hidden");
    } else {
      pnlRep?.classList.remove("hidden");
      pnlRad?.classList.add("hidden");
    }

    // Sync Repetition Controls
    const rep = struct.repetition;
    if (rep) {
      document.querySelectorAll("[data-grid-var]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.gridVar === rep.gridType);
      });
      this.syncControlValue("input-layout-cols", rep.cols || 4);
      this.syncControlValue("num-layout-cols", rep.cols || 4);
      this.syncControlValue("input-layout-rows", rep.rows || 4);
      this.syncControlValue("num-layout-rows", rep.rows || 4);
      this.syncCheckbox("chk-rep-clip", !!rep.activeClipping);
      this.syncCheckbox("chk-rep-gridlines", !!rep.showGridLines);
      this.syncCheckbox("chk-rep-checker", !!rep.checkerInvert);
      this.syncRepetitionExtras(rep);
    }

    // Sync Radiation Controls
    const rad = struct.radiation;
    if (rad) {
      document.querySelectorAll("[data-rad-scheme]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radScheme === rad.scheme);
      });
      // Actual size can let every ring take as many rays as fit the container's width; then the slider has no meaning
      const actualRad = rad.sizeMode === "actual" || rad.sizeMode === "fixed";
      const byContainer = actualRad && !!rad.raysByContainer && rad.scheme !== "centripetal";
      document.getElementById("rad-raysbycont-item")?.classList.toggle("hidden", !actualRad || rad.scheme === "centripetal");
      document.getElementById("input-layout-rays")?.closest(".ds-field")?.classList.toggle("hidden", byContainer);
      this.syncCheckbox("chk-rad-raysbycont", !!rad.raysByContainer);
      this.syncControlValue("input-layout-rays", rad.rays || 12);
      this.syncControlValue("num-layout-rays", rad.rays || 12);
      this.syncControlValue("input-layout-rings", rad.rings || 6);
      this.syncControlValue("num-layout-rings", rad.rings || 6);
      this.syncControlValue("input-layout-centers", rad.centerCount || 2);
      this.syncControlValue("num-layout-centers", rad.centerCount || 2);
      document.getElementById("rad-centers-block")?.classList.toggle("hidden", rad.scheme !== "multi_center");
      this.syncControlValue("input-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      this.syncControlValue("num-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      document.querySelectorAll("[data-rad-size]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radSize === (rad.sizeMode || "fit"));
      });
      document.querySelectorAll("[data-rad-modscale]").forEach(btn => btn.classList.toggle("active", btn.dataset.radModscale === (rad.moduleScale || "uniform")));
      document.getElementById("rad-modscale-block")?.classList.toggle("hidden", rad.sizeMode === "actual" || rad.sizeMode === "fixed");
      document.querySelectorAll("[data-rad-dir]").forEach(btn => btn.classList.toggle("active", btn.dataset.radDir === (rad.direction || "repeated")));
      document.querySelectorAll("[data-rad-shape]").forEach(btn => btn.classList.toggle("active", btn.dataset.radShape === (rad.ringShape || "circle")));
      // Polygonal rings do not apply to spirals or chevrons
      document.getElementById("rad-ringshape-block")?.classList.toggle("hidden", rad.scheme === "spiral" || rad.scheme === "centripetal");
      document.getElementById("rad-lines-block")?.classList.toggle("hidden", !(rad.showRays || rad.showRings));
      this.syncAccentColorRow("radline", rad.lineColor || mod?.color || "#18181f", true);
      this.syncControlValue("input-layout-radline", rad.lineWidth ?? 1);
      this.syncControlValue("num-layout-radline", `${rad.lineWidth ?? 1}px`);
      this.syncControlValue("input-layout-open", rad.centerOpen || 0);
      this.syncControlValue("num-layout-open", `${rad.centerOpen || 0}%`);
      this.syncControlValue("input-layout-ringrot", rad.ringRotation || 0);
      this.syncControlValue("num-layout-ringrot", `${rad.ringRotation || 0}º`);
      document.querySelectorAll("[data-rad-orient]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radOrient === (rad.orientation || "auto"));
      });
      this.syncCheckbox("chk-rad-clip", !!rad.activeClipping);
      this.syncCheckbox("chk-rad-gridlines", !!(rad.showRays || rad.showRings));
      this.syncCheckbox("chk-rad-checker", !!rad.checkerInvert);
    }

    this.updateRailIndicatorDots();
  }

  /* =========================================================================
     LAYOUT STRUCTURE CONTROLLER (Per Active Layer)
     ========================================================================= */

  // Parameter each grid variation exposes (stored value <-> shown value)
  static get REPETITION_PARAMS() {
    return {
      sliding: { label: "Row offset", key: "slideOffset", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      sheared: { label: "Shear angle", key: "shearAngle", min: 0, max: 45, step: 1, suffix: "º", toUi: v => v, fromUi: v => v },
      curved: { label: "Wave amount", key: "curveAmount", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      zigzag: { label: "Wave amount", key: "curveAmount", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      free: { label: "Seed", key: "freeSeed", min: 1, max: 99, step: 1, suffix: "", toUi: v => v, fromUi: v => v }
    };
  }

  // Switching to Actual size with the default container: the container starts as big as a Fit cell,
  // so the structure keeps its rhythm. A container that was already set is left alone.
  startContainerFromCell(cols, rows) {
    const mod = this.getActiveModule();
    if (!mod || mod.containerW > 0 || mod.containerH > 0) return; // only the old "whole canvas" container (0) starts from the cell
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    mod.containerW = Math.round(cfg.w / Math.max(1, cols));
    mod.containerH = Math.round(cfg.h / Math.max(1, rows));
  }

  syncRepetitionExtras(rep) {
    const spec = StudioProApp.REPETITION_PARAMS[rep.gridType];
    const block = document.getElementById("rep-param-block");
    block?.classList.toggle("hidden", !spec);
    if (spec) {
      const slider = document.getElementById("input-layout-param");
      if (slider) { slider.min = spec.min; slider.max = spec.max; slider.step = spec.step; }
      const label = document.getElementById("rep-param-label");
      if (label) label.textContent = spec.label;
      // A project saved in pixels (curveIntensity) is shown as a share of the cell width, without touching the file
      const legacy = spec.key === "curveAmount" && rep.curveAmount === undefined && rep.curveIntensity !== undefined;
      const val = spec.toUi(legacy ? Math.min(1, (rep.curveIntensity || 0) / (600 / Math.max(1, rep.cols || 4))) : (rep[spec.key] ?? 0));
      this.syncControlValue("input-layout-param", val);
      const num = document.getElementById("num-layout-param");
      if (num) num.value = `${val}${spec.suffix}`;
    }
    document.getElementById("rep-lines-block")?.classList.toggle("hidden", !rep.showGridLines);
    this.syncAccentColorRow("repline", rep.lineColor || this.getActiveModule()?.color || "#18181f", true);
    const mark = (attr, value) => document.querySelectorAll(`[${attr}]`).forEach(b => {
      const v = b.getAttribute(attr);
      b.classList.toggle("active", v === value);
    });
    mark("data-rep-size", rep.sizeMode || "fit");
    mark("data-rep-modscale", rep.moduleScale || "uniform");
    document.getElementById("rep-modscale-block")?.classList.toggle("hidden", rep.sizeMode === "actual" || rep.sizeMode === "fixed");
    mark("data-rep-dir", rep.direction || "repeated");
    mark("data-rep-place", rep.placement || "centers");
    mark("data-rep-mix", rep.cellMix || "none");
    // Placement does not apply to the honeycomb; mixed sizes only to the plain and alternating grids
    document.getElementById("rep-placement-block")?.classList.toggle("hidden", rep.gridType === "hexagonal" || rep.gridType === "free");
    document.getElementById("rep-mix-block")?.classList.toggle("hidden", !(rep.gridType === "basic" || rep.gridType === "alternating"));
    const interOn = rep.gridType !== "hexagonal" && rep.gridType !== "free" && (rep.placement || "centers") !== "centers";
    document.getElementById("rep-inter-block")?.classList.toggle("hidden", !interOn);
    this.syncControlValue("input-layout-inter", rep.interScale ?? 50);
    const ni = document.getElementById("num-layout-inter");
    if (ni) ni.value = `${rep.interScale ?? 50}%`;
    mark("data-rep-linedir", rep.lineDirection || "both");
    mark("data-rep-linespace", rep.lineSpacing || "all");
    mark("data-rep-reflect", rep.reflection || "none");
    const w = rep.gridLineWidth ?? 1.5;
    this.syncControlValue("input-layout-linewidth", w);
    const nw = document.getElementById("num-layout-linewidth");
    if (nw) nw.value = `${w}px`;
  }

  // Value boxes: the up and down arrow keys nudge the number by the slider's step (Shift = ten steps, Alt = a tenth of a step)
  setupValueSteppers() {
    document.addEventListener("keydown", (e) => {
      const box = e.target;
      if (!box || !box.classList || !box.classList.contains("ds-value")) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const slider = box.closest(".ds-slider")?.querySelector('input[type="range"]');
      const m = String(box.value).match(/^\s*(-?\d*\.?\d+)(.*)$/);
      if (!slider || !m) return;
      e.preventDefault();
      const step = parseFloat(slider.step) || 1;
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const decimals = Math.max((String(step).split(".")[1] || "").length, e.altKey ? 2 : 0);
      const min = slider.min !== "" ? parseFloat(slider.min) : -Infinity, max = slider.max !== "" ? parseFloat(slider.max) : Infinity;
      let next = parseFloat(m[1]) + (e.key === "ArrowUp" ? 1 : -1) * step * mult;
      next = Math.max(min, Math.min(max, parseFloat(next.toFixed(decimals))));
      box.value = `${next}${m[2]}`;
      box.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  // Dropdowns (.ds-select): the items are the same buttons the controllers already listen to, so a click
  // only has to close the menu. The trigger always shows whichever item is marked active.
  setupSelects() {
    const selects = document.querySelectorAll("[data-select]");
    const closeAll = (except) => selects.forEach(sel => {
      if (sel === except) return;
      sel.querySelector(".ds-dropdown-menu")?.classList.add("hidden");
      sel.querySelector(".ds-dropdown-trigger")?.setAttribute("aria-expanded", "false");
    });
    selects.forEach(sel => {
      const trigger = sel.querySelector(".ds-dropdown-trigger");
      const menu = sel.querySelector(".ds-dropdown-menu");
      const current = sel.querySelector(".ds-dropdown-current");
      const refresh = () => {
        const active = menu.querySelector(".ds-dropdown-item.active") || menu.querySelector(".ds-dropdown-item");
        if (active && current) current.innerHTML = active.innerHTML;
      };
      // The menu floats above the panel (fixed), below the trigger, or above it when there is no room below
      const place = () => {
        const r = trigger.getBoundingClientRect();
        const gap = 6, below = window.innerHeight - r.bottom - gap - 8, above = r.top - gap - 8;
        const want = Math.min(320, menu.scrollHeight);
        const up = below < want && above > below;
        const room = Math.max(120, up ? above : below);
        menu.style.left = `${r.left}px`;
        menu.style.width = `${r.width}px`;
        menu.style.maxHeight = `${Math.min(320, room)}px`;
        const h = Math.min(want, room);
        menu.style.top = `${up ? r.top - gap - h : r.bottom + gap}px`;
      };
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = menu.classList.contains("hidden");
        closeAll(sel);
        menu.classList.toggle("hidden", !open);
        trigger.setAttribute("aria-expanded", String(open));
        if (open) place();
      });
      menu.addEventListener("click", () => {
        menu.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
        refresh();
      });
      new MutationObserver(refresh).observe(menu, { attributes: true, attributeFilter: ["class"], subtree: true });
      refresh();
    });
    document.addEventListener("click", () => closeAll(null));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(null); });
    // A floating menu would stay behind when the panel scrolls or the window changes size
    window.addEventListener("resize", () => closeAll(null));
    document.querySelectorAll(".inspector-flyout-card").forEach(card => card.addEventListener("scroll", () => closeAll(null), { passive: true }));
  }

  setupRepetitionExtras() {
    const rep = () => this.getActiveLayerStructure()?.repetition;

    // Variation parameter (row offset / shear angle / wave amount)
    const slider = document.getElementById("input-layout-param");
    const num = document.getElementById("num-layout-param");
    const applyParam = (uiVal, label, push) => {
      const r = rep(); const spec = r && StudioProApp.REPETITION_PARAMS[r.gridType];
      if (!spec) return;
      const v = Math.max(spec.min, Math.min(spec.max, uiVal));
      r[spec.key] = spec.fromUi(v);
      this.getActiveLayerStructure().mode = "repetition";
      this.syncRepetitionExtras(r);
      this.render();
      if (push) this.pushHistory(`Layer ${this.activeLayerId} ${spec.label}: ${v}${spec.suffix}`);
    };
    slider?.addEventListener("input", (e) => applyParam(parseFloat(e.target.value), "", false));
    slider?.addEventListener("change", (e) => applyParam(parseFloat(e.target.value), "", true));
    num?.addEventListener("change", (e) => {
      const raw = parseFloat(e.target.value.replace(/[^0-9.-]/g, ""));
      applyParam(isNaN(raw) ? 0 : raw, "", true);
    });

    // Tags of the line style and of the reflection (one stored value each)
    const bindTags = (selector, attr, key, label) => {
      document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener("click", () => {
          const r = rep(); if (!r) return;
          r[key] = btn.getAttribute(attr);
          if (key === "sizeMode" && r.sizeMode === "actual") this.startContainerFromCell(r.cols, r.rows);
          this.getActiveLayerStructure().mode = "repetition";
          this.syncAllInspectorsWithActiveLayer();
          this.syncRepetitionExtras(r);
          this.render();
          this.pushHistory(`Layer ${this.activeLayerId} ${label}: ${r[key]}`);
        });
      });
    };
    const bindGuideColor = (id, getBlock, label) => {
      const input = document.getElementById(id);
      input?.addEventListener("input", (e) => {
        const b = getBlock();
        if (!b) return;
        b.lineColor = e.target.value;
        this.syncAccentColorRow(id.replace("-accent-color", ""), e.target.value, true);
        this.render();
      });
      input?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${label}: ${e.target.value.toUpperCase()}`));
    };
    bindGuideColor("repline-accent-color", () => this.getActiveLayerStructure()?.repetition, "Line Color");
    bindGuideColor("radline-accent-color", () => this.getActiveLayerStructure()?.radiation, "Radiation Line Color");
    bindTags("[data-rep-linedir]", "data-rep-linedir", "lineDirection", "Line Direction");
    bindTags("[data-rep-linespace]", "data-rep-linespace", "lineSpacing", "Line Spacing");
    bindTags("[data-rep-reflect]", "data-rep-reflect", "reflection", "Reflection");
    bindTags("[data-rep-size]", "data-rep-size", "sizeMode", "Module Size");
    bindTags("[data-rep-modscale]", "data-rep-modscale", "moduleScale", "Module Scale");
    bindTags("[data-rep-dir]", "data-rep-dir", "direction", "Direction");
    bindTags("[data-rep-place]", "data-rep-place", "placement", "Module Placement");
    bindTags("[data-rep-mix]", "data-rep-mix", "cellMix", "Cell Mix");
    this.bindSliderWithNumber("input-layout-inter", "num-layout-inter", (val) => {
      const r = rep(); if (!r) return;
      r.interScale = Math.max(10, Math.min(100, val));
      this.getActiveLayerStructure().mode = "repetition";
      this.render();
    }, "Intersection Size", "%");

    // Line width of the visible grid lines
    const lw = document.getElementById("input-layout-linewidth");
    const nlw = document.getElementById("num-layout-linewidth");
    const applyWidth = (val, push) => {
      const r = rep(); if (!r) return;
      const v = Math.max(0.5, Math.min(10, val));
      r.gridLineWidth = v;
      this.syncRepetitionExtras(r);
      this.render();
      if (push) this.pushHistory(`Layer ${this.activeLayerId} Grid Line Width: ${v}px`);
    };
    lw?.addEventListener("input", (e) => applyWidth(parseFloat(e.target.value), false));
    lw?.addEventListener("change", (e) => applyWidth(parseFloat(e.target.value), true));
    nlw?.addEventListener("change", (e) => {
      const raw = parseFloat(e.target.value.replace(/[^0-9.]/g, ""));
      applyWidth(isNaN(raw) ? 1.5 : raw, true);
    });
  }

  setupLayoutStructure() {
    const toggleSwitch = document.getElementById("toggle-layout-structure");
    const btnRep = document.getElementById("btn-layout-repetition");
    const btnRad = document.getElementById("btn-layout-radiation");

    // Header Toggle Switch
    toggleSwitch?.addEventListener("change", (e) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      const enabled = e.target.checked;
      struct.enabled = enabled;
      if (!enabled && struct.formalStructure) {
        struct.formalStructure.enabled = false;
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.syncAllInspectorsWithActiveLayer(); // every collective modifier shows or hides its "turn on Layout" notice
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Layout Structure: ${enabled ? "ON" : "OFF"}`);
    });

    const setMode = (mode) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.mode = mode;
      struct.enabled = true;
      if (mode === "radiation" && struct.formalStructure) {
        struct.formalStructure.enabled = false;
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.syncAllInspectorsWithActiveLayer(); // every collective modifier shows or hides its "turn on Layout" notice
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Layout Mode: ${mode}`);
    };

    btnRep?.addEventListener("click", () => setMode("repetition"));
    btnRad?.addEventListener("click", () => setMode("radiation"));

    // Block: the rectangle the layout lives in (size and offset of its centre from the canvas centre, in px)
    for (const [key, id, label] of [["x", "block-x", "Block Offset X"], ["y", "block-y", "Block Offset Y"], ["w", "block-w", "Block Width"], ["h", "block-h", "Block Height"]]) {
      this.bindSliderWithNumber(`input-${id}`, `num-${id}`, (val) => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
        struct.block = { x: 50, y: 50, w: 100, h: 100, ...(struct.block || {}) };
        const along = key === "x" || key === "w" ? cfg.w : cfg.h;
        if (key === "w" || key === "h") struct.block[key] = (Math.max(10, val) / along) * 100;
        else struct.block[key] = 50 + (val / along) * 100;
        this.render();
      }, label, "px");
    }

    // Repetition Variations (Grid, Curved, Brick, Diagonal, Zigzag, Triangular, Alternating)
    document.querySelectorAll("[data-grid-var]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.repetition.gridType = btn.dataset.gridVar;
        struct.mode = "repetition";
        struct.enabled = true;
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Layer ${this.activeLayerId} Grid Var: ${btn.dataset.gridVar}`);
      });
    });

    // Repetition Sliders (Columns, Rows)
    this.bindSliderWithNumber("input-layout-cols", "num-layout-cols", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.repetition.cols = val;
      struct.mode = "repetition";
      this.render();
    });

    this.bindSliderWithNumber("input-layout-rows", "num-layout-rows", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.repetition.rows = val;
      struct.mode = "repetition";
      this.render();
    });

    // Repetition Checkboxes
    const chkRepClip = document.getElementById("chk-rep-clip");
    if (chkRepClip) {
      chkRepClip.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.repetition.activeClipping = e.target.checked;
        this.render();
      });
    }

    const chkRepGrid = document.getElementById("chk-rep-gridlines");
    if (chkRepGrid) {
      chkRepGrid.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) {
          struct.repetition.showGridLines = e.target.checked;
          if (struct.formalStructure) {
            struct.formalStructure.showGridLines = e.target.checked;
          }
        }
        if (struct) this.syncRepetitionExtras(struct.repetition);
        this.render();
      });
    }

    const chkRepChecker = document.getElementById("chk-rep-checker");
    if (chkRepChecker) {
      chkRepChecker.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.repetition.checkerInvert = e.target.checked;
        this.render();
      });
    }

    // Radiation Schemes (Centrifugal, Concentric, Spiral, Dual-center)
    document.querySelectorAll("[data-rad-scheme]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.radiation.scheme = btn.dataset.radScheme;
        struct.mode = "radiation";
        struct.enabled = true;
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Layer ${this.activeLayerId} Rad Scheme: ${btn.dataset.radScheme}`);
      });
    });

    // Radiation Sliders
    this.bindSliderWithNumber("input-layout-rays", "num-layout-rays", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.rays = val;
      struct.mode = "radiation";
      this.render();
    });

    this.bindSliderWithNumber("input-layout-rings", "num-layout-rings", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.rings = val;
      struct.mode = "radiation";
      this.render();
    });

    this.bindSliderWithNumber("input-layout-centers", "num-layout-centers", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.centerCount = Math.max(2, Math.min(8, Math.round(val)));
      struct.mode = "radiation";
      this.render();
    }, "Centers");

    this.bindSliderWithNumber("input-layout-twist", "num-layout-twist", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.spiralTwist = val;
      struct.mode = "radiation";
      this.render();
    });

    const bindRadTags = (selector, dataKey, prop, label) => {
      document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener("click", () => {
          const struct = this.getActiveLayerStructure();
          if (!struct) return;
          struct.radiation[prop] = btn.dataset[dataKey];
          struct.mode = "radiation";
          this.syncStructureInspectorWithActiveLayer();
          this.render();
          this.pushHistory(`Layer ${this.activeLayerId} ${label}: ${btn.dataset[dataKey]}`);
        });
      });
    };
    bindRadTags("[data-rad-modscale]", "radModscale", "moduleScale", "Module scale");
    bindRadTags("[data-rad-dir]", "radDir", "direction", "Radiation Direction");
    bindRadTags("[data-rad-shape]", "radShape", "ringShape", "Ring Shape");
    this.bindSliderWithNumber("input-layout-radline", "num-layout-radline", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.lineWidth = Math.max(0.5, Math.min(10, val));
      this.render();
    }, "Radiation Line Width", "px");

    document.querySelectorAll("[data-rad-size]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.radiation.sizeMode = btn.dataset.radSize;
        if (struct.radiation.sizeMode === "actual") {
          // each ring starts as thick as a Fit ring
          const mod = this.getActiveModule();
          if (mod && !(mod.containerW > 0 || mod.containerH > 0)) {
            const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
            mod.containerH = mod.containerW = Math.round((0.5 * Math.min(cfg.w, cfg.h)) / Math.max(2, struct.radiation.rings));
          }
        }
        struct.mode = "radiation";
        this.syncAllInspectorsWithActiveLayer();
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.pushHistory(`Layer ${this.activeLayerId} Radiation Module Size: ${btn.dataset.radSize}`);
      });
    });

    this.bindSliderWithNumber("input-layout-open", "num-layout-open", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.centerOpen = val;
      struct.mode = "radiation";
      this.render();
    }, "Open Center", "%");

    this.bindSliderWithNumber("input-layout-ringrot", "num-layout-ringrot", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.ringRotation = val;
      struct.mode = "radiation";
      this.render();
    }, "Ring Rotation", "º");

    document.querySelectorAll("[data-rad-orient]").forEach(btn => {
      btn.addEventListener("click", () => {
        const struct = this.getActiveLayerStructure();
        if (!struct) return;
        struct.radiation.orientation = btn.dataset.radOrient;
        struct.mode = "radiation";
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.pushHistory(`Layer ${this.activeLayerId} Module Orientation: ${btn.dataset.radOrient}`);
      });
    });

    // Radiation Checkboxes
    document.getElementById("chk-rad-raysbycont")?.addEventListener("change", (e) => {
      const struct = this.getActiveLayerStructure();
      if (struct) struct.radiation.raysByContainer = e.target.checked;
      this.syncStructureInspectorWithActiveLayer();
      this.render();
      this.pushHistory(`Layer ${this.activeLayerId} Rays follow container: ${e.target.checked ? "ON" : "OFF"}`);
    });
    const chkRadClip = document.getElementById("chk-rad-clip");
    if (chkRadClip) {
      chkRadClip.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.radiation.activeClipping = e.target.checked;
        this.render();
      });
    }

    const chkRadGrid = document.getElementById("chk-rad-gridlines");
    if (chkRadGrid) {
      chkRadGrid.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) {
          struct.radiation.showRays = e.target.checked;
          struct.radiation.showRings = e.target.checked;
        }
        this.syncStructureInspectorWithActiveLayer();
        this.render();
      });
    }

    const chkRadChecker = document.getElementById("chk-rad-checker");
    if (chkRadChecker) {
      chkRadChecker.addEventListener("change", (e) => {
        const struct = this.getActiveLayerStructure();
        if (struct) struct.radiation.checkerInvert = e.target.checked;
        this.render();
      });
    }
  }

  /* =========================================================================
     FORMAL STRUCTURE CONTROLLER (Exact match to mockup media_1790991477208.png)
     Rhythmic Col & Row Ratios, Warning Alert Banner, Visible Grid Lines
     ========================================================================= */

  syncFormalStructureInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    if (!mod) return;

    if (!mod.structure) {
      mod.structure = this.getActiveLayerStructure();
    }
    if (!mod.structure.formalStructure) {
      mod.structure.formalStructure = {
        enabled: false,
        colRatio: 1.0,
        rowRatio: 1.0,
        showGridLines: false
      };
    }

    const fs = mod.structure.formalStructure;

    this.syncControlValue("input-struct-col-ratio", Math.round(100 / (fs.colRatio || 1)));
    this.syncControlValue("num-struct-col-ratio", `${Math.round(100 / (fs.colRatio || 1))}%`);
    this.syncControlValue("input-struct-col-grade", fs.colGrade || 0);
    this.syncControlValue("num-struct-col-grade", `${fs.colGrade || 0}%`);
    this.syncControlValue("input-struct-row-grade", fs.rowGrade || 0);
    this.syncControlValue("num-struct-row-grade", `${fs.rowGrade || 0}%`);
    this.syncControlValue("input-struct-row-ratio", Math.round(100 / (fs.rowRatio || 1)));
    this.syncControlValue("num-struct-row-ratio", `${Math.round(100 / (fs.rowRatio || 1))}%`);

    this.updateRailIndicatorDots();
  }

  setupFormalStructure() {
    // Gradation of structure: columns / rows that grow or shrink step by step
    const bindGrade = (inputId, numId, key, label, lo = -30, hi = 30, suffix = "%") => {
      this.bindSliderWithNumber(inputId, numId, (val) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.formalStructure) {
          mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
        }
        mod.structure.formalStructure[key] = Math.max(lo, Math.min(hi, val));
        mod.structure.formalStructure.enabled = true;
        mod.structure.enabled = true;
        if (mod.structure.mode === "radiation") mod.structure.mode = "repetition";
        this.syncStructureInspectorWithActiveLayer();
        this.render();
        this.updateLayerCardsUI();
      }, label, suffix);
    };
    bindGrade("input-struct-col-grade", "num-struct-col-grade", "colGrade", "Col Gradation");
    bindGrade("input-struct-row-grade", "num-struct-row-grade", "rowGrade", "Row Gradation");

    this.bindSliderWithNumber("input-struct-col-ratio", "num-struct-col-ratio", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      mod.structure.formalStructure.colRatio = Math.max(1, Math.min(10, 100 / Math.max(10, val)));
      mod.structure.formalStructure.enabled = true;
      mod.structure.enabled = true;
      if (mod.structure.mode === "radiation") {
        mod.structure.mode = "repetition";
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
    }, "Col Ratio", "%");

    this.bindSliderWithNumber("input-struct-row-ratio", "num-struct-row-ratio", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      mod.structure.formalStructure.rowRatio = Math.max(1, Math.min(10, 100 / Math.max(10, val)));
      mod.structure.formalStructure.enabled = true;
      mod.structure.enabled = true;
      if (mod.structure.mode === "radiation") {
        mod.structure.mode = "repetition";
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
    }, "Row Ratio", "%");
  }

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
    if (badge) badge.textContent = mod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

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

  /* =========================================================================
     ACCESSIBILITY
     Gives every control an accessible name, keeps aria-pressed in sync with the
     visual "active" state, and makes layer cards reachable from the keyboard.
     ========================================================================= */

  setupAccessibility() {
    const flyout = document.getElementById("inspector-flyout");
    if (flyout) { flyout.setAttribute("role", "region"); flyout.setAttribute("aria-label", "Inspector"); }

    this.enhanceAccessibility(document);

    // Keep aria-pressed / aria-current in sync with the .active / .is-active classes
    const toggleSel = ".ds-tag, .ds-btn-group__button, .shape-circle-btn, .ds-icon-btn";
    const syncState = (el) => {
      if (el.matches(".layer-card")) el.setAttribute("aria-current", el.classList.contains("is-active") ? "true" : "false");
      else if (el.matches(".rail-btn")) el.setAttribute("aria-expanded", el.classList.contains("active") ? "true" : "false"); // is its panel open
      else el.setAttribute("aria-pressed", el.classList.contains("active") ? "true" : "false");
    };
    const stateSel = toggleSel + ", .layer-card, .rail-btn";
    document.querySelectorAll(stateSel).forEach(syncState);

    this.a11yObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes") {
          if (m.target.matches && m.target.matches(stateSel)) syncState(m.target);
        } else {
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            this.enhanceAccessibility(n);
            if (n.matches(stateSel)) syncState(n);
            n.querySelectorAll(stateSel).forEach(syncState);
          });
        }
      }
    });
    this.a11yObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });

    // Layer cards: Enter or Space selects the layer
    document.getElementById("layers-stack-container")?.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("layer-card")) {
        e.preventDefault();
        e.target.click();
      }
    });
  }

  enhanceAccessibility(root) {
    const all = (sel) => {
      const list = Array.from(root.querySelectorAll ? root.querySelectorAll(sel) : []);
      if (root.matches && root.matches(sel)) list.unshift(root);
      return list;
    };
    let uid = this._a11yUid || 0;
    const labelId = (el) => { if (!el.id) el.id = `a11y-label-${++uid}`; return el.id; };

    // Fields: the overline label names the slider, its value box and any group inside
    all(".ds-field").forEach((field) => {
      const label = field.querySelector(":scope > .ds-label");
      if (!label) return;
      const id = labelId(label);
      field.querySelectorAll(":scope > .ds-slider input, :scope > .ds-color-picker input, :scope > .ds-select select").forEach((inp) => {
        if (!inp.hasAttribute("aria-label") && !inp.hasAttribute("aria-labelledby")) inp.setAttribute("aria-labelledby", id);
      });
      field.querySelectorAll(":scope > .ds-tags, :scope > .shape-grid, :scope > .ds-btn-group").forEach((grp) => {
        grp.setAttribute("role", "group");
        if (!grp.hasAttribute("aria-label") && !grp.hasAttribute("aria-labelledby")) grp.setAttribute("aria-labelledby", id);
      });
    });

    // Accent color rows (Anomaly, Contrast): the row label names the color input
    all(".ds-color-row").forEach((row) => {
      const text = row.querySelector(".ds-color-label")?.textContent.trim();
      const inp = row.querySelector("input[type='color']");
      if (inp && text && !inp.hasAttribute("aria-label")) inp.setAttribute("aria-label", text);
    });

    // Switches: named after the card they enable
    all(".ds-switch input").forEach((inp) => {
      if (inp.hasAttribute("aria-label")) return;
      const title = inp.closest("label")?.getAttribute("title") || inp.closest(".ds-card")?.querySelector(".ds-card-title-text")?.textContent || "Toggle";
      inp.setAttribute("aria-label", title);
    });

    // Icon-only buttons take their name from the tooltip
    all("button").forEach((b) => {
      if (b.hasAttribute("aria-label") || b.textContent.trim()) return;
      const t = b.getAttribute("title");
      if (t) b.setAttribute("aria-label", t);
    });
    all(".close-flyout-btn").forEach((b) => b.setAttribute("aria-label", "Close panel"));

    // Layer cards behave like buttons
    all(".layer-card").forEach((c) => { c.setAttribute("role", "button"); c.setAttribute("tabindex", "0"); });

    this._a11yUid = uid;
  }

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
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

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
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

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
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

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
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

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

  /* =========================================================================
     SPACE INSPECTOR & CONTROLLER (Per Active Layer)
     Mode (Isometric, 3D tilt, Fluctuating, Paradox), Extrusion depth,
     Projection angle, Facet shading contrast, 30º isometric grid lines.
     Autonomous modifier: no Repetition / Radiation required.
     ========================================================================= */

  getActiveSpace() {
    const struct = this.getActiveLayerStructure();
    return struct ? struct.space : null;
  }

  syncSpaceInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const space = this.getActiveSpace();
    if (!mod || !space) return;

    const badge = document.getElementById("badge-space-layer");
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    const toggle = document.getElementById("toggle-space-active");
    if (toggle) toggle.checked = !!space.enabled;

    document.querySelectorAll("#card-space [data-space-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.spaceMode === space.mode);
    });

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-space-depth", "num-space-depth", space.depthPct ?? 20, "%");
    setPair("input-space-angle", "num-space-angle", space.angle ?? 30, "º");
    setPair("input-space-shading", "num-space-shading", space.shading ?? 50, "%");

    this.syncCheckbox("toggle-space-guides", !!space.showIsoGuides);

    this.updateRailIndicatorDots();
  }

  setupSpace() {
    const toggle = document.getElementById("toggle-space-active");

    // Any edit enables Space on the active layer, then refreshes everything.
    const commit = (mutate, historyLabel, { resync = true } = {}) => {
      const space = this.getActiveSpace();
      if (!space) return;
      mutate(space);
      space.enabled = true;
      if (toggle) toggle.checked = true;
      if (resync) this.syncSpaceInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };

    toggle?.addEventListener("change", (e) => {
      const space = this.getActiveSpace();
      if (!space) return;
      space.enabled = e.target.checked;
      this.syncSpaceInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Space: ${space.enabled ? "ON" : "OFF"}`);
    });

    document.querySelectorAll("#card-space [data-space-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        commit(sp => { sp.mode = btn.dataset.spaceMode; }, `Space Mode: ${btn.dataset.spaceMode}`);
      });
    });

    const bindPair = (sliderId, numId, { min, max, suffix, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(sp => { sp[key] = val; }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Space ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9-]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(sp => { sp[key] = val; }, `Space ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-space-depth", "num-space-depth", { min: 5, max: 100, suffix: "%", label: "Depth", key: "depthPct" });
    bindPair("input-space-angle", "num-space-angle", { min: -180, max: 180, suffix: "º", label: "Angle", key: "angle" });
    bindPair("input-space-shading", "num-space-shading", { min: 5, max: 100, suffix: "%", label: "Shading", key: "shading" });

    document.getElementById("toggle-space-guides")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(sp => { sp.showIsoGuides = checked; }, `Space Iso Guides: ${checked ? "ON" : "OFF"}`);
    });
  }

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
    if (badge) badge.textContent = mod.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

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

  /* =========================================================================
     CONTEXTUAL SHAPE & STYLE INSPECTOR (Applies to currently active layer)
     ========================================================================= */

  // A line has a length (Width) but no Height, so the Height control is hidden for it.
  updateHeightVisibility(mod) {
    document.getElementById("input-active-height")?.closest(".ds-field")?.classList.toggle("hidden", !!mod && mod.shape === "line");
  }

  /* =========================================================================
     SMART MODULE EDITOR (proof of concept)
     The module as several figures drawn as one shape. The editor shows only the module, big and centred,
     with Save (keep) and Cancel (go back to how it was when the editor opened).
     ========================================================================= */

  // Alternative state used only to draw while the editor is open: the layer alone, no layout and no modifiers,
  // scaled up so the figures can be seen (the figures are a % of the module, so the proportions do not change)
  stateForFigureEdit() {
    const cfg = ASPECT_RATIOS[this.state.aspectRatio] || ASPECT_RATIOS["1:1"];
    const layer = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!layer) return null;
    const big = Math.min(cfg.w, cfg.h) * 0.6;
    const f = big / Math.max(1, Math.max(layer.width || 100, layer.height || 100));
    const off = (b) => (b ? { ...b, enabled: false } : b);
    const s = layer.structure || {};
    const view = {
      ...layer, visible: true, offsetX: 0, offsetY: 0, rotation: 0, width: (layer.width || 100) * f, height: (layer.height || 100) * f,
      containerW: layer.containerW > 0 ? layer.containerW * f : 0, containerH: layer.containerH > 0 ? layer.containerH * f : 0, showContainer: true,
      structure: { ...s, enabled: false, formalStructure: off(s.formalStructure), similarity: off(s.similarity), gradation: off(s.gradation), anomaly: off(s.anomaly), contrast: off(s.contrast), concentration: off(s.concentration), texture: off(s.texture), space: off(s.space) }
    };
    return { ...this.state, layers: [view], layerOrder: [layer.id], showSafeBounds: false };
  }

  currentFigure() {
    if (!this.figEdit) return null;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    return mod && mod.figures ? mod.figures[this.figEdit.index] || null : null;
  }

  enterFigureEditor() {
    const mod = this.getActiveModule();
    if (!mod) return;
    const before = JSON.parse(JSON.stringify(mod.figures || []));
    // A plain module becomes a smart one with its own shape as the first figure
    if (!mod.figures || mod.figures.length === 0) mod.figures = [{ shape: mod.shape, size: 100, x: 0, y: 0, rotation: 0 }];
    this.figEdit = { layerId: mod.id, snapshot: before, index: 0 };
    this.activeRailTab = "figures";
    this.isFlyoutOpen = true;
    this.syncFigureEditor();
    this.updateRailUI();
  }

  // keep = true: Save (also used when the user moves to another panel); false: Cancel
  leaveFigureEditor(keep) {
    if (!this.figEdit) return;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (mod) {
      if (keep) {
        // A single figure with nothing special is just a plain module again
        const only = mod.figures.length === 1 ? mod.figures[0] : null;
        if (only && only.size === 100 && only.x === 0 && only.y === 0 && only.rotation === 0) { mod.shape = only.shape; mod.figures = []; }
        else if (only) mod.shape = only.shape;
      } else {
        mod.figures = this.figEdit.snapshot;
      }
    }
    const id = this.figEdit.layerId;
    this.figEdit = null;
    this.activeRailTab = "module";
    if (keep) this.pushHistory(`Layer ${id} Smart module saved`);
    this.updateRailUI();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();
  }

  syncFigureEditor() {
    if (!this.figEdit) return;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!mod) return;
    const list = document.getElementById("fig-list");
    if (list) {
      list.innerHTML = "";
      mod.figures.forEach((f, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ds-btn" + (i === this.figEdit.index ? " active" : "");
        b.dataset.figIndex = String(i);
        b.textContent = `${i + 1} · ${f.shape}`;
        b.addEventListener("click", () => { this.figEdit.index = i; this.syncFigureEditor(); });
        list.appendChild(b);
      });
    }
    const f = this.currentFigure();
    document.querySelectorAll("#fig-shape-grid [data-fig-shape]").forEach(b => b.classList.toggle("active", !!f && b.dataset.figShape === f.shape));
    const set = (id, v, suffix) => { this.syncControlValue(`input-${id}`, v); const n = document.getElementById(`num-${id}`); if (n) n.value = `${v}${suffix}`; };
    if (f) { set("fig-size", f.size, "%"); set("fig-x", f.x, "%"); set("fig-y", f.y, "%"); set("fig-rot", f.rotation, "º"); }
    document.getElementById("btn-fig-add")?.toggleAttribute("disabled", mod.figures.length >= 4);
    document.getElementById("btn-fig-delete")?.toggleAttribute("disabled", mod.figures.length <= 1);
    document.getElementById("btn-fig-up")?.toggleAttribute("disabled", this.figEdit.index <= 0);
    document.getElementById("btn-fig-down")?.toggleAttribute("disabled", this.figEdit.index >= mod.figures.length - 1);
    this.render();
  }

  setupSmartModule() {
    this.figEdit = null;
    // The shape grid of the editor is a copy of the one in the Module panel
    const grid = document.getElementById("fig-shape-grid");
    const source = document.querySelector("#active-layer-inspector .shape-grid");
    if (grid && source) {
      source.querySelectorAll("[data-shape]").forEach(btn => {
        const c = btn.cloneNode(true);
        c.classList.remove("active");
        c.dataset.figShape = c.dataset.shape;
        c.removeAttribute("data-shape");
        c.addEventListener("click", () => {
          const f = this.currentFigure();
          if (!f) return;
          f.shape = c.dataset.figShape;
          this.syncFigureEditor();
        });
        grid.appendChild(c);
      });
    }

    document.getElementById("btn-edit-figures")?.addEventListener("click", () => this.enterFigureEditor());
    document.getElementById("btn-fig-save")?.addEventListener("click", () => this.leaveFigureEditor(true));
    document.getElementById("btn-fig-cancel")?.addEventListener("click", () => this.leaveFigureEditor(false));

    const mod = () => (this.figEdit ? this.state.layers.find(l => l.id === this.figEdit.layerId) : null);
    document.getElementById("btn-fig-add")?.addEventListener("click", () => {
      const m = mod(); if (!m || m.figures.length >= 4) return;
      m.figures.push({ shape: "circle", size: 50, x: 0, y: 0, rotation: 0 });
      this.figEdit.index = m.figures.length - 1;
      this.syncFigureEditor();
    });
    document.getElementById("btn-fig-delete")?.addEventListener("click", () => {
      const m = mod(); if (!m || m.figures.length <= 1) return;
      m.figures.splice(this.figEdit.index, 1);
      this.figEdit.index = Math.min(this.figEdit.index, m.figures.length - 1);
      this.syncFigureEditor();
    });
    const move = (d) => {
      const m = mod(); if (!m) return;
      const i = this.figEdit.index, j = i + d;
      if (j < 0 || j >= m.figures.length) return;
      [m.figures[i], m.figures[j]] = [m.figures[j], m.figures[i]];
      this.figEdit.index = j;
      this.syncFigureEditor();
    };
    document.getElementById("btn-fig-up")?.addEventListener("click", () => move(-1));
    document.getElementById("btn-fig-down")?.addEventListener("click", () => move(1));

    const pair = (id, key, lo, hi, suffix) => this.bindSliderWithNumber(`input-${id}`, `num-${id}`, (val) => {
      const f = this.currentFigure(); if (!f) return;
      f[key] = Math.max(lo, Math.min(hi, val));
      this.render();
    }, `Figure ${key}`, suffix);
    pair("fig-size", "size", 5, 200, "%");
    pair("fig-x", "x", -100, 100, "%");
    pair("fig-y", "y", -100, 100, "%");
    pair("fig-rot", "rotation", -180, 180, "º");
  }

  setupShapeInspector() {
    // 1. Shape Glyph Selection Grid (15 Shapes)
    document.querySelectorAll("[data-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        const shape = btn.dataset.shape;
        const mod = this.getActiveModule();
        mod.shape = shape;
        
        document.querySelectorAll("[data-shape]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.updateHeightVisibility(mod);

        this.render();
        this.updateLayerCardsUI();
        this.pushHistory(`Changed Shape: ${shape}`);
      });
    });

    // 2. Width (Ancho) & Height (Alto)
    this.bindSliderWithNumber("input-active-width", "num-active-width", (val) => {
      const mod = this.getActiveModule();
      mod.width = val;
      mod.scale = val;
      this.render();
      this.updateLayerCardsUI();
    }, "Width", "px");

    this.bindSliderWithNumber("input-active-height", "num-active-height", (val) => {
      const mod = this.getActiveModule();
      mod.height = val;
      this.render();
      this.updateLayerCardsUI();
    }, "Height", "px");

    // 3. Rotation (Rotación °)
    this.bindSliderWithNumber("input-active-rotation", "num-active-rotation", (val) => {
      const mod = this.getActiveModule();
      mod.rotation = val;
      this.render();
    }, "Rotation", "º");

    // 4. Stroke Width (Grosor Trazo)
    this.bindSliderWithNumber("input-active-stroke", "num-active-stroke", (val) => {
      const mod = this.getActiveModule();
      mod.strokeWidth = val;
      this.render();
    }, "Stroke Width", "px");

    // 4.5 Position Offset (Offset X & Offset Y)
    this.bindSliderWithNumber("input-active-offset-x", "num-active-offset-x", (val) => {
      const mod = this.getActiveModule();
      mod.offsetX = val;
      this.render();
    }, "Offset X", "px");

    this.bindSliderWithNumber("input-active-offset-y", "num-active-offset-y", (val) => {
      const mod = this.getActiveModule();
      mod.offsetY = val;
      this.render();
    }, "Offset Y", "px");

    // Container (the frame the module is composed in, centred on the canvas)
    this.bindSliderWithNumber("input-active-container-w", "num-active-container-w", (val) => {
      const mod = this.getActiveModule();
      mod.containerW = Math.max(10, val);
      this.render();
    }, "Container Width", "px");
    this.bindSliderWithNumber("input-active-container-h", "num-active-container-h", (val) => {
      const mod = this.getActiveModule();
      mod.containerH = Math.max(10, val);
      this.render();
    }, "Container Height", "px");

    document.getElementById("chk-active-clip-container")?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      mod.clipContainer = e.target.checked;
      this.render();
      this.pushHistory(`Layer ${this.activeLayerId} Clip Container: ${e.target.checked ? "ON" : "OFF"}`);
    });

    // The browser may restore a ticked box after a reload while the app starts with the aid off: start them in step
    const hideBox = document.getElementById("chk-hide-modifiers");
    if (hideBox) hideBox.checked = !!this.hideModifiers;
    hideBox?.addEventListener("change", (e) => {
      this.hideModifiers = e.target.checked;
      this.render();
    });

    document.getElementById("chk-active-show-container")?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      mod.showContainer = e.target.checked;
      this.render();
      this.pushHistory(`Layer ${this.activeLayerId} Show Container: ${e.target.checked ? "ON" : "OFF"}`);
    });

    // 5. Drawing Mode: Stroke vs Fill (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    
    btnStroke?.addEventListener("click", () => {
      const mod = this.getActiveModule();
      mod.wireframe = true;
      btnStroke.classList.add("active");
      btnFill?.classList.remove("active");
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Mode: Stroke`);
    });

    btnFill?.addEventListener("click", () => {
      const mod = this.getActiveModule();
      mod.wireframe = false;
      btnFill.classList.add("active");
      btnStroke?.classList.remove("active");
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Mode: Fill`);
    });

    // 6. Color Picker & Hex Code
    const colorPicker = document.getElementById("color-active-shape");
    const colorText = document.getElementById("text-color-hex");
    if (colorPicker) {
      colorPicker.addEventListener("input", (e) => {
        const hex = e.target.value.toUpperCase();
        if (colorText) colorText.textContent = hex;
        const mod = this.getActiveModule();
        if (mod) mod.color = hex;
        this.customColors.fg = hex;
        const swatch = document.getElementById("swatch-active-color");
        if (swatch) swatch.style.backgroundColor = hex;
        this.render();
      });
      colorPicker.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Color: ${e.target.value.toUpperCase()}`);
      });
    }
  }

  syncShapeInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    if (!mod) return;

    // Sync Shape Buttons
    document.querySelectorAll("[data-shape]").forEach(b => {
      b.classList.toggle("active", b.dataset.shape === mod.shape);
    });
    this.updateHeightVisibility(mod);

    // Sync Dimensions
    this.syncControlValue("input-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("num-active-width", `${mod.width || mod.scale || 50}px`);
    this.syncControlValue("input-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("num-active-height", `${mod.height || mod.scale || 50}px`);
    this.syncControlValue("input-active-rotation", mod.rotation || 0);
    this.syncControlValue("num-active-rotation", `${mod.rotation || 0}º`);
    this.syncControlValue("input-active-stroke", mod.strokeWidth || 1);
    this.syncControlValue("num-active-stroke", `${mod.strokeWidth || 1}px`);
    this.syncControlValue("input-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("num-active-offset-x", `${mod.offsetX !== undefined ? mod.offsetX : 0}px`);
    this.syncControlValue("input-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);
    this.syncControlValue("num-active-offset-y", `${mod.offsetY !== undefined ? mod.offsetY : 0}px`);
    const canvasCfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const contW = Math.round(mod.containerW > 0 ? mod.containerW : canvasCfg.w);
    const contH = Math.round(mod.containerH > 0 ? mod.containerH : canvasCfg.h);
    this.syncControlValue("input-active-container-w", contW);
    this.syncControlValue("num-active-container-w", `${contW}px`);
    this.syncControlValue("input-active-container-h", contH);
    this.syncControlValue("num-active-container-h", `${contH}px`);
    this.syncCheckbox("chk-active-show-container", mod.showContainer !== false);
    this.syncCheckbox("chk-active-clip-container", !!mod.clipContainer);

    // Sync Mode (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    const isWireframe = mod.wireframe !== false;
    if (isWireframe) {
      btnStroke?.classList.add("active");
      btnFill?.classList.remove("active");
    } else {
      btnFill?.classList.add("active");
      btnStroke?.classList.remove("active");
    }

    // Sync Swatch & Color Picker
    const swatch = document.getElementById("swatch-active-color");
    const hexText = document.getElementById("text-color-hex");
    const layerColor = mod.color || this.customColors.fg || "#18181F";
    const cp = document.getElementById("color-active-shape");
    if (cp && layerColor.startsWith("#") && layerColor.length === 7) {
      cp.value = layerColor;
    }
    if (swatch) swatch.style.backgroundColor = layerColor;
    if (hexText) hexText.textContent = layerColor.toUpperCase();
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
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const ratio = cfg.w / cfg.h;

    const flyoutWidth = flyout ? flyout.offsetWidth : 300;
    const flyoutLeft = workspace.getBoundingClientRect().right - parseFloat(getComputedStyle(workspace).getPropertyValue("--flyout-right") || 66) - flyoutWidth;
    const maxOuterW = Math.max(160, flyoutLeft - GAP - column.getBoundingClientRect().left);

    const innerH = Math.max(120, Math.min(stage.clientHeight - BORDER * 2, (maxOuterW - BORDER * 2) / ratio));
    const h = Math.floor(innerH);
    const w = Math.floor(innerH * ratio);

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
    if (this.figEdit) return; // the smart module editor makes one undo step, when it is saved
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

// Auto-boot upon DOM readiness
document.addEventListener("DOMContentLoaded", () => {
  window.studioProApp = new StudioProApp();
});
