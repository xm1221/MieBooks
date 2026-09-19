# MieBooks

筱乜（xm1221）的咒法学模组网页书聚合仓库 —— 一键构建、组装并部署 MieHex 系列模组文档站到 Cloudflare Pages（项目 **hexbook**）。

在线站点：https://hexbook.xm1221.cn

## 站点结构

```
hexbook.xm1221.cn
├── index.html                ← 导航首页（xm.png 封面 → 卡片列表，web/index.html）
├── icons/                    ← 首页卡片图标（web/icons/）
├── xm.png                    ← 封面/背景图（web/xm.png）
├── miehex-revolution/        ← MieHex:Revolution 咩之咒法：变革（xm1221/MieHexRevolution1.20.1）
├── abadoned-greatwork/       ← Abadoned Greatwork 被遗弃的卓伟之作（xm1221/AbadonedGreatwork）
├── almightly-staff/          ← Almightly Staff 万法之杖（xm1221/Almightly-Staff）
└── miehex-for-bigpackage/    ← miehex 咩之咒法（xm1221/miehex_for_bigpackage）
```

## 仓库结构

```
web/                           首页资源（index.html + icons/ + 背景图；组装时整体复制到 deploy/）
scripts/
  deploy-book.ps1              本机一键：构建 → 组装 deploy/ → wrangler 部署
  books.config.json            book 身份定义（slug / GitHub repo / 相对目录名，无本地路径）
  books.local.json             （gitignore）本机 book 仓库根路径
.github/workflows/book.yml     CI：push main / workflow_dispatch / repository_dispatch → 构建+组装+部署
```

## Book 定义与本地路径

book 的**身份**（子目录 slug、GitHub 仓库、相对目录名）统一放在 `scripts/books.config.json`，仓库内不出现任何本机路径：

```json
[
  { "slug": "miehex-revolution", "repo": "xm1221/MieHexRevolution1.20.1", "dir": "MieHexRevolution1.20.1" }
]
```

本机 book 仓库的**根目录**在 `scripts/books.local.json` 配置（已 gitignore，不入库）：

```json
{ "root": "C:/path/to/your/books" }
```

- 缺省时回退到 `<MieBooks>/books/`（把 book 仓库 clone 到这里可免配置）
- 换机器只需新建 `books.local.json` 指向你的 book 仓库目录

## 部署

### 本机部署

```powershell
# 一键：4 本书 hexdoc build+merge → 组装 deploy/ → wrangler 部署
.\scripts\deploy-book.ps1
# 跳过重新构建（_site 均已最新）
.\scripts\deploy-book.ps1 -SkipBuild
```

### CI 自动部署（.github/workflows/book.yml）

- 触发：push main（本仓库）/ `workflow_dispatch` / `repository_dispatch`（各 book 仓库 push 后通知）
- 流程：checkout 4 个 book 仓库 → 各自 `uv sync` + `hexdoc build/merge` → 组装 `deploy/`（全量）→ `wrangler-action` 部署到 Pages 项目 `hexbook`
- 部署前有 `Verify deploy` 步骤：校验导航首页 + 4 个子目录 index.html 都存在，防止静默错误

各 book 仓库的 `.github/workflows/book-update.yml` 在 push main 时 POST repository_dispatch 到本仓库，实现「提交 book 自动更新整站」。

### 需要的 Secrets

| Secret | 位置 | 说明 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | MieBooks | Cloudflare API Token（Account → Cloudflare Pages → Edit） |
| `MIEBOOKS_DISPATCH_TOKEN` | 各 book 仓库 | GitHub PAT（对 xm1221/MieBooks 有 Contents 写权限），用于触发 dispatch |
| `MIEHEX_REPO_TOKEN` | MieBooks | 仅当 book 仓库为私有时需要（PAT 读权限） |

## 问答合集维护（web/qa-data.json）

问答数据独立存放在 `web/qa-data.json`，`web/qa.html` 运行时读取渲染——**改数据不用碰页面代码**：

```json
{ "items": [ { "q": "问题", "a": "回答", "nickname": "昵称(可省)", "date": "2026-09-17" } ] }
```

添加方式二选一：

1. **交互式脚本**（推荐，防格式错）：
   ```powershell
   node scripts/add-qa.mjs
   ```
   依次输入问题/回答/昵称/日期，自动写入，然后 `git add web/qa-data.json && git commit -m "add qa" && git push` 上线。
2. **直接编辑** `web/qa-data.json`：往 `items` 数组加一个对象（注意 JSON 逗号；回答多行用 `\n` 转义）。

收录原则：只收录勾选「允许公开」的问题；展示保留提问者昵称、隐去邮箱；涉及隐私（存档、服务器、个人信息）的内容一律不收录。

## 新增一本书的步骤

1. `scripts/books.config.json` 加一条 `{ slug, repo, dir }`
2. 本机把 book 仓库放到 `books.local.json` 的 root 下（或 `MieBooks/books/`）
3. book 仓库侧完成 hexdoc 适配（关键点见下）
4. `.github/workflows/book.yml`：加 checkout 步骤 + build 步骤 + `Verify deploy` 里的目录校验
5. `web/index.html` 加一张卡片，`web/icons/` 放对应图标
6. 本机 `.\scripts\deploy-book.ps1` 全量部署验证

### hexdoc 适配要点（新书常见坑）

- `doc/resources/` 目录必须存在（git 不跟踪空目录 → 放 `.gitkeep` 提交）
- `hexdoc.toml` 必须含 `[extra.hexcasting]` 段
- 物品模型（ModelItem）只认 `layer0` 纹理键
- 首次 `uv sync --prerelease=allow` 生成 uv.lock，之后普通 `uv sync`
- 静态版本号用 `_hooks` 内联常量（`__gradle_version__.py` 被 gitignore，构建时动态生成）
- 中文书名：lang 文件加 `hexdoc.<modid>.title / description` key（en_us + zh_cn）

## 注意

- 每次部署是全量覆盖：`deploy/` 必须整体上传（导航首页 + 所有子目录 + icons + 背景图）。
- 组装时根跳转 `en_us → zh_cn`（书站默认中文，书内仍可切换语言）。
- hexdoc 构建前必须先删 `_site` 再 build+merge（merge 复用旧 sitemap 会残留污染版本目录）。
- 本地各书构建用各自 `.venv`（`uv` 不在 PATH 时用 `.venv\Scripts\hexdoc.exe`）。
- **不要给 Pages 项目绑 Git 集成**：它与 GitHub Actions + wrangler 部署管线互斥，双部署会互相覆盖（曾误部署仓库根并暴露 `scripts/` 文件）。
- 线上验证请用 deployment URL（`<hash>.hexbook-euf.pages.dev`）或查 CF API，自定义域可能命中 CDN/代理缓存旧响应。
