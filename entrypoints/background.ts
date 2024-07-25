import { browser } from "wxt/browser";
import { MessageType } from "./types";

const CHROME_STORE_URL = "https://chromewebstore.google.com/";
const CHROME_EXTENSIONS_URL = "chrome://extensions/";

export default defineBackground(() => {
  console.log(`Hello from ${browser.runtime.id}!`);

  // listen for url changes
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
      changeInfo.url &&
      !(
        changeInfo.url.startsWith(CHROME_EXTENSIONS_URL) ||
        changeInfo.url.startsWith(CHROME_STORE_URL)
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
        tab.url.startsWith(CHROME_STORE_URL)
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
});
