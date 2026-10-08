/**
 * Panels described as data. A panel spec lists its groups and controls (tags, sliders, switches); this class draws the
 * panel, shows the state of the active layer in it and listens to its controls, the same way for every panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 *
 * A spec looks like:
 *   { id, cardId, name,                      // name starts the history labels ("Space Mode: ...")
 *     state: (app) => the settings object of the active layer,
 *     enabled: { id, key }, badgeId,         // the switch of the header and the layer badge
 *     groups: [{ title, controls: [
 *       { type: "tags",   label, key, attr, history, options: [[value, text], ...] },
 *       { type: "slider", id, label, key, min, max, step, value, suffix, history,
 *         unit,      // what the setting stores per 1 shown (Texture shows %, stores px: unit 0.1)
 *         fallback,  // shown when the setting has no value yet (default: value)
 *         advanced } // true: the control goes in the group's "Advanced controls" accordion (the group needs advId)
 *       { type: "toggle", id, label, key, history } ] }] }
 * With two or more groups, every group gets its title and a divider; with one, only the panel has a title.
 */
class PanelBuilder {
  // Draws the controls of every panel described as data (once, before the controllers listen to them)
  buildDataPanels() {
    for (const spec of dataPanels()) {
      const card = document.getElementById(spec.cardId);
      if (!card) continue;
      const titled = spec.groups.length > 1;
      const html = spec.groups.map((g, i) => {
        const head = titled ? `${i > 0 ? '<div class="ds-divider" role="separator"></div>\n' : ""}<div class="ds-label ds-label--overline">${g.title}</div>\n` : "";
        let out = "", adv = "", toggles = [];
        let target = "out";
        const add = (t) => { if (target === "adv") adv += t; else out += t; };
        const flush = () => { if (toggles.length) { add(`<div class="ds-toggles">\n${toggles.join("\n")}\n</div>\n`); toggles = []; } };
        for (const c of g.controls) {
          if (!!c.advanced !== (target === "adv")) { flush(); target = c.advanced ? "adv" : "out"; }
          if (c.type === "toggle") { toggles.push(`<label class="ds-toggle-item">\n<span class="ds-toggle-label">${c.label}</span>\n<input type="checkbox" id="${c.id}" class="ds-checkbox">\n</label>`); continue; }
          flush();
          if (c.type === "tags") {
            add(`<div class="ds-field">\n<div class="ds-label">${c.label}</div>\n<div class="ds-tags">\n${c.options.map(([v, t], k) => `<button type="button" class="ds-tag${k === 0 ? " active" : ""}" ${c.attr}="${v}">${t}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "slider") {
            add(`<div class="ds-field">\n<div class="ds-label ds-label-clip">${c.label}</div>\n<div class="ds-slider">\n<input type="range" id="input-${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}">\n<input type="text" id="num-${c.id}" class="ds-value" value="${c.value}${c.suffix}" inputmode="numeric">\n</div>\n</div>\n`);
          }
        }
        flush();
        if (adv) out += `<details id="${g.advId}" class="ds-advanced">\n<summary><i class="ph ph-caret-down" aria-hidden="true"></i><span>Advanced controls</span></summary>\n<div class="ds-stack">\n${adv}</div>\n</details>\n`;
        return head + out;
      }).join("\n");
      card.insertAdjacentHTML("beforeend", html);
    }
  }

  // Shows the state of the active layer in a panel described as data
  syncDataPanel(spec) {
    const mod = this.getActiveModule();
    const st = spec.state(this);
    if (!mod || !st) return;
    const badge = document.getElementById(spec.badgeId);
    if (badge) badge.textContent = this.compositionName(mod);
    const sw = document.getElementById(spec.enabled.id);
    if (sw) sw.checked = !!st[spec.enabled.key];
    for (const g of spec.groups) {
      for (const c of g.controls) {
        if (c.type === "tags") {
          document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(b => b.classList.toggle("active", b.getAttribute(c.attr) === st[c.key]));
        } else if (c.type === "slider") {
          const v = Math.round((st[c.key] ?? c.fallback ?? c.value) / (c.unit || 1));
          this.syncControlValue(`input-${c.id}`, v);
          const num = document.getElementById(`num-${c.id}`);
          if (num) num.value = `${v}${c.suffix}`;
        } else if (c.type === "toggle") {
          this.syncCheckbox(c.id, !!st[c.key]);
        }
      }
    }
    this.updateRailIndicatorDots();
  }

  // Listens to the controls of a panel described as data: any edit turns the modifier on, redraws and records a history step
  bindDataPanel(spec) {
    const sw = document.getElementById(spec.enabled.id);
    const resync = () => this.syncDataPanel(spec);
    const commit = (mutate, historyLabel, { sync = true } = {}) => {
      const st = spec.state(this);
      if (!st) return;
      mutate(st);
      st[spec.enabled.key] = true;
      if (sw) sw.checked = true;
      if (sync) resync();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };
    sw?.addEventListener("change", (e) => {
      const st = spec.state(this);
      if (!st) return;
      st[spec.enabled.key] = e.target.checked;
      resync();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} ${spec.name}: ${st[spec.enabled.key] ? "ON" : "OFF"}`);
    });
    for (const g of spec.groups) {
      for (const c of g.controls) {
        if (c.type === "tags") {
          document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(btn => {
            btn.addEventListener("click", () => {
              const v = btn.getAttribute(c.attr);
              commit(st => { st[c.key] = v; }, `${spec.name} ${c.history}: ${v}`);
            });
          });
        } else if (c.type === "slider") {
          const slider = document.getElementById(`input-${c.id}`), num = document.getElementById(`num-${c.id}`);
          const parse = (s) => (Number(c.step) % 1 ? parseFloat(s) : parseInt(s, 10));
          slider?.addEventListener("input", (e) => {
            const val = parse(e.target.value);
            commit(st => { st[c.key] = val * (c.unit || 1); }, null, { sync: false });
            if (num) num.value = `${val}${c.suffix}`;
          });
          slider?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} ${c.history}: ${e.target.value}${c.suffix}`));
          num?.addEventListener("change", (e) => {
            const raw = parse(e.target.value.replace(/[^0-9.-]/g, ""));
            const val = isNaN(raw) ? Number(c.min) : Math.max(Number(c.min), Math.min(Number(c.max), raw));
            commit(st => { st[c.key] = val * (c.unit || 1); }, `${spec.name} ${c.history}: ${val}${c.suffix}`);
          });
        } else if (c.type === "toggle") {
          document.getElementById(c.id)?.addEventListener("change", (e) => {
            const checked = e.target.checked;
            commit(st => { st[c.key] = checked; }, `${spec.name} ${c.history}: ${checked ? "ON" : "OFF"}`);
          });
        }
      }
    }
  }
}
