import type { ClientMessage, ServerMessage, PlayerCustomization, GliderTier } from "../../shared/index.js";

/**
 * Network event handlers
 */
export interface NetworkEvents {
  onConnected: (playerId: string) => void;
  onWaiting: (message: string) => void;
  onGameStart: (state: any) => void;
  onGameState: (state: any) => void;
  onGameOver: (winnerId: string, state: any) => void;
  onPlayerDisconnected: (playerId: string) => void;
  onError: (message: string) => void;
  onConnectionLost: () => void;
  onBotAdded?: (botId: string) => void;
  onRoomCreated?: (roomCode: string) => void;
  onRoomJoined?: (roomCode: string, playerCount: number) => void;
  onRoomError?: (message: string) => void;
  onMatchmakingStatus?: (status: "searching" | "cancelled", queuePosition?: number) => void;
  onMatchFound?: (roomCode: string) => void;
}

/**
 * Connection state
 */
export type ConnectionState = "disconnected" | "connecting" | "connected";

/**
 * Manages WebSocket connection to the game server
 */
export class NetworkManager {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private events: NetworkEvents;
  private connectionState: ConnectionState = "disconnected";

  constructor(serverUrl: string, events: NetworkEvents) {
    this.serverUrl = serverUrl;
    this.events = events;
  }

  /**
   * Connect to the game server
   */
  connect(): void {
    if (this.connectionState === "connecting") {
      return;
    }

    this.connectionState = "connecting";

    try {
      this.ws = new WebSocket(this.serverUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.connectionState = "disconnected";
      this.events.onError("Failed to connect to server");
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.connectionState = "connected";
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.connectionState = "disconnected";
      this.events.onConnectionLost();
    };

    this.ws.onerror = () => {
      this.events.onError("Connection error. Make sure server is running!");
    };
  }

  /**
   * Handle incoming server message
   */
  private handleMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data);
      this.routeMessage(message);
    } catch (error) {
      console.error("Failed to parse server message:", error);
    }
  }

  /**
   * Route message to appropriate handler
   */
  private routeMessage(message: ServerMessage): void {
    switch (message.type) {
      case "connected":
        this.events.onConnected(message.playerId);
        break;

      case "waiting":
        this.events.onWaiting(message.message);
        break;

      case "gameStart":
        this.events.onGameStart(message.state);
        break;

      case "gameState":
        this.events.onGameState(message.state);
        break;

      case "gameOver":
        this.events.onGameOver(message.winner, message.state);
        break;

      case "playerDisconnected":
        this.events.onPlayerDisconnected(message.playerId);
        break;

      case "error":
        this.events.onError(message.message);
        break;

      case "botAdded":
        if (this.events.onBotAdded) {
          this.events.onBotAdded(message.botId);
        }
        break;

      case "roomCreated":
        if (this.events.onRoomCreated) {
          this.events.onRoomCreated(message.roomCode);
        }
        break;

      case "roomJoined":
        if (this.events.onRoomJoined) {
          this.events.onRoomJoined(message.roomCode, message.playerCount);
        }
        break;

      case "roomError":
        if (this.events.onRoomError) {
          this.events.onRoomError(message.message);
        }
        break;

      case "matchmakingStatus":
        if (this.events.onMatchmakingStatus) {
          this.events.onMatchmakingStatus(message.status, message.queuePosition);
        }
        break;

      case "matchFound":
        if (this.events.onMatchFound) {
          this.events.onMatchFound(message.roomCode);
        }
        break;
    }
  }

  /**
   * Send a message to the server
   */
  send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Create a new game room
   */
  createRoom(customization?: PlayerCustomization, tier?: GliderTier): void {
    this.send({ type: "createRoom", customization, tier });
  }

  /**
   * Join an existing game room
   */
  joinRoom(roomCode: string, customization?: PlayerCustomization, tier?: GliderTier): void {
    this.send({ type: "joinRoom", roomCode, customization, tier });
  }

  /**
   * Leave the current room
   */
  leaveRoom(): void {
    this.send({ type: "leaveRoom" });
  }

  /**
   * Find a random match
   */
  findMatch(customization?: PlayerCustomization, tier?: GliderTier): void {
    this.send({ type: "findMatch", customization, tier });
  }

  /**
   * Cancel matchmaking
   */
  cancelMatchmaking(): void {
    this.send({ type: "cancelMatchmaking" });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = "disconnected";
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.connectionState === "connected" &&
      this.ws !== null &&
      this.ws.readyState === WebSocket.OPEN
    );
  }
}
