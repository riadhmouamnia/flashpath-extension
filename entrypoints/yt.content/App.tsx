import { useEffect, useState } from "react";
import "../../assets/main.css";
import ExtMessage, { DbPage, MessageType, Path } from "@/entrypoints/types";
import Interactions from "@/components/interactions";
import { useTheme } from "@/components/theme-provider";
import {
  initializePage,
  insertPageToDb,
  loadFromBrowserStorage,
  setThemeToBody,
} from "@/lib/utils";
import YTNotes from "@/components/youtube/yt-notes";
import Notes from "@/components/shared/notes";
import { useAuthContext } from "@/components/auth-privider";
import CreatePathForm from "@/components/create-path-form";
import useRRWEBRecorder from "@/hooks/useRRWEBRecorder";
import { Runtime } from "wxt/browser";

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const { toggleTheme } = useTheme();
  const [path, setPath] = useState<Path | null>(null);
  const [page, setPage] = useState<DbPage | null>(null);
  const { user } = useAuthContext();
  const [isPathOn, setIsPathOn] = useState<boolean>(false);
  useRRWEBRecorder({ pageId: page?.id, isPathOn });

  useEffect(() => {
    const initPageOnDb = async () => {
      if (!path) return;
      try {
        const insertedPage = await insertPageToDb({
          page: initializePage(url) as any,
          pathId: path.id,
        });
        if (insertedPage) {
          setPage(insertedPage);
        }
      } catch (error) {
        console.error("Error initializing db", error);
      }
    };

    initPageOnDb();
  }, [path, url]);

  useEffect(() => {
    const loadPath = async () => {
      await browser.storage.local.get("path").then((data) => {
        if (data.path) {
          setPath(data.path);
        }
      });
    };

    const loadPathStatus = async () => {
      const storageValue = await loadFromBrowserStorage("isPathOn");
      if (storageValue === true) {
        setIsPathOn(true);
      } else {
        setIsPathOn(false);
      }
    };

    const handleMessage = async (
      message: ExtMessage,
      sender: Runtime.MessageSender,
      sendResponse: () => void
    ) => {
      console.log("content:");
      console.log(message);
      if (message.messageType === MessageType.TAB_CHANGE) {
        const tabUrl = message.data.url;
        setUrl(tabUrl);
      } else if (message.messageType === MessageType.URL_CHANGE) {
        const url = message.data.url;
        setUrl(url);
      } else if (message.messageType === MessageType.CHANGE_THEME) {
        const newTheme = message.content!;
        toggleTheme(newTheme);
        setThemeToBody(newTheme);
      } else if (
        message.messageType === MessageType.CREATE_PATH ||
        message.messageType === MessageType.UPDATE_PATH
      ) {
        setPath(message.data);
      } else if (message.messageType === MessageType.YT_VIDEO_ID) {
        setYtVideoId(message.data.videoId);
      } else if (message.messageType === MessageType.PATH_ON) {
        setIsPathOn(message.data);
      } else if (message.messageType === MessageType.PATH_OFF) {
        setIsPathOn(message.data);
      }
    };

    loadPath();
    loadPathStatus();
    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!isPathOn) return;
    const initPageOnDb = async () => {
      if (!path) return;
      try {
        const insertedPage = await insertPageToDb({
          page: initializePage(url) as any,
          pathId: path.id,
        });
        if (insertedPage) {
          setPage(insertedPage);
        }
      } catch (error) {
        console.error("Error initializing db", error);
      }
    };

    initPageOnDb();
  }, [path, url, isPathOn]);

  if (!user) return;

  return (
    <div>
      <p>Hello {user.username}!</p>
      <CreatePathForm />
      {path ? (
        <p className="text-xs italic mt-1 text-primary/40">
          You can now start recording for "{path.name}" path
        </p>
      ) : (
        <p className="text-xs italic mt-1 text-red-400">
          You need to create a path to start recording
        </p>
      )}
      {isPathOn && path?.name && page?.id ? (
        <>
          {ytVideoId ? (
            <YTNotes
              tabUrl={url}
              videoId={ytVideoId}
              pageId={page.id}
              pathname={path.name}
              username={user.username}
            />
          ) : (
            <Notes
              tabUrl={url}
              pageId={page.id}
              pathname={path.name}
              username={user.username}
            />
          )}
          <Interactions tabUrl={url} pageId={page.id} />
        </>
      ) : null}
    </div>
  );
};
