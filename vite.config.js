import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        register: resolve(__dirname, 'pages/register.html'),
        login: resolve(__dirname, 'pages/login.html'),
        library: resolve(__dirname, 'pages/library.html'),
        book: resolve(__dirname, 'pages/book.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        admin: resolve(__dirname, 'pages/admin.html'),
      },
    },
  },
});