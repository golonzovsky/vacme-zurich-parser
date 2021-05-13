const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(createProxyMiddleware('/api/', {
    //"target": "http://localhost:8080",
    "target": "https://vacme.kloud.top",
    "changeOrigin": true,
    logLevel: 'warn'
  }));
};