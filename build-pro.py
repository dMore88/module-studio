#!/usr/bin/env python3
"""
Zero-dependency bundler for Module Studio.
Concatenates ES modules into a clean standalone js/bundle-pro.js that runs
flawlessly on both http:// and file:/// protocols.

Usage:
  python3 build-pro.py          rebuild js/bundle-pro.js and stamp index.html
  python3 build-pro.py --check  only verify the bundle is up to date (exit 1 if not)

The script tag in index.html carries ?v=<hash of the bundle>, so browsers never
serve a stale copy after a rebuild.
"""
import re
import os
import sys
import hashlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def strip_es6_modules(content):
    # Remove imports (single-line and multi-line)
    content = re.sub(r'import\s+[\s\S]*?from\s+[\'"][^\'"]+[\'"];?', '', content)
    content = re.sub(r'import\s+[\'"][^\'"]+[\'"];?', '', content)
    # Remove export default
    content = re.sub(r'^\s*export\s+default\s+', '', content, flags=re.MULTILINE)
    # Remove export keyword before const, let, var, class, function
    content = re.sub(r'^\s*export\s+(const|let|var|class|function|async function)\s+', r'\1 ', content, flags=re.MULTILINE)
    # Remove standalone export { ... }
    content = re.sub(r'^\s*export\s*\{[\s\S]*?\}\s*;?', '', content, flags=re.MULTILINE)
    return content

# The areas of the app (js/studio/app/*.js): classes whose methods studio-pro-app.js adds to StudioProApp. They go in the bundle before it.
APP_PARTS = tuple((name, 'studio/app/' + name + '.js') for name in (
    'ui-helpers', 'panel-builder', 'layers-panel', 'art-log', 'controls-rail', 'panel-layout', 'panel-similarity', 'accessibility', 'panel-gradation', 'panel-anomaly',
    'panel-contrast', 'panel-concentration', 'panel-space', 'panel-texture', 'module-editor'))

def read_sources():
    js_dir = os.path.join(BASE_DIR, 'js')
    parts = {}
    for key, rel in (('utils', 'canvas-utils.js'), ('shapes', 'studio/shapes.js'), ('booleans', 'studio/booleans.js'), ('engine', 'studio/studio-engine.js'),
                     ('exporter', 'studio/exporter.js'), *APP_PARTS, ('app', 'studio/studio-pro-app.js')):
        with open(os.path.join(js_dir, rel)) as f:
            parts[key] = strip_es6_modules(f.read())
    return parts

def make_bundle():
    p = read_sources()
    APP_PARTS_JS = '\n\n  '.join(p[name] for name, _ in APP_PARTS)
    return f"""// Standalone self-contained script for Module Studio
// Runs on both http:// (web server) and file:/// (local direct open)
(function() {{
  'use strict';

  {p['utils']}

  {p['shapes']}

  {p['booleans']}

  {p['engine']}

  {p['exporter']}

  {APP_PARTS_JS}

  {p['app']}

  if (typeof window !== 'undefined') {{
    window.StudioEngine = StudioEngine;
    window.StudioProApp = StudioProApp;
    window.CanvasUtils = CanvasUtils;
    window.Shapes = Shapes;
    window.regionBoolean = regionBoolean;
    window.regionArea = regionArea;
    window.inRegion = inRegion;
    window.StudioExporter = StudioExporter;
  }}
}})();
"""

def stamp(bundle):
    """Return index.html with the bundle's version in the script tag."""
    version = hashlib.sha256(bundle.encode()).hexdigest()[:8]
    with open(os.path.join(BASE_DIR, 'index.html')) as f:
        html = f.read()
    return re.sub(r'js/bundle-pro\.js(\?v=[0-9a-f]+)?', f'js/bundle-pro.js?v={version}', html)

def build(check=False):
    bundle = make_bundle()
    bundle_path = os.path.join(BASE_DIR, 'js', 'bundle-pro.js')
    index_path = os.path.join(BASE_DIR, 'index.html')
    html = stamp(bundle)

    if check:
        current = open(bundle_path).read() if os.path.exists(bundle_path) else ''
        current_html = open(index_path).read()
        if current != bundle or current_html != html:
            print("js/bundle-pro.js (or the version in index.html) is out of date. Run: python3 build-pro.py")
            return 1
        print("Bundle is up to date.")
        return 0

    with open(bundle_path, 'w') as f:
        f.write(bundle)
    with open(index_path, 'w') as f:
        f.write(html)
    print(f"Built {bundle_path} successfully ({len(bundle):,} bytes)")
    return 0

if __name__ == '__main__':
    sys.exit(build(check='--check' in sys.argv))
