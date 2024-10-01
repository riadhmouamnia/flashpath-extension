import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ["bookmarks", "storage", "cookies"],
    host_permissions: [
      "https://flashpath-frontend.vercel.app/*",
      "https://clerk.profyx.io/*",
      "https://clerk.com/*",
      // "*//foo.clerk.accounts.dev/*",
    ],
    // name: "__MSG_extName__",
    // description: "__MSG_extDescription__",
    // default_locale: "en",
  },
  // modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [react()],
  }),
  runner: {
    startUrls: [
      "https://github.com/riadhmouamnia",
      // "https://medium.com/",
      // "https://www.youtube.com/watch?v=9noryYsLaiQ&t=3s&ab_channel=Requestly",
      // "https://flashpath-frontend.vercel.app/",
    ],
  },
});
