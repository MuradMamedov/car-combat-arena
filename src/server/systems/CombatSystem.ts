import {
  CANNON_BULLET_DAMAGE,
  CANNON_BULLET_SIZE,
  CANNON_BULLET_SPEED,
  CANNON_COOLDOWN,
  CAR_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  MACHINEGUN_BULLET_DAMAGE,
  MACHINEGUN_BULLET_SIZE,
  MACHINEGUN_BULLET_SPEED,
  MACHINEGUN_COOLDOWN,
  SCORE_PER_HIT,
  SCORE_PER_KILL,
  SHIELD_RECHARGE_DELAY,
  WALL_MATERIALS,
  type WeaponType,
} from "../../shared/constants/index.js";
import type {
  Bullet,
  CarState,
  GameState,
  Wall,
} from "../../shared/types/index.js";
import { EntityFactory } from "../../shared/types/index.js";
import {
  createBulletIdGenerator,
  rectangleIntersectsWall,
  Vector,
} from "../../shared/utils/index.js";
import { CollisionSystem } from "./CollisionSystem.js";

/**
 * Result of wall damage calculation
 */
export interface WallDamageResult {
  wallId: string;
  damage: number;
  destroyed: boolean;
}

/**
 * Weapon configuration
 */
interface WeaponConfig {
  speed: number;
  damage: number;
  size: number;
  cooldown: number;
}

const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  cannon: {
    speed: CANNON_BULLET_SPEED,
    damage: CANNON_BULLET_DAMAGE,
    size: CANNON_BULLET_SIZE,
    cooldown: CANNON_COOLDOWN,
  },
  machinegun: {
    speed: MACHINEGUN_BULLET_SPEED,
    damage: MACHINEGUN_BULLET_DAMAGE,
    size: MACHINEGUN_BULLET_SIZE,
    cooldown: MACHINEGUN_COOLDOWN,
  },
};

/**
 * Handles shooting and bullet management
 */
export class CombatSystem {
  private collisionSystem: CollisionSystem;
  private generateBulletId: () => string;
  // Separate cooldown tracking for each weapon type
  private lastCannonShootTimes: Map<string, number> = new Map();
  private lastMachineGunShootTimes: Map<string, number> = new Map();

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
    this.generateBulletId = createBulletIdGenerator();
  }

  /**
   * Attempt to shoot cannon from a car
   */
  tryShootCannon(
    car: CarState,
    bullets: Bullet[],
    walls: Wall[] = []
  ): boolean {
    return this.tryShootWeapon(
      car,
      bullets,
      walls,
      "cannon",
      this.lastCannonShootTimes
    );
  }

  /**
   * Attempt to shoot machine gun from a car
   */
  tryShootMachineGun(
    car: CarState,
    bullets: Bullet[],
    walls: Wall[] = []
  ): boolean {
    return this.tryShootWeapon(
      car,
      bullets,
      walls,
      "machinegun",
      this.lastMachineGunShootTimes
    );
  }

  /**
   * Legacy shoot method - defaults to cannon
   */
  tryShoot(car: CarState, bullets: Bullet[], walls: Wall[] = []): boolean {
    return this.tryShootCannon(car, bullets, walls);
  }

  /**
   * Generic weapon shooting method
   */
  private tryShootWeapon(
    car: CarState,
    bullets: Bullet[],
    walls: Wall[],
    weaponType: WeaponType,
    cooldownMap: Map<string, number>
  ): boolean {
    const now = Date.now();
    const lastShoot = cooldownMap.get(car.id) ?? 0;
    const config = WEAPON_CONFIGS[weaponType];

    if (now - lastShoot < config.cooldown) {
      return false;
    }

    // Check if bullet spawn position would be inside a wall
    const spawnOffset = CAR_WIDTH / 2 + 10;
    const spawnPosition = Vector.add(
      { x: car.x, y: car.y },
      Vector.fromAngle(car.angle, spawnOffset)
    );

    // Check if spawn position collides with any wall
    for (const wall of walls) {
      if (
        rectangleIntersectsWall(
          spawnPosition.x,
          spawnPosition.y,
          config.size,
          config.size,
          wall
        )
      ) {
        // Bullet would spawn inside a wall - don't create it
        return false;
      }
    }

    cooldownMap.set(car.id, now);
    const bullet = this.createBullet(car, weaponType);
    bullets.push(bullet);
    return true;
  }

  /**
   * Create a bullet from a car's current position and angle
   * Applies the car's bulletDamageMultiplier to scale damage
   */
  private createBullet(car: CarState, weaponType: WeaponType): Bullet {
    const config = WEAPON_CONFIGS[weaponType];
    const spawnOffset = CAR_WIDTH / 2 + 10;
    const position = Vector.add(
      { x: car.x, y: car.y },
      Vector.fromAngle(car.angle, spawnOffset)
    );
    const velocity = Vector.fromAngle(car.angle, config.speed);

    // Apply the car's damage multiplier based on glider tier
    const scaledDamage = Math.round(config.damage * car.bulletDamageMultiplier);

    return EntityFactory.createBullet(
      this.generateBulletId(),
      car.id,
      position,
      velocity,
      car.angle,
      scaledDamage,
      weaponType,
      config.size,
      car.gunEffectId
    );
  }

  /**
   * Tracks wall damage events from the last update
   */
  private lastWallDamageResults: WallDamageResult[] = [];

  /**
   * Get wall damage results from the last update
   */
  getLastWallDamageResults(): WallDamageResult[] {
    return this.lastWallDamageResults;
  }

  /**
   * Apply damage to a wall
   */
  private applyWallDamage(bullet: Bullet, wall: Wall): WallDamageResult {
    const materialConfig = WALL_MATERIALS[wall.material];
    const effectiveDamage = Math.floor(
      bullet.damage * (1 - materialConfig.damageResistance)
    );

    wall.health -= effectiveDamage;
    const destroyed = wall.health <= 0;

    return {
      wallId: wall.id,
      damage: effectiveDamage,
      destroyed,
    };
  }

  /**
   * Update all bullets and handle collisions
   */
  updateBullets(gameState: GameState): void {
    const bulletsToRemove = new Set<string>();
    const wallsToRemove = new Set<string>();
    this.lastWallDamageResults = [];

    for (const bullet of gameState.bullets) {
      // Update position
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;

      // Check bounds
      if (
        this.collisionSystem.isBulletOutOfBounds(
          bullet,
          GAME_WIDTH,
          GAME_HEIGHT
        )
      ) {
        bulletsToRemove.add(bullet.id);
        continue;
      }

      // Check collision with walls
      for (const wall of gameState.walls) {
        if (wallsToRemove.has(wall.id)) continue;

        if (this.collisionSystem.checkBulletWallCollision(bullet, wall)) {
          // Apply damage to the wall
          const damageResult = this.applyWallDamage(bullet, wall);
          this.lastWallDamageResults.push(damageResult);

          if (damageResult.destroyed) {
            wallsToRemove.add(wall.id);
          }

          bulletsToRemove.add(bullet.id);
          break;
        }
      }

      if (bulletsToRemove.has(bullet.id)) {
        continue;
      }

      // Check collision with players
      for (const playerId in gameState.players) {
        if (playerId === bullet.ownerId) continue;

        const target = gameState.players[playerId];
        if (target.health <= 0) continue;

        if (this.collisionSystem.checkBulletCarCollision(bullet, target)) {
          this.applyDamage(bullet, target, gameState);
          bulletsToRemove.add(bullet.id);
          break;
        }
      }
    }

    // Remove destroyed bullets
    gameState.bullets = gameState.bullets.filter(
      (b) => !bulletsToRemove.has(b.id)
    );

    // Remove destroyed walls
    gameState.walls = gameState.walls.filter((w) => !wallsToRemove.has(w.id));
  }

  /**
   * Apply damage from a bullet hit (shield absorbs first)
   */
  private applyDamage(
    bullet: Bullet,
    target: CarState,
    gameState: GameState
  ): void {
    let remainingDamage = bullet.damage;

    // Shield absorbs damage first
    if (target.shield > 0) {
      const shieldDamage = Math.min(target.shield, remainingDamage);
      target.shield -= shieldDamage;
      remainingDamage -= shieldDamage;
    }

    // Remaining damage goes to health
    if (remainingDamage > 0) {
      target.health -= remainingDamage;
    }

    // Reset shield recharge timer on any damage
    target.shieldRechargeTimer = SHIELD_RECHARGE_DELAY;

    // Award points to shooter
    const shooter = gameState.players[bullet.ownerId];
    if (shooter) {
      shooter.score += SCORE_PER_HIT;

      if (target.health <= 0) {
        shooter.score += SCORE_PER_KILL;
      }
    }
  }

  /**
   * Reset combat state for a player
   */
  resetPlayer(playerId: string): void {
    this.lastCannonShootTimes.delete(playerId);
    this.lastMachineGunShootTimes.delete(playerId);
  }

  /**
   * Clear all combat state
   */
  reset(): void {
    this.lastCannonShootTimes.clear();
    this.lastMachineGunShootTimes.clear();
    this.generateBulletId = createBulletIdGenerator();
  }
}
