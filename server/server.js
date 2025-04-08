// server/server.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Content Security Policy middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " + 
    "script-src 'self' 'unsafe-inline' https://maps.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' https://images.unsplash.com https://randomuser.me https://cdn-icons-png.flaticon.com data:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "frame-src 'self' https://www.google.com; " +
    "connect-src 'self'"
  );
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/images/favicon.ico'));
});

// Handle all routes (SPA-like behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Dixie Auto Land server running on port ${PORT}`);
}); 