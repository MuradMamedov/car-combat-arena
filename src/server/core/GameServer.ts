import { WebSocket, WebSocketServer } from "ws";
import {
  SERVER_PORT,
} from "../../shared/constants/index.js";
import type {
  ClientMessage,
  ServerMessage,
} from "../../shared/types/index.js";
import { RoomManager } from "../managers/index.js";

/**
 * Main game server orchestrator
 * Coordinates WebSocket connections and routes them to appropriate rooms
 */
export class GameServer {
  private wss: WebSocketServer;
  private roomManager: RoomManager;
  
  // Track WebSocket to player ID mapping
  private wsToPlayerId: Map<WebSocket, string> = new Map();
  private playerIdToWs: Map<string, WebSocket> = new Map();

  constructor(port: number = SERVER_PORT) {
    // Initialize WebSocket server
    this.wss = new WebSocketServer({ port });
    
    // Initialize room manager with event callbacks
    this.roomManager = new RoomManager({
      onSendToPlayer: (playerId, message) => this.sendToPlayer(playerId, message as ServerMessage),
      onSendToRoom: (roomCode, message) => this.roomManager.broadcastToRoom(roomCode, message),
      onSendToSocket: (ws, message) => this.sendToSocket(ws, message as ServerMessage),
    });

    // Set up WebSocket server
    this.setupServer();

    console.log(`🎮 Game server running on ws://localhost:${port}`);
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
   * Handle new WebSocket connection
   */
  private handleNewConnection(ws: WebSocket): void {
    // Generate temporary connection ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`New connection: ${tempId}`);

    // Set up message handler
    ws.on("message", (data: Buffer) => {
      const playerId = this.wsToPlayerId.get(ws);
      this.handleMessage(ws, playerId, data);
    });

    // Set up close handler
    ws.on("close", () => {
      const playerId = this.wsToPlayerId.get(ws);
      if (playerId) {
        this.handleDisconnect(playerId);
      }
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error:`, error);
    });

    // Send initial connected message (player hasn't joined a room yet)
    this.sendToSocket(ws, {
      type: "connected",
      playerId: tempId,
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(ws: WebSocket, playerId: string | undefined, data: Buffer): void {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      
      // Handle room creation/joining separately
      if (message.type === "createRoom") {
        this.handleCreateRoom(ws);
        return;
      }
      
      if (message.type === "joinRoom") {
        this.handleJoinRoom(ws, message.roomCode);
        return;
      }
      
      if (message.type === "leaveRoom") {
        if (playerId) {
          this.roomManager.leaveRoom(playerId);
          // Reset player's room association
          this.wsToPlayerId.delete(ws);
          this.playerIdToWs.delete(playerId);
          // Send confirmation
          this.sendToSocket(ws, {
            type: "waiting",
            message: "Left room. Choose a game mode.",
          });
        }
        return;
      }

      // Handle matchmaking
      if (message.type === "findMatch") {
        this.handleFindMatch(ws);
        return;
      }

      if (message.type === "cancelMatchmaking") {
        this.handleCancelMatchmaking(ws);
        return;
      }

      // All other messages require being in a room
      if (!playerId || !this.roomManager.getPlayerRoom(playerId)) {
        this.sendToSocket(ws, {
          type: "error",
          message: "You must join or create a room first",
        });
        return;
      }

      // Route message to room manager
      this.roomManager.handleMessage(playerId, message);
    } catch (error) {
      console.error(`Error parsing message:`, error);
    }
  }

  /**
   * Handle room creation request
   */
  private handleCreateRoom(ws: WebSocket): void {
    // Check if already in a room
    const existingPlayerId = this.wsToPlayerId.get(ws);
    if (existingPlayerId && this.roomManager.getPlayerRoom(existingPlayerId)) {
      this.sendToSocket(ws, {
        type: "roomError",
        message: "You are already in a room. Leave first.",
      });
      return;
    }

    // Create the room
    const result = this.roomManager.createRoom(ws);
    
    if (!result) {
      this.sendToSocket(ws, {
        type: "roomError",
        message: "Failed to create room. Please try again.",
      });
      return;
    }

    // Register player
    this.wsToPlayerId.set(ws, result.playerId);
    this.playerIdToWs.set(result.playerId, ws);

    // Send room created message
    this.sendToSocket(ws, {
      type: "roomCreated",
      roomCode: result.roomCode,
    });

    // Send connected message with actual player ID
    this.sendToSocket(ws, {
      type: "connected",
      playerId: result.playerId,
    });

    // Send waiting message
    this.sendToSocket(ws, {
      type: "waiting",
      message: `Room created! Share code: ${result.roomCode}`,
    });
  }

  /**
   * Handle room join request
   */
  private handleJoinRoom(ws: WebSocket, roomCode: string): void {
    // Check if already in a room
    const existingPlayerId = this.wsToPlayerId.get(ws);
    if (existingPlayerId && this.roomManager.getPlayerRoom(existingPlayerId)) {
      this.sendToSocket(ws, {
        type: "roomError",
        message: "You are already in a room. Leave first.",
      });
      return;
    }

    // Validate room code
    if (!roomCode || roomCode.trim().length === 0) {
      this.sendToSocket(ws, {
        type: "roomError",
        message: "Please enter a room code.",
      });
      return;
    }

    // Try to join the room
    const result = this.roomManager.joinRoom(ws, roomCode);
    
    if (!result) {
      this.sendToSocket(ws, {
        type: "roomError",
        message: "Room not found or is full.",
      });
      return;
    }

    // Register player
    this.wsToPlayerId.set(ws, result.playerId);
    this.playerIdToWs.set(result.playerId, ws);

    // Send room joined message
    this.sendToSocket(ws, {
      type: "roomJoined",
      roomCode: roomCode.toUpperCase(),
      playerCount: result.playerCount,
    });

    // Send connected message with actual player ID
    this.sendToSocket(ws, {
      type: "connected",
      playerId: result.playerId,
    });

    // Send waiting or starting message based on player count
    if (result.playerCount < 2) {
      this.sendToSocket(ws, {
        type: "waiting",
        message: "Waiting for opponent...",
      });
    }
  }

  /**
   * Handle find match request (random matchmaking)
   */
  private handleFindMatch(ws: WebSocket): void {
    // Check if already in a room
    const existingPlayerId = this.wsToPlayerId.get(ws);
    if (existingPlayerId && this.roomManager.getPlayerRoom(existingPlayerId)) {
      this.sendToSocket(ws, {
        type: "roomError",
        message: "You are already in a room. Leave first.",
      });
      return;
    }

    // Check if already in matchmaking
    if (this.roomManager.isInMatchmaking(ws)) {
      this.sendToSocket(ws, {
        type: "matchmakingStatus",
        status: "searching",
      });
      return;
    }

    // Join matchmaking queue
    const result = this.roomManager.joinMatchmaking(ws);

    // If matched, register both players
    if (result.matched && result.playerId && result.roomCode) {
      // Register the current player (who triggered the match)
      this.wsToPlayerId.set(ws, result.playerId);
      this.playerIdToWs.set(result.playerId, ws);

      // Send connected message with actual player ID
      this.sendToSocket(ws, {
        type: "connected",
        playerId: result.playerId,
      });

      // Also register the other player (who was waiting in the queue)
      if (result.otherPlayerWs && result.otherPlayerId) {
        this.wsToPlayerId.set(result.otherPlayerWs, result.otherPlayerId);
        this.playerIdToWs.set(result.otherPlayerId, result.otherPlayerWs);

        // Send connected message to the other player too
        this.sendToSocket(result.otherPlayerWs, {
          type: "connected",
          playerId: result.otherPlayerId,
        });
      }
    }
  }

  /**
   * Handle cancel matchmaking request
   */
  private handleCancelMatchmaking(ws: WebSocket): void {
    this.roomManager.leaveMatchmaking(ws);
  }

  /**
   * Handle player disconnect
   */
  private handleDisconnect(playerId: string): void {
    console.log(`Player disconnected: ${playerId}`);
    
    // Handle room disconnect
    this.roomManager.handleDisconnect(playerId);
    
    // Clean up mappings
    const ws = this.playerIdToWs.get(playerId);
    if (ws) {
      // Also remove from matchmaking queue if they were searching
      this.roomManager.leaveMatchmaking(ws);
      this.wsToPlayerId.delete(ws);
    }
    this.playerIdToWs.delete(playerId);
  }

  /**
   * Send message to a specific player
   */
  private sendToPlayer(playerId: string, message: ServerMessage): void {
    const ws = this.playerIdToWs.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send to a specific WebSocket
   */
  private sendToSocket(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Shut down the server
   */
  shutdown(): void {
    this.roomManager.shutdown();
    this.wss.close();
    console.log("Server shut down");
  }
}
