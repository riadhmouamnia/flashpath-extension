import { browser } from "wxt/browser";
import ExtMessage, { MessageType } from "./types";
import { saveToBrowserStorage } from "@/lib/utils";

const CHROME_STORE_URL = "https://chromewebstore.google.com/";
const CHROME_EXTENSIONS_URL = "chrome://extensions/";
const CHROME_NEW_TAB_URL = "chrome://newtab/";

export default defineBackground(() => {
  console.log(`Hello from ${browser.runtime.id}!`);

  // listen for url changes
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
      changeInfo.url &&
      !(
        changeInfo.url.startsWith(CHROME_EXTENSIONS_URL) ||
        changeInfo.url.startsWith(CHROME_STORE_URL) ||
        changeInfo.url.startsWith(CHROME_NEW_TAB_URL)
      )
    ) {
      const url = changeInfo.url;
      console.log("url change: ", url);
      browser.tabs.sendMessage(tabId, {
        messageType: MessageType.URL_CHANGE,
        data: { url },
      });
    }
  });

  // check if the current tab is a youtube video and send the video id to the content script
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
      tab.url &&
      !(
        tab.url.startsWith(CHROME_EXTENSIONS_URL) ||
        tab.url.startsWith(CHROME_STORE_URL) ||
        tab.url.startsWith(CHROME_NEW_TAB_URL) ||
        tab.url.startsWith("about:blank")
      )
    ) {
      const url = new URL(tab.url);
      if (url.hostname === "www.youtube.com") {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          browser.tabs.sendMessage(tabId, {
            messageType: MessageType.YT_VIDEO_ID,
            data: { videoId },
          });
        } else {
          browser.tabs.sendMessage(tabId, {
            messageType: MessageType.YT_VIDEO_ID,
            data: { videoId: null },
          });
        }
      }
    }
  });

  // Listen for tab changes
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await browser.tabs.get(activeInfo.tabId);
    if (
      tab.url &&
      !(
        tab.url.startsWith(CHROME_EXTENSIONS_URL) ||
        tab.url.startsWith(CHROME_STORE_URL) ||
        tab.url.startsWith(CHROME_NEW_TAB_URL)
      )
    ) {
      const url = tab.url;
      console.log("tab change: ", url);
      browser.tabs.sendMessage(activeInfo.tabId, {
        messageType: MessageType.TAB_CHANGE,
        data: { url },
      });
    }
  });

  // listen for bookmark changes, you need to add permissions: ["bookmarks"] in manifest.json (wxt.config.ts) for this to work
  browser.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log("bookmark created: ", bookmark);
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        browser.tabs.sendMessage(tabs[0].id, {
          messageType: MessageType.BOOKMARK_CREATED,
          data: { bookmark },
        });
      }
    });
  });

  browser.bookmarks.onRemoved.addListener((id, removeInfo) => {
    console.log("bookmark deleted: ", removeInfo);
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        browser.tabs.sendMessage(tabs[0].id, {
          messageType: MessageType.BOOKMARK_REMOVED,
          data: { removeInfo },
        });
      }
    });
  });

  // listen for theme changes
  browser.runtime.onMessage.addListener(
    async (
      message: ExtMessage,
      sender,
      sendResponse: (message: any) => void
    ) => {
      // console.log("background:");
      // console.log(message);
      if (message.messageType === MessageType.CHANGE_THEME) {
        let tabs = await browser.tabs.query({});
        console.log(`tabs:${tabs.length}`);
        if (tabs) {
          for (const tab of tabs) {
            await browser.tabs.sendMessage(tab.id!, message);
          }
        }
      }
      return true;
    }
  );

  // listen for user login/logout
  browser.runtime.onMessage.addListener(
    async (
      message: ExtMessage,
      sender,
      sendResponse: (message: any) => void
    ) => {
      if (message.messageType === MessageType.USER_LOGGED_IN) {
        let tabs = await browser.tabs.query({});
        await browser.storage.local.set({
          user: message.data,
        });
        console.log(`tabs:${tabs.length}`);
        if (tabs) {
          for (const tab of tabs) {
            void browser.tabs.sendMessage(tab.id!, message);
          }
        }
      } else if (message.messageType === MessageType.USER_LOGGED_OUT) {
        await browser.storage.local.remove("user");
        let tabs = await browser.tabs.query({});
        console.log(`tabs:${tabs.length}`);
        if (tabs) {
          for (const tab of tabs) {
            void browser.tabs.sendMessage(tab.id!, message);
          }
        }
      }
      // return true;
    }
  );

  // listen for create path
  browser.runtime.onMessage.addListener(
    async (
      message: ExtMessage,
      sender,
      sendResponse: (message: any) => void
    ) => {
      if (message.messageType === MessageType.CREATE_PATH) {
        console.log("key: ", message.data.userId + "_path");
        await saveToBrowserStorage({
          key: message.data.userId + "_path",
          value: message.data,
        });
        let tabs = await browser.tabs.query({});
        console.log(`tabs:${tabs.length}`);
        if (tabs) {
          console.log("sending path to tabs");
          for (const tab of tabs) {
            await browser.tabs
              .sendMessage(tab.id!, message)
              .then(() => {
                console.log("sent path to tab");
              })
              .catch((err) => {
                console.error(err);
              });
          }
        }
      }
      return true;
    }
  );

  // listen for path on/off
  browser.runtime.onMessage.addListener(
    async (
      message: ExtMessage,
      sender,
      sendResponse: (message: any) => void
    ) => {
      // Path ON
      if (
        message.messageType === MessageType.PATH_ON ||
        message.messageType === MessageType.PATH_OFF
      ) {
        let tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        console.log(message);
        if (tabs.length > 0 && tabs[0].id) {
          browser.tabs.sendMessage(tabs[0].id, message);
        }
      }
      return true;
    }
  );

  // listen for video on/off
  browser.runtime.onMessage.addListener(
    async (
      message: ExtMessage,
      sender,
      sendResponse: (message: any) => void
    ) => {
      // Video ON
      if (
        message.messageType === MessageType.CAPTURE_VIDEO_ON ||
        message.messageType === MessageType.CAPTURE_VIDEO_OFF
      ) {
        let tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs.length > 0 && tabs[0].id) {
          browser.tabs.sendMessage(tabs[0].id, message);
        }
      }
      return true;
    }
  );

  // listen for hideUI message
  browser.runtime.onMessage.addListener(
    async (
      message: ExtMessage,
      sender,
      sendResponse: (message: any) => void
    ) => {
      if (message.messageType === MessageType.HIDE_UI) {
        let tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs.length > 0 && tabs[0].id) {
          browser.tabs.sendMessage(tabs[0].id, message);
        }
      }
      return true;
    }
  );

  // create context menu item for page selection
  browser.contextMenus.create({
    id: "text-selection",
    title: "Add to Flashpath notes",
    contexts: ["selection"],
  });

  // listen for context menu click
  browser.contextMenus.onClicked.addListener((info, tab) => {
    console.log("context menu click");
    console.log(info);
    console.log(tab);
    browser.tabs.sendMessage(tab!.id!, {
      messageType: MessageType.SELECT_TEXT,
      data: { selectionText: info.selectionText },
    });
  });

  // listen for extension icon click, you need to add action {} in manifest.json (wxt.config.ts) for this to work
  // browser.action.onClicked.addListener((tab) => {
  //   console.log("click icon");
  //   console.log(tab);
  //   browser.tabs.sendMessage(tab.id!, {
  //     messageType: MessageType.CLICK_EXTENSION,
  //   });
  // });
});
