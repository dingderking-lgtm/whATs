import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, pages, attributes } from './config.mjs';

export async function checkSite(output = path.join(root, 'dist'), { quiet = false } = {}) {
  const errors = [];
  let checks = 0;
  const assert = (condition, message) => { checks++; if (!condition) errors.push(message); };
  const documents = new Map();
  for (const page of pages) documents.set(page.route, { ...page, html: await fs.readFile(path.join(output, page.file), 'utf8') });
  const titles = new Set();
  const descriptions = new Set();
  let origin;
  let noindex;
  for (const page of documents.values()) {
    const label = page.file;
    const html = page.html;
    assert(/^\s*<!doctype html>/i.test(html), `${label}: 缺少 HTML5 doctype`);
    assert(/<html\b[^>]*lang=["']zh(?:-CN|-Hans)?["']/i.test(html), `${label}: 需要中文 lang 属性`);
    assert(/<meta\b[^>]*charset=["']?utf-8/i.test(html), `${label}: 缺少 UTF-8 charset`);
    assert(!/\{\{[A-Z_]+\}\}/.test(html), `${label}: 遗留构建占位符`);
    const titlesFound = [...html.matchAll(/<title>([^<]+)<\/title>/gi)];
    const title = titlesFound[0]?.[1]?.trim();
    assert(titlesFound.length === 1 && Boolean(title), `${label}: 需要一个非空 title`);
    assert(!titles.has(title), `${label}: title 与其他页面重复`);
    titles.add(title);
    const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    assert(headings.length === 1 && headings[0][1].replace(/<[^>]*>/g, '').trim(), `${label}: 需要一个有内容的 H1`);
    assert(/<main\b/i.test(html), `${label}: 缺少 main 地标`);
    const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
    const meta = name => metas.find(item => item.name?.toLowerCase() === name || item.property?.toLowerCase() === name)?.content;
    const description = meta('description');
    assert(Boolean(description?.trim()), `${label}: 缺少 description`);
    assert(!descriptions.has(description), `${label}: description 与其他页面重复`);
    descriptions.add(description);
    assert(meta('viewport')?.includes('width=device-width'), `${label}: 缺少响应式 viewport`);
    const canonicalTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(link => link.rel === 'canonical');
    assert(canonicalTags.length === 1, `${label}: 需要一个 canonical`);
    const canonical = canonicalTags[0]?.href;
    try {
      const canonicalUrl = new URL(canonical);
      origin ??= canonicalUrl.origin;
      assert(canonical === `${origin}${page.route}`, `${label}: canonical 不匹配规范 clean URL`);
    } catch { assert(false, `${label}: canonical 不是绝对网址`); }
    const robots = meta('robots') || '';
    if (page.route === '/') noindex = /\bnoindex\b/i.test(robots);
    assert(metas.filter(item => item.name?.toLowerCase() === 'robots').length === 1, `${label}: 需要且仅有一个 robots 标签`);
    assert(page.indexable ? /\bnoindex\b/i.test(robots) === noindex : /\bnoindex\b/i.test(robots), `${label}: robots 与构建策略不一致`);
    if (page.indexable) {
      assert(meta('og:url') === canonical, `${label}: og:url 必须与 canonical 一致`);
      assert(Boolean(meta('og:title')) && Boolean(meta('og:description')), `${label}: 缺少 Open Graph 元数据`);
      const structured = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      assert(structured.length > 0, `${label}: 缺少 JSON-LD`);
      for (const [, value] of structured) {
        try {
          const data = JSON.parse(value);
          assert(Boolean(data['@context']) && Boolean(data['@type'] || data['@graph']), `${label}: JSON-LD 缺少 context/type`);
        } catch { assert(false, `${label}: JSON-LD 不是合法 JSON`); }
      }
    }
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
    assert(new Set(ids).size === ids.length, `${label}: 重复的 HTML ID`);
    for (const image of [...html.matchAll(/<img\b[^>]*>/gi)].map(match => attributes(match[0]))) {
      assert(Object.hasOwn(image, 'alt'), `${label}: 图片 ${image.src} 缺少 alt`);
    }
  }
  async function checkUrl(raw, page, kind = '链接') {
    if (/^(mailto:|tel:|data:)/i.test(raw)) return;
    assert(Boolean(raw) && raw !== '#', `${page.file}: ${kind}为空`);
    if (!raw || raw === '#') return;
    let url;
    try { url = new URL(raw.replaceAll('&amp;', '&'), `${origin}${page.route}`); }
    catch { assert(false, `${page.file}: 无效${kind} ${raw}`); return; }
    assert(['http:', 'https:'].includes(url.protocol), `${page.file}: 非法 URL 协议 ${raw}`);
    if (url.origin !== origin) {
      assert(url.protocol === 'https:', `${page.file}: 外链应为 HTTPS ${raw}`);
      return;
    }
    const route = url.pathname;
    assert(!route.endsWith('.html'), `${page.file}: 使用 clean URL，移除 ${raw} 的 .html`);
    const target = documents.get(route);
    if (target) {
      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1));
        const targetIds = [...target.html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
        assert(targetIds.includes(id), `${page.file}: 锚点不存在 ${raw}`);
      }
      return;
    }
    const file = path.resolve(output, `.${decodeURIComponent(route)}`);
    const relative = path.relative(output, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { assert(false, `${page.file}: 路径越界 ${raw}`); return; }
    try { assert((await fs.stat(file)).isFile(), `${page.file}: ${kind}不是文件 ${raw}`); }
    catch { assert(false, `${page.file}: ${kind}不存在 ${raw}`); }
  }
  for (const page of documents.values()) {
    for (const match of page.html.matchAll(/<(?:a|link|img|script|source|use)\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      for (const key of ['href', 'src', 'xlink:href']) if (Object.hasOwn(attrs, key)) await checkUrl(attrs[key], page, key);
      if (attrs.target === '_blank') assert(/\bnoopener\b/.test(attrs.rel || ''), `${page.file}: 新窗口链接缺少 noopener`);
    }
    for (const match of page.html.matchAll(/<meta\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      if (['og:image', 'twitter:image'].includes(attrs.property || attrs.name)) await checkUrl(attrs.content, page, '分享图片');
    }
  }
  const sitemap = await fs.readFile(path.join(output, 'sitemap.xml'), 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  const expectedUrls = noindex ? [] : pages.filter(page => page.indexable).map(page => `${origin}${page.route}`);
  assert(JSON.stringify(sitemapUrls) === JSON.stringify(expectedUrls), 'Sitemap URL 清单不匹配（应排除404和 noindex 页面）');
  const robots = await fs.readFile(path.join(output, 'robots.txt'), 'utf8');
  assert(robots.includes('User-agent: *') && robots.includes('Allow: /'), 'robots.txt 应允许爬虫读取正文和 noindex');
  assert(noindex ? !robots.includes('Sitemap:') : robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt Sitemap 与环境不一致');
  const vercel = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
  assert(vercel.outputDirectory === 'dist' && vercel.cleanUrls === true && vercel.trailingSlash === false, 'Vercel 输出/路由配置不匹配');
  if (errors.length) throw new Error(`${errors.length} 项检查失败：\n- ${errors.join('\n- ')}`);
  if (!quiet) console.log(`静态验收通过：${checks} 项检查，${pages.length} 个页面；内部链接、资源、SEO、JSON-LD、Sitemap 和 robots 一致。`);
  return { checks, pages: pages.length, origin, noindex };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkSite().catch(error => { console.error(`验收失败：${error.message}`); process.exitCode = 1; });
}
