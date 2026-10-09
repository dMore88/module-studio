/**
 * The Layout panel (Repetition and Radiation), described as data (see panel-builder.js). The two modes are two regions of the panel; each is
 * a list of groups (Grid or Radiation, Lines, Rhythm, Module) with its Advanced controls. The Composition container and the Module
 * rotation are shared by both modes: they are floating groups that `place` moves (the container before the Module group, the rotation at its end).
 * Here the controls write each in its own way (the settings live in repetition, radiation, formalStructure and block), so most carry
 * their own `get` and `set`.
 * These methods are added to StudioProApp (see studio-pro-app.js); build-pro.py puts this file in the bundle before it.
 */
const GRID_ICONS = [
      ["basic", "Grid", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M8 2v18M14 2v18M2 8h18M2 14h18\"/></svg>"],
      ["curved", "Curved", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M2 5q4.5-3 9 0t9 0M2 11q4.5-3 9 0t9 0M2 17q4.5-3 9 0t9 0\"/></svg>"],
      ["sliding", "Brick", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M2 8h18M2 14h18M8 2v6M14 8v6M8 14v6\"/></svg>"],
      ["sheared", "Diagonal", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M2 10L10 2M2 18L18 2M6 20L20 6M14 20l6-6\"/></svg>"],
      ["zigzag", "Zigzag", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M2 5l4.5 3 4.5-3 4.5 3 4.5-3M2 11l4.5 3 4.5-3 4.5 3 4.5-3M2 17l4.5 3 4.5-3 4.5 3 4.5-3\"/></svg>"],
      ["triangular", "Triangular", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M11 3l8 14H3zM7 10h8\"/></svg>"],
      ["alternating", "Alternating", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><rect x=\"2\" y=\"2\" width=\"18\" height=\"18\"/><path d=\"M11 2v18M2 11h18\"/><path d=\"M2 2h9v9H2zM11 11h9v9h-9z\" fill=\"currentColor\" stroke=\"none\"/></svg>"],
      ["hexagonal", "Hexagonal", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"M11 2l7.5 4.3v8.6L11 19.2 3.5 14.9V6.3z\"/></svg>"],
      ["free", "Free", "<svg class=\"ds-icon-grid\" viewBox=\"0 0 22 22\" fill=\"currentColor\" stroke=\"none\" aria-hidden=\"true\"><circle cx=\"5\" cy=\"6\" r=\"1.8\"/><circle cx=\"14\" cy=\"4\" r=\"1.8\"/><circle cx=\"9\" cy=\"12\" r=\"1.8\"/><circle cx=\"18\" cy=\"11\" r=\"1.8\"/><circle cx=\"4\" cy=\"18\" r=\"1.8\"/><circle cx=\"14\" cy=\"18\" r=\"1.8\"/></svg>"]
];
const LAYOUT_ISRAD = (st) => st.mode === "radiation";
const LAYOUT_ACTUAL = (o) => !!o && (o.sizeMode === "actual" || o.sizeMode === "fixed");
// The settings of the Rhythm group (created when the layer has none yet)
const LAYOUT_FORMAL = (st) => (st.formalStructure ||= { enabled: false, colRatio: 1, rowRatio: 1, showGridLines: false });
const layoutClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// A setting of the Repetition (or Radiation) settings; editing it puts the layout in that mode
const repSet = (key, fix) => (st, v) => { st.repetition[key] = fix ? fix(v) : v; st.mode = "repetition"; };
const radSet = (key, fix) => (st, v) => { st.radiation[key] = fix ? fix(v) : v; st.mode = "radiation"; };
// Rhythm: any edit turns the formal structure and the layout on, and leaves Radiation
const formalSet = (key, fix) => (st, v) => {
  const f = LAYOUT_FORMAL(st);
  f[key] = fix(v); f.enabled = true; st.enabled = true;
  if (st.mode === "radiation") st.mode = "repetition";
};
const blockSet = (key) => (st, v, app) => {
  const cfg = ASPECT_RATIOS[app.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
  st.block = { x: 50, y: 50, w: 100, h: 100, ...(st.block || {}) };
  const along = key === "x" || key === "w" ? cfg.w : cfg.h;
  if (key === "w" || key === "h") st.block[key] = (Math.max(10, v) / along) * 100;
  else st.block[key] = 50 + (v / along) * 100;
};
const blockGet = (key) => (st, app) => app.blockPixels(st)[key];

// Module size: one choice that joins sizeMode (fit / actual) and moduleScale (uniform / cell); the saved project keeps both fields
const SIZE_OPTIONS = (whole) => [
  ["uniform", "Base size", `Every module keeps its own size, proportional to ${whole}`],
  ["cell", "Shrink with cell", "The module shrinks with its cell"],
  ["actual", "Actual size", "The module keeps its real size and the grid adapts to it"],
];
const sizeChoice = (r) => (r.sizeMode === "actual" ? "actual" : r.moduleScale || "uniform");
const applySizeChoice = (r, v) => { if (v === "actual") r.sizeMode = "actual"; else { r.sizeMode = "fit"; r.moduleScale = v; } };

const LAYOUT_PANEL = {
  id: "layout", cardId: "card-layout-structure", name: "Layout",
  state: (app) => app.getActiveLayerStructure(),
  // the layout switch does not turn on by editing; turning it off also turns off the Rhythm
  enabled: { id: "toggle-layout-structure", key: "enabled", auto: false,
    onToggle: (app, st, on) => {
      st.enabled = on;
      if (!on && st.formalStructure) st.formalStructure.enabled = false;
      app.syncAllInspectorsWithActiveLayer(); // every collective modifier shows or hides its "turn on Layout" notice
      app.render();
      app.updateLayerCardsUI();
      app.pushHistory(`Layer ${app.activeLayerId} Layout Structure: ${on ? "ON" : "OFF"}`);
    } },
  badgeId: "badge-layout-layer",
  help: {
    is: "A structure is the skeleton that organizes modules in a design: it gives each module its place and sets the rhythm between them.",
    does: "Turns the single module into a whole composition. Repetition lays modules in a grid; Radiation arranges them around a center." },
  syncAll: true,
  allowNoModule: true,
  top: [
    { type: "modes", label: "Structure mode", attr: "data-layout-mode", get: (st) => (LAYOUT_ISRAD(st) ? "radiation" : "repetition"),
      options: [["repetition", "Repetition", "btn-layout-repetition"], ["radiation", "Radiation", "btn-layout-radiation"]],
      onSelect: (app, mode) => {
        const st = app.getActiveLayerStructure();
        if (!st) return;
        st.mode = mode;
        st.enabled = true;
        if (mode === "radiation" && st.formalStructure) st.formalStructure.enabled = false;
        app.syncAllInspectorsWithActiveLayer();
        app.render();
        app.updateLayerCardsUI();
        app.pushHistory(`Layer ${app.activeLayerId} Layout Mode: ${mode}`);
      } },
  ],
  regions: { "subpanel-repetition": (st) => !LAYOUT_ISRAD(st), "subpanel-radiation": (st) => LAYOUT_ISRAD(st) },
  // Grid, lines, rhythm and the Composition container come first (they shape the grid); the Module group comes last, with the Module rotation at its end
  place: (app, st) => {
    const rad = LAYOUT_ISRAD(st);
    const modAdv = document.getElementById(rad ? "rad-adv-module" : "rep-adv-module");
    const rotEl = document.getElementById("layout-module-rotation"), blockEl = document.getElementById("layout-block");
    const region = document.getElementById(rad ? "subpanel-radiation" : "subpanel-repetition");
    // the rotation closes the visible controls of the Module group (before its Advanced accordion, if it has one)
    if (rotEl && region) { if (modAdv) { if (modAdv.previousElementSibling !== rotEl) modAdv.parentNode.insertBefore(rotEl, modAdv); } else if (region.lastElementChild !== rotEl) region.appendChild(rotEl); }
    const titles = region ? [...region.querySelectorAll(".ds-label--overline")] : [];
    const modTitle = titles.find(el => el.textContent.trim() === "Module");
    const anchor = modTitle && (modTitle.closest(".ds-title-row") || modTitle).previousElementSibling; // the divider above the Module title
    if (blockEl && anchor && anchor.previousElementSibling !== blockEl) anchor.parentNode.insertBefore(blockEl, anchor);
  },
  groups: [
    // ---- Repetition ----
    { region: "subpanel-repetition", title: "Grid", help: {
        is: "A repetition structure divides the surface into equal cells, each holding a module. Its variations bend or shift the grid lines without losing the repetition.",
        does: "Variation picks the type of grid; Columns and Rows set how many cells divide the canvas. Advanced controls reflect the grid or alternate its direction." }, advId: "rep-adv-grid", controls: [
      { type: "dropdown", label: "Grid structure variation", attr: "data-grid-var", history: "Grid Var", options: GRID_ICONS,
        get: (st) => st.repetition.gridType,
        set: (st, v) => { st.repetition.gridType = v; st.mode = "repetition"; st.enabled = true; } },
      // Parameter of the chosen variation: Brick = row offset, Diagonal = shear angle, Curved / Zigzag = wave amount, Free = seed
      { type: "slider", id: "layout-param", label: "Row offset", labelId: "rep-param-label", blockId: "rep-param-block", min: 0, max: 100, step: 1, value: 50, suffix: "%", decimal: true,
        show: (st) => !!StudioProApp.REPETITION_PARAMS[st.repetition.gridType],
        meta: (st) => { const p = StudioProApp.REPETITION_PARAMS[st.repetition.gridType]; return p ? { label: p.label, min: p.min, max: p.max, step: p.step, suffix: p.suffix, history: p.label } : null; },
        get: (st) => {
          const r = st.repetition, p = StudioProApp.REPETITION_PARAMS[r.gridType];
          if (!p) return 0;
          // A project saved in pixels (curveIntensity) is shown as a share of the cell width, without touching the file
          const legacy = p.key === "curveAmount" && r.curveAmount === undefined && r.curveIntensity !== undefined;
          return p.toUi(legacy ? Math.min(1, (r.curveIntensity || 0) / (600 / Math.max(1, r.cols || 4))) : (r[p.key] ?? 0));
        },
        set: (st, v) => { const r = st.repetition, p = StudioProApp.REPETITION_PARAMS[r.gridType]; if (!p) return; r[p.key] = p.fromUi(layoutClamp(v, p.min, p.max)); st.mode = "repetition"; } },
      { type: "slider", id: "layout-cols", label: "Columns", min: 1, max: 100, step: 1, value: 4, suffix: "", decimal: true, history: "Columns", get: (st) => st.repetition.cols || 4, set: repSet("cols") },
      { type: "slider", id: "layout-rows", label: "Rows", min: 1, max: 100, step: 1, value: 4, suffix: "", decimal: true, history: "Rows", get: (st) => st.repetition.rows || 4, set: repSet("rows") },
      { type: "dropdown", label: "Reflection", attr: "data-rep-reflect", history: "Reflection", advanced: true, options: [["none", "None"], ["columns", "Columns"], ["rows", "Rows"], ["both", "Both"]],
        get: (st) => st.repetition.reflection || "none", set: repSet("reflection") },
      { type: "dropdown", label: "Direction", attr: "data-rep-dir", history: "Direction", advanced: true, options: [["repeated", "Repeated"], ["alternated", "Alternated"], ["undefined", "Undefined"]],
        get: (st) => st.repetition.direction || "repeated", set: repSet("direction") },
      { type: "toggle", id: "chk-rep-clip", label: "Clip cell", history: "Clip cell", advanced: true, get: (st) => !!st.repetition.activeClipping, set: (st, v) => { st.repetition.activeClipping = v; } },
      { type: "toggle", id: "chk-rep-checker", label: "Checkerboard inversion", history: "Checkerboard", advanced: true, get: (st) => !!st.repetition.checkerInvert, set: (st, v) => { st.repetition.checkerInvert = v; } },
    ] },
    { region: "subpanel-repetition", title: "Lines", help: {
        is: "The lines of a structure are its skeleton made visible: they show how the surface is divided.",
        does: "Visible lines draws them as part of the design (they are exported). Direction, spacing, width and color shape how they look." }, controls: [
      { type: "toggle", id: "chk-rep-gridlines", label: "Visible lines", history: "Visible lines", get: (st) => !!st.repetition.showGridLines,
        set: (st, v) => { st.repetition.showGridLines = v; if (st.formalStructure) st.formalStructure.showGridLines = v; } },
      // Visible lines are part of the design: they have colour and width and are exported
      { type: "stack", id: "rep-lines-block", show: (st) => !!st.repetition.showGridLines, controls: [
        { type: "hint", text: "Lines are part of the design and are exported." },
        { type: "dropdown", label: "Line direction", attr: "data-rep-linedir", history: "Line Direction", options: [["both", "Both"], ["horizontal", "Horizontal"], ["vertical", "Vertical"]],
          get: (st) => st.repetition.lineDirection || "both", set: repSet("lineDirection") },
        { type: "dropdown", label: "Line spacing", attr: "data-rep-linespace", history: "Line Spacing", options: [["all", "All lines"], ["alternate", "Every other"]],
          get: (st) => st.repetition.lineSpacing || "all", set: repSet("lineSpacing") },
        { type: "slider", id: "layout-linewidth", label: "Line width", blockId: "rep-linewidth-block", min: 0.5, max: 10, step: 0.5, value: 1.5, suffix: "px", decimal: true, history: "Grid Line Width",
          get: (st) => st.repetition.gridLineWidth ?? 1.5, set: (st, v) => { st.repetition.gridLineWidth = layoutClamp(v, 0.5, 10); } },
        { type: "color", prefix: "repline", label: "Line color", history: "Line Color",
          get: (st, app, mod) => st.repetition.lineColor || mod?.color || "#18181f", set: (st, v) => { st.repetition.lineColor = v; } },
      ] },
    ] },
    { region: "subpanel-repetition", title: "Rhythm", help: {
        is: "Rhythm comes from changes in the size of the cells: equal cells give an even beat; cells that grow or shrink give movement.",
        does: "Col B and Row B resize every second column or row as a share of the first; the gradations make columns and rows grow or shrink step by step." }, controls: [
      { type: "slider", id: "struct-col-ratio", label: "Col B size [% of A]", min: 10, max: 100, step: 5, value: 100, suffix: "%", decimal: true, history: "Col Ratio",
        get: (st) => Math.round(100 / (LAYOUT_FORMAL(st).colRatio || 1)), set: formalSet("colRatio", (v) => layoutClamp(100 / Math.max(10, v), 1, 10)) },
      { type: "slider", id: "struct-row-ratio", label: "Row B size [% of A]", min: 10, max: 100, step: 5, value: 100, suffix: "%", decimal: true, history: "Row Ratio",
        get: (st) => Math.round(100 / (LAYOUT_FORMAL(st).rowRatio || 1)), set: formalSet("rowRatio", (v) => layoutClamp(100 / Math.max(10, v), 1, 10)) },
      { type: "slider", id: "struct-col-grade", label: "Col gradation", min: -30, max: 30, step: 1, value: 0, suffix: "%", decimal: true, history: "Col Gradation",
        get: (st) => LAYOUT_FORMAL(st).colGrade || 0, set: formalSet("colGrade", (v) => layoutClamp(v, -30, 30)) },
      { type: "slider", id: "struct-row-grade", label: "Row gradation", min: -30, max: 30, step: 1, value: 0, suffix: "%", decimal: true, history: "Row Gradation",
        get: (st) => LAYOUT_FORMAL(st).rowGrade || 0, set: formalSet("rowGrade", (v) => layoutClamp(v, -30, 30)) },
    ] },
    { region: "subpanel-repetition", title: "Module", help: {
        is: "The module is the unit that repeats. Its size, its place in the cell and how it turns decide how the structure reads.",
        does: "Size sets how big the module is in its cell (its own size, shrunk with the cell, or its real size); placement sets where it sits and Module rotation how it turns." }, advId: "rep-adv-module", controls: [
      { type: "tags", label: "Module size", attr: "data-rep-size", history: "Module Size", help: { is: "The size of the module inside its cell. It is a choice of three: the module keeps its own size, shrinks with its cell, or keeps its real size and the grid adapts to it.",
        does: "Base size repeats the module at one size in every cell. Shrink with cell makes it follow its cell. Actual size repeats the module as it is, and the grid grows around it." },
        options: SIZE_OPTIONS("the whole canvas"),
        get: (st) => sizeChoice(st.repetition),
        set: (st, v, app) => { applySizeChoice(st.repetition, v); if (v === "actual") app.startContainerFromCell(st.repetition.cols, st.repetition.rows); st.mode = "repetition"; } },
      // Placement does not apply to the honeycomb; mixed sizes only to the plain and alternating grids
      { type: "tags", label: "Module placement", attr: "data-rep-place", history: "Module Placement", blockId: "rep-placement-block", enable: (st) => !["hexagonal", "free"].includes(st.repetition.gridType), why: "Does not apply to the hexagonal grid or to Free",
        options: [["centers", "Centers"], ["intersections", "Intersections"], ["both", "Both"]], get: (st) => st.repetition.placement || "centers", set: repSet("placement") },
      { type: "tags", label: "Cell mix", attr: "data-rep-mix", history: "Cell Mix", blockId: "rep-mix-block", enable: (st) => st.repetition.gridType === "basic" || st.repetition.gridType === "alternating", why: "Only with the Grid and Alternating variations",
        options: [["none", "None"], ["merge", "Merged"], ["divide", "Divided"]], get: (st) => st.repetition.cellMix || "none", set: repSet("cellMix") },
      { type: "slider", id: "layout-inter", label: "Intersection size", blockId: "rep-inter-block", min: 10, max: 100, step: 5, value: 50, suffix: "%", decimal: true, history: "Intersection Size",
        show: (st) => !["hexagonal", "free"].includes(st.repetition.gridType) && (st.repetition.placement || "centers") !== "centers",
        get: (st) => st.repetition.interScale ?? 50, set: repSet("interScale", (v) => layoutClamp(v, 10, 100)) },
    ] },
    // ---- Radiation ----
    { region: "subpanel-radiation", title: "Radiation", help: {
        is: "In a radiation structure the modules spread from, or gather around, a center, along rays and rings.",
        does: "The scheme chooses the movement (outward, inward, concentric, spiral or several centers); rays and rings set how many modules there are. Advanced controls shape the rings and turn them." }, advId: "rad-adv-radiation", controls: [
      { type: "dropdown", label: "Radiation scheme", attr: "data-rad-scheme", history: "Rad Scheme", get: (st) => st.radiation.scheme,
        options: [["centrifugal", "Centrifugal"], ["centripetal", "Centripetal"], ["concentric", "Concentric"], ["spiral", "Spiral"], ["multi_center", "Multi-center"]],
        set: (st, v) => { st.radiation.scheme = v; st.mode = "radiation"; st.enabled = true; } },
      // Actual size can let every ring take as many rays as fit the container's width; then the slider has no meaning
      { type: "slider", id: "layout-rays", label: "Angular rays", blockId: "rad-rays-block", min: 3, max: 60, step: 1, value: 12, suffix: "", decimal: true, history: "Angular Rays",
        enable: (st) => !(LAYOUT_ACTUAL(st.radiation) && !!st.radiation.raysByContainer && st.radiation.scheme !== "centripetal"), why: "The container decides the rays",
        get: (st) => st.radiation.rays || 12, set: radSet("rays") },
      { type: "slider", id: "layout-rings", label: "Concentric rings", min: 2, max: 20, step: 1, value: 6, suffix: "", decimal: true, history: "Concentric Rings", get: (st) => st.radiation.rings || 6, set: radSet("rings") },
      { type: "slider", id: "layout-centers", label: "Centers", blockId: "rad-centers-block", min: 2, max: 8, step: 1, value: 2, suffix: "", decimal: true, history: "Centers", show: (st) => st.radiation.scheme === "multi_center",
        get: (st) => st.radiation.centerCount || 2, set: (st, v) => { st.radiation.centerCount = layoutClamp(Math.round(v), 2, 8); st.mode = "radiation"; } },
      { type: "slider", id: "layout-twist", label: "Spiral twist", blockId: "rad-twist-block", show: (st) => st.radiation.scheme === "spiral", min: -180, max: 180, step: 1, value: 45, suffix: "", decimal: true, history: "Spiral Twist",
        get: (st) => (st.radiation.spiralTwist !== undefined ? st.radiation.spiralTwist : 45), set: radSet("spiralTwist") },
      { type: "dropdown", label: "Direction", attr: "data-rad-dir", history: "Radiation Direction", advanced: true, options: [["repeated", "Repeated"], ["alternated", "Alternated"], ["undefined", "Undefined"]],
        get: (st) => st.radiation.direction || "repeated", set: radSet("direction") },
      // Polygonal rings do not apply to spirals or chevrons
      { type: "dropdown", label: "Ring shape", attr: "data-rad-shape", history: "Ring Shape", advanced: true, blockId: "rad-ringshape-block", enable: (st) => st.radiation.scheme !== "spiral" && st.radiation.scheme !== "centripetal", why: "Does not apply to Spiral or Centripetal",
        options: [["circle", "Circle"], ["triangle", "Triangle"], ["square", "Square"], ["pentagon", "Pentagon"], ["hexagon", "Hexagon"], ["octagon", "Octagon"]],
        get: (st) => st.radiation.ringShape || "circle", set: radSet("ringShape") },
      { type: "slider", id: "layout-open", label: "Open center", min: 0, max: 90, step: 1, value: 0, suffix: "%", decimal: true, history: "Open Center", advanced: true, get: (st) => st.radiation.centerOpen || 0, set: radSet("centerOpen") },
      { type: "slider", id: "layout-ringrot", label: "Ring rotation", min: -90, max: 90, step: 1, value: 0, suffix: "º", decimal: true, history: "Ring Rotation", advanced: true, get: (st) => st.radiation.ringRotation || 0, set: radSet("ringRotation") },
      { type: "toggle", id: "chk-rad-raysbycont", label: "Rays follow container", history: "Rays follow container", advanced: true, labelId: "rad-raysbycont-item",
        title: "Actual size: every ring gets as many rays as fit the container's width, so the cells are as big as the container",
        enable: (st) => LAYOUT_ACTUAL(st.radiation) && st.radiation.scheme !== "centripetal", why: "Only in Actual size, and not with Centripetal", get: (st) => !!st.radiation.raysByContainer, set: (st, v) => { st.radiation.raysByContainer = v; } },
      { type: "toggle", id: "chk-rad-clip", label: "Clip cell", history: "Clip cell", advanced: true, get: (st) => !!st.radiation.activeClipping, set: (st, v) => { st.radiation.activeClipping = v; } },
      { type: "toggle", id: "chk-rad-checker", label: "Checkerboard inversion", history: "Checkerboard", advanced: true, get: (st) => !!st.radiation.checkerInvert, set: (st, v) => { st.radiation.checkerInvert = v; } },
    ] },
    { region: "subpanel-radiation", title: "Lines", help: {
        is: "The lines of a radiation are its rays and rings made visible.",
        does: "Visible lines draws them as part of the design (they are exported); width and color shape how they look." }, controls: [
      { type: "toggle", id: "chk-rad-gridlines", label: "Visible lines", history: "Visible lines", get: (st) => !!(st.radiation.showRays || st.radiation.showRings),
        set: (st, v) => { st.radiation.showRays = v; st.radiation.showRings = v; } },
      { type: "stack", id: "rad-lines-block", show: (st) => !!(st.radiation.showRays || st.radiation.showRings), controls: [
        { type: "hint", text: "Lines are part of the design and are exported." },
        { type: "slider", id: "layout-radline", label: "Line width", blockId: "rad-linewidth-block", min: 0.5, max: 10, step: 0.5, value: 1, suffix: "px", decimal: true, history: "Radiation Line Width",
          get: (st) => st.radiation.lineWidth ?? 1, set: (st, v) => { st.radiation.lineWidth = layoutClamp(v, 0.5, 10); } },
        { type: "color", prefix: "radline", label: "Line color", history: "Radiation Line Color",
          get: (st, app, mod) => st.radiation.lineColor || mod?.color || "#18181f", set: (st, v) => { st.radiation.lineColor = v; } },
      ] },
    ] },
    { region: "subpanel-radiation", title: "Module", help: {
        is: "The module is the unit that repeats. In a radiation its size and turn decide how it follows the rays and rings.",
        does: "Size sets how big each module is (its own size, shrunk with the cell, or its real size). Module orientation turns it along the rays." }, advId: "rad-adv-module", controls: [
      { type: "tags", label: "Module size", attr: "data-rad-size", history: "Radiation Module Size", help: { is: "The size of the module inside its cell. It is a choice of three: the module keeps its own size, shrinks with its cell, or keeps its real size and the grid adapts to it.",
        does: "Base size repeats the module at one size in every cell. Shrink with cell makes it follow its cell. Actual size repeats the module as it is, and the grid grows around it." },
        options: SIZE_OPTIONS("the whole structure"),
        get: (st) => sizeChoice(st.radiation),
        set: (st, v, app) => {
          applySizeChoice(st.radiation, v);
          if (v === "actual") {
            // each ring starts as thick as a Fit ring
            const mod = app.getActiveModule();
            if (mod && !(mod.containerW > 0 || mod.containerH > 0)) {
              const cfg = ASPECT_RATIOS[app.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
              mod.containerH = mod.containerW = Math.round((0.5 * Math.min(cfg.w, cfg.h)) / Math.max(2, st.radiation.rings));
            }
          }
          st.mode = "radiation";
        } },
      { type: "dropdown", label: "Module orientation", attr: "data-rad-orient", history: "Module Orientation", advanced: true,
        options: [["auto", "Auto"], ["outward", "Outward"], ["inward", "Inward"], ["tangent", "Tangent"], ["fixed", "Fixed"]], get: (st) => st.radiation.orientation || "auto", set: radSet("orientation") },
    ] },
    // ---- Shared by both modes (placed after the Module group of the active mode) ----
    { floating: "layout-module-rotation", controls: [
      // the Module rotation is controlled with the rest of the module (the shape inspector)
      { type: "slider", id: "active-rotation", label: "Module rotation", min: 0, max: 360, step: 0.5, value: 0, suffix: "º", decimal: true, bind: false },
    ] },
    { floating: "layout-block", title: "Composition container", help: {
        is: "A composition container is the sheet the structure lives in: whatever lies beyond its edge is cut.",
        does: "Sets its width and height and moves it from the center of the canvas, in px." }, controls: [
      // the container's size and offset, in px of the canvas; the project keeps percentages so it follows the canvas if its proportion changes
      { type: "stack", id: "block-size-fields", controls: [
        { type: "slider", id: "block-w", label: "Composition container width", min: 10, max: 2000, step: 1, value: 600, suffix: "px", decimal: true, history: "Container Width", get: blockGet("w"), set: blockSet("w") },
        { type: "slider", id: "block-h", label: "Composition container height", min: 10, max: 2000, step: 1, value: 600, suffix: "px", decimal: true, history: "Container Height", get: blockGet("h"), set: blockSet("h") },
      ] },
      { type: "slider", id: "block-x", label: "Composition container offset X", min: -1000, max: 1000, step: 1, value: 0, suffix: "px", decimal: true, history: "Container Offset X", get: blockGet("x"), set: blockSet("x") },
      { type: "slider", id: "block-y", label: "Composition container offset Y", min: -1000, max: 1000, step: 1, value: 0, suffix: "px", decimal: true, history: "Container Offset Y", get: blockGet("y"), set: blockSet("y") },
    ] },
  ],
};

class PanelLayout {
  // Parameter each grid variation exposes (stored value <-> shown value)
  static get REPETITION_PARAMS() {
    return {
      sliding: { label: "Row offset", key: "slideOffset", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      sheared: { label: "Shear angle", key: "shearAngle", min: 0, max: 45, step: 1, suffix: "º", toUi: v => v, fromUi: v => v },
      curved: { label: "Wave amount", key: "curveAmount", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      zigzag: { label: "Wave amount", key: "curveAmount", min: 0, max: 100, step: 1, suffix: "%", toUi: v => Math.round(v * 100), fromUi: v => v / 100 },
      free: { label: "Seed", key: "freeSeed", min: 1, max: 99, step: 1, suffix: "", toUi: v => v, fromUi: v => v }
    };
  }

  // Switching to Actual size with the default container: the container starts as big as a Fit cell,
  // so the structure keeps its rhythm. A container that was already set is left alone.
  startContainerFromCell(cols, rows) {
    const mod = this.getActiveModule();
    if (!mod || mod.containerW > 0 || mod.containerH > 0) return; // only the old "whole canvas" container (0) starts from the cell
    const cfg = ASPECT_RATIOS[this.state.aspectRatio || "1:1"] || ASPECT_RATIOS["1:1"];
    mod.containerW = Math.round(cfg.w / Math.max(1, cols));
    mod.containerH = Math.round(cfg.h / Math.max(1, rows));
  }

  syncStructureInspectorWithActiveLayer() { this.syncDataPanel(LAYOUT_PANEL); }

  setupLayoutStructure() { this.bindDataPanel(LAYOUT_PANEL); }
}
