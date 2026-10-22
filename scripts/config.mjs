import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const pages = [
  { file: 'index.html', route: '/', indexable: true },
  { file: 'guide.html', route: '/guide', indexable: true },
  { file: 'about.html', route: '/about', indexable: true },
  { file: 'privacy.html', route: '/privacy', indexable: true },
  { file: '404.html', route: '/404', indexable: false },
];

export function resolveBuildOptions(env = process.env) {
  const target = env.VERCEL_TARGET_ENV || env.VERCEL_ENV || '';
  const onVercel = env.VERCEL === '1' || Boolean(target);
  const preview = onVercel && target !== 'production';
  const explicit = env.SITE_URL?.trim();
  const productionDomain = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (!explicit && !productionDomain && onVercel) {
    throw new Error('缺少正式域名：设置 SITE_URL=https://你的域名，或在 Vercel 开启 System Environment Variables，确保 VERCEL_PROJECT_PRODUCTION_URL 可用。');
  }
  const localFallback = !explicit && !productionDomain;
  const value = explicit || (productionDomain ? `https://${productionDomain}` : 'http://localhost:4173');
  let url;
  try { url = new URL(value); } catch { throw new Error('SITE_URL 必须是完整网址，例如 https://example.com。'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('SITE_URL 必须是纯站点 origin（协议+域名），不能包含路径、查询、片段或登录信息。');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (onVercel && (local || url.protocol !== 'https:')) throw new Error('Vercel 部署必须使用公开的 HTTPS SITE_URL，不能使用 localhost。');
  if (!local && url.protocol !== 'https:') throw new Error('公开站点请使用 HTTPS SITE_URL。');
  return {
    siteUrl: url.origin,
    noindex: preview || local,
    localFallback,
    preview,
    verification: {
      'google-site-verification': env.GOOGLE_SITE_VERIFICATION?.trim(),
      'msvalidate.01': env.BING_SITE_VERIFICATION?.trim(),
    },
  };
}

export function escapeMarkup(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
  }
  return result;
}
