import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";

const peerDependencies = Object.keys(pkg.peerDependencies || {});

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build:
    mode === "library"
      ? {
          css: {
            postcss: {
              plugins: [tailwindcss],
            },
          },
          lib: {
            entry: path.resolve(__dirname, "src/index.tsx"),
            minify: false,
            name: "CpraMpUi",
            fileName: "cpra-mp-ui",
          },
          rollupOptions: {
            // Externalize peer dependencies
            external: [...peerDependencies],
            output: {
              // Global variables to use in the UMD build for externalized deps
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
              },
            },
          },
        }
      : undefined,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
