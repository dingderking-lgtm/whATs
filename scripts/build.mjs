import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, pages, productionSiteUrl, resolveBuildOptions, escapeMarkup } from './config.mjs';

export async function buildSite({ source = root, output = path.join(root, 'dist'), env = process.env, quiet = false } = {}) {
  const options = resolveBuildOptions(env);
  if (options.localFallback && !quiet) console.warn(`[本地预览] 使用 http://localhost:4173 并设置 noindex；Vercel 正式构建默认使用 ${productionSiteUrl}。`);
  const htmlSources = await Promise.all(pages.map(async page => ({ ...page, html: await fs.readFile(path.join(source, page.file), 'utf8') })));
  await fs.access(path.join(source, 'assets'));
  const outputPath = path.resolve(output);
  // Delete only this build's output folder, never the source or a parent folder.
  const relative = path.relative(path.resolve(source), outputPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('构建输出必须位于源码目录的独立子目录。');
  await fs.rm(outputPath, { recursive: true, force: true });
  await fs.mkdir(outputPath, { recursive: true });
  await fs.cp(path.join(source, 'assets'), path.join(outputPath, 'assets'), { recursive: true });
  const verification = Object.entries(options.verification)
    .filter(([, value]) => value)
    .map(([name, value]) => `<meta name="${name}" content="${escapeMarkup(value)}">`)
    .join('\n  ');
  for (const page of htmlSources) {
    const robots = options.noindex || !page.indexable ? 'noindex, follow' : 'index, follow, max-image-preview:large';
    let html = page.html.replaceAll('{{SITE_URL}}', () => options.siteUrl).replaceAll('{{ROBOTS}}', () => robots).replaceAll('{{SITE_VERIFICATION}}', () => verification);
    // Enforce indexation policy even if the source has a literal robots tag.
    const robotsTag = `<meta name="robots" content="${robots}">`;
    if (/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/i.test(html)) {
      html = html.replace(/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/gi, robotsTag);
    } else {
      html = html.replace(/<\/head>/i, `  ${robotsTag}\n</head>`);
    }
    if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error(`${page.file} 含有未替换的构建变量。`);
    await fs.writeFile(path.join(outputPath, page.file), html, 'utf8');
  }
  const urls = options.noindex ? [] : pages.filter(page => page.indexable).map(page => `${options.siteUrl}${page.route}`);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escapeMarkup(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  // Preview pages remain crawlable so compliant crawlers can read their noindex meta tag.
  const robots = `User-agent: *\nAllow: /\n${options.noindex ? '\n# This preview build has noindex HTML and no indexable sitemap URLs.\n' : `\nSitemap: ${options.siteUrl}/sitemap.xml\n`}`;
  await fs.writeFile(path.join(outputPath, 'sitemap.xml'), sitemap, 'utf8');
  await fs.writeFile(path.join(outputPath, 'robots.txt'), robots, 'utf8');
  if (!quiet) console.log(`构建完成：${outputPath}\n规范域名：${options.siteUrl}\n抓取策略：${options.noindex ? 'noindex（预览）' : 'index（生产）'}\n页面：${pages.length}；Sitemap URL：${urls.length}`);
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildSite().catch(error => { console.error(`构建失败：${error.message}`); process.exitCode = 1; });
}
