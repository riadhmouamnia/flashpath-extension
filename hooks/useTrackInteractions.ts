/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MediaEventType,
  MessageType,
  UrlInteractionsState,
} from "@/entrypoints/types";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const initializeUrlState = () => ({
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

export default function useTrackInteractions(tabUrl: string) {
  const [urlInteractions, setUrlInteractions] = useState<UrlInteractionsState>(
    () => {
      const savedState = loadFromLocalStorage("urlInteractions");
      return savedState[tabUrl]
        ? savedState
        : { [tabUrl]: initializeUrlState() };
    }
  );

  const urlRef = useRef(tabUrl);
  console.log("urlRef", urlRef.current);
  const startTime = useRef(Date.now());
  const totalTimeSpent = useRef(0);
  const isActive = useRef(true);
  const url = useRef(tabUrl);

  // calculate total time spent on the page
  const handleTimeSpent = () => {
    if (document.hidden) {
      // Tab becomes inactive
      const timeSpent = Date.now() - startTime.current;
      totalTimeSpent.current += timeSpent;
      isActive.current = false;
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            totalTimeSpent: totalTimeSpent.current,
          },
        };
        saveToLocalStorage({
          key: "urlInteractions",
          value: updatedInteractions,
        });
        return updatedInteractions;
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
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            totalTimeSpent: totalTimeSpent.current,
          },
        };
        saveToLocalStorage({
          key: "urlInteractions",
          value: updatedInteractions,
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
        saveToLocalStorage({
          key: "urlInteractions",
          value: updatedInteractions,
        });
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
        saveToLocalStorage({
          key: "urlInteractions",
          value: updatedInteractions,
        });
        return updatedInteractions;
      });
    }
    setUrlInteractions((prev) => {
      const updatedInteractions = {
        ...prev,
        [window.location.href]: {
          ...prev[window.location.href],
          scrollPosition: [
            ...(prev[window.location.href].scrollPosition ?? []),
            {
              scrollY: window.scrollY,
              scrollX: window.scrollX,
              timeStamp: Date.now(),
            },
          ],
        },
      };
      saveToLocalStorage({
        key: "urlInteractions",
        value: updatedInteractions,
      });
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
    const selectedText = window.getSelection()?.toString();
    if (selectedText) {
      setUrlInteractions((prev) => {
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            interactions: {
              ...prev[window.location.href].interactions,
              textHighlightEvent: [
                ...(prev[window.location.href].interactions
                  ?.textHighlightEvent || []),
                {
                  highlightedText: selectedText,
                  timeStamp: Date.now(),
                },
              ],
            },
          },
        };
        saveToLocalStorage({
          key: "urlInteractions",
          value: updatedInteractions,
        });
        return updatedInteractions;
      });
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      e.target.closest("wxt-react-example[data-wxt-shadow-root]")
    ) {
      console.log("clicked on extension");
      return;
    }
    setUrlInteractions((prev) => {
      const updatedInteractions = {
        ...prev,
        [window.location.href]: {
          ...prev[window.location.href],
          interactions: {
            ...prev[window.location.href].interactions,
            clickEvent: [
              ...(prev[window.location.href].interactions?.clickEvent ?? []),
              {
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
            ],
          },
        },
      };
      saveToLocalStorage({
        key: "urlInteractions",
        value: updatedInteractions,
      });
      return updatedInteractions;
    });
  };

  const handleMediaEvent = (e: Event) => {
    const mediaElement = e.target as HTMLMediaElement;
    const event = e.type as MediaEventType;
    setUrlInteractions((prev) => {
      const updatedInteractions = {
        ...prev,
        [window.location.href]: {
          ...prev[window.location.href],
          interactions: {
            ...prev[window.location.href].interactions,
            mediaEvent: [
              ...(prev[window.location.href].interactions?.mediaEvent ?? []),
              {
                event,
                currentTime: mediaElement.currentTime,
                timeStamp: Date.now(),
              },
            ],
          },
        },
      };
      saveToLocalStorage({
        key: "urlInteractions",
        value: updatedInteractions,
      });
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
        saveToLocalStorage({
          key: "urlInteractions",
          value: updatedInteractions,
        });
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
        saveToLocalStorage({
          key: "urlInteractions",
          value: updatedInteractions,
        });
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
            ...(prev[window.location.href].Keystrokes ?? []),
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
      saveToLocalStorage({
        key: "urlInteractions",
        value: updatedInteractions,
      });
      return updatedInteractions;
    });
  };

  useEffect(() => {
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
      // Save state to local storage when the component unmounts
      saveToLocalStorage({ key: "urlInteractions", value: urlInteractions });
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
        updatedInteractions[newUrl] = initializeUrlState();
      }
      // Update start time for the new URL
      startTime.current = Date.now();
      totalTimeSpent.current = 0;
      isActive.current = true;
      urlRef.current = newUrl;
      saveToLocalStorage({
        key: "urlInteractions",
        value: updatedInteractions,
      });
      return updatedInteractions;
    });
  }, [tabUrl]);

  return { urlInteractions };
}
