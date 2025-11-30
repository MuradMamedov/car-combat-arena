import { existsSync, readFileSync } from "fs";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { dirname, extname, join } from "path";
import { fileURLToPath } from "url";
import { WebSocket, WebSocketServer } from "ws";

import { MAX_PLAYERS, SERVER_PORT } from "../shared/constants/index.js";
import type {
  BotDifficultyLevel,
  ClientMessage,
} from "../shared/types/index.js";
import { GameEngine } from "./core/GameEngine.js";
import {
  BotManager,
  GameStateManager,
  PlayerManager,
} from "./managers/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MIME types for static files
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// Path to static files (client folder is sibling to server folder in production)
const STATIC_DIR = join(__dirname, "..", "client");

/**
 * Portable Game Server
 * Serves both static files (HTTP) and game WebSocket
 */
class PortableGameServer {
  private httpServer: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private playerManager: PlayerManager;
  private stateManager: GameStateManager;
  private gameEngine: GameEngine;
  private botManager: BotManager;
  private connections: Map<string, WebSocket> = new Map();
  private socketToPlayer: Map<WebSocket, string> = new Map();

  constructor(port: number = SERVER_PORT) {
    this.playerManager = new PlayerManager();
    this.stateManager = new GameStateManager();
    this.botManager = new BotManager();

    this.gameEngine = new GameEngine(
      this.playerManager,
      this.stateManager,
      this.botManager,
      {
        onGameStart: (state) => this.broadcast({ type: "gameStart", state }),
        onGameUpdate: (state) => this.broadcast({ type: "gameState", state }),
        onGameOver: (winnerId, state) =>
          this.broadcast({ type: "gameOver", winner: winnerId, state }),
      }
    );

    // Create HTTP server for static files
    this.httpServer = createServer((req, res) =>
      this.handleHttpRequest(req, res)
    );

    // Create WebSocket server attached to HTTP server
    this.wss = new WebSocketServer({ server: this.httpServer });
    this.wss.on("connection", (ws) => this.handleConnection(ws));

    this.httpServer.listen(port, () => {
      console.log("");
      console.log(
        "╔══════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║                   🎮 CAR COMBAT ARENA 🎮                  ║"
      );
      console.log(
        "╠══════════════════════════════════════════════════════════╣"
      );
      console.log(
        `║  Game running at: http://localhost:${port}                  ║`
      );
      console.log(
        "║                                                          ║"
      );
      console.log(
        "║  Open the URL above in your browser to play!             ║"
      );
      console.log(
        "║  Share your local IP for LAN multiplayer.                ║"
      );
      console.log(
        "║                                                          ║"
      );
      console.log(
        "║  Press Ctrl+C to stop the server.                        ║"
      );
      console.log(
        "╚══════════════════════════════════════════════════════════╝"
      );
      console.log("");
    });
  }

  /**
   * Handle HTTP requests for static files
   */
  private handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    let filePath = req.url || "/";

    // Default to index.html
    if (filePath === "/") {
      filePath = "/index.html";
    }

    const fullPath = join(STATIC_DIR, filePath);
    const ext = extname(fullPath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Security: prevent directory traversal
    if (!fullPath.startsWith(STATIC_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } catch {
        res.writeHead(500);
        res.end("Server Error");
      }
    } else {
      // Try index.html for SPA routing
      const indexPath = join(STATIC_DIR, "index.html");
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    if (!this.playerManager.canAddPlayer()) {
      this.sendToSocket(ws, { type: "error", message: "Game is full" });
      ws.close();
      return;
    }

    const playerData = this.playerManager.addPlayer();
    if (!playerData) {
      ws.close();
      return;
    }

    this.connections.set(playerData.id, ws);
    this.socketToPlayer.set(ws, playerData.id);

    this.gameEngine.handlePlayerJoin(playerData);

    this.sendToSocket(ws, { type: "connected", playerId: playerData.id });
    console.log(
      `Player ${playerData.playerNumber} connected: ${playerData.id}`
    );

    if (this.playerManager.getPlayerCount() === 1) {
      this.sendToSocket(ws, {
        type: "waiting",
        message: "Waiting for opponent...",
      });
    } else if (this.playerManager.getPlayerCount() === MAX_PLAYERS) {
      this.gameEngine.tryStartGame();
    }

    ws.on("message", (data) =>
      this.handleMessage(playerData.id, data.toString())
    );
    ws.on("close", () => this.handleDisconnect(playerData.id));
    ws.on("error", () => this.handleDisconnect(playerData.id));
  }

  /**
   * Handle player disconnect
   */
  private handleDisconnect(playerId: string): void {
    const ws = this.connections.get(playerId);
    if (ws) {
      this.socketToPlayer.delete(ws);
    }
    this.connections.delete(playerId);

    console.log(`Player disconnected: ${playerId}`);

    this.gameEngine.handlePlayerLeave(playerId);
    this.playerManager.removePlayer(playerId);

    this.broadcast({ type: "playerDisconnected", playerId });

    if (this.playerManager.getPlayerCount() === 1) {
      const remainingPlayer = this.playerManager.getAllPlayers()[0];

      if (this.botManager.isBot(remainingPlayer.id)) {
        this.gameEngine.handlePlayerLeave(remainingPlayer.id);
        this.playerManager.removePlayer(remainingPlayer.id);
        console.log("Bot removed - no human players remaining");
        return;
      }

      this.playerManager.reassignPlayerNumbers();
      this.gameEngine.handlePlayerJoin(remainingPlayer);

      const ws = this.connections.get(remainingPlayer.id);
      if (ws) {
        this.sendToSocket(ws, {
          type: "waiting",
          message: "Opponent disconnected. Waiting for new player...",
        });
      }
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(playerId: string, data: string): void {
    try {
      const message: ClientMessage = JSON.parse(data);

      switch (message.type) {
        case "input":
          this.playerManager.updateInput(playerId, message.input);
          break;
        case "restart":
          if (this.playerManager.getPlayerCount() === MAX_PLAYERS) {
            this.gameEngine.restart();
          }
          break;
        case "addBot":
          this.handleAddBot(playerId, message.difficulty);
          break;
      }
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  }

  /**
   * Handle bot addition
   */
  private handleAddBot(
    requesterId: string,
    difficulty: BotDifficultyLevel = "medium"
  ): void {
    if (!this.playerManager.canAddPlayer()) {
      const ws = this.connections.get(requesterId);
      if (ws) {
        this.sendToSocket(ws, { type: "error", message: "Game is full" });
      }
      return;
    }

    const botData = this.playerManager.addPlayer();
    if (!botData) return;

    this.botManager.addBot(botData.id, difficulty);
    this.gameEngine.handlePlayerJoin(botData);

    console.log(
      `Bot player ${botData.playerNumber} added (${difficulty}): ${botData.id}`
    );

    const ws = this.connections.get(requesterId);
    if (ws) {
      this.sendToSocket(ws, { type: "botAdded", botId: botData.id });
    }

    if (this.playerManager.getPlayerCount() === MAX_PLAYERS) {
      this.gameEngine.tryStartGame();
    }
  }

  /**
   * Send message to specific socket
   */
  private sendToSocket(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected players
   */
  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    for (const ws of this.connections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  /**
   * Shutdown server
   */
  shutdown(): void {
    this.gameEngine.stopGameLoop();
    this.wss.close();
    this.httpServer.close();
    console.log("Server shut down");
  }
}

// Start the server
const server = new PortableGameServer();

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  server.shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.shutdown();
  process.exit(0);
});
