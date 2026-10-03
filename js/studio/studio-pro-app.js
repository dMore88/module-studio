/**
 * MODULE STUDIO PRO — Master Application Controller
 * Inspired by Abstract Studio: Canvas-First, Floating Capas Stack, Shape Inspector & Procedural Stack.
 */

import { StudioEngine, defaultStudioState, createDefaultLayerStructure, createDefaultLayer } from './studio-engine.js';
import { Shapes } from './shapes.js';
import { CanvasUtils } from '../canvas-utils.js';
import { STUDIO_PRESETS } from './presets-gallery.js';
import { StudioExporter } from './exporter.js';

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
    
    // Viewport Navigation state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.isSpacePressed = false;

    // Active Layer Management (Each layer is a module!)
    this.activeLayerId = "layer-2"; // 'layer-1' (Form A) or 'layer-2' (Form B)

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

    // Dragging canvas handles
    this.activeDragHandle = null;

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
    this.setupFormalStructure();
    this.setupSimilarity();
    this.setupShapeInspector();
    this.setupInteractiveHandles();
    this.setupModifierCards();

    // Initial render
    this.updateActivePalette();
    this.render();
    this.centerArtboard();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();

    // Sync header button states
    const gridBtn = document.getElementById("btn-toggle-grid");
    if (gridBtn) gridBtn.classList.toggle("active", !!this.state.showSafeBounds);
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
      this.state.layers = [];
      if (this.state.formA) this.state.layers.push(this.state.formA);
      if (this.state.formB && this.state.formB.enabled !== false) this.state.layers.push(this.state.formB);
      if (this.state.layers.length === 0) {
        this.state.layers.push(createDefaultLayer("layer-1", "Layer 1", "circle", 0, 0, 4.5));
      }
    }
    return this.state.layers;
  }

  getActiveModule() {
    const layers = this.getLayers();
    const active = layers.find(l => l.id === this.activeLayerId);
    if (active) return active;
    return layers[0] || this.state.formA;
  }

  syncLegacyLayerRefs() {
    const layers = this.getLayers();
    this.state.formA = layers[0] || null;
    this.state.formB = layers[1] || null;
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
    return mod.structure;
  }

  syncAllInspectorsWithActiveLayer() {
    this.syncShapeInspectorWithActiveLayer();
    this.syncStructureInspectorWithActiveLayer();
    this.syncFormalStructureInspectorWithActiveLayer();
    this.syncSimilarityInspectorWithActiveLayer();
    this.updateRailIndicatorDots();
  }

  render() {
    if (!this.engine || !this.canvas) return;
    this.engine.state = this.state;
    const palette = this.getActivePalette();
    this.engine.render(palette);
    this.updateHUD();
    this.updateHandlesPosition();
  }

  applyAspectRatio(key) {
    const cfg = ASPECT_RATIOS[key] || ASPECT_RATIOS["1:1"];
    this.state.aspectRatio = key;
    this.canvas.width = cfg.w;
    this.canvas.height = cfg.h;
    this.canvas.style.aspectRatio = cfg.css;

    // Update dimensions HUD
    const resText = document.getElementById("hud-resolution");
    if (resText) resText.textContent = `${cfg.w} × ${cfg.h} PX`;

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

    // 4. Randomize Button
    const randomBtn = document.getElementById("btn-random-preset");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const randomIndex = Math.floor(Math.random() * STUDIO_PRESETS.length);
        const preset = STUDIO_PRESETS[randomIndex];
        this.loadPreset(preset);
      });
    }

    // 5. Copy SVG Code
    const copySvgBtn = document.getElementById("btn-copy-svg-code");
    if (copySvgBtn) {
      copySvgBtn.addEventListener("click", async () => {
        try {
          const width = this.canvas.width / (window.devicePixelRatio || 1);
          const height = this.canvas.height / (window.devicePixelRatio || 1);
          const bg = this.state.invertFigureGround ? "#18181f" : "#ffffff";
          const imgData = this.canvas.toDataURL("image/png", 1.0);
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bg}"/><image href="${imgData}" width="${width}" height="${height}"/></svg>`;
          await navigator.clipboard.writeText(svgString);
          
          const origText = copySvgBtn.querySelector("span").textContent;
          copySvgBtn.querySelector("span").textContent = "Copied!";
          setTimeout(() => copySvgBtn.querySelector("span").textContent = origText, 1500);
        } catch (err) {
          alert("SVG copied to clipboard!");
        }
      });
    }

    // 6. Download SVG File
    const downloadSvgBtn = document.getElementById("btn-download-svg");
    if (downloadSvgBtn) {
      downloadSvgBtn.addEventListener("click", () => {
        StudioExporter.exportSVG(this.canvas, this.state, this.getActivePalette(), "module-studio-composition.svg");
      });
    }

    // 7. Config Button
    const configBtn = document.getElementById("btn-open-config");
    if (configBtn) {
      configBtn.addEventListener("click", () => {
        StudioExporter.exportJSON(this.state, "module-studio-project.json");
      });
    }
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

    const shapesPool = ["circle", "square", "triangle_eq", "rhombus", "hexagon", "star4"];
    const newShape = shapesPool[layers.length % shapesPool.length];
    const newLayer = createDefaultLayer(newId, newName, newShape, 0, 0, 0);

    layers.push(newLayer);
    if (!this.state.layerOrder) {
      this.state.layerOrder = layers.map(l => l.id);
    }
    this.state.layerOrder.unshift(newId);
    this.activeLayerId = newId;

    this.syncLegacyLayerRefs();
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

    this.syncLegacyLayerRefs();
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
    this.syncLegacyLayerRefs();
    this.updateLayerCardsUI();
    this.render();
    this.pushHistory(`Toggled Visibility: ${layer.name || layerId}`);
  }

  selectLayer(layerId) {
    this.activeLayerId = layerId;
    this.updateLayerCardsUI();
    this.syncAllInspectorsWithActiveLayer();
  }

  updateLayerCardsUI() {
    const container = document.getElementById("layers-stack-container");
    const addBtn = document.getElementById("btn-add-pattern");
    const layersCountBadge = document.getElementById("layers-count-badge");
    const layersStatus = document.getElementById("hud-layers-status");

    const layers = this.getLayers();
    const count = layers.length;

    if (layersCountBadge) layersCountBadge.textContent = `${count} / 5`;
    if (layersStatus) layersStatus.textContent = `${count} LAYERS`;

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
      const icon = shapeDef?.iconSvg || '<svg viewBox="-20 -20 40 40" class="w-4 h-4"><circle cx="0" cy="0" r="14" fill="currentColor"/></svg>';
      const mode = l.wireframe !== false ? "stroke" : "fill";
      const s = l.structure;
      const structText = s?.enabled ? (s.mode === "radiation" ? " • radiation" : " • grid") : "";

      return `
        <div id="layer-card-${l.id}" class="layer-card ${isActive ? 'is-active' : ''} ${!isVis ? 'is-hidden' : ''}" data-layer-id="${l.id}" draggable="true">
          <div class="flex items-center gap-2.5 min-w-0 pointer-events-none">
            <div class="layer-preview-box">
              ${icon}
            </div>
            <div class="min-w-0">
              <div class="layer-title font-semibold text-xs truncate">${l.name || l.id}</div>
              <div class="layer-subtitle text-[10px] font-mono truncate">${l.shape} • ${mode}${structText}</div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="layer-action-btn btn-layer-eye" data-layer="${l.id}" title="Toggle Visibility">
              ${isVis ? '<i data-lucide="eye" class="w-3.5 h-3.5"></i>' : '<i data-lucide="eye-off" class="w-3.5 h-3.5 opacity-40"></i>'}
            </button>
            <button type="button" class="layer-action-btn btn-layer-delete ${!canDelete ? 'opacity-25 cursor-not-allowed' : ''}" data-layer="${l.id}" title="${canDelete ? 'Delete Layer' : 'Cannot delete the only layer'}" ${!canDelete ? 'disabled' : ''}>
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
            <span class="layer-action-btn layer-drag-handle cursor-grab active:cursor-grabbing text-zinc-400" title="Drag to reorder">
              <i data-lucide="grip-vertical" class="w-3.5 h-3.5"></i>
            </span>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) {
      window.lucide.createIcons();
    }
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

    if (window.lucide) {
      window.lucide.createIcons();
    }
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
      } else if (this.state.modifiers && this.state.modifiers[tab]) {
        isActive = !!this.state.modifiers[tab].enabled;
      }
      btn.classList.toggle("has-modifier-active", isActive);
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
      this.syncControlValue("input-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      this.syncControlValue("num-layout-twist", rad.spiralTwist !== undefined ? rad.spiralTwist : 45);
      this.syncCheckbox("chk-rad-clip", !!rad.activeClipping);
      this.syncCheckbox("chk-rad-gridlines", !!(rad.showRays || rad.showRings));
      this.syncCheckbox("chk-rad-checker", !!rad.checkerInvert);
    }

    this.updateRailIndicatorDots();
  }

  /* =========================================================================
     LAYOUT STRUCTURE CONTROLLER (Per Active Layer)
     ========================================================================= */

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
      this.syncSimilarityInspectorWithActiveLayer();
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
      this.syncSimilarityInspectorWithActiveLayer();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Layout Mode: ${mode}`);
    };

    btnRep?.addEventListener("click", () => setMode("repetition"));
    btnRad?.addEventListener("click", () => setMode("radiation"));

    // Repetition Variations (Grid, Curved, Brick, Diagonal)
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

    this.bindSliderWithNumber("input-layout-twist", "num-layout-twist", (val) => {
      const struct = this.getActiveLayerStructure();
      if (!struct) return;
      struct.radiation.spiralTwist = val;
      struct.mode = "radiation";
      this.render();
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
     Visual Kinship: Elastic, 3D tilt, Wobble, Scale, Hibrid
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
    const showWarning = isSimActive && !hasGrid;

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

    // Visual Kinship Type Pills: Elastic, 3D tilt, Wobble, Scale, Hibrid
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
     CONTEXTUAL SHAPE & STYLE INSPECTOR (Applies to currently active layer)
     ========================================================================= */

  setupShapeInspector() {
    // 1. Shape Glyph Selection Grid (13 Shapes)
    document.querySelectorAll("[data-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        const shape = btn.dataset.shape;
        const mod = this.getActiveModule();
        mod.shape = shape;
        
        document.querySelectorAll("[data-shape]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

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
    }, "Stroke Width");

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

    // 7. Pathfinder Boolean Interrelation Buttons
    document.querySelectorAll("[data-interrelation]").forEach(btn => {
      btn.addEventListener("click", () => {
        const op = btn.dataset.interrelation;
        this.state.interrelation = op;
        document.querySelectorAll("[data-interrelation]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const badge = document.getElementById("badge-active-pathfinder");
        if (badge) badge.textContent = op.toUpperCase();
        this.render();
        this.pushHistory(`Pathfinder Mode: ${op}`);
      });
    });
  }

  syncShapeInspectorWithActiveLayer() {
    const mod = this.getActiveModule();
    if (!mod) return;

    // Sync Shape Buttons
    document.querySelectorAll("[data-shape]").forEach(b => {
      b.classList.toggle("active", b.dataset.shape === mod.shape);
    });

    // Sync Dimensions
    this.syncControlValue("input-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("num-active-width", mod.width || mod.scale || 50);
    this.syncControlValue("input-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("num-active-height", mod.height || mod.scale || 50);
    this.syncControlValue("input-active-rotation", mod.rotation || 0);
    this.syncControlValue("num-active-rotation", mod.rotation || 0);
    this.syncControlValue("input-active-stroke", mod.strokeWidth || 1.2);
    this.syncControlValue("num-active-stroke", mod.strokeWidth || 1.2);
    this.syncControlValue("input-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("num-active-offset-x", mod.offsetX !== undefined ? mod.offsetX : 0);
    this.syncControlValue("input-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);
    this.syncControlValue("num-active-offset-y", mod.offsetY !== undefined ? mod.offsetY : 0);

    // Sync Mode (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    const isWireframe = mod.wireframe !== undefined ? mod.wireframe : this.state.wireframe;
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
    const badge = document.getElementById("badge-active-pathfinder");
    if (badge) badge.textContent = this.state.interrelation.toUpperCase();
  }

  /* =========================================================================
     VIEWPORT: PAN, ZOOM & ARTBOARD CENTERING
     ========================================================================= */

  setupViewportEvents() {
    // Zoom and pan disabled by request. Artboard stays strictly at 100% natural scale.
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    if (this.artboardWrapper) {
      this.artboardWrapper.style.transform = "none";
    }
  }

  updateViewportTransform() {
    if (this.artboardWrapper) {
      this.artboardWrapper.style.transform = "none";
    }
  }

  adjustZoom(factor) {
    // Disabled
  }

  centerArtboard() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    if (this.artboardWrapper) {
      this.artboardWrapper.style.transform = "none";
    }
  }

  updateHUD() {
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"];
    const resEl = document.getElementById("hud-resolution");
    if (resEl) resEl.textContent = `${cfg.w} × ${cfg.h} PX`;
  }

  /* =========================================================================
     INTERACTIVE ON-CANVAS HANDLES
     ========================================================================= */

  setupInteractiveHandles() {
    const handleAnomaly = document.getElementById("handle-anomaly-epicenter");
    const handleConcentration = document.getElementById("handle-concentration-attractor");

    const setupDrag = (handle, onMove) => {
      if (!handle) return;
      handle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        this.activeDragHandle = { handle, onMove };
        document.body.style.cursor = "grabbing";
      });
    };

    setupDrag(handleAnomaly, (nx, ny) => {
      this.state.modifiers.anomaly.epicenterX = nx;
      this.state.modifiers.anomaly.epicenterY = ny;
      this.syncControlValue("input-anom-x", Math.round(nx * 100));
      this.syncControlValue("input-anom-y", Math.round(ny * 100));
    });

    setupDrag(handleConcentration, (nx, ny) => {
      this.state.modifiers.concentration.attractorX = nx;
      this.state.modifiers.concentration.attractorY = ny;
      this.syncControlValue("input-conc-x", Math.round(nx * 100));
      this.syncControlValue("input-conc-y", Math.round(ny * 100));
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.activeDragHandle) return;
      const canvasRect = this.canvas.getBoundingClientRect();
      const nx = Math.max(0.05, Math.min(0.95, (e.clientX - canvasRect.left) / (canvasRect.width)));
      const ny = Math.max(0.05, Math.min(0.95, (e.clientY - canvasRect.top) / (canvasRect.height)));
      this.activeDragHandle.onMove(nx, ny);
      this.render();
    });

    window.addEventListener("mouseup", () => {
      if (this.activeDragHandle) {
        this.activeDragHandle = null;
        document.body.style.cursor = "default";
        this.pushHistory("Adjusted Handle Position");
      }
    });
  }

  updateHandlesPosition() {
    const handleAnomaly = document.getElementById("handle-anomaly-epicenter");
    const handleConcentration = document.getElementById("handle-concentration-attractor");
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"];

    if (handleAnomaly) {
      const anom = this.state.modifiers.anomaly;
      const isVisible = anom.enabled && anom.showReticle;
      handleAnomaly.style.display = isVisible ? "flex" : "none";
      if (isVisible) {
        handleAnomaly.style.left = `${(anom.epicenterX ?? 0.5) * cfg.w}px`;
        handleAnomaly.style.top = `${(anom.epicenterY ?? 0.5) * cfg.h}px`;
      }
    }

    if (handleConcentration) {
      const conc = this.state.modifiers.concentration;
      const isVisible = conc.enabled && conc.showAttractor;
      handleConcentration.style.display = isVisible ? "flex" : "none";
      if (isVisible) {
        handleConcentration.style.left = `${(conc.attractorX ?? 0.5) * cfg.w}px`;
        handleConcentration.style.top = `${(conc.attractorY ?? 0.5) * cfg.h}px`;
      }
    }
  }

  /* =========================================================================
     KEYBOARD SHORTCUTS
     ========================================================================= */

  setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (e.code === "Space" && !this.isSpacePressed) {
        this.isSpacePressed = true;
        const vp = document.getElementById("canvas-viewport-container");
        if (vp) vp.style.cursor = "grab";
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      }

      if (isCmdOrCtrl && e.key === "0") {
        e.preventDefault();
        this.centerArtboard();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this.isSpacePressed = false;
        const vp = document.getElementById("canvas-viewport-container");
        if (vp) vp.style.cursor = "default";
      }
    });
  }

  /* =========================================================================
     MODIFIERS STACK BINDINGS
     ========================================================================= */

  setupModifierCards() {
    const mods = this.state.modifiers;

    // Click anywhere on header to toggle switch
    document.querySelectorAll(".modifier-card").forEach(card => {
      const header = card.querySelector(".modifier-header");
      const switchInput = card.querySelector(".switch input[type='checkbox']");
      if (header && switchInput) {
        header.addEventListener("click", (e) => {
          if (!e.target.closest(".switch") && !e.target.closest(".close-flyout-btn")) {
            switchInput.checked = !switchInput.checked;
            switchInput.dispatchEvent(new Event("change"));
          }
        });
      }
    });

    // 1. REPETITION
    this.bindModifierMasterToggle("toggle-mod-repetition", "repetition", (enabled) => {
      if (enabled && mods.radiation.enabled) {
        mods.radiation.enabled = false;
        this.syncCheckbox("toggle-mod-radiation", false);
        this.setModifierCardActiveState("card-radiation", false);
      }
      if (!enabled && mods.structure.enabled) {
        mods.structure.enabled = false;
        this.syncCheckbox("toggle-mod-structure", false);
        this.setModifierCardActiveState("card-structure", false);
      }
      this.render();
    });

    document.querySelectorAll("[data-grid-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("repetition");
        mods.repetition.gridType = btn.dataset.gridType;
        document.querySelectorAll("[data-grid-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
        this.pushHistory(`Repetition Grid: ${btn.dataset.gridType}`);
      });
    });

    this.bindSliderWithNumber("input-grid-cols", "num-grid-cols", (val) => { mods.repetition.cols = val; this.render(); }, "Grid Columns", "repetition");
    this.bindSliderWithNumber("input-grid-rows", "num-grid-rows", (val) => { mods.repetition.rows = val; this.render(); }, "Grid Rows", "repetition");
    this.bindSliderWithNumber("input-grid-spacing", "num-grid-spacing", (val) => { mods.repetition.spacing = val; this.render(); }, "Gutter Spacing", "repetition");
    this.bindSliderWithNumber("input-grid-shear", "num-grid-shear", (val) => { mods.repetition.shearAngle = val; this.render(); }, "Grid Shear", "repetition");
    this.bindSliderWithNumber("input-grid-slide", "num-grid-slide", (val) => { mods.repetition.slideOffset = val; this.render(); }, "Grid Slide", "repetition");

    // 2. STRUCTURE
    this.bindModifierMasterToggle("toggle-mod-structure", "structure", (enabled) => {
      if (enabled) {
        if (mods.radiation.enabled) {
          mods.radiation.enabled = false;
          this.syncCheckbox("toggle-mod-radiation", false);
          this.setModifierCardActiveState("card-radiation", false);
        }
        if (!mods.repetition.enabled) {
          mods.repetition.enabled = true;
          this.syncCheckbox("toggle-mod-repetition", true);
          this.setModifierCardActiveState("card-repetition", true);
        }
      }
      this.render();
    });

    document.querySelectorAll("[data-struct-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("structure");
        mods.structure.mode = btn.dataset.structMode;
        document.querySelectorAll("[data-struct-mode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-struct-col-ratio", "num-struct-col-ratio", (val) => { mods.structure.colRatio = val; this.render(); }, "Column Ratio", "structure");
    this.bindSliderWithNumber("input-struct-row-ratio", "num-struct-row-ratio", (val) => { mods.structure.rowRatio = val; this.render(); }, "Row Ratio", "structure");
    this.bindCheckbox("check-struct-bands", (val) => { this.ensureModifierActive("structure"); mods.structure.showBands = val; this.render(); });

    // 3. RADIATION
    this.bindModifierMasterToggle("toggle-mod-radiation", "radiation", (enabled) => {
      if (enabled) {
        if (mods.repetition.enabled) {
          mods.repetition.enabled = false;
          this.syncCheckbox("toggle-mod-repetition", false);
          this.setModifierCardActiveState("card-repetition", false);
        }
        if (mods.structure.enabled) {
          mods.structure.enabled = false;
          this.syncCheckbox("toggle-mod-structure", false);
          this.setModifierCardActiveState("card-structure", false);
        }
      }
      this.render();
    });

    document.querySelectorAll("[data-rad-scheme]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("radiation");
        mods.radiation.scheme = btn.dataset.radScheme;
        document.querySelectorAll("[data-rad-scheme]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-rad-rays", "num-rad-rays", (val) => { mods.radiation.rays = val; this.render(); }, "Rays Count", "radiation");
    this.bindSliderWithNumber("input-rad-rings", "num-rad-rings", (val) => { mods.radiation.rings = val; this.render(); }, "Rings Count", "radiation");
    this.bindSliderWithNumber("input-rad-twist", "num-rad-twist", (val) => { mods.radiation.spiralTwist = val; this.render(); }, "Spiral Twist", "radiation");
    this.bindCheckbox("check-rad-show-rays", (val) => { this.ensureModifierActive("radiation"); mods.radiation.showRays = val; this.render(); });
    this.bindCheckbox("check-rad-show-rings", (val) => { this.ensureModifierActive("radiation"); mods.radiation.showRings = val; this.render(); });

    // 4. SIMILARITY
    this.bindModifierMasterToggle("toggle-mod-similarity", "similarity");
    document.querySelectorAll("[data-kinship-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("similarity");
        mods.similarity.kinshipType = btn.dataset.kinshipType;
        document.querySelectorAll("[data-kinship-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-sim-intensity", "num-sim-intensity", (val) => { mods.similarity.intensity = val; this.render(); }, "Similarity Variance", "similarity");
    this.bindSliderWithNumber("input-sim-jitter", "num-sim-jitter", (val) => { mods.similarity.cellJitter = val; this.render(); }, "Cell Jitter", "similarity");

    // 5. GRADATION
    this.bindModifierMasterToggle("toggle-mod-gradation", "gradation");
    document.querySelectorAll("[data-grad-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("gradation");
        mods.gradation.type = btn.dataset.gradType;
        document.querySelectorAll("[data-grad-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    document.querySelectorAll("[data-grad-pathway]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("gradation");
        mods.gradation.pathway = btn.dataset.gradPathway;
        document.querySelectorAll("[data-grad-pathway]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-grad-range", "num-grad-range", (val) => { mods.gradation.range = val; this.render(); }, "Gradation Span", "gradation");
    this.bindSliderWithNumber("input-grad-steps", "num-grad-steps", (val) => { mods.gradation.steps = val; this.render(); }, "Gradation Cycles", "gradation");

    // 6. ANOMALY
    this.bindModifierMasterToggle("toggle-mod-anomaly", "anomaly");
    document.querySelectorAll("[data-anom-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("anomaly");
        mods.anomaly.type = btn.dataset.anomType;
        document.querySelectorAll("[data-anom-type]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-anom-x", "num-anom-x", (val) => { mods.anomaly.epicenterX = val / 100; this.render(); }, "Epicenter X", "anomaly");
    this.bindSliderWithNumber("input-anom-y", "num-anom-y", (val) => { mods.anomaly.epicenterY = val / 100; this.render(); }, "Epicenter Y", "anomaly");
    this.bindSliderWithNumber("input-anom-radius", "num-anom-radius", (val) => { mods.anomaly.radius = val; this.render(); }, "Anomaly Radius", "anomaly");
    this.bindSliderWithNumber("input-anom-intensity", "num-anom-intensity", (val) => { mods.anomaly.intensity = val; this.render(); }, "Anomaly Intensity", "anomaly");

    // 7. CONTRAST
    this.bindModifierMasterToggle("toggle-mod-contrast", "contrast");
    document.querySelectorAll("[data-contrast-dimension]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("contrast");
        mods.contrast.dimension = btn.dataset.contrastDimension;
        document.querySelectorAll("[data-contrast-dimension]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-contrast-dominance", "num-contrast-dominance", (val) => { mods.contrast.dominanceRatio = val; this.render(); }, "Dominance Ratio", "contrast");
    this.bindSliderWithNumber("input-contrast-scale", "num-contrast-scale", (val) => { mods.contrast.scaleFactor = val; this.render(); }, "Contrast Scale", "contrast");

    // 8. CONCENTRATION
    this.bindModifierMasterToggle("toggle-mod-concentration", "concentration");
    document.querySelectorAll("[data-conc-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("concentration");
        mods.concentration.mode = btn.dataset.concMode;
        document.querySelectorAll("[data-conc-mode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-conc-x", "num-conc-x", (val) => { mods.concentration.attractorX = val / 100; this.render(); }, "Attractor X", "concentration");
    this.bindSliderWithNumber("input-conc-y", "num-conc-y", (val) => { mods.concentration.attractorY = val / 100; this.render(); }, "Attractor Y", "concentration");
    this.bindSliderWithNumber("input-conc-power", "num-conc-power", (val) => { mods.concentration.power = val; this.render(); }, "Field Power", "concentration");
    this.bindSliderWithNumber("input-conc-radius", "num-conc-radius", (val) => { mods.concentration.radius = val; this.render(); }, "Field Radius", "concentration");

    // 9. TEXTURE
    this.bindModifierMasterToggle("toggle-mod-texture", "texture");
    document.querySelectorAll("[data-texture-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("texture");
        mods.texture.mode = btn.dataset.textureMode;
        document.querySelectorAll("[data-texture-mode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-texture-density", "num-texture-density", (val) => { mods.texture.density = val; this.render(); }, "Texture Density", "texture");
    this.bindSliderWithNumber("input-texture-scale", "num-texture-scale", (val) => { mods.texture.scale = val; this.render(); }, "Texture Scale", "texture");
    this.bindSliderWithNumber("input-texture-contrast", "num-texture-contrast", (val) => { mods.texture.contrast = val; this.render(); }, "Texture Contrast", "texture");

    // 10. SPACE
    this.bindModifierMasterToggle("toggle-mod-space", "space");
    document.querySelectorAll("[data-space-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.ensureModifierActive("space");
        mods.space.mode = btn.dataset.spaceMode;
        document.querySelectorAll("[data-space-mode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.render();
      });
    });
    this.bindSliderWithNumber("input-space-depth", "num-space-depth", (val) => { mods.space.depth = val; this.render(); }, "Isometric Depth", "space");
    this.bindSliderWithNumber("input-space-angle", "num-space-angle", (val) => { mods.space.angle = val; this.render(); }, "Light Angle", "space");
  }

  ensureModifierActive(modifierKey) {
    const mods = this.state.modifiers;
    if (!mods[modifierKey] || mods[modifierKey].enabled) return;

    mods[modifierKey].enabled = true;
    this.syncCheckbox(`toggle-mod-${modifierKey}`, true);
    this.setModifierCardActiveState(`card-${modifierKey}`, true);

    if (modifierKey === "radiation") {
      if (mods.repetition.enabled) {
        mods.repetition.enabled = false;
        this.syncCheckbox("toggle-mod-repetition", false);
        this.setModifierCardActiveState("card-repetition", false);
      }
      if (mods.structure.enabled) {
        mods.structure.enabled = false;
        this.syncCheckbox("toggle-mod-structure", false);
        this.setModifierCardActiveState("card-structure", false);
      }
    } else if (modifierKey === "repetition" || modifierKey === "structure") {
      if (mods.radiation.enabled) {
        mods.radiation.enabled = false;
        this.syncCheckbox("toggle-mod-radiation", false);
        this.setModifierCardActiveState("card-radiation", false);
      }
      if (modifierKey === "structure" && !mods.repetition.enabled) {
        mods.repetition.enabled = true;
        this.syncCheckbox("toggle-mod-repetition", true);
        this.setModifierCardActiveState("card-repetition", true);
      }
    }
    this.updateRailIndicatorDots();
  }

  bindModifierMasterToggle(switchId, modifierKey, extraCallback) {
    const sw = document.getElementById(switchId);
    if (!sw) return;
    sw.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      this.state.modifiers[modifierKey].enabled = enabled;
      this.setModifierCardActiveState(`card-${modifierKey}`, enabled);
      if (extraCallback) extraCallback(enabled);
      this.updateRailIndicatorDots();
      this.render();
      this.pushHistory(`Modifier ${modifierKey}: ${enabled ? "ON" : "OFF"}`);
    });
  }

  setModifierCardActiveState(cardId, isActive) {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.toggle("is-active", isActive);
    }
  }

  bindSliderWithNumber(sliderId, numberId, callback, label = "Parameter", modifierKey = null) {
    const slider = document.getElementById(sliderId);
    const numInput = document.getElementById(numberId);

    if (slider) {
      slider.addEventListener("input", (e) => {
        if (modifierKey) this.ensureModifierActive(modifierKey);
        const val = parseFloat(e.target.value);
        if (numInput) numInput.value = val;
        callback(val);
      });
      slider.addEventListener("change", (e) => {
        this.pushHistory(`Changed ${label}: ${e.target.value}`);
      });
    }

    if (numInput) {
      numInput.addEventListener("change", (e) => {
        if (modifierKey) this.ensureModifierActive(modifierKey);
        const val = parseFloat(e.target.value);
        if (slider) slider.value = val;
        callback(val);
        this.pushHistory(`Edited ${label}: ${val}`);
      });
    }
  }

  bindCheckbox(id, callback) {
    const cb = document.getElementById(id);
    if (cb) {
      cb.addEventListener("change", (e) => callback(e.target.checked));
    }
  }

  syncControlValue(inputId, value) {
    const el = document.getElementById(inputId);
    if (el) el.value = value;
  }

  syncCheckbox(id, checked) {
    const cb = document.getElementById(id);
    if (cb) cb.checked = checked;
  }

  /* =========================================================================
     PRESET & HISTORY MANAGEMENT
     ========================================================================= */

  loadPreset(preset) {
    this.state = JSON.parse(JSON.stringify(preset.state));

    // Normalize layers from preset
    if (!Array.isArray(this.state.layers) || this.state.layers.length === 0) {
      this.state.layers = [];
      if (this.state.formA) {
        const l1 = Object.assign(createDefaultLayer("layer-1", "Layer 1", this.state.formA.shape || "circle"), this.state.formA, { id: "layer-1", name: "Layer 1" });
        this.state.layers.push(l1);
      }
      if (this.state.formB && this.state.formB.enabled !== false) {
        const l2 = Object.assign(createDefaultLayer("layer-2", "Layer 2", this.state.formB.shape || "square"), this.state.formB, { id: "layer-2", name: "Layer 2" });
        this.state.layers.push(l2);
      }
      if (this.state.layers.length === 0) {
        this.state.layers.push(createDefaultLayer("layer-1", "Layer 1", "circle", 0, 0, 4.5));
      }
    }

    // Ensure all layers have valid structure and properties
    this.state.layers.forEach((layer, idx) => {
      if (!layer.id) layer.id = `layer-${idx + 1}`;
      if (!layer.name) layer.name = `Layer ${idx + 1}`;
      if (layer.visible === undefined) layer.visible = true;
      if (layer.enabled === undefined) layer.enabled = true;
      if (!layer.structure) layer.structure = createDefaultLayerStructure();
      if (!layer.structure.formalStructure) {
        layer.structure.formalStructure = { enabled: false, mode: "rhythmic", colRatio: 1.8, rowRatio: 1.8, bandThickness: 3, showBands: false };
      }
      if (!layer.structure.similarity) {
        layer.structure.similarity = { enabled: false, kinshipType: "distortion", intensity: 50, cellJitter: 0, seed: 42 };
      }
    });

    // If global repetition or radiation is enabled in preset modifiers, propagate to layer 1 structure
    const firstLayer = this.state.layers[0];
    if (firstLayer && !firstLayer.structure.enabled) {
      if (this.state.modifiers?.repetition?.enabled) {
        firstLayer.structure.enabled = true;
        firstLayer.structure.mode = "repetition";
        Object.assign(firstLayer.structure.repetition, this.state.modifiers.repetition);
      } else if (this.state.modifiers?.radiation?.enabled) {
        firstLayer.structure.enabled = true;
        firstLayer.structure.mode = "radiation";
        Object.assign(firstLayer.structure.radiation, this.state.modifiers.radiation);
      }
      if (this.state.modifiers?.structure?.enabled) {
        Object.assign(firstLayer.structure.formalStructure, this.state.modifiers.structure);
      }
      if (this.state.modifiers?.similarity?.enabled) {
        Object.assign(firstLayer.structure.similarity, this.state.modifiers.similarity);
      }
    }

    this.state.layerOrder = this.state.layers.map(l => l.id);
    this.syncLegacyLayerRefs();

    if (!this.state.layers.some(l => l.id === this.activeLayerId)) {
      this.activeLayerId = this.state.layers[0].id;
    }

    this.applyAspectRatio(this.state.aspectRatio || "1:1");
    this.updateActivePalette();
    this.render();
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();
    this.pushHistory(`Loaded Preset: ${preset.name}`);
  }

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
      this.syncLegacyLayerRefs();
      const layers = this.getLayers();
      if (!layers.some(l => l.id === this.activeLayerId)) {
        this.activeLayerId = layers[0]?.id || "layer-1";
      }
      this.render();
      this.syncAllInspectorsWithActiveLayer();
      this.updateLayerCardsUI();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = JSON.parse(this.history[this.historyIndex]);
      this.syncLegacyLayerRefs();
      const layers = this.getLayers();
      if (!layers.some(l => l.id === this.activeLayerId)) {
        this.activeLayerId = layers[0]?.id || "layer-1";
      }
      this.render();
      this.syncAllInspectorsWithActiveLayer();
      this.updateLayerCardsUI();
    }
  }
}

// Auto-boot upon DOM readiness
document.addEventListener("DOMContentLoaded", () => {
  window.studioProApp = new StudioProApp();
  if (window.lucide) window.lucide.createIcons();
});
