import "./App.css";
import { Button } from "@/components/ui/button.tsx";
import { MessageType } from "@/entrypoints/types.ts";
import { useEffect, useRef, useState } from "react";

import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  useClerk,
  useUser,
  ClerkProvider,
} from "@clerk/chrome-extension";

import { useNavigate, Routes, Route, MemoryRouter } from "react-router-dom";
import { insertUserToDb } from "@/lib/utils";

function HelloUser() {
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();

  // async function sendMessageToBackground(isSignedIn: boolean | undefined) {
  //   console.log("sending message to background");
  //   if (isSignedIn === true && user) {
  //     await browser.runtime.sendMessage({
  //       messageType: MessageType.USER_LOGGED_IN,
  //       data: user,
  //     });
  //   } else if (!isSignedIn || !user) {
  //     await browser.runtime.sendMessage({
  //       messageType: MessageType.USER_LOGGED_OUT,
  //       data: null,
  //     });
  //   }
  // }

  useEffect(() => {
    const unsubscribeCallback = clerk.addListener(async (resources) => {
      console.log("User signed in: ", resources.user);
      // added this
      if (resources.user) {
        await browser.runtime.sendMessage({
          messageType: MessageType.USER_LOGGED_IN,
          data: user,
        });
      }
      await insertUserToDb({
        userId: resources.user?.id!,
        username: resources.user?.username!,
        imageUrl: resources.user?.imageUrl,
      });
    });

    return () => {
      unsubscribeCallback();
    };
  }, []);

  // useEffect(() => {
  //   sendMessageToBackground(isSignedIn);
  // }, [isSignedIn, user]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex justify-between items-center">
      {/* <p>{JSON.stringify(isSignedIn)}</p>
      <p>Hi, {user.primaryEmailAddress?.emailAddress}!</p> */}
      <p>Hi, {user.username}!</p>
      <Button
        variant="ghost"
        className="my-2"
        size="sm"
        onClick={() =>
          clerk.signOut().then(() => {
            browser.runtime.sendMessage({
              messageType: MessageType.USER_LOGGED_OUT,
              data: { user: null },
            });
          })
        }
      >
        Sign out
      </Button>
    </div>
  );
}
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      syncSessionWithTab
    >
      <main>
        <Routes>
          <Route path="/sign-up/*" element={<SignUp signInUrl="/" />} />
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <HelloUser />
                </SignedIn>
                <SignedOut>
                  <SignIn signUpUrl="/sign-up" />
                </SignedOut>
              </>
            }
          />
        </Routes>
      </main>
    </ClerkProvider>
  );
}

function App() {
  return (
    <MemoryRouter>
      <ClerkProviderWithRoutes />
    </MemoryRouter>
  );
}

export default App;
