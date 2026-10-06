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
    this.engine.viewState = this.isHidingModifiers() ? this.stateWithoutModifiers() : null;
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
      return { ...l, structure: { ...s, enabled: false, similarity: off(s.similarity), gradation: off(s.gradation), anomaly: off(s.anomaly), contrast: off(s.contrast), concentration: off(s.concentration), texture: off(s.texture), space: off(s.space) } };
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

    const used = new Set();
    const layers = raw.layers.slice(0, 5).map((src, i) => {
      const layer = merge(createDefaultLayer(`layer-${i + 1}`, `Layer ${i + 1}`), src);
      if (!STUDIO_SHAPE_KEYS.includes(layer.shape)) layer.shape = "circle";
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

  updateArtLog() {
    const box = document.getElementById("art-log-lines");
    if (!box) return;
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const title = (s) => String(s || "").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
    const pick = (map, key) => (map && map[key]) || title(key);
    const line = (key, value) => `<p><span class="art-log__key">${esc(key)}</span>: ${esc(value)}</p>`;

    const layers = this.getLayers();
    const size = this.artboardSize ? `${this.artboardSize.w} × ${this.artboardSize.h} PX` : "";
    const out = [`<p><span class="art-log__key">Canvas</span>: <span id="hud-resolution">${esc(size)}</span> • <span id="hud-layers-status">${layers.length} ${layers.length === 1 ? "LAYER" : "LAYERS"}</span></p>`];

    const shapeName = (id) => (Shapes[id] || Shapes.circle).name.replace(/\s*\([^)]*\)\s*/g, "");
    const shapes = layers.filter(l => l.visible !== false).map(l => shapeName(l.shape));
    if (shapes.length) out.push(line("Modules", shapes.join(" + ")));

    const mod = this.getActiveModule();
    const s = mod && mod.structure;
    if (mod && s) {
      out.push(`<p class="art-log__layer">${esc(mod.name || mod.id)}</p>`);
      out.push(line("Module", shapeName(mod.shape)));
      if (this.isHidingModifiers()) out.push(line("Modifiers", "hidden"));
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

      if (s.enabled) {
        if (s.mode === "radiation") {
          const r = s.radiation || {};
          out.push(line("Structure", ["Radiation", pick(SCHEMES, r.scheme), `${r.rays} rays - ${r.rings} rings`, r.sizeMode === "actual" ? "Actual size" : "Fit to canvas"].join(" / ")));
        } else {
          const r = s.repetition || {};
          out.push(line("Structure", ["Repetition", pick(GRIDS, r.gridType), `C${r.cols} - R${r.rows}`, r.sizeMode === "actual" ? "Actual size" : "Fit to canvas", pick(PLACE, r.placement || "centers"), pick(MIX, r.cellMix || "none")].join(" / ")));
        }
        const f = s.formalStructure;
        if (f && f.enabled && s.mode !== "radiation") {
          const parts = [];
          if ((f.colRatio || 1) !== 1) parts.push(`Col ${f.colRatio}:1`);
          if ((f.rowRatio || 1) !== 1) parts.push(`Row ${f.rowRatio}:1`);
          if (f.colGrade) parts.push(`Col ${f.colGrade > 0 ? "+" : ""}${f.colGrade}%`);
          if (f.rowGrade) parts.push(`Row ${f.rowGrade > 0 ? "+" : ""}${f.rowGrade}%`);
          if (parts.length) out.push(line("Rhythm", parts.join(" / ")));
        }
      }
      const sim = s.similarity;
      if (sim && sim.enabled) {
        const p = [pick(KIN, sim.kinshipType), `${sim.intensity}%`];
        if (sim.association && sim.association !== "none") p.push(title(sim.association));
        if (sim.imperfection && sim.imperfection !== "none") p.push(title(sim.imperfection));
        out.push(line("Similarity", p.join(" / ")));
      }
      const g = s.gradation;
      if (g && g.enabled) {
        const p = [pick(GATTR, g.type), pick(PATH, g.pathway)];
        if ((g.steps || 1) > 1) p.push(`${g.steps} cycles`);
        if (g.reverse) p.push("Reversed");
        out.push(line("Gradation", p.join(" / ")));
      }
      const an = s.anomaly;
      if (an && an.enabled) out.push(line("Anomaly", [pick(ANOM, an.type), title(an.distribution || "single"), `${an.radius}px`].join(" / ")));
      const co = s.contrast;
      if (co && co.enabled) out.push(line("Contrast", [pick(DIM, co.dimension), `${co.dominanceRatio}%`, pick(SPREAD, co.spread || "scattered")].join(" / ")));
      const cn = s.concentration;
      if (cn && cn.enabled) out.push(line("Concentration", [pick(CMODE, cn.mode), title(cn.method || "move")].join(" / ")));
      const tx = s.texture;
      if (tx && tx.enabled) out.push(line("Texture", `Jitter ${tx.jitter} / Undulation ${tx.undulation}`));
      const sp = s.space;
      if (sp && sp.enabled) out.push(line("Space", `${title(sp.mode)} / Depth ${sp.depth}`));
    }

    const html = out.join("");
    if (html !== this._artLogHtml) {
      this._artLogHtml = html;
      box.innerHTML = html;
    }
  }

  updateLayerCardsUI() {
    const container = document.getElementById("layers-stack-container");
    const addBtn = document.getElementById("btn-add-pattern");
    const layersCountBadge = document.getElementById("layers-count-badge");

    const layers = this.getLayers();
    const count = layers.length;

    if (layersCountBadge) layersCountBadge.textContent = `${count}`;

    if (addBtn) {
      const isMax = count >= 5;
      addBtn.disabled = isMax;
      addBtn.classList.toggle("opacity-40", isMax);
      addBtn.classList.toggle("cursor-not-allowed", isMax);
    }

    const activeMod = this.getActiveModule();
    const activeName = activeMod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");
    const badgeModule = document.getElementById("active-layer-indicator-badge");
    if (badgeModule) badgeModule.textContent = activeName;
    const badgeLayout = document.getElementById("badge-layout-layer");
    if (badgeLayout) badgeLayout.textContent = activeName;
    const badgeStructure = document.getElementById("badge-structure-layer");
    if (badgeStructure) badgeStructure.textContent = activeName;
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
    if (this.hideModifiers) this.render();
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

  syncStructureInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    const struct = this.getActiveLayerStructure();
    if (!struct) return;

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
      this.syncControlValue("input-layout-rays", rad.rays || 12);
      this.syncControlValue("num-layout-rays", rad.rays || 12);
      this.syncControlValue("input-layout-rings", rad.rings || 5);
      this.syncControlValue("num-layout-rings", rad.rings || 5);
      this.syncControlValue("input-layout-centers", rad.centerCount || 2);
      this.syncControlValue("num-layout-centers", rad.centerCount || 2);
      document.getElementById("rad-centers-block")?.classList.toggle("hidden", rad.scheme !== "multi_center");
      this.syncControlValue("input-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      this.syncControlValue("num-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      document.querySelectorAll("[data-rad-size]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.radSize === (rad.sizeMode || "fit"));
      });
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
      curved: { label: "Wave amount", key: "curveIntensity", min: 0, max: 60, step: 1, suffix: "px", toUi: v => v, fromUi: v => v },
      zigzag: { label: "Wave amount", key: "curveIntensity", min: 0, max: 60, step: 1, suffix: "px", toUi: v => v, fromUi: v => v },
      free: { label: "Seed", key: "freeSeed", min: 1, max: 99, step: 1, suffix: "", toUi: v => v, fromUi: v => v }
    };
  }

  // Switching to Actual size with the default container: the container starts as big as a Fit cell,
  // so the structure keeps its rhythm. A container that was already set is left alone.
  startContainerFromCell(cols, rows) {
    const mod = this.getActiveModule();
    if (!mod || mod.containerW > 0 || mod.containerH > 0) return;
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
      const val = spec.toUi(rep[spec.key] ?? 0);
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
      const v = Math.max(0.5, Math.min(6, val));
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
        const structGrid = document.getElementById("chk-struct-gridlines");
        if (structGrid) structGrid.checked = e.target.checked;
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
      struct.radiation.centerCount = Math.max(2, Math.min(6, Math.round(val)));
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
    bindRadTags("[data-rad-dir]", "radDir", "direction", "Radiation Direction");
    bindRadTags("[data-rad-shape]", "radShape", "ringShape", "Ring Shape");
    this.bindSliderWithNumber("input-layout-radline", "num-layout-radline", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.lineWidth = Math.max(0.5, Math.min(6, val));
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
            mod.containerH = mod.containerW = Math.round((0.42 * Math.min(cfg.w, cfg.h)) / Math.max(2, struct.radiation.rings));
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

    // Update layer badge
    const badge = document.getElementById("badge-structure-layer");
    if (badge) badge.textContent = mod?.name || (this.activeLayerId === "layer-2" ? "Layer 2" : "Layer 1");

    // Dynamic warning: This control cannot be used when Radiation is active in Layout structure control
    const isRadActive = !!(mod.structure.enabled && mod.structure.mode === "radiation");
    const warnBox = document.getElementById("warning-structure-radiation");
    const controlsGroup = document.getElementById("struct-controls-group");
    const toggle = document.getElementById("toggle-structure-active");

    if (warnBox) warnBox.classList.toggle("hidden", !isRadActive);
    if (controlsGroup) {
      controlsGroup.classList.toggle("opacity-40", isRadActive);
      controlsGroup.classList.toggle("pointer-events-none", isRadActive);
    }

    if (toggle) {
      toggle.checked = !!fs.enabled;
      toggle.disabled = isRadActive;
    }

    this.syncControlValue("input-struct-col-ratio", fs.colRatio !== undefined ? fs.colRatio : 1);
    this.syncControlValue("num-struct-col-ratio", fs.colRatio !== undefined ? fs.colRatio : 1);
    this.syncControlValue("input-struct-col-grade", fs.colGrade || 0);
    this.syncControlValue("num-struct-col-grade", `${fs.colGrade || 0}%`);
    this.syncControlValue("input-struct-row-grade", fs.rowGrade || 0);
    this.syncControlValue("num-struct-row-grade", `${fs.rowGrade || 0}%`);
    this.syncControlValue("input-struct-row-ratio", fs.rowRatio !== undefined ? fs.rowRatio : 1);
    this.syncControlValue("num-struct-row-ratio", fs.rowRatio !== undefined ? fs.rowRatio : 1);
    this.syncCheckbox("chk-struct-gridlines", !!fs.showGridLines);

    this.updateRailIndicatorDots();
  }

  setupFormalStructure() {
    const toggle = document.getElementById("toggle-structure-active");

    toggle?.addEventListener("change", (e) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      const enabled = e.target.checked;
      mod.structure.formalStructure.enabled = enabled;
      if (enabled) {
        mod.structure.enabled = true;
        if (mod.structure.mode === "radiation") {
          mod.structure.mode = "repetition";
        }
      }
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Formal Structure: ${enabled ? "ON" : "OFF"}`);
    });

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
      mod.structure.formalStructure.colRatio = val;
      mod.structure.formalStructure.enabled = true;
      mod.structure.enabled = true;
      if (mod.structure.mode === "radiation") {
        mod.structure.mode = "repetition";
      }
      if (toggle) toggle.checked = true;
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
    }, "Col Ratio");

    this.bindSliderWithNumber("input-struct-row-ratio", "num-struct-row-ratio", (val) => {
      const mod = this.getActiveModule();
      if (!mod || !mod.structure) return;
      if (!mod.structure.formalStructure) {
        mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
      }
      mod.structure.formalStructure.rowRatio = val;
      mod.structure.formalStructure.enabled = true;
      mod.structure.enabled = true;
      if (mod.structure.mode === "radiation") {
        mod.structure.mode = "repetition";
      }
      if (toggle) toggle.checked = true;
      this.syncStructureInspectorWithActiveLayer();
      this.syncFormalStructureInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
    }, "Row Ratio");

    const chkGrid = document.getElementById("chk-struct-gridlines");
    if (chkGrid) {
      chkGrid.addEventListener("change", (e) => {
        const mod = this.getActiveModule();
        if (!mod || !mod.structure) return;
        if (!mod.structure.formalStructure) {
          mod.structure.formalStructure = { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false };
        }
        mod.structure.formalStructure.showGridLines = e.target.checked;
        if (mod.structure.repetition) {
          mod.structure.repetition.showGridLines = e.target.checked;
        }
        const repGrid = document.getElementById("chk-rep-gridlines");
        if (repGrid) repGrid.checked = e.target.checked;
        this.render();
      });
    }
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
    const jitter = sim.cellJitter !== undefined ? sim.cellJitter : 0;
    this.syncControlValue("input-sim-jitter", jitter);
    this.syncControlValue("num-sim-jitter", jitter);

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
      mod.structure.similarity.cellJitter = val;
      mod.structure.similarity.enabled = true;
      if (toggle) toggle.checked = true;
      this.render();
    }, "Cell Jitter");
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

    const easing = grad.easing ?? 0;
    this.syncControlValue("input-grad-easing", easing);
    this.syncControlValue("num-grad-easing", easing > 0 ? `+${easing}` : `${easing}`);

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

    // Range (15º to 360º)
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
      const val = isNaN(raw) ? 180 : Math.max(15, Math.min(360, raw));
      commit(g => { g.range = val; }, `Gradation Range: ${val}º`);
    });

    // Cycles (1 to 4)
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
      const val = isNaN(raw) ? 1 : Math.max(1, Math.min(4, raw));
      commit(g => { g.steps = val; }, `Gradation Cycles: ${val}`);
    });

    // Acceleration (-100 brakes, 100 accelerates)
    const inputEasing = document.getElementById("input-grad-easing");
    const numEasing = document.getElementById("num-grad-easing");
    const showEasing = (v) => { if (numEasing) numEasing.value = v > 0 ? `+${v}` : `${v}`; };
    inputEasing?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      commit(g => { g.easing = val; }, null, { resync: false });
      showEasing(val);
    });
    inputEasing?.addEventListener("change", (e) => {
      this.pushHistory(`Layer ${this.activeLayerId} Gradation Acceleration: ${e.target.value}`);
    });
    numEasing?.addEventListener("change", (e) => {
      const raw = parseInt(e.target.value.replace(/[^0-9-]/g, ""), 10);
      const val = isNaN(raw) ? 0 : Math.max(-100, Math.min(100, raw));
      commit(g => { g.easing = val; }, `Gradation Acceleration: ${val}`);
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
    setPair("input-anom-radius", "num-anom-radius", anom.radius ?? 160, "px");
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
    setPair("input-anom-intensity", "num-anom-intensity", anom.intensity ?? 65, "%");

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
    bindPair("input-anom-count", "num-anom-count", { min: 2, max: 12, suffix: "", toStored: v => v, label: "Count", key: "count" });
    bindPair("input-anom-seed", "num-anom-seed", { min: 1, max: 99, suffix: "", toStored: v => v, label: "Seed", key: "seed" });
    bindPair("input-anom-radius", "num-anom-radius", { min: 50, max: 350, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });
    bindPair("input-anom-intensity", "num-anom-intensity", { min: 10, max: 100, suffix: "%", toStored: v => v, label: "Severity", key: "intensity" });

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
      const rect = this.canvas.getBoundingClientRect();
      const nx = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0.1, Math.min(0.9, (e.clientY - rect.top) / rect.height));
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

    const scale = con.scaleFactor ?? 2.2;
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
    bindPair("input-contrast-scale", "num-contrast-scale", { min: 0.2, max: 3, suffix: "x", label: "Scale", key: "scaleFactor" });
    bindPair("input-contrast-angle", "num-contrast-angle", { min: 15, max: 90, suffix: "º", label: "Angle", key: "angle" });
    bindPair("input-contrast-tone", "num-contrast-tone", { min: 10, max: 90, suffix: "%", label: "Tone", key: "toneAmount" });
    bindPair("input-contrast-shift", "num-contrast-shift", { min: 5, max: 50, suffix: "%", label: "Shift", key: "positionShift" });
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
    setPair("input-conc-radius", "num-conc-radius", conc.radius ?? 240, "px");

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
    bindPair("input-conc-x", "num-conc-x", { min: 5, max: 95, suffix: "%", toStored: v => v / 100, label: "X", key: "attractorX" });
    bindPair("input-conc-y", "num-conc-y", { min: 5, max: 95, suffix: "%", toStored: v => v / 100, label: "Y", key: "attractorY" });
    bindPair("input-conc-foci", "num-conc-foci", { min: 2, max: 6, suffix: "", toStored: v => v, label: "Foci", key: "focusCount" });
    bindPair("input-conc-power", "num-conc-power", { min: 20, max: 100, suffix: "%", toStored: v => v, label: "Pull", key: "power" });
    bindPair("input-conc-radius", "num-conc-radius", { min: 80, max: 450, suffix: "px", toStored: v => v, label: "Radius", key: "radius" });

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
      const rect = this.canvas.getBoundingClientRect();
      const nx = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
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
    setPair("input-space-depth", "num-space-depth", space.depth ?? 10, "px");
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
    bindPair("input-space-depth", "num-space-depth", { min: 10, max: 80, suffix: "px", label: "Depth", key: "depth" });
    bindPair("input-space-angle", "num-space-angle", { min: -60, max: 60, suffix: "º", label: "Angle", key: "angle" });
    bindPair("input-space-shading", "num-space-shading", { min: 20, max: 100, suffix: "%", label: "Shading", key: "shading" });

    document.getElementById("toggle-space-guides")?.addEventListener("change", (e) => {
      const checked = e.target.checked;
      commit(sp => { sp.showIsoGuides = checked; }, `Space Iso Guides: ${checked ? "ON" : "OFF"}`);
    });
  }

  /* =========================================================================
     TEXTURE INSPECTOR & CONTROLLER (Per Active Layer)
     Geometry deformations that read as texture: Jitter, Line skipping,
     Strand crossing, Perimeter undulation. Autonomous modifier.
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

    const setPair = (sliderId, numId, value, suffix) => {
      this.syncControlValue(sliderId, value);
      const num = document.getElementById(numId);
      if (num) num.value = `${value}${suffix}`;
    };
    setPair("input-texture-jitter", "num-texture-jitter", tex.jitter ?? 1, "px");
    setPair("input-texture-skip", "num-texture-skip", tex.skipChance ?? 10, "%");
    setPair("input-texture-crossing", "num-texture-crossing", tex.crossing ?? 10, "%");
    setPair("input-texture-undulation", "num-texture-undulation", tex.undulation ?? 10, "px");

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

    const bindPair = (sliderId, numId, { min, max, suffix, label, key }) => {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numId);
      slider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        commit(t => { t[key] = val; }, null, { resync: false });
        if (num) num.value = `${val}${suffix}`;
      });
      slider?.addEventListener("change", (e) => {
        this.pushHistory(`Layer ${this.activeLayerId} Texture ${label}: ${e.target.value}${suffix}`);
      });
      num?.addEventListener("change", (e) => {
        const raw = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
        const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
        commit(t => { t[key] = val; }, `Texture ${label}: ${val}${suffix}`);
      });
    };
    bindPair("input-texture-jitter", "num-texture-jitter", { min: 0, max: 8, suffix: "px", label: "Jitter", key: "jitter" });
    bindPair("input-texture-skip", "num-texture-skip", { min: 0, max: 60, suffix: "%", label: "Line Skipping", key: "skipChance" });
    bindPair("input-texture-crossing", "num-texture-crossing", { min: 0, max: 60, suffix: "%", label: "Strand Crossing", key: "crossing" });
    bindPair("input-texture-undulation", "num-texture-undulation", { min: 0, max: 30, suffix: "px", label: "Undulation", key: "undulation" });
  }

  /* =========================================================================
     CONTEXTUAL SHAPE & STYLE INSPECTOR (Applies to currently active layer)
     ========================================================================= */

  // A line has a length (Width) but no Height, so the Height control is hidden for it.
  updateHeightVisibility(mod) {
    document.getElementById("input-active-height")?.closest(".ds-field")?.classList.toggle("hidden", !!mod && mod.shape === "line");
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
    }, "Width");

    this.bindSliderWithNumber("input-active-height", "num-active-height", (val) => {
      const mod = this.getActiveModule();
      mod.height = val;
      this.render();
      this.updateLayerCardsUI();
    }, "Height");

    // 3. Rotation (Rotación °)
    this.bindSliderWithNumber("input-active-rotation", "num-active-rotation", (val) => {
      const mod = this.getActiveModule();
      mod.rotation = val;
      this.render();
    }, "Rotation");

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
    }, "Offset X");

    this.bindSliderWithNumber("input-active-offset-y", "num-active-offset-y", (val) => {
      const mod = this.getActiveModule();
      mod.offsetY = val;
      this.render();
    }, "Offset Y");

    // Container (the frame the module is composed in, centred on the canvas)
    this.bindSliderWithNumber("input-active-container-w", "num-active-container-w", (val) => {
      const mod = this.getActiveModule();
      mod.containerW = Math.max(20, val);
      this.render();
    }, "Container Width", "px");
    this.bindSliderWithNumber("input-active-container-h", "num-active-container-h", (val) => {
      const mod = this.getActiveModule();
      mod.containerH = Math.max(20, val);
      this.render();
    }, "Container Height", "px");

    document.getElementById("chk-hide-modifiers")?.addEventListener("change", (e) => {
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
    this.syncControlValue("num-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("input-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("num-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("input-active-rotation", mod.rotation || 0);
    this.syncControlValue("num-active-rotation", mod.rotation || 0);
    this.syncControlValue("input-active-stroke", mod.strokeWidth || 1);
    this.syncControlValue("num-active-stroke", `${mod.strokeWidth || 1}px`);
    this.syncControlValue("input-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("num-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("input-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);
    this.syncControlValue("num-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);
    const canvasCfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const contW = Math.round(mod.containerW > 0 ? mod.containerW : canvasCfg.w);
    const contH = Math.round(mod.containerH > 0 ? mod.containerH : canvasCfg.h);
    this.syncControlValue("input-active-container-w", contW);
    this.syncControlValue("num-active-container-w", `${contW}px`);
    this.syncControlValue("input-active-container-h", contH);
    this.syncControlValue("num-active-container-h", `${contH}px`);
    this.syncCheckbox("chk-active-show-container", mod.showContainer !== false);

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
