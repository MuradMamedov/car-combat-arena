import type { WallMaterial } from "../../shared/constants/game.js";
import type { Particle, Vector2, Wall } from "../../shared/index.js";
import { EntityFactory, getBoosterEffectPreset } from "../../shared/index.js";
import type { ThemeColors } from "./ThemeManager.js";
import { ThemeManager } from "./ThemeManager.js";

/**
 * Manages particle effects with theme-aware colors
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 500;
  private themeColors: ThemeColors;

  constructor(themeColors: ThemeColors) {
    this.themeColors = themeColors;
  }

  /**
   * Update theme colors
   */
  setThemeColors(colors: ThemeColors): void {
    this.themeColors = colors;
  }

  /**
   * Add a single particle
   */
  addParticle(
    position: Vector2,
    velocity: Vector2,
    life: number,
    color: string,
    size: number
  ): void {
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particles
      this.particles.splice(0, 10);
    }

    this.particles.push(
      EntityFactory.createParticle(position, velocity, life, color, size)
    );
  }

  /**
   * Add boost flame particles - theme-aware
   */
  addBoostParticles(
    x: number,
    y: number,
    angle: number,
    carWidth: number
  ): void {
    const boostColors = [
      this.themeColors.boostFlameOuter,
      this.themeColors.highlight,
      this.themeColors.boostFlameCore,
    ];

    for (let i = 0; i < 3; i++) {
      const offsetX = Math.cos(angle) * (carWidth / 2 + 10);
      const offsetY = Math.sin(angle) * (carWidth / 2 + 10);

      this.addParticle(
        {
          x: x - offsetX + (Math.random() - 0.5) * 10,
          y: y - offsetY + (Math.random() - 0.5) * 10,
        },
        {
          x: -Math.cos(angle) * (3 + Math.random() * 2),
          y: -Math.sin(angle) * (3 + Math.random() * 2),
        },
        20,
        boostColors[Math.floor(Math.random() * boostColors.length)],
        5 + Math.random() * 5
      );
    }
  }

  /**
   * Add boost flame particles with custom booster effect
   */
  addCustomBoostParticles(
    x: number,
    y: number,
    angle: number,
    carWidth: number,
    boosterEffectId: string
  ): void {
    const preset = getBoosterEffectPreset(boosterEffectId);
    const boostColors = [
      preset.coreColor,
      preset.outerColor,
      preset.particleColor,
    ];

    switch (preset.style) {
      case "flame":
        this.addFlameBoostParticles(x, y, angle, carWidth, boostColors);
        break;
      case "plasma":
        this.addPlasmaBoostParticles(x, y, angle, carWidth, boostColors);
        break;
      case "electric":
        this.addElectricBoostParticles(x, y, angle, carWidth, boostColors);
        break;
      case "trail":
        this.addTrailBoostParticles(x, y, angle, carWidth, boostColors);
        break;
      case "pulse":
        this.addPulseBoostParticles(x, y, angle, carWidth, boostColors);
        break;
      default:
        this.addFlameBoostParticles(x, y, angle, carWidth, boostColors);
    }
  }

  /**
   * Standard flame boost particles
   */
  private addFlameBoostParticles(
    x: number,
    y: number,
    angle: number,
    carWidth: number,
    colors: string[]
  ): void {
    for (let i = 0; i < 3; i++) {
      const offsetX = Math.cos(angle) * (carWidth / 2 + 10);
      const offsetY = Math.sin(angle) * (carWidth / 2 + 10);

      this.addParticle(
        {
          x: x - offsetX + (Math.random() - 0.5) * 10,
          y: y - offsetY + (Math.random() - 0.5) * 10,
        },
        {
          x: -Math.cos(angle) * (3 + Math.random() * 2),
          y: -Math.sin(angle) * (3 + Math.random() * 2),
        },
        20,
        colors[Math.floor(Math.random() * colors.length)],
        5 + Math.random() * 5
      );
    }
  }

  /**
   * Plasma boost particles - smooth, glowing
   */
  private addPlasmaBoostParticles(
    x: number,
    y: number,
    angle: number,
    carWidth: number,
    colors: string[]
  ): void {
    for (let i = 0; i < 4; i++) {
      const offsetX = Math.cos(angle) * (carWidth / 2 + 10);
      const offsetY = Math.sin(angle) * (carWidth / 2 + 10);
      const spread = (Math.random() - 0.5) * 15;

      this.addParticle(
        {
          x: x - offsetX + spread,
          y: y - offsetY + spread,
        },
        {
          x: -Math.cos(angle) * (2.5 + Math.random() * 1.5),
          y: -Math.sin(angle) * (2.5 + Math.random() * 1.5),
        },
        25 + Math.random() * 10,
        colors[Math.floor(Math.random() * colors.length)],
        6 + Math.random() * 6
      );
    }
  }

  /**
   * Electric boost particles - sparky, erratic
   */
  private addElectricBoostParticles(
    x: number,
    y: number,
    angle: number,
    carWidth: number,
    colors: string[]
  ): void {
    for (let i = 0; i < 5; i++) {
      const offsetX = Math.cos(angle) * (carWidth / 2 + 10);
      const offsetY = Math.sin(angle) * (carWidth / 2 + 10);
      const spreadAngle = angle + (Math.random() - 0.5) * 0.8;

      this.addParticle(
        {
          x: x - offsetX + (Math.random() - 0.5) * 8,
          y: y - offsetY + (Math.random() - 0.5) * 8,
        },
        {
          x: -Math.cos(spreadAngle) * (4 + Math.random() * 3),
          y: -Math.sin(spreadAngle) * (4 + Math.random() * 3),
        },
        12 + Math.random() * 8,
        Math.random() > 0.3
          ? colors[Math.floor(Math.random() * colors.length)]
          : "#ffffff",
        2 + Math.random() * 3
      );
    }
  }

  /**
   * Trail boost particles - elongated, persistent
   */
  private addTrailBoostParticles(
    x: number,
    y: number,
    angle: number,
    carWidth: number,
    colors: string[]
  ): void {
    for (let i = 0; i < 2; i++) {
      const offsetX = Math.cos(angle) * (carWidth / 2 + 10 + i * 8);
      const offsetY = Math.sin(angle) * (carWidth / 2 + 10 + i * 8);

      this.addParticle(
        {
          x: x - offsetX + (Math.random() - 0.5) * 5,
          y: y - offsetY + (Math.random() - 0.5) * 5,
        },
        {
          x: -Math.cos(angle) * (1 + Math.random() * 0.5),
          y: -Math.sin(angle) * (1 + Math.random() * 0.5),
        },
        35 + Math.random() * 15,
        colors[i % colors.length],
        4 + Math.random() * 3
      );
    }
  }

  /**
   * Pulse boost particles - pulsating, rhythmic
   */
  private addPulseBoostParticles(
    x: number,
    y: number,
    angle: number,
    carWidth: number,
    colors: string[]
  ): void {
    const time = Date.now() * 0.01;
    const pulse = Math.sin(time) * 0.5 + 1;

    for (let i = 0; i < Math.floor(2 + pulse * 2); i++) {
      const offsetX = Math.cos(angle) * (carWidth / 2 + 10);
      const offsetY = Math.sin(angle) * (carWidth / 2 + 10);
      const ringAngle = angle + Math.PI + (i / 4) * Math.PI * 2;

      this.addParticle(
        {
          x: x - offsetX + Math.cos(ringAngle) * 5,
          y: y - offsetY + Math.sin(ringAngle) * 5,
        },
        {
          x:
            -Math.cos(angle) * (2 + Math.random() * 2) +
            Math.cos(ringAngle) * 0.5,
          y:
            -Math.sin(angle) * (2 + Math.random() * 2) +
            Math.sin(ringAngle) * 0.5,
        },
        18 + Math.random() * 10,
        colors[Math.floor(Math.random() * colors.length)],
        4 + pulse * 3
      );
    }
  }

  /**
   * Add bullet spark particles - theme-aware
   */
  addBulletSparks(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    color: string = "#ffee00"
  ): void {
    // Use theme highlight color for sparks if no specific color given
    const sparkColor = color === "#ffee00" ? this.themeColors.highlight : color;

    if (Math.random() > 0.7) {
      this.addParticle(
        {
          x: x - velocityX * 0.5,
          y: y - velocityY * 0.5,
        },
        {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
        10,
        sparkColor,
        2 + Math.random() * 2
      );
    }
  }

  /**
   * Add bullet spark particles with custom style
   */
  addBulletSparksWithStyle(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    color: string,
    style: string
  ): void {
    if (Math.random() > 0.6) {
      switch (style) {
        case "electric":
          // Electric sparks: more particles, brighter, more spread
          for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3;
            this.addParticle(
              { x: x - velocityX * 0.3, y: y - velocityY * 0.3 },
              { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
              8 + Math.random() * 6,
              Math.random() > 0.3 ? color : "#ffffff",
              1.5 + Math.random() * 2
            );
          }
          break;

        case "plasma":
          // Plasma: smooth, glowing particles
          this.addParticle(
            { x: x - velocityX * 0.5, y: y - velocityY * 0.5 },
            {
              x: (Math.random() - 0.5) * 1.5,
              y: (Math.random() - 0.5) * 1.5,
            },
            15 + Math.random() * 8,
            color,
            3 + Math.random() * 3
          );
          break;

        case "fire":
          // Fire: upward-drifting, orange/yellow particles
          this.addParticle(
            { x: x - velocityX * 0.4, y: y - velocityY * 0.4 },
            {
              x: (Math.random() - 0.5) * 2,
              y: -0.5 - Math.random() * 1.5,
            },
            12 + Math.random() * 8,
            color,
            2 + Math.random() * 3
          );
          break;

        case "void":
          // Void: dark particles with occasional bright flashes
          this.addParticle(
            { x: x - velocityX * 0.5, y: y - velocityY * 0.5 },
            {
              x: (Math.random() - 0.5) * 1,
              y: (Math.random() - 0.5) * 1,
            },
            20 + Math.random() * 10,
            Math.random() > 0.8 ? "#ffffff" : color,
            2 + Math.random() * 2
          );
          break;

        default:
          // Standard sparks
          this.addParticle(
            { x: x - velocityX * 0.5, y: y - velocityY * 0.5 },
            {
              x: (Math.random() - 0.5) * 2,
              y: (Math.random() - 0.5) * 2,
            },
            10,
            color,
            2 + Math.random() * 2
          );
      }
    }
  }

  /**
   * Add shield impact particles - theme-aware electric sparks
   */
  addShieldImpactParticles(x: number, y: number, intensity: number = 1): void {
    const particleCount = Math.floor(12 * intensity);
    const colors = [
      this.themeColors.shieldColor,
      ThemeManager.lighten(this.themeColors.shieldColor, 1.2),
      ThemeManager.lighten(this.themeColors.shieldColor, 1.5),
      this.themeColors.primaryAccent,
      "#ffffff",
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle =
        (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 4;

      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        15 + Math.random() * 10,
        colors[Math.floor(Math.random() * colors.length)],
        3 + Math.random() * 4
      );
    }

    // Add some lingering electric arcs
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 25;

      this.addParticle(
        {
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
        },
        {
          x: (Math.random() - 0.5) * 1.5,
          y: (Math.random() - 0.5) * 1.5,
        },
        20 + Math.random() * 15,
        this.themeColors.shieldColor,
        2 + Math.random() * 2
      );
    }
  }

  /**
   * Add car damage particles - theme-aware sparks and smoke
   */
  addCarDamageParticles(
    x: number,
    y: number,
    carColor: string,
    intensity: number = 1
  ): void {
    const particleCount = Math.floor(15 * intensity);

    // Theme-influenced spark colors
    const sparkColors = [
      this.themeColors.highlight,
      this.themeColors.secondaryAccent,
      ThemeManager.lighten(this.themeColors.highlight, 1.2),
      this.themeColors.boostFlameOuter,
      "#ffffff",
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;

      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 1, // slight upward bias
        },
        20 + Math.random() * 15,
        sparkColors[Math.floor(Math.random() * sparkColors.length)],
        2 + Math.random() * 3
      );
    }

    // Smoke particles with subtle theme tint
    const smokeColors = [
      "#444444",
      "#555555",
      "#666666",
      ThemeManager.withAlpha(this.themeColors.darkSurface, 0.8),
    ];

    for (let i = 0; i < Math.floor(8 * intensity); i++) {
      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 25,
          y: y + (Math.random() - 0.5) * 25,
        },
        {
          x: (Math.random() - 0.5) * 1.5,
          y: -0.5 - Math.random() * 1.5, // rise upward
        },
        30 + Math.random() * 20,
        smokeColors[Math.floor(Math.random() * smokeColors.length)],
        6 + Math.random() * 8
      );
    }

    // Car color debris
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;

      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        25 + Math.random() * 10,
        carColor,
        3 + Math.random() * 3
      );
    }
  }

  /**
   * Add wall hit particles based on material - theme-aware
   */
  addWallHitParticles(x: number, y: number, material: WallMaterial): void {
    const materialColors = this.getMaterialColors(material);
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;

      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        15 + Math.random() * 10,
        materialColors[Math.floor(Math.random() * materialColors.length)],
        2 + Math.random() * 3
      );
    }

    // Add spark for metal - use theme highlight
    if (material === "metal") {
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 4;

        this.addParticle(
          { x, y },
          {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          8 + Math.random() * 6,
          Math.random() > 0.5 ? this.themeColors.highlight : "#ffffff",
          1 + Math.random() * 2
        );
      }
    }

    // Glass shatter sparkle - use theme primary
    if (material === "glass") {
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 10;

        this.addParticle(
          {
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
          },
          {
            x: Math.cos(angle) * 1.5,
            y: Math.sin(angle) * 1.5,
          },
          12 + Math.random() * 8,
          Math.random() > 0.5 ? "#ffffff" : this.themeColors.primaryAccent,
          1 + Math.random()
        );
      }
    }
  }

  /**
   * Add wall destruction particles - theme-aware explosion
   */
  addWallDestructionParticles(wall: Wall): void {
    const { x, y, width, height, material } = wall;
    const materialColors = this.getMaterialColors(material);
    const particleCount = 30 + Math.floor((width * height) / 500);

    // Main debris burst
    for (let i = 0; i < particleCount; i++) {
      const startX = x + (Math.random() - 0.5) * width;
      const startY = y + (Math.random() - 0.5) * height;
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;

      this.addParticle(
        { x: startX, y: startY },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 1, // slight upward bias
        },
        25 + Math.random() * 20,
        materialColors[Math.floor(Math.random() * materialColors.length)],
        3 + Math.random() * 5
      );
    }

    // Dust/smoke cloud
    const smokeColors = this.getSmokeColors(material);
    for (let i = 0; i < 15; i++) {
      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * width * 0.8,
          y: y + (Math.random() - 0.5) * height * 0.8,
        },
        {
          x: (Math.random() - 0.5) * 2,
          y: -0.5 - Math.random() * 2,
        },
        35 + Math.random() * 25,
        smokeColors[Math.floor(Math.random() * smokeColors.length)],
        8 + Math.random() * 10
      );
    }

    // Material-specific effects
    switch (material) {
      case "metal":
        // Sparks flying - use theme highlight
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 5 + Math.random() * 8;
          this.addParticle(
            {
              x: x + (Math.random() - 0.5) * width * 0.5,
              y: y + (Math.random() - 0.5) * height * 0.5,
            },
            {
              x: Math.cos(angle) * speed,
              y: Math.sin(angle) * speed,
            },
            10 + Math.random() * 8,
            Math.random() > 0.3 ? this.themeColors.highlight : "#ffffff",
            1 + Math.random() * 2
          );
        }
        break;

      case "glass":
        // Shimmering shards - use theme primary
        for (let i = 0; i < 25; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 4 + Math.random() * 5;
          this.addParticle(
            {
              x: x + (Math.random() - 0.5) * width,
              y: y + (Math.random() - 0.5) * height,
            },
            {
              x: Math.cos(angle) * speed,
              y: Math.sin(angle) * speed,
            },
            20 + Math.random() * 15,
            Math.random() > 0.5
              ? "#ffffff"
              : ThemeManager.lighten(this.themeColors.primaryAccent, 1.2),
            2 + Math.random() * 3
          );
        }
        break;

      case "wood":
        // Wood splinters
        for (let i = 0; i < 12; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          this.addParticle(
            {
              x: x + (Math.random() - 0.5) * width * 0.6,
              y: y + (Math.random() - 0.5) * height * 0.6,
            },
            {
              x: Math.cos(angle) * speed,
              y: Math.sin(angle) * speed - 1,
            },
            30 + Math.random() * 15,
            "#5c3310",
            2 + Math.random() * 4
          );
        }
        break;

      case "concrete":
        // Heavy chunks falling
        for (let i = 0; i < 8; i++) {
          const startX = x + (Math.random() - 0.5) * width * 0.7;
          const startY = y + (Math.random() - 0.5) * height * 0.7;
          this.addParticle(
            { x: startX, y: startY },
            {
              x: (Math.random() - 0.5) * 3,
              y: 1 + Math.random() * 2, // falling down
            },
            40 + Math.random() * 20,
            "#4b5563",
            6 + Math.random() * 6
          );
        }
        break;
    }
  }

  /**
   * Get particle colors for a wall material - theme-tinted
   */
  private getMaterialColors(material: WallMaterial): string[] {
    const tint = this.themeColors.wallTint;

    switch (material) {
      case "concrete":
        return [
          this.blendColor("#6b7280", tint, 0.1),
          this.blendColor("#5a6268", tint, 0.1),
          this.blendColor("#4b5563", tint, 0.1),
          "#9ca3af",
          "#374151",
        ];
      case "wood":
        return [
          this.blendColor("#92400e", tint, 0.08),
          this.blendColor("#7c4a1c", tint, 0.08),
          "#a3541a",
          "#5c3310",
          "#b45309",
        ];
      case "metal":
        return [
          this.blendColor("#374151", tint, 0.12),
          this.blendColor("#4b5563", tint, 0.12),
          this.blendColor("#6b7280", tint, 0.12),
          "#1f2937",
          "#9ca3af",
        ];
      case "glass":
        return [
          this.themeColors.primaryAccent,
          ThemeManager.lighten(this.themeColors.primaryAccent, 1.2),
          ThemeManager.lighten(this.themeColors.primaryAccent, 1.4),
          "#cffafe",
          "#ffffff",
        ];
    }
  }

  /**
   * Get smoke colors for a wall material
   */
  private getSmokeColors(material: WallMaterial): string[] {
    switch (material) {
      case "concrete":
        return ["#9ca3af", "#6b7280", "#d1d5db"];
      case "wood":
        return ["#44403c", "#57534e", "#78716c"];
      case "metal":
        return ["#374151", "#4b5563", "#1f2937"];
      case "glass":
        return [
          ThemeManager.withAlpha(this.themeColors.primaryAccent, 0.3),
          ThemeManager.lighten(this.themeColors.primaryAccent, 1.5),
          "#f0f9ff",
        ];
    }
  }

  /**
   * Blend two colors together
   */
  private blendColor(
    baseColor: string,
    tintColor: string,
    amount: number
  ): string {
    const base = this.hexToRgb(baseColor);
    const tint = this.hexToRgb(tintColor);

    const r = Math.round(base.r * (1 - amount) + tint.r * amount);
    const g = Math.round(base.g * (1 - amount) + tint.g * amount);
    const b = Math.round(base.b * (1 - amount) + tint.b * amount);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace("#", "");
    return {
      r: parseInt(cleanHex.substring(0, 2), 16),
      g: parseInt(cleanHex.substring(2, 4), 16),
      b: parseInt(cleanHex.substring(4, 6), 16),
    };
  }

  /**
   * Add shield break particles - theme-aware dramatic effect
   */
  addShieldBreakParticles(x: number, y: number): void {
    const particleCount = 25;
    const colors = [
      this.themeColors.shieldColor,
      ThemeManager.lighten(this.themeColors.shieldColor, 1.2),
      ThemeManager.lighten(this.themeColors.shieldColor, 1.5),
      this.themeColors.primaryAccent,
      "#ffffff",
      ThemeManager.lighten(this.themeColors.primaryAccent, 1.2),
    ];

    // Radial burst
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 5 + Math.random() * 6;

      this.addParticle(
        {
          x: x,
          y: y,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        25 + Math.random() * 15,
        colors[Math.floor(Math.random() * colors.length)],
        4 + Math.random() * 5
      );
    }

    // Inner dissipating fragments
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 35;
      const speed = 1 + Math.random() * 2;

      this.addParticle(
        {
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        35 + Math.random() * 20,
        this.themeColors.shieldColor,
        3 + Math.random() * 4
      );
    }
  }

  /**
   * Update all particles
   */
  update(): void {
    this.particles = this.particles.filter((p) => {
      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life--;
      return p.life > 0;
    });
  }

  /**
   * Draw all particles
   */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = this.setAlpha(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Get particle count
   */
  getCount(): number {
    return this.particles.length;
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }

  /**
   * Add ambient floating particles around boons
   */
  addBoonAmbientParticle(
    x: number,
    y: number,
    color: string,
    size: number
  ): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = size * (0.5 + Math.random() * 0.5);
    const startX = x + Math.cos(angle) * distance;
    const startY = y + Math.sin(angle) * distance;

    // Float upward and outward
    const speed = 0.5 + Math.random() * 0.5;
    const driftAngle = angle + (Math.random() - 0.5) * 0.5;

    this.addParticle(
      { x: startX, y: startY },
      {
        x: Math.cos(driftAngle) * speed,
        y: -speed - Math.random() * 0.5, // Float upward
      },
      30 + Math.random() * 20,
      color,
      2 + Math.random() * 2
    );
  }

  /**
   * Add pickup burst particles when boon is collected
   */
  addBoonPickupBurst(x: number, y: number, color: string): void {
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 4;

      this.addParticle(
        { x, y },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        25 + Math.random() * 15,
        color,
        3 + Math.random() * 4
      );
    }

    // Add central flash particles
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;

      this.addParticle(
        { x, y },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        15 + Math.random() * 10,
        "#ffffff",
        4 + Math.random() * 3
      );
    }
  }

  /**
   * Add ambient particles around high-tier gliders
   * Creates floating energy particles based on tier
   */
  addGliderAmbientParticle(
    x: number,
    y: number,
    glowColor: string,
    tier: number
  ): void {
    // Different particle styles based on tier
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    const startX = x + Math.cos(angle) * distance;
    const startY = y + Math.sin(angle) * distance;

    if (tier >= 9) {
      // Tier 9-10: Plasma orbs that float and fade
      const orbAngle = Math.random() * Math.PI * 2;
      const orbSpeed = 0.3 + Math.random() * 0.5;

      this.addParticle(
        { x: startX, y: startY },
        {
          x: Math.cos(orbAngle) * orbSpeed,
          y: Math.sin(orbAngle) * orbSpeed - 0.3,
        },
        40 + Math.random() * 30,
        Math.random() > 0.3 ? glowColor : "#ffffff",
        3 + Math.random() * 3
      );

      // Add trailing sparkle
      if (Math.random() > 0.5) {
        this.addParticle(
          {
            x: startX + (Math.random() - 0.5) * 10,
            y: startY + (Math.random() - 0.5) * 10,
          },
          {
            x: (Math.random() - 0.5) * 0.5,
            y: -0.5 - Math.random() * 0.5,
          },
          20 + Math.random() * 15,
          ThemeManager.lighten(glowColor, 1.3),
          1 + Math.random() * 2
        );
      }
    } else if (tier >= 7) {
      // Tier 7-8: Electric sparks
      const sparkAngle = Math.random() * Math.PI * 2;
      const sparkSpeed = 1 + Math.random() * 2;

      this.addParticle(
        { x: startX, y: startY },
        {
          x: Math.cos(sparkAngle) * sparkSpeed,
          y: Math.sin(sparkAngle) * sparkSpeed,
        },
        15 + Math.random() * 10,
        Math.random() > 0.5 ? glowColor : ThemeManager.lighten(glowColor, 1.5),
        1.5 + Math.random() * 1.5
      );
    } else {
      // Tier 6: Subtle energy wisps
      const wispAngle = Math.random() * Math.PI * 2;
      const wispSpeed = 0.5 + Math.random() * 0.5;

      this.addParticle(
        { x: startX, y: startY },
        {
          x: Math.cos(wispAngle) * wispSpeed,
          y: Math.sin(wispAngle) * wispSpeed - 0.2,
        },
        25 + Math.random() * 15,
        glowColor,
        2 + Math.random() * 2
      );
    }
  }

  /**
   * Add contrail particles behind glider wingtips
   */
  addContrailParticle(
    x: number,
    y: number,
    glowColor: string,
    tier: number
  ): void {
    const fadeSpeed = 20 + tier * 2;
    const size = 2 + tier * 0.2;

    this.addParticle(
      { x, y },
      {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
      },
      fadeSpeed + Math.random() * 10,
      glowColor,
      size + Math.random()
    );
  }

  /**
   * Add glider explosion particles when a glider is destroyed
   * Creates a dramatic explosion with debris, fire, smoke and sparks
   */
  addGliderExplosionParticles(
    x: number,
    y: number,
    gliderColor: string,
    glowColor: string,
    tier: number
  ): void {
    // Scale explosion intensity based on tier
    const intensityMultiplier = 1 + (tier - 1) * 0.15;

    // Main explosion burst - fiery core
    const coreParticles = Math.floor(30 * intensityMultiplier);
    const fireColors = [
      "#ffffff",
      this.themeColors.boostFlameCore,
      this.themeColors.boostFlameOuter,
      this.themeColors.highlight,
      "#ff4500",
      "#ff6b00",
      "#ffaa00",
    ];

    for (let i = 0; i < coreParticles; i++) {
      const angle =
        (i / coreParticles) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 4 + Math.random() * 8;

      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        25 + Math.random() * 20,
        fireColors[Math.floor(Math.random() * fireColors.length)],
        4 + Math.random() * 6
      );
    }

    // Secondary explosion ring
    const ringParticles = Math.floor(20 * intensityMultiplier);
    for (let i = 0; i < ringParticles; i++) {
      const angle = (i / ringParticles) * Math.PI * 2;
      const speed = 6 + Math.random() * 4;

      this.addParticle(
        { x, y },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        20 + Math.random() * 15,
        Math.random() > 0.5 ? glowColor : this.themeColors.highlight,
        3 + Math.random() * 4
      );
    }

    // Glider debris - colored fragments flying outward
    const debrisCount = Math.floor(25 * intensityMultiplier);
    const debrisColors = [
      gliderColor,
      ThemeManager.darken(gliderColor, 0.7),
      ThemeManager.lighten(gliderColor, 1.2),
      "#333333",
      "#555555",
    ];

    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;

      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 40,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 0.5, // Slight upward bias
        },
        35 + Math.random() * 25,
        debrisColors[Math.floor(Math.random() * debrisColors.length)],
        2 + Math.random() * 4
      );
    }

    // Smoke cloud - dark particles that rise
    const smokeCount = Math.floor(20 * intensityMultiplier);
    const smokeColors = [
      "#222222",
      "#333333",
      "#444444",
      "#555555",
      ThemeManager.withAlpha(this.themeColors.darkSurface, 0.9),
    ];

    for (let i = 0; i < smokeCount; i++) {
      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 50,
        },
        {
          x: (Math.random() - 0.5) * 2,
          y: -1 - Math.random() * 2, // Rise upward
        },
        40 + Math.random() * 30,
        smokeColors[Math.floor(Math.random() * smokeColors.length)],
        8 + Math.random() * 12
      );
    }

    // Electric sparks for high-tier gliders
    if (tier >= 5) {
      const sparkCount = Math.floor(15 * (tier / 10));
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 8;

        this.addParticle(
          {
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 30,
          },
          {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          10 + Math.random() * 8,
          Math.random() > 0.3 ? glowColor : "#ffffff",
          1 + Math.random() * 2
        );
      }
    }

    // Plasma burst for top-tier gliders (8+)
    if (tier >= 8) {
      const plasmaCount = 12;
      for (let i = 0; i < plasmaCount; i++) {
        const angle = (i / plasmaCount) * Math.PI * 2;
        const dist = 15 + Math.random() * 25;

        this.addParticle(
          {
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
          },
          {
            x: Math.cos(angle) * 2,
            y: Math.sin(angle) * 2,
          },
          30 + Math.random() * 20,
          ThemeManager.lighten(glowColor, 1.3),
          5 + Math.random() * 4
        );
      }
    }

    // Central white flash
    for (let i = 0; i < 8; i++) {
      this.addParticle(
        {
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
        },
        {
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 3,
        },
        12 + Math.random() * 8,
        "#ffffff",
        6 + Math.random() * 4
      );
    }
  }

  /**
   * Set alpha on a hex color
   */
  private setAlpha(color: string, alpha: number): string {
    // Handle rgba format
    if (color.startsWith("rgba")) {
      return color.replace(/[\d.]+\)$/, `${alpha})`);
    }

    // Handle rgb format
    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    }

    // Handle hex format
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
