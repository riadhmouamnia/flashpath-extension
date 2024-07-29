// ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext<{ theme: string; toggleTheme: Function }>({
  theme: "light",
  toggleTheme: (theme: string) => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: any }) => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = (theme: string) => {
    setTheme(theme);
  };

  async function initTheme() {
    let data = await browser.storage.local.get("theme");
    const element = document.querySelector("wxt-react-example");
    if (data.theme) {
      setTheme(data.theme);
      if (element) {
        const shadowRoot = element.shadowRoot;
        if (shadowRoot) {
          const body = shadowRoot.querySelector("body");
          if (body) {
            body.className = data.theme;
          }
        }
      }
    } else {
      await browser.storage.local.set({ theme: "light" });
      if (element) {
        const shadowRoot = element.shadowRoot;
        if (shadowRoot) {
          const body = shadowRoot.querySelector("body");
          if (body) {
            body.className = "light";
          }
        }
      }
    }
  }

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
