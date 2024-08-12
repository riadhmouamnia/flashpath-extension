/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Interactions from "@/components/interactions";
import { MessageType } from "@/entrypoints/types";
import { useEffect, useState } from "react";

// Type definitions
type TextHighlightEvent = {
  highlightedText: string;
  timeStamp: number;
};

type ScrollEvent = {
  scrollY: number;
  scrollX: number;
  timeStamp: number;
};

type KeystrokeEvent = {
  inputValue: string;
  inputType: string;
  inputName: string;
  timeStamp: number;
};

type MediaEventType =
  | "PLAY"
  | "PAUSE"
  | "MUTE"
  | "UNMUTE"
  | "VOLUMECHANGE"
  | "FULLSCREEN"
  | "EXITFULLSCREEN"
  | "SEEK";

type MediaEvent = {
  event: MediaEventType;
  currentTime: number;
  timeStamp: number;
};

type ClickEvent = {
  tagName: string;
  clientX: number;
  clientY: number;
  attributes: { [key: string]: string };
  timeStamp: number;
};

type Interactions = {
  textHighlights: TextHighlightEvent[];
  scrollEvents: ScrollEvent[];
  keystrokes: KeystrokeEvent[];
  mediaEvents: MediaEvent[];
  clickEvents: ClickEvent[];
  reloadCount: number;
  timeSpent: number; // Time spent on the page in milliseconds
  isBookmarked: boolean;
  hasScrolledFullPage: boolean;
};

const useTrackInteractions = (url: string) => {
  const [interactions, setInteractions] = useState<Interactions>({
    textHighlights: [],
    scrollEvents: [],
    keystrokes: [],
    mediaEvents: [],
    clickEvents: [],
    reloadCount: 0,
    timeSpent: 0,
    hasScrolledFullPage: false,
    isBookmarked: false,
  });

  const saveInteraction = (type: keyof Interactions, event: any) => {
    const storageKey = `interactions:${url}`;
    browser.storage.local.get([storageKey]).then((result) => {
      const currentData: Interactions = result[storageKey] || {
        textHighlights: [],
        scrollEvents: [],
        keystrokes: [],
        mediaEvents: [],
        clickEvents: [],
        reloadCount: 0,
        timeSpent: 0,
        isBookmarked: false,
        hasScrolledFullPage: false,
      };
      if (
        type === "reloadCount" ||
        type === "timeSpent" ||
        type === "isBookmarked" ||
        type === "hasScrolledFullPage"
      ) {
        currentData[type] = event as never;
        browser.storage.local.set({ [storageKey]: currentData });
      } else {
        currentData[type] = [...currentData[type], event];
      }
      browser.storage.local.set({ [storageKey]: currentData });
    });
  };

  let startTime = Date.now();
  let lastVisibilityChange = Date.now();
  let isPageVisible = true;

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      const now = Date.now();
      const timeSpent = now - lastVisibilityChange;
      lastVisibilityChange = now;

      setInteractions((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + timeSpent,
      }));

      saveInteraction("timeSpent", timeSpent);
    } else {
      lastVisibilityChange = Date.now();
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
      setInteractions((prev) => ({
        ...prev,
        isBookmarked: true,
      }));
    } else if (messageType === MessageType.BOOKMARK_REMOVED) {
      setInteractions((prev) => ({
        ...prev,
        isBookmarked: false,
      }));
    }
  };

  // Track reloads
  const handleReload = () => {
    const storageKey = `interactions:${url}`;
    const navigationEntries = performance.getEntriesByType("navigation");
    if (
      navigationEntries.length > 0 &&
      (navigationEntries[0] as PerformanceNavigationTiming).type === "reload"
    ) {
      browser.storage.local.get([storageKey]).then((result) => {
        const currentData: Interactions = result[storageKey] || {
          textHighlights: [],
          scrollEvents: [],
          keystrokes: [],
          mediaEvents: [],
          clickEvents: [],
          reloadCount: 0,
          timeSpent: 0,
          isBookmarked: false,
          hasScrolledFullPage: false,
        };
        currentData.reloadCount += 1;
        browser.storage.local.set({ [storageKey]: currentData });
        setInteractions(currentData);
      });
    }
  };

  useEffect(() => {
    handleReload();
  }, []);

  useEffect(() => {
    const storageKey = `interactions:${url}`;
    browser.storage.local.get([storageKey]).then((result) => {
      if (result[storageKey]) {
        setInteractions(result[storageKey]);
      }
    });

    const handleMouseUp = () => {
      const selectedText = window.getSelection()?.toString();
      if (selectedText) {
        const event: TextHighlightEvent = {
          highlightedText: selectedText,
          timeStamp: Date.now(),
        };
        setInteractions((prev) => ({
          ...prev,
          textHighlights: [...prev.textHighlights, event],
        }));
        saveInteraction("textHighlights", event);
      }
    };

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        setInteractions((prev) => ({
          ...prev,
          hasScrolledFullPage: true,
        }));
        saveInteraction("hasScrolledFullPage", true);
      }
      const event: ScrollEvent = {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        timeStamp: Date.now(),
      };
      setInteractions((prev) => ({
        ...prev,
        scrollEvents: [...prev.scrollEvents, event],
      }));
      saveInteraction("scrollEvents", event);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const { target } = event;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        const keystroke: KeystrokeEvent = {
          inputValue: target.value,
          inputType: target.type,
          inputName: target.name,
          timeStamp: Date.now(),
        };
        setInteractions((prev) => ({
          ...prev,
          keystrokes: [...prev.keystrokes, keystroke],
        }));
        saveInteraction("keystrokes", keystroke);
      }
    };

    const handleMediaEvent = (event: Event, type: MediaEventType) => {
      if (event.target instanceof HTMLMediaElement) {
        const mediaEvent: MediaEvent = {
          event: type,
          currentTime: event.target.currentTime,
          timeStamp: Date.now(),
        };
        setInteractions((prev) => ({
          ...prev,
          mediaEvents: [...prev.mediaEvents, mediaEvent],
        }));
        saveInteraction("mediaEvents", mediaEvent);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const { target } = event;
      if (target instanceof Element) {
        const clickEvent: ClickEvent = {
          tagName: target.tagName,
          clientX: event.clientX,
          clientY: event.clientY,
          attributes: Array.from(target.attributes).reduce<{
            [key: string]: string;
          }>((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          timeStamp: Date.now(),
        };
        setInteractions((prev) => ({
          ...prev,
          clickEvents: [...prev.clickEvents, clickEvent],
        }));
        saveInteraction("clickEvents", clickEvent);
      }
    };

    browser.runtime.onMessage.addListener(handleMessages);

    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("dblclick", handleClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const mediaElements = document.querySelectorAll("video, audio");
    mediaElements.forEach((element) => {
      element.addEventListener("play", (e) => handleMediaEvent(e, "PLAY"));
      element.addEventListener("pause", (e) => handleMediaEvent(e, "PAUSE"));
      element.addEventListener("volumechange", (e) =>
        handleMediaEvent(e, "VOLUMECHANGE")
      );
      element.addEventListener("fullscreenchange", (e) =>
        handleMediaEvent(e, "FULLSCREEN")
      );
      element.addEventListener("webkitfullscreenchange", (e) =>
        handleMediaEvent(e, "FULLSCREEN")
      );
      element.addEventListener("seeking", (e) => handleMediaEvent(e, "SEEK"));
    });

    return () => {
      browser.runtime.onMessage.removeListener(handleMessages);

      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("dblclick", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      mediaElements.forEach((element) => {
        element.removeEventListener("play", (e) => handleMediaEvent(e, "PLAY"));
        element.removeEventListener("pause", (e) =>
          handleMediaEvent(e, "PAUSE")
        );
        element.removeEventListener("volumechange", (e) =>
          handleMediaEvent(e, "VOLUMECHANGE")
        );
        element.removeEventListener("fullscreenchange", (e) =>
          handleMediaEvent(e, "FULLSCREEN")
        );
        element.removeEventListener("webkitfullscreenchange", (e) =>
          handleMediaEvent(e, "FULLSCREEN")
        );
        element.removeEventListener("seeking", (e) =>
          handleMediaEvent(e, "SEEK")
        );
      });

      // Save time spent on the page before unmounting
      const endTime = Date.now();
      const timeSpent = endTime - startTime;
      setInteractions((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + timeSpent,
      }));
      browser.storage.local.get([storageKey]).then((result) => {
        const currentData: Interactions = result[storageKey] || {
          textHighlights: [],
          scrollEvents: [],
          keystrokes: [],
          mediaEvents: [],
          clickEvents: [],
          reloadCount: 0,
          timeSpent: 0,
          isBookmarked: false,
          hasScrolledFullPage: false,
        };
        currentData.timeSpent += timeSpent;
        browser.storage.local.set({ [storageKey]: currentData });
      });
    };
  }, [url]);

  return interactions;
};

export default useTrackInteractions;
