import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number.parseInt(process.env.PORT || '5500', 10);
const host = process.env.HOST || '127.0.0.1';
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
  const requested = relativePath || 'index.html';
  const filePath = resolve(root, normalize(requested));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Frontend available at http://${host}:${port}`);
});
