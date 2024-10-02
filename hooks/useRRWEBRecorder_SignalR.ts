import {
  insertRrwebEventToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { EventType } from "rrweb";
import * as rrweb from "rrweb";
// import { pack } from "@rrweb/packer";
import * as signalR from "@microsoft/signalr";
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
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopRecordingFn.current();
    saveToBrowserStorage({ key: "isRecording", value: false });

    // Close the SignalR connection
    if (connectionRef.current) {
      connectionRef.current
        .stop()
        .then(() => console.log("Connection closed."))
        .catch((error) => console.error("Error closing connection:", error));
      connectionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    saveToBrowserStorage({ key: "isRecording", value: true });

    if (!connectionRef.current) {
      // Initialize and start the SignalR connection
      connectionRef.current = await createSignalRConnection();
    }
  }, []);

  useEffect(() => {
    const loadIsRecordingStateFromStorage = async () => {
      const isRecordingState = await loadFromBrowserStorage("isRecording");
      if (isRecordingState) {
        setIsRecording(isRecordingState);
        connectionRef.current = await createSignalRConnection();
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
          if (connectionRef.current) {
            await sendDataToQuix(connectionRef.current, {
              username,
              event,
              pathname,
              pageUrl,
              pageState,
            });
          }
        },
        recordAfter: "DOMContentLoaded",

        // 2 sec checkout every 2 sec to get all page assets and resource to avoid missing css on the page when replay
        // also we can refresh the page whenever the tab url changes which is not ideal for smooth ux
        // checkoutEveryNms: 6000,
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
        if (stopRecordingFn.current) {
          stopRecordingFn.current();
        }
      };
    } else {
      if (stopRecordingFn.current) {
        stopRecordingFn.current();
      }
    }
  }, [isRecording, pageUrl]);

  return { startRecording, stopRecording, isRecording };
}

export default useRRWEBRecorder;

async function createSignalRConnection() {
  // const token = "pat-9700c4e8e8df409c95c6a9e892bee992";
  const token = "pat-a261a0bf97f247a689ef472beb3cf6f9";
  const environmentId = "sherif-flashpath-dev";

  const options = {
    accessTokenFactory: () => token,
  };

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`https://writer-${environmentId}.platform.quix.io/hub`, {
      ...options,
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  try {
    await connection.start();
    console.log("Connection started");
  } catch (error) {
    console.error("SignalR connection error:", error);
  }

  // Add error handling
  connection.onclose(async (error) => {
    console.error("Connection closed with error:", error);
    if (error) {
      console.log("Attempting to reconnect due to error...");
    }
  });

  return connection;
}

async function sendDataToQuix(
  connection: signalR.HubConnection,
  {
    username,
    event,
    pathname,
    pageUrl,
    pageState,
  }: {
    username: string;
    event: EventType;
    pathname: string;
    pageUrl: string;
    pageState: Page;
  }
) {
  const topic = "raw-websocket";
  const streamId = username;

  const parameterData = {
    epoch: Date.now() * 1000000,
    timestamps: [Date.now() * 1000000],
    numericValues: {},
    stringValues: {
      username: [username],
      pathname: [pathname],
      // page: [JSON.stringify(pageState)],
      rrweb_event: [JSON.stringify(event)],
    },
    tagValues: {
      path: [window.location.pathname],
    },
    binaryValues: {},
  };

  // Connection state handling
  switch (connection.state) {
    case signalR.HubConnectionState.Disconnected:
      try {
        await connection.start();
        console.log("Reconnected to Quix.");
      } catch (error) {
        console.error("Error reconnecting to Quix:", error);
        return; // Exit if reconnection fails
      }
      break;

    case signalR.HubConnectionState.Connecting:
    case signalR.HubConnectionState.Reconnecting:
      console.warn("Connection is in the process of connecting/reconnecting.");
      return; // Avoid sending data until fully connected
    case signalR.HubConnectionState.Disconnecting:
      console.warn("Connection is disconnecting, retry later.");
      return;
    case signalR.HubConnectionState.Connected:
      // If already connected, proceed with sending data
      break;
  }

  // Now that connection is ensured to be established, send data
  try {
    void connection.send("SendParameterData", topic, streamId, parameterData);
    console.log("Data sent to Quix:", parameterData);
  } catch (error) {
    console.error("Error sending data to Quix:", error);
  }
}
