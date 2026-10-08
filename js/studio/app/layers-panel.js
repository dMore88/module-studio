/**
 * The layers panel: every layer is a composition (add, duplicate, delete, show, hide, order, the cards).
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class LayersPanel {
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
      // the icon and the subtitle tell the layout of the composition: Repetition (a grid), Radial, or Default (no layout)
      const s = l.structure;
      const kind = s?.enabled ? (s.mode === "radiation" ? "Radial" : "Repetition") : "Default";
      const icon = `<i class="ph ph-${{ Repetition: "table", Radial: "crosshair", Default: "shapes" }[kind]}" aria-hidden="true"></i>`;
      const name = this.compositionName(l);

      return `
        <div id="layer-card-${l.id}" class="layer-card ${isActive ? 'is-active' : ''} ${!isVis ? 'is-hidden' : ''}" data-layer-id="${l.id}" draggable="true">
          <div class="layer-preview-box pointer-events-none">
            ${icon}
          </div>
          <div class="layer-copy pointer-events-none">
            <div class="layer-title">${name}</div>
            <div class="layer-subtitle">${kind}</div>
          </div>
          <div class="layer-actions">
            <button type="button" class="layer-action-btn btn-layer-eye" data-layer="${l.id}" title="Toggle Visibility" aria-label="Toggle visibility of ${name}">
              ${isVis ? '<i class="ph ph-eye" aria-hidden="true"></i>' : '<i class="ph ph-eye-slash opacity-40" aria-hidden="true"></i>'}
            </button>
            <button type="button" class="layer-action-btn btn-layer-delete ${!canDelete ? 'opacity-25 cursor-not-allowed' : ''}" data-layer="${l.id}" title="${canDelete ? 'Delete Layer' : 'Cannot delete the only layer'}" aria-label="Delete ${name}" ${!canDelete ? 'disabled' : ''}>
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
}
