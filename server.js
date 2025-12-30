#!/usr/bin/env node

// 使用 CommonJS 语法，确保 pkg 能正常打包
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 3000;

// 调试输出：打印当前工作目录和__dirname
console.log('===================================');
console.log('Debug Information:');
console.log('Current Working Directory:', process.cwd());
console.log('__dirname:', __dirname);

// 处理pkg打包后的路径问题
const DIST_DIR = path.join(process.cwd(), 'dist');
console.log('DIST_DIR:', DIST_DIR);
console.log('===================================');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Create server
const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  let fullPath = path.join(DIST_DIR, filePath);
  
  // Handle SPA routing - return index.html for all non-file requests
  if (!path.extname(fullPath)) {
    fullPath = path.join(DIST_DIR, 'index.html');
  }
  
  // Read and serve file
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      // If file not found, serve index.html for SPA
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, indexContent) => {
        if (err2) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent);
        }
      });
    } else {
      // Serve the requested file
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log('===================================');
  console.log('XYZW Token Manager');
  console.log('===================================');
  console.log('Server started on port', PORT);
  console.log('Access URL: http://localhost:' + PORT);
  console.log('Press Ctrl+C to stop server');
  console.log('===================================');
  
  // Try to open browser
  try {
    const { exec } = require('child_process');
    exec(`start http://localhost:${PORT}`);
  } catch (error) {
    // Ignore error
  }
});
