import {
  insertRrwebEventToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { EventType } from "rrweb";
import * as rrweb from "rrweb";
import { pack } from "@rrweb/packer";

function useRRWEBRecorder({ pageId }: { pageId: number }) {
  const events = useRef<EventType[]>([]);
  const stopRecordingFn = useRef<any>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const save = useCallback(() => {
    if (events.current.length === 0) return;
    if (!pageId) {
      console.log("pageId is not defined");
      return;
    }
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
        async emit(event: EventType) {
          events.current.push(event);
        },
        recordAfter: "DOMContentLoaded",
        checkoutEveryNms: 2000,
        packFn: pack,
        sampling: {
          // set the interval of scrolling event
          // do not emit twice in 150ms
          scroll: 350,
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
