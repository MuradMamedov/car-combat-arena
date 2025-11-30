import {
  CAR_FRICTION,
  CAR_HEIGHT,
  CAR_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "../../shared/constants/index.js";
import type { CarState, PlayerInput } from "../../shared/types/index.js";

/**
 * Handles all physics-related calculations for cars
 */
export class PhysicsSystem {
  /**
   * Update car physics based on input
   */
  updateCar(car: CarState, input: PlayerInput): void {
    this.applyRotation(car, input);
    this.applyAcceleration(car, input);
    this.applyFriction(car);
    this.limitSpeed(car, input.boost);
    this.updatePosition(car);
    this.constrainToBounds(car);
  }

  /**
   * Apply rotation based on left/right input or mouse target angle
   * Uses the car's own turnSpeed stat
   */
  private applyRotation(car: CarState, input: PlayerInput): void {
    const turnSpeed = car.turnSpeed;

    // Mouse control takes priority when active
    if (input.useMouseControl && input.targetAngle !== undefined) {
      this.rotateTowardsTarget(car, input.targetAngle, turnSpeed);
    } else {
      // Keyboard rotation
      if (input.left) {
        car.angle -= turnSpeed;
      }
      if (input.right) {
        car.angle += turnSpeed;
      }
    }
  }

  /**
   * Rotate car towards a target angle
   */
  private rotateTowardsTarget(
    car: CarState,
    targetAngle: number,
    turnSpeed: number
  ): void {
    // Calculate the shortest angle difference
    let angleDiff = targetAngle - car.angle;

    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Apply rotation at car's turnSpeed, but don't overshoot
    if (Math.abs(angleDiff) < turnSpeed) {
      car.angle = targetAngle;
    } else if (angleDiff > 0) {
      car.angle += turnSpeed;
    } else {
      car.angle -= turnSpeed;
    }
  }

  /**
   * Apply acceleration based on forward/backward input
   * Uses the car's own acceleration stat
   */
  private applyAcceleration(car: CarState, input: PlayerInput): void {
    const acceleration = car.acceleration;

    if (input.forward) {
      car.velocityX += Math.cos(car.angle) * acceleration;
      car.velocityY += Math.sin(car.angle) * acceleration;
    }
    if (input.backward) {
      const reverseMultiplier = 0.5;
      car.velocityX -= Math.cos(car.angle) * acceleration * reverseMultiplier;
      car.velocityY -= Math.sin(car.angle) * acceleration * reverseMultiplier;
    }
  }

  /**
   * Apply friction to slow down the car
   */
  private applyFriction(car: CarState): void {
    car.velocityX *= CAR_FRICTION;
    car.velocityY *= CAR_FRICTION;
  }

  /**
   * Limit car speed to max speed (or boost speed)
   * Uses the car's own maxSpeed and boostSpeed stats
   */
  private limitSpeed(car: CarState, isBoosting: boolean): void {
    const maxSpeed = isBoosting ? car.boostSpeed : car.maxSpeed;
    const speed = Math.sqrt(car.velocityX ** 2 + car.velocityY ** 2);

    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed;
      car.velocityX *= ratio;
      car.velocityY *= ratio;
    }
  }

  /**
   * Update car position based on velocity
   */
  private updatePosition(car: CarState): void {
    car.x += car.velocityX;
    car.y += car.velocityY;
  }

  /**
   * Keep car within game bounds
   */
  private constrainToBounds(car: CarState): void {
    const halfWidth = CAR_WIDTH / 2;
    const halfHeight = CAR_HEIGHT / 2;

    car.x = Math.max(halfWidth, Math.min(GAME_WIDTH - halfWidth, car.x));
    car.y = Math.max(halfHeight, Math.min(GAME_HEIGHT - halfHeight, car.y));
  }

  /**
   * Calculate the current speed of a car
   */
  getSpeed(car: CarState): number {
    return Math.sqrt(car.velocityX ** 2 + car.velocityY ** 2);
  }

  /**
   * Calculate relative speed between two cars
   */
  getRelativeSpeed(car1: CarState, car2: CarState): number {
    const relVelX = car1.velocityX - car2.velocityX;
    const relVelY = car1.velocityY - car2.velocityY;
    return Math.sqrt(relVelX ** 2 + relVelY ** 2);
  }
}
