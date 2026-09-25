#!/bin/bash
# Periodic autosave: commits and pushes local changes so the same repo
# stays in sync across multiple machines. Runs on a timer (see
# scripts/README.md), not on every save — meant for solo cross-machine
# sync, not as a substitute for real commits when you finish something.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE="/tmp/rr-autosync.lock"

cd "$REPO_DIR"

# Skip silently if a previous run is still in progress.
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

# Not a git repo, or git not available — nothing to do.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Pull first so we don't diverge further from the other machine.
if ! git pull --rebase --autostash --quiet; then
  echo "[autosync $(date '+%F %T')] pull --rebase failed, aborting rebase — resolve manually." >&2
  git rebase --abort >/dev/null 2>&1 || true
  exit 1
fi

# Nothing to commit — just make sure we're pushed up to date.
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
  git push --quiet 2>/dev/null || true
  exit 0
fi

git add -A
git commit -q -m "autosave: $(date '+%Y-%m-%d %H:%M:%S')"
git push --quiet
