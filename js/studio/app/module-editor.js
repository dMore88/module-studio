/**
 * The smart module editor (shapes list, shape style, relations, Combine) and the shape inspector.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class ModuleEditor {
  /* =========================================================================
     CONTEXTUAL SHAPE & STYLE INSPECTOR (Applies to currently active layer)
     ========================================================================= */

  // A line has a length (Width) but no Height, so the Height control is hidden for it.
  updateHeightVisibility() {
    const f = this.currentFigure();
    document.getElementById("input-fig-h")?.closest(".ds-field")?.classList.toggle("hidden", !!f && f.shape === "line");
  }

  /* =========================================================================
     SMART MODULE EDITOR (proof of concept)
     The module as several figures drawn as one shape. The editor shows only the module, big and centred,
     with Save (keep) and Cancel (go back to how it was when the editor opened).
     ========================================================================= */

  // Alternative state used only to draw while the editor is open: the layer alone, no layout and no modifiers,
  // scaled up so the figures can be seen (the figures are a % of the module, so the proportions do not change)
  stateForFigureEdit() {
    const layer = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!layer) return null;
    // The editor is a canvas of its own, the same size as the design's and at the same scale (1:1): a pixel here is a pixel there
    const off = (b) => (b ? { ...b, enabled: false } : b);
    const s = layer.structure || {};
    const view = {
      ...layer, visible: true, offsetX: 0, offsetY: 0, rotation: 0,
      structure: { ...s, enabled: false, formalStructure: off(s.formalStructure), similarity: off(s.similarity), gradation: off(s.gradation), anomaly: off(s.anomaly), contrast: off(s.contrast), concentration: off(s.concentration), texture: off(s.texture), space: off(s.space) }
    };
    const fig = this.currentFigure() ? resolveFigures(layer.figures || [])[this.figEdit.index] : null;
    return { ...this.state, layers: [view], layerOrder: [layer.id], showSafeBounds: false, figureEdit: true, canvasOverride: { w: layer.containerW, h: layer.containerH }, figureBox: fig ? { layerId: layer.id, width: fig.width, height: fig.height, x: fig.x, y: fig.y, rotation: fig.rotation } : null };
  }

  // What the style controls edit: the shape being edited in the module editor, otherwise the module itself
  styleTarget() {
    return this.figEdit ? this.currentFigure() : this.getActiveModule();
  }

  currentFigure() {
    if (!this.figEdit) return null;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    return mod && mod.figures ? mod.figures[this.figEdit.index] || null : null;
  }

  // Starts an editing session on the active layer: a copy of the module (everything but its layout and modifiers) is kept
  // so Cancel can go back to it
  beginFigureEdit() {
    const mod = this.getActiveModule();
    if (!mod) return;
    const { structure, ...own } = mod;
    const snapshot = JSON.parse(JSON.stringify(own));
    // A plain module becomes a smart one with its own shape as the first figure, at the size it had; a module saved with figures
    // as a % of itself gets them in px
    if (!mod.figures || mod.figures.length === 0) mod.figures = [{ shape: mod.shape, width: mod.width || 100, height: mod.height || mod.width || 100, x: 0, y: 0, rotation: 0 }];
    else {
      const old = Math.max(mod.width || 100, mod.height || 100);
      mod.figures = mod.figures.map(f => (f.width !== undefined ? f : { shape: f.shape, width: Math.round((f.size ?? 100) / 100 * old), height: Math.round((f.size ?? 100) / 100 * old), x: Math.round((f.x || 0) / 100 * old), y: Math.round((f.y || 0) / 100 * old), rotation: f.rotation || 0 }));
    }
    this.figEdit = { layerId: mod.id, snapshot, index: 0, steps: [], at: -1 };
    this.syncEditShell();
    this.recordFigureStep();
    this.syncFigureEditor();
  }

  // keep = true: Save; false: Cancel (goes back to how the module was when the editor opened)
  endFigureEdit(keep) {
    if (!this.figEdit) return;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    const id = this.figEdit.layerId;
    if (mod) {
      if (keep) {
        // the layer takes the shape of its first figure (for its card and for the modifiers that swap the shape)
        mod.shape = mod.figures[0] ? mod.figures[0].shape : mod.shape;
        // and the look of its base shape (for the layer card, and as what a new shape or a modifier starts from)
        if (mod.figures[0]) { const look = this.engine.figureStyle(mod.figures[0], mod); mod.wireframe = look.wire; mod.color = look.color; mod.strokeWidth = look.sw; }
      } else {
        Object.assign(mod, JSON.parse(JSON.stringify(this.figEdit.snapshot)));
      }
    }
    this.figEdit = null;
    this.syncEditShell();
    this.fitArtboard(); // back to the design's canvas (the next draw sets its size)
    if (keep) this.pushHistory(`Layer ${id} Module saved`);
    this.syncAllInspectorsWithActiveLayer();
    this.updateLayerCardsUI();
  }

  // The look of the app while the module is edited: the mode chip, Save and Cancel in the header, the rest of the controls waiting
  syncEditShell() {
    const on = !!this.figEdit;
    document.body.classList.toggle("is-editing-module", on);
    const chip = document.getElementById("mode-chip");
    if (chip) {
      chip.classList.toggle("ds-mode-chip--smart", on);
      const icon = chip.querySelector("i");
      if (icon) icon.className = on ? "ph ph-shapes" : "ph ph-grid-four";
      const text = document.getElementById("mode-chip-text");
      if (text) text.textContent = on ? "Smart module mode" : "Composition mode";
    }
    const select = document.getElementById("canvas-aspect-ratio");
    if (select) select.disabled = on;
    document.querySelectorAll("#controls-rail .rail-btn").forEach(b => { if (b.dataset.railTab !== "module") b.disabled = on; });
  }

  // Save / Cancel: finish the session and close the panel
  closeFigureEditor(keep) {
    this.endFigureEdit(keep);
    this.isFlyoutOpen = false;
    this.updateRailUI();
  }

  // The editor's own undo: every change is a step (the module without its layout and modifiers); Cancel goes back to the start
  figureStepState() {
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!mod) return null;
    const { structure, ...own } = mod;
    return JSON.stringify(own);
  }

  recordFigureStep() {
    if (!this.figEdit || !this.figEdit.steps) return;
    const s = this.figureStepState();
    if (s === null || s === this.figEdit.steps[this.figEdit.at]) return;
    this.figEdit.steps = this.figEdit.steps.slice(0, this.figEdit.at + 1);
    this.figEdit.steps.push(s);
    this.figEdit.at = this.figEdit.steps.length - 1;
  }

  stepFigureEdit(d) {
    const fe = this.figEdit;
    if (!fe) return;
    this.recordFigureStep(); // whatever changed since the last step becomes one, so it can be undone
    const to = fe.at + d;
    if (to < 0 || to >= fe.steps.length) return;
    const mod = this.state.layers.find(l => l.id === fe.layerId);
    if (!mod) return;
    fe.at = to;
    Object.assign(mod, JSON.parse(fe.steps[to]));
    fe.index = Math.min(fe.index, Math.max(0, mod.figures.length - 1));
    this.syncAllInspectorsWithActiveLayer();
    this.syncFigureEditor();
  }

  syncFigureEditor() {
    if (!this.figEdit) return;
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    if (!mod) return;
    const list = document.getElementById("fig-list");
    if (list) {
      // Like the layers: the shape in front is on top, the one behind everything (the base) at the bottom; each row has its icon,
      // its name, an eye, a bin and a handle to drag it
      const canDelete = mod.figures.length > 1;
      list.innerHTML = mod.figures.map((f, i) => ({ f, i })).reverse().map(({ f, i }) => {
        const def = Shapes[f.shape] || Shapes.circle;
        const shown = f.visible !== false;
        return `
        <div class="layer-card fig-row ${i === this.figEdit.index ? "is-active" : ""} ${shown ? "" : "is-hidden"}" data-fig-index="${i}" draggable="true">
          <div class="layer-preview-box pointer-events-none">${shapeIconHtml(def)}</div>
          <div class="layer-copy pointer-events-none"><div class="layer-title">${def.name || f.shape}</div></div>
          <div class="layer-actions">
            <button type="button" class="layer-action-btn btn-fig-eye" title="Show or hide the shape" aria-label="Show or hide ${def.name || f.shape}">${shown ? '<i class="ph ph-eye" aria-hidden="true"></i>' : '<i class="ph ph-eye-slash opacity-40" aria-hidden="true"></i>'}</button>
            <button type="button" class="layer-action-btn btn-fig-trash ${canDelete ? "" : "opacity-25 cursor-not-allowed"}" title="${canDelete ? "Delete the shape" : "A module needs at least one shape"}" aria-label="Delete ${def.name || f.shape}" ${canDelete ? "" : "disabled"}><i class="ph ph-trash" aria-hidden="true"></i></button>
            <span class="layer-action-btn layer-drag-handle" title="Drag to reorder" aria-hidden="true"><i class="ph ph-dots-six-vertical"></i></span>
          </div>
        </div>`;
      }).join("");
    }
    const f = this.currentFigure();
    document.querySelectorAll("#fig-shape-grid [data-fig-shape]").forEach(b => b.classList.toggle("active", !!f && b.dataset.figShape === f.shape));
    const set = (id, v, suffix) => { this.syncControlValue(`input-${id}`, v); const n = document.getElementById(`num-${id}`); if (n) n.value = `${v}${suffix}`; };
    // The look of the shape being edited
    {
      const look = f ? this.engine.figureStyle(f, mod) : { wire: true, color: "#18181F", sw: 1 };
      this.setModeButtons(look.wire);
      const color = (look.color || "#18181F");
      const cp = document.getElementById("color-active-shape");
      if (cp && /^#[0-9a-f]{6}$/i.test(color)) cp.value = color;
      const sw = document.getElementById("swatch-active-color"); if (sw) sw.style.backgroundColor = color;
      const hx = document.getElementById("text-color-hex"); if (hx) hx.textContent = color.toUpperCase();
      this.syncControlValue("input-active-stroke", look.sw || 1);
      const ns = document.getElementById("num-active-stroke"); if (ns) ns.value = `${look.sw || 1}px`;
    }
    if (f) { set("fig-w", f.width, "px"); set("fig-h", f.height, "px"); set("fig-x", f.x, "px"); set("fig-y", f.y, "px"); set("fig-rot", f.rotation, "º"); }
    const badge = document.getElementById("shapes-count-badge"); if (badge) badge.textContent = String(mod.figures.length);
    document.getElementById("btn-fig-add")?.toggleAttribute("disabled", mod.figures.length >= 4);
    document.getElementById("btn-fig-duplicate")?.toggleAttribute("disabled", mod.figures.length >= 4);
    // Combine: only with two or more shapes
    const combineNow = mod.combine || "none";
    setControlEnabled(document.getElementById("fig-combine-block"), mod.figures.length >= 2, "Add a second shape to combine them");
    document.querySelectorAll("[data-fig-combine]").forEach(b => b.classList.toggle("active", b.dataset.figCombine === combineNow));
    // Relation to the previous shape (the first one has none): a related shape is placed by the relation, not by its position
    const rel = this.figEdit.index > 0 ? (f && f.relation) || "free" : "free";
    setControlEnabled(document.getElementById("fig-relation-block"), this.figEdit.index > 0, mod.figures.length < 2 ? "Add a second shape to relate them" : "The first shape has nothing before it to relate to");
    document.querySelectorAll("[data-fig-rel]").forEach(b => b.classList.toggle("active", b.dataset.figRel === rel));
    document.getElementById("fig-relation-stack")?.classList.toggle("hidden", rel !== "distance");
    document.getElementById("fig-pos-x-field")?.classList.toggle("hidden", rel !== "free");
    document.getElementById("fig-pos-y-field")?.classList.toggle("hidden", rel !== "free");
    if (f) { set("fig-angle", f.angle ?? 0, "º"); set("fig-gap", f.gap ?? 0, "px"); }
    this.updateHeightVisibility();
    this.render();
  }

  // The module canvas as a pointer sees it: a point of the module (px from its centre) and how many screen px a module px is worth
  figurePointer(e) {
    const mod = this.state.layers.find(l => l.id === this.figEdit.layerId);
    const rect = this.canvas.getBoundingClientRect();
    const scale = rect.width / Math.max(1, mod.containerW);
    return { mod, scale, x: (e.clientX - rect.left) / scale - mod.containerW / 2, y: (e.clientY - rect.top) / scale - mod.containerH / 2 };
  }

  // Pointer on the module canvas: a click picks the shape under it (the one in front if several), and dragging moves it. A shape that is
  // placed by a relation (coincident, distance) becomes free where it is, so it can be moved
  setupFigurePointer() {
    const canvas = this.canvas;
    if (!canvas) return;
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.figEdit || e.button !== 0) return;
      const p = this.figurePointer(e);
      const i = figureAt(p.mod.figures, p.x, p.y, 5 / p.scale);
      if (i < 0) return;
      const r = resolveFigures(p.mod.figures)[i];
      drag = { i, sx: p.x, sy: p.y, fx: r.x || 0, fy: r.y || 0, moved: false };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* a synthetic pointer cannot be captured */ }
      if (this.figEdit.index !== i) { this.figEdit.index = i; this.syncFigureEditor(); }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!this.figEdit) return;
      const p = this.figurePointer(e);
      if (!drag) { canvas.style.cursor = figureAt(p.mod.figures, p.x, p.y, 5 / p.scale) >= 0 ? "pointer" : ""; return; }
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) * p.scale < 3) return; // a click does not nudge the shape
      drag.moved = true;
      canvas.style.cursor = "move";
      const f = p.mod.figures[drag.i];
      if (!f) return;
      if (f.relation && f.relation !== "free") f.relation = "free";
      const lim = (id, v) => { const el = document.getElementById(id); return Math.max(Number(el?.min ?? -1000), Math.min(Number(el?.max ?? 1000), v)); };
      f.x = lim("input-fig-x", Math.round(drag.fx + p.x - drag.sx));
      f.y = lim("input-fig-y", Math.round(drag.fy + p.y - drag.sy));
      this.syncFigureEditor();
    });
    const end = () => {
      if (drag && drag.moved) this.recordFigureStep();
      drag = null;
      canvas.style.cursor = "";
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  // Stroke or Fill: which of the two tags is on (and says so to assistive technology)
  setModeButtons(wire) {
    for (const [id, on] of [["btn-mode-stroke", !!wire], ["btn-mode-fill", !wire]]) {
      const b = document.getElementById(id);
      if (b) { b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); }
    }
  }

  // The (?) of the Module panel: its title and its groups. The panel is written in index.html (the editor is not a modifier), so the buttons are put in place here
  addModuleHelp() {
    const card = document.getElementById("active-layer-inspector");
    if (!card) return;
    const H = {
      panel: { is: "A module is the unit of a design: a small piece, made of one or more shapes, that is repeated, turned or varied to build a whole.", does: "Opens the module for editing on a canvas of its own. Shapes are drawn one over another; Save keeps the changes and Cancel goes back." },
      "Shape": { is: "A shape is a basic form, round, angular, straight or curved. Its character is the first thing the eye reads in a module.", does: "Picks the shape of the selected one. Add shape, in the list at the left, builds a module out of up to four shapes." },
      "Shape interelation": { is: "Shapes in one module relate to each other: they can be apart, touch, overlap, join or cut each other.", does: "Combine merges, subtracts, intersects or excludes all the shapes into one. Relation places a shape next to the previous one, or on its center." },
      "Shape style": { is: "How a shape is drawn, as a line or as a filled area, with its color and the thickness of its line, changes its weight in the design.", does: "Stroke or Fill, color and line width belong to the selected shape. Its width, height, position and rotation are below." },
      "Module": { is: "The module is its own sheet of paper: its size sets the space the shapes have, and whatever lies beyond its edge is cut.", does: "Sets the width and height of the module in px. The shapes are placed inside it." }
    };
    card.querySelector(".ds-card-title-text")?.insertAdjacentHTML("afterend", this.helpButtonHtml("module:panel", "Module", H.panel));
    card.querySelectorAll(".ds-label").forEach(label => {
      const t = label.textContent.trim(), h = H[t];
      // the titles of the groups: the overline ones, and the label of the shape grid (the first group)
      if (!h || t === "panel" || !(label.classList.contains("ds-label--overline") || (t === "Shape" && label.nextElementSibling && label.nextElementSibling.id === "fig-shape-grid"))) return;
      const row = document.createElement("div");
      row.className = "ds-title-row";
      label.replaceWith(row);
      row.append(label);
      row.insertAdjacentHTML("beforeend", this.helpButtonHtml(`module:${t}`, t, h));
    });
  }

  setupSmartModule() {
    this.figEdit = null;
    this.addModuleHelp();
    this.setupFigurePointer();
    document.querySelectorAll("#fig-shape-grid [data-fig-shape]").forEach(btn => {
      btn.addEventListener("click", () => {
        const f = this.currentFigure();
        if (!f) return;
        f.shape = btn.dataset.figShape;
        this.recordFigureStep();
        this.syncFigureEditor();
      });
    });

    document.getElementById("btn-fig-save")?.addEventListener("click", () => this.closeFigureEditor(true));
    document.getElementById("btn-fig-cancel")?.addEventListener("click", () => this.closeFigureEditor(false));

    const mod = () => (this.figEdit ? this.state.layers.find(l => l.id === this.figEdit.layerId) : null);
    document.getElementById("btn-fig-add")?.addEventListener("click", () => {
      const m = mod(); if (!m || m.figures.length >= 4) return;
      // a new figure is half the container (the paper), so it is easy to see and to place
      const cfg = ASPECT_RATIOS[this.state.aspectRatio] || ASPECT_RATIOS["1:1"];
      const half = Math.max(1, Math.round(Math.max(m.containerW > 0 ? m.containerW : cfg.w, m.containerH > 0 ? m.containerH : cfg.h) / 2));
      const cur = this.currentFigure();
      const look = this.engine.figureStyle(cur || {}, m);
      m.figures.push({ shape: "circle", width: half, height: half, x: 0, y: 0, rotation: 0, wireframe: look.wire, color: look.color, strokeWidth: look.sw });
      this.figEdit.index = m.figures.length - 1;
      this.recordFigureStep();
      this.syncFigureEditor();
    });
    // Duplicate: an exact copy right above the selected shape, placed where the original is
    document.getElementById("btn-fig-duplicate")?.addEventListener("click", () => {
      const m = mod(); if (!m || m.figures.length >= 4) return;
      const i = this.figEdit.index, r = resolveFigures(m.figures)[i];
      m.figures.splice(i + 1, 0, { ...m.figures[i], x: Math.round(r.x), y: Math.round(r.y), relation: "free" });
      this.figEdit.index = i + 1;
      this.recordFigureStep();
      this.syncFigureEditor();
    });

    // The rows of the list: select, show or hide, delete, and drag to reorder
    const list = document.getElementById("fig-list");
    let dragFrom = null;
    list?.addEventListener("click", (e) => {
      const row = e.target.closest(".fig-row");
      const m = mod();
      if (!row || !m) return;
      const i = Number(row.dataset.figIndex);
      if (e.target.closest(".btn-fig-eye")) {
        m.figures[i].visible = m.figures[i].visible === false;
        this.figEdit.index = i;
        this.recordFigureStep();
      } else if (e.target.closest(".btn-fig-trash")) {
        if (m.figures.length <= 1) return;
        m.figures.splice(i, 1);
        this.figEdit.index = Math.min(this.figEdit.index > i ? this.figEdit.index - 1 : this.figEdit.index, m.figures.length - 1);
        this.recordFigureStep();
      } else {
        this.figEdit.index = i;
      }
      this.syncFigureEditor();
    });
    list?.addEventListener("dragstart", (e) => {
      const row = e.target.closest(".fig-row");
      if (!row) return;
      dragFrom = Number(row.dataset.figIndex);
      row.classList.add("is-dragging");
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(dragFrom)); }
    });
    list?.addEventListener("dragend", () => {
      list.querySelectorAll(".fig-row").forEach(r => r.classList.remove("is-dragging", "drag-over"));
      dragFrom = null;
    });
    list?.addEventListener("dragover", (e) => {
      e.preventDefault();
      const row = e.target.closest(".fig-row");
      if (!row || Number(row.dataset.figIndex) === dragFrom) return;
      row.classList.add("drag-over");
    });
    list?.addEventListener("dragleave", (e) => { e.target.closest(".fig-row")?.classList.remove("drag-over"); });
    list?.addEventListener("drop", (e) => {
      e.preventDefault();
      const row = e.target.closest(".fig-row");
      const m = mod();
      list.querySelectorAll(".fig-row").forEach(r => r.classList.remove("drag-over"));
      if (!row || !m || dragFrom === null) return;
      const to = Number(row.dataset.figIndex);
      if (to === dragFrom) return;
      // the dragged shape takes the place of the one it is dropped on
      const [moved] = m.figures.splice(dragFrom, 1);
      m.figures.splice(to, 0, moved);
      this.figEdit.index = to;
      dragFrom = null;
      this.recordFigureStep();
      this.syncFigureEditor();
    });

    document.querySelectorAll("[data-fig-combine]").forEach(btn => btn.addEventListener("click", () => {
      const m = mod();
      if (!m) return;
      // the four operations toggle: pressing the one that is on goes back to none (the shapes stay stacked)
      m.combine = (m.combine || "none") === btn.dataset.figCombine ? "none" : btn.dataset.figCombine;
      this.recordFigureStep();
      this.syncFigureEditor();
    }));

    document.querySelectorAll("[data-fig-rel]").forEach(btn => btn.addEventListener("click", () => {
      const m = mod(), f = this.currentFigure();
      if (!m || !f || this.figEdit.index === 0) return;
      const next = btn.dataset.figRel;
      // leaving a relation keeps the shape where it is
      if (next === "free" && f.relation && f.relation !== "free") { const r = resolveFigures(m.figures)[this.figEdit.index]; f.x = Math.round(r.x); f.y = Math.round(r.y); }
      f.relation = next;
      if (f.angle === undefined) f.angle = 0;
      if (f.gap === undefined) f.gap = 0;
      this.recordFigureStep();
      this.syncFigureEditor();
    }));

    const pair = (id, key, lo, hi, suffix) => this.bindSliderWithNumber(`input-${id}`, `num-${id}`, (val) => {
      const f = this.currentFigure(); if (!f) return;
      f[key] = Math.max(lo, Math.min(hi, val));
      this.render();
    }, `Figure ${key}`, suffix);
    pair("fig-w", "width", 1, 2000, "px");
    pair("fig-h", "height", 1, 2000, "px");
    pair("fig-x", "x", -1000, 1000, "px");
    pair("fig-y", "y", -1000, 1000, "px");
    pair("fig-rot", "rotation", -180, 180, "º");
    pair("fig-angle", "angle", 0, 360, "º");
    pair("fig-gap", "gap", -500, 500, "px");
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

    // 3. Rotation (Rotación °)
    this.bindSliderWithNumber("input-active-rotation", "num-active-rotation", (val) => {
      const mod = this.getActiveModule();
      mod.rotation = val;
      this.render();
    }, "Rotation", "º");

    // 4. Stroke Width (Grosor Trazo)
    this.bindSliderWithNumber("input-active-stroke", "num-active-stroke", (val) => {
      const target = this.styleTarget();
      if (target) target.strokeWidth = val;
      this.render();
    }, "Stroke Width", "px");

    // The module's width and height: its container, the piece of paper the shapes are placed on (it always cuts at its edge)
    this.bindSliderWithNumber("input-active-container-w", "num-active-container-w", (val) => {
      const mod = this.getActiveModule();
      mod.containerW = Math.max(10, Math.min(1000, val));
      this.render();
    }, "Module Width", "px");
    this.bindSliderWithNumber("input-active-container-h", "num-active-container-h", (val) => {
      const mod = this.getActiveModule();
      mod.containerH = Math.max(10, Math.min(1000, val));
      this.render();
    }, "Module Height", "px");

    // 5. Drawing Mode: Stroke vs Fill (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    
    // The look (Stroke or Fill, colour, stroke width) belongs to the shape being edited; with no editor open, to the module
    btnStroke?.addEventListener("click", () => {
      const target = this.styleTarget();
      if (!target) return;
      target.wireframe = true;
      this.setModeButtons(true);
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} Mode: Stroke`);
    });

    btnFill?.addEventListener("click", () => {
      const target = this.styleTarget();
      if (!target) return;
      target.wireframe = false;
      this.setModeButtons(false);
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
        const target = this.styleTarget();
        if (target) target.color = hex;
        if (target && !this.figEdit) this.customColors.fg = hex;
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
    this.syncControlValue("input-active-rotation", mod.rotation || 0);
    this.syncControlValue("num-active-rotation", `${mod.rotation || 0}º`);
    const fig = this.figEdit ? this.currentFigure() : null;
    const look = fig ? this.engine.figureStyle(fig, mod) : { wire: mod.wireframe !== false, color: mod.color, sw: mod.strokeWidth || 1 };
    this.syncControlValue("input-active-stroke", look.sw || 1);
    this.syncControlValue("num-active-stroke", `${look.sw || 1}px`);
    const canvasCfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    const contW = Math.round(mod.containerW > 0 ? mod.containerW : canvasCfg.w);
    const contH = Math.round(mod.containerH > 0 ? mod.containerH : canvasCfg.h);
    this.syncControlValue("input-active-container-w", contW);
    this.syncControlValue("num-active-container-w", `${contW}px`);
    this.syncControlValue("input-active-container-h", contH);
    this.syncControlValue("num-active-container-h", `${contH}px`);

    // Sync Mode (per active layer)
    const btnStroke = document.getElementById("btn-mode-stroke");
    const btnFill = document.getElementById("btn-mode-fill");
    const isWireframe = look.wire;
    this.setModeButtons(isWireframe);

    // Sync Swatch & Color Picker
    const swatch = document.getElementById("swatch-active-color");
    const hexText = document.getElementById("text-color-hex");
    const layerColor = look.color || this.customColors.fg || "#18181F";
    const cp = document.getElementById("color-active-shape");
    if (cp && layerColor.startsWith("#") && layerColor.length === 7) {
      cp.value = layerColor;
    }
    if (swatch) swatch.style.backgroundColor = layerColor;
    if (hexText) hexText.textContent = layerColor.toUpperCase();
  }
}
