import ExtMessage, { MessageType, User } from "@/entrypoints/types";
import { hideUi, loadFromBrowserStorage, showUi } from "@/lib/utils";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { Runtime } from "wxt/browser";

const AuthContext = createContext({ user: null } as { user: User | null });

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // send message to background script when first load to check if we have a user
    async function loadUser() {
      await browser.storage.local.get("user").then(async (data) => {
        console.log("user in auth context:", data.user);
        if (data.user) {
          setUser(data.user as User);
          // showUi();
          const isHideUi = await loadFromBrowserStorage("hideUi");
          console.log("isHideUi auth provider: ", isHideUi);
          if (isHideUi) {
            hideUi();
          } else {
            showUi();
          }
        } else {
          // hideUi();
        }
      });
    }

    loadUser();

    const handleMessages = async (
      message: ExtMessage,
      sender: Runtime.MessageSender,
      sendResponse: () => void
    ) => {
      if (message.messageType === MessageType.USER_LOGGED_IN) {
        setUser(message.data);
        showUi();
      } else if (message.messageType === MessageType.USER_LOGGED_OUT) {
        setUser(null);
        // hideUi();
      } else if (message.messageType === MessageType.HIDE_UI) {
        hideUi();
      }
      return true;
    };

    browser.runtime.onMessage.addListener(handleMessages);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessages);
    };
  }, []);

  if (!user) {
    return (
      <div>
        <h1>No user</h1>
        <p>need to log in first</p>
      </div>
    );
  }
  if (user) {
    return (
      <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
    );
  }
};
