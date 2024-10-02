import {
  insertRrwebEventToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { EventType } from "rrweb";
import * as rrweb from "rrweb";
import { Page } from "@/entrypoints/types";

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
  const stopRecordingFn = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopRecordingFn.current();
    saveToBrowserStorage({ key: "isRecording", value: false });
    // close the connection
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      console.log("ws connection closed");
    }
  }, []);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    saveToBrowserStorage({ key: "isRecording", value: true });
    // ws.current = createWebSocketConnection(username);
  }, []);

  useEffect(() => {
    const loadIsRecordingStateFromStorage = async () => {
      const isRecordingState = await loadFromBrowserStorage("isRecording");
      if (isRecordingState) {
        setIsRecording(isRecordingState);
        ws.current = createWebSocketConnection(username);
      } else {
        setIsRecording(false);
        ws.current = null;
      }
    };
    loadIsRecordingStateFromStorage();
  }, []);

  useEffect(() => {
    // let connection: signalR.HubConnection;
    if (isRecording) {
      ws.current = createWebSocketConnection(username);
      const stopFn = rrweb.record({
        async emit(event: EventType) {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            sendDataToQuix(ws.current, {
              username,
              rrweb_event: event,
              pathname,
              pageUrl,
              pageState,
            });
          }
        },
        recordAfter: "DOMContentLoaded",
        // 2 sec checkout every 2 sec to get all page assets and resource to avoid missing css on the page when replay
        // also we can refresh the page whenever the tab url changes which is not ideal for smooth ux
        // checkoutEveryNms: 4000,
        // packFn: pack,
        sampling: {
          // set the interval of scrolling event
          // do not emit twice in 150ms
          scroll: 500,
          // set the timing of record input
          input: "last", // When input mulitple characters, only record the final input
        },
      });
      stopRecordingFn.current = () => {
        if (stopFn) stopFn();
      };

      return () => {
        if (stopFn) stopFn();
      };
    }
  }, [isRecording, pageUrl]);

  return { startRecording, stopRecording, isRecording };
}

export default useRRWEBRecorder;

function createWebSocketConnection(username: string) {
  const connection = new WebSocket(
    "wss://raw-data-sherif-flashpath-dev.deployments.quix.io/" + username
  );
  connection.onopen = () => {
    console.log("connected to ws...");
  };
  connection.onerror = (error) => {
    console.error("error on ws connection:", error);
  };
  connection.onclose = () => {
    console.log("ws connection closed");
  };
  connection.onmessage = (event) => {
    console.log("received data from ws:", event);
  };
  return connection;
}

function sendDataToQuix(
  connection: WebSocket,
  data: {
    username: string;
    rrweb_event: EventType;
    pathname: string;
    pageUrl: string;
    pageState: Page;
  }
) {
  connection.send(JSON.stringify(data));
  console.log("sent data to ws:", data);
}
