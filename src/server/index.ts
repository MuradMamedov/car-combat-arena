import { GameServer } from "./core/index.js";

// Start the game server
const server = new GameServer();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  server.shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.shutdown();
  process.exit(0);
});
