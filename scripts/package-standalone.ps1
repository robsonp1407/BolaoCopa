$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$buildDir = Join-Path $root ".next-app"
$standaloneDir = Join-Path $buildDir "standalone"
$distDir = Join-Path $root "dist"
$deployDir = Join-Path $distDir "deploy"
$zipPath = Join-Path $distDir "bolao-copa-standalone.zip"

Set-Location $root

Write-Host "Gerando build standalone..."
npm run build

if (-not (Test-Path -LiteralPath (Join-Path $standaloneDir "server.js"))) {
  throw "Build standalone nao encontrado em $standaloneDir. Confira next.config.mjs."
}

if (Test-Path -LiteralPath $deployDir) {
  Remove-Item -LiteralPath $deployDir -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

Write-Host "Copiando runtime standalone..."
Copy-Item -Path (Join-Path $standaloneDir "*") -Destination $deployDir -Recurse -Force

Write-Host "Copiando build do Next.js..."
$deployNextDir = Join-Path $deployDir ".next-app"
New-Item -ItemType Directory -Path $deployNextDir -Force | Out-Null

Get-ChildItem -LiteralPath $buildDir -Force |
  Where-Object { $_.Name -notin @("cache", "standalone") } |
  ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $deployNextDir $_.Name) -Recurse -Force
  }

$publicDir = Join-Path $root "public"
if (Test-Path -LiteralPath $publicDir) {
  Write-Host "Copiando public..."
  Copy-Item -LiteralPath $publicDir -Destination (Join-Path $deployDir "public") -Recurse -Force
}

Write-Host "Copiando Prisma e arquivos de referencia..."
Copy-Item -LiteralPath (Join-Path $root "prisma") -Destination (Join-Path $deployDir "prisma") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root "src") -Destination (Join-Path $deployDir "src") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root ".env.example") -Destination (Join-Path $deployDir ".env.example") -Force
Copy-Item -LiteralPath (Join-Path $root "README.md") -Destination (Join-Path $deployDir "README.md") -Force

Write-Host "Compactando pacote..."
Compress-Archive -Path (Join-Path $deployDir "*") -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Pacote pronto:"
Write-Host $zipPath
