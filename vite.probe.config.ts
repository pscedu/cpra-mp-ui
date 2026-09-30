import { defineConfig } from "vite";
import path from "node:path";

// Minimal config for driving the portal's own helpers under vite-node, so the
// URL builders are exercised as the app builds them rather than as a probe
// re-implements them. No plugins: `probe.ts` imports `helpers/` only, which is
// plain TS with no JSX and no CSS.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
