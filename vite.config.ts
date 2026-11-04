import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const testReportsRemoteUrl =
    env.VITE_TEST_REPORTS_REMOTE_URL ?? "http://localhost:3005/assets/remoteEntry.js";

  return {
    plugins: [
      react(),
      federation({
        name: "qa_dashboard",
        filename: "remoteEntry.js",
        exposes: { "./App": "./src/App.tsx" },
        remotes: {
          qa_test_reports: {
            external: `Promise.resolve(${JSON.stringify(testReportsRemoteUrl)})`,
            externalType: "promise"
          }
        },
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
  };
});
