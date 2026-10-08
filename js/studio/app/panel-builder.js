/**
 * Panels described as data. A panel spec lists its groups and controls (tags, chips, sliders, switches); this class draws the
 * panel, shows the state of the active layer in it and listens to its controls, the same way for every panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 *
 * A spec looks like:
 *   { id, cardId, name,                      // name starts the history labels ("Space Mode: ...")
 *     state: (app) => the settings object of the active layer,
 *     enabled: { id, key }, badgeId,         // the switch of the header and the layer badge
 *     banner: { id, text, hidden: (mod) => bool },   // optional notice under the header
 *     groups: [{ title, advId?, controls: [ ... ] }] }
 *
 * Controls (every one may carry `show: (state, mod) => bool`, to appear only in some cases, and `blockId`, the id of its box):
 *   { type: "tags",   label, key, attr, history, fallback, options: [[value, text], ...] }   one choice among several
 *   { type: "dropdown", label, key, attr, history, fallback, options: [[value, text], ...] | "shapes" }   a list of choices ("shapes": every shape, with its icon)
 *   { type: "chips",  label, ariaLabel, attr, options: [{ key, text, id?, show? }] }          chips that switch on and off by themselves
 *   { type: "slider", id, label, key, min, max, step, value, suffix, history,
 *       unit,      // what the setting stores per 1 shown (Texture shows %, stores px: unit 0.1)
 *       divisor,   // the setting stores the shown value divided by this (0 to 100 % shown, 0 to 1 stored: divisor 100)
 *       fallback,  // what the setting holds when it has no value yet (default: value)
 *       decimal,   // the value box asks for a decimal keyboard
 *       advanced } // true: the control goes in the group's "Advanced controls" accordion (the group needs advId)
 *   { type: "toggle", id, label, key, history }
 *   { type: "accent", prefix, colorKey, flagKey }   the accent colour row (swatch, hex, remove); picking a colour turns the accent on
 *   { type: "hint",   text }
 * With two or more groups, every group gets its title and a divider; with one, only the panel has a title.
 */
// The shape names the dropdowns show (a few differ from the shapes' own names)
const SHAPE_LABELS = { line: "Line", cross: "Greek Cross", wave: "Sine Wave", digit1: "Number 1", digit5: "Number 5", digit9: "Number 9" };

class PanelBuilder {
  // Draws the controls of every panel described as data (once, before the controllers listen to them)
  buildDataPanels() {
    for (const spec of dataPanels()) {
      const card = document.getElementById(spec.cardId);
      if (!card) continue;
      const titled = spec.groups.length > 1;
      const hid = (c) => (c.show ? " hidden" : "");
      const idAttr = (c) => (c.blockId ? ` id="${c.blockId}"` : "");
      let html = spec.banner ? `<div id="${spec.banner.id}" class="ds-snackbar hidden" role="status">\n<i class="ph-fill ph-warning"></i>\n<p>${spec.banner.text}</p>\n</div>\n` : "";
      html += spec.groups.map((g, i) => {
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
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-tags">\n${c.options.map(([v, t], k) => `<button type="button" class="ds-tag${k === 0 ? " active" : ""}" ${c.attr}="${v}">${t}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "dropdown") {
            const opts = c.options === "shapes" ? STUDIO_SHAPE_KEYS.map(k => [k, SHAPE_LABELS[k] || Shapes[k].name.replace(/\s*\([^)]*\)\s*/g, ""), shapeIconHtml(Shapes[k])]) : c.options;
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-dropdown" data-select>\n<button type="button" class="ds-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false"><span class="ds-dropdown-current"><span>${opts[0][1]}</span></span><i class="ph ph-caret-down" aria-hidden="true"></i></button>\n<div class="ds-dropdown-menu hidden" role="listbox">\n${opts.map(([v, t, icon]) => `<button type="button" class="ds-dropdown-item" role="option" ${c.attr}="${v}">${icon || ""}<span>${t}</span></button>`).join("\n")}\n</div>\n</div>\n</div>\n`);
          } else if (c.type === "accent") {
            const P = c.prefix;
            add(`<div class="ds-toggles">\n<div class="ds-color-row" id="${P}-accent-row">\n<span class="ds-color-label">Accent color</span>\n<span class="ds-color-hex" id="${P}-accent-hex">#F43F5E</span>\n<span class="ds-swatch">\n<input type="color" id="${P}-accent-color" value="#f43f5e">\n<span class="ds-swatch-fill" id="${P}-accent-swatch"></span>\n</span>\n<button type="button" class="ds-color-clear" id="${P}-accent-clear" aria-label="Remove accent color" title="Remove accent color"><i class="ph ph-x" aria-hidden="true"></i></button>\n</div>\n</div>\n`);
          } else if (c.type === "chips") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-tags" role="group" aria-label="${c.ariaLabel || c.label}">\n${c.options.map(o => `<button type="button"${o.id ? ` id="${o.id}"` : ""} class="ds-tag${o.show ? " hidden" : ""}" ${c.attr}="${o.key}" aria-pressed="false">${o.text}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "slider") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label ds-label-clip">${c.label}</div>\n<div class="ds-slider">\n<input type="range" id="input-${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}">\n<input type="text" id="num-${c.id}" class="ds-value" value="${c.value}${c.suffix}" inputmode="${c.decimal ? "decimal" : "numeric"}">\n</div>\n</div>\n`);
          } else if (c.type === "hint") {
            add(`<p class="ds-hint">${c.text}</p>\n`);
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
    if (spec.banner) document.getElementById(spec.banner.id)?.classList.toggle("hidden", !!spec.banner.hidden(mod));
    for (const g of spec.groups) {
      for (const c of g.controls) {
        if (c.show && c.blockId) document.getElementById(c.blockId)?.classList.toggle("hidden", !c.show(st, mod));
        if (c.type === "tags" || c.type === "dropdown") {
          document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(b => b.classList.toggle("active", b.getAttribute(c.attr) === (st[c.key] || c.fallback)));
        } else if (c.type === "accent") {
          this.syncAccentColorRow(c.prefix, st[c.colorKey], !!st[c.flagKey]);
        } else if (c.type === "chips") {
          for (const o of c.options) {
            const chip = o.id ? document.getElementById(o.id) : document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`);
            if (!chip) continue;
            const on = !!st[o.key];
            chip.classList.toggle("active", on);
            chip.setAttribute("aria-pressed", String(on));
            if (o.show) chip.classList.toggle("hidden", !o.show(st, mod));
          }
        } else if (c.type === "slider") {
          const raw = st[c.key] ?? c.fallback ?? c.value;
          const v = Math.round(c.divisor ? raw * c.divisor : raw / (c.unit || 1));
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

  // Listens to the controls of a panel described as data: any edit turns the modifier on, redraws and records a history step.
  // Returns `commit(mutate, historyLabel)`, for the panels that also react to something else (a click on the canvas).
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
        if (c.type === "accent") {
          document.getElementById(`${c.prefix}-accent-clear`)?.addEventListener("click", () => commit(st => { st[c.flagKey] = false; }, `${spec.name} Accent: none`));
          // Picking an accent colour also turns the accent on
          const picker = document.getElementById(`${c.prefix}-accent-color`);
          picker?.addEventListener("input", (e) => commit(st => { st[c.colorKey] = e.target.value; st[c.flagKey] = true; }, null));
          picker?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} Accent: ${e.target.value.toUpperCase()}`));
        } else if (c.type === "tags" || c.type === "dropdown") {
          document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(btn => {
            btn.addEventListener("click", () => {
              const v = btn.getAttribute(c.attr);
              commit(st => { st[c.key] = v; }, `${spec.name} ${c.history}: ${v}`);
            });
          });
        } else if (c.type === "chips") {
          for (const o of c.options) {
            const chip = o.id ? document.getElementById(o.id) : document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`);
            chip?.addEventListener("click", () => {
              const next = chip.getAttribute("aria-pressed") !== "true";
              commit(st => { st[o.key] = next; }, `${spec.name} ${chip.textContent}: ${next ? "ON" : "OFF"}`);
            });
          }
        } else if (c.type === "slider") {
          const slider = document.getElementById(`input-${c.id}`), num = document.getElementById(`num-${c.id}`);
          const parse = (s) => (Number(c.step) % 1 ? parseFloat(s) : parseInt(s, 10));
          const stored = (val) => (c.divisor ? val / c.divisor : val * (c.unit || 1));
          slider?.addEventListener("input", (e) => {
            const val = parse(e.target.value);
            commit(st => { st[c.key] = stored(val); }, null, { sync: false });
            if (num) num.value = `${val}${c.suffix}`;
          });
          slider?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} ${c.history}: ${e.target.value}${c.suffix}`));
          num?.addEventListener("change", (e) => {
            const raw = parse(e.target.value.replace(/[^0-9.-]/g, ""));
            let val = isNaN(raw) ? Number(c.min) : Math.max(Number(c.min), Math.min(Number(c.max), raw));
            if (Number(c.step) % 1) val = Math.round(val * 10) / 10;
            commit(st => { st[c.key] = stored(val); }, `${spec.name} ${c.history}: ${val}${c.suffix}`);
          });
        } else if (c.type === "toggle") {
          document.getElementById(c.id)?.addEventListener("change", (e) => {
            const checked = e.target.checked;
            commit(st => { st[c.key] = checked; }, `${spec.name} ${c.history}: ${checked ? "ON" : "OFF"}`);
          });
        }
      }
    }
    return commit;
  }
}
