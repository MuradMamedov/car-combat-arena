import { WebSocket, WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage } from "../../shared/types/index.js";

/**
 * Connection event handlers
 */
export interface ConnectionEvents {
  onConnect: (ws: WebSocket, playerId: string) => void;
  onDisconnect: (playerId: string) => void;
  onMessage: (playerId: string, message: ClientMessage) => void;
}

/**
 * Manages WebSocket connections
 */
export class ConnectionManager {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();
  private wsToPlayerId: Map<WebSocket, string> = new Map();
  private events: ConnectionEvents;

  constructor(port: number, events: ConnectionEvents) {
    this.events = events;
    this.wss = new WebSocketServer({ port });
    this.setupServer();
  }

  /**
   * Set up WebSocket server event handlers
   */
  private setupServer(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      this.handleNewConnection(ws);
    });
  }

  /**
   * Handle a new WebSocket connection
   */
  private handleNewConnection(ws: WebSocket): void {
    // Notify that a new connection wants to join
    // The callback will call registerConnection with the playerId
    this.events.onConnect(ws, "");
  }

  /**
   * Register a connection with a player ID
   */
  registerConnection(ws: WebSocket, playerId: string): void {
    this.connections.set(playerId, ws);
    this.wsToPlayerId.set(ws, playerId);

    // Set up message handler
    ws.removeAllListeners("message");
    ws.on("message", (data: Buffer) => {
      this.handleMessage(playerId, data);
    });

    // Set up close handler
    ws.on("close", () => {
      this.handleDisconnect(playerId);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for ${playerId}:`, error);
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(playerId: string, data: Buffer): void {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      this.events.onMessage(playerId, message);
    } catch (error) {
      console.error(`Error parsing message from ${playerId}:`, error);
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(playerId: string): void {
    const ws = this.connections.get(playerId);
    if (ws) {
      this.wsToPlayerId.delete(ws);
    }
    this.connections.delete(playerId);
    this.events.onDisconnect(playerId);
  }

  /**
   * Send a message to a specific player
   */
  send(playerId: string, message: ServerMessage): void {
    const ws = this.connections.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send to a specific WebSocket (before registration)
   */
  sendToSocket(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected players
   */
  broadcast(message: ServerMessage): void {
    const messageStr = JSON.stringify(message);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  /**
   * Close a connection
   */
  closeConnection(playerId: string): void {
    const ws = this.connections.get(playerId);
    if (ws) {
      ws.close();
      this.wsToPlayerId.delete(ws);
    }
    this.connections.delete(playerId);
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Check if a player is connected
   */
  isConnected(playerId: string): boolean {
    const ws = this.connections.get(playerId);
    return ws !== undefined && ws.readyState === WebSocket.OPEN;
  }

  /**
   * Shut down the server
   */
  shutdown(): void {
    this.connections.forEach((ws) => ws.close());
    this.connections.clear();
    this.wsToPlayerId.clear();
    this.wss.close();
  }
}
