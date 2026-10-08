/**
 * Panels described as data. A panel spec lists its groups and controls; this class draws the panel, shows the state of the
 * active layer in it and listens to its controls, the same way for every panel.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 *
 * A spec looks like:
 *   { id, cardId, name,                      // name starts the history labels ("Space Mode: ...")
 *     state: (app) => the settings object of the active layer,
 *     enabled: { id, key, auto?, onToggle? },  // the switch of the header; every edit turns it on unless auto is false; onToggle(app, state, checked) replaces the default
 *     badgeId,                               // the layer badge in the header
 *     banner: { id, text, hidden: (mod) => bool },   // optional notice under the header
 *     top: [ controls ],                     // controls above the groups (Layout's Repetition / Radiation switch)
 *     groups: [{ title, advId?, region?, floating?, controls: [ ... ] }],
 *     regions: { id: (state) => bool },      // a group with `region` lives in a box that shows only when its test passes (Layout's two modes)
 *     syncAll: true,                         // after an edit, refresh every panel (not only this one)
 *     place: (app, state) => {} }            // called after every refresh: puts the floating groups where they belong
 * A group with `floating: "id"` is drawn in a box of that id at the end of the panel; `place` moves it.
 *
 * Controls (every one may carry `show: (state, mod) => bool`, to appear only in some cases, and `blockId`, the id of its box;
 * `get(state, app)` and `set(state, value, app)` replace the plain `key` when a setting needs more than a number):
 *   { type: "tags",   label, key, attr, history, fallback, options: [[value, text, title?], ...] }   one choice among several
 *   { type: "dropdown", label, key, attr, history, fallback, options: [[value, text, iconHtml?], ...] | "shapes" }   a list of choices ("shapes": every shape, with its icon)
 *   { type: "modes",  label, ariaLabel, attr, options: [[value, text, id], ...], get, onSelect(app, value) }   the two-button switch (a button group)
 *   { type: "chips",  label, ariaLabel, attr, options: [{ key, text, id?, show? }],            chips that switch on and off by themselves
 *       nested }  // optional { key, defaults, history }: the chips live in an object of the setting (Anomaly's attrs: on unless set to false)
 *   { type: "slider", id, label, key, min, max, step, value, suffix, history, labelId?,
 *       unit,      // what the setting stores per 1 shown (Texture shows %, stores px: unit 0.1)
 *       divisor,   // the setting stores the shown value divided by this (0 to 100 % shown, 0 to 1 stored: divisor 100)
 *       fallback,  // what the setting holds when it has no value yet (default: value)
 *       invert,    // the setting stores the opposite sign of what is shown (Gradation's speed)
 *       signed,    // shown with a + in front when positive
 *       meta,      // (state) => { label, min, max, step, suffix, history }: the slider changes its name and range with the state (Layout's grid parameter)
 *       decimal,   // the value box asks for a decimal keyboard
 *       bind,      // false: drawn only (its controller lives elsewhere)
 *       advanced } // true: the control goes in the group's "Advanced controls" accordion (the group needs advId)
 *   { type: "toggle", id, label, key, history, labelId?, title?, show? }
 *   { type: "color",  prefix, label, key, fallback, history, get?, set? }   a colour row without an on/off (Gradation's end colour, a line colour)
 *   { type: "accent", prefix, colorKey, flagKey }   the accent colour row (swatch, hex, remove); picking a colour turns the accent on
 *   { type: "stack",  id, controls: [...], show? }   a box of controls that shows or hides as one
 *   { type: "hint",   text, blockId?, show? }
 * With two or more groups (in a region: in that region), every group gets its title and a divider; with one, only the panel has a title.
 */
// The shape names the dropdowns show (a few differ from the shapes' own names)
const SHAPE_LABELS = { line: "Line", cross: "Greek Cross", wave: "Sine Wave", digit1: "Number 1", digit5: "Number 5", digit9: "Number 9" };

// Every control of a list, the boxes (stack) and what is inside them
function* walkControls(controls) {
  for (const c of controls) {
    yield c;
    if (c.type === "stack") yield* walkControls(c.controls);
  }
}

class PanelBuilder {
  // Draws the controls of every panel described as data (once, before the controllers listen to them)
  buildDataPanels() {
    for (const spec of dataPanels()) {
      const card = document.getElementById(spec.cardId);
      if (!card) continue;
      const hid = (c) => (c.show ? " hidden" : "");
      const idAttr = (c) => (c.blockId ? ` id="${c.blockId}"` : "");
      const labelIdAttr = (c) => (c.labelId ? ` id="${c.labelId}"` : "");

      // One group: its title and divider (when the panel has several), its controls and its Advanced controls
      const drawGroup = (g, i, titled) => {
        const head = titled ? `${i > 0 ? '<div class="ds-divider" role="separator"></div>\n' : ""}<div class="ds-label ds-label--overline">${g.title}</div>\n` : "";
        return head + drawControls(g.controls, g.advId);
      };
      // A list of controls; the ones marked `advanced` go in an accordion with the id advId
      const drawControls = (controls, advId) => {
        let out = "", adv = "", toggles = [];
        let target = "out";
        const add = (t) => { if (target === "adv") adv += t; else out += t; };
        const flush = () => { if (toggles.length) { add(`<div class="ds-toggles">\n${toggles.join("\n")}\n</div>\n`); toggles = []; } };
        for (const c of controls) {
          if (!!c.advanced !== (target === "adv")) { flush(); target = c.advanced ? "adv" : "out"; }
          if (c.type === "toggle") {
            toggles.push(`<label${c.labelId ? ` id="${c.labelId}"` : ""} class="ds-toggle-item${hid(c) && c.labelId ? " hidden" : ""}"${c.title ? ` title="${c.title}"` : ""}>\n<span class="ds-toggle-label">${c.label}</span>\n<input type="checkbox" id="${c.id}" class="ds-checkbox">\n</label>`);
            continue;
          }
          if (c.type === "accent") {
            const P = c.prefix;
            toggles.push(`<div class="ds-color-row" id="${P}-accent-row">\n<span class="ds-color-label">Accent color</span>\n<span class="ds-color-hex" id="${P}-accent-hex">#F43F5E</span>\n<span class="ds-swatch">\n<input type="color" id="${P}-accent-color" value="#f43f5e">\n<span class="ds-swatch-fill" id="${P}-accent-swatch"></span>\n</span>\n<button type="button" class="ds-color-clear" id="${P}-accent-clear" aria-label="Remove accent color" title="Remove accent color"><i class="ph ph-x" aria-hidden="true"></i></button>\n</div>`);
            continue;
          }
          flush();
          if (c.type === "tags") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-tags">\n${c.options.map(([v, t, title], k) => `<button type="button" class="ds-tag${k === 0 ? " active" : ""}" ${c.attr}="${v}"${title ? ` title="${title}"` : ""}>${t}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "dropdown") {
            const opts = c.options === "shapes" ? STUDIO_SHAPE_KEYS.map(k => [k, SHAPE_LABELS[k] || Shapes[k].name.replace(/\s*\([^)]*\)\s*/g, ""), shapeIconHtml(Shapes[k])]) : c.options;
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-dropdown" data-select>\n<button type="button" class="ds-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false"><span class="ds-dropdown-current">${opts[0][2] || ""}<span>${opts[0][1]}</span></span><i class="ph ph-caret-down" aria-hidden="true"></i></button>\n<div class="ds-dropdown-menu hidden" role="listbox">\n${opts.map(([v, t, icon]) => `<button type="button" class="ds-dropdown-item" role="option" ${c.attr}="${v}">${icon || ""}<span>${t}</span></button>`).join("\n")}\n</div>\n</div>\n</div>\n`);
          } else if (c.type === "modes") {
            add(`<div${idAttr(c)} class="ds-field">\n<div class="ds-label">${c.label}</div>\n<div class="ds-btn-group" role="group" aria-label="${c.ariaLabel || c.label}">\n${c.options.map(([v, t, id], k) => `<button type="button" id="${id}" class="ds-btn-group__button${k === 0 ? " active" : ""}" ${c.attr}="${v}">${t}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "color") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-color-row" id="${c.prefix}-accent-row">\n<span class="ds-color-label">${c.label}</span>\n<span class="ds-color-hex" id="${c.prefix}-accent-hex">#F43F5E</span>\n<span class="ds-swatch">\n<input type="color" id="${c.prefix}-accent-color" value="#f43f5e">\n<span class="ds-swatch-fill" id="${c.prefix}-accent-swatch"></span>\n</span>\n</div>\n</div>\n`);
          } else if (c.type === "chips") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div class="ds-label">${c.label}</div>\n<div class="ds-tags" role="group" aria-label="${c.ariaLabel || c.label}">\n${c.options.map(o => `<button type="button"${o.id ? ` id="${o.id}"` : ""} class="ds-tag${o.show ? " hidden" : ""}" ${c.attr}="${o.key}" aria-pressed="false">${o.text}</button>`).join("\n")}\n</div>\n</div>\n`);
          } else if (c.type === "slider") {
            add(`<div${idAttr(c)} class="ds-field${hid(c)}">\n<div${labelIdAttr(c)} class="ds-label ds-label-clip">${c.label}</div>\n<div class="ds-slider">\n<input type="range" id="input-${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}">\n<input type="text" id="num-${c.id}" class="ds-value" value="${c.value}${c.suffix}" inputmode="${c.decimal ? "decimal" : "numeric"}">\n</div>\n</div>\n`);
          } else if (c.type === "stack") {
            add(`<div id="${c.id}" class="ds-stack${hid(c)}">\n${drawControls(c.controls)}</div>\n`);
          } else if (c.type === "hint") {
            add(c.blockId ? `<div id="${c.blockId}" class="ds-stack${hid(c)}"><p class="ds-hint">${c.text}</p></div>\n` : `<p class="ds-hint">${c.text}</p>\n`);
          }
        }
        flush();
        if (adv) out += `<details id="${advId}" class="ds-advanced">\n<summary><i class="ph ph-caret-down" aria-hidden="true"></i><span>Advanced controls</span></summary>\n<div class="ds-stack">\n${adv}</div>\n</details>\n`;
        return out;
      };

      let html = spec.banner ? `<div id="${spec.banner.id}" class="ds-snackbar hidden" role="status">\n<i class="ph-fill ph-warning"></i>\n<p>${spec.banner.text}</p>\n</div>\n` : "";
      if (spec.top) html += drawControls(spec.top);
      // The groups, in order; the ones of a region share a box; the floating ones go in their own box at the end
      const plain = spec.groups.filter(g => !g.floating);
      const regionOf = (g) => g.region || "";
      const countIn = (r) => plain.filter(g => regionOf(g) === r).length;
      let open = null, index = {};
      for (const g of plain) {
        const r = regionOf(g);
        if (r !== open) {
          if (open) html += "</div>\n";
          if (r) html += `<div id="${r}" class="ds-stack${spec.regions && spec.regions[r] ? " hidden" : ""}">\n`;
          open = r;
        }
        index[r] = (index[r] ?? -1) + 1;
        html += drawGroup(g, index[r], countIn(r) > 1);
      }
      if (open) html += "</div>\n";
      for (const g of spec.groups.filter(g => g.floating)) html += `<div id="${g.floating}" class="ds-stack">\n${drawGroup(g, 1, !!g.title)}</div>\n`;
      card.insertAdjacentHTML("beforeend", html);
    }
  }

  // The value a control shows
  dataValue(c, st) {
    if (c.get) return c.get(st, this);
    const raw = st[c.key] ?? c.fallback ?? c.value;
    return Math.round(c.divisor ? raw * c.divisor : raw / (c.unit || 1));
  }

  // Shows the state of the active layer in a panel described as data
  syncDataPanel(spec) {
    const mod = this.getActiveModule();
    const st = spec.state(this);
    if (!st) return;
    if (!mod && !spec.allowNoModule) return;
    const badge = document.getElementById(spec.badgeId);
    if (badge && mod) badge.textContent = this.compositionName(mod);
    const sw = document.getElementById(spec.enabled.id);
    if (sw) sw.checked = !!st[spec.enabled.key];
    if (spec.banner) document.getElementById(spec.banner.id)?.classList.toggle("hidden", !!spec.banner.hidden(mod));
    if (spec.regions) for (const [id, test] of Object.entries(spec.regions)) document.getElementById(id)?.classList.toggle("hidden", !test(st));
    const all = [...(spec.top || []), ...spec.groups.flatMap(g => g.controls)];
    for (const c of walkControls(all)) {
      // every box that shows or hides: its own box, its stack and its label
      if (c.show && c.blockId) document.getElementById(c.blockId)?.classList.toggle("hidden", !c.show(st, mod));
      if (c.type === "tags" || c.type === "dropdown") {
        const cur = c.get ? c.get(st, this) : (st[c.key] || c.fallback);
        document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(b => b.classList.toggle("active", b.getAttribute(c.attr) === cur));
      } else if (c.type === "modes") {
        const cur = c.get(st, this);
        for (const [v, , id] of c.options) document.getElementById(id)?.classList.toggle("active", v === cur);
      } else if (c.type === "accent") {
        this.syncAccentColorRow(c.prefix, st[c.colorKey], !!st[c.flagKey]);
      } else if (c.type === "color") {
        this.syncAccentColorRow(c.prefix, c.get ? c.get(st, this, mod) : (st[c.key] || c.fallback), true);
      } else if (c.type === "chips") {
        for (const o of c.options) {
          const chip = o.id ? document.getElementById(o.id) : document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`);
          if (!chip) continue;
          const on = c.nested ? (st[c.nested.key] || {})[o.key] !== false : !!st[o.key];
          chip.classList.toggle("active", on);
          chip.setAttribute("aria-pressed", String(on));
          if (o.show) chip.classList.toggle("hidden", !o.show(st, mod));
        }
      } else if (c.type === "slider" && c.bind !== false) {
        const m = c.meta ? c.meta(st) : null;
        if (c.meta) {
          const slider = document.getElementById(`input-${c.id}`);
          if (m && slider) { slider.min = m.min; slider.max = m.max; slider.step = m.step; }
          if (m && c.labelId) { const lab = document.getElementById(c.labelId); if (lab) lab.textContent = m.label; }
        }
        let v = this.dataValue(c, st);
        if (c.invert) v = v ? -v : 0;
        this.syncControlValue(`input-${c.id}`, v);
        const num = document.getElementById(`num-${c.id}`);
        if (num) num.value = `${c.signed && v > 0 ? "+" : ""}${v}${m ? m.suffix : c.suffix}`;
      } else if (c.type === "toggle") {
        this.syncCheckbox(c.id, c.get ? !!c.get(st, this) : !!st[c.key]);
        if (c.show) {
          const row = document.getElementById(c.id)?.closest("label");
          if (row) { if (c.labelId) row.classList.toggle("hidden", !c.show(st, mod)); else row.style.display = c.show(st, mod) ? "" : "none"; }
        }
      } else if (c.type === "stack" && c.show) {
        document.getElementById(c.id)?.classList.toggle("hidden", !c.show(st, mod));
      }
      if (c.type === "chips") for (const o of c.options) if (o.show && !o.id) document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`)?.classList.toggle("hidden", !o.show(st, mod));
    }
    if (spec.place) spec.place(this, st);
    this.updateRailIndicatorDots();
  }

  // Listens to the controls of a panel described as data: any edit turns the modifier on (unless the panel says no), redraws and
  // records a history step. Returns `commit(mutate, historyLabel)`, for the panels that also react to something else (a click on the canvas).
  bindDataPanel(spec) {
    const sw = document.getElementById(spec.enabled.id);
    const resync = () => (spec.syncAll ? this.syncAllInspectorsWithActiveLayer() : this.syncDataPanel(spec));
    const commit = (mutate, historyLabel, { sync = true } = {}) => {
      const st = spec.state(this);
      if (!st) return;
      mutate(st);
      if (spec.enabled.auto !== false) {
        st[spec.enabled.key] = true;
        if (sw) sw.checked = true;
      }
      if (sync) resync();
      this.render();
      this.updateLayerCardsUI();
      if (historyLabel) this.pushHistory(`Layer ${this.activeLayerId} ${historyLabel}`);
    };
    sw?.addEventListener("change", (e) => {
      const st = spec.state(this);
      if (!st) return;
      if (spec.enabled.onToggle) { spec.enabled.onToggle(this, st, e.target.checked); return; }
      st[spec.enabled.key] = e.target.checked;
      resync();
      this.render();
      this.updateLayerCardsUI();
      this.pushHistory(`Layer ${this.activeLayerId} ${spec.name}: ${st[spec.enabled.key] ? "ON" : "OFF"}`);
    });
    const all = [...(spec.top || []), ...spec.groups.flatMap(g => g.controls)];
    for (const c of walkControls(all)) {
      if (c.type === "accent") {
        document.getElementById(`${c.prefix}-accent-clear`)?.addEventListener("click", () => commit(st => { st[c.flagKey] = false; }, `${spec.name} Accent: none`));
        // Picking an accent colour also turns the accent on
        const picker = document.getElementById(`${c.prefix}-accent-color`);
        picker?.addEventListener("input", (e) => commit(st => { st[c.colorKey] = e.target.value; st[c.flagKey] = true; }, null));
        picker?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} Accent: ${e.target.value.toUpperCase()}`));
      } else if (c.type === "color") {
        // a colour without an on/off does not turn the modifier on by itself; it only repaints
        const picker = document.getElementById(`${c.prefix}-accent-color`);
        picker?.addEventListener("input", (e) => {
          const st = spec.state(this);
          if (!st) return;
          if (c.set) c.set(st, e.target.value, this); else st[c.key] = e.target.value;
          this.syncAccentColorRow(c.prefix, e.target.value, true);
          this.render();
        });
        picker?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} ${c.history}: ${e.target.value.toUpperCase()}`));
      } else if (c.type === "modes") {
        for (const [v, , id] of c.options) document.getElementById(id)?.addEventListener("click", () => c.onSelect(this, v));
      } else if (c.type === "tags" || c.type === "dropdown") {
        document.querySelectorAll(`#${spec.cardId} [${c.attr}]`).forEach(btn => {
          btn.addEventListener("click", () => {
            const v = btn.getAttribute(c.attr);
            commit(st => { if (c.set) c.set(st, v, this); else st[c.key] = v; }, `${spec.name} ${c.history}: ${v}`);
          });
        });
      } else if (c.type === "chips") {
        for (const o of c.options) {
          const chip = o.id ? document.getElementById(o.id) : document.querySelector(`#${spec.cardId} [${c.attr}="${o.key}"]`);
          chip?.addEventListener("click", () => {
            if (c.nested) {
              commit(st => {
                st[c.nested.key] = Object.assign({}, c.nested.defaults, st[c.nested.key]);
                st[c.nested.key][o.key] = !st[c.nested.key][o.key];
              }, `${spec.name} ${c.nested.history} ${o.key}`);
              return;
            }
            const next = chip.getAttribute("aria-pressed") !== "true";
            commit(st => { st[o.key] = next; }, `${spec.name} ${chip.textContent}: ${next ? "ON" : "OFF"}`);
          });
        }
      } else if (c.type === "slider" && c.bind !== false) {
        const slider = document.getElementById(`input-${c.id}`), num = document.getElementById(`num-${c.id}`);
        const meta = () => (c.meta ? c.meta(spec.state(this)) : null);
        const lo = () => Number(meta() ? meta().min : c.min), hi = () => Number(meta() ? meta().max : c.max);
        const suffix = () => (meta() ? meta().suffix : c.suffix);
        const step = () => Number(meta() ? meta().step : c.step);
        const label = () => (meta() ? meta().history || meta().label : c.history);
        const parse = (s) => (step() % 1 ? parseFloat(s) : parseInt(s, 10));
        const apply = (st, val) => { if (c.set) c.set(st, val, this); else st[c.key] = c.invert ? (val ? -val : 0) : c.divisor ? val / c.divisor : val * (c.unit || 1); };
        const shown = (val) => `${c.signed && val > 0 ? "+" : ""}${val}${suffix()}`;
        slider?.addEventListener("input", (e) => {
          const val = parse(e.target.value);
          commit(st => apply(st, val), null, { sync: false });
          if (num) num.value = shown(val);
        });
        slider?.addEventListener("change", (e) => this.pushHistory(`Layer ${this.activeLayerId} ${spec.name} ${label()}: ${e.target.value}${suffix()}`));
        num?.addEventListener("change", (e) => {
          const raw = parse(e.target.value.replace(/[^0-9.-]/g, ""));
          let val = isNaN(raw) ? lo() : Math.max(lo(), Math.min(hi(), raw));
          if (step() % 1) val = Math.round(val * 10) / 10;
          commit(st => apply(st, val), `${spec.name} ${label()}: ${val}${suffix()}`);
        });
      } else if (c.type === "toggle") {
        document.getElementById(c.id)?.addEventListener("change", (e) => {
          const checked = e.target.checked;
          commit(st => { if (c.set) c.set(st, checked, this); else st[c.key] = checked; }, `${spec.name} ${c.history}: ${checked ? "ON" : "OFF"}`);
        });
      }
    }
    return commit;
  }
}
