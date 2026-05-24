// LINE Messaging API Webhook イベント型定義

export interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

export type LineEvent =
  | LineFollowEvent
  | LineUnfollowEvent
  | LineMessageEvent
  | LineUnsupportedEvent;

export interface LineSource {
  type: "user" | "group" | "room";
  userId: string;
  groupId?: string;
  roomId?: string;
}

export interface LineFollowEvent {
  type: "follow";
  webhookEventId: string;
  source: LineSource;
  timestamp: number;
  replyToken: string;
  mode: "active" | "standby";
}

export interface LineUnfollowEvent {
  type: "unfollow";
  webhookEventId: string;
  source: LineSource;
  timestamp: number;
  mode: "active" | "standby";
}

export interface LineTextMessage {
  type: "text";
  id: string;
  text: string;
}

export interface LineImageMessage {
  type: "image";
  id: string;
}

export interface LineGenericMessage {
  type: string;
  id: string;
}

export type LineMessage = LineTextMessage | LineImageMessage | LineGenericMessage;

export interface LineMessageEvent {
  type: "message";
  webhookEventId: string;
  source: LineSource;
  timestamp: number;
  replyToken: string;
  mode: "active" | "standby";
  message: LineMessage;
}

export interface LineUnsupportedEvent {
  type: string;
  webhookEventId: string;
  source: LineSource;
  timestamp: number;
  mode: "active" | "standby";
}
