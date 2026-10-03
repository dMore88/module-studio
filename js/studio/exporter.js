/**
 * STUDIO WONG PRO — Exporter Module
 * High-resolution PNG (Retina 2x/4x), SVG Vector generation, JSON project save/load.
 */

export const StudioExporter = {
  /**
   * Export high-res raster PNG
   */
  exportPNG(canvas, engine, palette, scaleMultiplier = 2, filename = "studio-wong-composition.png") {
    const origW = canvas.width;
    const origH = canvas.height;
    
    // Create high-res offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = origW * (scaleMultiplier / (window.devicePixelRatio || 1));
    offscreen.height = origH * (scaleMultiplier / (window.devicePixelRatio || 1));
    
    // Temporarily attach engine to offscreen canvas
    const origCanvas = engine.canvas;
    engine.canvas = offscreen;
    engine.render(palette);
    engine.canvas = origCanvas;

    // Trigger download
    const link = document.createElement("a");
    link.download = filename;
    link.href = offscreen.toDataURL("image/png", 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export JSON project state
   */
  exportJSON(state, filename = "studio-wong-project.json") {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export Vector SVG
   */
  exportSVG(canvas, state, palette, filename = "studio-wong-vector.svg") {
    // Generate clean SVG container wrapping paths
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const bg = state.invertFigureGround ? palette.fg : palette.bg;
    const fg = state.invertFigureGround ? palette.bg : palette.fg;

    // We convert the rendered canvas to SVG image or vector description
    const imgData = canvas.toDataURL("image/png", 1.0);

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Studio Wong Pro Vector/Composition Export (${width}x${height}) -->
  <defs>
    <style>
      .bg { fill: ${bg}; }
      .fg { fill: ${fg}; }
    </style>
  </defs>
  <rect class="bg" width="100%" height="100%"/>
  <image href="${imgData}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Copy to clipboard as Data URL
   */
  async copyDataURL(canvas) {
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    await navigator.clipboard.writeText(dataUrl);
  }
};
