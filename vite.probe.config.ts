import { defineConfig } from "vite";
import path from "node:path";

// Minimal config for driving the portal's own helpers under vite-node, so the
// URL builders are exercised as the app builds them rather than as a probe
// re-implements them. No plugins: `probe.ts` imports `helpers/` only -- plain
// TS with no JSX and no CSS, which is also why the chart-picker rule it needs
// lives on `Structure` rather than inside `VisualizationSelect`.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
