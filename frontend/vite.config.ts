import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const puckCorePath = path.resolve(
  __dirname,
  "../packages/webapp-libs/weditor/wwai_puck/packages/core"
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      {
        find: "puck-internal",
        replacement: path.resolve(
          __dirname,
          "../packages/webapp-libs/weditor/wwai_puck/packages/core/components/Puck/components/Preview/wwai"
        ),
      },
      // Handle CSS import first (more specific)
      {
        find: "@measured/puck/puck.css",
        replacement: path.join(puckCorePath, "dist/index.css"),
      },
      {
        find: "@measured/puck/puck.css?inline",
        replacement: path.join(puckCorePath, "dist/index.css?inline"),
      },
      // Directly alias @measured/puck to the local dist - bypasses npm link caching
      {
        find: "@measured/puck",
        replacement: path.join(puckCorePath, "dist/index.mjs"),
      },
      {
        find: "liquid-compiler",
        replacement: path.resolve(__dirname, "../packages/liquid-compiler"),
      },
      // Resolve liquid-compiler's deps from frontend node_modules (package has no own node_modules)
      { find: "liquidjs", replacement: path.resolve(__dirname, "node_modules/liquidjs") },
      { find: "color", replacement: path.resolve(__dirname, "node_modules/color") },
    ],
    preserveSymlinks: true,
  },
  // Don't pre-bundle puck since we're using direct alias
  optimizeDeps: {
    exclude: ["@measured/puck"],
  },
  server: {
    fs: {
      allow: [
        // allow linked local packages outside root
        path.resolve(__dirname, ".."),
        path.resolve(__dirname, "../packages/webapp-libs/weditor/wwai_puck"),
        path.resolve(__dirname, "../packages/liquid-compiler"),
      ],
    },
    // Explicitly watch the Puck dist folder
    watch: {
      ignored: ["!**/wwai_puck/packages/core/dist/**"],
    },
    proxy: {
      "/api": {
        target: "http://0.0.0.0:8020/api",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
      "/mock": {
        target: "http://0.0.0.0:8020",
        changeOrigin: true,
      },
      "/admin": {
        target: "http://0.0.0.0:8020/admin/",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/admin/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          react: ['react', 'react-dom'],
          // Router
          router: ['react-router-dom'],
          // UI library
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Form handling
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
          // API & State
          query: ['@tanstack/react-query', 'axios'],
          // Utilities
          utils: ['lodash'],
        },
      },
    },
  },
});
