import {
  insertRrwebEventToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { EventType } from "rrweb";
// import { listenerHandler } from "rrweb/typings/types";
import * as rrweb from "rrweb";
import { pack } from "@rrweb/packer";

function useRRWEBRecorder(pageId: number) {
  const events = useRef<EventType[]>([]);
  const stopRecordingFn = useRef<any>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const save = useCallback(() => {
    if (events.current.length === 0) return;
    if (!pageId) return;
    insertRrwebEventToDb({ events: events.current, pageId });
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
    if (isRecording) {
      const stopFn = rrweb.record({
        emit(event: EventType) {
          events.current.push(event);
        },
        recordAfter: "DOMContentLoaded",
        // 2 sec checkout every 2 sec to get all page assets and resource to avoid missing css on the page when replay
        // also we can refresh the page whenever the tab url changes which is not ideal for smooth ux
        checkoutEveryNms: 2000,
        packFn: pack,
        sampling: {
          // set the interval of scrolling event
          // do not emit twice in 150ms
          scroll: 150,
          // set the timing of record input
          input: "last", // When input mulitple characters, only record the final input
        },
      });
      stopRecordingFn.current = () => {
        if (stopFn) stopFn();
      };

      // save events every 10 seconds
      interval.current = setInterval(() => {
        save();
      }, 2000);
      window.addEventListener("beforeunload", handleUnload);

      return () => {
        if (interval.current) clearInterval(interval.current);
        window.removeEventListener("beforeunload", handleUnload);
      };
    }
  }, [isRecording]);

  return { startRecording, stopRecording, isRecording };
}

export default useRRWEBRecorder;
