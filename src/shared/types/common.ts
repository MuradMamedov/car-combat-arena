/**
 * Common type definitions used across the application
 */

/**
 * 2D Vector representation
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Rectangle bounds for collision detection
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Player input state
 */
export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean; // Legacy - maps to cannon
  shootCannon: boolean;
  shootMachineGun: boolean;
  boost: boolean;
  // Mouse control
  targetAngle?: number; // Angle to rotate towards (radians)
  useMouseControl?: boolean; // Whether mouse control is active
}

/**
 * Creates a default player input state
 */
export const createDefaultInput = (): PlayerInput => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  shoot: false,
  shootCannon: false,
  shootMachineGun: false,
  boost: false,
  targetAngle: undefined,
  useMouseControl: false,
});

/**
 * Game status enumeration
 */
export type GameStatus = "waiting" | "playing" | "gameover";
