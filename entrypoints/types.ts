import { Tag } from "emblor";

export enum MessageType {
  URL_CHANGE = "URL_CHANGE",
  TAB_CHANGE = "TAB_CHANGE",
  CHANGE_THEME = "CHANGE_THEME",
  CLICK_EXTENSION = "CLICK_EXTENSION",
  BOOKMARK_CREATED = "BOOKMARK_CREATED",
  BOOKMARK_REMOVED = "BOOKMARK_REMOVED",
  YT_VIDEO_ID = "YT_VIDEO_ID",
  USER_LOGGED_IN = "USER_LOGGED_IN",
  USER_LOGGED_OUT = "USER_LOGGED_OUT",
  CREATE_PATH = "CREATE_PATH",
  UPDATE_PATH = "UPDATE_PATH",
  SELECT_TEXT = "SELECT_TEXT",
  PATH_ON = "PATH_ON",
  PATH_OFF = "PATH_OFF",
  CAPTURE_VIDEO_ON = "CAPTURE_VIDEO_ON",
  CAPTURE_VIDEO_OFF = "CAPTURE_VIDEO_OFF",
  HIDE_UI = "HIDE_UI",
  SHOW_UI = "SHOW_UI",
}

export enum MessageFrom {
  contentScript = "contentScript",
  background = "background",
}

class ExtMessage {
  content?: string;
  data?: any;
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
  timestamp: number;
};

export type InputEvent = {
  inputValue: string;
  inputType: string;
  inputName: string;
  placeholder: string;
  timestamp: number;
};

export type KeyPressEvent = {
  key: string;
  timestamp: number;
};

export type SelectEvent = {
  highlightedText: string;
  timestamp: number;
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
  timestamp: number;
};

export type ClickEvent = {
  tagName: string;
  clientX: number;
  clientY: number;
  textContent: string | null;
  attributes: {
    [key: string]: string;
  };
  timestamp: number;
};

export type Interaction = {
  type:
    | "CLICK_EVENT"
    | "INPUT_EVENT"
    | "KEY_PRESS_EVENT"
    | "SCROLL_EVENT"
    | "MEDIA_EVENT"
    | "SELECT_EVENT";
  event:
    | ClickEvent
    | InputEvent
    | KeyPressEvent
    | ScrollEvent
    | MediaEvent
    | SelectEvent;
};

export type Page = {
  url: string;
  domain: string;
  timeOnPage: number;
  isBookmarked: boolean;
};

export type Path = {
  id: number;
  createdAt: Date | null;
  name: string;
  userId: string;
};

export type DbPage = {
  id: number;
  createdAt: Date | null;
  pathId: number;
  url: string;
  domain: string;
  timeOnPage: string | null;
  isBookmarked: boolean | null;
};

export interface UrlState {
  [url: string]: Page;
}

export type Note = {
  startTime?: number;
  endTime?: number;
  body: string;
  tags?: Tag[];
  highlightColor?: string;
  sort: number;
  createdAt: number;
};

export type Notes = {
  videoId?: string; // for youtube
  url: string;
  timeStamp: number;
  notes: Note[];
};

export type User = {
  backupCodeEnabled: boolean;
  cachedSessionsWithActivities: any | null;
  createOrganizationEnabled: boolean;
  createdAt: string;
  deleteSelfEnabled: boolean;
  emailAddresses: string[];
  externalAccounts: string[];
  externalId: string | null;
  firstName: string | null;
  fullName: string | null;
  hasImage: boolean;
  id: string;
  imageUrl: string;
  lastName: string | null;
  lastSignInAt: string;
  organizationMemberships: any[];
  passkeys: any[];
  passwordEnabled: boolean;
  pathRoot: string;
  phoneNumbers: string[];
  primaryEmailAddress: string | null;
  primaryEmailAddressId: string | null;
  primaryPhoneNumber: string | null;
  primaryPhoneNumberId: string | null;
  primaryWeb3Wallet: string | null;
  primaryWeb3WalletId: string | null;
  publicMetadata: Record<string, unknown>;
  samlAccounts: any[];
  totpEnabled: boolean;
  twoFactorEnabled: boolean;
  unsafeMetadata: Record<string, unknown>;
  updatedAt: string;
  username: string;
  web3Wallets: any[];
};

export type Network = {
  online: boolean;
  downlink: any;
  downlinkMax: any;
  effectiveType: any;
  rtt: any;
  saveData: any;
  type: any;
};
