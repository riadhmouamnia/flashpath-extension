import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageType } from "@/entrypoints/types";
import Interactions from "@/components/interactions";
import { useTheme } from "@/components/theme-provider";
import { setThemeToBody } from "@/lib/utils";

export default () => {
  const [count, setCount] = useState(1);
  const increment = () => setCount((count) => count + 1);
  const [url, setUrl] = useState(window.location.href);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("content:");
      console.log(message);
      if (message.messageType == MessageType.TAB_CHANGE) {
        const tabUrl = message.data.url;
        setUrl(tabUrl);
      } else if (message.messageType == MessageType.URL_CHANGE) {
        const url = message.data.url;
        setUrl(url);
      } else if (message.messageType == MessageType.CHANGE_THEME) {
        const newTheme = message.content;
        toggleTheme(newTheme);
        setThemeToBody(newTheme);
      }
    });
  }, []);

  return (
    <div>
      <p>{url}</p>
      <p>Generic. {count}</p>
      <Button onClick={increment}>Increment</Button>
      <Interactions tabUrl={url} />
    </div>
  );
};
