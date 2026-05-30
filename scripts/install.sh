#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

VAULT_PATH="${1:-$HOME/Documents/Personal}"
VAULT_PATH="${VAULT_PATH/#\~/$HOME}"
PLUGIN_ID="slimd"
TARGET_DIR="$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID"

if [[ ! -d "$VAULT_PATH" ]]; then
  echo "Vault path does not exist: $VAULT_PATH" >&2
  exit 1
fi

if [[ ! -f "$PLUGIN_ROOT/main.js" || "$PLUGIN_ROOT/src/main.ts" -nt "$PLUGIN_ROOT/main.js" ]]; then
  echo "Building plugin..."
  (cd "$PLUGIN_ROOT" && npm run build)
fi

mkdir -p "$TARGET_DIR"
cp "$PLUGIN_ROOT/manifest.json" "$TARGET_DIR/manifest.json"
cp "$PLUGIN_ROOT/main.js" "$TARGET_DIR/main.js"
cp "$PLUGIN_ROOT/styles.css" "$TARGET_DIR/styles.css"

echo "Installed SliMD to: $TARGET_DIR"
echo "In Obsidian: Settings -> Community plugins -> Reload/Enable SliMD"
