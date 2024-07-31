import { useEffect, useState } from "react";
import { MessageType } from "@/entrypoints/types";
// import Interactions from "@/components/interactions";
import { useTheme } from "@/components/theme-provider";
import { setThemeToBody, toggle } from "@/lib/utils";
import Notes from "@/components/shared/notes";

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("content:");
      console.log(message);
      if (message.messageType == MessageType.TAB_CHANGE) {
        const tabUrl = message.data.url;
        setUrl(tabUrl);
      } else if (message.messageType === MessageType.URL_CHANGE) {
        const url = message.data.url;
        setUrl(url);
      } else if (message.messageType === MessageType.CHANGE_THEME) {
        const newTheme = message.content;
        toggleTheme(newTheme);
        setThemeToBody(newTheme);
      } else if (message.messageType === MessageType.CLICK_EXTENSION) {
        toggle();
      }
    });
  }, []);

  return (
    <div className="h-screen">
      <p>{url}</p>
      <p>Generic.</p>
      <Notes tabUrl={url} />
      {/* <Interactions tabUrl={url} /> */}
    </div>
  );
};
