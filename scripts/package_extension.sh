#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required" >&2
  exit 1
fi
if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required" >&2
  exit 1
fi

VERSION="$(python3 - <<'PY'
import json
from pathlib import Path
manifest = json.loads(Path('manifest.json').read_text(encoding='utf-8'))
print(manifest.get('version', '0.0.0'))
PY
)"

OUT_DIR="$ROOT/dist"
STAGE_DIR="$OUT_DIR/package"
ZIP_PATH="$OUT_DIR/atlas-proxy-pro-cws-${VERSION}.zip"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR" "$OUT_DIR"

copy_path() {
  local rel="$1"
  if [ -e "$ROOT/$rel" ]; then
    mkdir -p "$STAGE_DIR/$(dirname "$rel")"
    cp -R "$ROOT/$rel" "$STAGE_DIR/$rel"
  else
    echo "Missing required path: $rel" >&2
    exit 1
  fi
}

RUNTIME_FILES=(
  manifest.json
  background.js
  popup.html
  popup.js
  popup.css
  options.html
  options.js
  options.css
  options-diagnostics.js
  report.html
  report.js
  report.css
  theme-boot.js
  LICENSE
  README.md
  PRIVACY.md
)

RUNTIME_DIRS=(
  _locales
  icons
  content-scripts
)

for file in "${RUNTIME_FILES[@]}"; do
  copy_path "$file"
done

for dir in "${RUNTIME_DIRS[@]}"; do
  copy_path "$dir"
done

rm -f "$ZIP_PATH"
(
  cd "$STAGE_DIR"
  zip -qr "$ZIP_PATH" .
)

echo "Packaged: $ZIP_PATH"
echo "Contents staged at: $STAGE_DIR"
