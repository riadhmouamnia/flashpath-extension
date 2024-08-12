/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MediaEventType,
  MessageType,
  UrlInteractionsState,
} from "@/entrypoints/types";
import {
  loadFromBrowserStorage,
  loadFromLocalStorage,
  saveToBrowserStorage,
  saveToLocalStorage,
} from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const initializeUrlState = (url: string) => ({
  url,
  totalTimeSpent: 0,
  reloadCount: 0,
  hasScrolledFullPage: false,
  isBookmarked: false,
  textHighlightEvent: [],
  mediaEvent: [],
  clickEvent: [],
  scrollPosition: [],
  Keystrokes: [],
});

const userId = 123;
const pathId = 123456;

export default function useTrackInteractions(tabUrl: string) {
  const [urlInteractions, setUrlInteractions] = useState<UrlInteractionsState>(
    () => ({ [tabUrl]: initializeUrlState(tabUrl) })
  );

  const urlRef = useRef(tabUrl);
  const startTime = useRef(Date.now());
  const totalTimeSpent = useRef(0);
  const isActive = useRef(true);

  // calculate total time spent on the page
  const handleTimeSpent = () => {
    if (document.hidden) {
      // Tab becomes inactive
      const timeSpent = Date.now() - startTime.current;
      totalTimeSpent.current += timeSpent;
      isActive.current = false;
      loadFromBrowserStorage("urlInteractions").then((data) => {
        const savedTimeSpent = data[window.location.href]?.totalTimeSpent || 0;
        setUrlInteractions((prev) => {
          const updatedInteractions = {
            ...prev,
            [window.location.href]: {
              ...prev[window.location.href],
              totalTimeSpent: savedTimeSpent + totalTimeSpent.current,
            },
          };
          saveToBrowserStorage({
            key: "urlInteractions",
            value: updatedInteractions,
            type: "interactions",
            userId,
            pathId,
          });
          return updatedInteractions;
        });
      });
    } else {
      // Tab becomes active
      startTime.current = Date.now();
      isActive.current = true;
    }
  };

  // calculate total time spent on the page when unloading
  const handleUnload = () => {
    if (isActive.current) {
      const timeSpent = Date.now() - startTime.current;
      totalTimeSpent.current += timeSpent;
      setUrlInteractions((prev) => {
        const prevTotalTimeSpent =
          prev[window.location.href]?.totalTimeSpent || 0;
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            totalTimeSpent: prevTotalTimeSpent + totalTimeSpent.current,
          },
        };
        saveToBrowserStorage({
          key: "urlInteractions",
          value: updatedInteractions,
          type: "interactions",
          userId,
          pathId,
        });
        return updatedInteractions;
      });
    }
  };

  // Check if the page was reloaded
  const handleReload = () => {
    const navigationEntries = performance.getEntriesByType("navigation");
    if (
      navigationEntries.length > 0 &&
      (navigationEntries[0] as PerformanceNavigationTiming).type === "reload"
    ) {
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            reloadCount: prev[window.location.href].reloadCount + 1 || 0,
          },
        };
        return updatedInteractions;
      });
    }
  };

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            hasScrolledFullPage: true,
          },
        };
        return updatedInteractions;
      });
    }
    setUrlInteractions((prev) => {
      const updatedInteractions = {
        ...prev,
        [window.location.href]: {
          ...prev[window.location.href],
          scrollPosition: [
            ...(prev[window.location.href]?.scrollPosition ?? []),
            {
              scrollY: window.scrollY,
              scrollX: window.scrollX,
              timeStamp: Date.now(),
            },
          ],
        },
      };
      return updatedInteractions;
    });
  };

  const handleSelectText = (e: MouseEvent) => {
    // avoid selecting text in the extension that has attribute of data-wxt-shadow-root
    if (
      e.target instanceof HTMLElement &&
      e.target.closest("wxt-react-example[data-wxt-shadow-root]")
    ) {
      console.log("Trying to select text in the extension");
      return;
    }
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) {
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            textHighlightEvent: [
              ...(prev[window.location.href]?.textHighlightEvent || []),
              {
                highlightedText: selectedText,
                timeStamp: Date.now(),
              },
            ],
          },
        };
        return updatedInteractions;
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
        timeStamp: Date.now(),
      };
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            clickEvent: [
              ...(prev[window.location.href]?.clickEvent ?? []),
              clickEvent,
            ],
          },
        };
        return updatedInteractions;
      });
    }
  };

  const handleMediaEvent = (e: Event) => {
    const mediaElement = e.target as HTMLMediaElement;
    const event = e.type as MediaEventType;
    setUrlInteractions((prev) => {
      const updatedInteractions = {
        ...prev,
        [window.location.href]: {
          ...prev[window.location.href],
          mediaEvent: [
            ...(prev[window.location.href]?.mediaEvent ?? []),
            {
              event,
              currentTime: mediaElement.currentTime,
              timeStamp: Date.now(),
            },
          ],
        },
      };
      return updatedInteractions;
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
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            isBookmarked: true,
          },
        };
        return updatedInteractions;
      });
    } else if (messageType === MessageType.BOOKMARK_REMOVED) {
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            isBookmarked: false,
          },
        };
        return updatedInteractions;
      });
    }
  };

  const handleKeyStrokes = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setUrlInteractions((prev) => {
      const updatedInteractions = {
        ...prev,
        [window.location.href]: {
          ...prev[window.location.href],
          Keystrokes: [
            ...(prev[window.location.href]?.Keystrokes ?? []),
            {
              inputValue: target.value,
              inputType: target.type,
              inputName:
                target.name || target.id || target.className || "unknown",
              timeStamp: Date.now(),
            },
          ],
        },
      };
      return updatedInteractions;
    });
  };

  useEffect(() => {
    loadFromBrowserStorage("urlInteractions").then((data) => {
      if (data[tabUrl]) {
        setUrlInteractions(data);
      } else {
        setUrlInteractions((prev) => {
          const updatedInteractions = {
            ...prev,
            [tabUrl]: initializeUrlState(tabUrl),
          };
          return updatedInteractions;
        });
      }
    });

    browser.runtime.onMessage.addListener(handleMessages);
    document.addEventListener("visibilitychange", handleTimeSpent);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseup", handleSelectText);
    document.addEventListener("dblclick", handleClick);
    document.querySelectorAll("video , audio").forEach((mediaElemnt) => {
      mediaElemnt.addEventListener("play", handleMediaEvent);
      mediaElemnt.addEventListener("pause", handleMediaEvent);
      mediaElemnt.addEventListener("seeked", handleMediaEvent);
      mediaElemnt.addEventListener("volumechange", handleMediaEvent);
      mediaElemnt.addEventListener("fullscreenchange", handleMediaEvent);
      mediaElemnt.addEventListener("exitfullscreen", handleMediaEvent);
      mediaElemnt.addEventListener("mute", handleMediaEvent);
      mediaElemnt.addEventListener("unmute", handleMediaEvent);
    });
    document.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("input", handleKeyStrokes);
    });
    return () => {
      browser.runtime.onMessage.removeListener(handleMessages);
      document.removeEventListener("visibilitychange", handleTimeSpent);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseup", handleSelectText);
      document.removeEventListener("dblclick", handleClick);
      document.querySelectorAll("video , audio").forEach((mediaElemnt) => {
        mediaElemnt.removeEventListener("play", handleMediaEvent);
        mediaElemnt.removeEventListener("pause", handleMediaEvent);
        mediaElemnt.removeEventListener("seeked", handleMediaEvent);
        mediaElemnt.removeEventListener("volumechange", handleMediaEvent);
        mediaElemnt.removeEventListener("fullscreenchange", handleMediaEvent);
        mediaElemnt.removeEventListener("exitfullscreen", handleMediaEvent);
        mediaElemnt.removeEventListener("mute", handleMediaEvent);
        mediaElemnt.removeEventListener("unmute", handleMediaEvent);
      });
      document.querySelectorAll("input, textarea").forEach((input) => {
        input.removeEventListener("input", handleKeyStrokes);
      });
      saveToBrowserStorage({
        key: "urlInteractions",
        value: urlInteractions,
        type: "interactions",
        userId,
        pathId,
      });
    };
  }, []);

  useEffect(() => {
    // Check for reload when the component mounts
    handleReload();
  }, []);

  useEffect(() => {
    // Update the urlInteractions state when the tabUrl changes
    const currentUrl = urlRef.current;
    const newUrl = tabUrl;
    if (currentUrl == newUrl) {
      return;
    }
    setUrlInteractions((prev) => {
      const updatedInteractions = { ...prev };
      // Update time spent on the current URL
      const pevTotatTimeSpent = updatedInteractions[currentUrl]?.totalTimeSpent;
      if (prev[currentUrl]) {
        if (isActive.current) {
          const timeSpent = Date.now() - startTime.current;
          totalTimeSpent.current += timeSpent;
          isActive.current = false;
          updatedInteractions[currentUrl].totalTimeSpent = pevTotatTimeSpent
            ? pevTotatTimeSpent + totalTimeSpent.current
            : totalTimeSpent.current;
        }
      }
      // Initialize new URL state if it doesn't exist
      if (!updatedInteractions[newUrl]) {
        updatedInteractions[newUrl] = initializeUrlState(newUrl);
      }
      // Update start time for the new URL
      startTime.current = Date.now();
      totalTimeSpent.current = 0;
      isActive.current = true;
      urlRef.current = newUrl;
      saveToBrowserStorage({
        key: "urlInteractions",
        value: updatedInteractions,
        type: "interactions",
        userId,
        pathId,
      });
      return updatedInteractions;
    });
  }, [tabUrl]);

  return { urlInteractions };
}
