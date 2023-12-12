import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { checker } from "vite-plugin-checker";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: ".../wwwroot/",
  },
  plugins: [
    checker({
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
      overlay: false,
      typescript: true,
    }),
    react(),
    svgr(),
    tsconfigPaths(),
  ],
});
