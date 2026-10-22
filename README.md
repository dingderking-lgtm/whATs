# WhatsApp 网页版中文落地页

这是一个独立的中文 WhatsApp Web 使用指南与入口导航站。页面为 HTML5 + CSS + 少量原生 JavaScript，正文直接存在于 HTML 中；不依赖 React、数据库、服务端函数或客户端渲染。Node.js 仅用于构建与本地验收，部署后的文件全部为静态文件。

正式站点地址为 **[https://whatsp.vercel.app](https://whatsp.vercel.app/)**。Vercel 构建默认使用该地址生成 canonical、分享元数据、结构化数据和 Sitemap，不再跟随 Vercel 自动选择的项目别名。

本站使用 WhatsApp 品牌图标辨识产品，入口直接前往 `https://web.whatsapp.com/`，与 WhatsApp / Meta 无隶属、授权或运营关系；实际登录和设备关联均在官方服务完成。

## 页面与文件

| 地址 | 源文件 | 内容 |
| --- | --- | --- |
| `/` | `index.html` | 中文落地页、官方入口、主题指南导航、使用步骤与常见问题 |
| `/guide` | `guide.html` | iPhone / Android 设备关联、登录确认、退出与安全使用指南 |
| `/troubleshooting` | `troubleshooting.html` | 按症状排查二维码、关联、消息同步、文件与通知问题 |
| `/messages-files` | `messages-files.html` | 消息、搜索、照片与文件、通知、通话的日常使用方法 |
| `/web-vs-desktop` | `web-vs-desktop.html` | 网页版与桌面版的选择、使用场景和切换注意点 |
| `/about` | `about.html` | 独立站定位、内容说明与参考来源 |
| `/privacy` | `privacy.html` | 本站隐私说明及外部服务边界 |
| 不存在的路径 | `404.html` | 自定义404页面，禁止索引 |

共 8 个 HTML 页面，其中 7 个内容页可在正式构建中被索引。`assets/` 存放本地图片、图标、样式和脚本。`scripts/` 是构建、验收、本地预览工具。构建会生成 `dist/robots.txt` 和 `dist/sitemap.xml`；404页面不会进入 Sitemap。

## 本地运行

使用 Node.js 22 或以上版本。项目没有 npm 第三方依赖，不需要安装页面框架。

```powershell
npm run build
npm run preview
```

浏览器打开 `http://127.0.0.1:4173`。停止服务用 `Ctrl+C`。修改 HTML/CSS 后重新执行 `npm run build`，刷新浏览器。也可使用 `npm run dev` 先构建再启动服务（不包含自动热更新）。

```powershell
npm run check
npm test
```

`check` 验证构建产物的 H1、唯一标题/描述、中文语言属性、canonical、JSON-LD、页面/资源/锚点链接、站点地图与抓取设置。`test` 使用隔离临时目录检查生产与预览构建、域名优先级、验证标签、clean URL、404与HTTP方法；不会改写源 HTML 或当前 `dist/`。这些检查不等同于 W3C 全量 HTML 校验、在线搜索引擎审核或 Vercel 生产验收。

未设置环境变量的本地构建会明确输出提示，使用 `http://localhost:4173` 并设置 `noindex`，适合预览。不要将这份本地产物直接当作正式域名构建上传。

## 部署到 Vercel

1. 把整个源码目录上传到自己的 GitHub / GitLab / Bitbucket 仓库，在 Vercel 新建项目并导入仓库。也可以使用已登录的 Vercel CLI 从源码根目录部署。
2. 项目根目录选择本目录，Framework Preset 选择 **Other**；Node.js 选择 **22.x 或以上受支持版本**。
3. 本项目的 `vercel.json` 已声明 **Build Command：`npm run build`**、**Output Directory：`dist`**、`cleanUrls: true`、`trailingSlash: false`。保留这些值，不要把输出目录改成源码根目录。
4. 在 Vercel 项目的 Domains 中确认 `whatsp.vercel.app` 已绑定到该项目的 Production 环境；仅修改代码中的域名不会自动完成绑定。在项目环境变量设置中保留 **Enable access to System Environment Variables**，以便构建区分生产与预览环境。
5. `SITE_URL` 可以不设置，Vercel 构建默认采用 `https://whatsp.vercel.app`。如果项目已有指向其他域名的 `SITE_URL`，将 Production 与 Preview 的值改为 `https://whatsp.vercel.app`，或者删除这些旧值。`VERCEL_PROJECT_PRODUCTION_URL` 和临时部署 URL 不参与域名选择。
6. 点击 Deploy。打开 [正式首页](https://whatsp.vercel.app/)，检查上表中的 7 个内容页，以及 [Sitemap](https://whatsp.vercel.app/sitemap.xml)、[robots.txt](https://whatsp.vercel.app/robots.txt)；再打开一个不存在的路径确认返回404。

Vercel 配置与环境区分依据：[vercel.json 文档](https://vercel.com/docs/project-configuration/vercel-json)、[系统环境变量文档](https://vercel.com/docs/environment-variables/system-environment-variables)。生产与预览构建默认使用代码中固定的正式地址，不需要提供 `VERCEL_PROJECT_PRODUCTION_URL`。构建会拒绝用于线上部署的 localhost、非 HTTPS 地址和带路径或查询参数的 `SITE_URL`。

404由输出目录中的 `404.html` 自动提供，没有把所有不存在的 URL 重写到首页。实现依据：[Vercel 自定义404页面](https://vercel.com/kb/guide/custom-404-page)。

## 以后迁移到其他域名

1. 在 Vercel 项目的 Domains 中添加自己的域名，并按该项目提供的 DNS 记录完成绑定。
2. 在项目环境变量中添加 `SITE_URL`，值为完整 HTTPS origin，例如 `https://your-domain.com`。不要加页面路径、参数或片段。建议 Production 与 Preview 均填正式域名。
3. 重新部署。构建会统一更新 canonical、Open Graph URL、JSON-LD 和 Sitemap。若有多个域名，把其他域名在 Vercel 中重定向到选定主域名，避免多个生产入口重复收录。
4. 域名更换后，重新检查所有 8 个 HTML 页面的 canonical；7 个内容页的 Open Graph URL、JSON-LD 和 Sitemap 地址也应采用新域名。确认正式首页的 robots meta 不含 `noindex`，`robots.txt` 中的 Sitemap 地址正确，再更新站长工具中的站点属性并提交新 Sitemap。

域名取值优先级：显式 `SITE_URL` → Vercel 环境默认 `https://whatsp.vercel.app` → 本地无配置时使用 `http://localhost:4173`。部署到 Vercel 时要求 HTTPS；Preview 使用相同正式 canonical，但所有页面保持 `noindex`。所有 `{{SITE_URL}}`、`{{ROBOTS}}`、`{{SITE_VERIFICATION}}` 都在构建时替换，因此应部署构建后的 `dist/`，不要直接发布带占位符的源码 HTML。

## Google 与 Bing SEO

本站包含可直接抓取的正文、各页独立 title/description、单一 H1、语义化 HTML、移动端适配、内部链接、canonical、Open Graph / Twitter 元信息、结构化数据、robots.txt 和 XML Sitemap。内容围绕用户实际使用问题组织，不使用关键词堆砌或虚构评分。canonical 是规范地址信号，搜索引擎仍会自行判断最终收录地址，参见 [Google canonical 说明](https://developers.google.com/search/docs/crawling-indexing/canonicalization)。

正式构建的七个内容页允许索引；404和 Preview / Development / 自定义非生产环境构建为 `noindex`，预览 Sitemap 为空。预览 robots.txt 仍允许抓取，让爬虫能读取页面的 `noindex` 标签；`noindex` 不是访问权限控制。依据 [Google robots meta 规范](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)。

### 验证站点与提交 Sitemap

当前已内置本项目提供的 Google 与 Bing 站点验证值，构建会将两个验证 meta 标签写入所有页面的 `<head>`，无需额外设置环境变量。以后更换验证值时，可以设置下面的环境变量覆盖默认值；每种验证标签只生成一次。

1. 在 [Google Search Console](https://search.google.com/search-console/) 添加站点。自定义域名可采用 DNS 验证；URL 前缀属性选择 HTML 标签验证时，把 `content` 中的验证值填入 Vercel 环境变量 `GOOGLE_SITE_VERIFICATION`，不要粘贴整个 `<meta>` 标签。
2. 在 [Bing Webmaster Tools](https://www.bing.com/webmasters/) 添加站点。使用 HTML meta 验证时，把 `msvalidate.01` 的 `content` 值填入 `BING_SITE_VERIFICATION`。
3. 添加或修改验证变量后重新部署，在页面源代码中确认标签出现，然后在对应站长工具中完成验证。
4. 向两家站长工具提交 [https://whatsp.vercel.app/sitemap.xml](https://whatsp.vercel.app/sitemap.xml)。逐页使用 URL 检查工具核对抓取、canonical、索引状态；首页的规范地址应为 `https://whatsp.vercel.app/`。
5. 后续更新真实有用的指南内容，确保官方参考链接有效；不要为了虚假“新鲜度”批量修改日期。Sitemap 当前省略 `lastmod`，避免把每次构建时间当成内容修改时间。

可选环境变量一览：

| 名称 | 值与用途 |
| --- | --- |
| `SITE_URL` | 可选的正式域名覆盖值；Vercel 中不设置时采用 `https://whatsp.vercel.app`，以后迁移可改为新 HTTPS origin |
| `GOOGLE_SITE_VERIFICATION` | Google 的 HTML 验证 token，可不填 |
| `BING_SITE_VERIFICATION` | Bing 的 HTML 验证 token，可不填 |
| `PORT` / `HOST` | 仅本地预览使用，默认 `4173` / `127.0.0.1` |

所有验证 token 会公开出现在 HTML 中，仅填写站点验证值，不要填写密码、API 密钥或其他凭证。构建脚本只读取进程环境变量；本地测试用 PowerShell 的 `$env:SITE_URL = "https://your-domain.com"` 设置，`.env` 文件不会自动加载。

Sitemap 提交流程参见 [Google 构建和提交 Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)、[Bing Sitemaps](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed)；内容质量参见 [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a)。这些技术配置为抓取与理解页面提供基础，不能保证收录时间、排名或搜索展示样式。

## 响应头与维护

Vercel 配置提供内容类型嗅探保护、禁止页面嵌入、来源策略、权限策略和 CSP；CSP 允许本站脚本、样式及内联 JSON-LD。未加入分析、广告或第三方字体服务。资源缓存为一小时并要求过期后重新验证；替换资源后如需立即刷新，可修改资源 URL 的版本参数。

上线后自行启用统计、表单或广告前，应同步调整 CSP 和隐私页面。本站部署不需要 WhatsApp 账号、扫码、手机号或验证码；用户通过按钮进入官方 WhatsApp Web 后，由官方服务完成登录和通信。
