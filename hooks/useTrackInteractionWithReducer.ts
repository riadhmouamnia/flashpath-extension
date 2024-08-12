/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageType } from "@/entrypoints/types";
import { saveToBrowserStorage } from "@/lib/utils";
import { useEffect, useRef, useReducer } from "react";
import { get, set, createStore, update, getMany } from "idb-keyval";

const urlInteractionStore = createStore("flashpath", "url-interactions");

export type ScrollEvent = {
  scrollY: number;
  scrollX: number;
  timeStamp: number;
};

export type Keystrokes = {
  inputValue: string;
  inputType: string;
  inputName: string;
  timeStamp: number;
};

export type TextHighlightEvent = {
  highlightedText: string;
  timeStamp: number;
};

export type MediaEventType =
  | "PLAY"
  | "PAUSE"
  | "MUTE"
  | "UNMUTE"
  | "VOLUMECHANGE"
  | "FULLSCREEN"
  | "EXITFULLSCREEN"
  | "SEEK";

export type MediaEvent = {
  event: MediaEventType;
  currentTime: number;
  timeStamp: number;
};

export type Click = {
  tagName: string;
  clientX: number;
  clientY: number;
  attributes: {
    [key: string]: string;
  };
  timeStamp: number;
};

export type Intercations = {
  textHighlightEvent?: TextHighlightEvent[];
  mediaEvent?: MediaEvent[];
  clickEvent?: Click[];
};

export type UrlInteractions = {
  url: string;
  totalTimeSpent: number;
  reloadCount: number;
  scrollPosition?: ScrollEvent[];
  hasScrolledFullPage: boolean;
  isBookmarked: boolean;
  Keystrokes?: Keystrokes[];
  interactions?: Intercations;
};

const initializeUrlState = (url: string): UrlInteractions => ({
  url,
  totalTimeSpent: 0,
  reloadCount: 0,
  hasScrolledFullPage: false,
  isBookmarked: false,
  interactions: {
    textHighlightEvent: [],
    mediaEvent: [],
    clickEvent: [],
  },
  scrollPosition: [],
  Keystrokes: [],
});

enum ActionType {
  UPDATE_STATE = "UPDATE_STATE",
  UPDATE_SCROLL = "UPDATE_SCROLL",
  UPDATE_TEXT_HIGHLIGHT = "UPDATE_TEXT_HIGHLIGHT",
  UPDATE_CLICK_EVENT = "UPDATE_CLICK_EVENT",
  UPDATE_MEDIA_EVENT = "UPDATE_MEDIA_EVENT",
  UPDATE_KEYSTROKES = "UPDATE_KEYSTROKES",
}

type Action = {
  type: ActionType;
  payload: any;
};

const reducer = (state: UrlInteractions, action: Action) => {
  switch (action.type) {
    case "UPDATE_STATE":
      return {
        ...state,
        ...action.payload,
      };
    case "UPDATE_SCROLL": {
      return {
        ...state,
        scrollPosition: [
          ...(state.scrollPosition || []),
          { ...action.payload },
        ],
      };
    }
    case "UPDATE_TEXT_HIGHLIGHT": {
      return {
        ...state,
        interactions: {
          ...state.interactions,
          textHighlightEvent: [
            ...(state.interactions?.textHighlightEvent || []),
            { ...action.payload },
          ],
        },
      };
    }
    case "UPDATE_CLICK_EVENT": {
      return {
        ...state,
        interactions: {
          ...state.interactions,
          clickEvent: [
            ...(state.interactions?.clickEvent || []),
            { ...action.payload },
          ],
        },
      };
    }
    case "UPDATE_MEDIA_EVENT": {
      return {
        ...state,
        interactions: {
          ...state.interactions,
          mediaEvent: [
            ...(state.interactions?.mediaEvent || []),
            { ...action.payload },
          ],
        },
      };
    }
    case "UPDATE_KEYSTROKES": {
      return {
        ...state,
        Keystrokes: [...(state.Keystrokes || []), { ...action.payload }],
      };
    }
    default:
      return state;
  }
};

export default function useTrackInteractionWithReducer(tabUrl: string) {
  const [urlInteractions, dispatch] = useReducer(
    reducer,
    initializeUrlState(tabUrl)
  );

  const urlRef = useRef(tabUrl);
  const startTime = useRef(Date.now());
  const totalTimeSpent = useRef(0);
  const isActive = useRef(true);

  // calculate total time spent on the page
  const handleTimeSpent = async () => {
    if (document.hidden) {
      const timeSpent = Date.now() - startTime.current;
      totalTimeSpent.current += timeSpent;
      isActive.current = false;
      dispatch({
        type: ActionType.UPDATE_STATE,
        payload: { totalTimeSpent: totalTimeSpent.current },
      });
    } else {
      startTime.current = Date.now();
      isActive.current = true;
    }
  };

  const handleUnload = async () => {
    if (isActive.current) {
      const timeSpent = Date.now() - startTime.current;
      totalTimeSpent.current += timeSpent;
      const prevTimeSpent = urlInteractions.totalTimeSpent;
      const newTotalTimeSpent = prevTimeSpent + totalTimeSpent.current;
      dispatch({
        type: ActionType.UPDATE_STATE,
        payload: { totalTimeSpent: newTotalTimeSpent },
      });
    }
  };

  const handleReload = async () => {
    const navigationEntries = performance.getEntriesByType("navigation");
    if (
      navigationEntries.length > 0 &&
      (navigationEntries[0] as PerformanceNavigationTiming).type === "reload"
    ) {
      // Fetch the existing URL state from IndexedDB
      const existingState = await get(urlRef.current, urlInteractionStore);
      const newReloadCount = (existingState?.reloadCount ?? 0) + 1;

      // Update the state with the incremented reload count
      dispatch({
        type: ActionType.UPDATE_STATE,
        payload: {
          reloadCount: newReloadCount,
        },
      });
      // Save the updated state to IndexedDB
      // await set(
      //   urlRef.current,
      //   { ...urlInteractions, reloadCount: newReloadCount },
      //   urlInteractionStore
      // );
    }
  };

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      dispatch({
        type: ActionType.UPDATE_STATE,
        payload: { hasScrolledFullPage: true },
      });
    }
    dispatch({
      type: ActionType.UPDATE_SCROLL,
      payload: {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        timeStamp: Date.now(),
      },
    });
  };

  const handleSelectText = (e: MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      e.target.closest("wxt-react-example[data-wxt-shadow-root]")
    ) {
      return;
    }
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) {
      dispatch({
        type: ActionType.UPDATE_TEXT_HIGHLIGHT,
        payload: {
          highlightedText: selectedText,
          timeStamp: Date.now(),
        },
      });
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      e.target.closest("wxt-react-example[data-wxt-shadow-root]")
    ) {
      return;
    }
    dispatch({
      type: ActionType.UPDATE_CLICK_EVENT,
      payload: {
        tagName: (e.target as HTMLElement).tagName,
        timeStamp: Date.now(),
        clientX: e.clientX,
        clientY: e.clientY,
        attributes: {
          id: (e.target as HTMLElement).id,
          class: (e.target as HTMLElement).className,
          name: (e.target as HTMLElement).getAttribute("name") || "",
        },
      },
    });
  };

  const handleKeyStrokes = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const keyStroke = target.value;
    dispatch({
      type: ActionType.UPDATE_KEYSTROKES,
      payload: {
        inputValue: keyStroke,
        inputType: target.type,
        inputName: target.name,
        timeStamp: Date.now(),
      },
    });
  };

  const handleMediaEvent = (e: Event) => {
    const mediaElement = e.target as HTMLMediaElement;
    const event = e.type as MediaEventType;
    dispatch({
      type: ActionType.UPDATE_MEDIA_EVENT,
      payload: {
        event,
        currentTime: mediaElement.currentTime,
        timeStamp: Date.now(),
      },
    });
  };

  const handleMessages = async (
    request: { messageType: string; data: any },
    _sender: any,
    _sendResponse: (message: any) => void
  ) => {
    const { messageType } = request;
    // const { data } = request;
    if (messageType === MessageType.BOOKMARK_CREATED) {
      dispatch({
        type: ActionType.UPDATE_STATE,
        payload: { isBookmarked: true },
      });
    } else if (messageType === MessageType.BOOKMARK_REMOVED) {
      dispatch({
        type: ActionType.UPDATE_STATE,
        payload: { isBookmarked: false },
      });
    }
  };

  useEffect(() => {
    const registerEvents = () => {
      browser.runtime.onMessage.addListener(handleMessages);
      document.addEventListener("visibilitychange", handleTimeSpent);
      window.addEventListener("beforeunload", handleUnload);
      window.addEventListener("unload", handleUnload);
      window.addEventListener("scroll", handleScroll);
      document.addEventListener("mouseup", handleSelectText);
      document.addEventListener("dblclick", handleClick);
      document.querySelectorAll("video , audio").forEach((mediaElement) => {
        mediaElement.addEventListener("play", handleMediaEvent);
        mediaElement.addEventListener("pause", handleMediaEvent);
        mediaElement.addEventListener("seeked", handleMediaEvent);
        mediaElement.addEventListener("volumechange", handleMediaEvent);
        mediaElement.addEventListener("exitfullscreen", handleMediaEvent);
        mediaElement.addEventListener("mute", handleMediaEvent);
        mediaElement.addEventListener("unmute", handleMediaEvent);
      });
      document.querySelectorAll("input, textarea").forEach((input) => {
        if (input instanceof HTMLInputElement) {
          input.addEventListener("input", handleKeyStrokes);
        }
      });
    };

    const unregisterEvents = () => {
      browser.runtime.onMessage.removeListener(handleMessages);
      document.removeEventListener("visibilitychange", handleTimeSpent);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseup", handleSelectText);
      document.removeEventListener("dblclick", handleClick);
      document.querySelectorAll("video , audio").forEach((mediaElement) => {
        mediaElement.removeEventListener("play", handleMediaEvent);
        mediaElement.removeEventListener("pause", handleMediaEvent);
        mediaElement.removeEventListener("seeked", handleMediaEvent);
        mediaElement.removeEventListener("volumechange", handleMediaEvent);
        mediaElement.removeEventListener("exitfullscreen", handleMediaEvent);
        mediaElement.removeEventListener("mute", handleMediaEvent);
        mediaElement.removeEventListener("unmute", handleMediaEvent);
      });
      document.querySelectorAll("input, textarea").forEach((input) => {
        input.removeEventListener("input", handleKeyStrokes);
      });
    };

    registerEvents();
    return unregisterEvents;
  }, []);

  useEffect(() => {
    // Check for reload when the component mounts
    handleReload();
  }, []);

  useEffect(() => {
    return () => {
      set(urlInteractions.url, urlInteractions, urlInteractionStore);
    };
  }, [urlInteractions]);

  useEffect(() => {
    const oldUrl = urlRef.current;
    const newUrl = tabUrl;
    const prevTimeSpent = urlInteractions.totalTimeSpent;

    const handleUrlChange = async () => {
      if (oldUrl !== newUrl) {
        // Check if URL has actually changed
        if (isActive.current) {
          const timeSpent = Date.now() - startTime.current;
          totalTimeSpent.current += timeSpent;

          dispatch({
            type: ActionType.UPDATE_STATE,
            payload: {
              totalTimeSpent: prevTimeSpent
                ? prevTimeSpent + totalTimeSpent.current
                : totalTimeSpent.current,
            },
          });
          // Save the updated state for the old URL to IndexedDB
          // await update(
          //   oldUrl,
          //   (oldData) => {
          //     return { ...urlInteractions };
          //   },
          //   urlInteractionStore
          // );

          // Reset time spent trackers
          totalTimeSpent.current = 0;
          startTime.current = Date.now();
          isActive.current = true;
        }

        // Load the state for the new URL from IndexedDB
        const newUrlData = await get(newUrl, urlInteractionStore);
        if (newUrlData) {
          dispatch({ type: ActionType.UPDATE_STATE, payload: newUrlData });
        } else {
          const initialState = initializeUrlState(newUrl);
          dispatch({
            type: ActionType.UPDATE_STATE,
            payload: initialState,
          });
          // await set(newUrl, initialState, urlInteractionStore);
        }
        urlRef.current = newUrl;
      }
    };

    handleUrlChange();
  }, [tabUrl]);

  return { urlInteractions };
}
