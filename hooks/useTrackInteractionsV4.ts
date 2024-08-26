/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DbInteraction,
  DbPage,
  Interactions,
  MediaEventType,
  MessageType,
  Page,
  UrlState,
} from "@/entrypoints/types";
import {
  insertInteractionsToDb,
  insertPageToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
  updateInteractionsOnDb,
  updatePageOnDb,
} from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const initializeUrlState = (url: string) => ({
  url,
  domain: new URL(url).hostname,
  timeOnPage: 0,
  isBookmarked: false,
  interactions: {
    clickEvents: [],
    scrollEvents: [],
    selectionEvents: [],
    mediaEvents: [],
    keyEvents: [],
  } as Interactions,
});

export default function useTrackInteractions({
  tabUrl,
  pageId,
}: {
  tabUrl: string;
  pageId: number;
}) {
  const [urlInteractions, setUrlInteractions] = useState<UrlState>(() => ({
    [tabUrl]: initializeUrlState(tabUrl),
  }));

  const [interactions, setInteractions] = useState<DbInteraction | null>(null);

  const urlRef = useRef(tabUrl);
  const startTime = useRef(Date.now());
  const totalTimeOnPage = useRef(0);
  const isActive = useRef(true);

  // calculate total time spent on the page
  const handleTimeSpent = () => {
    if (document.hidden) {
      // Tab becomes inactive
      const timeSpent = Date.now() - startTime.current;
      totalTimeOnPage.current += timeSpent;
      isActive.current = false;
      loadFromBrowserStorage("urlInteractions").then((data) => {
        const savedTimeOnPage = data[window.location.href]?.timeOnPage || 0;
        setUrlInteractions((prev) => {
          const updatedInteractions = {
            ...prev,
            [window.location.href]: {
              ...prev[window.location.href],
              timeOnPage: savedTimeOnPage + totalTimeOnPage.current,
            },
          };
          updatePageOnDb({
            pageId,
            page: updatedInteractions[window.location.href],
          });
          updateInteractionsOnDb({
            id: interactions?.id!,
            interactions:
              updatedInteractions[window.location.href]?.interactions,
          });
          saveToBrowserStorage({
            key: "urlInteractions",
            value: updatedInteractions,
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
      totalTimeOnPage.current += timeSpent;
      setUrlInteractions((prev) => {
        const prevTotalTimeSpent = prev[window.location.href]?.timeOnPage || 0;
        const updatedInteractions = {
          ...prev,
          [window.location.href]: {
            ...prev[window.location.href],
            timeOnPage: prevTotalTimeSpent + totalTimeOnPage.current,
          },
        };
        updatePageOnDb({
          pageId,
          page: updatedInteractions[window.location.href],
        });
        updateInteractionsOnDb({
          id: interactions?.id!,
          interactions: updatedInteractions[window.location.href]?.interactions,
        });
        saveToBrowserStorage({
          key: "urlInteractions",
          value: updatedInteractions,
        });
        return updatedInteractions;
      });
    }
  };

  const handleScroll = () => {
    setUrlInteractions((prev) => {
      const updatedInteractions = {
        ...prev,
        [window.location.href]: {
          ...prev[window.location.href],
          interactions: {
            ...prev[window.location.href].interactions,
            scrollEvents: [
              ...(prev[window.location.href]?.interactions.scrollEvents || []),
              {
                timeStamp: Date.now(),
                scrollX: window.scrollX,
                scrollY: window.scrollY,
              },
            ],
          },
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
            interactions: {
              ...prev[window.location.href].interactions,
              selectionEvents: [
                ...(prev[window.location.href]?.interactions.selectionEvents ??
                  []),
                {
                  highlightedText: selectedText,
                  timeStamp: Date.now(),
                },
              ],
            },
          },
        };
        updateInteractionsOnDb({
          id: interactions?.id!,
          interactions: updatedInteractions[window.location.href]?.interactions,
        });
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
            interactions: {
              ...prev[window.location.href].interactions,
              clickEvents: [
                ...(prev[window.location.href]?.interactions.clickEvents ?? []),
                clickEvent,
              ],
            },
          },
        };
        updateInteractionsOnDb({
          id: interactions?.id!,
          interactions: updatedInteractions[window.location.href]?.interactions,
        });
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
          interactions: {
            ...prev[window.location.href].interactions,
            mediaEvents: [
              ...(prev[window.location.href]?.interactions.mediaEvents ?? []),
              {
                event,
                currentTime: mediaElement.currentTime,
                timeStamp: Date.now(),
              },
            ],
          },
        },
      };
      updateInteractionsOnDb({
        id: interactions?.id!,
        interactions: updatedInteractions[window.location.href]?.interactions,
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
          interactions: {
            ...prev[window.location.href].interactions,
            keyEvents: [
              ...(prev[window.location.href]?.interactions.keyEvents ?? []),
              {
                inputValue: target.value,
                inputType: target.type,
                inputName:
                  target.name || target.id || target.className || "unknown",
                timeStamp: Date.now(),
              },
            ],
          },
        },
      };
      updateInteractionsOnDb({
        id: interactions?.id!,
        interactions: updatedInteractions[window.location.href]?.interactions,
      });
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
    const initInteractionsOnDb = async () => {
      const insertedInteractions = await insertInteractionsToDb({
        interactions: {
          clickEvents: [],
          scrollEvents: [],
          selectionEvents: [],
          mediaEvents: [],
          keyEvents: [],
        },
        pageId,
      });
      if (insertedInteractions) {
        console.log("Interactions inserted hook", insertedInteractions);
        setInteractions(insertedInteractions as DbInteraction);
      }
    };
    initInteractionsOnDb();
  }, [tabUrl]);

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
      saveToBrowserStorage({
        key: "urlInteractions",
        value: urlInteractions,
      });
    };
  }, [interactions]);

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
      const pevTotatTimeOnPage = updatedInteractions[currentUrl]?.timeOnPage;
      if (prev[currentUrl]) {
        if (isActive.current) {
          const timeSpent = Date.now() - startTime.current;
          totalTimeOnPage.current += timeSpent;
          isActive.current = false;
          updatedInteractions[currentUrl].timeOnPage = pevTotatTimeOnPage
            ? pevTotatTimeOnPage + totalTimeOnPage.current
            : totalTimeOnPage.current;
        }
        updatePageOnDb({
          pageId,
          page: updatedInteractions[currentUrl],
        });
        updateInteractionsOnDb({
          id: interactions?.id!,
          interactions: updatedInteractions[currentUrl]?.interactions,
        });
      }
      // Initialize new URL state if it doesn't exist
      if (!updatedInteractions[newUrl]) {
        updatedInteractions[newUrl] = initializeUrlState(newUrl);
      }
      // Update start time for the new URL
      startTime.current = Date.now();
      totalTimeOnPage.current = 0;
      isActive.current = true;
      urlRef.current = newUrl;
      saveToBrowserStorage({
        key: "urlInteractions",
        value: updatedInteractions,
      });
      return updatedInteractions;
    });
  }, [tabUrl]);

  return { urlInteractions };
}
