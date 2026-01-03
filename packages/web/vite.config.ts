import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const reactScan: () => PluginOption = () => ({
  name: "react-scan",
  apply: "serve",
  transformIndexHtml: (html) =>
    html.replace(
      "<!-- {{ React Scan Script }} -->",
      '<script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>'
    ),
});

export default defineConfig({
  plugins: [react(), tailwindcss(), reactScan()],
  server: {
    allowedHosts: [process.env.HOST ?? "localhost"],
  },
  resolve: {
    alias: {
      "~/backend": path.resolve(__dirname, "../backend/src"),

      "~/app": path.resolve(__dirname, "./src/app"),
      "~/pages": path.resolve(__dirname, "./src/pages"),
      "~/widgets": path.resolve(__dirname, "./src/widgets"),
      "~/features": path.resolve(__dirname, "./src/features"),
      "~/entities": path.resolve(__dirname, "./src/entities"),
      "~/shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
