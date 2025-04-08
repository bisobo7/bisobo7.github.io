const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Set security headers to fix CSP issues
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' https://images.unsplash.com https://randomuser.me https://cdn-icons-png.flaticon.com data:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "frame-src 'none'; " +
    "connect-src 'self'"
  );
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse URL to get the file path
  let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);
  
  // Handle favicon
  if (req.url === '/favicon.ico') {
    filePath = path.join(__dirname, '..', 'public', 'images', 'favicon.ico');
  }
  
  // Extract the file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  
  // Set content type
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Page not found
        fs.readFile(path.join(__dirname, '..', 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading the page');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
}); 