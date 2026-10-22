import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './config.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2' };

export async function createPreviewServer({ directory = path.join(root, 'dist') } = {}) {
  const base = await fs.realpath(directory);
  const config = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
  return http.createServer(async (request, response) => {
    for (const header of config.headers[0].headers) response.setHeader(header.key, header.value.replace('; upgrade-insecure-requests', ''));
    response.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    let url;
    let pathname;
    try {
      url = new URL(request.url, 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
      if (/[\\\x00]/.test(pathname)) throw new Error('Invalid path');
    } catch { response.writeHead(400); response.end('Bad request'); return; }
    if (pathname.endsWith('.html') || (pathname !== '/' && pathname.endsWith('/'))) {
      let target = pathname.replace(/\.html$/, '').replace(/\/$/, '');
      if (target === '/index') target = '/';
      response.writeHead(308, { Location: `${target}${url.search}` }); response.end(); return;
    }
    const relativeFile = pathname === '/' ? 'index.html' : path.extname(pathname) ? pathname.slice(1) : `${pathname.slice(1)}.html`;
    let file = path.resolve(base, relativeFile);
    const relative = path.relative(base, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); response.end(); return; }
    let status = pathname === '/404' ? 404 : 200;
    try {
      const actual = await fs.realpath(file);
      const actualRelative = path.relative(base, actual);
      if (actualRelative.startsWith('..') || path.isAbsolute(actualRelative) || !(await fs.stat(actual)).isFile()) throw new Error('Not found');
    } catch { file = path.join(base, '404.html'); status = 404; }
    try {
      const content = await fs.readFile(file);
      response.writeHead(status, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': content.length });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch { response.writeHead(500); response.end('Build output is missing. Run npm run build.'); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || '127.0.0.1';
  createPreviewServer().then(server => {
    server.on('error', error => { console.error(`预览启动失败：${error.message}`); process.exitCode = 1; });
    server.listen(port, host, () => console.log(`预览已启动：http://${host}:${port}\n使用 Ctrl+C 停止。修改源码后重新运行 npm run build。`));
  }).catch(error => { console.error(`请先运行 npm run build。${error.message}`); process.exitCode = 1; });
}
