# Module Studio
### Professional Generative Visual Grammar Studio & Design Tool

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://dmore88.github.io/module-studio/)
[![Architecture Contract](https://img.shields.io/badge/Architecture-STUDIO__RULES.md-blue?style=for-the-badge)](./STUDIO_RULES.md)
[![Studio Controls Guide](https://img.shields.io/badge/Controls%20Guide-STUDIO__CONTROLS__GUIDE.md-purple?style=for-the-badge)](./STUDIO_CONTROLS_GUIDE.md)
[![Design Tokens](https://img.shields.io/badge/Design%20Tokens-DESIGN__SYSTEM__TOKENS.md-black?style=for-the-badge)](./docs/DESIGN_SYSTEM_TOKENS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](#)

**Module Studio** is a standalone, browser-based generative design application inspired by the design philosophy of Figma, Illustrator, and Abstract Studio, and grounded in the foundational principles of visual grammar from **Wucius Wong's** *"Principles of Two-Dimensional Design"* (*Fundamentos del diseño bi- y tridimensional*).

> 🌐 **Live Demo:** Try Module Studio directly in your browser: **[https://dmore88.github.io/module-studio/](https://dmore88.github.io/module-studio/)**

---

## 🎯 Purpose & Philosophy

Module Studio is designed as a **generative creative gym and precision workbench for graphic designers**. It enables designers to explore, modulate, and create complex procedural compositions by combining fundamental geometric units (*modules*) with mathematical spatial layouts and qualitative modifiers.

---

## 🏗️ Core Architecture

The application is built on a clean, zero-dependency stack with high-performance Canvas 2D kinematics:

1. **Multi-Layer System:** Independent multi-layer architecture (supporting up to 5 concurrent layers) with independent visibility, ordering, Drag & Drop reordering, per-layer shape/color, and isolated modifier pipelines.
2. **Contextual Inspector Flyout:** A floating contextual card positioned to the left of the tool rail that synchronizes with the active layer and selected tool.
3. **Floating Controls Rail:** A vertical right-hand dock with minimalist circular black buttons for rapid tool switching.
4. **Interactive Artboard:** High-DPI canvas supporting multiple aspect ratios (1:1, 9:16, 4:3, 3:4, 16:9), figure/ground inversion, wireframe audit, and SVG/PNG vector/raster exports.

---

## 🎛️ Implemented Controls & Principles

| Tool | Mode | Description |
| :--- | :--- | :--- |
| **Module** | Base Unit | 15 glyphs (Phosphor icons), width and height up to 2000 px, rotation, offset X/Y, stroke width (uniform even on stretched shapes), fill/stroke draw mode, per-layer shape color. *Advanced*: the module's **container** (width, height) with a *Show container* option. |
| **Layout** | Spatial Matrix | **Repetition** (Grid, Curved, Brick, Diagonal, Zigzag, Triangular, Alternating, Hexagonal) with *Fit to canvas* or *Actual size*, module placement (centers, intersections, both) and cell mix (merged, divided). *Advanced*: reflection, direction, **rhythm A:B** and **gradation of structure** (columns and rows that grow step by step), clip, checkerboard inversion and **visible lines** (design: colour and width, exported). **Radiation** (Centrifugal, Centripetal, Concentric, Spiral, Multi-center with 2 to 6 foci) with square, triangular or hexagonal rings, open center and ring rotation. |
| **Similarity** | Visual Kinship | Elastic, 3D tilt, Wobble, Scale and Hybrid kinship with fluctuation intensity. *Advanced*: association of shapes, imperfection (cut, broken) and spatial cell jitter. |
| **Gradation** | Progressive Transition | Attribute (Rotate, Scale, Depth, Drift, Shape, Texture), pathway (diagonal, horizontal, vertical, concentric, zigzag), range and cycles. *Advanced*: sequence, acceleration, alternate rows and reverse. |
| **Anomaly** | Focal Disruption | Focal, rupture, swell and void anomalies; single, regular or random distribution; intruder shape, radius, severity and accent colour. The focal point is on the canvas (click to move it). |
| **Contrast** | Tension & Dominance | Minority clash across scale, shape, angle, **position**, **tone** (a lighter tone of the module's colour), texture and space, with dominance ratio and accent colour. |
| **Concentration** | Gravitational Fields | Attractor points, axes, voids, hotspots and whole-design dense/sparse fields, by moving or by absence, with pull, field radius and mixable field styles (soft edge, flowing, dynamic density). |
| **Texture** | Geometry Deformation | Jitter, line skipping, strand crossing and perimeter undulation that deform shape geometry into a hand-made texture effect. |
| **Space** | 3D Illusion | Isometric extrusion, 3D tilt, fluctuating and paradox planes, with depth, projection angle, facet shading and isometric grid lines. |

Every panel shows the essentials first and keeps the rest in a collapsible **Advanced** section. Number boxes respond to the up and down arrow keys (Shift = ×10, Alt = ×0.1). All on-screen **guides** (container frame, focal point, attractor, isometric grid) share one colour, chosen next to the canvas buttons, and are never exported.

--- | :--- | :--- |
| **Module** | Base Unit | 15 glyphs (Phosphor fill icons), scale, rotation, stroke width, offset X/Y, fill/stroke draw mode, per-layer shape color. |
| **Layout Structure** | Spatial Matrix | Dual-engine spatial layout: **Repetition** (Grid, Curved, Brick, Diagonal) and **Radiation** (Centrifugal, Concentric, Spiral, Dual-center). |
| **Structure** | Formal Cadence | Formal rhythmic subdivision with dual alternating intervals ($A:B:A:B$) for columns and rows, and visible structural grid lines. |
| **Similarity** | Visual Kinship | Genetic morphological variation across population: *Elastic* (distortion), *3D tilt* (foreshortening), *Wobble* (rotation wobble), *Scale* (scale kinship), and *Hybrid* (hybrid fusion). Includes fluctuation intensity and spatial cell jitter. |
| **Gradation** | Progressive Transition | Per-layer progression across cartesian/polar pathways: attribute (Rotate, Scale, Depth, Drift), range, cycles, pathway direction and reverse. |
| **Anomaly** | Focal Disruption | Per-layer focal, rupture, swell and void anomalies with intruder shape, epicenter (click on canvas), radius, severity, accent highlight and reticle. |
| **Contrast** | Tension & Dominance | Per-layer minority clash across scale, shape, angle and tone, with dominance ratio, scale multiplier and minority accent. |
| **Concentration** | Gravitational Fields | Per-layer density kinematics towards attractor points, axes, voids and hotspots, with pull, field radius, flow orientation, density scale and attractor guide. |
| **Texture** | Geometry Deformation | Per-layer jitter, line skipping, strand crossing and perimeter undulation that deform shape geometry into a hand-made texture effect. |
| **Space** | 3D Illusion | Per-layer isometric extrusion, 3D tilt, fluctuating and paradox planes, with depth, projection angle, facet shading and isometric grid lines. |

---

## 📜 Architectural Contracts & Rules

Every feature and interaction in Module Studio strictly follows the design contracts established in:
- [**`STUDIO_RULES.md`**](./STUDIO_RULES.md): Mechanics of mutual exclusions (Cartesian vs. Polar), per-layer isolation, collective modifier warnings, rendering pipeline, and the **Mandatory Zero-Breakage Quality Protocol**.
- [**`STUDIO_CONTROLS_GUIDE.md`**](./STUDIO_CONTROLS_GUIDE.md): Technical specification of all formulas, sliders, ranges, and geometric algorithms.
- [**`docs/DESIGN_SYSTEM_TOKENS.md`**](./docs/DESIGN_SYSTEM_TOKENS.md): Design system from Figma: tokens (`css/tokens.css`), components and open design decisions.
- [**`docs/design-concepts-in-app.md`**](./docs/design-concepts-in-app.md): Map of every concept in Wong's book, the control that implements it, and its status.
- [**`docs/BACKLOG.md`**](./docs/BACKLOG.md): Pending work derived from Wong's book, with priorities and decisions.
- [**`docs/AUDITORIA_CONTROLES.md`**](./docs/AUDITORIA_CONTROLES.md): Usability audit of the controls (what is visible, what goes in *Advanced*).

---

## 🎨 Iconography

All icons come from [Phosphor Icons](https://github.com/phosphor-icons/homepage) (`@phosphor-icons/web`): **regular** weight everywhere (`ph ph-*`), as in the Figma design.

---

## 🚀 Getting Started

### Prerequisites
Module Studio runs directly in modern browsers without complex runtime setups or package managers. Python 3 is only needed for bundling and local HTTP serving.

### Local Development
```bash
# 1. Start local server
python3 -m http.server 5173

# 2. Open browser
open http://localhost:5173
```

### Building the Standalone Bundle
```bash
python3 build-pro.py
```
This bundles all modular ES components into `js/bundle-pro.js` with zero dependencies, and stamps the bundle's version into the `<script>` tag of `index.html` (`?v=<hash>`) so browsers never serve a stale copy.

`python3 build-pro.py --check` only verifies that the bundle is up to date. To make git run this check before every commit (it blocks the commit when the bundle is stale), enable the versioned hook once per clone:
```bash
git config core.hooksPath .githooks
```

### Save, open and export
- **Config** saves the project as `.json`; **Open** loads it back. Damaged files are cleaned up (missing values fall back to defaults) or refused with a message.
- **Download SVG** and **Copy SVG** produce a real vector SVG (paths, not an embedded image), drawn by the same engine as the canvas. Guides are left out; visible lines, being part of the design, are included.

### Tests
```bash
python3 -m http.server 5173
# open http://localhost:5173/tests/smoke.html
```
The smoke page draws all 22 shapes, runs 400 random combinations of every control, and checks determinism, undo/redo, layers, the vector SVG against the canvas, project save/open and the on-screen error notice. It must end in **All tests passed** (currently 47 checks).
