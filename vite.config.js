import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  base: process.env.BASE ?? '/',
  build: { outDir: '../dist', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
