/**
 * The controls rail and its flyout, and the shared Layout pieces (container, rotation).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class ControlsRail {
  /* =========================================================================
     CONTROLS RAIL & FLYOUT CONTROLLER (Abstract Studio Dock)
     ========================================================================= */

  setupControlsRail() {
    const railButtons = document.querySelectorAll("#controls-rail .rail-btn");
    railButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (this.figEdit) return; // the module editor is left with Save or Cancel
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
        if (this.figEdit) return;
        this.isFlyoutOpen = false;
        this.updateRailUI();
      });
    });

    this.updateRailUI();
    this.updateRailIndicatorDots();
  }

  updateRailUI() {
    // The Module panel is the smart module editor: opening it starts an editing session, leaving it (another panel, the
    // close button) saves it
    const editing = this.isFlyoutOpen && this.activeRailTab === "module";
    if (editing && !this.figEdit) this.beginFigureEdit();
    else if (!editing && this.figEdit) this.endFigureEdit(true);
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
    // The Composition container is a group of its own, right after the Module group (its controls and its Advanced controls) of the active mode
    const blockEl = document.getElementById("layout-block");
    const modAdv = document.getElementById(struct.mode === "radiation" ? "rad-adv-module" : "rep-adv-module");
    // The module's rotation (how the piece sits in its cell) belongs to the Module group: right before its Advanced controls
    const rotEl = document.getElementById("layout-module-rotation");
    if (rotEl && modAdv && modAdv.previousElementSibling !== rotEl) modAdv.parentNode.insertBefore(rotEl, modAdv);
    if (blockEl && modAdv && modAdv.nextElementSibling !== blockEl) modAdv.parentNode.insertBefore(blockEl, modAdv.nextSibling);
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
    if (layoutBadge) layoutBadge.textContent = (mod ? this.compositionName(mod) : "Composition 1");

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
}
