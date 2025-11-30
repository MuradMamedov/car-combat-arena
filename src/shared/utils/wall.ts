import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_SPAWN_POSITIONS,
  WALL_COUNT,
  WALL_MATERIALS,
  WALL_MATERIAL_WEIGHTS,
  WALL_MAX_LENGTH,
  WALL_MIN_LENGTH,
  WALL_SPAWN_MARGIN,
  WALL_THICKNESS,
  type WallMaterial,
} from "../constants/index.js";
import type { Wall } from "../types/index.js";
import { EntityFactory } from "../types/index.js";
import { generateId } from "./id.js";

/**
 * Select a random wall material based on weighted probability
 */
function selectRandomMaterial(): WallMaterial {
  const materials = Object.keys(WALL_MATERIAL_WEIGHTS) as WallMaterial[];
  const totalWeight = Object.values(WALL_MATERIAL_WEIGHTS).reduce(
    (a, b) => a + b,
    0
  );
  let random = Math.random() * totalWeight;

  for (const material of materials) {
    random -= WALL_MATERIAL_WEIGHTS[material];
    if (random <= 0) {
      return material;
    }
  }

  return materials[0]; // Fallback
}

/**
 * Check if a position is too close to spawn points
 */
function isTooCloseToSpawn(x: number, y: number): boolean {
  for (const spawn of PLAYER_SPAWN_POSITIONS) {
    const dx = x - spawn.x;
    const dy = y - spawn.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < WALL_SPAWN_MARGIN) {
      return true;
    }
  }
  return false;
}

/**
 * Check if two walls overlap
 */
function wallsOverlap(wall1: Wall, wall2: Wall, padding: number = 30): boolean {
  return !(
    wall1.x + wall1.width / 2 + padding < wall2.x - wall2.width / 2 ||
    wall1.x - wall1.width / 2 - padding > wall2.x + wall2.width / 2 ||
    wall1.y + wall1.height / 2 + padding < wall2.y - wall2.height / 2 ||
    wall1.y - wall1.height / 2 - padding > wall2.y + wall2.height / 2
  );
}

/**
 * Check if a wall overlaps with any existing walls
 */
function overlapsExisting(wall: Wall, existingWalls: Wall[]): boolean {
  for (const existing of existingWalls) {
    if (wallsOverlap(wall, existing)) {
      return true;
    }
  }
  return false;
}

/**
 * Generate a random number between min and max
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random wall with valid placement (horizontal or vertical)
 */
function generateRandomWall(
  existingWalls: Wall[],
  maxAttempts: number = 50
): Wall | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Randomly choose horizontal or vertical orientation
    const isHorizontal = Math.random() > 0.5;
    const length = randomRange(WALL_MIN_LENGTH, WALL_MAX_LENGTH);

    // Horizontal: wide and thin, Vertical: thin and tall
    const width = isHorizontal ? length : WALL_THICKNESS;
    const height = isHorizontal ? WALL_THICKNESS : length;

    // Keep walls within bounds with margin
    const margin = 80;
    const x = randomRange(margin + width / 2, GAME_WIDTH - margin - width / 2);
    const y = randomRange(
      margin + height / 2,
      GAME_HEIGHT - margin - height / 2
    );

    // Skip if too close to spawn points
    if (isTooCloseToSpawn(x, y)) {
      continue;
    }

    // Select random material
    const material = selectRandomMaterial();
    const materialConfig = WALL_MATERIALS[material];

    const wall = EntityFactory.createWall(
      generateId("wall"),
      x,
      y,
      width,
      height,
      materialConfig.color,
      material,
      materialConfig.health
    );

    // Skip if overlaps with existing walls
    if (overlapsExisting(wall, existingWalls)) {
      continue;
    }

    return wall;
  }

  return null;
}

/**
 * Create the center wall (always present) - concrete for durability
 */
function createCenterWall(): Wall {
  const centerX = GAME_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2;
  const length = 200; // Fixed length for center wall

  // Center wall is always metal (most durable)
  const materialConfig = WALL_MATERIALS.metal;

  return EntityFactory.createWall(
    generateId("wall"),
    centerX,
    centerY,
    WALL_THICKNESS,
    length,
    materialConfig.color,
    "metal",
    materialConfig.health
  );
}

/**
 * Generate a set of random walls for the arena
 */
export function generateWalls(count: number = WALL_COUNT): Wall[] {
  const walls: Wall[] = [];

  // Always add center wall first
  walls.push(createCenterWall());

  // Generate remaining random walls (count - 1 since center wall is always there)
  for (let i = 0; i < count - 1; i++) {
    const wall = generateRandomWall(walls);
    if (wall) {
      walls.push(wall);
    }
  }

  return walls;
}

/**
 * Check if a point is inside a wall
 */
export function isPointInWall(x: number, y: number, wall: Wall): boolean {
  return (
    x >= wall.x - wall.width / 2 &&
    x <= wall.x + wall.width / 2 &&
    y >= wall.y - wall.height / 2 &&
    y <= wall.y + wall.height / 2
  );
}

/**
 * Check if a rectangle intersects with a wall
 */
export function rectangleIntersectsWall(
  rx: number,
  ry: number,
  rWidth: number,
  rHeight: number,
  wall: Wall
): boolean {
  return !(
    rx + rWidth / 2 < wall.x - wall.width / 2 ||
    rx - rWidth / 2 > wall.x + wall.width / 2 ||
    ry + rHeight / 2 < wall.y - wall.height / 2 ||
    ry - rHeight / 2 > wall.y + wall.height / 2
  );
}
