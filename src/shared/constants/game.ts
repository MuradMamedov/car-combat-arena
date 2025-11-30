/**
 * Game dimension constants
 */
export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 800;

/**
 * Car physics constants
 */
export const CAR_WIDTH = 50;
export const CAR_HEIGHT = 30;
export const CAR_MAX_SPEED = 8;
export const CAR_BOOST_SPEED = 12;
export const CAR_ACCELERATION = 0.3;
export const CAR_FRICTION = 0.98;
export const CAR_TURN_SPEED = 0.06;

/**
 * Weapon type enumeration
 */
export type WeaponType = "cannon" | "machinegun";

/**
 * Cannon constants (slow, high damage shells)
 */
export const CANNON_BULLET_SPEED = 12;
export const CANNON_BULLET_DAMAGE = 35;
export const CANNON_BULLET_SIZE = 10;
export const CANNON_COOLDOWN = 1200; // milliseconds - slow reload

/**
 * Machine gun constants (rapid fire, low damage)
 */
export const MACHINEGUN_BULLET_SPEED = 18;
export const MACHINEGUN_BULLET_DAMAGE = 5;
export const MACHINEGUN_BULLET_SIZE = 3;
export const MACHINEGUN_COOLDOWN = 100; // milliseconds - rapid fire

/**
 * Legacy combat constants (deprecated, use weapon-specific)
 */
export const BULLET_SPEED = 15;
export const BULLET_DAMAGE = 10;
export const BULLET_SIZE = 5;
export const SHOOT_COOLDOWN = 200; // milliseconds

/**
 * Player constants
 */
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_SHIELD = 50;
export const SHIELD_RECHARGE_RATE = 5; // Shield points per second
export const SHIELD_RECHARGE_DELAY = 3000; // ms before shield starts recharging after damage
export const MAX_PLAYERS = 2;

/**
 * Scoring constants
 */
export const SCORE_PER_HIT = 10;
export const SCORE_PER_KILL = 100;

/**
 * Server constants
 */
export const SERVER_PORT = 8080;
export const TICK_RATE = 60;
export const TICK_INTERVAL = 1000 / TICK_RATE;

/**
 * Network optimization constants
 * Physics runs at TICK_RATE (60 Hz) but network updates at NETWORK_TICK_RATE (20 Hz)
 * This reduces server->client bandwidth by ~67% while maintaining smooth physics
 */
export const NETWORK_TICK_RATE = 20;
export const NETWORK_TICK_INTERVAL = 1000 / NETWORK_TICK_RATE;
export const TICKS_PER_NETWORK_UPDATE = Math.round(
  TICK_RATE / NETWORK_TICK_RATE
);

/**
 * Client input throttle (ms) - don't send inputs faster than this
 */
export const INPUT_THROTTLE_MS = 16; // ~60 Hz max for inputs

/**
 * Player spawn configurations
 */
export const PLAYER_SPAWN_POSITIONS = [
  { x: 150, y: GAME_HEIGHT / 2, angle: 0 },
  { x: GAME_WIDTH - 150, y: GAME_HEIGHT / 2, angle: Math.PI },
] as const;

/**
 * Player color configurations
 */
export const PLAYER_COLORS = ["#00fff2", "#ff00aa"] as const;

/**
 * Collision constants
 */
export const COLLISION_DAMAGE_THRESHOLD = 3;
export const COLLISION_DAMAGE_MULTIPLIER = 2;

/**
 * Wall constants
 */
export const WALL_THICKNESS = 20; // Fixed width/height for all walls
export const WALL_MIN_LENGTH = 80;
export const WALL_MAX_LENGTH = 180;
export const WALL_COUNT = 8;
export const WALL_SPAWN_MARGIN = 200; // Distance from spawn points to keep clear

/**
 * Wall material types
 */
export type WallMaterial = "concrete" | "wood" | "metal" | "glass";

/**
 * Wall material configurations
 */
export interface WallMaterialConfig {
  readonly health: number;
  readonly color: string;
  readonly damageResistance: number; // 0-1, reduces incoming damage
}

export const WALL_MATERIALS: Record<WallMaterial, WallMaterialConfig> = {
  concrete: {
    health: 200,
    color: "#6b7280", // Gray
    damageResistance: 0.3,
  },
  wood: {
    health: 80,
    color: "#92400e", // Brown
    damageResistance: 0,
  },
  metal: {
    health: 300,
    color: "#374151", // Dark steel
    damageResistance: 0.5,
  },
  glass: {
    health: 40,
    color: "#67e8f9", // Cyan/transparent blue
    damageResistance: 0,
  },
} as const;

/**
 * Material spawn weights (probability distribution)
 */
export const WALL_MATERIAL_WEIGHTS: Record<WallMaterial, number> = {
  concrete: 35,
  wood: 30,
  metal: 20,
  glass: 15,
} as const;

/**
 * Boon type enumeration
 */
export type BoonType = "health" | "shield" | "speed" | "damage" | "rapidfire";

/**
 * Boon constants
 */
export const BOON_SIZE = 25; // Visual size of boon
export const BOON_PICKUP_RADIUS = 35; // Collision radius for pickup
export const BOON_SPAWN_INTERVAL = 5000; // ms between spawn attempts
export const BOON_MAX_COUNT = 3; // Maximum boons on map at once
export const BOON_LIFETIME = 15000; // ms before boon despawns
export const BOON_SPAWN_MARGIN = 100; // Distance from walls/spawn points

/**
 * Boon effect configurations
 */
export interface BoonEffectConfig {
  readonly value: number; // Amount of effect (health restored, duration, etc.)
  readonly color: string; // Visual color
  readonly glowColor: string; // Glow effect color
  readonly icon: string; // Symbol to display
}

export const BOON_EFFECTS: Record<BoonType, BoonEffectConfig> = {
  health: {
    value: 40, // Restore 40 health
    color: "#22c55e", // Green
    glowColor: "#86efac",
    icon: "+",
  },
  shield: {
    value: 30, // Restore 30 shield
    color: "#3b82f6", // Blue
    glowColor: "#93c5fd",
    icon: "◊",
  },
  speed: {
    value: 5000, // 5 second speed boost
    color: "#eab308", // Yellow
    glowColor: "#fef08a",
    icon: "»",
  },
  damage: {
    value: 8000, // 8 second damage boost
    color: "#ef4444", // Red
    glowColor: "#fca5a5",
    icon: "★",
  },
  rapidfire: {
    value: 6000, // 6 second rapid fire
    color: "#a855f7", // Purple
    glowColor: "#d8b4fe",
    icon: "⚡",
  },
} as const;

/**
 * Boon spawn weights (probability distribution)
 */
export const BOON_SPAWN_WEIGHTS: Record<BoonType, number> = {
  health: 30,
  shield: 25,
  speed: 20,
  damage: 15,
  rapidfire: 10,
} as const;

/**
 * Glider tier enumeration (1-10, increasingly powerful)
 */
export type GliderTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Configuration for each glider tier
 */
export interface GliderTierConfig {
  readonly name: string;
  readonly maxHealth: number;
  readonly maxShield: number;
  readonly maxSpeed: number;
  readonly boostSpeed: number;
  readonly acceleration: number;
  readonly turnSpeed: number;
  readonly bulletDamageMultiplier: number;
  readonly primaryColor: string;
  readonly accentColor: string;
  readonly glowColor: string;
  readonly wingStyle: "basic" | "swept" | "delta" | "angular" | "plasma";
}

/**
 * All 10 glider tier configurations - progressively more powerful
 */
export const GLIDER_TIERS: Record<GliderTier, GliderTierConfig> = {
  1: {
    name: "Sparrow",
    maxHealth: 80,
    maxShield: 30,
    maxSpeed: 6,
    boostSpeed: 9,
    acceleration: 0.25,
    turnSpeed: 0.05,
    bulletDamageMultiplier: 0.8,
    primaryColor: "#78716c", // Stone gray
    accentColor: "#a8a29e",
    glowColor: "#d6d3d1",
    wingStyle: "basic",
  },
  2: {
    name: "Falcon",
    maxHealth: 90,
    maxShield: 40,
    maxSpeed: 7,
    boostSpeed: 10,
    acceleration: 0.27,
    turnSpeed: 0.055,
    bulletDamageMultiplier: 0.9,
    primaryColor: "#65a30d", // Lime green
    accentColor: "#84cc16",
    glowColor: "#bef264",
    wingStyle: "basic",
  },
  3: {
    name: "Hawk",
    maxHealth: 100,
    maxShield: 50,
    maxSpeed: 8,
    boostSpeed: 12,
    acceleration: 0.3,
    turnSpeed: 0.06,
    bulletDamageMultiplier: 1.0,
    primaryColor: "#0ea5e9", // Sky blue
    accentColor: "#38bdf8",
    glowColor: "#7dd3fc",
    wingStyle: "swept",
  },
  4: {
    name: "Eagle",
    maxHealth: 115,
    maxShield: 60,
    maxSpeed: 8.5,
    boostSpeed: 13,
    acceleration: 0.32,
    turnSpeed: 0.065,
    bulletDamageMultiplier: 1.1,
    primaryColor: "#8b5cf6", // Violet
    accentColor: "#a78bfa",
    glowColor: "#c4b5fd",
    wingStyle: "swept",
  },
  5: {
    name: "Raptor",
    maxHealth: 130,
    maxShield: 70,
    maxSpeed: 9,
    boostSpeed: 14,
    acceleration: 0.35,
    turnSpeed: 0.07,
    bulletDamageMultiplier: 1.2,
    primaryColor: "#f97316", // Orange
    accentColor: "#fb923c",
    glowColor: "#fdba74",
    wingStyle: "delta",
  },
  6: {
    name: "Phoenix",
    maxHealth: 150,
    maxShield: 80,
    maxSpeed: 9.5,
    boostSpeed: 15,
    acceleration: 0.37,
    turnSpeed: 0.075,
    bulletDamageMultiplier: 1.35,
    primaryColor: "#ef4444", // Red
    accentColor: "#f87171",
    glowColor: "#fca5a5",
    wingStyle: "delta",
  },
  7: {
    name: "Thunderbolt",
    maxHealth: 170,
    maxShield: 95,
    maxSpeed: 10,
    boostSpeed: 16,
    acceleration: 0.4,
    turnSpeed: 0.08,
    bulletDamageMultiplier: 1.5,
    primaryColor: "#eab308", // Yellow
    accentColor: "#facc15",
    glowColor: "#fef08a",
    wingStyle: "angular",
  },
  8: {
    name: "Stormrider",
    maxHealth: 190,
    maxShield: 110,
    maxSpeed: 10.5,
    boostSpeed: 17,
    acceleration: 0.43,
    turnSpeed: 0.085,
    bulletDamageMultiplier: 1.7,
    primaryColor: "#06b6d4", // Cyan
    accentColor: "#22d3ee",
    glowColor: "#67e8f9",
    wingStyle: "angular",
  },
  9: {
    name: "Voidwalker",
    maxHealth: 220,
    maxShield: 130,
    maxSpeed: 11,
    boostSpeed: 18,
    acceleration: 0.46,
    turnSpeed: 0.09,
    bulletDamageMultiplier: 1.9,
    primaryColor: "#ec4899", // Pink
    accentColor: "#f472b6",
    glowColor: "#f9a8d4",
    wingStyle: "plasma",
  },
  10: {
    name: "Celestial",
    maxHealth: 250,
    maxShield: 150,
    maxSpeed: 12,
    boostSpeed: 20,
    acceleration: 0.5,
    turnSpeed: 0.1,
    bulletDamageMultiplier: 2.0,
    primaryColor: "#fbbf24", // Gold/Amber
    accentColor: "#fcd34d",
    glowColor: "#fef3c7",
    wingStyle: "plasma",
  },
} as const;

/**
 * Get glider tier config by tier number
 */
export function getGliderTierConfig(tier: GliderTier): GliderTierConfig {
  return GLIDER_TIERS[tier];
}
