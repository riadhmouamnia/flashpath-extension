import { MessageType } from "@/entrypoints/types";
import { hideUi, showUi } from "@/lib/utils";
import { ClerkProvider, useClerk } from "@clerk/chrome-extension";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

const AuthContext = createContext({ user: null });

export const useAuthContext = () => useContext(AuthContext);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // send message to background script when first load to check if we have a user
    async function loadUser() {
      const data = await browser.storage.local.get("user");
      console.log(data);
      if (data.user) {
        console.log("user: ", data.user);
        setUser(data.user as any);
        showUi();
      } else {
        hideUi();
      }
    }

    loadUser();

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("content:");
      console.log(message);
      if (message.messageType === MessageType.USER_LOGGED_IN) {
        setUser(message.user);
        showUi();
      } else if (message.messageType === MessageType.USER_LOGGED_OUT) {
        setUser(null);
        hideUi();
      }
      return true;
    });
  }, []);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} syncSessionWithTab>
      <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
    </ClerkProvider>
  );
};
