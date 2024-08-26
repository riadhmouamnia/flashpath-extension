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
import { Input } from "@/components/ui/input";
import { insertPathToDb, insertUserToDb } from "@/lib/utils";

function HelloUser() {
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();

  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const path = formData.get("path") as string;
    form.reset();
    if (!user) {
      return;
    }
    const insertedPath = await insertPathToDb({ path, userId: user.id });
    await browser.runtime.sendMessage({
      messageType: MessageType.CREATE_PATH,
      data: insertedPath,
    });
  };

  async function sendMessageToBackground(isSignedIn: boolean | undefined) {
    console.log("sending message to background");
    if (isSignedIn === true && user) {
      await browser.runtime.sendMessage({
        messageType: MessageType.USER_LOGGED_IN,
        data: user,
      });
    } else if (!isSignedIn || !user) {
      await browser.runtime.sendMessage({
        messageType: MessageType.USER_LOGGED_OUT,
        data: null,
      });
    }
  }

  const loadPath = async () => {
    await browser.storage.local.get("path").then((data) => {
      if (data.path) {
        inputRef.current!.value = data.path.name;
      }
    });
  };

  useEffect(() => {
    const unsubscribeCallback = clerk.addListener(async (resources) => {
      console.log("User signed in: ", resources.user);
      await insertUserToDb({
        userId: resources.user?.id!,
        username: resources.user?.username!,
      });
    });
    loadPath();

    return () => {
      unsubscribeCallback();
    };
  }, []);

  useEffect(() => {
    sendMessageToBackground(isSignedIn);
  }, [isSignedIn, user]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <p>{JSON.stringify(isSignedIn)}</p>
      <p>Hi, {user.primaryEmailAddress?.emailAddress}!</p>
      <p>Hi, {user.username}!</p>
      <p>
        <button
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
        </button>
        <form onSubmit={submit} className="mt-4 flex gap-2 px-4">
          <Input
            ref={inputRef}
            id="path"
            name="path"
            type="text"
            placeholder="Enter a path"
          />
          <Button type="submit">Save</Button>
        </form>
      </p>
    </>
  );
}
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(x) => navigate(x)}
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
