import { GAME_HEIGHT, GAME_WIDTH } from "../../shared/index.js";
import type { ThemeColors } from "./ThemeManager.js";
import { ThemeManager } from "./ThemeManager.js";

/**
 * Renders the game background and arena with theme-aware colors
 */
export class BackgroundRenderer {
  private gridOffset = 0;
  private gridSpeed = 0.3;
  private gridSize = 50;
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
   * Clear the canvas with background color
   */
  clear(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.themeColors.darkBg;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  /**
   * Draw animated background grid
   */
  drawGrid(ctx: CanvasRenderingContext2D): void {
    this.gridOffset = (this.gridOffset + this.gridSpeed) % this.gridSize;

    ctx.strokeStyle = this.themeColors.gridColor;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = this.gridOffset; x < GAME_WIDTH; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = this.gridOffset; y < GAME_HEIGHT; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }
  }

  /**
   * Draw center circle decoration
   */
  drawCenterCircle(ctx: CanvasRenderingContext2D): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Circle - use primary accent with low opacity
    ctx.strokeStyle = ThemeManager.withAlpha(
      this.themeColors.primaryAccent,
      0.15
    );
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot - use primary accent with medium opacity
    ctx.fillStyle = ThemeManager.withAlpha(this.themeColors.primaryAccent, 0.3);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw arena border
   */
  drawArenaBorder(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT);
    gradient.addColorStop(0, this.themeColors.primaryAccent);
    gradient.addColorStop(0.5, this.themeColors.secondaryAccent);
    gradient.addColorStop(1, this.themeColors.primaryAccent);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);
  }

  /**
   * Draw corner decorations
   */
  drawCorners(ctx: CanvasRenderingContext2D): void {
    this.drawCorner(ctx, 0, 0, 1, 1);
    this.drawCorner(ctx, GAME_WIDTH, 0, -1, 1);
    this.drawCorner(ctx, 0, GAME_HEIGHT, 1, -1);
    this.drawCorner(ctx, GAME_WIDTH, GAME_HEIGHT, -1, -1);
  }

  /**
   * Draw a single corner decoration
   */
  private drawCorner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dirX: number,
    dirY: number
  ): void {
    const size = 60;
    // Use highlight color for corners
    ctx.strokeStyle = this.themeColors.highlight;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x, y + size * dirY);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size * dirX, y);
    ctx.stroke();
  }

  /**
   * Draw complete background
   */
  draw(ctx: CanvasRenderingContext2D): void {
    this.clear(ctx);
    this.drawGrid(ctx);
    this.drawCenterCircle(ctx);
    this.drawArenaBorder(ctx);
    this.drawCorners(ctx);
  }
}
