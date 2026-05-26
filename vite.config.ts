import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
            external: [
              "jotai",
              "jotai/utils",
              "jotai-effect",
              "jotai-scope",
              "maplibre-gl",
              "react",
              "react-dom",
              "react-dom/client",
              "react-dom/server",
              "react/jsx-runtime",
              "react/vega",
              "vega-embed",
              "vega-lite",
            ],
            output: {
              globals: {
                jotai: "Jotai",
                "jotai/utils": "JotaiUtils",
                "jotai-effect": "JotaiEffect",
                "jotai-scope": "JotaiScope",
                "maplibre-gl": "MapLibreGl",
                react: "React",
                "react-dom": "ReactDOM",
                "react-dom/client": "ReactDOMClient",
                "react-dom/server": "ReactDOMServer",
                "react/jsx-runtime": "jsxRuntime",
                "react/vega": "ReactVega",
                "vega-lite": "VegaLite",
                "vega-embed": "VegaEmbed",
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
