# Module Studio — Design System & Tokens Specification
### Theme: Abstract Studio Clean Modernist Canvas Aesthetic

This document establishes the design tokens, visual hierarchy, and structural patterns of **Module Studio**, derived from the minimalist, floating-canvas interface of **Abstract Studio**.

---

## 🎨 1. Palette & Surface Tokens

| Token Name | Hex / Value | Purpose |
| :--- | :--- | :--- |
| `--bs-bg-workspace` | `#eceef2` | Cool neutral background of the entire viewport work area. |
| `--bs-canvas-grid-dot` | `rgba(0, 0, 0, 0.07)` | Architectonic dot grid (spacing: 20px × 20px). |
| `--bs-surface-artboard` | `#ffffff` | Pure white artboard surface floating in the center. |
| `--bs-surface-card` | `#ffffff` | White floating panels (Layers, Property Flyouts). |
| `--bs-surface-card-active` | `#18181f` | Dark high-contrast active state for selected layers. |
| `--bs-surface-subtle` | `#f2f4f7` | Subtle input background and chip containers. |
| `--bs-surface-rail` | `rgba(24, 24, 31, 0.90)` | Floating icon rail buttons. |

---

## 🔲 2. Border & Elevation Tokens

| Token Name | Hex / Value | Purpose |
| :--- | :--- | :--- |
| `--bs-border-default` | `#dcdfe6` | Standard inputs, divider lines, and button outlines. |
| `--bs-border-card` | `#e2e5eb` | Subtle perimeter stroke for floating cards. |
| `--bs-border-button` | `#d2d5de` | Pill buttons in top header (`Random`, `Config`, `Copy SVG`). |
| `--bs-shadow-card` | `0 12px 36px -6px rgba(0,0,0,0.08)` | Soft diffusion shadow for floating tool panels. |
| `--bs-shadow-artboard` | `0 24px 64px -12px rgba(0,0,0,0.08)` | Premium depth shadow separating the canvas from the background. |

---

## ✍️ 3. Typography & Form Controls

* **Font Families:**
  - `font-sans`: `Inter`, -apple-system, BlinkMacSystemFont, sans-serif
  - `font-mono`: `JetBrains Mono`, monospace (measurements, angle readouts, coordinates)
  - `font-display`: `Space Grotesk`, sans-serif (App branding)
* **Pills & Sliders:**
  - Track: `#dcdfe6` (3px height)
  - Thumb: `#18181f` circular disc (13px)
  - Numeric Badge: `#ffffff` pill box with thin border `#dcdfe6` and mono text.

---

## 🏗️ 4. Layout Architecture: Canvas-First Floating Cards

Instead of full-height fixed sidebars that occupy canvas space, the interface employs:
1. **Top Minimal Header (56px):**
   - Left: Logo + `Module Studio`
   - Center: Aspect Ratio dropdown (`1 : 1 ▼`), Grid toggle button, Theme/Invert toggle button.
   - Right: Actions (`Random`, `Config`, `Copy SVG`, `Download SVG`).
2. **Left Floating Layers Panel (`CAPAS`):**
   - Header with count badge (`CAPAS 2`) and action `Add pattern ⊕`.
   - Each layer represents an independent **Module Unit**:
     - Active Layer: Dark card (`#18181f`), white text, preview glyph.
     - Inactive Layer: Light card (`#ffffff`), dark text, preview glyph.
     - Controls: Eye (visibility toggle), Trash (delete/mute), Grip dots (reorder).
3. **Center Canvas Viewport:**
   - Centered artboard with zoom HUD pill at bottom center (`[-] [🔍] [+]`).
   - Technical status line at bottom right (`800 × 800 PX • 2 CAPAS • RETINA HiDPI`).
4. **Contextual Floating Inspector (left of the controls rail):**
   - Shape selector grid (15 glyphs, Phosphor fill).
   - Sliders (`Ancho`, `Alto`, `Rotación`, `Grosor Trazo`).
   - Mode segment (`Trazo` vs `Relleno`).
   - Color picker with hex input.

---

## 🧩 5. Inspector Control Tokens (Figma: *Web apps / Abstract studio*)

Used by every modifier card (`.ds-*` classes in `css/studio-pro.css`).

| Element | Spec |
| :--- | :--- |
| Card | 400px wide, 24px padding, 20px radius, 16px gap, shadow `0 10px 20px rgba(15,38,72,.15), 0 3px 6px rgba(15,38,72,.1)` |
| Title | Inter 14px, `#787b94`; layer badge `#e1e2eb`, Inter 12px 600 |
| Switch | 40×24, 99999px radius; on = `#282a36` |
| Overline label | Inter 12px 600, uppercase, tracking .24px, `#63657b` |
| Tag | 24px high, 12px x-padding, pill; active = `#282a36` bg / `#eeeef4` text |
| Slider | 2px track `#1d1d25`, 16px thumb (`assets/slider-thumb.svg`) |
| Value box | 62×31, `#f0f0f2` bg, 1px `#292932`, 7px radius, Roboto Mono 15px |
| Toggle item | Inter 16px label + 24×24 checkbox, 8px radius, border `#9ea1b8` |
| Icons | Phosphor: regular for UI controls, fill for canvas shapes |
