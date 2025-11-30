/**
 * Player customization options for glider visuals
 */

/**
 * Color preset for glider customization
 */
export interface ColorPreset {
  readonly id: string;
  readonly name: string;
  readonly primary: string;
  readonly accent: string;
  readonly glow: string;
}

/**
 * Available color presets
 */
export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "cyan",
    name: "Neon Cyan",
    primary: "#00fff2",
    accent: "#38bdf8",
    glow: "#7dd3fc",
  },
  {
    id: "magenta",
    name: "Hot Pink",
    primary: "#ff00aa",
    accent: "#f472b6",
    glow: "#f9a8d4",
  },
  {
    id: "orange",
    name: "Solar Flare",
    primary: "#ff6b00",
    accent: "#fb923c",
    glow: "#fdba74",
  },
  {
    id: "lime",
    name: "Toxic Green",
    primary: "#39ff14",
    accent: "#84cc16",
    glow: "#bef264",
  },
  {
    id: "purple",
    name: "Void Purple",
    primary: "#8b5cf6",
    accent: "#a78bfa",
    glow: "#c4b5fd",
  },
  {
    id: "gold",
    name: "Golden",
    primary: "#fbbf24",
    accent: "#fcd34d",
    glow: "#fef3c7",
  },
  {
    id: "crimson",
    name: "Blood Red",
    primary: "#dc2626",
    accent: "#f87171",
    glow: "#fca5a5",
  },
  {
    id: "ice",
    name: "Ice Blue",
    primary: "#06b6d4",
    accent: "#22d3ee",
    glow: "#67e8f9",
  },
  {
    id: "ember",
    name: "Ember",
    primary: "#f97316",
    accent: "#fb923c",
    glow: "#fed7aa",
  },
  {
    id: "ghost",
    name: "Ghost White",
    primary: "#e2e8f0",
    accent: "#f1f5f9",
    glow: "#ffffff",
  },
  {
    id: "shadow",
    name: "Shadow",
    primary: "#334155",
    accent: "#64748b",
    glow: "#94a3b8",
  },
  {
    id: "plasma",
    name: "Plasma Pink",
    primary: "#ec4899",
    accent: "#f472b6",
    glow: "#fbcfe8",
  },
];

/**
 * Shape preset for glider body
 */
export interface ShapePreset {
  readonly id: string;
  readonly name: string;
  readonly wingStyle: "basic" | "swept" | "delta" | "angular" | "plasma";
  readonly description: string;
}

/**
 * Available shape presets
 */
export const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: "basic",
    name: "Classic",
    wingStyle: "basic",
    description: "Simple straight wings",
  },
  {
    id: "swept",
    name: "Swept",
    wingStyle: "swept",
    description: "Swept-back aggressive design",
  },
  {
    id: "delta",
    name: "Delta",
    wingStyle: "delta",
    description: "Classic delta wing shape",
  },
  {
    id: "angular",
    name: "Stealth",
    wingStyle: "angular",
    description: "Sharp angular stealth design",
  },
  {
    id: "plasma",
    name: "Plasma",
    wingStyle: "plasma",
    description: "Futuristic curved energy wings",
  },
];

/**
 * Gun effect preset
 */
export interface GunEffectPreset {
  readonly id: string;
  readonly name: string;
  readonly bulletColor: string;
  readonly glowColor: string;
  readonly trailColor: string;
  readonly particleStyle: "standard" | "plasma" | "fire" | "electric" | "void";
}

/**
 * Available gun effect presets
 */
export const GUN_EFFECT_PRESETS: GunEffectPreset[] = [
  {
    id: "standard",
    name: "Standard",
    bulletColor: "#ff6b00",
    glowColor: "#ff00aa",
    trailColor: "#ffee00",
    particleStyle: "standard",
  },
  {
    id: "plasma",
    name: "Plasma",
    bulletColor: "#00fff2",
    glowColor: "#00ccff",
    trailColor: "#7dd3fc",
    particleStyle: "plasma",
  },
  {
    id: "fire",
    name: "Inferno",
    bulletColor: "#ff4500",
    glowColor: "#ff6b00",
    trailColor: "#fbbf24",
    particleStyle: "fire",
  },
  {
    id: "electric",
    name: "Lightning",
    bulletColor: "#a855f7",
    glowColor: "#8b5cf6",
    trailColor: "#c4b5fd",
    particleStyle: "electric",
  },
  {
    id: "void",
    name: "Void",
    bulletColor: "#1e1b4b",
    glowColor: "#4c1d95",
    trailColor: "#7c3aed",
    particleStyle: "void",
  },
  {
    id: "ice",
    name: "Cryo",
    bulletColor: "#22d3ee",
    glowColor: "#06b6d4",
    trailColor: "#67e8f9",
    particleStyle: "plasma",
  },
  {
    id: "toxic",
    name: "Toxic",
    bulletColor: "#22c55e",
    glowColor: "#16a34a",
    trailColor: "#86efac",
    particleStyle: "standard",
  },
  {
    id: "golden",
    name: "Golden",
    bulletColor: "#fbbf24",
    glowColor: "#f59e0b",
    trailColor: "#fef3c7",
    particleStyle: "fire",
  },
];

/**
 * Booster effect preset
 */
export interface BoosterEffectPreset {
  readonly id: string;
  readonly name: string;
  readonly coreColor: string;
  readonly outerColor: string;
  readonly particleColor: string;
  readonly style: "flame" | "plasma" | "electric" | "trail" | "pulse";
}

/**
 * Available booster effect presets
 */
export const BOOSTER_EFFECT_PRESETS: BoosterEffectPreset[] = [
  {
    id: "standard",
    name: "Standard",
    coreColor: "#00d4ff",
    outerColor: "#ff6b00",
    particleColor: "#ffee00",
    style: "flame",
  },
  {
    id: "plasma",
    name: "Plasma",
    coreColor: "#00fff2",
    outerColor: "#00ccff",
    particleColor: "#7dd3fc",
    style: "plasma",
  },
  {
    id: "inferno",
    name: "Inferno",
    coreColor: "#ffffff",
    outerColor: "#ff4500",
    particleColor: "#ff6b00",
    style: "flame",
  },
  {
    id: "electric",
    name: "Electric",
    coreColor: "#c4b5fd",
    outerColor: "#8b5cf6",
    particleColor: "#a855f7",
    style: "electric",
  },
  {
    id: "ghost",
    name: "Ghost",
    coreColor: "#ffffff",
    outerColor: "#94a3b8",
    particleColor: "#e2e8f0",
    style: "trail",
  },
  {
    id: "toxic",
    name: "Toxic",
    coreColor: "#86efac",
    outerColor: "#22c55e",
    particleColor: "#4ade80",
    style: "plasma",
  },
  {
    id: "pulse",
    name: "Pulse",
    coreColor: "#f472b6",
    outerColor: "#ec4899",
    particleColor: "#f9a8d4",
    style: "pulse",
  },
  {
    id: "void",
    name: "Void",
    coreColor: "#7c3aed",
    outerColor: "#4c1d95",
    particleColor: "#8b5cf6",
    style: "trail",
  },
];

/**
 * Complete player customization configuration
 */
export interface PlayerCustomization {
  colorPresetId: string;
  shapePresetId: string;
  gunEffectPresetId: string;
  boosterEffectPresetId: string;
  displayName?: string; // Optional display name (used for bots)
}

/**
 * Default customization for new players
 */
export const DEFAULT_CUSTOMIZATION: PlayerCustomization = {
  colorPresetId: "cyan",
  shapePresetId: "delta",
  gunEffectPresetId: "standard",
  boosterEffectPresetId: "standard",
};

/**
 * Get a color preset by ID
 */
export function getColorPreset(id: string): ColorPreset {
  return COLOR_PRESETS.find((p) => p.id === id) || COLOR_PRESETS[0];
}

/**
 * Get a shape preset by ID
 */
export function getShapePreset(id: string): ShapePreset {
  return SHAPE_PRESETS.find((p) => p.id === id) || SHAPE_PRESETS[2]; // Default to delta
}

/**
 * Get a gun effect preset by ID
 */
export function getGunEffectPreset(id: string): GunEffectPreset {
  return GUN_EFFECT_PRESETS.find((p) => p.id === id) || GUN_EFFECT_PRESETS[0];
}

/**
 * Get a booster effect preset by ID
 */
export function getBoosterEffectPreset(id: string): BoosterEffectPreset {
  return (
    BOOSTER_EFFECT_PRESETS.find((p) => p.id === id) || BOOSTER_EFFECT_PRESETS[0]
  );
}

/**
 * Resolved customization with actual values (not just IDs)
 */
export interface ResolvedCustomization {
  color: ColorPreset;
  shape: ShapePreset;
  gunEffect: GunEffectPreset;
  boosterEffect: BoosterEffectPreset;
}

/**
 * Resolve customization IDs to actual preset objects
 */
export function resolveCustomization(
  customization: PlayerCustomization
): ResolvedCustomization {
  return {
    color: getColorPreset(customization.colorPresetId),
    shape: getShapePreset(customization.shapePresetId),
    gunEffect: getGunEffectPreset(customization.gunEffectPresetId),
    boosterEffect: getBoosterEffectPreset(customization.boosterEffectPresetId),
  };
}
