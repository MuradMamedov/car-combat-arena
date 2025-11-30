import {
  BULLET_SIZE,
  CAR_HEIGHT,
  CAR_WIDTH,
  COLLISION_DAMAGE_MULTIPLIER,
  COLLISION_DAMAGE_THRESHOLD,
} from "../../shared/constants/index.js";
import type { Bullet, CarState, Wall } from "../../shared/types/index.js";
import { rectangleIntersectsWall } from "../../shared/utils/index.js";
import { PhysicsSystem } from "./PhysicsSystem.js";

/**
 * Collision detection result
 */
export interface CollisionResult {
  occurred: boolean;
  damage?: number;
}

/**
 * Bullet collision result
 */
export interface BulletHitResult {
  bulletId: string;
  targetId: string;
  damage: number;
}

/**
 * Handles all collision detection and resolution
 */
export class CollisionSystem {
  private physicsSystem: PhysicsSystem;

  constructor(physicsSystem: PhysicsSystem) {
    this.physicsSystem = physicsSystem;
  }

  /**
   * Check if a bullet hits a car
   */
  checkBulletCarCollision(bullet: Bullet, car: CarState): boolean {
    const dx = Math.abs(bullet.x - car.x);
    const dy = Math.abs(bullet.y - car.y);
    const hitBoxPadding = 5;

    return (
      dx < CAR_WIDTH / 2 + hitBoxPadding && dy < CAR_HEIGHT / 2 + hitBoxPadding
    );
  }

  /**
   * Check if bullet is out of bounds
   */
  isBulletOutOfBounds(bullet: Bullet, width: number, height: number): boolean {
    return (
      bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height
    );
  }

  /**
   * Check and resolve car-to-car collision
   */
  checkCarCollision(car1: CarState, car2: CarState): CollisionResult {
    const dx = car1.x - car2.x;
    const dy = car1.y - car2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = CAR_WIDTH;

    if (distance >= minDistance) {
      return { occurred: false };
    }

    // Calculate overlap and push direction
    const overlap = minDistance - distance;
    const pushX = (dx / distance) * overlap * 0.5;
    const pushY = (dy / distance) * overlap * 0.5;

    // Push cars apart
    car1.x += pushX;
    car1.y += pushY;
    car2.x -= pushX;
    car2.y -= pushY;

    // Calculate collision damage based on relative speed
    const relativeSpeed = this.physicsSystem.getRelativeSpeed(car1, car2);
    let damage = 0;

    if (relativeSpeed > COLLISION_DAMAGE_THRESHOLD) {
      damage = Math.floor(relativeSpeed * COLLISION_DAMAGE_MULTIPLIER);
      car1.health -= damage;
      car2.health -= damage;
    }

    // Apply bounce effect
    this.applyBounce(car1, car2);

    return { occurred: true, damage };
  }

  /**
   * Apply bounce effect when cars collide
   */
  private applyBounce(car1: CarState, car2: CarState): void {
    const bounceMultiplier = 0.5;

    const tempVx = car1.velocityX * bounceMultiplier;
    const tempVy = car1.velocityY * bounceMultiplier;

    car1.velocityX = car2.velocityX * bounceMultiplier;
    car1.velocityY = car2.velocityY * bounceMultiplier;
    car2.velocityX = tempVx;
    car2.velocityY = tempVy;
  }

  /**
   * Check all car collisions in the game
   */
  checkAllCarCollisions(cars: CarState[]): CollisionResult[] {
    const results: CollisionResult[] = [];

    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const car1 = cars[i];
        const car2 = cars[j];

        if (car1.health <= 0 || car2.health <= 0) continue;

        const result = this.checkCarCollision(car1, car2);
        if (result.occurred) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Check if a car collides with a wall
   */
  checkCarWallCollision(car: CarState, wall: Wall): boolean {
    return rectangleIntersectsWall(car.x, car.y, CAR_WIDTH, CAR_HEIGHT, wall);
  }

  /**
   * Resolve car-wall collision by pushing the car out of the wall
   */
  resolveCarWallCollision(car: CarState, wall: Wall): void {
    // Calculate overlap on each axis
    const carLeft = car.x - CAR_WIDTH / 2;
    const carRight = car.x + CAR_WIDTH / 2;
    const carTop = car.y - CAR_HEIGHT / 2;
    const carBottom = car.y + CAR_HEIGHT / 2;

    const wallLeft = wall.x - wall.width / 2;
    const wallRight = wall.x + wall.width / 2;
    const wallTop = wall.y - wall.height / 2;
    const wallBottom = wall.y + wall.height / 2;

    // Calculate penetration depth on each axis
    const overlapLeft = carRight - wallLeft;
    const overlapRight = wallRight - carLeft;
    const overlapTop = carBottom - wallTop;
    const overlapBottom = wallBottom - carTop;

    // Find minimum overlap to determine push direction
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    // Push car out of wall on the axis with smallest overlap
    if (minOverlapX < minOverlapY) {
      if (overlapLeft < overlapRight) {
        car.x = wallLeft - CAR_WIDTH / 2;
        car.velocityX = -Math.abs(car.velocityX) * 0.3;
      } else {
        car.x = wallRight + CAR_WIDTH / 2;
        car.velocityX = Math.abs(car.velocityX) * 0.3;
      }
    } else {
      if (overlapTop < overlapBottom) {
        car.y = wallTop - CAR_HEIGHT / 2;
        car.velocityY = -Math.abs(car.velocityY) * 0.3;
      } else {
        car.y = wallBottom + CAR_HEIGHT / 2;
        car.velocityY = Math.abs(car.velocityY) * 0.3;
      }
    }
  }

  /**
   * Check and resolve all car-wall collisions
   */
  checkAllCarWallCollisions(cars: CarState[], walls: Wall[]): void {
    for (const car of cars) {
      if (car.health <= 0) continue;

      for (const wall of walls) {
        if (this.checkCarWallCollision(car, wall)) {
          this.resolveCarWallCollision(car, wall);
        }
      }
    }
  }

  /**
   * Check if a bullet hits a wall
   */
  checkBulletWallCollision(bullet: Bullet, wall: Wall): boolean {
    return rectangleIntersectsWall(bullet.x, bullet.y, BULLET_SIZE, BULLET_SIZE, wall);
  }

  /**
   * Get all bullet IDs that hit walls
   */
  getBulletsHittingWalls(bullets: Bullet[], walls: Wall[]): string[] {
    const hitBulletIds: string[] = [];

    for (const bullet of bullets) {
      for (const wall of walls) {
        if (this.checkBulletWallCollision(bullet, wall)) {
          hitBulletIds.push(bullet.id);
          break;
        }
      }
    }

    return hitBulletIds;
  }
}
