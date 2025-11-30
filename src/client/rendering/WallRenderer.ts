import type { WallMaterial } from "../../shared/constants/game.js";
import type { Wall } from "../../shared/index.js";
import type { ThemeColors } from "./ThemeManager.js";
import { ThemeManager } from "./ThemeManager.js";

/**
 * Theme-specific wall color palettes
 */
interface WallThemePalette {
  concrete: { base: string[]; highlight: string; shadow: string };
  wood: {
    base: string[];
    highlight: string;
    shadow: string;
    grain: string;
    knots: string;
  };
  metal: {
    base: string[];
    highlight: string;
    shadow: string;
    shine: string;
    rivet: string;
  };
  glass: { base: string; glow: string; reflection: string; border: string };
}

/**
 * Renders walls in the game arena with material-specific and theme-aware styles
 */
export class WallRenderer {
  private themeColors: ThemeColors;
  private wallPalette: WallThemePalette;

  constructor(themeColors: ThemeColors) {
    this.themeColors = themeColors;
    this.wallPalette = this.createWallPalette();
  }

  /**
   * Update theme colors and regenerate palette
   */
  setThemeColors(colors: ThemeColors): void {
    this.themeColors = colors;
    this.wallPalette = this.createWallPalette();
  }

  /**
   * Create wall color palette based on current theme
   */
  private createWallPalette(): WallThemePalette {
    const { primaryAccent, wallTint, wallGlowColor } = this.themeColors;

    return {
      concrete: {
        base: [
          this.blendWithTint("#5a6268", wallTint, 0.1),
          this.blendWithTint("#6b7280", wallTint, 0.1),
          this.blendWithTint("#4b5563", wallTint, 0.1),
        ],
        highlight: ThemeManager.withAlpha(primaryAccent, 0.15),
        shadow: "#4b5563",
      },
      wood: {
        base: [
          this.blendWithTint("#7c4a1c", wallTint, 0.08),
          this.blendWithTint("#92400e", wallTint, 0.08),
          this.blendWithTint("#a3541a", wallTint, 0.08),
        ],
        highlight: ThemeManager.withAlpha(primaryAccent, 0.2),
        shadow: "#5c3310",
        grain: "rgba(0, 0, 0, 0.2)",
        knots: "#5c3310",
      },
      metal: {
        base: [
          this.blendWithTint("#1f2937", wallTint, 0.12),
          this.blendWithTint("#4b5563", wallTint, 0.12),
          this.blendWithTint("#6b7280", wallTint, 0.12),
        ],
        highlight: ThemeManager.withAlpha(primaryAccent, 0.25),
        shadow: "#111827",
        shine: ThemeManager.withAlpha(primaryAccent, 0.15),
        rivet: this.blendWithTint("#6b7280", wallTint, 0.1),
      },
      glass: {
        base: ThemeManager.withAlpha(primaryAccent, 0.3),
        glow: ThemeManager.withAlpha(primaryAccent, 0.4),
        reflection: ThemeManager.withAlpha(wallGlowColor, 0.5),
        border: primaryAccent,
      },
    };
  }

  /**
   * Blend a color with a tint color
   */
  private blendWithTint(
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
   * Convert hex color to RGB object
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
   * Draw a single wall with material-specific styling
   */
  draw(ctx: CanvasRenderingContext2D, wall: Wall): void {
    const { x, y, width, height, material, health, maxHealth } = wall;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const damagePercent = 1 - health / maxHealth;

    // Draw wall shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(x - halfWidth + 4, y - halfHeight + 4, width, height);

    // Draw material-specific wall
    switch (material) {
      case "concrete":
        this.drawConcreteWall(ctx, x, y, width, height, damagePercent);
        break;
      case "wood":
        this.drawWoodWall(ctx, x, y, width, height, damagePercent);
        break;
      case "metal":
        this.drawMetalWall(ctx, x, y, width, height, damagePercent);
        break;
      case "glass":
        this.drawGlassWall(ctx, x, y, width, height, damagePercent);
        break;
    }

    // Draw damage cracks overlay
    if (damagePercent > 0.1) {
      this.drawDamageCracks(ctx, x, y, width, height, damagePercent, material);
    }
  }

  /**
   * Draw concrete wall - rough gray texture with weathering
   */
  private drawConcreteWall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    _damagePercent: number
  ): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const palette = this.wallPalette.concrete;

    // Base gradient with theme tint
    const gradient = ctx.createLinearGradient(
      x - halfWidth,
      y - halfHeight,
      x + halfWidth,
      y + halfHeight
    );
    gradient.addColorStop(0, palette.base[0]);
    gradient.addColorStop(0.3, palette.base[1]);
    gradient.addColorStop(0.7, palette.base[0]);
    gradient.addColorStop(1, palette.base[2]);

    ctx.fillStyle = gradient;
    ctx.fillRect(x - halfWidth, y - halfHeight, width, height);

    // Add concrete texture (small speckles)
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let i = 0; i < 15; i++) {
      const speckleX = x - halfWidth + Math.random() * width;
      const speckleY = y - halfHeight + Math.random() * height;
      ctx.fillRect(speckleX, speckleY, 2, 2);
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let i = 0; i < 10; i++) {
      const speckleX = x - halfWidth + Math.random() * width;
      const speckleY = y - halfHeight + Math.random() * height;
      ctx.fillRect(speckleX, speckleY, 3, 3);
    }

    // Border with subtle 3D effect
    ctx.strokeStyle = palette.shadow;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - halfWidth, y - halfHeight, width, height);

    // Top/left highlight with theme color
    ctx.strokeStyle = palette.highlight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - halfWidth + 1, y + halfHeight - 1);
    ctx.lineTo(x - halfWidth + 1, y - halfHeight + 1);
    ctx.lineTo(x + halfWidth - 1, y - halfHeight + 1);
    ctx.stroke();
  }

  /**
   * Draw wood wall - warm brown with grain patterns
   */
  private drawWoodWall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    _damagePercent: number
  ): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const palette = this.wallPalette.wood;

    // Base wood color with theme tint
    const gradient = ctx.createLinearGradient(
      x - halfWidth,
      y - halfHeight,
      x + halfWidth,
      y + halfHeight
    );
    gradient.addColorStop(0, palette.base[0]);
    gradient.addColorStop(0.2, palette.base[1]);
    gradient.addColorStop(0.5, palette.base[2]);
    gradient.addColorStop(0.8, palette.base[1]);
    gradient.addColorStop(1, palette.base[0]);

    ctx.fillStyle = gradient;
    ctx.fillRect(x - halfWidth, y - halfHeight, width, height);

    // Wood grain lines
    ctx.strokeStyle = palette.grain;
    ctx.lineWidth = 1;
    const isHorizontal = width > height;
    const grainCount = isHorizontal
      ? Math.floor(height / 5)
      : Math.floor(width / 5);

    for (let i = 0; i < grainCount; i++) {
      const offset = (i / grainCount) * (isHorizontal ? height : width);
      ctx.beginPath();
      if (isHorizontal) {
        ctx.moveTo(x - halfWidth + 2, y - halfHeight + offset);
        ctx.bezierCurveTo(
          x - halfWidth + width * 0.3,
          y - halfHeight + offset + (Math.random() - 0.5) * 4,
          x - halfWidth + width * 0.7,
          y - halfHeight + offset + (Math.random() - 0.5) * 4,
          x + halfWidth - 2,
          y - halfHeight + offset
        );
      } else {
        ctx.moveTo(x - halfWidth + offset, y - halfHeight + 2);
        ctx.bezierCurveTo(
          x - halfWidth + offset + (Math.random() - 0.5) * 4,
          y - halfHeight + height * 0.3,
          x - halfWidth + offset + (Math.random() - 0.5) * 4,
          y - halfHeight + height * 0.7,
          x - halfWidth + offset,
          y + halfHeight - 2
        );
      }
      ctx.stroke();
    }

    // Knots in wood
    ctx.fillStyle = palette.knots;
    const knotCount = Math.floor(Math.max(width, height) / 40);
    for (let i = 0; i < knotCount; i++) {
      const knotX = x - halfWidth + 10 + Math.random() * (width - 20);
      const knotY = y - halfHeight + 5 + Math.random() * (height - 10);
      ctx.beginPath();
      ctx.ellipse(knotX, knotY, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border
    ctx.strokeStyle = palette.shadow;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - halfWidth, y - halfHeight, width, height);

    // Highlight with theme color
    ctx.strokeStyle = palette.highlight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - halfWidth + 1, y + halfHeight - 1);
    ctx.lineTo(x - halfWidth + 1, y - halfHeight + 1);
    ctx.lineTo(x + halfWidth - 1, y - halfHeight + 1);
    ctx.stroke();
  }

  /**
   * Draw metal wall - dark steel with rivets and shine
   */
  private drawMetalWall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    _damagePercent: number
  ): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const palette = this.wallPalette.metal;

    // Metal gradient with theme-tinted shine
    const gradient = ctx.createLinearGradient(
      x - halfWidth,
      y - halfHeight,
      x + halfWidth,
      y + halfHeight
    );
    gradient.addColorStop(0, palette.base[0]);
    gradient.addColorStop(0.3, palette.base[1]);
    gradient.addColorStop(0.5, palette.base[2]);
    gradient.addColorStop(0.7, palette.base[1]);
    gradient.addColorStop(1, palette.base[0]);

    ctx.fillStyle = gradient;
    ctx.fillRect(x - halfWidth, y - halfHeight, width, height);

    // Metallic shine streak with theme color
    const shineGradient = ctx.createLinearGradient(
      x - halfWidth,
      y - halfHeight,
      x + halfWidth * 0.3,
      y - halfHeight + height * 0.3
    );
    shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    shineGradient.addColorStop(0.5, palette.shine);
    shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = shineGradient;
    ctx.fillRect(x - halfWidth, y - halfHeight, width * 0.4, height * 0.4);

    // Rivets with theme tint
    ctx.fillStyle = palette.base[1];
    const rivetSize = 3;
    const rivetSpacing = 25;
    const startX = x - halfWidth + 8;
    const startY = y - halfHeight + 8;
    const endX = x + halfWidth - 8;
    const endY = y + halfHeight - 8;

    // Corner rivets
    const rivetPositions = [
      [startX, startY],
      [endX, startY],
      [startX, endY],
      [endX, endY],
    ];

    // Add rivets along edges for longer walls
    if (width > 60) {
      for (
        let rx = startX + rivetSpacing;
        rx < endX - rivetSpacing / 2;
        rx += rivetSpacing
      ) {
        rivetPositions.push([rx, startY]);
        rivetPositions.push([rx, endY]);
      }
    }
    if (height > 60) {
      for (
        let ry = startY + rivetSpacing;
        ry < endY - rivetSpacing / 2;
        ry += rivetSpacing
      ) {
        rivetPositions.push([startX, ry]);
        rivetPositions.push([endX, ry]);
      }
    }

    for (const [rx, ry] of rivetPositions) {
      // Rivet shadow
      ctx.fillStyle = palette.shadow;
      ctx.beginPath();
      ctx.arc(rx + 1, ry + 1, rivetSize, 0, Math.PI * 2);
      ctx.fill();
      // Rivet body
      ctx.fillStyle = palette.rivet;
      ctx.beginPath();
      ctx.arc(rx, ry, rivetSize, 0, Math.PI * 2);
      ctx.fill();
      // Rivet highlight with theme color
      ctx.fillStyle = palette.highlight;
      ctx.beginPath();
      ctx.arc(rx - 1, ry - 1, rivetSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border with bevel effect
    ctx.strokeStyle = palette.shadow;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - halfWidth, y - halfHeight, width, height);
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - halfWidth + 1,
      y - halfHeight + 1,
      width - 2,
      height - 2
    );
  }

  /**
   * Draw glass wall - transparent with theme-colored reflections
   */
  private drawGlassWall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    _damagePercent: number
  ): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const palette = this.wallPalette.glass;

    // Semi-transparent base with theme color
    ctx.fillStyle = palette.base;
    ctx.fillRect(x - halfWidth, y - halfHeight, width, height);

    // Inner glow gradient with theme color
    const gradient = ctx.createLinearGradient(
      x - halfWidth,
      y - halfHeight,
      x + halfWidth,
      y + halfHeight
    );
    gradient.addColorStop(0, palette.glow);
    gradient.addColorStop(
      0.5,
      ThemeManager.withAlpha(this.themeColors.primaryAccent, 0.2)
    );
    gradient.addColorStop(1, palette.glow);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - halfWidth + 2, y - halfHeight + 2, width - 4, height - 4);

    // Reflection streaks with theme secondary color
    ctx.strokeStyle = palette.reflection;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - halfWidth + 5, y - halfHeight + 5);
    ctx.lineTo(
      x - halfWidth + 5 + Math.min(width, height) * 0.3,
      y - halfHeight + 5 + Math.min(width, height) * 0.3
    );
    ctx.stroke();

    ctx.strokeStyle = ThemeManager.withAlpha(
      this.themeColors.wallGlowColor,
      0.3
    );
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - halfWidth + 10, y - halfHeight + 5);
    ctx.lineTo(
      x - halfWidth + 10 + Math.min(width, height) * 0.2,
      y - halfHeight + 5 + Math.min(width, height) * 0.2
    );
    ctx.stroke();

    // Border with theme-colored glow
    ctx.shadowColor = palette.border;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - halfWidth, y - halfHeight, width, height);
    ctx.shadowBlur = 0;

    // Inner border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - halfWidth + 3,
      y - halfHeight + 3,
      width - 6,
      height - 6
    );
  }

  /**
   * Draw damage cracks overlay with theme-influenced colors
   */
  private drawDamageCracks(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    damagePercent: number,
    material: WallMaterial
  ): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Determine crack color based on material
    let crackColor: string;
    let crackWidth: number;
    switch (material) {
      case "concrete":
        crackColor = "rgba(30, 30, 30, 0.8)";
        crackWidth = 2;
        break;
      case "wood":
        crackColor = "rgba(50, 30, 10, 0.9)";
        crackWidth = 2;
        break;
      case "metal":
        crackColor = "rgba(20, 20, 20, 0.7)";
        crackWidth = 1;
        break;
      case "glass":
        crackColor = "rgba(255, 255, 255, 0.9)";
        crackWidth = 1;
        break;
    }

    const crackCount = Math.floor(damagePercent * 8) + 1;
    ctx.strokeStyle = crackColor;
    ctx.lineWidth = crackWidth;

    // Use seeded random for consistent crack patterns
    const seed = x * 1000 + y;
    const seededRandom = (offset: number) => {
      const val = Math.sin(seed + offset) * 10000;
      return val - Math.floor(val);
    };

    for (let i = 0; i < crackCount; i++) {
      const startX = x - halfWidth + seededRandom(i * 10) * width;
      const startY = y - halfHeight + seededRandom(i * 10 + 1) * height;

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // Create jagged crack line
      let currentX = startX;
      let currentY = startY;
      const segments = 3 + Math.floor(damagePercent * 4);

      for (let j = 0; j < segments; j++) {
        const angle = seededRandom(i * 100 + j) * Math.PI * 2;
        const length = 5 + seededRandom(i * 100 + j + 50) * 15 * damagePercent;
        currentX += Math.cos(angle) * length;
        currentY += Math.sin(angle) * length;

        // Keep within bounds
        currentX = Math.max(x - halfWidth, Math.min(x + halfWidth, currentX));
        currentY = Math.max(y - halfHeight, Math.min(y + halfHeight, currentY));

        ctx.lineTo(currentX, currentY);
      }
      ctx.stroke();

      // Add branch cracks at higher damage
      if (damagePercent > 0.5 && material !== "metal") {
        ctx.lineWidth = crackWidth * 0.5;
        for (let k = 0; k < 2; k++) {
          const branchX = x - halfWidth + seededRandom(i * 200 + k) * width;
          const branchY =
            y - halfHeight + seededRandom(i * 200 + k + 1) * height;
          ctx.beginPath();
          ctx.moveTo(branchX, branchY);
          const branchAngle = seededRandom(i * 200 + k + 2) * Math.PI * 2;
          ctx.lineTo(
            branchX + Math.cos(branchAngle) * 10,
            branchY + Math.sin(branchAngle) * 10
          );
          ctx.stroke();
        }
        ctx.lineWidth = crackWidth;
      }
    }

    // Add debris/dust particles at high damage
    if (damagePercent > 0.6) {
      const debrisColor =
        material === "glass"
          ? ThemeManager.withAlpha(this.themeColors.primaryAccent, 0.6)
          : "rgba(80, 80, 80, 0.5)";
      ctx.fillStyle = debrisColor;
      const debrisCount = Math.floor(damagePercent * 6);
      for (let i = 0; i < debrisCount; i++) {
        const debrisX = x - halfWidth + seededRandom(i * 300) * width;
        const debrisY = y - halfHeight + seededRandom(i * 300 + 1) * height;
        ctx.fillRect(debrisX, debrisY, 2, 2);
      }
    }

    // Theme-colored damage indicator glow at very high damage
    if (damagePercent > 0.75) {
      ctx.fillStyle = ThemeManager.withAlpha(
        this.themeColors.secondaryAccent,
        (damagePercent - 0.75) * 0.3
      );
      ctx.fillRect(x - halfWidth, y - halfHeight, width, height);
    }
  }

  /**
   * Draw all walls
   */
  drawAll(ctx: CanvasRenderingContext2D, walls: Wall[]): void {
    for (const wall of walls) {
      this.draw(ctx, wall);
    }
  }
}
