# MieBooks

Some Books about Mod by xm1221.

MieHex 系列模组网页书聚合站（Cloudflare Pages 总项目 **hexbook**）：
https://hexbook.xm1221.cn

## 站点结构

```
hexbook.xm1221.cn
├── index.html               ← 导航首页（web/index.html）
├── miehex-revolution/       ← MieHex:Revolution（xm1221/MieHexRevolution1.20.1）
├── abadoned-greatwork/      ← Abadoned Greatwork（xm1221/AbadonedGreatwork）
├── almightly-staff/         ← Almightly Staff / 万法之杖（xm1221/Almightly-Staff）
└── miehex-for-bigpackage/   ← miehex（xm1221/miehex_for_bigpackage）
```

## 本地部署

```powershell
# 一键：4 本书 hexdoc build+merge → 组装 deploy/ → wrangler 部署
.\scripts\deploy-book.ps1
# 跳过重新构建（_site 均已最新）：
.\scripts\deploy-book.ps1 -SkipBuild
```

book 定义（本地路径 + 子目录 slug）在 `scripts/deploy-book.ps1` 顶部的 `$books` 数组。

## CI 自动部署

`.github/workflows/book.yml`：

- 触发：push main（本仓库） / `workflow_dispatch` / `repository_dispatch`（各 book 仓库 push 后通知）
- 流程：checkout 4 个 book 仓库 → 各自 `uv sync` + `hexdoc build/merge` → 组装 `deploy/`（全量）→ `wrangler-action` 部署到 Pages 项目 `hexbook`

各 book 仓库的 `.github/workflows/book-update.yml` 在 push main 时 POST repository_dispatch 到本仓库，实现「提交 book 自动更新整站」。

需要的 Secrets：

- `CLOUDFLARE_API_TOKEN`（MieBooks）：Cloudflare API Token（Account → Cloudflare Pages → Edit；如需自动建 DNS 再加 Zone → DNS → Edit）
- `MIEBOOKS_DISPATCH_TOKEN`（各 book 仓库）：GitHub PAT，对 xm1221/MieBooks 有 Contents 写权限，用于触发 dispatch
- `MIEHEX_REPO_TOKEN`（MieBooks）：仅当 book 仓库为私有时需要（PAT 读权限）

## 注意

- 每次部署是全量覆盖：`deploy/` 必须整体上传（导航首页 + 所有子目录）。
- 本地各书构建用各自 `.venv`（`uv` 不在 PATH；新书首次用 `uv sync --prerelease=allow` 生成 uv.lock，之后普通 `uv sync` 即可）。
- hexdoc 构建前必须先删 `_site` 再 build+merge（merge 复用旧 sitemap 会残留污染）。
