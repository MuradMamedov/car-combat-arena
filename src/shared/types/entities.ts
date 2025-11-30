import type {
  BoonType,
  GliderTier,
  WallMaterial,
  WeaponType,
} from "../constants/game.js";
import { getGliderTierConfig, BOOST_MAX_FUEL } from "../constants/game.js";
import type { Vector2 } from "./common.js";
import type { PlayerCustomization } from "./customization.js";
import {
  DEFAULT_CUSTOMIZATION,
  getColorPreset,
  getShapePreset,
  getGunEffectPreset,
  getBoosterEffectPreset,
} from "./customization.js";

/**
 * Represents the state of a car/glider/player in the game
 */
export interface CarState {
  readonly id: string;
  x: number;
  y: number;
  angle: number;
  velocityX: number;
  velocityY: number;
  health: number;
  readonly maxHealth: number;
  shield: number;
  readonly maxShield: number;
  shieldRechargeTimer: number;
  score: number;
  isBoosting: boolean;
  boostFuel: number;
  readonly maxBoostFuel: number;
  boostRechargeTimer: number;
  readonly color: string;
  readonly tier: GliderTier;
  readonly tierName: string;
  readonly maxSpeed: number;
  readonly boostSpeed: number;
  readonly acceleration: number;
  readonly turnSpeed: number;
  readonly bulletDamageMultiplier: number;
  readonly accentColor: string;
  readonly glowColor: string;
  readonly wingStyle: "basic" | "swept" | "delta" | "angular" | "plasma";
  // Player customization
  readonly customization: PlayerCustomization;
  // Resolved customization colors (computed from presets)
  readonly customColor: string;
  readonly customAccent: string;
  readonly customGlow: string;
  readonly gunEffectId: string;
  readonly boosterEffectId: string;
  // Display name for the player/bot
  readonly displayName: string;
}

/**
 * Represents a bullet projectile
 */
export interface Bullet {
  readonly id: string;
  readonly ownerId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  readonly angle: number;
  readonly damage: number;
  readonly weaponType: WeaponType;
  readonly size: number;
  // Custom gun effect from owner
  readonly gunEffectId?: string;
}

/**
 * Represents a visual particle effect
 */
export interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  readonly maxLife: number;
  readonly color: string;
  readonly size: number;
}

/**
 * Represents a wall obstacle in the arena
 */
export interface Wall {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly material: WallMaterial;
  health: number;
  readonly maxHealth: number;
}

/**
 * Represents a collectible boon/power-up
 */
export interface Boon {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly type: BoonType;
  readonly spawnTime: number;
  readonly lifetime: number;
}

/**
 * Factory functions for creating entities
 */
export const EntityFactory = {
  createCar(
    id: string,
    x: number,
    y: number,
    angle: number,
    tier: GliderTier = 3,
    customization: PlayerCustomization = DEFAULT_CUSTOMIZATION
  ): CarState {
    const tierConfig = getGliderTierConfig(tier);
    const colorPreset = getColorPreset(customization.colorPresetId);
    const shapePreset = getShapePreset(customization.shapePresetId);
    const gunPreset = getGunEffectPreset(customization.gunEffectPresetId);
    const boosterPreset = getBoosterEffectPreset(customization.boosterEffectPresetId);
    
    return {
      id,
      x,
      y,
      angle,
      velocityX: 0,
      velocityY: 0,
      health: tierConfig.maxHealth,
      maxHealth: tierConfig.maxHealth,
      shield: tierConfig.maxShield,
      maxShield: tierConfig.maxShield,
      shieldRechargeTimer: 0,
      score: 0,
      isBoosting: false,
      boostFuel: BOOST_MAX_FUEL,
      maxBoostFuel: BOOST_MAX_FUEL,
      boostRechargeTimer: 0,
      // Use customization colors instead of tier colors
      color: colorPreset.primary,
      tier,
      tierName: tierConfig.name,
      maxSpeed: tierConfig.maxSpeed,
      boostSpeed: tierConfig.boostSpeed,
      acceleration: tierConfig.acceleration,
      turnSpeed: tierConfig.turnSpeed,
      bulletDamageMultiplier: tierConfig.bulletDamageMultiplier,
      accentColor: colorPreset.accent,
      glowColor: colorPreset.glow,
      // Use customization shape instead of tier shape
      wingStyle: shapePreset.wingStyle,
      // Store full customization
      customization,
      customColor: colorPreset.primary,
      customAccent: colorPreset.accent,
      customGlow: colorPreset.glow,
      gunEffectId: gunPreset.id,
      boosterEffectId: boosterPreset.id,
      // Use display name from customization or default to "Player"
      displayName: customization.displayName || "Player",
    };
  },

  createBullet(
    id: string,
    ownerId: string,
    position: Vector2,
    velocity: Vector2,
    angle: number,
    damage: number,
    weaponType: WeaponType,
    size: number,
    gunEffectId?: string
  ): Bullet {
    return {
      id,
      ownerId,
      x: position.x,
      y: position.y,
      velocityX: velocity.x,
      velocityY: velocity.y,
      angle,
      damage,
      weaponType,
      size,
      gunEffectId,
    };
  },

  createParticle(
    position: Vector2,
    velocity: Vector2,
    life: number,
    color: string,
    size: number
  ): Particle {
    return {
      x: position.x,
      y: position.y,
      velocityX: velocity.x,
      velocityY: velocity.y,
      life,
      maxLife: life,
      color,
      size,
    };
  },

  createWall(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    material: WallMaterial,
    health: number
  ): Wall {
    return {
      id,
      x,
      y,
      width,
      height,
      color,
      material,
      health,
      maxHealth: health,
    };
  },

  createBoon(
    id: string,
    x: number,
    y: number,
    type: BoonType,
    lifetime: number
  ): Boon {
    return {
      id,
      x,
      y,
      type,
      spawnTime: Date.now(),
      lifetime,
    };
  },
};
