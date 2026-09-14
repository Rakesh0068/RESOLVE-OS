// WebSocket client for real-time updates

import { WSMessage } from "@/types";

type MessageHandler = (message: WSMessage) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          this.handlers.forEach((handler) => handler(message));
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };

      this.ws.onclose = () => {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (e) {
      console.error("Failed to connect WebSocket:", e);
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(data: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  ping() {
    this.send("ping");
  }
}

// Singleton
export const wsClient = typeof window !== "undefined" ? new WSClient() : null;
