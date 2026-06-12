import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ⚡ Performance optimizations for fast loading
  build: {
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'query-vendor': ['@tanstack/react-query'],
          'auth-vendor': ['@clerk/clerk-react'],
          'async-vendor': ['sonner', 'zod'],
        },
      },
    },
    // Faster chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Source maps only in dev
    sourcemap: false,
  },
  // ⚡ Optimize deps
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@clerk/clerk-react',
      '@radix-ui/react-dialog',
      'sonner',
    ],
  },
});
