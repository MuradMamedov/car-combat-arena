/**
 * Math utility functions for the game
 */

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Linear interpolation
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Generate a random number between min and max
 */
export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generate a random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Convert degrees to radians
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const radToDeg = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Normalize an angle to be between -PI and PI
 */
export const normalizeAngle = (angle: number): number => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};
