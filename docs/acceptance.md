# 交付验收记录

日期：2026-10-23（Asia/Shanghai）。当前交付为本地完成的 Vercel 静态网站源码，未执行用户 Vercel 账号下的生产部署。

## 内容与资源

- 本轮扩展为 8 个 HTML 页面：首页、使用教程、故障排查、消息与文件指南、网页版与桌面版比较、关于本站、隐私说明、404；正式构建的 Sitemap 包含其中 7 个内容页。
- 使用教程补充设备关联前准备、关联结果确认、日常使用与退出检查；新增指南分别覆盖具体问题，避免重复铺设同一组关键词。
- WhatsApp 标志来自 Meta 官方品牌资源，原始 SVG 未改色或变形，出处和校验值见 `sources.md`。
- 自绘聊天场景明确标注为示意；主入口与下载入口链接到 WhatsApp 官方域名。
- 正文直接存在于 HTML，网页无框架运行时、数据库、登录表单、第三方字体、分析脚本或 Cookie。
- 本地社交分享图 `assets/og-cover.png` 为 1200 × 630。

## 内容增强版本验收

- `npm run build`：1484 项静态检查通过，8 个页面的唯一标题/描述、H1、JSON-LD、canonical、内部链接、资源和锚点一致。
- `npm test`：4 项集成测试通过；覆盖生产/预览/自定义域名、所有内容路由的实际 HTML、各页验证标签、clean URL、404与HTTP方法。
- `html-validate 11.17.0`：8 个构建产物通过，0 错误、0 警告。表格滚动区域使用带标签的原生 section 并允许键盘聚焦。
- 首页与4篇指南分别在320、390、768、1440px视口检查，共20组；无整页横向溢出、H1超出或图片加载失败。宽表格只在容器内滚动，详情见本地 `qa/guide-responsive-results.json`。
- 手机端实测目录跳至退出章节、菜单打开和选择后关闭；版本对比表可聚焦并用右方向键横向滚动。
- 首页 Android/iPhone 步骤切换、新FAQ展开、指南目录进入消息文章均正常；浏览器日志未见页面错误或资源拦截。
- 首页SEO标题仍精确为 `WhatsApp 网页版`，已确认的元描述保持一致；Google/Bing验证值保留。
- 指南事实由官方来源核对，未操作真实WhatsApp账号，网站布局与交互验收不等于官方产品功能实测。
- 发布脚本已包含全部8个HTML源文件，并验证ZIP完整性、根目录Vercel配置与排除预览产物；部署包及SHA-256保存在 `release/`。

## 预览截图

- `qa/guide-hub-desktop.jpg`：首页四类指南入口。
- `qa/guide-expanded-mobile.jpg`：手机登录指南标题与目录。
- `qa/version-table-mobile.jpg`：手机对比表格局部滚动与焦点。

## 部署时的注意点

正式域名已确定为 `https://whatsp.vercel.app`。Vercel 构建使用此默认地址，显式 `SITE_URL` 可覆盖；不会再从自动项目域名推导 canonical。既有 `SITE_URL` 若指向旧域名，需要改为当前域名或删除。

当前 `dist/` 为本地预览构建，使用 localhost 和 noindex。请将交付源码导入 Vercel，采用 `npm run build` + `dist`，不要直接发布本地预览产物。

域名修复回归：4 项集成测试与1484项静态检查通过；生产构建8页 canonical、7条Sitemap及robots均指向 `whatsp.vercel.app`，Preview仍为noindex，验证标签保留。线上首次检查发现所有SEO地址指旧域名，随后目标域名返回Vercel `DEPLOYMENT_NOT_FOUND`；代码通过不代表线上绑定完成。当前可访问的同名Vercel项目连接另一个仓库，未修改其绑定或部署。Google/Bing站长工具内重新验证和Sitemap提交未执行。

截图保存在本地 `docs/qa/`，不作为网页运行资源，也不打入轻量源码部署包。
