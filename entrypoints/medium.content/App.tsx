import { useEffect, useRef, useState } from "react";
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
import Notes from "@/components/shared/notes";
import { useAuthContext } from "@/components/auth-privider";
import CreatePathForm from "@/components/create-path-form";
import TurnPathOnOrOff from "@/components/path-on-off";
import CaptureVideoOnOrOff from "@/components/capture-video-on-off";
import useRRWEBRecorder from "@/hooks/useRRWEBRecorder";
import { Runtime } from "wxt/browser";

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const { toggleTheme } = useTheme();
  const [path, setPath] = useState<Path | null>(null);
  const [page, setPage] = useState<DbPage | null>(null);
  const { user } = useAuthContext();
  const [isPathOn, setIsPathOn] = useState<boolean>(false);
  useRRWEBRecorder({ pageId: page?.id, isPathOn });

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadPath = async () => {
      const path = await loadFromBrowserStorage(`${user.id}_path`);
      if (path) {
        setPath(path as Path);
      }
      console.log("path loaded from storage: ", path);
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
      console.log("Medium content script received: ", message);
      if (message.messageType == MessageType.TAB_CHANGE) {
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
      } else if (message.messageType === MessageType.PATH_ON) {
        setIsPathOn(message.data);
      } else if (message.messageType === MessageType.PATH_OFF) {
        setIsPathOn(message.data);
      }
      return true;
    };

    loadPath();
    loadPathStatus();
    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [user]);

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
    <div className="h-screen">
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
      <div className="my-2 flex flex-col gap-1">
        {path?.name ? <TurnPathOnOrOff /> : null}
        {path?.name ? <CaptureVideoOnOrOff isPathOn={isPathOn} /> : null}
      </div>
      {isPathOn && path?.name && page?.id ? (
        <>
          <Notes
            tabUrl={url}
            pageId={page.id}
            pathname={path.name}
            username={user.username}
          />
          <Interactions tabUrl={url} pageId={page.id} />
        </>
      ) : null}
    </div>
  );
};
