import { useEffect, useState } from "react";
import { MessageType } from "@/entrypoints/types";
import Interactions from "@/components/interactions";
import { useTheme } from "@/components/theme-provider";
import { hideUi, setThemeToBody, showUi } from "@/lib/utils";
import Notes from "@/components/shared/notes";
// import { useAuthContext } from "@/components/auth-privider";
import { Button } from "@/components/ui/button";

type User = {
  username: string;
  email: string;
  id: string;
};

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const { toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [path, setPath] = useState<string>("");
  // const { user }: any = useAuthContext();

  useEffect(() => {
    // send message to background script when first load to check if we have a user
    async function loadUser() {
      await browser.storage.local.get("user").then((data) => {
        if (data.user) {
          setUser(data.user as User);
          showUi();
        } else {
          hideUi();
        }
      });
      await browser.storage.local.get("path").then((data) => {
        if (data.path) {
          setPath(data.path);
        } else {
          setPath("");
        }
      });
    }

    loadUser();

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
      } else if (message.messageType === MessageType.USER_LOGGED_IN) {
        setUser(message.data);
        showUi();
      } else if (message.messageType === MessageType.USER_LOGGED_OUT) {
        setUser(null);
        hideUi();
      } else if (message.messageType === MessageType.CREATE_PATH) {
        setPath(message.data);
      }
      return true;
    });
  }, []);

  if (!user) {
    return (
      <div>
        <h1>No user</h1>
        <p>need to log in first</p>
      </div>
    );
  }

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
