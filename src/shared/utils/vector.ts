import type { Vector2 } from "../types/index.js";

/**
 * Vector math utilities for 2D game physics
 */
export const Vector = {
  /**
   * Create a new vector
   */
  create(x: number = 0, y: number = 0): Vector2 {
    return { x, y };
  },

  /**
   * Add two vectors
   */
  add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  /**
   * Subtract vector b from vector a
   */
  subtract(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  /**
   * Multiply vector by scalar
   */
  scale(v: Vector2, scalar: number): Vector2 {
    return { x: v.x * scalar, y: v.y * scalar };
  },

  /**
   * Get the magnitude (length) of a vector
   */
  magnitude(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  /**
   * Get the squared magnitude (faster, no sqrt)
   */
  magnitudeSquared(v: Vector2): number {
    return v.x * v.x + v.y * v.y;
  },

  /**
   * Normalize a vector to unit length
   */
  normalize(v: Vector2): Vector2 {
    const mag = Vector.magnitude(v);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: v.x / mag, y: v.y / mag };
  },

  /**
   * Calculate distance between two points
   */
  distance(a: Vector2, b: Vector2): number {
    return Vector.magnitude(Vector.subtract(a, b));
  },

  /**
   * Calculate squared distance between two points (faster)
   */
  distanceSquared(a: Vector2, b: Vector2): number {
    return Vector.magnitudeSquared(Vector.subtract(a, b));
  },

  /**
   * Calculate dot product
   */
  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  /**
   * Create a vector from an angle and magnitude
   */
  fromAngle(angle: number, magnitude: number = 1): Vector2 {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude,
    };
  },

  /**
   * Get the angle of a vector
   */
  angle(v: Vector2): number {
    return Math.atan2(v.y, v.x);
  },

  /**
   * Clamp a vector's magnitude
   */
  clampMagnitude(v: Vector2, maxMagnitude: number): Vector2 {
    const mag = Vector.magnitude(v);
    if (mag > maxMagnitude) {
      return Vector.scale(Vector.normalize(v), maxMagnitude);
    }
    return { ...v };
  },

  /**
   * Linear interpolation between two vectors
   */
  lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  },
};
