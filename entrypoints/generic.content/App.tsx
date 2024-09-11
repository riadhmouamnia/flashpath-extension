import { useEffect, useState } from "react";
import { DbPage, MessageType, Network, Path } from "@/entrypoints/types";
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
import useNetworkState from "@/hooks/useNetworkState";

export default () => {
  const [url, setUrl] = useState(window.location.href);
  const { toggleTheme } = useTheme();
  const [path, setPath] = useState<Path | null>(null);
  const [page, setPage] = useState<DbPage | null>(null);
  const { user } = useAuthContext();
  const [pageKey, setPageKey] = useState<string | null>(null);
  const network = useNetworkState() as Network;
  const networkAvailable = network.online;

  console.log("networkAvailable: ", networkAvailable);

  useEffect(() => {
    browser.storage.local.get().then((data) => {
      console.log("online state changes : ", data);
    });
  }, [networkAvailable]);

  useEffect(() => {
    const loadPath = async () => {
      await browser.storage.local.get("path").then((data) => {
        if (data.path) {
          setPath(data.path);
        }
      });
    };

    loadPath();

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

  useEffect(() => {
    const initPageOnDb = async () => {
      if (!path) return;
      try {
        // store page in browser.storage.local if network is not available
        if (!networkAvailable) {
          const key = `page-${Date.now()}`;
          setPageKey(key);
          saveToBrowserStorage({
            key,
            value: initializePage(url),
          });
          return;
        }
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
    <div className="h-screen">
      <p>Logged in as {user.username}</p>
      {path ? <p>path: {path.name}</p> : <p>path: no path found!</p>}
      {/* <p>{url}</p>
      <p>Generic.</p> */}
      {page ? (
        <>
          <Notes tabUrl={url} pageId={page.id} />
          <Interactions
            tabUrl={url}
            pageId={page.id}
            networkAvailable={networkAvailable}
            pageKey={pageKey as string}
          />
        </>
      ) : null}
    </div>
  );
};
