import { CiDark, CiLight } from "react-icons/ci";
import { useTheme } from "@/components/theme-provider";
import { Button } from "./ui/button";

export default function ToggleThemeButton() {
  const { theme, toggleTheme } = useTheme();

  const handleToggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    toggleTheme(newTheme);
    const element = document.querySelector("wxt-react-example");
    if (element) {
      const shadowRoot = element.shadowRoot;
      if (shadowRoot) {
        const body = shadowRoot.querySelector("body");
        if (body) {
          body.className = newTheme;
        }
      }
    }
    await browser.storage.local.set({
      theme: newTheme,
    });
  };
  return (
    <Button onClick={handleToggleTheme} size="icon" variant="ghost">
      {theme === "light" ? (
        <CiDark className="fp-text-lg" />
      ) : (
        <CiLight className="fp-text-lg" />
      )}
    </Button>
  );
}
