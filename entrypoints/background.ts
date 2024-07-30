import { browser } from "wxt/browser";
import ExtMessage, { MessageType } from "./types";

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
      console.log("background:");
      console.log(message);
      if (message.messageType === MessageType.CHANGE_THEME) {
        let tabs = await browser.tabs.query({});
        console.log(`tabs:${tabs.length}`);
        if (tabs) {
          for (const tab of tabs) {
            await browser.tabs.sendMessage(tab.id!, message);
          }
        }
      }
    }
  );

  // listen for extension icon click, you need to add action {} in manifest.json (wxt.config.ts) for this to work
  browser.action.onClicked.addListener((tab) => {
    console.log("click icon");
    console.log(tab);
    browser.tabs.sendMessage(tab.id!, {
      messageType: MessageType.CLICK_EXTENSION,
    });
  });
});
