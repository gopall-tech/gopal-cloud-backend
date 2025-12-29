const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 8080;
const buildDir = path.join(__dirname, 'build');
const mimeTypes = { 
    '.html': 'text/html', 
    '.js': 'application/javascript', 
    '.css': 'text/css', 
    '.json': 'application/json', 
    '.png': 'image/png', 
    '.jpg': 'image/jpeg', 
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    try {
        let urlPath = req.url.split('?')[0];
        if (urlPath === '/') urlPath = '/index.html';
        const filePath = path.join(buildDir, urlPath);

        if (!filePath.startsWith(buildDir)) {
            res.writeHead(400);
            return res.end('Bad Request');
        }

        fs.stat(filePath, (err, stats) => {
            if (!err && stats.isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
                fs.createReadStream(filePath).pipe(res);
            } else {
                const indexPath = path.join(buildDir, 'index.html');
                fs.readFile(indexPath, (readErr, data) => {
                    if (readErr) {
                        res.writeHead(500);
                        res.end('Error loading index.html');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(data);
                    }
                });
            }
        });
    } catch (e) {
        res.writeHead(500);
        res.end('Internal Server Error');
    }
});

server.listen(port, () => {
    console.log('?? Server running on port ' + port);
});
