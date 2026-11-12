/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SPA_404_HTML = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>CashUP — Перенаправление...</title>
    <script>
      (function () {
        var path = window.location.pathname;
        var search = window.location.search || '';
        var hash = window.location.hash || '';
        if (window.location.hostname.endsWith('.github.io')) {
          var parts = path.split('/').filter(Boolean);
          var repoBase = parts.length > 0 ? '/' + parts[0] + '/' : '/';
          var subRoute = parts.length > 1 ? '/' + parts.slice(1).join('/') : '/';
          window.location.replace(repoBase + '#' + subRoute + search + hash);
        } else {
          window.location.replace('/#' + path + search + hash);
        }
      })();
    </script>
  </head>
  <body></body>
</html>
`;

function githubPagesPlugin(): Plugin {
  return {
    name: 'cashup-github-pages',
    transformIndexHtml(html) {
      return html.replace(
        /<script data-raw-static-fallback>[\s\S]*?<\/script>\s*/g,
        ''
      );
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '.nojekyll',
        source: '',
      });
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: SPA_404_HTML,
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), githubPagesPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
          validation: ['zod'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testSetup.ts'],
    css: true,
  },
});
