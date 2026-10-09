/**
 * The (?) help: a small button beside the title of a panel or of a group that opens a popover with two short parts, "What it is?" (the design
 * concept) and "What it does?" (what the controls change here). The texts live in each panel's description (`help: { is, does }`).
 * One popover serves them all; it opens with a click and closes with Escape, a click elsewhere, or when the panel scrolls or the window changes.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class HelpPopover {
  // The button drawn beside a title; `id` finds its texts again when it is clicked
  helpButtonHtml(id, topic, help) {
    (this._helpTexts ||= {})[id] = help;
    return `<button type="button" class="ds-help" data-help="${id}" aria-label="What is ${topic}?" aria-haspopup="dialog" aria-expanded="false"><i class="ph ph-question" aria-hidden="true"></i></button>`;
  }

  setupHelp() {
    let pop = document.getElementById("help-popover");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "help-popover";
      pop.className = "ds-help-popover";
      pop.setAttribute("role", "dialog");
      pop.hidden = true;
      document.body.appendChild(pop);
    }
    let current = null;
    const close = () => {
      if (!current) return;
      current.setAttribute("aria-expanded", "false");
      current = null;
      pop.hidden = true;
    };
    const open = (btn) => {
      const h = (this._helpTexts || {})[btn.dataset.help];
      if (!h) return;
      const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
      pop.innerHTML = `<p><span class="ds-help-popover__label">What it is?</span>${esc(h.is)}</p><p><span class="ds-help-popover__label">What it does?</span>${esc(h.does)}</p><span class="ds-help-popover__pointer"></span>`;
      pop.setAttribute("aria-label", btn.getAttribute("aria-label"));
      pop.hidden = false;
      // above the button, pointing down; below it (pointing up) when there is no room above; kept inside the window
      const r = btn.getBoundingClientRect(), w = pop.offsetWidth, hgt = pop.offsetHeight, gap = 10;
      const above = r.top - hgt - gap >= 8;
      const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
      pop.style.left = `${left}px`;
      pop.style.top = `${above ? r.top - hgt - gap : r.bottom + gap}px`;
      pop.style.setProperty("--pointer-x", `${Math.max(10, Math.min(w - 10, r.left + r.width / 2 - left))}px`);
      pop.classList.toggle("is-below", !above);
      btn.setAttribute("aria-expanded", "true");
      current = btn;
    };
    document.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest(".ds-help");
      if (btn) { e.stopPropagation(); const same = btn === current; close(); if (!same) open(btn); return; }
      if (current && !pop.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && current) { const b = current; close(); b.focus(); } });
    window.addEventListener("resize", close);
    document.querySelectorAll(".inspector-flyout-card").forEach(card => card.addEventListener("scroll", close, { passive: true }));
  }
}
