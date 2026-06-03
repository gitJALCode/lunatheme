# Builds panel.tar.gz for GitHub Releases (same layout as .github/workflows/build-release.yml).
# Requires: Node.js >= 22, Yarn. Composer/vendor are installed on the server by the installer.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "* Installing frontend dependencies..."
yarn install --frozen-lockfile

Write-Host "* Building production assets..."
yarn build:production

if (Test-Path panel.tar.gz) { Remove-Item panel.tar.gz -Force }

Write-Host "* Creating panel.tar.gz..."
tar -czf panel.tar.gz `
    --exclude=./.git `
    --exclude=./.github `
    --exclude=./node_modules `
    --exclude=./installer `
    --exclude=./tests `
    --exclude=./preview `
    --exclude=./panel.tar.gz `
    --exclude=./.env `
    --exclude=./.env.ci `
    --exclude=./vendor `
    .

$sizeMb = [math]::Round((Get-Item panel.tar.gz).Length / 1MB, 2)
Write-Host "* Done: panel.tar.gz ($sizeMb MB)"
Write-Host "  Upload at: https://github.com/gitJALCode/lunatheme/releases/new"
Write-Host "  Asset name must be: panel.tar.gz"

if (-not (Select-String -Path "composer.lock" -Pattern "stripe/stripe-php" -Quiet)) {
    Write-Error "stripe/stripe-php missing from composer.lock. Run composer update first."
    exit 1
}
