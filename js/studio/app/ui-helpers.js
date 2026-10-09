/**
 * Small pieces of interface shared by every panel: the arrow keys on the value boxes and the dropdowns.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
class UiHelpers {
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
        if (sel.closest(".ds-field--row")) {
          // Row dropdown (label beside a narrow trigger): the menu grows to the right edge of the trigger so every option reads in full
          menu.style.width = "max-content"; menu.style.minWidth = `${r.width}px`; menu.style.maxWidth = `${Math.max(r.width, Math.min(320, r.right - 8))}px`;
          menu.style.left = `${Math.max(8, r.right - menu.offsetWidth)}px`;
        } else {
          menu.style.left = `${r.left}px`;
          menu.style.width = `${r.width}px`;
        }
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
}
