# Module Studio
### Professional Generative Visual Grammar Studio & Design Tool

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://dmore88.github.io/module-studio/)
[![Architecture Contract](https://img.shields.io/badge/Architecture-STUDIO__RULES.md-blue?style=for-the-badge)](./STUDIO_RULES.md)
[![Studio Controls Guide](https://img.shields.io/badge/Controls%20Guide-STUDIO__CONTROLS__GUIDE.md-purple?style=for-the-badge)](./STUDIO_CONTROLS_GUIDE.md)
[![Design Tokens](https://img.shields.io/badge/Design%20Tokens-DESIGN__SYSTEM__TOKENS.md-black?style=for-the-badge)](./Docs/DESIGN_SYSTEM_TOKENS.md)
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
2. **Contextual Inspector Flyout:** A floating contextual card positioned left of the tool rail that synchronizes with the active layer and selected tool.
3. **Floating Controls Rail:** A vertical right-hand dock with minimalist circular black buttons for rapid tool switching.
4. **Interactive Artboard:** High-DPI canvas supporting multiple aspect ratios (1:1, 9:16, 4:3, 3:4, 16:9), figure/ground inversion, wireframe audit, and SVG/PNG vector/raster exports.

---

## 🎛️ Implemented Controls & Principles

| Tool | Mode | Description |
| :--- | :--- | :--- |
| **Module** | Base Unit | 15 geometric glyphs, scale, rotation, stroke width, offset X/Y, fill/stroke draw mode, per-layer shape color. |
| **Layout Structure** | Spatial Matrix | Dual-engine spatial layout: **Repetition** (Grid, Curved, Brick, Diagonal) and **Radiation** (Centrifugal, Concentric, Spiral, Dual-center). |
| **Structure** | Formal Cadence | Formal rhythmic subdivision with dual alternating intervals ($A:B:A:B$) for columns and rows, and visible structural grid lines. |
| **Similarity** | Visual Kinship | Genetic morphological variation across population: *Elastic* (distortion), *3D tilt* (foreshortening), *Wobble* (rotation wobble), *Scale* (scale kinship), and *Hibrid* (hybrid fusion). Includes fluctuation intensity and spatial cell jitter. |
| **Gradation** | Progressive Transition | Systematic step progression across cartesian/polar pathways (rotation, scale, depth, drift). *(In progress)* |
| **Anomaly** | Focal Disruption | Structural fracture, focal epicenters, and anomalous geometric mutations. *(In progress)* |
| **Contrast** | Tension & Dominance | Minority clash across scale, shape, direction, and tone. *(In progress)* |
| **Concentration** | Gravitational Fields | Density kinematics towards attractor points, axes, and voids. *(In progress)* |
| **Texture** | Surface Treatment | Halftone, lithographic grain, linear hatching, and typographic glyph stamping. *(In progress)* |
| **Space** | 3D Illusion | 30° isometric extrusion, fluctuating planes, and light angle depth. *(In progress)* |

---

## 📜 Architectural Contracts & Rules

Every feature and interaction in Module Studio strictly follows the design contracts established in:
- [**`STUDIO_RULES.md`**](./STUDIO_RULES.md): Mechanics of mutual exclusions (Cartesian vs. Polar), per-layer isolation, collective modifier warnings, rendering pipeline, and the **Mandatory Zero-Breakage Quality Protocol**.
- [**`STUDIO_CONTROLS_GUIDE.md`**](./STUDIO_CONTROLS_GUIDE.md): Technical specification of all formulas, sliders, ranges, and geometric algorithms.
- [**`Docs/DESIGN_SYSTEM_TOKENS.md`**](./Docs/DESIGN_SYSTEM_TOKENS.md): Design tokens, spacing, typography, and color palettes.

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
This bundles all modular ES components into `js/bundle-pro.js` with zero dependencies.
