import { MessageType, User } from "@/entrypoints/types";
import { hideUi, showUi } from "@/lib/utils";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

const AuthContext = createContext({ user: null } as { user: User | null });

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // send message to background script when first load to check if we have a user
    async function loadUser() {
      await browser.storage.local.get("user").then((data) => {
        console.log("user in auth context:", data.user);
        if (data.user) {
          setUser(data.user as User);
          showUi();
        } else {
          hideUi();
        }
      });
    }

    loadUser();

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("content:");
      console.log(message);
      if (message.messageType === MessageType.USER_LOGGED_IN) {
        setUser(message.data);
        showUi();
      } else if (message.messageType === MessageType.USER_LOGGED_OUT) {
        setUser(null);
        hideUi();
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
  if (user) {
    return (
      <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
    );
  }
};
