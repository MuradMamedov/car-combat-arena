import type { GameStatus } from "./common.js";
import type { Boon, Bullet, CarState, Wall } from "./entities.js";

/**
 * Complete game state at any point in time
 */
export interface GameState {
  players: Record<string, CarState>;
  bullets: Bullet[];
  walls: Wall[];
  boons: Boon[];
  gameStatus: GameStatus;
  winner: string | null;
}

/**
 * Creates an initial empty game state
 */
export const createInitialGameState = (): GameState => ({
  players: {},
  bullets: [],
  walls: [],
  boons: [],
  gameStatus: "waiting",
  winner: null,
});
