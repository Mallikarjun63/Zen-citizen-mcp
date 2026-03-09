#!/usr/bin/env bash
set -euo pipefail
# deploy-with-env.sh — read .env and call `npm run deploy` with --env KEY=VAL flags
# Usage: ./scripts/deploy-with-env.sh
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
ENV_FILE=.env
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found in $ROOT_DIR"
  exit 1
fi
# Build --env args from .env lines of the form KEY=VALUE (ignore comments and blank lines)
args=()
while IFS= read -r line || [[ -n "$line" ]]; do
  # strip leading/trailing whitespace
  line="$(echo "$line" | sed -e 's/^\s*//' -e 's/\s*$//')"
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^# ]] && continue
  # skip lines that are not key=value
  if [[ "$line" != *=* ]]; then
    continue
  fi
  key="${line%%=*}"
  val="${line#*=}"
  # remove surrounding quotes from val if present
  if [[ "$val" =~ ^\".*\"$ || "$val" =~ ^\'.*\'$ ]]; then
    val="${val:1:${#val}-2}"
  fi
  # append as single --env argument
  args+=("--env" "${key}=${val}")
done < "$ENV_FILE"
if [[ ${#args[@]} -eq 0 ]]; then
  echo "No env vars found in $ENV_FILE"
  exit 1
fi
echo "Deploying with env vars from $ENV_FILE (keys: $(grep -Eo '^[^#=]+' $ENV_FILE | sed -e 's/\s*$//' | tr '\n' ' '))"
# Run deploy
npm run deploy -- "${args[@]}"
