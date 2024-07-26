/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import {
  MediaEventType,
  MessageType,
  UrlInteractionsState,
} from "@/entrypoints/types";
// import { formatTimeSpent } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { JSONTree } from "react-json-tree";

const theme = {
  scheme: "monokai",
  author: "wimer hazenberg (http://www.monokai.nl)",
  base00: "#272822",
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633",
};

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

// const saveToLocalStorage = (data: UrlInteractionsState) => {
//   localStorage.setItem("urlInteractions", JSON.stringify(data));
// };

// const loadFromLocalStorage = () => {
//   const data = localStorage.getItem("urlInteractions");
//   return data ? JSON.parse(data) : {};
// };

// const clearLocalStorage = () => {
//   localStorage.removeItem("urlInteractions");
// };

// clearLocalStorage();
export default function TrackInteractions({ tabUrl }: { tabUrl: string }) {
  const [urlInteractions, setUrlInteractions] = useState<UrlInteractionsState>(
    () => {
      // const savedState = loadFromLocalStorage();
      // const currentUrl = window.location.href;
      // return savedState[tabUrl] ? savedState : initializeUrlState();
      return {
        [tabUrl]: initializeUrlState(),
      };
    }
  );

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
        // saveToLocalStorage(updatedInteractions);
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
        // saveToLocalStorage(updatedInteractions);
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
        // saveToLocalStorage(updatedInteractions);
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
        // saveToLocalStorage(updatedInteractions);
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
      // saveToLocalStorage(updatedInteractions);
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
        // saveToLocalStorage(updatedInteractions);
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
      // saveToLocalStorage(updatedInteractions);
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
      // saveToLocalStorage(updatedInteractions);
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
        // saveToLocalStorage(updatedInteractions);
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
        // saveToLocalStorage(updatedInteractions);
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
      // saveToLocalStorage(updatedInteractions);
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
      // saveToLocalStorage(urlInteractions);
    };
  }, []);

  useEffect(() => {
    // Check for reload when the component mounts
    handleReload();
  }, []);

  // useEffect(() => {
  //   // Update the urlInteractions state when the tabUrl changes
  //   setUrlInteractions((prev) => {
  //     const currentUrl = window.location.href;
  //     return {
  //       ...prev,
  //       [currentUrl]: {
  //         ...(prev[currentUrl] ?? initializeUrlState()),
  //       },
  //     };
  //   });
  //   // update total time spent when the tabUrl changes
  //   // handleUnload();
  // }, [tabUrl]);

  useEffect(() => {
    // Update the urlInteractions state when the tabUrl changes
    const currentUrl = url.current;
    const newUrl = tabUrl;
    if (currentUrl === newUrl) {
      return;
    }
    setUrlInteractions((prev) => {
      const updatedInteractions = { ...prev };
      // Update time spent on the current URL
      if (prev[currentUrl]) {
        if (isActive.current) {
          const timeSpent = Date.now() - startTime.current;
          totalTimeSpent.current += timeSpent;
          isActive.current = false;
          updatedInteractions[currentUrl].totalTimeSpent =
            totalTimeSpent.current;
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
      return updatedInteractions;
    });
  }, [tabUrl]);

  return (
    <Card className="fp-max-h-[340px] fp-h-fit fp-overflow-y-scroll fp-border-none">
      <div id="json-tree">
        <JSONTree data={urlInteractions} theme={theme} invertTheme={false} />
      </div>
      {/* <div>
        <pre>{JSON.stringify(urlInteractions, null, 2)}</pre>
      </div> */}
    </Card>
  );
}
