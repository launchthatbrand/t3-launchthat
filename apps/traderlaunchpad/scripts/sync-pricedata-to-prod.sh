#!/usr/bin/env bash
set -euo pipefail

# Sync Convex pricedata tables (dev -> prod) for the TraderLaunchpad Convex project.
#
# Copies ONLY these tables inside the `launchthat_pricedata` component:
# - priceSources
# - priceInstruments
# - priceBarChunks
#
# Usage:
#   MODE=replace bash apps/traderlaunchpad/scripts/sync-pricedata-to-prod.sh
#   MODE=append  bash apps/traderlaunchpad/scripts/sync-pricedata-to-prod.sh
#
# Notes:
# - Requires Convex CLI auth/config for apps/traderlaunchpad.
# - `MODE=replace` will delete+replace each target table in PROD.

MODE="${MODE:-replace}" # replace | append

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"           # .../apps/traderlaunchpad
REPO_ROOT="$(cd "$APP_DIR/../.." && pwd)"         # repo root
TMP_DIR="$REPO_ROOT/.tmp/pricedata-sync-$(date +%s)"
EXPORT_ZIP="$TMP_DIR/traderlaunchpad-dev-export.zip"

mkdir -p "$TMP_DIR"

echo "[pricedata-sync] app dir: $APP_DIR"
echo "[pricedata-sync] tmp dir: $TMP_DIR"
echo "[pricedata-sync] exporting dev snapshot zip..."
pnpm -C "$APP_DIR" exec convex export --path "$EXPORT_ZIP"

echo "[pricedata-sync] extracting zip..."
unzip -q "$EXPORT_ZIP" -d "$TMP_DIR/unzip"

COMPONENT_NAME="launchthat_pricedata"
COMPONENT_DIR="$TMP_DIR/unzip/_components/$COMPONENT_NAME"

if [[ ! -d "$COMPONENT_DIR" ]]; then
  echo "[pricedata-sync] ERROR: expected component dir missing: $COMPONENT_DIR" >&2
  echo "[pricedata-sync] export contents:" >&2
  (cd "$TMP_DIR/unzip" && find . -maxdepth 3 -type d | sed 's|^./||') >&2
  exit 1
fi

TABLES=("priceSources" "priceInstruments" "priceBarChunks")

IMPORT_FLAG=""
case "$MODE" in
  replace) IMPORT_FLAG="--replace" ;;
  append) IMPORT_FLAG="--append" ;;
  *)
    echo "[pricedata-sync] ERROR: MODE must be replace|append (got: $MODE)" >&2
    exit 1
    ;;
esac

for table in "${TABLES[@]}"; do
  src="$COMPONENT_DIR/$table/documents.jsonl"
  if [[ ! -f "$src" ]]; then
    echo "[pricedata-sync] ERROR: missing export file for table '$table': $src" >&2
    exit 1
  fi

  lines="$(wc -l < "$src" | tr -d ' ')"
  echo "[pricedata-sync] importing $table ($lines docs) into PROD..."

  pnpm -C "$APP_DIR" exec convex import \
    --prod \
    --yes \
    $IMPORT_FLAG \
    --format jsonLines \
    --component "$COMPONENT_NAME" \
    --table "$table" \
    "$src"
done

echo "[pricedata-sync] done."

