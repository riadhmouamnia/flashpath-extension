import {
  insertRrwebEventToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { EventType } from "rrweb";
import * as rrweb from "rrweb";
import { pack } from "@rrweb/packer";
import ExtMessage, { MessageType } from "@/entrypoints/types";
import { Runtime } from "wxt/browser";

function useRRWEBRecorder({
  pageId,
  isPathOn,
}: {
  pageId?: number;
  isPathOn: boolean;
}) {
  const events = useRef<EventType[]>([]);
  const tempEvents = useRef<EventType[]>([]);
  const stopRecordingFn = useRef<any>(null);
  const tempStopFn = useRef<any>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const pageIdRef = useRef<number | undefined>(pageId);

  const save = useCallback(() => {
    if (events.current.length === 0) return;
    if (!pageId) {
      console.log("pageId not found");
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
    stopRecordingFn.current();
  }, []);

  useEffect(() => {
    const loadVideoStatus = async () => {
      const storageValue = await loadFromBrowserStorage("isVideoOn");
      if (storageValue) {
        setIsRecording(storageValue);
      }

      console.log("storageValue is video on: ", storageValue);
    };

    loadVideoStatus();
    const handleMessage = (
      message: ExtMessage,
      sender: Runtime.MessageSender,
      sendResponse: () => void
    ) => {
      if (message.messageType == MessageType.CAPTURE_VIDEO_ON) {
        setIsRecording(true);
      } else if (message.messageType === MessageType.CAPTURE_VIDEO_OFF) {
        setIsRecording(false);
        stopRecording();
      }
    };
    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    console.log("useEffect runs PageId: ", pageId);
    pageIdRef.current = pageId;
    if (!pageIdRef.current || isRecording) return;
    tempStopFn.current = rrweb.record({
      emit(event) {
        tempEvents.current.push(event as any);
        if (tempEvents.current.length > 2) {
          tempStopFn.current() && tempStopFn.current();
          console.log("tempStopFn called");
          tempStopFn.current = null;
          insertRrwebEventToDb({
            events: tempEvents.current,
            pageId: pageIdRef.current as number,
          }).then(() => {
            tempEvents.current = [];
            console.log("tempEvents saved to db");
          });
        }
      },
      packFn: pack,
    });

    return () => {
      pageIdRef.current = undefined;
      tempEvents.current = [];
      tempStopFn.current = null;
    };
  }, [pageId, isRecording]);

  useEffect(() => {
    console.log("isRecording: ", isRecording);
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

  return null;
}

export default useRRWEBRecorder;
