import type {
  Boon,
  CarState,
  GameState,
  GameStatus,
  Wall,
} from "../../shared/types/index.js";
import { createInitialGameState } from "../../shared/types/index.js";
import { generateWalls } from "../../shared/utils/index.js";

/**
 * Manages the game state
 */
export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = createInitialGameState();
  }

  /**
   * Get the current game state
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Get the current game status
   */
  getStatus(): GameStatus {
    return this.state.gameStatus;
  }

  /**
   * Set the game status
   */
  setStatus(status: GameStatus): void {
    this.state.gameStatus = status;
  }

  /**
   * Set the winner
   */
  setWinner(winnerId: string | null): void {
    this.state.winner = winnerId;
  }

  /**
   * Add a player to the game state
   */
  addPlayer(car: CarState): void {
    this.state.players[car.id] = car;
  }

  /**
   * Remove a player from the game state
   */
  removePlayer(playerId: string): void {
    delete this.state.players[playerId];
  }

  /**
   * Get a player's car state
   */
  getPlayer(playerId: string): CarState | undefined {
    return this.state.players[playerId];
  }

  /**
   * Get all players
   */
  getAllPlayers(): CarState[] {
    return Object.values(this.state.players);
  }

  /**
   * Get player count
   */
  getPlayerCount(): number {
    return Object.keys(this.state.players).length;
  }

  /**
   * Clear all bullets
   */
  clearBullets(): void {
    this.state.bullets = [];
  }

  /**
   * Generate and set walls for the arena
   */
  generateWalls(count?: number): void {
    this.state.walls = generateWalls(count);
  }

  /**
   * Get all walls
   */
  getWalls(): Wall[] {
    return this.state.walls;
  }

  /**
   * Clear all walls
   */
  clearWalls(): void {
    this.state.walls = [];
  }

  /**
   * Get all boons
   */
  getBoons(): Boon[] {
    return this.state.boons;
  }

  /**
   * Set boons (synced from BoonManager)
   */
  setBoons(boons: Boon[]): void {
    this.state.boons = boons;
  }

  /**
   * Clear all boons
   */
  clearBoons(): void {
    this.state.boons = [];
  }

  /**
   * Check if game is in playing state
   */
  isPlaying(): boolean {
    return this.state.gameStatus === "playing";
  }

  /**
   * Check if game is waiting for players
   */
  isWaiting(): boolean {
    return this.state.gameStatus === "waiting";
  }

  /**
   * Check win condition
   */
  checkWinCondition(): { hasWinner: boolean; winnerId: string | null } {
    const players = this.getAllPlayers();
    if (players.length < 2) {
      return { hasWinner: false, winnerId: null };
    }

    const alivePlayers = players.filter((p) => p.health > 0);
    const deadPlayers = players.filter((p) => p.health <= 0);

    if (deadPlayers.length === 0) {
      return { hasWinner: false, winnerId: null };
    }

    if (alivePlayers.length === 1) {
      return { hasWinner: true, winnerId: alivePlayers[0].id };
    }

    if (alivePlayers.length === 0) {
      // Both dead - it's a draw
      return { hasWinner: true, winnerId: "draw" };
    }

    return { hasWinner: false, winnerId: null };
  }

  /**
   * Reset the game state for a new round
   */
  reset(): void {
    this.state = createInitialGameState();
  }

  /**
   * Reset for a restart (keep players, reset their state)
   */
  resetForRestart(): void {
    this.state.bullets = [];
    this.state.boons = [];
    this.state.gameStatus = "playing";
    this.state.winner = null;
    // Generate new walls for the new round
    this.generateWalls();
  }
}
