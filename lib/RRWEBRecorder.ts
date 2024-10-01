import * as rrweb from "rrweb";
import { EventType } from "rrweb";
import {
  insertRrwebEventToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "./utils";

export default class RRWEBRecorder {
  private events: EventType[][] = [[]]; // Buffer to hold event segments
  private pageId?: number;
  private interval?: NodeJS.Timeout;
  private isRecording = false;
  private stopFn?: () => void;

  private static readonly MAX_SCOPE_TIME = 3000; // Save events every 10s
  private static readonly MAX_SCOPE_LENGTH = 3; // Keep 3 segments at most
  private static readonly CHECKOUT_TIME = 3000; // Checkout every 3s

  constructor({ pageId }: { pageId?: number }) {
    this.pageId = pageId;
  }

  // Save events to the DB and reset the event buffer
  private save = (): void => {
    if (!this.pageId) {
      console.log("pageId is not defined");
      return;
    }

    const flattenedEvents = this.events.flat();
    insertRrwebEventToDb({ events: flattenedEvents, pageId: this.pageId });
    this.events = [[]]; // Reset after saving
  };

  // Start recording rrweb events
  public startRecording = async (): Promise<void> => {
    this.isRecording = true;
    saveToBrowserStorage({ key: "isRecording", value: true });

    // Start rrweb recording
    this.stopFn = rrweb.record({
      emit: (event: EventType, isCheckout: boolean | undefined) => {
        this.events[this.events.length - 1].push(event);

        if (isCheckout) {
          if (this.events.length >= RRWEBRecorder.MAX_SCOPE_LENGTH) {
            this.events.shift(); // Keep only the last 3 segments
          }
          this.events.push([]); // Start new segment after checkout
        }
      },
      checkoutEveryNms: RRWEBRecorder.CHECKOUT_TIME,
      // recordCanvas: true,
      recordAfter: "DOMContentLoaded",
    });

    // Periodically save events
    this.interval = setInterval(this.save, RRWEBRecorder.MAX_SCOPE_TIME);
    window.addEventListener("beforeunload", this.handleUnload);
  };

  // Stop recording and clean up
  public stopRecording = (): void => {
    if (this.stopFn) {
      this.save(); // Save remaining events before stopping
      this.isRecording = false;
      this.stopFn();
      saveToBrowserStorage({ key: "isRecording", value: false });

      if (this.interval) clearInterval(this.interval);
      window.removeEventListener("beforeunload", this.handleUnload);
    }
  };

  // Save events before the window closes or unmounts
  private handleUnload = (): void => {
    this.save();
  };

  // Load the previous state from storage (for resuming)
  public async loadRecordingState(): Promise<void> {
    const isRecordingState = await loadFromBrowserStorage("isRecording");
    this.isRecording = isRecordingState || false;

    if (this.isRecording) {
      await this.startRecording(); // Resume recording if it was active
    }
  }

  // Get the current recording status
  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public saveBeforeUnload = (): void => {
    this.save();
  };
}
