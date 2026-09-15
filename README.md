# MieBooks

Some Books about Mod by xm1221.

MieHex 系列模组网页书聚合站（Cloudflare Pages 总项目 **hexbook**）：
https://hexbook.xm1221.cn

## 站点结构

```
hexbook.xm1221.cn
├── index.html            ← 导航首页（web/index.html）
├── miehex-revolution/    ← MieHex:Revolution 网页书（hexdoc 产物）
├── hexmob/               ← 未来
└── almightlystaff/       ← 未来
```

## 本地部署

```powershell
# 一键：MieHex 仓库内 hexdoc build+merge → 组装 deploy/ → wrangler 部署
.\scripts\deploy-book.ps1
# 跳过重新构建（_site 已是最新）：
.\scripts\deploy-book.ps1 -SkipBuild
```

## CI 自动部署

`.github/workflows/book.yml`：push main 后 checkout `xm1221/MieHexRevolution1.20.1`，
`uv sync` + `hexdoc build/merge`，组装 `deploy/`，`wrangler-action` 部署到 Pages 项目 `hexbook`。

需要的仓库 Secrets：

- `CLOUDFLARE_API_TOKEN`：Cloudflare API Token（Account → Cloudflare Pages → Edit；如需自动建 DNS 再加 Zone → DNS → Edit）
- `MIEHEX_REPO_TOKEN`：仅当 MieHexRevolution1.20.1 为私有仓库时需要（PAT 读权限）

## 注意

- 每次部署是全量覆盖：`deploy/` 必须整体上传（导航首页 + 所有子目录）。
- 本地 hexdoc 在 MieHex 仓库的 `.venv`（`uv` 不在 PATH，用 `.venv\Scripts\hexdoc.exe`）。
