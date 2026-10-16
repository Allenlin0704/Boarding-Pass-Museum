#!/usr/bin/env bash
set -euo pipefail
umask 077

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/private-backup.sql" >&2
  exit 2
fi

destination="$1"
if [[ "$destination" != /* ]]; then
  echo "Choose an absolute path outside the repository." >&2
  exit 2
fi
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "$destination" == "$repo_root"/* ]]; then
  echo "Refusing to place a production database export inside the repository." >&2
  exit 2
fi
if [[ -e "$destination" ]]; then
  echo "Refusing to overwrite an existing backup." >&2
  exit 2
fi

mkdir -p "$(dirname "$destination")"
"$repo_root/node_modules/.bin/wrangler" d1 export boardingpassmuseum-db --remote --output "$destination"
node "$repo_root/scripts/verify-d1-backup.mjs" "$destination"
chmod 600 "$destination"
echo "Private D1 export created and verified. Keep it out of Git and store an additional encrypted copy separately."
