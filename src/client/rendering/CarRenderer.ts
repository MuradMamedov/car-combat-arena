import type { CarState, GliderTier } from "../../shared/index.js";
import {
  CANNON_COOLDOWN,
  CAR_HEIGHT,
  CAR_WIDTH,
  getBoosterEffectPreset,
} from "../../shared/index.js";
import { ParticleSystem } from "./ParticleSystem.js";
import type { ThemeColors } from "./ThemeManager.js";
import { ThemeManager } from "./ThemeManager.js";

// Glider dimensions (using CAR constants for physics compatibility)
const GLIDER_LENGTH = CAR_WIDTH; // 50 - nose to tail
const GLIDER_WINGSPAN = CAR_HEIGHT + 20; // 50 - wingtip to wingtip
const FUSELAGE_WIDTH = 10;

/**
 * Animation configuration for each tier
 */
interface TierAnimationConfig {
  enginePulseSpeed: number;
  enginePulseIntensity: number;
  hasWingShimmer: boolean;
  shimmerSpeed: number;
  hasEnergyLines: boolean;
  energyLineCount: number;
  hasElectricArcs: boolean;
  arcCount: number;
  hasPlasmaAura: boolean;
  auraIntensity: number;
  hasContrails: boolean;
  contrailOpacity: number;
  hasWingGlow: boolean;
  wingGlowPulse: boolean;
}

/**
 * Get animation configuration for a tier
 */
function getTierAnimationConfig(tier: GliderTier): TierAnimationConfig {
  const configs: Record<GliderTier, TierAnimationConfig> = {
    1: {
      enginePulseSpeed: 0.02,
      enginePulseIntensity: 0.2,
      hasWingShimmer: false,
      shimmerSpeed: 0,
      hasEnergyLines: false,
      energyLineCount: 0,
      hasElectricArcs: false,
      arcCount: 0,
      hasPlasmaAura: false,
      auraIntensity: 0,
      hasContrails: false,
      contrailOpacity: 0,
      hasWingGlow: false,
      wingGlowPulse: false,
    },
    2: {
      enginePulseSpeed: 0.025,
      enginePulseIntensity: 0.25,
      hasWingShimmer: true,
      shimmerSpeed: 0.01,
      hasEnergyLines: false,
      energyLineCount: 0,
      hasElectricArcs: false,
      arcCount: 0,
      hasPlasmaAura: false,
      auraIntensity: 0,
      hasContrails: false,
      contrailOpacity: 0,
      hasWingGlow: false,
      wingGlowPulse: false,
    },
    3: {
      enginePulseSpeed: 0.03,
      enginePulseIntensity: 0.3,
      hasWingShimmer: true,
      shimmerSpeed: 0.015,
      hasEnergyLines: false,
      energyLineCount: 0,
      hasElectricArcs: false,
      arcCount: 0,
      hasPlasmaAura: false,
      auraIntensity: 0,
      hasContrails: true,
      contrailOpacity: 0.15,
      hasWingGlow: true,
      wingGlowPulse: false,
    },
    4: {
      enginePulseSpeed: 0.035,
      enginePulseIntensity: 0.35,
      hasWingShimmer: true,
      shimmerSpeed: 0.02,
      hasEnergyLines: true,
      energyLineCount: 2,
      hasElectricArcs: false,
      arcCount: 0,
      hasPlasmaAura: false,
      auraIntensity: 0,
      hasContrails: true,
      contrailOpacity: 0.2,
      hasWingGlow: true,
      wingGlowPulse: false,
    },
    5: {
      enginePulseSpeed: 0.04,
      enginePulseIntensity: 0.4,
      hasWingShimmer: true,
      shimmerSpeed: 0.025,
      hasEnergyLines: true,
      energyLineCount: 3,
      hasElectricArcs: false,
      arcCount: 0,
      hasPlasmaAura: false,
      auraIntensity: 0,
      hasContrails: true,
      contrailOpacity: 0.25,
      hasWingGlow: true,
      wingGlowPulse: true,
    },
    6: {
      enginePulseSpeed: 0.045,
      enginePulseIntensity: 0.45,
      hasWingShimmer: true,
      shimmerSpeed: 0.03,
      hasEnergyLines: true,
      energyLineCount: 4,
      hasElectricArcs: true,
      arcCount: 2,
      hasPlasmaAura: false,
      auraIntensity: 0,
      hasContrails: true,
      contrailOpacity: 0.3,
      hasWingGlow: true,
      wingGlowPulse: true,
    },
    7: {
      enginePulseSpeed: 0.05,
      enginePulseIntensity: 0.5,
      hasWingShimmer: true,
      shimmerSpeed: 0.035,
      hasEnergyLines: true,
      energyLineCount: 4,
      hasElectricArcs: true,
      arcCount: 3,
      hasPlasmaAura: false,
      auraIntensity: 0.15,
      hasContrails: true,
      contrailOpacity: 0.35,
      hasWingGlow: true,
      wingGlowPulse: true,
    },
    8: {
      enginePulseSpeed: 0.055,
      enginePulseIntensity: 0.55,
      hasWingShimmer: true,
      shimmerSpeed: 0.04,
      hasEnergyLines: true,
      energyLineCount: 5,
      hasElectricArcs: true,
      arcCount: 4,
      hasPlasmaAura: true,
      auraIntensity: 0.2,
      hasContrails: true,
      contrailOpacity: 0.4,
      hasWingGlow: true,
      wingGlowPulse: true,
    },
    9: {
      enginePulseSpeed: 0.06,
      enginePulseIntensity: 0.6,
      hasWingShimmer: true,
      shimmerSpeed: 0.045,
      hasEnergyLines: true,
      energyLineCount: 6,
      hasElectricArcs: true,
      arcCount: 5,
      hasPlasmaAura: true,
      auraIntensity: 0.3,
      hasContrails: true,
      contrailOpacity: 0.5,
      hasWingGlow: true,
      wingGlowPulse: true,
    },
    10: {
      enginePulseSpeed: 0.07,
      enginePulseIntensity: 0.7,
      hasWingShimmer: true,
      shimmerSpeed: 0.05,
      hasEnergyLines: true,
      energyLineCount: 8,
      hasElectricArcs: true,
      arcCount: 6,
      hasPlasmaAura: true,
      auraIntensity: 0.4,
      hasContrails: true,
      contrailOpacity: 0.6,
      hasWingGlow: true,
      wingGlowPulse: true,
    },
  };
  return configs[tier];
}

/**
 * Damage flash effect state
 */
interface DamageFlash {
  type: "shield" | "health";
  startTime: number;
  duration: number;
  intensity: number;
}

/**
 * Gun reload animation state
 */
interface ReloadState {
  lastShotTime: number;
  isReloading: boolean;
}

/**
 * Renders gliders and their effects with theme-aware colors
 */
export class CarRenderer {
  private particleSystem: ParticleSystem;
  private themeColors: ThemeColors;

  // Track previous glider states to detect damage
  private previousStates: Map<string, { health: number; shield: number }> =
    new Map();

  // Active damage flash effects per glider
  private damageFlashes: Map<string, DamageFlash[]> = new Map();

  // Track reload state per glider for animation
  private reloadStates: Map<string, ReloadState> = new Map();

  // Animation time for global animations
  private animationTime: number = 0;

  constructor(particleSystem: ParticleSystem, themeColors: ThemeColors) {
    this.particleSystem = particleSystem;
    this.themeColors = themeColors;
  }

  /**
   * Update animation time - call this each frame
   */
  updateAnimations(): void {
    this.animationTime++;
  }

  /**
   * Update theme colors
   */
  setThemeColors(colors: ThemeColors): void {
    this.themeColors = colors;
  }

  /**
   * Update reload state when a shot is detected
   * Called from Renderer with bullet info
   */
  onCarShot(carId: string): void {
    this.reloadStates.set(carId, {
      lastShotTime: Date.now(),
      isReloading: true,
    });
  }

  /**
   * Get reload progress for a car (0 = just shot, 1 = fully reloaded)
   */
  private getReloadProgress(carId: string): number {
    const state = this.reloadStates.get(carId);
    if (!state || !state.isReloading) return 1;

    const elapsed = Date.now() - state.lastShotTime;
    const progress = Math.min(elapsed / CANNON_COOLDOWN, 1);

    if (progress >= 1) {
      state.isReloading = false;
    }

    return progress;
  }

  /**
   * Check for damage and trigger effects
   */
  private checkForDamage(car: CarState): void {
    const prevState = this.previousStates.get(car.id);

    if (prevState) {
      const shieldDamage = prevState.shield - car.shield;
      const healthDamage = prevState.health - car.health;

      // Shield took damage
      if (shieldDamage > 0) {
        const intensity = Math.min(shieldDamage / 20, 1.5);
        this.triggerShieldDamageEffect(car, intensity);

        // Shield just broke
        if (car.shield <= 0 && prevState.shield > 0) {
          this.particleSystem.addShieldBreakParticles(car.x, car.y);
        }
      }

      // Health took damage
      if (healthDamage > 0) {
        const intensity = Math.min(healthDamage / 15, 1.5);
        this.triggerHealthDamageEffect(car, intensity);
      }
    }

    // Store current state for next comparison
    this.previousStates.set(car.id, {
      health: car.health,
      shield: car.shield,
    });
  }

  /**
   * Trigger shield damage visual effect
   */
  private triggerShieldDamageEffect(car: CarState, intensity: number): void {
    // Add particles
    this.particleSystem.addShieldImpactParticles(car.x, car.y, intensity);

    // Add flash effect
    const flashes = this.damageFlashes.get(car.id) || [];
    flashes.push({
      type: "shield",
      startTime: Date.now(),
      duration: 200 + intensity * 100,
      intensity: Math.min(intensity, 1),
    });
    this.damageFlashes.set(car.id, flashes);
  }

  /**
   * Trigger health damage visual effect
   */
  private triggerHealthDamageEffect(car: CarState, intensity: number): void {
    // Add particles
    this.particleSystem.addCarDamageParticles(
      car.x,
      car.y,
      car.color,
      intensity
    );

    // Add flash effect
    const flashes = this.damageFlashes.get(car.id) || [];
    flashes.push({
      type: "health",
      startTime: Date.now(),
      duration: 250 + intensity * 150,
      intensity: Math.min(intensity, 1),
    });
    this.damageFlashes.set(car.id, flashes);
  }

  /**
   * Get active damage flash for a car
   */
  private getActiveFlash(carId: string): DamageFlash | null {
    const flashes = this.damageFlashes.get(carId);
    if (!flashes || flashes.length === 0) return null;

    const now = Date.now();

    // Clean up expired flashes and find the most recent active one
    const activeFlashes = flashes.filter((f) => now - f.startTime < f.duration);
    this.damageFlashes.set(carId, activeFlashes);

    if (activeFlashes.length === 0) return null;

    // Return the most intense active flash
    return activeFlashes.reduce((a, b) => (a.intensity > b.intensity ? a : b));
  }

  /**
   * Draw a glider
   */
  draw(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    isCurrentPlayer: boolean
  ): void {
    // Update animation time
    this.updateAnimations();

    // Check for damage and trigger effects
    this.checkForDamage(car);

    // Get active damage flash
    const activeFlash = this.getActiveFlash(car.id);

    // Get tier animation config
    const animConfig = getTierAnimationConfig(car.tier);

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Tier-specific aura (drawn behind everything) - for high tiers
    if (animConfig.hasPlasmaAura) {
      this.drawPlasmaAura(ctx, car, animConfig);
    }

    // Contrails (drawn behind glider)
    if (
      animConfig.hasContrails &&
      (car.isBoosting || Math.hypot(car.velocityX, car.velocityY) > 2)
    ) {
      this.drawContrails(ctx, car, animConfig);
    }

    // Boost effect (thermal/engine thrust)
    if (car.isBoosting) {
      this.drawBoostFlame(ctx, car);
      // Use custom booster effect if available
      if (car.boosterEffectId) {
        this.particleSystem.addCustomBoostParticles(
          car.x,
          car.y,
          car.angle,
          GLIDER_LENGTH,
          car.boosterEffectId
        );
      } else {
        this.particleSystem.addBoostParticles(
          car.x,
          car.y,
          car.angle,
          GLIDER_LENGTH
        );
      }
    }

    // Glider shadow
    this.drawShadow(ctx);

    // Glider body (fuselage and wings) - pass car for tier-specific rendering
    this.drawBody(ctx, car.color, car);

    // Tier-specific idle animations
    this.drawTierIdleAnimations(ctx, car, animConfig);

    // Damage flash overlay on glider body
    if (activeFlash && activeFlash.type === "health") {
      this.drawDamageFlash(ctx, activeFlash);
    }

    // Glider details
    this.drawCockpit(ctx);
    this.drawGunTurret(ctx, car.color, car.id);
    this.drawNavigationLights(ctx);
    this.drawTailLights(ctx);
    this.drawWingDetails(ctx, car.color);

    // Tier-specific wing effects (drawn on top of base details)
    if (animConfig.hasWingShimmer) {
      this.drawWingShimmer(ctx, car, animConfig);
    }
    if (animConfig.hasEnergyLines) {
      this.drawEnergyLines(ctx, car, animConfig);
    }
    if (animConfig.hasElectricArcs) {
      this.drawWingElectricArcs(ctx, car, animConfig);
    }
    if (animConfig.hasWingGlow) {
      this.drawPulsingWingGlow(ctx, car, animConfig);
    }

    // Shield effect (drawn in rotated space)
    if (car.shield > 0) {
      this.drawShieldEffect(ctx, car);
    }

    // Shield damage flash overlay
    if (activeFlash && activeFlash.type === "shield") {
      this.drawShieldDamageFlash(ctx, car, activeFlash);
    }

    ctx.restore();

    // Add ambient particles for high-tier gliders (in world space)
    if (car.tier >= 6 && Math.random() < 0.1 + car.tier * 0.02) {
      this.particleSystem.addGliderAmbientParticle(
        car.x,
        car.y,
        car.glowColor,
        car.tier
      );
    }

    // Health bar (drawn in world space)
    if (car.health < car.maxHealth || car.shield < car.maxShield) {
      this.drawHealthBar(ctx, car);
    }

    // Shield bar (drawn in world space)
    this.drawShieldBar(ctx, car);

    // Tier indicator (drawn in world space)
    this.drawTierIndicator(ctx, car);

    // "YOU" indicator
    if (isCurrentPlayer) {
      this.drawPlayerIndicator(ctx, car);
    }
  }

  /**
   * Draw tier-specific idle animations
   */
  private drawTierIdleAnimations(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    // Engine glow pulsing (all tiers, intensity varies)
    this.drawEngineGlow(ctx, car, config);
  }

  /**
   * Draw pulsing engine glow at the rear
   */
  private drawEngineGlow(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    const pulse =
      Math.sin(this.animationTime * config.enginePulseSpeed) * 0.5 + 0.5;
    const intensity = config.enginePulseIntensity * pulse;
    const glowColor = car.glowColor;

    const gradient = ctx.createRadialGradient(
      -GLIDER_LENGTH / 2,
      0,
      0,
      -GLIDER_LENGTH / 2,
      0,
      15 + intensity * 10
    );
    gradient.addColorStop(
      0,
      ThemeManager.withAlpha(glowColor, 0.8 * intensity)
    );
    gradient.addColorStop(
      0.4,
      ThemeManager.withAlpha(glowColor, 0.4 * intensity)
    );
    gradient.addColorStop(1, ThemeManager.withAlpha(glowColor, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(-GLIDER_LENGTH / 2, 0, 15 + intensity * 10, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw shimmering effect on wings
   */
  private drawWingShimmer(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    const shimmerPhase = (this.animationTime * config.shimmerSpeed) % 1;
    const shimmerPos =
      -GLIDER_LENGTH / 3 + shimmerPhase * (GLIDER_LENGTH * 0.6);
    const glowColor = car.glowColor;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Create shimmer line gradient
    const gradient = ctx.createLinearGradient(
      shimmerPos - 10,
      -GLIDER_WINGSPAN / 2,
      shimmerPos + 10,
      GLIDER_WINGSPAN / 2
    );
    gradient.addColorStop(0, ThemeManager.withAlpha(glowColor, 0));
    gradient.addColorStop(0.4, ThemeManager.withAlpha(glowColor, 0.15));
    gradient.addColorStop(0.5, ThemeManager.withAlpha("#ffffff", 0.2));
    gradient.addColorStop(0.6, ThemeManager.withAlpha(glowColor, 0.15));
    gradient.addColorStop(1, ThemeManager.withAlpha(glowColor, 0));

    // Draw shimmer band across wings
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(shimmerPos - 8, -GLIDER_WINGSPAN / 2.5);
    ctx.lineTo(shimmerPos + 8, -GLIDER_WINGSPAN / 2.5);
    ctx.lineTo(shimmerPos + 8, GLIDER_WINGSPAN / 2.5);
    ctx.lineTo(shimmerPos - 8, GLIDER_WINGSPAN / 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw flowing energy lines along wings
   */
  private drawEnergyLines(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    const glowColor = car.glowColor;
    const accentColor = car.accentColor;
    const lineCount = config.energyLineCount;
    const flowSpeed = 0.03;
    const flowPhase = (this.animationTime * flowSpeed) % 1;

    ctx.save();
    ctx.lineCap = "round";

    for (let i = 0; i < lineCount; i++) {
      const yOffset =
        ((i - (lineCount - 1) / 2) / lineCount) * GLIDER_WINGSPAN * 0.6;
      const isTop = yOffset < 0;
      const linePhase = (flowPhase + i * 0.15) % 1;

      // Pulsing alpha based on flow
      const alpha = 0.3 + Math.sin(linePhase * Math.PI * 2) * 0.4;

      ctx.strokeStyle = ThemeManager.withAlpha(
        i % 2 === 0 ? glowColor : accentColor,
        alpha
      );
      ctx.lineWidth = 1 + (car.tier > 7 ? 0.5 : 0);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 4 + car.tier;

      ctx.beginPath();

      // Create curved energy line
      const startX = GLIDER_LENGTH / 4;
      const endX = -GLIDER_LENGTH / 3;
      const midY = yOffset * (1.3 - linePhase * 0.3);

      ctx.moveTo(startX, yOffset * 0.3);
      ctx.quadraticCurveTo(
        0,
        midY,
        endX,
        isTop ? -GLIDER_WINGSPAN / 2.5 : GLIDER_WINGSPAN / 2.5
      );
      ctx.stroke();

      // Add flowing dot along line
      const dotPos = linePhase;
      const dotX = startX + (endX - startX) * dotPos;
      const dotY =
        yOffset * 0.3 + (midY - yOffset * 0.3) * Math.sin(dotPos * Math.PI);

      ctx.fillStyle = ThemeManager.withAlpha("#ffffff", alpha * 1.5);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Draw electric arcs on wing edges
   */
  private drawWingElectricArcs(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    const glowColor = car.glowColor;
    const arcCount = config.arcCount;

    ctx.save();
    ctx.strokeStyle = ThemeManager.withAlpha(glowColor, 0.7);
    ctx.lineWidth = 1;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;

    for (let i = 0; i < arcCount; i++) {
      // Random arc timing
      const arcPhase = ((this.animationTime + i * 37) % 60) / 60;
      if (arcPhase > 0.3) continue; // Only show arc part of the time

      const side = i % 2 === 0 ? -1 : 1;
      const wingPos = 0.3 + (i / arcCount) * 0.5;

      // Start position on wing edge
      const startX = GLIDER_LENGTH / 4 - wingPos * GLIDER_LENGTH * 0.7;
      const startY =
        side * (GLIDER_WINGSPAN / 3 + wingPos * GLIDER_WINGSPAN * 0.2);

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // Create jagged lightning path
      let x = startX;
      let y = startY;
      const segments = 3 + Math.floor(car.tier / 3);

      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        // Arc outward from wing
        x = startX + (Math.random() - 0.3) * 8;
        y = startY + side * t * 8 + (Math.random() - 0.5) * 4;
        ctx.lineTo(x, y);
      }

      ctx.stroke();

      // Bright tip
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Draw plasma aura around high-tier gliders
   */
  private drawPlasmaAura(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    const glowColor = car.glowColor;
    const intensity = config.auraIntensity;
    const pulsePhase = (this.animationTime * 0.02) % 1;
    const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.3 + 0.7;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Outer aura
    const auraSize = GLIDER_WINGSPAN * 0.8 * pulse;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, auraSize);
    gradient.addColorStop(
      0,
      ThemeManager.withAlpha(glowColor, intensity * 0.1)
    );
    gradient.addColorStop(
      0.5,
      ThemeManager.withAlpha(glowColor, intensity * 0.15 * pulse)
    );
    gradient.addColorStop(
      0.8,
      ThemeManager.withAlpha(car.accentColor, intensity * 0.1 * pulse)
    );
    gradient.addColorStop(1, ThemeManager.withAlpha(glowColor, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, auraSize * 1.3, auraSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotating energy rings for tier 9-10
    if (car.tier >= 9) {
      const ringCount = car.tier === 10 ? 3 : 2;
      for (let i = 0; i < ringCount; i++) {
        const ringPhase = (this.animationTime * 0.015 + i * 0.33) % 1;
        const ringAlpha = intensity * 0.4 * (1 - Math.abs(ringPhase - 0.5) * 2);
        const ringRadius =
          GLIDER_WINGSPAN * 0.5 + ringPhase * GLIDER_WINGSPAN * 0.3;

        ctx.strokeStyle = ThemeManager.withAlpha(glowColor, ringAlpha);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          ringRadius * 1.2,
          ringRadius * 0.8,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }

  /**
   * Draw wing tip contrails
   */
  private drawContrails(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    const opacity = config.contrailOpacity;
    const glowColor = car.glowColor;
    const trailLength = 25 + car.tier * 3;

    ctx.save();

    // Left wing tip contrail
    const leftGradient = ctx.createLinearGradient(
      -GLIDER_LENGTH / 3,
      -GLIDER_WINGSPAN / 2,
      -GLIDER_LENGTH / 3 - trailLength,
      -GLIDER_WINGSPAN / 2
    );
    leftGradient.addColorStop(0, ThemeManager.withAlpha(glowColor, opacity));
    leftGradient.addColorStop(
      0.3,
      ThemeManager.withAlpha(car.accentColor, opacity * 0.6)
    );
    leftGradient.addColorStop(1, ThemeManager.withAlpha(glowColor, 0));

    ctx.strokeStyle = leftGradient;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-GLIDER_LENGTH / 3, -GLIDER_WINGSPAN / 2 + 2);
    ctx.lineTo(-GLIDER_LENGTH / 3 - trailLength, -GLIDER_WINGSPAN / 2 + 4);
    ctx.stroke();

    // Right wing tip contrail
    const rightGradient = ctx.createLinearGradient(
      -GLIDER_LENGTH / 3,
      GLIDER_WINGSPAN / 2,
      -GLIDER_LENGTH / 3 - trailLength,
      GLIDER_WINGSPAN / 2
    );
    rightGradient.addColorStop(0, ThemeManager.withAlpha(glowColor, opacity));
    rightGradient.addColorStop(
      0.3,
      ThemeManager.withAlpha(car.accentColor, opacity * 0.6)
    );
    rightGradient.addColorStop(1, ThemeManager.withAlpha(glowColor, 0));

    ctx.strokeStyle = rightGradient;
    ctx.beginPath();
    ctx.moveTo(-GLIDER_LENGTH / 3, GLIDER_WINGSPAN / 2 - 2);
    ctx.lineTo(-GLIDER_LENGTH / 3 - trailLength, GLIDER_WINGSPAN / 2 - 4);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw pulsing glow along wing edges
   */
  private drawPulsingWingGlow(
    ctx: CanvasRenderingContext2D,
    car: CarState,
    config: TierAnimationConfig
  ): void {
    if (!config.wingGlowPulse) {
      // Static glow for lower tiers
      return;
    }

    const glowColor = car.glowColor;
    const pulsePhase = (this.animationTime * 0.025) % 1;
    const pulse = Math.sin(pulsePhase * Math.PI * 2) * 0.5 + 0.5;
    const alpha = 0.2 + pulse * 0.3;

    ctx.save();
    ctx.strokeStyle = ThemeManager.withAlpha(glowColor, alpha);
    ctx.lineWidth = 2 + pulse;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8 + pulse * 8;
    ctx.lineCap = "round";

    // Glow along wing leading edges
    ctx.beginPath();
    // Left wing leading edge
    ctx.moveTo(GLIDER_LENGTH / 2 - 5, -2);
    ctx.lineTo(-GLIDER_LENGTH / 4, -GLIDER_WINGSPAN / 2.2);
    ctx.stroke();

    ctx.beginPath();
    // Right wing leading edge
    ctx.moveTo(GLIDER_LENGTH / 2 - 5, 2);
    ctx.lineTo(-GLIDER_LENGTH / 4, GLIDER_WINGSPAN / 2.2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Draw damage flash overlay on glider body
   */
  private drawDamageFlash(
    ctx: CanvasRenderingContext2D,
    flash: DamageFlash
  ): void {
    const elapsed = Date.now() - flash.startTime;
    const progress = elapsed / flash.duration;

    // Flicker effect - rapid on/off with decay
    const flickerPhase = Math.sin(elapsed * 0.05) * 0.5 + 0.5;
    const decay = 1 - progress;
    const alpha = flash.intensity * decay * flickerPhase * 0.7;

    if (alpha > 0.05) {
      // Red/orange damage glow covering wing shape - use theme highlight
      const gradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        GLIDER_WINGSPAN * 0.6
      );
      gradient.addColorStop(
        0,
        ThemeManager.withAlpha(this.themeColors.highlight, alpha)
      );
      gradient.addColorStop(
        0.5,
        ThemeManager.withAlpha(this.themeColors.secondaryAccent, alpha * 0.6)
      );
      gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(GLIDER_LENGTH / 2 + 5, 0);
      ctx.lineTo(-GLIDER_LENGTH / 3, -GLIDER_WINGSPAN / 2 - 5);
      ctx.lineTo(-GLIDER_LENGTH / 2 - 5, 0);
      ctx.lineTo(-GLIDER_LENGTH / 3, GLIDER_WINGSPAN / 2 + 5);
      ctx.closePath();
      ctx.fill();

      // White core flash at start
      if (progress < 0.2) {
        const coreAlpha = (1 - progress / 0.2) * flash.intensity * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
        ctx.beginPath();
        ctx.moveTo(GLIDER_LENGTH / 2, 0);
        ctx.lineTo(-GLIDER_LENGTH / 3, -GLIDER_WINGSPAN / 2);
        ctx.lineTo(-GLIDER_LENGTH / 2, 0);
        ctx.lineTo(-GLIDER_LENGTH / 3, GLIDER_WINGSPAN / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  /**
   * Draw shield damage flash effect
   */
  private drawShieldDamageFlash(
    ctx: CanvasRenderingContext2D,
    _car: CarState,
    flash: DamageFlash
  ): void {
    const elapsed = Date.now() - flash.startTime;
    const progress = elapsed / flash.duration;
    const shieldRadius = GLIDER_WINGSPAN * 0.6;

    // Ripple expanding outward
    const rippleProgress = Math.min(progress * 2, 1);
    const rippleRadius = shieldRadius * (0.5 + rippleProgress * 0.6);
    const rippleAlpha = (1 - rippleProgress) * flash.intensity * 0.8;

    if (rippleAlpha > 0.05) {
      // Electric ripple ring - use theme shield color
      ctx.strokeStyle = ThemeManager.withAlpha(
        this.themeColors.shieldColor,
        rippleAlpha
      );
      ctx.lineWidth = 3 + (1 - rippleProgress) * 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rippleRadius, rippleRadius * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow burst
      const burstAlpha = (1 - progress) * flash.intensity * 0.4;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shieldRadius);
      gradient.addColorStop(
        0,
        ThemeManager.withAlpha(
          ThemeManager.lighten(this.themeColors.shieldColor, 1.5),
          burstAlpha
        )
      );
      gradient.addColorStop(
        0.4,
        ThemeManager.withAlpha(this.themeColors.shieldColor, burstAlpha * 0.5)
      );
      gradient.addColorStop(
        1,
        ThemeManager.withAlpha(this.themeColors.shieldColor, 0)
      );

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, shieldRadius, shieldRadius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Electric arc effect
    if (progress < 0.5) {
      const arcAlpha = (1 - progress * 2) * flash.intensity;
      this.drawElectricArcs(ctx, shieldRadius * 0.8, arcAlpha);
    }
  }

  /**
   * Draw electric arc effects on shield
   */
  private drawElectricArcs(
    ctx: CanvasRenderingContext2D,
    radius: number,
    alpha: number
  ): void {
    if (alpha < 0.1) return;

    ctx.strokeStyle = ThemeManager.withAlpha(
      ThemeManager.lighten(this.themeColors.shieldColor, 1.5),
      alpha
    );
    ctx.lineWidth = 2;

    const arcCount = 4;
    const time = Date.now();

    for (let i = 0; i < arcCount; i++) {
      const baseAngle = (Math.PI * 2 * i) / arcCount + time * 0.003;
      const startX = Math.cos(baseAngle) * radius * 0.3;
      const startY = Math.sin(baseAngle) * radius * 0.3 * 0.7;

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // Jagged lightning path
      let x = startX;
      let y = startY;
      const segments = 4;

      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const endX = Math.cos(baseAngle) * radius * t;
        const endY = Math.sin(baseAngle) * radius * t * 0.7;

        // Add jitter
        const jitter = (1 - t) * 8;
        x = endX + (Math.random() - 0.5) * jitter;
        y = endY + (Math.random() - 0.5) * jitter;

        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }
  }

  /**
   * Draw shield energy effect around glider
   */
  private drawShieldEffect(ctx: CanvasRenderingContext2D, car: CarState): void {
    const shieldPercent = car.shield / car.maxShield;
    const shieldAlpha = 0.15 + shieldPercent * 0.25;
    const shieldRadius = GLIDER_WINGSPAN * 0.6;

    // Outer glow (elongated to match glider shape) - use theme shield color
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shieldRadius);
    gradient.addColorStop(
      0,
      ThemeManager.withAlpha(this.themeColors.shieldColor, 0)
    );
    gradient.addColorStop(
      0.6,
      ThemeManager.withAlpha(this.themeColors.shieldColor, shieldAlpha * 0.3)
    );
    gradient.addColorStop(
      0.85,
      ThemeManager.withAlpha(this.themeColors.shieldColor, shieldAlpha * 0.6)
    );
    gradient.addColorStop(
      1,
      ThemeManager.withAlpha(
        ThemeManager.lighten(this.themeColors.shieldColor, 1.3),
        shieldAlpha
      )
    );

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, shieldRadius * 1.2, shieldRadius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hexagon pattern overlay
    ctx.strokeStyle = ThemeManager.withAlpha(
      this.themeColors.shieldColor,
      shieldAlpha * 0.8
    );
    ctx.lineWidth = 1;
    this.drawHexagonRing(ctx, shieldRadius * 0.85);

    // Pulsing edge
    const pulsePhase = (Date.now() % 1000) / 1000;
    const pulseAlpha =
      shieldAlpha * (0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2));
    ctx.strokeStyle = ThemeManager.withAlpha(
      ThemeManager.lighten(this.themeColors.shieldColor, 1.5),
      pulseAlpha
    );
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, shieldRadius * 1.2, shieldRadius, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Draw hexagon pattern for shield
   */
  private drawHexagonRing(ctx: CanvasRenderingContext2D, radius: number): void {
    const sides = 6;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  /**
   * Draw shield bar below health bar
   */
  private drawShieldBar(ctx: CanvasRenderingContext2D, car: CarState): void {
    const barWidth = GLIDER_LENGTH + 10;
    const barHeight = 4;
    const x = car.x - barWidth / 2;
    const healthBarOffset = car.health < car.maxHealth ? 8 : 0;
    const y = car.y - GLIDER_WINGSPAN / 2 - 15 + healthBarOffset;
    const shieldPercent = Math.max(0, car.shield / car.maxShield);

    // Only draw if shield is not full (similar to health bar behavior)
    if (car.shield >= car.maxShield) return;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Shield amount - use theme shield color
    const shieldGradient = ctx.createLinearGradient(
      x,
      y,
      x + barWidth * shieldPercent,
      y
    );
    shieldGradient.addColorStop(0, this.themeColors.shieldColor);
    shieldGradient.addColorStop(
      1,
      ThemeManager.lighten(this.themeColors.shieldColor, 1.2)
    );
    ctx.fillStyle = shieldGradient;
    ctx.fillRect(x, y, barWidth * shieldPercent, barHeight);

    // Border - use theme shield color darkened
    ctx.strokeStyle = ThemeManager.darken(this.themeColors.shieldColor, 0.7);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  /**
   * Draw glider shadow
   */
  private drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

    // Wing shadow
    ctx.beginPath();
    ctx.moveTo(GLIDER_LENGTH / 2 + 3, 3); // nose
    ctx.lineTo(-GLIDER_LENGTH / 3 + 3, -GLIDER_WINGSPAN / 2 + 3); // left wingtip
    ctx.lineTo(-GLIDER_LENGTH / 2 + 3, 3); // tail
    ctx.lineTo(-GLIDER_LENGTH / 3 + 3, GLIDER_WINGSPAN / 2 + 3); // right wingtip
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw glider body based on wing style
   */
  private drawBody(
    ctx: CanvasRenderingContext2D,
    color: string,
    car?: CarState
  ): void {
    const wingStyle = car?.wingStyle || "basic";
    const accentColor = car?.accentColor || color;
    const glowColor = car?.glowColor || this.lightenColor(color, 1.3);

    // Main wing gradient
    const wingGradient = ctx.createLinearGradient(
      0,
      -GLIDER_WINGSPAN / 2,
      0,
      GLIDER_WINGSPAN / 2
    );
    wingGradient.addColorStop(0, this.darkenColor(color, 0.6));
    wingGradient.addColorStop(0.4, color);
    wingGradient.addColorStop(0.6, color);
    wingGradient.addColorStop(1, this.darkenColor(color, 0.6));

    ctx.fillStyle = wingGradient;

    // Draw wing shape based on style
    this.drawWingShape(ctx, wingStyle);

    // Wing outline glow - enhanced for higher tiers
    const glowIntensity = car ? 8 + car.tier * 2 : 12;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowIntensity;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = wingStyle === "plasma" ? 2.5 : 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fuselage body (on top of wings)
    const fuselageGradient = ctx.createLinearGradient(
      0,
      -FUSELAGE_WIDTH / 2,
      0,
      FUSELAGE_WIDTH / 2
    );
    fuselageGradient.addColorStop(0, this.darkenColor(color, 0.7));
    fuselageGradient.addColorStop(0.3, this.lightenColor(color, 1.2));
    fuselageGradient.addColorStop(0.7, color);
    fuselageGradient.addColorStop(1, this.darkenColor(color, 0.5));

    ctx.fillStyle = fuselageGradient;
    ctx.beginPath();
    ctx.moveTo(GLIDER_LENGTH / 2 + 5, 0); // nose point
    ctx.quadraticCurveTo(
      GLIDER_LENGTH / 4,
      -FUSELAGE_WIDTH / 2,
      -GLIDER_LENGTH / 2 + 8,
      -FUSELAGE_WIDTH / 2 + 2
    );
    ctx.lineTo(-GLIDER_LENGTH / 2, 0); // tail
    ctx.lineTo(-GLIDER_LENGTH / 2 + 8, FUSELAGE_WIDTH / 2 - 2);
    ctx.quadraticCurveTo(
      GLIDER_LENGTH / 4,
      FUSELAGE_WIDTH / 2,
      GLIDER_LENGTH / 2 + 5,
      0
    );
    ctx.closePath();
    ctx.fill();

    // Fuselage highlight line
    ctx.strokeStyle = this.lightenColor(color, 1.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GLIDER_LENGTH / 2 + 3, 0);
    ctx.lineTo(-GLIDER_LENGTH / 3, 0);
    ctx.stroke();

    // Draw tier-specific details
    if (car && car.tier >= 5) {
      this.drawAdvancedWingDetails(ctx, car);
    }
  }

  /**
   * Draw wing shape based on style
   */
  private drawWingShape(
    ctx: CanvasRenderingContext2D,
    wingStyle: string
  ): void {
    ctx.beginPath();

    switch (wingStyle) {
      case "basic":
        // Simple straight wings
        ctx.moveTo(GLIDER_LENGTH / 2, 0); // nose
        ctx.lineTo(-GLIDER_LENGTH / 4, -GLIDER_WINGSPAN / 2.2); // left wingtip
        ctx.lineTo(-GLIDER_LENGTH / 2, -GLIDER_WINGSPAN / 4); // left tail
        ctx.lineTo(-GLIDER_LENGTH / 2, GLIDER_WINGSPAN / 4); // right tail
        ctx.lineTo(-GLIDER_LENGTH / 4, GLIDER_WINGSPAN / 2.2); // right wingtip
        break;

      case "swept":
        // Swept-back wings (more aggressive)
        ctx.moveTo(GLIDER_LENGTH / 2, 0); // nose
        ctx.lineTo(GLIDER_LENGTH / 6, -GLIDER_WINGSPAN / 2.5); // left wing forward
        ctx.lineTo(-GLIDER_LENGTH / 2.5, -GLIDER_WINGSPAN / 2); // left wingtip
        ctx.lineTo(-GLIDER_LENGTH / 2, 0); // tail
        ctx.lineTo(-GLIDER_LENGTH / 2.5, GLIDER_WINGSPAN / 2); // right wingtip
        ctx.lineTo(GLIDER_LENGTH / 6, GLIDER_WINGSPAN / 2.5); // right wing forward
        break;

      case "delta":
        // Classic delta wings
        ctx.moveTo(GLIDER_LENGTH / 2, 0); // nose
        ctx.lineTo(-GLIDER_LENGTH / 3, -GLIDER_WINGSPAN / 2); // left wingtip
        ctx.lineTo(-GLIDER_LENGTH / 2, 0); // tail center
        ctx.lineTo(-GLIDER_LENGTH / 3, GLIDER_WINGSPAN / 2); // right wingtip
        break;

      case "angular":
        // Sharp angular design
        ctx.moveTo(GLIDER_LENGTH / 2 + 5, 0); // extended nose
        ctx.lineTo(GLIDER_LENGTH / 4, -6); // nose corner top
        ctx.lineTo(0, -GLIDER_WINGSPAN / 2.3); // wing joint top
        ctx.lineTo(-GLIDER_LENGTH / 3, -GLIDER_WINGSPAN / 2 - 3); // left wingtip extended
        ctx.lineTo(-GLIDER_LENGTH / 2, -GLIDER_WINGSPAN / 4); // left tail corner
        ctx.lineTo(-GLIDER_LENGTH / 2 - 3, 0); // tail point
        ctx.lineTo(-GLIDER_LENGTH / 2, GLIDER_WINGSPAN / 4); // right tail corner
        ctx.lineTo(-GLIDER_LENGTH / 3, GLIDER_WINGSPAN / 2 + 3); // right wingtip extended
        ctx.lineTo(0, GLIDER_WINGSPAN / 2.3); // wing joint bottom
        ctx.lineTo(GLIDER_LENGTH / 4, 6); // nose corner bottom
        break;

      case "plasma":
        // Futuristic energy wings with curved edges
        ctx.moveTo(GLIDER_LENGTH / 2 + 8, 0); // sharp nose
        // Left wing with curve
        ctx.quadraticCurveTo(
          GLIDER_LENGTH / 4,
          -GLIDER_WINGSPAN / 4,
          -GLIDER_LENGTH / 4,
          -GLIDER_WINGSPAN / 2 - 5
        );
        ctx.quadraticCurveTo(
          -GLIDER_LENGTH / 3 - 5,
          -GLIDER_WINGSPAN / 3,
          -GLIDER_LENGTH / 2 - 5,
          0
        );
        // Right wing with curve (mirror)
        ctx.quadraticCurveTo(
          -GLIDER_LENGTH / 3 - 5,
          GLIDER_WINGSPAN / 3,
          -GLIDER_LENGTH / 4,
          GLIDER_WINGSPAN / 2 + 5
        );
        ctx.quadraticCurveTo(
          GLIDER_LENGTH / 4,
          GLIDER_WINGSPAN / 4,
          GLIDER_LENGTH / 2 + 8,
          0
        );
        break;

      default:
        // Default delta
        ctx.moveTo(GLIDER_LENGTH / 2, 0);
        ctx.lineTo(-GLIDER_LENGTH / 3, -GLIDER_WINGSPAN / 2);
        ctx.lineTo(-GLIDER_LENGTH / 2, 0);
        ctx.lineTo(-GLIDER_LENGTH / 3, GLIDER_WINGSPAN / 2);
    }

    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw advanced wing details for high-tier gliders
   */
  private drawAdvancedWingDetails(
    ctx: CanvasRenderingContext2D,
    car: CarState
  ): void {
    const tier = car.tier;
    const glowColor = car.glowColor;

    // Energy lines along wings (tiers 5+)
    if (tier >= 5) {
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;

      // Left wing energy line
      ctx.beginPath();
      ctx.moveTo(GLIDER_LENGTH / 6, -3);
      ctx.lineTo(-GLIDER_LENGTH / 4, -GLIDER_WINGSPAN / 3);
      ctx.stroke();

      // Right wing energy line
      ctx.beginPath();
      ctx.moveTo(GLIDER_LENGTH / 6, 3);
      ctx.lineTo(-GLIDER_LENGTH / 4, GLIDER_WINGSPAN / 3);
      ctx.stroke();
    }

    // Wing tip energy orbs (tiers 7+)
    if (tier >= 7) {
      const pulsePhase = (Date.now() % 1500) / 1500;
      const pulseSize = 2 + Math.sin(pulsePhase * Math.PI * 2) * 0.5;
      const pulseAlpha = 0.6 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;

      ctx.fillStyle = ThemeManager.withAlpha(glowColor, pulseAlpha);
      ctx.shadowBlur = 10;

      // Left wingtip orb
      ctx.beginPath();
      ctx.arc(
        -GLIDER_LENGTH / 3.5,
        -GLIDER_WINGSPAN / 2.5,
        pulseSize,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Right wingtip orb
      ctx.beginPath();
      ctx.arc(
        -GLIDER_LENGTH / 3.5,
        GLIDER_WINGSPAN / 2.5,
        pulseSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Central energy core (tiers 9+)
    if (tier >= 9) {
      const corePhase = (Date.now() % 2000) / 2000;
      const coreSize = 4 + Math.sin(corePhase * Math.PI * 2) * 1;

      const coreGradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        coreSize * 2
      );
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      coreGradient.addColorStop(0.3, ThemeManager.withAlpha(glowColor, 0.7));
      coreGradient.addColorStop(1, ThemeManager.withAlpha(glowColor, 0));

      ctx.fillStyle = coreGradient;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, coreSize * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  /**
   * Draw cockpit canopy
   */
  private drawCockpit(ctx: CanvasRenderingContext2D): void {
    // Canopy glass - use theme primary accent tint
    const canopyGradient = ctx.createLinearGradient(
      GLIDER_LENGTH / 4,
      -4,
      GLIDER_LENGTH / 4,
      4
    );
    canopyGradient.addColorStop(
      0,
      ThemeManager.withAlpha(this.themeColors.primaryAccent, 0.6)
    );
    canopyGradient.addColorStop(
      0.5,
      ThemeManager.withAlpha(
        ThemeManager.lighten(this.themeColors.primaryAccent, 1.3),
        0.5
      )
    );
    canopyGradient.addColorStop(
      1,
      ThemeManager.withAlpha(
        ThemeManager.darken(this.themeColors.primaryAccent, 0.8),
        0.5
      )
    );

    ctx.fillStyle = canopyGradient;
    ctx.beginPath();
    ctx.ellipse(GLIDER_LENGTH / 6, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy frame
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Canopy reflection highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.ellipse(GLIDER_LENGTH / 6 + 2, -2, 4, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw nose-mounted gun with reload animation
   */
  private drawGunTurret(
    ctx: CanvasRenderingContext2D,
    color: string,
    gliderId: string
  ): void {
    const reloadProgress = this.getReloadProgress(gliderId);

    // Calculate recoil offset
    const recoilPhase = 1 - reloadProgress;
    const recoilOffset =
      recoilPhase < 0.15
        ? -6 * (recoilPhase / 0.15)
        : -6 * (1 - (recoilPhase - 0.15) / 0.85) * (recoilPhase > 0.15 ? 1 : 0);

    const actualRecoil = reloadProgress < 1 ? recoilOffset : 0;

    // Gun barrel (nose-mounted cannon)
    const barrelGradient = ctx.createLinearGradient(
      GLIDER_LENGTH / 2 + actualRecoil,
      -1.5,
      GLIDER_LENGTH / 2 + 12 + actualRecoil,
      1.5
    );

    if (reloadProgress < 1) {
      const heatIntensity = Math.pow(1 - reloadProgress, 2);
      barrelGradient.addColorStop(
        0,
        this.lerpColor(
          "#444444",
          this.themeColors.highlight,
          heatIntensity * 0.6
        )
      );
      barrelGradient.addColorStop(
        0.5,
        this.lerpColor(
          "#555555",
          this.themeColors.highlight,
          heatIntensity * 0.4
        )
      );
      barrelGradient.addColorStop(1, "#333333");
    } else {
      barrelGradient.addColorStop(0, "#555555");
      barrelGradient.addColorStop(1, "#333333");
    }

    ctx.fillStyle = barrelGradient;
    ctx.fillRect(GLIDER_LENGTH / 2 + 3 + actualRecoil, -1.5, 10, 3);

    // Barrel tip
    ctx.fillStyle =
      reloadProgress >= 1
        ? "#888888"
        : this.lerpColor(
            "#888888",
            this.themeColors.highlight,
            1 - reloadProgress
          );
    ctx.fillRect(GLIDER_LENGTH / 2 + 11 + actualRecoil, -1, 2, 2);

    // Reload indicator at nose - use theme highlight
    if (reloadProgress < 1) {
      const pulsePhase = (Date.now() % 200) / 200;
      const pulseAlpha = 0.3 + 0.2 * Math.sin(pulsePhase * Math.PI * 2);
      const glowRadius = 6 + (1 - reloadProgress) * 3;

      const reloadGlow = ctx.createRadialGradient(
        GLIDER_LENGTH / 2 + 6,
        0,
        0,
        GLIDER_LENGTH / 2 + 6,
        0,
        glowRadius
      );
      reloadGlow.addColorStop(
        0,
        ThemeManager.withAlpha(
          this.themeColors.highlight,
          pulseAlpha * (1 - reloadProgress)
        )
      );
      reloadGlow.addColorStop(
        0.5,
        ThemeManager.withAlpha(
          this.themeColors.highlight,
          pulseAlpha * 0.5 * (1 - reloadProgress)
        )
      );
      reloadGlow.addColorStop(
        1,
        ThemeManager.withAlpha(this.themeColors.highlight, 0)
      );

      ctx.fillStyle = reloadGlow;
      ctx.beginPath();
      ctx.arc(GLIDER_LENGTH / 2 + 6, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Reload arc - use theme primary accent
      ctx.strokeStyle = ThemeManager.withAlpha(
        this.themeColors.primaryAccent,
        0.6 + 0.4 * reloadProgress
      );
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(
        GLIDER_LENGTH / 2 + 6,
        0,
        5,
        -Math.PI / 2,
        -Math.PI / 2 + reloadProgress * Math.PI * 2
      );
      ctx.stroke();
    }

    // Ready indicator - use theme primary accent
    if (reloadProgress >= 1) {
      const readyPulse = (Date.now() % 1000) / 1000;
      const readyAlpha = 0.3 + 0.2 * Math.sin(readyPulse * Math.PI * 2);

      ctx.shadowColor = color;
      ctx.shadowBlur = 5;
      ctx.fillStyle = ThemeManager.withAlpha(
        this.themeColors.primaryAccent,
        readyAlpha
      );
      ctx.beginPath();
      ctx.arc(GLIDER_LENGTH / 2 + 6, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Linearly interpolate between two hex colors
   */
  private lerpColor(color1: string, color2: string, t: number): string {
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");

    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);

    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Draw wingtip navigation lights - use theme colors
   */
  private drawNavigationLights(ctx: CanvasRenderingContext2D): void {
    const wingTipX = -GLIDER_LENGTH / 3;
    const wingTipY = GLIDER_WINGSPAN / 2;

    // Right wingtip - use theme primary accent
    ctx.fillStyle = this.themeColors.primaryAccent;
    ctx.shadowColor = this.themeColors.primaryAccent;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(wingTipX, wingTipY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Left wingtip - use theme secondary accent
    ctx.fillStyle = this.themeColors.secondaryAccent;
    ctx.shadowColor = this.themeColors.secondaryAccent;
    ctx.beginPath();
    ctx.arc(wingTipX, -wingTipY + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  /**
   * Draw tail lights
   */
  private drawTailLights(ctx: CanvasRenderingContext2D): void {
    // White tail strobe
    const strobePhase = (Date.now() % 1500) / 1500;
    const strobeOn = strobePhase < 0.1;

    if (strobeOn) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(-GLIDER_LENGTH / 2, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  /**
   * Draw wing panel lines and details
   */
  private drawWingDetails(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.strokeStyle = this.darkenColor(color, 0.4);
    ctx.lineWidth = 0.5;

    // Wing panel lines
    ctx.beginPath();
    // Left wing panel
    ctx.moveTo(GLIDER_LENGTH / 4, -2);
    ctx.lineTo(-GLIDER_LENGTH / 4, -GLIDER_WINGSPAN / 3);
    // Right wing panel
    ctx.moveTo(GLIDER_LENGTH / 4, 2);
    ctx.lineTo(-GLIDER_LENGTH / 4, GLIDER_WINGSPAN / 3);
    ctx.stroke();

    // Aileron lines at wing trailing edges
    ctx.strokeStyle = this.darkenColor(color, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Left aileron
    ctx.moveTo(-GLIDER_LENGTH / 3.5, -GLIDER_WINGSPAN / 2.5);
    ctx.lineTo(-GLIDER_LENGTH / 2.5, -GLIDER_WINGSPAN / 4);
    // Right aileron
    ctx.moveTo(-GLIDER_LENGTH / 3.5, GLIDER_WINGSPAN / 2.5);
    ctx.lineTo(-GLIDER_LENGTH / 2.5, GLIDER_WINGSPAN / 4);
    ctx.stroke();
  }

  /**
   * Draw boost thrust effect (jet engine afterburner style) - uses custom booster colors
   */
  private drawBoostFlame(ctx: CanvasRenderingContext2D, car: CarState): void {
    const time = Date.now();
    const flicker = 0.8 + Math.sin(time * 0.03) * 0.2;

    // Get booster effect colors
    const boosterPreset = car.boosterEffectId
      ? getBoosterEffectPreset(car.boosterEffectId)
      : null;

    const coreColor =
      boosterPreset?.coreColor || this.themeColors.boostFlameCore;
    const outerColor =
      boosterPreset?.outerColor || this.themeColors.boostFlameOuter;
    const particleColor =
      boosterPreset?.particleColor || this.themeColors.secondaryAccent;
    const style = boosterPreset?.style || "flame";

    // Main thrust cone
    const flameGradient = ctx.createRadialGradient(
      -GLIDER_LENGTH / 2 - 12,
      0,
      0,
      -GLIDER_LENGTH / 2 - 12,
      0,
      28 * flicker
    );
    flameGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    flameGradient.addColorStop(0.2, ThemeManager.withAlpha(coreColor, 0.9));
    flameGradient.addColorStop(0.5, ThemeManager.withAlpha(outerColor, 0.7));
    flameGradient.addColorStop(1, ThemeManager.withAlpha(particleColor, 0));

    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.ellipse(-GLIDER_LENGTH / 2 - 12, 0, 28 * flicker, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner hot core
    const coreGradient = ctx.createRadialGradient(
      -GLIDER_LENGTH / 2 - 5,
      0,
      0,
      -GLIDER_LENGTH / 2 - 5,
      0,
      10
    );
    coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    coreGradient.addColorStop(0.5, ThemeManager.withAlpha(coreColor, 0.6));
    coreGradient.addColorStop(1, ThemeManager.withAlpha(outerColor, 0));

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.ellipse(-GLIDER_LENGTH / 2 - 5, 0, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Add style-specific effects
    if (style === "electric") {
      this.drawElectricBoostEffect(ctx, coreColor, flicker);
    } else if (style === "pulse") {
      this.drawPulseBoostEffect(ctx, coreColor, outerColor);
    }
  }

  /**
   * Draw electric-style boost effect
   */
  private drawElectricBoostEffect(
    ctx: CanvasRenderingContext2D,
    color: string,
    flicker: number
  ): void {
    const time = Date.now() * 0.02;
    ctx.strokeStyle = ThemeManager.withAlpha(color, 0.6);
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + time;
      const len = 15 + Math.sin(time + i * 2) * 5;
      ctx.beginPath();
      ctx.moveTo(-GLIDER_LENGTH / 2 - 5, 0);
      ctx.lineTo(
        -GLIDER_LENGTH / 2 - 5 - Math.cos(angle * 0.3) * len,
        Math.sin(angle) * 6 * flicker
      );
      ctx.stroke();
    }
  }

  /**
   * Draw pulse-style boost effect
   */
  private drawPulseBoostEffect(
    ctx: CanvasRenderingContext2D,
    _coreColor: string,
    outerColor: string
  ): void {
    const time = Date.now() * 0.008;
    const pulse = Math.sin(time) * 0.5 + 0.5;

    // Pulsing ring
    ctx.strokeStyle = ThemeManager.withAlpha(outerColor, pulse * 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(
      -GLIDER_LENGTH / 2 - 10 - pulse * 8,
      0,
      4 + pulse * 6,
      2 + pulse * 3,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  /**
   * Draw health bar above glider
   */
  private drawHealthBar(ctx: CanvasRenderingContext2D, car: CarState): void {
    const barWidth = GLIDER_LENGTH + 10;
    const barHeight = 6;
    const x = car.x - barWidth / 2;
    const y = car.y - GLIDER_WINGSPAN / 2 - 15;
    const healthPercent = Math.max(0, car.health / car.maxHealth);

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Health color based on percentage - use theme-influenced colors
    let healthColor: string;
    if (healthPercent > 0.5) {
      healthColor = this.themeColors.primaryAccent;
    } else if (healthPercent > 0.25) {
      healthColor = this.themeColors.highlight;
    } else {
      healthColor = this.themeColors.secondaryAccent;
    }

    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = car.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  /**
   * Draw "YOU" indicator above player's glider - theme-aware
   */
  private drawPlayerIndicator(
    ctx: CanvasRenderingContext2D,
    car: CarState
  ): void {
    ctx.fillStyle = this.themeColors.winColor;
    ctx.font = "bold 12px Orbitron";
    ctx.textAlign = "center";
    ctx.shadowColor = this.themeColors.winColor;
    ctx.shadowBlur = 8;
    ctx.fillText("YOU", car.x, car.y - GLIDER_WINGSPAN / 2 - 35);
    ctx.shadowBlur = 0;
  }

  /**
   * Draw tier indicator below the glider showing tier name and number
   */
  private drawTierIndicator(
    ctx: CanvasRenderingContext2D,
    car: CarState
  ): void {
    if (!car.tier || !car.tierName) return;

    const x = car.x;
    const y = car.y + GLIDER_WINGSPAN / 2 + 18;
    const glowColor = car.glowColor || car.color;

    // Tier badge background
    const badgeWidth = 60;
    const badgeHeight = 16;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.roundRect(
      x - badgeWidth / 2,
      y - badgeHeight / 2,
      badgeWidth,
      badgeHeight,
      4
    );
    ctx.fill();

    // Tier badge border with glow
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = car.tier >= 7 ? 8 : 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tier text
    ctx.fillStyle = glowColor;
    ctx.font = "bold 10px Orbitron";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`T${car.tier} ${car.tierName}`, x, y);

    // For top tiers (9-10), add a star indicator
    if (car.tier >= 9) {
      const starX = x + badgeWidth / 2 + 8;
      const starY = y;

      ctx.fillStyle = car.tier === 10 ? "#fbbf24" : "#f9a8d4";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 6;
      ctx.font = "10px Arial";
      ctx.fillText("★", starX, starY);
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Darken a hex color
   */
  private darkenColor(color: string, factor: number): string {
    const hex = color.replace("#", "");
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Lighten a hex color
   */
  private lightenColor(color: string, factor: number): string {
    const hex = color.replace("#", "");
    const r = Math.min(
      255,
      Math.floor(parseInt(hex.substring(0, 2), 16) * factor)
    );
    const g = Math.min(
      255,
      Math.floor(parseInt(hex.substring(2, 4), 16) * factor)
    );
    const b = Math.min(
      255,
      Math.floor(parseInt(hex.substring(4, 6), 16) * factor)
    );
    return `rgb(${r}, ${g}, ${b})`;
  }
}
