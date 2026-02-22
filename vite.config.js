import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    base: process.env.VITE_BASE || '/',
    server: {
        proxy: {
            // 开发时通过同源代理访问 Yahoo，避免浏览器 CORS 拦截；未命中时会返回 index.html 导致 JSON 解析报错
            '/api/yahoo-chart': {
                target: 'https://query1.finance.yahoo.com',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/yahoo-chart/, ''); },
                secure: true,
                configure: function (proxy) {
                    proxy.on('proxyReq', function (proxyReq) {
                        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
                        proxyReq.setHeader('Accept', 'application/json');
                        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
                        proxyReq.setHeader('Referer', 'https://finance.yahoo.com/');
                        proxyReq.setHeader('Origin', 'https://finance.yahoo.com');
                    });
                },
            },
        },
    },
});
