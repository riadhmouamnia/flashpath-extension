/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MessageType,
  Page,
  Interaction,
  MediaEventType,
} from "@/entrypoints/types";
import { insertInteractionsToDb, updatePageOnDb } from "@/lib/utils";
import { useEffect, useRef, useReducer, useState } from "react";

const initializeUrlState = (url: string) => ({
  page: {
    url,
    domain: new URL(url).hostname,
    timeOnPage: 0,
    isBookmarked: false,
  },
  interaction: null,
});

enum ActionType {
  UPDATE_PAGE = "UPDATE_PAGE",
  UPDATE_INTERACTION = "UPDATE_INTERACTION",
}

type Action = {
  type: ActionType;
  payload: any;
};

type State = {
  page: Page;
  interaction: Interaction | null;
};

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "UPDATE_PAGE":
      return {
        ...state,
        page: { ...state.page, ...action.payload },
      };
    case "UPDATE_INTERACTION":
      return {
        ...state,
        interaction: {
          ...state.interaction,
          type: action.payload.type,
          event: action.payload.event,
        },
      };
    default:
      return state;
  }
};

export default function useTrackInteractionWithReducer({
  tabUrl,
  pageId,
  networkAvailable,
  pageKey,
}: {
  tabUrl: string;
  pageId: number;
  networkAvailable: boolean;
  pageKey: string;
}) {
  const [urlInteractions, dispatch] = useReducer(
    reducer,
    initializeUrlState(tabUrl)
  );
  const [interactionKey, setInteractionKey] = useState<string | null>(null);

  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const keyTimeout = useRef<NodeJS.Timeout | null>(null);
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
        type: ActionType.UPDATE_PAGE,
        payload: { timeOnPage: totalTimeSpent.current },
      });
      updatePageOnDb({
        pageId,
        page: {
          ...urlInteractions.page,
          timeOnPage: totalTimeSpent.current,
        },
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
      const prevTimeSpent = urlInteractions.page.timeOnPage;
      const newTotalTimeSpent = prevTimeSpent + totalTimeSpent.current;
      dispatch({
        type: ActionType.UPDATE_PAGE,
        payload: { timeOnPage: newTotalTimeSpent },
      });
      updatePageOnDb({
        pageId,
        page: {
          ...urlInteractions.page,
          timeOnPage: newTotalTimeSpent,
        },
      });
    }
  };

  const handleScroll = () => {
    dispatch({
      type: ActionType.UPDATE_INTERACTION,
      payload: {
        type: "SCROLL_EVENT",
        event: {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          timestamp: Date.now(),
        },
      },
    });
    // register scroll event to db after user stops scrolling

    // Clear the previous timeout if it exists
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Set a new timeout to register the event to the database after user stops scrolling
    scrollTimeout.current = setTimeout(() => {
      insertInteractionsToDb({
        interaction: {
          type: "SCROLL_EVENT",
          event: {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            timestamp: Date.now(),
          },
        },
        pageId,
      });
    }, 1000);
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
        type: ActionType.UPDATE_INTERACTION,
        payload: {
          type: "SELECT_EVENT",
          event: {
            highlightedText: selectedText,
            timestamp: Date.now(),
          },
        },
      });
      insertInteractionsToDb({
        interaction: {
          type: "SELECT_EVENT",
          event: {
            highlightedText: selectedText,
            timestamp: Date.now(),
          },
        },
        pageId,
      });
    }
  };

  const handleClick = (e: MouseEvent) => {
    const { target } = e;
    if (target instanceof Element) {
      if (target.closest("wxt-react-example[data-wxt-shadow-root]")) {
        console.log("clicked on extension");
        return;
      }
      const clickEvent = {
        tagName: target.tagName,
        clientX: e.clientX,
        clientY: e.clientY,
        attributes: Array.from(target.attributes).reduce<{
          [key: string]: string;
        }>((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {}),
        timestamp: Date.now(),
      };
      dispatch({
        type: ActionType.UPDATE_INTERACTION,
        payload: {
          type: "CLICK_EVENT",
          event: clickEvent,
        },
      });
      insertInteractionsToDb({
        interaction: {
          type: "CLICK_EVENT",
          event: clickEvent,
        },
        pageId,
      });
    }
  };

  const handleKeyStrokes = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const keyStroke = target.value;
    dispatch({
      type: ActionType.UPDATE_INTERACTION,
      payload: {
        type: "KEY_EVENT",
        event: {
          inputValue: keyStroke,
          inputType: target.type,
          inputName: target.name,
          timestamp: Date.now(),
        },
      },
    });

    // Clear the previous timeout if it exists
    if (keyTimeout.current) {
      clearTimeout(keyTimeout.current);
    }

    // Set a new timeout to register the event to the database after user stops typing
    keyTimeout.current = setTimeout(() => {
      insertInteractionsToDb({
        interaction: {
          type: "KEY_EVENT",
          event: {
            inputValue: keyStroke,
            inputType: target.type,
            inputName: target.name,
            timestamp: Date.now(),
          },
        },
        pageId,
      });
    }, 1000);
  };

  const handleMediaEvent = (e: Event) => {
    const mediaElement = e.target as HTMLMediaElement;
    const event = e.type as MediaEventType;
    dispatch({
      type: ActionType.UPDATE_INTERACTION,
      payload: {
        type: "MEDIA_EVENT",
        event: {
          event,
          currentTime: mediaElement.currentTime,
          timestamp: Date.now(),
        },
      },
    });
    insertInteractionsToDb({
      interaction: {
        type: "MEDIA_EVENT",
        event: {
          event,
          currentTime: mediaElement.currentTime,
          timestamp: Date.now(),
        },
      },
      pageId,
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
        type: ActionType.UPDATE_PAGE,
        payload: { isBookmarked: true },
      });
      updatePageOnDb({
        pageId,
        page: { ...urlInteractions.page, isBookmarked: true },
      });
    } else if (messageType === MessageType.BOOKMARK_REMOVED) {
      dispatch({
        type: ActionType.UPDATE_PAGE,
        payload: { isBookmarked: false },
      });
      updatePageOnDb({
        pageId,
        page: { ...urlInteractions.page, isBookmarked: false },
      });
    }
  };

  useEffect(() => {
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

    return () => {
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
  }, []);

  useEffect(() => {
    const oldUrl = urlRef.current;
    const newUrl = tabUrl;
    const prevTimeSpent = urlInteractions.page.timeOnPage;

    const handleUrlChange = async () => {
      if (oldUrl !== newUrl) {
        // Check if URL has actually changed
        if (isActive.current) {
          const timeSpent = Date.now() - startTime.current;
          totalTimeSpent.current += timeSpent;

          dispatch({
            type: ActionType.UPDATE_PAGE,
            payload: {
              timeOnPage: prevTimeSpent
                ? prevTimeSpent + totalTimeSpent.current
                : totalTimeSpent.current,
            },
          });

          updatePageOnDb({
            pageId,
            page: {
              ...urlInteractions.page,
              timeOnPage: prevTimeSpent
                ? prevTimeSpent + totalTimeSpent.current
                : totalTimeSpent.current,
            },
          });

          // Reset time spent trackers
          totalTimeSpent.current = 0;
          startTime.current = Date.now();
          isActive.current = true;
        }
      }
    };

    handleUrlChange();
  }, [tabUrl]);

  return { urlInteractions };
}
