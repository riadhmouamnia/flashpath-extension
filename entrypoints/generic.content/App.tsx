import { useEffect, useState } from "react";
import { MessageType } from "@/entrypoints/types";
import Interactions from "@/components/interactions";
import { useTheme } from "@/components/theme-provider";
import { hideUi, setThemeToBody, showUi } from "@/lib/utils";
import Notes from "@/components/shared/notes";
import { useAuthContext } from "@/components/auth-privider";

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const { toggleTheme } = useTheme();
  const [path, setPath] = useState<string>("");
  const { user } = useAuthContext();

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
      } else if (message.messageType === MessageType.CREATE_PATH) {
        setPath(message.data);
      }
      return true;
    });
  }, []);

  if (!user) return;

  return (
    <div className="h-screen">
      <p>Logged in as {user.username}</p>
      {path ? <p>"path: " {path}</p> : <p>path: no path found!</p>}
      {/* <p>{url}</p>
      <p>Generic.</p> */}
      <Notes tabUrl={url} />
      <Interactions tabUrl={url} />
    </div>
  );
};
