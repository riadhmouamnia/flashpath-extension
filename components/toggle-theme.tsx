import { CiDark, CiLight } from "react-icons/ci";
import { useTheme } from "@/components/theme-provider";
import { Button } from "./ui/button";
import { MessageType } from "@/entrypoints/types";
import { setThemeToBody } from "@/lib/utils";

export default function ToggleThemeButton() {
  const { theme, toggleTheme } = useTheme();

  const handleToggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    toggleTheme(newTheme);
    setThemeToBody(newTheme);
    await browser.runtime.sendMessage({
      messageType: MessageType.CHANGE_THEME,
      content: newTheme,
    });
    await browser.storage.local.set({
      theme: newTheme,
    });
  };

  return (
    <Button onClick={handleToggleTheme} size="icon" variant="ghost">
      {theme === "light" ? (
        <CiDark className="text-lg" />
      ) : (
        <CiLight className="text-lg" />
      )}
    </Button>
  );
}
