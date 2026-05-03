#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/rocom-egg-predictor}"
REPO_URL="${REPO_URL:-}"
SERVICE_FILE="/etc/systemd/system/rocom-egg-predictor.service"

if [[ -z "${REPO_URL}" ]]; then
  echo "REPO_URL is required. Example:"
  echo "REPO_URL=https://github.com/<user>/<repo>.git sudo -E bash scripts/linux-install.sh"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 22 and npm are required."
  exit 1
fi

if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" pull --ff-only
else
  mkdir -p "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
npm ci
npm run data:update
npm run lint
npm run test
npm run build

chown -R www-data:www-data "${APP_DIR}"
cp deploy/systemd/rocom-egg-predictor.service "${SERVICE_FILE}"

systemctl daemon-reload
systemctl enable rocom-egg-predictor
systemctl restart rocom-egg-predictor
systemctl status rocom-egg-predictor --no-pager
