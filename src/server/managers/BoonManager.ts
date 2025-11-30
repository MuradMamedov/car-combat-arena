import {
  BOON_EFFECTS,
  BOON_LIFETIME,
  BOON_MAX_COUNT,
  BOON_PICKUP_RADIUS,
  BOON_SPAWN_INTERVAL,
  BOON_SPAWN_MARGIN,
  BOON_SPAWN_WEIGHTS,
  CAR_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_SPAWN_POSITIONS,
  type BoonType,
} from "../../shared/constants/index.js";
import type { Boon, CarState, Wall } from "../../shared/types/index.js";
import { EntityFactory } from "../../shared/types/index.js";
import { generateId } from "../../shared/utils/index.js";

/**
 * Event fired when a player picks up a boon
 */
export interface BoonPickupEvent {
  playerId: string;
  boon: Boon;
  effectValue: number;
}

/**
 * Manages boon spawning, lifetime, and collection
 */
export class BoonManager {
  private boons: Boon[] = [];
  private lastSpawnTime: number = 0;
  private spawnInterval: number = BOON_SPAWN_INTERVAL;

  constructor() {
    this.reset();
  }

  /**
   * Get all active boons
   */
  getBoons(): Boon[] {
    return this.boons;
  }

  /**
   * Update boon system - spawn new boons and remove expired ones
   */
  update(walls: Wall[]): void {
    const now = Date.now();

    // Remove expired boons
    this.boons = this.boons.filter((boon) => {
      return now - boon.spawnTime < boon.lifetime;
    });

    // Try to spawn new boon if under limit and interval passed
    if (
      this.boons.length < BOON_MAX_COUNT &&
      now - this.lastSpawnTime >= this.spawnInterval
    ) {
      const newBoon = this.trySpawnBoon(walls);
      if (newBoon) {
        this.boons.push(newBoon);
        this.lastSpawnTime = now;
      }
    }
  }

  /**
   * Try to spawn a boon at a valid location
   */
  private trySpawnBoon(walls: Wall[]): Boon | null {
    // Try up to 20 times to find a valid spawn location
    for (let attempt = 0; attempt < 20; attempt++) {
      const x =
        BOON_SPAWN_MARGIN +
        Math.random() * (GAME_WIDTH - BOON_SPAWN_MARGIN * 2);
      const y =
        BOON_SPAWN_MARGIN +
        Math.random() * (GAME_HEIGHT - BOON_SPAWN_MARGIN * 2);

      if (this.isValidSpawnLocation(x, y, walls)) {
        const type = this.selectRandomBoonType();
        return EntityFactory.createBoon(
          generateId("boon"),
          x,
          y,
          type,
          BOON_LIFETIME
        );
      }
    }
    return null;
  }

  /**
   * Check if a location is valid for spawning
   */
  private isValidSpawnLocation(x: number, y: number, walls: Wall[]): boolean {
    // Check distance from player spawn points
    for (const spawn of PLAYER_SPAWN_POSITIONS) {
      const dx = x - spawn.x;
      const dy = y - spawn.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BOON_SPAWN_MARGIN) {
        return false;
      }
    }

    // Check distance from existing boons
    for (const boon of this.boons) {
      const dx = x - boon.x;
      const dy = y - boon.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BOON_PICKUP_RADIUS * 2) {
        return false;
      }
    }

    // Check collision with walls
    for (const wall of walls) {
      const wallLeft = wall.x - wall.width / 2 - BOON_SPAWN_MARGIN / 2;
      const wallRight = wall.x + wall.width / 2 + BOON_SPAWN_MARGIN / 2;
      const wallTop = wall.y - wall.height / 2 - BOON_SPAWN_MARGIN / 2;
      const wallBottom = wall.y + wall.height / 2 + BOON_SPAWN_MARGIN / 2;

      if (x >= wallLeft && x <= wallRight && y >= wallTop && y <= wallBottom) {
        return false;
      }
    }

    return true;
  }

  /**
   * Select a random boon type based on spawn weights
   */
  private selectRandomBoonType(): BoonType {
    const totalWeight = Object.values(BOON_SPAWN_WEIGHTS).reduce(
      (a, b) => a + b,
      0
    );
    let random = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(BOON_SPAWN_WEIGHTS)) {
      random -= weight;
      if (random <= 0) {
        return type as BoonType;
      }
    }

    return "health"; // Fallback
  }

  /**
   * Check if a car can pick up a boon
   */
  checkPickup(car: CarState): BoonPickupEvent | null {
    if (car.health <= 0) return null;

    for (let i = 0; i < this.boons.length; i++) {
      const boon = this.boons[i];
      const dx = car.x - boon.x;
      const dy = car.y - boon.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < BOON_PICKUP_RADIUS + CAR_WIDTH / 2) {
        // Remove the boon
        this.boons.splice(i, 1);

        // Return pickup event
        return {
          playerId: car.id,
          boon,
          effectValue: BOON_EFFECTS[boon.type].value,
        };
      }
    }

    return null;
  }

  /**
   * Apply boon effect to a car
   */
  applyBoonEffect(car: CarState, boon: Boon): void {
    const effect = BOON_EFFECTS[boon.type];

    switch (boon.type) {
      case "health":
        car.health = Math.min(car.maxHealth, car.health + effect.value);
        break;
      case "shield":
        car.shield = Math.min(car.maxShield, car.shield + effect.value);
        break;
      // Speed, damage, and rapidfire are time-based buffs
      // These would need to be tracked separately on the car
      // For now, we'll implement the instant effects
      case "speed":
      case "damage":
      case "rapidfire":
        // TODO: Implement time-based buffs
        // For now, give a small health bonus as placeholder
        car.health = Math.min(car.maxHealth, car.health + 10);
        break;
    }
  }

  /**
   * Remove a specific boon by ID
   */
  removeBoon(boonId: string): void {
    this.boons = this.boons.filter((b) => b.id !== boonId);
  }

  /**
   * Clear all boons
   */
  clear(): void {
    this.boons = [];
  }

  /**
   * Reset the boon manager
   */
  reset(): void {
    this.boons = [];
    this.lastSpawnTime = 0;
  }
}
