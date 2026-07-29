# PagePilot 静态网站与五金网站内容管理后台

本仓库是一个直接发布到 GitHub Pages 的纯静态站点。`demo_0` 是五金企业网站，`demo_0_back` 是配套的可视化内容管理后台。后台不依赖 Node.js 服务端、数据库或 Cloudflare Worker，而是在用户浏览器中调用 GitHub Repository Contents API，将内容和图片提交回当前仓库。

## 线上地址与发布配置

| 项目 | 当前值 |
| --- | --- |
| GitHub 仓库 | `TimerIzaya/TimerIzaya.github.io` |
| Pages 发布分支 | `master` |
| Pages 发布目录 | 仓库根目录 `/` |
| 自定义域名 | `pagepilot.top`（由根目录 `CNAME` 配置） |
| 五金网站 | `https://pagepilot.top/demo_0/` |
| 内容管理后台 | `https://pagepilot.top/demo_0_back/` |

仓库根目录的 `.nojekyll` 会让 GitHub Pages 直接发布静态文件，不需要安装依赖或执行构建命令。提交到 `master` 后，Pages 通常需要 **1 至 10 分钟**完成更新；GitHub API 返回提交成功只代表代码已进入仓库，不代表 Pages 已经部署完成。

如果在仓库设置中重新配置 Pages，请选择 **Deploy from a branch**、`master` 和 `/(root)`，并保留根目录的 `CNAME`。后台的公开网站路径使用 `/demo_0/`，由浏览器在正式环境解析为上表中的完整地址。

## 目录结构

```text
.
├─ CNAME                       # GitHub Pages 自定义域名
├─ .nojekyll                   # 禁用 Jekyll 处理
├─ demo_0/                     # 五金企业前台
│  ├─ content/site.json        # 全站可编辑内容与主题配置
│  ├─ assets/                  # 前台图片
│  │  └─ uploads/              # 后台上传图片的固定目录
│  ├─ index.html               # 首页
│  ├─ about.html               # 关于我们
│  ├─ products.html            # 产品中心
│  ├─ news.html                # 新闻列表
│  ├─ news-detail.html         # 新闻详情
│  ├─ contact.html             # 联系我们
│  ├─ styles.css               # 前台样式
│  └─ app.js                   # JSON 加载、安全校验与页面渲染
└─ demo_0_back/                # 可视化内容管理后台
   ├─ index.html               # 连接及编辑界面
   ├─ admin.css                # 后台响应式样式
   ├─ config.js                # 固定的非敏感仓库配置
   └─ admin.js                 # 编辑、预览、图片处理和发布逻辑
```

`assets/uploads/` 可能要到首次从后台上传图片后才会出现在 Git 仓库中。Git 不保存空目录。

## 前台如何读取内容

`demo_0` 启动时读取 `content/site.json`，校验数据后将文字、链接、图片、SEO 信息和主题颜色渲染到各个页面。请求带有缓存破坏参数，避免发布后继续使用旧 JSON。普通文字通过 `textContent` 写入；链接协议与图片相对路径会先经过校验。

如果 JSON 请求失败或个别字段缺失，前台会保留 HTML 中的安全默认内容，不会显示整页空白。不要把整段 HTML、CSS 或图片 Base64 放入 `site.json`；图片字段只保存类似 `assets/uploads/product-UUID.webp` 的相对路径。

## 本地预览

请从仓库根目录启动静态 HTTP 服务，不要直接双击 HTML。`file://` 页面通常无法正常 `fetch` JSON。

```bash
python -m http.server 8000
```

然后访问：

- 前台：`http://localhost:8000/demo_0/`
- 后台：`http://localhost:8000/demo_0_back/`

本地预览可以测试页面、表单、图片预览和 GitHub 连接。只有在确认发布后，后台才会向 GitHub 发起写入请求。

## 使用内容管理后台

1. 打开 `/demo_0_back/`。
2. 输入只授权当前仓库的 Fine-grained personal access token。
3. 按需勾选“记住令牌”，然后点击“连接并加载网站”。
4. 在各模块的可视化表单中修改文字、链接、图片、SEO 与配色。不要直接编辑原始 JSON。
5. 使用“预览修改”检查本地草稿。预览不会提交 GitHub。
6. 点击“发布网站”，核对确认提示并等待全部阶段完成。
7. 看到提交 SHA 和提交链接后，等待 1 至 10 分钟，再打开带时间戳参数的网站地址检查 Pages 更新。

编辑期间的未发布内容只保存在当前页面内。重新加载、关闭页面或撤销本次修改前，应确认不再需要这些草稿。发布失败时后台会尽量保留当前编辑内容，便于修正后重试。

## 创建最小权限的 GitHub 令牌

GitHub 的界面名称可能随时间调整，基本入口为：

1. 登录 GitHub，进入 **Settings**。
2. 打开 **Developer settings** → **Personal access tokens** → **Fine-grained tokens**。
3. 选择 **Generate new token**，设置清晰的名称和尽可能短的有效期。
4. **Resource owner** 选择仓库所有者 `TimerIzaya`。
5. **Repository access** 选择 **Only select repositories**，并且只选择 `TimerIzaya.github.io`。
6. 在 **Repository permissions** 中把 **Contents** 设置为 **Read and write**。
7. 不授予其他可选的仓库或组织权限。GitHub 自动附带的 **Metadata: Read-only** 属于基础只读权限。
8. 创建后只在后台的密码输入框中粘贴令牌，不要把令牌发给他人或写入任何项目文件。

后台不需要访问其他仓库，也不需要 Issues、Pull requests、Actions、Administration 或 Pages 写权限。令牌值没有任何可安全提交的“示例”；文档、截图、测试数据和配置中都只能使用 `<YOUR_FINE_GRAINED_TOKEN>` 这样的占位符。

## 令牌如何保存在浏览器中

- 默认只保存到内存和 `sessionStorage`；关闭对应浏览器会话后，浏览器会按自身规则清理会话存储。
- 只有主动勾选“记住令牌”时，才会写入 `localStorage`。
- 取消“记住令牌”会移除旧的本地持久化副本。
- 后台的“清除 GitHub 令牌”会同时清除内存、输入框、`sessionStorage` 和 `localStorage`。
- 也可以通过浏览器的网站设置，清除 `pagepilot.top` 的站点数据；本地预览时清除 `localhost` 的站点数据。

令牌保存在当前浏览器中，请勿在公共电脑、共享账号或不可信浏览器环境中使用。浏览器扩展、恶意脚本、XSS、设备失窃或他人取得浏览器配置文件，都可能导致本地令牌泄露。

## 固定仓库配置

`demo_0_back/config.js` 只包含非敏感配置：

```js
const githubConfig = Object.freeze({
  owner: "TimerIzaya",
  repo: "TimerIzaya.github.io",
  branch: "master",
  contentPath: "demo_0/content/site.json",
  uploadDirectory: "demo_0/assets/uploads",
  publicSiteUrl: "/demo_0/"
});
```

后台界面不允许用户修改 owner、repo、branch、内容路径或上传目录，防止令牌被用于其他仓库或路径。如果仓库被转移、重命名或发布分支发生变化，应由维护者：

1. 在本地打开 `demo_0_back/config.js`，修改 `owner`、`repo` 和 `branch`；必要时再调整公开网站路径。
2. 保持 `contentPath` 与 `uploadDirectory` 指向预期仓库内的固定安全目录。
3. 让 `branch` 与 GitHub Pages 实际发布分支一致，并核对 Pages 的根目录设置。
4. 通过本地 HTTP 服务验证前后台，再提交配置变更。

**绝对不要在 `config.js` 或其他 HTML、CSS、JavaScript、JSON、测试和文档文件中加入真实令牌。**

## GitHub API 发布流程

连接时，后台通过固定配置请求：

```text
GET /repos/TimerIzaya/TimerIzaya.github.io/contents/demo_0/content/site.json?ref=master
```

后台会取得 `site.json`、文件 SHA，并以 UTF-8 正确解码中文。发布时按以下顺序执行：

浏览器请求使用 `Accept: application/vnd.github+json`、`Authorization: Bearer …` 和当前支持的 `X-GitHub-Api-Version: 2026-03-10`。`User-Agent` 属于浏览器控制的受限请求头，纯前端 `fetch` 不能可靠改写为自定义值；浏览器会自动发送自身 User-Agent。若必须固定为 `PagePilot-Demo0-Manager`，只能增加受信任的服务端代理，而这不在本纯静态 GitHub Pages 方案范围内。

1. 校验编辑数据、链接、图片类型、大小和目标路径。
2. 在浏览器中处理待上传图片，并为图片生成不包含原文件名的随机文件名。
3. 逐张、串行 `PUT` 图片到固定的 `demo_0/assets/uploads/`；每成功一张就更新进度。
4. 所有图片上传成功后，重新 `GET` 在线 `site.json`，取得最新 SHA。
5. 更新图片相对路径与 `updatedAt`，把完整 JSON 按 UTF-8 编码为 Base64。
6. 最后 `PUT` `demo_0/content/site.json`，请求中携带最新 SHA 与 `master` 分支。
7. GitHub 返回成功后显示提交 SHA、提交链接和公开网站地址。

图片必须最后由 `site.json` 引用，因此 `site.json` 始终是发布流程的最后一次写入。多张图片不得并发上传，否则容易产生 Git 提交冲突。如果图片上传中途失败，后台会停止发布且不会更新 JSON；已上传成功的文件可能成为暂时未被引用的孤立图片，错误提示会说明这一风险。

遇到 `409 Conflict` 时最多自动重试一次。后台不会在无提示的情况下覆盖其他人刚刚发布的内容；如果在线内容已变化，应重新加载并人工核对后再发布。

## 图片规则

当前随站点部署的展示素材统一使用 WebP，`site.json` 和前台安全回退数据均引用 `.webp` 文件。原始 PNG 暂时保留在 `demo_0/assets/` 中，仅用于版本回滚，不参与正常页面加载。

后台接受 JPG、JPEG、PNG 和 WebP。选择图片后只生成本地预览；发布时会在浏览器中缩放并优先编码为 WebP（质量 0.84），再使用随机 UUID 文件名逐张上传。只有当前浏览器无法编码 WebP 时，才安全回退为 JPG 或 PNG。JSON 始终只保存图片相对路径，不保存 Base64 数据。

- 允许 JPG、JPEG、PNG 和 WebP；同时检查 MIME 类型和扩展名。
- 禁止 SVG、HTML、JavaScript、PHP、可执行文件及其他非图片文件。
- 单张原始图片默认最大 5 MB。
- 选择图片只产生本地预览，不会立即上传。
- JPG、PNG 可在浏览器中合理缩放、压缩并优先输出 WebP；不支持转换时保留经过校验的安全原格式。
- 文件名使用随机 UUID，不包含原始中文文件名、路径片段或危险字符。
- JSON 中只保存 `assets/uploads/...` 相对路径，不保存 Base64 数据。

## 常见错误排查

### 401：令牌无效、过期或已撤销

后台会清除无效令牌。重新创建有效令牌，确认令牌尚在有效期内，并重新连接。不要在错误信息、控制台截图或工单中粘贴令牌。

### 403：权限不足或访问受限

确认 Fine-grained token 的 Repository access 只选择且确实包含 `TimerIzaya.github.io`，并确认 Contents 为 Read and write。还应检查组织策略、GitHub 访问限制和 API 限流；不要通过扩大到所有仓库来规避配置问题。

### 404：仓库、分支或文件不可见

核对 `config.js` 中的 owner、repo、`master`、`demo_0/content/site.json`，以及文件是否已提交到远端。对私有仓库而言，无访问权也可能表现为 404。

### 409：在线内容冲突

说明加载后 `site.json` 已被其他提交修改，或连续图片提交后 SHA 已变化。让当前发布流程停止，重新加载线上内容，比较并重新应用本地修改；不要反复重试或强制覆盖。

### 422：请求内容无法处理

检查 JSON 数据、Base64 编码、分支名、目标路径、提交体和最新文件 SHA。图片还应检查格式、大小和生成后的文件名。修正数据后再发布，不要把完整请求对象连同 Authorization 信息输出到日志。

网络断开时请检查当前网络是否能访问 `api.github.com`；频繁请求或收到 429 时应稍后重试。所有错误信息都应保持脱敏，不显示令牌、Authorization 请求头或完整敏感请求对象。

## 静态后台的安全边界

这是公开的纯前端 GitHub Pages 后台，不是真正的服务器登录系统：

- `/demo_0_back/` 的页面地址、HTML、JavaScript 和固定仓库配置对所有访问者可见。
- 没有有效且具备相应权限的 GitHub 令牌，访问者无法通过 GitHub API 修改仓库。
- 真正的权限边界是 GitHub 的身份验证、仓库授权、Contents 权限和令牌有效期，而不是后台页面是否隐藏。
- 令牌只应由浏览器用于向 `https://api.github.com` 发送 Authorization 请求，不应进入 URL、DOM 文本、错误详情、控制台或 Git 提交。
- 不要在公共电脑保存令牌；使用后点击“清除 GitHub 令牌”，并在浏览器设置中确认站点数据已清除。
- 令牌应只授权当前仓库、仅具有 Contents Read and write，并设置合理的短有效期。
- 仓库维护者应保持前台和后台依赖为可信的本地静态代码，避免引入能读取页面数据的未知第三方脚本。

即使后台增加本地页面密码，它也只能减少误操作，无法构成服务器端认证，也不能替代 GitHub Token 的权限控制。不要把 GitHub Token 当作页面密码。

## 令牌泄露、丢失或误提交后的处理

1. **立即撤销令牌**：进入 GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens，找到对应令牌并 Revoke/Delete。
2. 清除后台内存和浏览器站点数据，关闭可能仍持有令牌的页面。
3. 创建新的最小权限、短有效期令牌；不要复用已泄露的值。
4. 检查仓库提交、Actions 日志、Issue、截图、聊天记录及其他可能出现令牌的位置。
5. 如果令牌曾进入 Git 历史，仅删除当前版本中的字符串并不够；应先撤销，再由熟悉 Git 历史重写的维护者清理历史，并通知所有协作者重新同步。

任何疑似泄露都应按真实泄露处理。不要先等待确认，也不要把旧令牌留到“之后再撤销”。

## 部署与维护检查

提交前至少确认：

- `config.js` 仍指向 `TimerIzaya/TimerIzaya.github.io`、`master` 和固定路径。
- 项目中没有真实令牌、Authorization 值或包含令牌的 URL。
- `demo_0/content/site.json` 是合法 UTF-8 JSON，且图片路径为安全相对路径。
- 前台与后台可通过本地 HTTP 服务打开，浏览器无明显 JavaScript 错误。
- 桌面端和移动端布局可正常使用。
- Pages 设置仍为 `master` 的 `/(root)`，根 `CNAME` 仍为 `pagepilot.top`。

将代码推送到 `master` 后，等待 GitHub Pages 构建。后台发布产生的每次图片上传和最终 JSON 更新也会形成 Git 提交；最终以 GitHub 提交记录和稍后加载到的线上 JSON 为准。
