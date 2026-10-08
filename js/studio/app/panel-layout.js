/**
 * The Layout panel (Repetition and Radiation) and the formal structure (Rhythm).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class PanelLayout {
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
}
