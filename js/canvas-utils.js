// Canvas and mathematical utilities for Wucius Wong Design Studio

export const CanvasUtils = {
  // Setup crisp HiDPI canvas with deterministic logical coordinates
  setupCanvas(canvas, logicalW = 600, logicalH = 600) {
    const dpr = window.devicePixelRatio || 1;
    const targetW = logicalW;
    const targetH = logicalH;

    if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
      canvas.width = targetW * dpr;
      canvas.height = targetH * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { ctx, width: targetW, height: targetH, dpr };
  },

  // Color Palettes inspired by Swiss & Bauhaus Graphic Design
  palettes: {
    monochrome: {
      id: "monochrome",
      name: "Monochrome (Ink & Paper)",
      bg: "#FAFAFA",
      fg: "#111111",
      accent: "#E11D48",
      grid: "#E5E5E5",
      isDark: false
    },
    inverted: {
      id: "inverted",
      name: "Inverted (Chalkboard)",
      bg: "#121212",
      fg: "#F4F4F5",
      accent: "#F43F5E",
      grid: "#27272A",
      isDark: true
    },
    bauhaus: {
      id: "bauhaus",
      name: "Bauhaus Primary",
      bg: "#F7F4EB",
      fg: "#1E1E1E",
      accent: "#D9381E",
      secondary: "#0047AB",
      grid: "#E0DCCE",
      isDark: false
    },
    blueprint: {
      id: "blueprint",
      name: "Architectural Blueprint",
      bg: "#0B2545",
      fg: "#EEF4F8",
      accent: "#134074",
      grid: "#134074",
      isDark: true
    },
    sepia: {
      id: "sepia",
      name: "Warm Editorial Archive",
      bg: "#F5EFE6",
      fg: "#2F2519",
      accent: "#994D1C",
      grid: "#E4D9C8",
      isDark: false
    }
  },

  // Draw background and optional grid
  clear(ctx, width, height, palette, showGrid = false, gridSize = 40) {
    ctx.save();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    if (showGrid) {
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Subtle center crosshair
      ctx.strokeStyle = palette.accent;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }
    ctx.restore();
  },

  // Draw regular polygon
  drawPolygon(ctx, x, y, radius, sides, rotation = 0) {
    if (sides < 3) return;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = rotation + (i * 2 * Math.PI) / sides;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  },

  // Draw smooth teardrop shape (frequently used in Wong's similarity & concentration principles)
  drawTeardrop(ctx, x, y, width, length, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, length / 2);
    ctx.bezierCurveTo(width / 2, length / 4, width / 2, -length / 4, 0, -length / 2);
    ctx.bezierCurveTo(-width / 2, -length / 4, -width / 2, length / 4, 0, length / 2);
    ctx.closePath();
    ctx.restore();
  },

  // Draw Wong's classic "C-shape" / hollow cut-out ring
  drawCShape(ctx, x, y, outerR, innerR, cutAngle = Math.PI / 4, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    const startAngle = cutAngle / 2;
    const endAngle = 2 * Math.PI - cutAngle / 2;
    ctx.arc(0, 0, outerR, startAngle, endAngle, false);
    ctx.arc(0, 0, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.restore();
  },

  // Export current canvas to PNG download
  exportPNG(canvas, filename = "wong-design-study.png") {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  },

  // Export as SVG
  exportSVG(svgString, filename = "wong-design-study.svg") {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
};
