#!/usr/bin/env python3
"""
Zero-dependency bundler for Module Studio.
Concatenates ES modules into a clean standalone js/bundle-pro.js that runs
flawlessly on both http:// and file:/// protocols.
"""
import re
import os

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

def build():
    js_dir = os.path.join(BASE_DIR, 'js')
    
    with open(os.path.join(js_dir, 'canvas-utils.js')) as f:
        c_utils = strip_es6_modules(f.read())

    with open(os.path.join(js_dir, 'studio', 'shapes.js')) as f:
        c_shapes = strip_es6_modules(f.read())

    with open(os.path.join(js_dir, 'studio', 'studio-engine.js')) as f:
        c_engine = strip_es6_modules(f.read())

    with open(os.path.join(js_dir, 'studio', 'exporter.js')) as f:
        c_exporter = strip_es6_modules(f.read())

    with open(os.path.join(js_dir, 'studio', 'studio-pro-app.js')) as f:
        c_app = strip_es6_modules(f.read())

    bundle = f"""// Standalone self-contained script for Module Studio
// Runs on both http:// (web server) and file:/// (local direct open)
(function() {{
  'use strict';

  {c_utils}

  {c_shapes}

  {c_engine}

  {c_exporter}

  {c_app}

  if (typeof window !== 'undefined') {{
    window.StudioEngine = StudioEngine;
    window.StudioProApp = StudioProApp;
    window.CanvasUtils = CanvasUtils;
    window.Shapes = Shapes;
    window.StudioExporter = StudioExporter;
  }}
}})();
"""

    bundle_path = os.path.join(js_dir, 'bundle-pro.js')
    with open(bundle_path, 'w') as f:
        f.write(bundle)

    print(f"Built {bundle_path} successfully ({len(bundle):,} bytes)")

if __name__ == '__main__':
    build()
