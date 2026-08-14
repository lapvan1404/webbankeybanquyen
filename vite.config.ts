// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    optimizeDeps: {
      include: ["use-sync-external-store/shim/with-selector"],
    },
    server: {
      proxy: {
        "/api/admin": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/auth": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/store": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/cart": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/orders": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/product-keys": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/products": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/categories": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/brands": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/banners": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/upload": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
        "/api/reviews": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }
              if (id.includes("@tanstack")) {
                return "vendor-tanstack";
              }
              if (id.includes("lucide-react") || id.includes("@radix-ui")) {
                return "vendor-ui";
              }
              if (id.includes("recharts")) {
                return "vendor-charts";
              }
              return "vendor";
            }
          },
        },
      },
    },
  },
});
