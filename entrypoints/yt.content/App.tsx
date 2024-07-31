import { useEffect, useState } from "react";
import "../../assets/main.css";
import { MessageType } from "@/entrypoints/types";
// import Interactions from "@/components/interactions";
import { useTheme } from "@/components/theme-provider";
import { setThemeToBody, toggle } from "@/lib/utils";
import YTNotes from "@/components/youtube/yt-notes";
import Notes from "@/components/shared/notes";

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("content:");
      console.log(message);
      if (message.messageType === MessageType.TAB_CHANGE) {
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
      } else if (message.messageType === MessageType.YT_VIDEO_ID) {
        setYtVideoId(message.data.videoId);
      }
    });
  }, []);

  return (
    <div>
      <p>{url}</p>
      <p>YouTube</p>
      {ytVideoId ? (
        <YTNotes tabUrl={url} videoId={ytVideoId} />
      ) : (
        <Notes tabUrl={url} />
      )}
      {/* <Interactions tabUrl={url} /> */}
    </div>
  );
};
