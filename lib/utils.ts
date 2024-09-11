import {
  // interactions,
  paths,
  notes,
  users,
  pages,
  rrwebEvents,
} from "./../server/db/schemas";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DbPage,
  Interaction,
  Note,
  Notes,
  Page,
  UrlState,
} from "@/entrypoints/types";
import { db } from "@/server/db";
import { Tag } from "emblor";
import { eq } from "drizzle-orm";
import { EventType } from "rrweb";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const initializePage = (url: string) => ({
  url,
  domain: new URL(url).hostname,
  timeOnPage: 0,
  isBookmarked: false,
});

// export const saveToLocalStorage = ({
//   key,
//   value,
// }: {
//   key: string;
//   value: any;
// }) => {
//   localStorage.setItem(key, JSON.stringify(value));
// };

// export const loadFromLocalStorage = (key: string) => {
//   const data = localStorage.getItem(key);
//   return data ? JSON.parse(data) : {};
// };

// export const clearLocalStorage = (key: string) => {
//   localStorage.removeItem(key);
// };

export const saveToBrowserStorage = async ({
  key,
  value,
}: {
  key: string;
  value: any;
}) => {
  try {
    await browser.storage.local.set({ [key]: value });
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

export async function insertUserToDb({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  try {
    const insertedUser = await db
      .insert(users)
      .values({ id: userId, username })
      .onConflictDoNothing()
      .returning();
    console.log("User inserted", insertedUser[0]);
    return insertedUser[0];
  } catch (error) {
    console.error("Error inserting User", error);
  }
}

export async function insertPathToDb({
  path,
  userId,
}: {
  path: string;
  userId: string;
}) {
  try {
    const insertedPath = await db
      .insert(paths)
      .values({ name: path, userId } as any)
      .returning();
    console.log("Path inserted", insertedPath[0]);
    return insertedPath[0];
  } catch (error) {
    console.error("Error inserting Path", error);
  }
}

export async function insertPageToDb({
  page,
  pathId,
}: {
  page: DbPage;
  pathId: number;
}) {
  try {
    const insertedPage = await db
      .insert(pages)
      .values({
        pathId,
        url: page.url,
        domain: page.domain,
        timeOnPage: page.timeOnPage,
        isBookmarked: page.isBookmarked,
      } as any)
      .returning();

    return insertedPage[0];

    // if (insertedPage.length > 0) {
    //   console.log("Page inserted", insertedPage);
    //   const insertedInteractions = await insertInteractionsToDb({
    //     interactions: page.interactions,
    //     pageId: insertedPage[0].id,
    //   });
    // console.log("Interactions inserted", insertedInteractions);
    // }
  } catch (error) {
    console.error("Error inserting Page", error);
  }
}

export async function updatePageOnDb({
  pageId,
  page,
}: {
  pageId: number;
  page: Page;
}) {
  try {
    const updatedPage = await db
      .update(pages)
      .set({
        timeOnPage: page.timeOnPage,
        isBookmarked: page.isBookmarked,
      } as any)
      .where(eq(pages.id, pageId))
      .returning();
    console.log("Page updated: ", updatedPage[0]);
  } catch (error) {
    console.error("Error updating Page", error);
  }
}

// export async function insertInteractionsToDb({
//   interaction,
//   pageId,
// }: {
//   interaction: Interaction;
//   pageId: number;
// }) {
//   try {
//     const insertedInteractions = await db
//       .insert(interactions)
//       .values({ pageId, ...interaction })
//       .returning();
//     console.log("Interaction inserted", insertedInteractions[0]);
//     return insertedInteractions[0];
//   } catch (error) {
//     console.error("Error inserting interactions", error);
//   }
// }

export async function insertNotesToDb({
  note,
  pageId,
}: {
  note: Note;
  pageId: number;
}) {
  try {
    const insertedNote = await db
      .insert(notes)
      .values({
        pageId,
        startTime: note.startTime,
        endTime: note.endTime,
        body: note.note,
        tags: note.tags?.map((tag: Tag) => tag.text),
        color: note.highlightColor,
        sort: note.sort,
        favorite: false,
        hidden: false,
      } as any)
      .returning();
    console.log("Note inserted", insertedNote);
  } catch (error) {
    console.error("Error inserting notes", error);
  }
}

export async function insertRrwebEventToDb({
  events,
  pageId,
}: {
  events: EventType[];
  pageId: number;
}) {
  try {
    const insertedEvent = await db
      .insert(rrwebEvents)
      .values(events.map((event) => ({ pageId, event })))
      .returning();
    console.log("Event inserted", insertedEvent);
  } catch (error) {
    console.error("Error inserting event", error);
  }
}
