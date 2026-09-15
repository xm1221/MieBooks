# 本地一键构建+组装+部署 MieHex 网页书到 Cloudflare Pages 总项目 hexbook
# 聚合仓库 MieBooks：产物组装在 deploy/（miehex-revolution/ + 导航首页），全量上传。
param(
  [string]$MieHexPath = "C:\Users\Administrator\Desktop\BigPack\MieHexRevolution1.20.1",
  [switch]$SkipBuild,
  [string]$ProjectName = "hexbook",
  [string]$Branch = "main"
)
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

if (-not (Test-Path (Join-Path $MieHexPath ".venv\Scripts\hexdoc.exe"))) {
  throw "MieHex .venv hexdoc.exe not found at $MieHexPath"
}

if (-not $SkipBuild) {
  Push-Location $MieHexPath
  try {
    & ".\.venv\Scripts\hexdoc.exe" build
    if ($LASTEXITCODE -ne 0) { throw "hexdoc build failed" }
    & ".\.venv\Scripts\hexdoc.exe" merge
    if ($LASTEXITCODE -ne 0) { throw "hexdoc merge failed" }
  } finally {
    Pop-Location
  }
}

$deploy = Join-Path $root "deploy"
if (Test-Path $deploy) { Remove-Item $deploy -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $deploy "miehex-revolution") -Force | Out-Null
Copy-Item -Path (Join-Path $MieHexPath "_site\dst\docs\*") -Destination (Join-Path $deploy "miehex-revolution") -Recurse -Force
Copy-Item -Path (Join-Path $root "web\index.html") -Destination $deploy -Force

$wrangler = Join-Path $root ".wrangler-tools\node_modules\.bin\wrangler.cmd"
if (-not (Test-Path $wrangler)) {
  $wrangler = Join-Path $MieHexPath ".wrangler-tools\node_modules\.bin\wrangler.cmd"
}
if (-not (Test-Path $wrangler)) { throw "wrangler not found" }

& $wrangler pages deploy $deploy --project-name $ProjectName --branch $Branch
if ($LASTEXITCODE -ne 0) { throw "wrangler pages deploy failed" }
Write-Output "Deployed. See https://$ProjectName.pages.dev"
