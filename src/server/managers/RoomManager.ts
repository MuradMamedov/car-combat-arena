import { WebSocket } from "ws";
import {
  MAX_PLAYERS,
  type GliderTier,
} from "../../shared/constants/index.js";
import type {
  BotDifficultyLevel,
  ClientMessage,
  GameState,
} from "../../shared/types/index.js";
import { BotManager } from "./BotManager.js";
import { GameStateManager } from "./GameStateManager.js";
import { PlayerManager } from "./PlayerManager.js";
import { GameEngine } from "../core/GameEngine.js";

/**
 * Generate a short, readable room code
 */
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omit similar chars like 0/O, 1/I/L
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Represents a game room
 */
export interface GameRoom {
  code: string;
  hostPlayerId: string;
  playerManager: PlayerManager;
  stateManager: GameStateManager;
  botManager: BotManager;
  gameEngine: GameEngine;
  connections: Map<string, WebSocket>;
  createdAt: number;
}

/**
 * Events emitted by room operations
 */
export interface RoomEvents {
  onSendToPlayer: (playerId: string, message: object) => void;
  onSendToRoom: (roomCode: string, message: object) => void;
  onSendToSocket: (ws: WebSocket, message: object) => void;
}

/**
 * Player in matchmaking queue
 */
interface QueuedPlayer {
  ws: WebSocket;
  joinedAt: number;
}

/**
 * Manages multiple game rooms for multiplayer
 */
export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private events: RoomEvents;
  
  // Matchmaking queue
  private matchmakingQueue: Map<WebSocket, QueuedPlayer> = new Map();
  
  // Room cleanup interval (clean up empty rooms after 5 minutes)
  private cleanupInterval: NodeJS.Timeout;
  private readonly ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor(events: RoomEvents) {
    this.events = events;
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupEmptyRooms(), 60000);
  }

  /**
   * Create a new game room
   */
  createRoom(hostWs: WebSocket): { roomCode: string; playerId: string } | null {
    // Generate unique room code
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    // Initialize room components
    const playerManager = new PlayerManager();
    const stateManager = new GameStateManager();
    const botManager = new BotManager();

    // Create game engine with callbacks
    const gameEngine = new GameEngine(
      playerManager,
      stateManager,
      botManager,
      {
        onGameStart: (state) => this.handleGameStart(roomCode, state),
        onGameUpdate: (state) => this.handleGameUpdate(roomCode, state),
        onGameOver: (winnerId, state) => this.handleGameOver(roomCode, winnerId, state),
      }
    );

    // Add host player
    const hostData = playerManager.addPlayer();
    if (!hostData) {
      return null;
    }

    // Create room
    const room: GameRoom = {
      code: roomCode,
      hostPlayerId: hostData.id,
      playerManager,
      stateManager,
      botManager,
      gameEngine,
      connections: new Map([[hostData.id, hostWs]]),
      createdAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    this.playerToRoom.set(hostData.id, roomCode);

    // Add player to game state
    gameEngine.handlePlayerJoin(hostData);

    console.log(`Room ${roomCode} created by player ${hostData.id}`);

    return { roomCode, playerId: hostData.id };
  }

  /**
   * Join an existing room
   */
  joinRoom(ws: WebSocket, roomCode: string): { playerId: string; playerCount: number } | null {
    const normalizedCode = roomCode.toUpperCase().trim();
    const room = this.rooms.get(normalizedCode);

    if (!room) {
      return null;
    }

    // Check if room is full
    if (!room.playerManager.canAddPlayer()) {
      return null;
    }

    // Add player
    const playerData = room.playerManager.addPlayer();
    if (!playerData) {
      return null;
    }

    // Register connection and player
    room.connections.set(playerData.id, ws);
    this.playerToRoom.set(playerData.id, normalizedCode);

    // Add player to game state
    room.gameEngine.handlePlayerJoin(playerData);

    console.log(`Player ${playerData.id} joined room ${normalizedCode}`);

    // Notify host
    const hostWs = room.connections.get(room.hostPlayerId);
    if (hostWs) {
      this.events.onSendToSocket(hostWs, {
        type: "waiting",
        message: "Opponent joined! Starting game...",
      });
    }

    // Try to start game if room is full
    if (room.playerManager.getPlayerCount() === MAX_PLAYERS) {
      room.gameEngine.tryStartGame();
    }

    return {
      playerId: playerData.id,
      playerCount: room.playerManager.getPlayerCount(),
    };
  }

  /**
   * Add a bot to a room
   */
  addBotToRoom(
    playerId: string,
    difficulty: BotDifficultyLevel = "medium",
    tier?: GliderTier
  ): string | null {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    if (!room.playerManager.canAddPlayer()) {
      return null;
    }

    // Bot tier based on difficulty if not specified
    const botTier: GliderTier = tier ?? this.getBotTierFromDifficulty(difficulty);

    // Add bot as a player first (to get bot ID)
    const botData = room.playerManager.addPlayer(botTier);
    if (!botData) {
      return null;
    }

    // Register bot and get personality-based name
    const botName = room.botManager.addBot(botData.id, difficulty);

    // Update bot's customization with the generated name
    room.playerManager.setCustomization(botData.id, {
      ...botData.customization,
      displayName: botName,
    });

    // Refresh botData with updated customization
    const updatedBotData = room.playerManager.getPlayer(botData.id);
    if (!updatedBotData) {
      return null;
    }

    // Add bot to game state
    room.gameEngine.handlePlayerJoin(updatedBotData);

    console.log(`Bot "${botName}" added to room ${roomCode}: ${botData.id} (${difficulty}, Tier ${botTier})`);

    // Try to start game
    if (room.playerManager.getPlayerCount() === MAX_PLAYERS) {
      room.gameEngine.tryStartGame();
    }

    return botData.id;
  }

  /**
   * Get bot tier from difficulty
   */
  private getBotTierFromDifficulty(difficulty: BotDifficultyLevel): GliderTier {
    switch (difficulty) {
      case "easy": return 2;
      case "medium": return 5;
      case "hard": return 8;
      default: return 5;
    }
  }

  /**
   * Handle player disconnect from room
   */
  handleDisconnect(playerId: string): void {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    console.log(`Player ${playerId} disconnected from room ${roomCode}`);

    // Remove from room
    room.connections.delete(playerId);
    room.gameEngine.handlePlayerLeave(playerId);
    room.playerManager.removePlayer(playerId);
    this.playerToRoom.delete(playerId);

    // Notify remaining players
    this.broadcastToRoom(roomCode, {
      type: "playerDisconnected",
      playerId,
    });

    // Handle remaining players
    const remainingPlayers = room.playerManager.getAllPlayers();
    
    if (remainingPlayers.length === 0) {
      // No players left, mark for cleanup
      console.log(`Room ${roomCode} is empty`);
    } else if (remainingPlayers.length === 1) {
      const remaining = remainingPlayers[0];
      
      // If remaining player is a bot, remove it
      if (room.botManager.isBot(remaining.id)) {
        room.gameEngine.handlePlayerLeave(remaining.id);
        room.playerManager.removePlayer(remaining.id);
        console.log(`Bot removed from room ${roomCode} - no human players`);
        return;
      }

      // Update remaining player
      room.playerManager.reassignPlayerNumbers();
      room.gameEngine.handlePlayerJoin(remaining);

      // Notify remaining player
      const ws = room.connections.get(remaining.id);
      if (ws) {
        this.events.onSendToSocket(ws, {
          type: "waiting",
          message: "Opponent disconnected. Waiting for new player...",
        });
      }
    }
  }

  /**
   * Handle player leaving a room voluntarily
   */
  leaveRoom(playerId: string): void {
    this.handleDisconnect(playerId);
  }

  /**
   * Handle incoming message from a player
   */
  handleMessage(playerId: string, message: ClientMessage): void {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    switch (message.type) {
      case "input":
        room.playerManager.updateInput(playerId, message.input);
        break;

      case "restart":
        if (room.playerManager.getPlayerCount() === MAX_PLAYERS) {
          room.gameEngine.restart();
        }
        break;

      case "addBot":
        const botId = this.addBotToRoom(playerId, message.difficulty, message.tier);
        if (botId) {
          const ws = room.connections.get(playerId);
          if (ws) {
            this.events.onSendToSocket(ws, {
              type: "botAdded",
              botId,
            });
          }
        } else {
          const ws = room.connections.get(playerId);
          if (ws) {
            this.events.onSendToSocket(ws, {
              type: "error",
              message: "Could not add bot",
            });
          }
        }
        break;

      case "selectTier":
        if (room.stateManager.getState().gameStatus === "waiting") {
          room.playerManager.setGliderTier(playerId, message.tier);
          const playerData = room.playerManager.getPlayer(playerId);
          if (playerData) {
            room.gameEngine.handlePlayerJoin(playerData);
          }
        }
        break;

      case "customization":
        if (room.stateManager.getState().gameStatus === "waiting") {
          room.playerManager.setCustomization(playerId, message.customization);
          const playerData = room.playerManager.getPlayer(playerId);
          if (playerData) {
            room.gameEngine.handlePlayerJoin(playerData);
          }
        }
        break;
    }
  }

  /**
   * Get the room a player is in
   */
  getPlayerRoom(playerId: string): string | undefined {
    return this.playerToRoom.get(playerId);
  }

  /**
   * Get a room by code
   */
  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  /**
   * Get WebSocket for a player
   */
  getPlayerSocket(playerId: string): WebSocket | undefined {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return undefined;
    
    const room = this.rooms.get(roomCode);
    return room?.connections.get(playerId);
  }

  /**
   * Broadcast message to all players in a room
   */
  broadcastToRoom(roomCode: string, message: object): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  /**
   * Handle game start in a room
   */
  private handleGameStart(roomCode: string, state: GameState): void {
    this.broadcastToRoom(roomCode, {
      type: "gameStart",
      state,
    });
  }

  /**
   * Handle game update in a room
   */
  private handleGameUpdate(roomCode: string, state: GameState): void {
    this.broadcastToRoom(roomCode, {
      type: "gameState",
      state,
    });
  }

  /**
   * Handle game over in a room
   */
  private handleGameOver(roomCode: string, winnerId: string, state: GameState): void {
    this.broadcastToRoom(roomCode, {
      type: "gameOver",
      winner: winnerId,
      state,
    });
  }

  /**
   * Clean up empty rooms
   */
  private cleanupEmptyRooms(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.rooms.forEach((room, code) => {
      // Check if room is empty or has only bots and is old enough
      const humanPlayers = room.playerManager.getAllPlayers()
        .filter(p => !room.botManager.isBot(p.id));
      
      if (humanPlayers.length === 0 && now - room.createdAt > this.ROOM_TIMEOUT) {
        toDelete.push(code);
      }
    });

    toDelete.forEach(code => {
      const room = this.rooms.get(code);
      if (room) {
        room.gameEngine.stopGameLoop();
        this.rooms.delete(code);
        console.log(`Cleaned up empty room: ${code}`);
      }
    });
  }

  /**
   * Add a player to the matchmaking queue
   * Returns true if immediately matched with another player
   */
  joinMatchmaking(ws: WebSocket): { matched: boolean; roomCode?: string; playerId?: string } {
    // Check if already in queue
    if (this.matchmakingQueue.has(ws)) {
      return { matched: false };
    }

    // Add to queue
    this.matchmakingQueue.set(ws, {
      ws,
      joinedAt: Date.now(),
    });

    console.log(`Player added to matchmaking queue. Queue size: ${this.matchmakingQueue.size}`);

    // Notify player they're in queue
    this.events.onSendToSocket(ws, {
      type: "matchmakingStatus",
      status: "searching",
      queuePosition: this.matchmakingQueue.size,
    });

    // Try to match players
    return this.tryMatchPlayers(ws);
  }

  /**
   * Remove a player from the matchmaking queue
   */
  leaveMatchmaking(ws: WebSocket): void {
    if (this.matchmakingQueue.has(ws)) {
      this.matchmakingQueue.delete(ws);
      console.log(`Player left matchmaking queue. Queue size: ${this.matchmakingQueue.size}`);
      
      // Notify player
      this.events.onSendToSocket(ws, {
        type: "matchmakingStatus",
        status: "cancelled",
      });
    }
  }

  /**
   * Check if a WebSocket is in the matchmaking queue
   */
  isInMatchmaking(ws: WebSocket): boolean {
    return this.matchmakingQueue.has(ws);
  }

  /**
   * Try to match two players from the queue
   */
  private tryMatchPlayers(newPlayerWs: WebSocket): { matched: boolean; roomCode?: string; playerId?: string } {
    // Need at least 2 players to match
    if (this.matchmakingQueue.size < 2) {
      return { matched: false };
    }

    // Find another player in the queue (not the one who just joined)
    let otherPlayer: QueuedPlayer | null = null;
    let otherWs: WebSocket | null = null;
    
    for (const [ws, player] of this.matchmakingQueue) {
      if (ws !== newPlayerWs) {
        otherPlayer = player;
        otherWs = ws;
        break;
      }
    }

    if (!otherPlayer || !otherWs) {
      return { matched: false };
    }

    // Remove both from queue
    this.matchmakingQueue.delete(newPlayerWs);
    this.matchmakingQueue.delete(otherWs);

    console.log(`Match found! Creating room for matched players.`);

    // Create a room for the match
    const result = this.createRoom(otherWs);
    if (!result) {
      // If room creation fails, put both back in queue
      this.matchmakingQueue.set(newPlayerWs, { ws: newPlayerWs, joinedAt: Date.now() });
      this.matchmakingQueue.set(otherWs, { ws: otherWs, joinedAt: Date.now() });
      return { matched: false };
    }

    // Notify first player (who created the room)
    this.events.onSendToSocket(otherWs, {
      type: "matchFound",
      roomCode: result.roomCode,
    });

    // Second player joins the room
    const joinResult = this.joinRoom(newPlayerWs, result.roomCode);
    if (!joinResult) {
      return { matched: false };
    }

    // Notify second player
    this.events.onSendToSocket(newPlayerWs, {
      type: "matchFound",
      roomCode: result.roomCode,
    });

    return { 
      matched: true, 
      roomCode: result.roomCode,
      playerId: joinResult.playerId 
    };
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    clearInterval(this.cleanupInterval);
    
    this.rooms.forEach((room) => {
      room.gameEngine.stopGameLoop();
      room.connections.forEach((ws) => ws.close());
    });
    
    this.rooms.clear();
    this.playerToRoom.clear();
    this.matchmakingQueue.clear();
  }
}

