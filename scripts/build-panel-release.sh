#!/bin/bash
# Builds panel.tar.gz for GitHub Releases (same layout as .github/workflows/build-release.yml).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "* Installing frontend dependencies..."
yarn install --frozen-lockfile

echo "* Building production assets..."
yarn build:production

rm -f panel.tar.gz
echo "* Creating panel.tar.gz..."
tar -czf panel.tar.gz \
    --exclude='./.git' \
    --exclude='./.github' \
    --exclude='./node_modules' \
    --exclude='./installer' \
    --exclude='./tests' \
    --exclude='./preview' \
    --exclude='./panel.tar.gz' \
    --exclude='./.env' \
    --exclude='./.env.ci' \
    --exclude='./vendor' \
    .

SIZE="$(du -h panel.tar.gz | cut -f1)"
echo "* Done: panel.tar.gz ($SIZE)"
echo "  Upload at: https://github.com/gitJALCode/lunatheme/releases/new"
echo "  Asset name must be: panel.tar.gz"

if ! grep -q 'stripe/stripe-php' composer.lock; then
    echo "ERROR: stripe/stripe-php missing from composer.lock — run: composer update stripe/stripe-php --no-dev" >&2
    exit 1
fi
