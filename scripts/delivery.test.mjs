import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { root, pages, resolveBuildOptions } from './config.mjs';
import { buildSite } from './build.mjs';
import { checkSite } from './check.mjs';
import { createPreviewServer } from './serve.mjs';

test('未定域名：本地 noindex，生产采用稳定 Vercel 域名，自定义域名优先', () => {
  assert.deepEqual({ url: resolveBuildOptions({}).siteUrl, noindex: resolveBuildOptions({}).noindex }, { url: 'http://localhost:4173', noindex: true });
  const production = resolveBuildOptions({ VERCEL: '1', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'my-guide.vercel.app', VERCEL_URL: 'ephemeral-123.vercel.app' });
  assert.equal(production.siteUrl, 'https://my-guide.vercel.app');
  assert.equal(production.noindex, false);
  assert.equal(resolveBuildOptions({ SITE_URL: 'https://guide.example.com/', VERCEL_PROJECT_PRODUCTION_URL: 'old.vercel.app' }).siteUrl, 'https://guide.example.com');
  assert.equal(resolveBuildOptions({ VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'my-guide.vercel.app' }).noindex, true);
});

test('阻止错误 canonical 配置和无正式域名的 Vercel 构建', () => {
  for (const SITE_URL of ['javascript:alert(1)', 'https://example.com/subpath', 'https://example.com/?q=1', 'https://user:password@example.com', 'http://example.com']) {
    assert.throws(() => resolveBuildOptions({ SITE_URL }), undefined, SITE_URL);
  }
  assert.throws(() => resolveBuildOptions({ VERCEL: '1', VERCEL_ENV: 'production' }), /缺少正式域名/);
  assert.throws(() => resolveBuildOptions({ VERCEL: '1', VERCEL_ENV: 'production', SITE_URL: 'http://localhost:4173' }), /公开的 HTTPS/);
});

test('默认读取进程环境，显式 env 对象不继承宿主生产变量', () => {
  const keys = ['VERCEL', 'VERCEL_ENV', 'VERCEL_TARGET_ENV', 'VERCEL_PROJECT_PRODUCTION_URL', 'SITE_URL', 'GOOGLE_SITE_VERIFICATION', 'BING_SITE_VERIFICATION'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.SITE_URL = 'https://host-production.example.com';
    process.env.GOOGLE_SITE_VERIFICATION = 'host-token';
    assert.equal(resolveBuildOptions().siteUrl, 'https://host-production.example.com');
    assert.equal(resolveBuildOptions().noindex, false);
    assert.equal(resolveBuildOptions({}).siteUrl, 'http://localhost:4173');
    assert.equal(resolveBuildOptions({}).verification['google-site-verification'], undefined);
    const preview = resolveBuildOptions({ VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'preview-target.example.com' });
    assert.equal(preview.siteUrl, 'https://preview-target.example.com');
    assert.equal(preview.noindex, true);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test('真实 HTML 的生产与预览产物、验证标签、clean URL 及404行为', async t => {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'whatsapp-delivery-'));
  t.after(async () => {
    if (!path.basename(workspace).startsWith('whatsapp-delivery-') || path.dirname(workspace) !== path.resolve(os.tmpdir())) throw new Error('拒绝清理非测试目录');
    await fs.rm(workspace, { recursive: true, force: true });
  });
  for (const page of pages) await fs.copyFile(path.join(root, page.file), path.join(workspace, page.file));
  await fs.cp(path.join(root, 'assets'), path.join(workspace, 'assets'), { recursive: true });
  const output = path.join(workspace, 'dist');
  await buildSite({ source: workspace, output, env: { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'test-guide.vercel.app', GOOGLE_SITE_VERIFICATION: 'google-token', BING_SITE_VERIFICATION: 'bing-token' }, quiet: true });
  const production = await checkSite(output, { quiet: true });
  assert.equal(production.noindex, false);
  const index = await fs.readFile(path.join(output, 'index.html'), 'utf8');
  assert.match(index, /name="google-site-verification" content="google-token"/);
  assert.match(index, /name="msvalidate.01" content="bing-token"/);
  assert.ok((await fs.readFile(path.join(workspace, 'index.html'), 'utf8')).includes('{{SITE_URL}}'), '构建不能改写 HTML 源码');
  const server = await createPreviewServer({ directory: output });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const route of ['/', '/guide', '/about', '/privacy']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
  }
  for (const route of ['/missing-page', '/assets/missing.svg', '/README.md']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 404, route);
    assert.match(await response.text(), /noindex/);
  }
  const redirect = await fetch(`${base}/guide.html?from=test`, { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/guide?from=test');
  const head = await fetch(`${base}/`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 405);
  await buildSite({ source: workspace, output, env: { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'test-guide.vercel.app' }, quiet: true });
  assert.equal((await checkSite(output, { quiet: true })).noindex, true);
  assert.doesNotMatch(await fs.readFile(path.join(output, 'sitemap.xml'), 'utf8'), /<loc>/);
  assert.match(await fs.readFile(path.join(output, 'index.html'), 'utf8'), /name="robots" content="noindex, follow"/);
  await buildSite({ source: workspace, output, env: { SITE_URL: 'https://custom-domain.example.com', GOOGLE_SITE_VERIFICATION: 'token"<>&$&' }, quiet: true });
  assert.equal((await checkSite(output, { quiet: true })).origin, 'https://custom-domain.example.com');
  const customIndex = await fs.readFile(path.join(output, 'index.html'), 'utf8');
  assert.match(customIndex, /content="token&quot;&lt;&gt;&amp;\$&amp;"/);
  assert.doesNotMatch(customIndex, /test-guide\.vercel\.app/);
  assert.match(await fs.readFile(path.join(output, 'sitemap.xml'), 'utf8'), /https:\/\/custom-domain\.example\.com\/guide/);
});
