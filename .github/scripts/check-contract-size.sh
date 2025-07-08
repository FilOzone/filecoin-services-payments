#!/usr/bin/env bash
# 
# This script checks if any Solidity contract/library in the `src/` folder
# exceeds the EIP-170 contract runtime size limit (24,576 bytes).
# Intended for use in CI (e.g., GitHub Actions) with Foundry.
# Exits 1 and prints the list of exceeding contracts if violations are found.
# NOTE: This script requires Bash (not sh or dash) due to use of mapfile and [[ ... ]].

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo >&2 "jq is required but not installed."; exit 1; }
command -v forge >/dev/null 2>&1 || { echo >&2 "forge is required but not installed."; exit 1; }

# Gather contract and library names from src/
# Only matches [A-Za-z0-9_] in contract/library names (no special characters)
if [[ -d src/ ]]; then
    mapfile -t contracts < <(grep -rE '^(contract|library) ' src/ 2>/dev/null | sed -E 's/.*(contract|library) ([A-Za-z0-9_]+).*/\2/')
else 
    contracts=()
fi

# Exit early if none found (common in empty/new projects)
if [[ ${#contracts[@]} -eq 0 ]]; then
    echo "No contracts or libraries found in src/."
    exit 0
fi

# Build the contracts, get size info as JSON (ignore non-zero exit to always parse output)
json=$(forge build --sizes --json || true)

# Filter JSON: keep only contracts/libraries from src/
json=$(echo "$json" | jq --argjson keys "$(printf '%s\n' "${contracts[@]}" | jq -R . | jq -s .)" '
  to_entries
  | map(select(.key as $k | $keys | index($k)))
  | from_entries
')

# Find all that violate the EIP-170 runtime size limit (24,576 bytes)
exceeding=$(echo "$json" | jq -r '
  to_entries
  | map(select(.value.runtime_size > 24576))
  | .[]
  | "\(.key): \(.value.runtime_size)"
')

# Print results and exit appropriately for CI
if [[ -n "$exceeding" ]]; then
  echo "ERROR: The following contracts exceed EIP-170 runtime size (24,576 bytes):"
  echo "$exceeding"
  exit 1
else
  echo "All contracts are within the EIP-170 runtime size limit."
  exit 0
fi
