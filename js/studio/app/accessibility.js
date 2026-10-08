/**
 * Accessible names and states for every control.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class Accessibility {
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
}
