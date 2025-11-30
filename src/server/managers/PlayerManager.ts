import {
  MAX_PLAYERS,
  PLAYER_SPAWN_POSITIONS,
  type GliderTier,
} from "../../shared/constants/index.js";
import type {
  CarState,
  PlayerCustomization,
  PlayerInput,
} from "../../shared/types/index.js";
import {
  createDefaultInput,
  DEFAULT_CUSTOMIZATION,
  EntityFactory,
} from "../../shared/types/index.js";
import { generatePlayerId } from "../../shared/utils/index.js";

/**
 * Player connection data
 */
export interface PlayerData {
  id: string;
  playerNumber: number;
  input: PlayerInput;
  lastShootTime: number;
  gliderTier: GliderTier;
  customization: PlayerCustomization;
}

/**
 * Manages player state and lifecycle
 */
export class PlayerManager {
  private players: Map<string, PlayerData> = new Map();

  /**
   * Check if more players can join
   */
  canAddPlayer(): boolean {
    return this.players.size < MAX_PLAYERS;
  }

  /**
   * Add a new player with optional glider tier and customization
   */
  addPlayer(
    gliderTier: GliderTier = 3,
    customization?: PlayerCustomization
  ): PlayerData | null {
    if (!this.canAddPlayer()) {
      return null;
    }

    const playerNumber = this.getNextPlayerNumber();
    const playerId = generatePlayerId();

    const playerData: PlayerData = {
      id: playerId,
      playerNumber,
      input: createDefaultInput(),
      lastShootTime: 0,
      gliderTier,
      customization: customization || { ...DEFAULT_CUSTOMIZATION },
    };

    this.players.set(playerId, playerData);
    return playerData;
  }

  /**
   * Update a player's glider tier
   */
  setGliderTier(playerId: string, tier: GliderTier): void {
    const player = this.players.get(playerId);
    if (player) {
      player.gliderTier = tier;
    }
  }

  /**
   * Update a player's customization
   */
  setCustomization(playerId: string, customization: PlayerCustomization): void {
    const player = this.players.get(playerId);
    if (player) {
      player.customization = { ...customization };
    }
  }

  /**
   * Remove a player
   */
  removePlayer(playerId: string): boolean {
    return this.players.delete(playerId);
  }

  /**
   * Get player data by ID
   */
  getPlayer(playerId: string): PlayerData | undefined {
    return this.players.get(playerId);
  }

  /**
   * Get all players
   */
  getAllPlayers(): PlayerData[] {
    return Array.from(this.players.values());
  }

  /**
   * Get player count
   */
  getPlayerCount(): number {
    return this.players.size;
  }

  /**
   * Update player input
   */
  updateInput(playerId: string, input: PlayerInput): void {
    const player = this.players.get(playerId);
    if (player) {
      player.input = { ...input };
    }
  }

  /**
   * Create car state for a player using their selected glider tier and customization
   */
  createCarState(playerData: PlayerData): CarState {
    const spawnPos = PLAYER_SPAWN_POSITIONS[playerData.playerNumber - 1];

    return EntityFactory.createCar(
      playerData.id,
      spawnPos.x,
      spawnPos.y,
      spawnPos.angle,
      playerData.gliderTier,
      playerData.customization
    );
  }

  /**
   * Reset player shoot time
   */
  resetShootTime(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.lastShootTime = 0;
    }
  }

  /**
   * Update shoot time for a player
   */
  updateShootTime(playerId: string, time: number): void {
    const player = this.players.get(playerId);
    if (player) {
      player.lastShootTime = time;
    }
  }

  /**
   * Get the next available player number
   */
  private getNextPlayerNumber(): number {
    const usedNumbers = new Set(
      Array.from(this.players.values()).map((p) => p.playerNumber)
    );

    for (let i = 1; i <= MAX_PLAYERS; i++) {
      if (!usedNumbers.has(i)) {
        return i;
      }
    }

    return this.players.size + 1;
  }

  /**
   * Reassign player numbers after disconnect
   */
  reassignPlayerNumbers(): void {
    let num = 1;
    for (const player of this.players.values()) {
      player.playerNumber = num++;
    }
  }

  /**
   * Clear all players
   */
  clear(): void {
    this.players.clear();
  }
}
