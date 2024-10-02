import { useEffect, useRef, useState } from "react";
import "../../assets/main.css";
import ExtMessage, { DbPage, MessageType, Path } from "@/entrypoints/types";
import Interactions from "@/components/interactions";
import { useTheme } from "@/components/theme-provider";
import {
  initializePage,
  insertPageToDb,
  saveToBrowserStorage,
  setThemeToBody,
} from "@/lib/utils";
import Notes from "@/components/shared/notes";
import { useAuthContext } from "@/components/auth-privider";
import CreatePathForm from "@/components/create-path-form";

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const { toggleTheme } = useTheme();
  const [path, setPath] = useState<Path | null>(null);
  const [page, setPage] = useState<DbPage | null>(null);
  const { user } = useAuthContext();
  const [pageKey, setPageKey] = useState<string | null>(null);

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

    loadPath();

    browser.runtime.onMessage.addListener(
      (message: ExtMessage, sender, sendResponse) => {
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
        } else if (message.messageType === MessageType.CREATE_PATH) {
          setPath(message.data);
        }
      }
    );
  }, []);

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
          You need to create a path to start recoring
        </p>
      )}
      {path?.name && page?.id ? (
        <>
          <Notes
            tabUrl={url}
            pageId={page.id}
            pathname={path.name}
            username={user.username}
          />
          <Interactions
            tabUrl={url}
            pageId={page.id}
            pathname={path.name}
            username={user.username}
          />
        </>
      ) : null}
    </div>
  );
};
