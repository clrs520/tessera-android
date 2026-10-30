import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    fs.readFile(p, (err, buf) => {
        if (err) { res.writeHead(404); res.end('no'); return; }
        res.writeHead(200, { 'Content-Type': p.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' });
        res.end(buf);
    });
}).listen(8791, '127.0.0.1', () => console.log('serving 8791'));
