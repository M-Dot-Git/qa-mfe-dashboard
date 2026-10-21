import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "qa_dashboard",
      filename: "remoteEntry.js",
      exposes: { "./App": "./src/App.tsx" },
      shared: ["react", "react-dom"]
    })
  ],
  server: {
    port: 3001,
    strictPort: true,
    proxy: { "/api": "http://localhost:8000" }
  },
  preview: { port: 3001, strictPort: true },
  build: { target: "esnext", modulePreload: false, cssCodeSplit: false }
});
