import {
  chunkSubstr,
  insertRrwebChunksToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { EventType } from "rrweb";
import * as rrweb from "rrweb";
import { Page } from "@/entrypoints/types";
import { pack } from "@rrweb/packer";

function useRRWEBRecorder({
  pageId,
  pageUrl,
  username,
  pathname,
  pageState,
}: {
  pageId?: number;
  pageUrl: string;
  username: string;
  pathname: string;
  pageState: Page;
}) {
  const events = useRef<EventType[]>([]);
  const stopRecordingFn = useRef<any>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const currentUrl = useRef<string>(pageUrl);

  const save = useCallback(() => {
    if (events.current.length === 0) return;
    if (!pageId) {
      console.log("pageId is not defined");
      return;
    }
    insertRrwebChunksToDb({ events: events.current, pageId });
    events.current = [];
  }, [pageId]);

  // save events when window is closed or unmounted
  const handleUnload = () => {
    save();
  };

  const stopRecording = useCallback(() => {
    save();
    setIsRecording(false);
    stopRecordingFn.current();
    saveToBrowserStorage({ key: "isRecording", value: false });
  }, []);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    saveToBrowserStorage({ key: "isRecording", value: true });
  }, []);

  useEffect(() => {
    const loadIsRecordingStateFromStorage = async () => {
      const isRecordingState = await loadFromBrowserStorage("isRecording");
      if (isRecordingState) {
        setIsRecording(isRecordingState);
      } else {
        setIsRecording(false);
      }
    };
    loadIsRecordingStateFromStorage();
  }, []);

  useEffect(() => {
    let connection: signalR.HubConnection;
    if (isRecording) {
      const stopFn = rrweb.record({
        async emit(event: EventType, isCheckout) {
          if (isCheckout) {
            // Handle full snapshot event
            const jsonString = JSON.stringify(event);
            const chunks = chunkSubstr(jsonString, 2000); // Set chunk size (e.g., 1000 chars)
            chunks.forEach((chunk, index) => {
              events.current.push({
                chunk, // Store chunked string
                chunkIndex: index, // Label chunk with its index
                totalChunks: chunks.length, // Total number of chunks for reconstruction
                isChunked: true, // Add a flag to identify chunked snapshots
              } as any);
            });
          } else {
            // Handle regular events
            events.current.push(event);
          }
        },
        recordAfter: "DOMContentLoaded",
        // 2 sec checkout every 2 sec to get all page assets and resource to avoid missing css on the page when replay
        // also we can refresh the page whenever the tab url changes which is not ideal for smooth ux
        checkoutEveryNms: 2000,
        slimDOMOptions: {
          script: false,
          comment: false,
          headFavicon: false,
          headWhitespace: false,
          headMetaDescKeywords: false,
          headMetaSocial: false,
          headMetaRobots: false,
          headMetaHttpEquiv: false,
          headMetaAuthorship: false,
          headMetaVerification: false,
          headTitleMutations: false,
        },
        sampling: {
          // set the interval of scrolling event
          // do not emit twice in 150ms
          scroll: 250,
          // set the timing of record input
          input: "last", // When input mulitple characters, only record the final input
        },
      });
      stopRecordingFn.current = () => {
        if (stopFn) stopFn();
      };

      // save events every 5 seconds
      interval.current = setInterval(() => {
        save();
      }, 3000);
      window.addEventListener("beforeunload", handleUnload);

      return () => {
        save();
        if (interval.current) clearInterval(interval.current);
        stopRecordingFn.current();
        window.removeEventListener("beforeunload", handleUnload);
      };
    } else {
      return;
    }
  }, [isRecording]);

  return { startRecording, stopRecording, isRecording };
}

export default useRRWEBRecorder;
