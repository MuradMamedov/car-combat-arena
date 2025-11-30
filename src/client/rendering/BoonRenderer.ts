import { BOON_EFFECTS, BOON_SIZE, type BoonType } from "../../shared/index.js";
import type { Boon } from "../../shared/types/index.js";
import { ParticleSystem } from "./ParticleSystem.js";
import type { ThemeColors } from "./ThemeManager.js";
import { ThemeManager } from "./ThemeManager.js";

/**
 * Visual configuration for each boon type
 */
interface BoonVisuals {
  color: string;
  glowColor: string;
  icon: string;
  pulseSpeed: number;
}

/**
 * Renders boons/power-ups with animated effects
 */
export class BoonRenderer {
  private particleSystem: ParticleSystem;
  private animationTime: number = 0;

  constructor(particleSystem: ParticleSystem, _themeColors?: ThemeColors) {
    this.particleSystem = particleSystem;
    // Note: Boons use their own fixed colors from BOON_EFFECTS
    // Theme colors are accepted for API consistency but not currently used
  }

  /**
   * Update theme colors (accepted for API consistency)
   */
  setThemeColors(_colors: ThemeColors): void {
    // Boons use fixed colors from BOON_EFFECTS
  }

  /**
   * Get visuals for a boon type
   */
  private getBoonVisuals(type: BoonType): BoonVisuals {
    const effect = BOON_EFFECTS[type];
    return {
      color: effect.color,
      glowColor: effect.glowColor,
      icon: effect.icon,
      pulseSpeed: type === "speed" || type === "rapidfire" ? 0.15 : 0.08,
    };
  }

  /**
   * Draw a single boon
   */
  draw(ctx: CanvasRenderingContext2D, boon: Boon): void {
    const visuals = this.getBoonVisuals(boon.type);
    const age = Date.now() - boon.spawnTime;
    const lifetimeRatio = age / boon.lifetime;

    // Calculate pulse animation
    const pulse = Math.sin(this.animationTime * visuals.pulseSpeed) * 0.15 + 1;
    const currentSize = BOON_SIZE * pulse;

    // Calculate fade out in last 20% of lifetime
    let alpha = 1;
    if (lifetimeRatio > 0.8) {
      // Blink faster as it's about to expire
      const blinkSpeed = (lifetimeRatio - 0.8) * 50;
      alpha = Math.sin(this.animationTime * blinkSpeed) * 0.3 + 0.5;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(boon.x, boon.y);

    // Outer glow ring
    this.drawGlowRing(ctx, currentSize, visuals);

    // Inner hexagon shape
    this.drawHexagon(ctx, currentSize * 0.7, visuals);

    // Icon
    this.drawIcon(ctx, visuals);

    // Floating sparkles
    this.drawSparkles(ctx, currentSize, visuals);

    ctx.restore();

    // Add ambient particles
    if (Math.random() < 0.15) {
      this.particleSystem.addBoonAmbientParticle(
        boon.x,
        boon.y,
        visuals.color,
        currentSize
      );
    }
  }

  /**
   * Draw outer glow ring with rotation
   */
  private drawGlowRing(
    ctx: CanvasRenderingContext2D,
    size: number,
    visuals: BoonVisuals
  ): void {
    const rotation = this.animationTime * 0.02;

    ctx.save();
    ctx.rotate(rotation);

    // Outer glow
    const gradient = ctx.createRadialGradient(
      0,
      0,
      size * 0.5,
      0,
      0,
      size * 1.2
    );
    gradient.addColorStop(0, ThemeManager.withAlpha(visuals.glowColor, 0));
    gradient.addColorStop(0.5, ThemeManager.withAlpha(visuals.glowColor, 0.3));
    gradient.addColorStop(0.8, ThemeManager.withAlpha(visuals.color, 0.15));
    gradient.addColorStop(1, ThemeManager.withAlpha(visuals.color, 0));

    ctx.beginPath();
    ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Rotating dashed ring
    ctx.strokeStyle = ThemeManager.withAlpha(visuals.color, 0.5);
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  /**
   * Draw hexagonal body
   */
  private drawHexagon(
    ctx: CanvasRenderingContext2D,
    size: number,
    visuals: BoonVisuals
  ): void {
    const sides = 6;
    const rotation = -Math.PI / 6; // Start with flat top

    // Inner glow
    ctx.shadowColor = visuals.glowColor;
    ctx.shadowBlur = 15;

    // Draw hexagon
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + rotation;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Gradient fill
    const fillGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    fillGradient.addColorStop(0, ThemeManager.lighten(visuals.color, 0.3));
    fillGradient.addColorStop(0.6, visuals.color);
    fillGradient.addColorStop(1, ThemeManager.darken(visuals.color, 0.3));

    ctx.fillStyle = fillGradient;
    ctx.fill();

    // Border
    ctx.strokeStyle = visuals.glowColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  /**
   * Draw icon in center
   */
  private drawIcon(ctx: CanvasRenderingContext2D, visuals: BoonVisuals): void {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add subtle text shadow
    ctx.shadowColor = visuals.color;
    ctx.shadowBlur = 8;

    ctx.fillText(visuals.icon, 0, 0);

    ctx.shadowBlur = 0;
  }

  /**
   * Draw floating sparkles around the boon
   */
  private drawSparkles(
    ctx: CanvasRenderingContext2D,
    size: number,
    visuals: BoonVisuals
  ): void {
    const sparkleCount = 4;
    const baseAngle = this.animationTime * 0.05;

    for (let i = 0; i < sparkleCount; i++) {
      const angle = baseAngle + (i / sparkleCount) * Math.PI * 2;
      const distance =
        size * (0.8 + Math.sin(this.animationTime * 0.1 + i) * 0.2);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      // Draw sparkle
      const sparkleSize = 3 + Math.sin(this.animationTime * 0.15 + i * 2) * 1.5;

      ctx.fillStyle = visuals.glowColor;
      ctx.beginPath();
      ctx.arc(x, y, sparkleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Update animation
   */
  update(): void {
    this.animationTime++;
  }

  /**
   * Draw all boons
   */
  drawAll(ctx: CanvasRenderingContext2D, boons: Boon[]): void {
    this.update();
    for (const boon of boons) {
      this.draw(ctx, boon);
    }
  }
}
