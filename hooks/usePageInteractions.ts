/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MessageType,
  Page,
  Interaction,
  MediaEventType,
} from "@/entrypoints/types";
import { updatePageOnDb } from "@/lib/utils";
import { useEffect, useRef, useReducer, useState } from "react";

const initializePageState = (url: string): Page => ({
  url,
  domain: new URL(url).hostname,
  timeOnPage: 0,
  isBookmarked: false,
});

enum ActionType {
  UPDATE_PAGE = "UPDATE_PAGE",
}

type Action = {
  type: ActionType;
  payload: any;
};

const reducer = (state: Page, action: Action): Page => {
  switch (action.type) {
    case "UPDATE_PAGE":
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export default function usePageInteractions({
  tabUrl,
  pageId,
}: {
  tabUrl: string;
  pageId?: number;
}) {
  const [pageState, dispatch] = useReducer(
    reducer,
    initializePageState(tabUrl)
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
        type: ActionType.UPDATE_PAGE,
        payload: { timeOnPage: totalTimeSpent.current },
      });
      updatePageOnDb({
        pageId,
        page: {
          ...pageState,
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
      const prevTimeSpent = pageState.timeOnPage;
      const newTotalTimeSpent = prevTimeSpent + totalTimeSpent.current;
      dispatch({
        type: ActionType.UPDATE_PAGE,
        payload: { timeOnPage: newTotalTimeSpent },
      });
      updatePageOnDb({
        pageId,
        page: {
          ...pageState,
          timeOnPage: newTotalTimeSpent,
        },
      });
    }
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
        page: { ...pageState, isBookmarked: true },
      });
    } else if (messageType === MessageType.BOOKMARK_REMOVED) {
      dispatch({
        type: ActionType.UPDATE_PAGE,
        payload: { isBookmarked: false },
      });
      updatePageOnDb({
        pageId,
        page: { ...pageState, isBookmarked: false },
      });
    }
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(handleMessages);
    document.addEventListener("visibilitychange", handleTimeSpent);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessages);
      document.removeEventListener("visibilitychange", handleTimeSpent);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, []);

  useEffect(() => {
    const oldUrl = urlRef.current;
    const newUrl = tabUrl;
    const prevTimeSpent = pageState.timeOnPage;

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
              ...pageState,
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

  return { pageState };
}
