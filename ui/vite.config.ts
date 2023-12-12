import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { checker } from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

const manifestForPlugIn = {
  includeAssests: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
  manifest: {
    background_color: "#f0e7db",
    description: "I am a polygonID vite app",
    display: "standalone",
    icons: [
      {
        purpose: "favicon",
        sizes: "192x192",
        src: "/android-chrome-192*192.png",
        type: "image/png",
      },
      {
        purpose: "favicon",
        sizes: "512x512",
        src: "/android-chrome-512x512.png",
        type: "image/png",
      },
      {
        purpose: "apple touch icon",
        sizes: "180x180",
        src: "/apple-touch-icon.png",
        type: "image/png",
      },
      {
        purpose: "any maskable",
        sizes: "192x192",
        src: "/maskable_icon.png",
        type: "image/png",
      },
    ],
    name: "PolygonID",
    orientation: "portrait",
    scope: "/",
    short_name: "PolygonID",
    start_url: "/src/index.tsx",
    theme_color: "#171717",
  },
  registerType: "prompt",
};
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [
    VitePWA(manifestForPlugIn),
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
