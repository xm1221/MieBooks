# 本地一键构建+组装+部署全部 MieHex 网页书到 Cloudflare Pages 总项目 hexbook
# 聚合仓库 MieBooks：book 定义见下方 $books，产物组装在 deploy/（各书子目录 + 导航首页），全量上传。
param(
  [switch]$SkipBuild,
  [string]$ProjectName = "hexbook",
  [string]$Branch = "main"
)
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

# book 定义：身份（slug/repo/dir）在 scripts/books.config.json，仓库内无本地路径；
# 本地根目录从 scripts/books.local.json 读取（该文件已 gitignore），缺省回退到 <MieBooks>/books/
$configFile = Join-Path $PSScriptRoot "books.config.json"
$localFile  = Join-Path $PSScriptRoot "books.local.json"
$booksRoot = if (Test-Path $localFile) { (Get-Content $localFile -Raw | ConvertFrom-Json).root }
             else { Join-Path $root "books" }
$books = @()
foreach ($b in (Get-Content $configFile -Raw | ConvertFrom-Json)) {
  $books += @{ Path = Join-Path $booksRoot $b.dir; Slug = $b.slug; Repo = $b.repo }
}

$deploy = Join-Path $root "deploy"
if (Test-Path $deploy) { Remove-Item $deploy -Recurse -Force }
New-Item -ItemType Directory $deploy -Force | Out-Null

foreach ($book in $books) {
  $hexdoc = Join-Path $book.Path ".venv\Scripts\hexdoc.exe"
  if (-not (Test-Path $hexdoc)) { throw "hexdoc.exe not found: $hexdoc" }

  if (-not $SkipBuild) {
    Push-Location $book.Path
    try {
      # 坑①：merge 复用旧 sitemap 标记 → 必须先删 _site 再 build+merge
      if (Test-Path (Join-Path $book.Path "_site")) { Remove-Item (Join-Path $book.Path "_site") -Recurse -Force }
      & ".\.venv\Scripts\hexdoc.exe" build
      if ($LASTEXITCODE -ne 0) { throw "hexdoc build failed: $($book.Slug)" }
      & ".\.venv\Scripts\hexdoc.exe" merge
      if ($LASTEXITCODE -ne 0) { throw "hexdoc merge failed: $($book.Slug)" }
    } finally {
      Pop-Location
    }
  }

  $src = Join-Path $book.Path "_site\dst\docs"
  if (-not (Test-Path $src)) { throw "no _site\dst\docs at $($book.Path) (need build first)" }
  $dst = Join-Path $deploy $book.Slug
  New-Item -ItemType Directory $dst -Force | Out-Null
  Copy-Item -Path (Join-Path $src "*") -Destination $dst -Recurse -Force
}

# 默认语言跳转：hexdoc 根跳转默认 en_us，改为 zh_cn（书内仍可切换语言）
foreach ($book in $books) {
  $idx = Join-Path $deploy "$($book.Slug)\index.html"
  if (Test-Path $idx) {
    $content = Get-Content $idx -Raw
    $content = $content -replace '/en_us"', '/zh_cn"'
    Set-Content -Path $idx -Value $content -Encoding UTF8
  }
}

# web/ 全部资源（index.html + icons + 背景图等）→ deploy/
Copy-Item -Path (Join-Path $root "web\*") -Destination $deploy -Recurse -Force

$wrangler = Join-Path $root ".wrangler-tools\node_modules\.bin\wrangler.cmd"
if (-not (Test-Path $wrangler)) {
  # fallback: 任意 book 的 wrangler（装在各 book 仓库）
  foreach ($book in $books) {
    $cand = Join-Path $book.Path ".wrangler-tools\node_modules\.bin\wrangler.cmd"
    if (Test-Path $cand) { $wrangler = $cand; break }
  }
}
if (-not (Test-Path $wrangler)) { throw "wrangler not found" }

& $wrangler pages deploy $deploy --project-name $ProjectName --branch $Branch
# 注：wrangler.cmd 的 $LASTEXITCODE 不可靠，失败信息由 wrangler 直接打印
Write-Output "Deployed. See https://$ProjectName.pages.dev"
