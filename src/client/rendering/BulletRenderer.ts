import type { Bullet } from "../../shared/index.js";
import { getGunEffectPreset } from "../../shared/index.js";
import { ParticleSystem } from "./ParticleSystem.js";
import type { ThemeColors } from "./ThemeManager.js";
import { ThemeManager } from "./ThemeManager.js";

/**
 * Weapon visual configuration
 */
interface WeaponVisuals {
  color: string;
  glowColor: string;
  trailColor: string;
  trailLength: number;
  trailWidth: number;
  particleStyle: string;
}

/**
 * Renders bullets and their effects with theme-aware colors
 */
export class BulletRenderer {
  private particleSystem: ParticleSystem;
  private themeColors: ThemeColors;
  private weaponVisuals: Record<string, WeaponVisuals>;

  constructor(particleSystem: ParticleSystem, themeColors?: ThemeColors) {
    this.particleSystem = particleSystem;
    // Use default theme colors if not provided (for backwards compatibility)
    this.themeColors = themeColors || {
      primaryAccent: "#00fff2",
      secondaryAccent: "#ff00aa",
      highlight: "#ff6b00",
      winColor: "#ffee00",
      darkBg: "#0a0a12",
      darkSurface: "#12121f",
      gridColor: "rgba(0, 255, 242, 0.08)",
      textColor: "#ffffff",
      textMuted: "rgba(255, 255, 255, 0.7)",
      player1Color: "#00fff2",
      player2Color: "#ff00aa",
      shieldColor: "#00ccff",
      boostFlameCore: "#00d4ff",
      boostFlameOuter: "#ff6b00",
      wallTint: "#00fff2",
      wallGlowColor: "#ff00aa",
    };
    this.weaponVisuals = this.createWeaponVisuals();
  }

  /**
   * Update theme colors
   */
  setThemeColors(colors: ThemeColors): void {
    this.themeColors = colors;
    this.weaponVisuals = this.createWeaponVisuals();
  }

  /**
   * Create weapon visuals based on current theme
   */
  private createWeaponVisuals(): Record<string, WeaponVisuals> {
    return {
      cannon: {
        color: this.themeColors.highlight,
        glowColor: this.themeColors.secondaryAccent,
        trailColor: this.themeColors.winColor,
        trailLength: 40,
        trailWidth: 5,
        particleStyle: "standard",
      },
      machinegun: {
        color: this.themeColors.primaryAccent,
        glowColor: ThemeManager.darken(this.themeColors.primaryAccent, 0.7),
        trailColor: this.themeColors.primaryAccent,
        trailLength: 20,
        trailWidth: 2,
        particleStyle: "standard",
      },
    };
  }

  /**
   * Get visuals for a bullet based on its gun effect preset
   */
  private getBulletVisuals(bullet: Bullet): WeaponVisuals {
    const weaponType = bullet.weaponType || "cannon";
    const baseVisuals =
      this.weaponVisuals[weaponType] || this.weaponVisuals.cannon;

    // If bullet has custom gun effect, use it
    if (bullet.gunEffectId) {
      const preset = getGunEffectPreset(bullet.gunEffectId);
      return {
        color: preset.bulletColor,
        glowColor: preset.glowColor,
        trailColor: preset.trailColor,
        trailLength: baseVisuals.trailLength,
        trailWidth: baseVisuals.trailWidth,
        particleStyle: preset.particleStyle,
      };
    }

    return baseVisuals;
  }

  /**
   * Draw a single bullet
   */
  draw(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
    const weaponType = bullet.weaponType || "cannon";
    const visuals = this.getBulletVisuals(bullet);

    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(bullet.angle);

    if (weaponType === "cannon") {
      this.drawCannonBullet(ctx, bullet, visuals);
    } else {
      this.drawMachineGunBullet(ctx, bullet, visuals);
    }

    ctx.restore();

    // Add spark particles with custom effect style
    this.particleSystem.addBulletSparksWithStyle(
      bullet.x,
      bullet.y,
      bullet.velocityX,
      bullet.velocityY,
      visuals.color,
      visuals.particleStyle
    );
  }

  /**
   * Draw cannon shell (large, fiery) - theme-aware with custom effects
   */
  private drawCannonBullet(
    ctx: CanvasRenderingContext2D,
    bullet: Bullet,
    visuals: WeaponVisuals
  ): void {
    // Fiery trail with custom colors
    const trailGradient = ctx.createLinearGradient(
      -visuals.trailLength,
      0,
      0,
      0
    );
    trailGradient.addColorStop(0, ThemeManager.withAlpha(visuals.color, 0));
    trailGradient.addColorStop(
      0.5,
      ThemeManager.withAlpha(visuals.glowColor, 0.4)
    );
    trailGradient.addColorStop(
      1,
      ThemeManager.withAlpha(visuals.trailColor, 0.7)
    );

    ctx.fillStyle = trailGradient;
    ctx.fillRect(
      -visuals.trailLength,
      -visuals.trailWidth,
      visuals.trailLength,
      visuals.trailWidth * 2
    );

    // Shell body with intense glow
    ctx.shadowColor = visuals.glowColor;
    ctx.shadowBlur = 20;

    // Style-specific rendering
    if (visuals.particleStyle === "electric") {
      // Electric style: jagged, bright core
      this.drawElectricBullet(ctx, bullet, visuals);
    } else if (visuals.particleStyle === "void") {
      // Void style: dark center with bright rim
      this.drawVoidBullet(ctx, bullet, visuals);
    } else if (visuals.particleStyle === "plasma") {
      // Plasma style: smooth glow
      this.drawPlasmaBullet(ctx, bullet, visuals);
    } else {
      // Standard/Fire style: classic cannon shell
      ctx.fillStyle = visuals.glowColor;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        bullet.size * 1.2,
        bullet.size * 0.7,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        bullet.size * 0.6,
        bullet.size * 0.4,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  /**
   * Draw electric-style bullet with spark effects
   */
  private drawElectricBullet(
    ctx: CanvasRenderingContext2D,
    bullet: Bullet,
    visuals: WeaponVisuals
  ): void {
    const time = Date.now() * 0.01;

    // Outer electric glow
    ctx.fillStyle = visuals.glowColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, bullet.size * 1.3, bullet.size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lightning spikes
    ctx.strokeStyle = visuals.color;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time;
      const len = bullet.size * (0.8 + Math.sin(time + i) * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len * 0.6);
      ctx.stroke();
    }

    // Bright core
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, 0, bullet.size * 0.4, bullet.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw void-style bullet with dark center
   */
  private drawVoidBullet(
    ctx: CanvasRenderingContext2D,
    bullet: Bullet,
    visuals: WeaponVisuals
  ): void {
    // Outer bright rim
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bullet.size * 1.3);
    gradient.addColorStop(0, visuals.color);
    gradient.addColorStop(0.4, ThemeManager.withAlpha(visuals.glowColor, 0.8));
    gradient.addColorStop(0.7, visuals.trailColor);
    gradient.addColorStop(1, ThemeManager.withAlpha(visuals.glowColor, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bullet.size * 1.3, bullet.size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark void center
    ctx.fillStyle = "#0a0014";
    ctx.beginPath();
    ctx.ellipse(0, 0, bullet.size * 0.5, bullet.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw plasma-style bullet with smooth glow
   */
  private drawPlasmaBullet(
    ctx: CanvasRenderingContext2D,
    bullet: Bullet,
    visuals: WeaponVisuals
  ): void {
    const time = Date.now() * 0.005;
    const pulse = 1 + Math.sin(time) * 0.15;

    // Outer plasma glow
    const gradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      bullet.size * 1.4 * pulse
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.3, visuals.color);
    gradient.addColorStop(0.6, visuals.glowColor);
    gradient.addColorStop(1, ThemeManager.withAlpha(visuals.trailColor, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      bullet.size * 1.4 * pulse,
      bullet.size * 0.9 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  /**
   * Draw machine gun bullet (small, rapid) - theme-aware with custom effects
   */
  private drawMachineGunBullet(
    ctx: CanvasRenderingContext2D,
    bullet: Bullet,
    visuals: WeaponVisuals
  ): void {
    // Quick trail with custom color
    const trailGradient = ctx.createLinearGradient(
      -visuals.trailLength,
      0,
      0,
      0
    );
    trailGradient.addColorStop(
      0,
      ThemeManager.withAlpha(visuals.trailColor, 0)
    );
    trailGradient.addColorStop(1, ThemeManager.withAlpha(visuals.color, 0.6));

    ctx.fillStyle = trailGradient;
    ctx.fillRect(
      -visuals.trailLength,
      -visuals.trailWidth / 2,
      visuals.trailLength,
      visuals.trailWidth
    );

    // Small bullet with glow
    ctx.shadowColor = visuals.glowColor;
    ctx.shadowBlur = 10;

    ctx.fillStyle = visuals.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, bullet.size * 1.5, bullet.size, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, 0, bullet.size * 0.5, bullet.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  /**
   * Draw all bullets
   */
  drawAll(ctx: CanvasRenderingContext2D, bullets: Bullet[]): void {
    for (const bullet of bullets) {
      this.draw(ctx, bullet);
    }
  }
}
