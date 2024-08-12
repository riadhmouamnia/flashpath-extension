import { Tag } from "emblor";

export enum MessageType {
  URL_CHANGE = "URL_CHANGE",
  TAB_CHANGE = "TAB_CHANGE",
  CHANGE_THEME = "CHANGE_THEME",
  CLICK_EXTENSION = "CLICK_EXTENSION",
  BOOKMARK_CREATED = "BOOKMARK_CREATED",
  BOOKMARK_REMOVED = "BOOKMARK_REMOVED",
  YT_VIDEO_ID = "YT_VIDEO_ID",
}

export enum MessageFrom {
  contentScript = "contentScript",
  background = "background",
}

class ExtMessage {
  content?: string;
  from?: MessageFrom;

  constructor(messageType: MessageType) {
    this.messageType = messageType;
  }

  messageType: MessageType;
}

export default ExtMessage;

export type ScrollEvent = {
  scrollY: number;
  scrollX: number;
  timeStamp: number;
};

export type Keystrokes = {
  inputValue: string;
  inputType: string;
  inputName: string;
  timeStamp: number;
};

export type TextHighlightEvent = {
  highlightedText: string;
  timeStamp: number;
};

export type MediaEventType =
  | "PLAY"
  | "PAUSE"
  | "MUTE"
  | "UNMUTE"
  | "VOLUMECHANGE"
  | "FULLSCREEN"
  | "EXITFULLSCREEN"
  | "SEEK";

export type MediaEvent = {
  event: MediaEventType;
  currentTime: number;
  timeStamp: number;
};

export type Click = {
  tagName: string;
  clientX: number;
  clientY: number;
  attributes: {
    [key: string]: string;
  };
  timeStamp: number;
};

export type Intercations = {
  textHighlightEvent?: TextHighlightEvent[];
  mediaEvent?: MediaEvent[];
  clickEvent?: Click[];
};

export type Interaction = {
  url: string;
  totalTimeSpent: number;
  reloadCount: number;
  scrollPosition?: ScrollEvent[];
  hasScrolledFullPage: boolean;
  isBookmarked: boolean;
  Keystrokes?: Keystrokes[];
  textHighlightEvent?: TextHighlightEvent[];
  mediaEvent?: MediaEvent[];
  clickEvent?: Click[];
};

export type UrlInteractions = {
  totalTimeSpent: number;
  reloadCount: number;
  scrollPosition?: ScrollEvent[];
  hasScrolledFullPage: boolean;
  isBookmarked: boolean;
  Keystrokes?: Keystrokes[];
  interactions?: Intercations;
};

export interface UrlInteractionsState {
  [url: string]: Interaction;
}

export type Note = {
  id: number;
  startTime?: number;
  endTime?: number;
  note: string;
  tags?: Tag[];
  highlightColor?: string;
  createdAt: string;
};

export type Notes = {
  videoId?: string; // for youtube
  url: string;
  timeStamp: number;
  notes: Note[];
};
