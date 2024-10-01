import "../style.css";
import "../../assets/main.css";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import Header from "@/components/header.tsx";
import { AuthProvider } from "@/components/auth-privider.tsx";

export default defineContentScript({
  matches: ["<all_urls>"],
  excludeMatches: [
    "*://www.youtube.com/*",
    "*://medium.com/*",
    "*://flashpath-frontend.vercel.app/*",
  ],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "wxt-react-example",
      position: "inline",
      anchor: "body",
      append: "first",
      onMount: (container) => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement("div");
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);
        root.render(
          <ThemeProvider>
            <AuthProvider>
              <Header />
              <App />
            </AuthProvider>
          </ThemeProvider>
        );
        return { root, wrapper };
      },
      onRemove: (elements) => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    ui.mount();
  },
});
