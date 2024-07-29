import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ["bookmarks", "storage"],
    // action: {},
    // name: "__MSG_extName__",
    // description: "__MSG_extDescription__",
    // default_locale: "en",
  },
  // modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [react()],
  }),
  runner: {
    startUrls: ["https://github.com/riadhmouamnia"],
  },
});
