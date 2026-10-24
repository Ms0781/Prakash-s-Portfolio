const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/mp4'
};

const COMPRESSIBLE = new Set([
  'text/html; charset=utf-8',
  'application/javascript; charset=utf-8',
  'text/css; charset=utf-8',
  'application/json; charset=utf-8',
  'image/svg+xml'
]);

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (!path.extname(reqPath)) {
    if (fs.existsSync(path.join(ROOT_DIR, reqPath + '.html'))) {
      reqPath = reqPath + '.html';
    }
  }

  const filePath = path.join(ROOT_DIR, reqPath);

  // Security check: prevent directory traversal outside root and images symlink
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(ROOT_DIR) && !resolved.includes('prakash-images')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // ETag validation
    const etag = `W/"${stats.size.toString(16)}-${stats.mtimeMs.toString(16)}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304);
      res.end();
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'ETag': etag,
      'Connection': 'keep-alive'
    };

    // Cache static assets (images/fonts can be cached, but CSS/JS/HTML must always revalidate)
    if (['.css', '.js', '.html'].includes(ext)) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff2', '.woff'].includes(ext)) {
      headers['Cache-Control'] = 'public, max-age=86400';
    } else {
      headers['Cache-Control'] = 'no-cache';
    }

    // Range requests for video/audio streaming (safari & chrome video scrub/seek)
    if (ext === '.mp4' || ext === '.webm' || ext === '.mov') {
      headers['Accept-Ranges'] = 'bytes';
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunkSize = (end - start) + 1;

        headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
        headers['Content-Length'] = chunkSize;
        res.writeHead(206, headers);
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }

    // Gzip compression for text/code resources
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldGzip = COMPRESSIBLE.has(contentType) && acceptEncoding.includes('gzip') && stats.size > 1024;

    if (shouldGzip) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      const rawStream = fs.createReadStream(filePath);
      const gzipStream = zlib.createGzip({ level: 6 });
      rawStream.pipe(gzipStream).pipe(res);
    } else {
      headers['Content-Length'] = stats.size;
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

let currentPort = PORT;

function startServer(port) {
  currentPort = port;
  server.listen(port, '0.0.0.0');
}

server.on('listening', () => {
  const addr = server.address();
  console.log(`Server running at http://localhost:${addr.port}/`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${currentPort} in use, trying ${currentPort + 1}...`);
    startServer(currentPort + 1);
  } else {
    console.error('Server error:', e);
  }
});

startServer(PORT);
