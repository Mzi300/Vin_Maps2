#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# Install exact dependencies
npm ci
# Build the Vite project (creates ./dist)
npm run build
# Destination path – adjust if your site uses a sub‑folder
TARGET_PATH="/home/livenets/public_html"
cp -R dist/* "$TARGET_PATH/"
