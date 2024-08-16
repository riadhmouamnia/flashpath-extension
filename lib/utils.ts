import { paths } from "./../server/db/schemas";
import { UrlInteractions } from "./../entrypoints/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as schema from "../server/db/schemas";
import { Notes, UrlInteractionsState } from "@/entrypoints/types";
import { db } from "@/server/db/db";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const saveToLocalStorage = ({
  key,
  value,
}: {
  key: string;
  value: any;
}) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadFromLocalStorage = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
};

export const clearLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

export const saveToBrowserStorage = async ({
  key,
  value,
  type,
  userId,
  pathId,
}: {
  key: string;
  value: any;
  type?: "interactions" | "notes";
  userId: number;
  pathId: number;
}) => {
  try {
    await browser.storage.local.set({ [key]: value });
    // if (type === "interactions") {
    //   insertUrlInteraction({ value, userId, pathId } as any);
    // } else if (type === "notes") {
    //   insertNotes({ key, value, userId, pathId });
    // } else {
    //   console.error("Invalid type");
    // }
  } catch (error) {
    console.error("Error saving to browser storage", error);
  }
};

export const loadFromBrowserStorage = async (key: string) => {
  try {
    const data = await browser.storage.local.get(key);
    return data[key];
  } catch (error) {
    console.error("Error loading from browser storage", error);
    return {};
  }
};

export const clearBrowserStorage = async (key: string) => {
  try {
    await browser.storage.local.remove(key);
  } catch (error) {
    console.error("Error clearing browser storage", error);
  }
};

export const setThemeToBody = (theme: string) => {
  const element = document.querySelector("wxt-react-example");
  if (element) {
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      const body = shadowRoot.querySelector("body");
      if (body) {
        body.className = theme;
      }
    }
  }
};

export const toggle = () => {
  const element = document.querySelector("wxt-react-example");
  if (element) {
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      const body = shadowRoot.querySelector("body");
      if (!body) {
        return;
      }

      // change right: 0px style to right: -600px
      const style = getComputedStyle(body);
      const right = style.getPropertyValue("right");
      const newValue = right === "0px" ? "-600px" : "0px";
      body.style.right = newValue;

      //  or "toggle", body.style.display
      //   if (body.style.display === "none") {
      //     body.style.display = "block";
      //   } else {
      //     body.style.display = "none";
      //   }
    }
  }
};

export const showUi = () => {
  const element = document.querySelector("wxt-react-example");
  if (element) {
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      const body = shadowRoot.querySelector("body");
      if (!body) {
        return;
      }
      // change right: to 0px
      body.style.right = "0px";
      body.style.display = "block";
    }
  }
};
export const hideUi = () => {
  const element = document.querySelector("wxt-react-example");
  if (element) {
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      const body = shadowRoot.querySelector("body");
      if (!body) {
        return;
      }
      // change right: to -600px
      body.style.right = "-600px";
      body.style.display = "none";
    }
  }
};

export function formatVideoTime(seconds: number): string | null {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export async function insertUrlInteraction({
  value,
  userId,
  pathId,
}: {
  value: UrlInteractionsState;
  userId: number;
  pathId: number;
}) {
  const values = Object.keys(value).map((url) => {
    const {
      totalTimeSpent,
      reloadCount,
      scrollPosition,
      hasScrolledFullPage,
      isBookmarked,
      Keystrokes,
      textHighlightEvent,
      mediaEvent,
      clickEvent,
    } = value[url];
    return {
      url,
      totalTimeSpent,
      reloadCount,
      scrollPosition,
      hasScrolledFullPage,
      isBookmarked,
      Keystrokes,
      textHighlightEvent,
      mediaEvent,
      clickEvent,
      pathId,
      userId,
    };
  });
  try {
    // insert values and update any existing rows
    values.forEach(async (value) => {
      await db
        .insert(schema.interactions)
        .values(value as any)
        .onConflictDoUpdate({
          target: schema.interactions.url,
          set: {
            totalTimeSpent: value.totalTimeSpent as any,
            reloadCount: value.reloadCount as any,
            scrollPosition: value.scrollPosition,
            hasScrolledFullPage: value.hasScrolledFullPage,
            isBookmarked: value.isBookmarked,
            Keystrokes: value.Keystrokes,
            textHighlightEvent: value.textHighlightEvent,
            mediaEvent: value.mediaEvent,
            clickEvent: value.clickEvent,
          },
        })
        .execute();
    });
  } catch (error) {
    console.error("Error inserting url interactions", error);
  }
}
export async function insertNotes({
  key,
  value,
  userId,
  pathId,
}: {
  key: string;
  value: Notes;
  userId: number;
  pathId: number;
}) {
  const values = { url: key, notes: value, userId, pathId };
  try {
    // insert values and update any existing rows
    await db
      .insert(schema.notes)
      .values(values as any)
      .onConflictDoUpdate({
        target: schema.notes.url,
        set: {
          notes: { ...values.notes },
        },
      })
      .execute();
  } catch (error) {
    console.error("Error inserting notes", error);
  }
}
