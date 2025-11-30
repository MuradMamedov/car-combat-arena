import type { Boon, GameState, Wall } from "../../shared/index.js";
import { BOON_EFFECTS, GAME_HEIGHT, GAME_WIDTH } from "../../shared/index.js";
import { getSoundManager, SoundManager } from "../audio/index.js";
import { BackgroundRenderer } from "./BackgroundRenderer.js";
import { BoonRenderer } from "./BoonRenderer.js";
import { BulletRenderer } from "./BulletRenderer.js";
import { CarRenderer } from "./CarRenderer.js";
import { ParticleSystem } from "./ParticleSystem.js";
import { ThemeManager } from "./ThemeManager.js";
import { WallRenderer } from "./WallRenderer.js";

/**
 * Main renderer that orchestrates all rendering subsystems with theme support
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  // Theme management
  private themeManager: ThemeManager;

  // Audio management
  private soundManager: SoundManager;

  // Rendering subsystems
  private particleSystem: ParticleSystem;
  private backgroundRenderer: BackgroundRenderer;
  private carRenderer: CarRenderer;
  private bulletRenderer: BulletRenderer;
  private wallRenderer: WallRenderer;
  private boonRenderer: BoonRenderer;

  // Track bullets to detect new shots
  private knownBulletIds: Set<string> = new Set();

  // Track walls to detect damage and destruction
  private previousWalls: Map<string, Wall> = new Map();

  // Track boons to detect pickups
  private previousBoons: Map<string, Boon> = new Map();

  // Track player states to detect damage
  private previousPlayers: Map<
    string,
    { health: number; shield: number; isBoosting: boolean }
  > = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Initialize theme manager
    this.themeManager = new ThemeManager();
    const themeColors = this.themeManager.getColors();

    // Initialize sound manager
    this.soundManager = getSoundManager();

    // Initialize subsystems with theme colors
    this.particleSystem = new ParticleSystem(themeColors);
    this.backgroundRenderer = new BackgroundRenderer(themeColors);
    this.carRenderer = new CarRenderer(this.particleSystem, themeColors);
    this.bulletRenderer = new BulletRenderer(this.particleSystem, themeColors);
    this.wallRenderer = new WallRenderer(themeColors);
    this.boonRenderer = new BoonRenderer(this.particleSystem, themeColors);

    // Listen for theme changes
    this.themeManager.onThemeChange((colors) => {
      this.particleSystem.setThemeColors(colors);
      this.backgroundRenderer.setThemeColors(colors);
      this.carRenderer.setThemeColors(colors);
      this.bulletRenderer.setThemeColors(colors);
      this.wallRenderer.setThemeColors(colors);
      this.boonRenderer.setThemeColors(colors);
    });
  }

  /**
   * Render a frame
   */
  render(state: GameState, myPlayerId: string | null): void {
    // Detect new shots and trigger reload animations
    this.detectNewShots(state);

    // Detect wall damage and destruction
    this.detectWallChanges(state);

    // Detect boon pickups
    this.detectBoonPickups(state);

    // Detect player damage and boost state changes
    this.detectPlayerChanges(state);

    // Clear and draw background
    this.backgroundRenderer.draw(this.ctx);

    // Draw walls
    this.wallRenderer.drawAll(this.ctx, state.walls);

    // Draw boons
    this.boonRenderer.drawAll(this.ctx, state.boons);

    // Update and draw particles
    this.particleSystem.update();
    this.particleSystem.draw(this.ctx);

    // Draw bullets
    this.bulletRenderer.drawAll(this.ctx, state.bullets);

    // Draw cars
    this.drawCars(state, myPlayerId);
  }

  /**
   * Detect new bullets and trigger reload animations for their owners
   */
  private detectNewShots(state: GameState): void {
    const currentBulletIds = new Set<string>();

    for (const bullet of state.bullets) {
      currentBulletIds.add(bullet.id);

      // Check if this is a new cannon bullet (larger bullets are cannon shots)
      if (!this.knownBulletIds.has(bullet.id) && bullet.size >= 8) {
        // New cannon shot detected - trigger reload animation and sound
        this.carRenderer.onCarShot(bullet.ownerId);
        this.soundManager.play("shoot");
      }
    }

    // Update known bullets (keep only current ones)
    this.knownBulletIds = currentBulletIds;
  }

  /**
   * Detect wall damage and destruction to trigger particle effects
   */
  private detectWallChanges(state: GameState): void {
    const currentWallIds = new Set<string>();

    for (const wall of state.walls) {
      currentWallIds.add(wall.id);

      const previousWall = this.previousWalls.get(wall.id);

      if (previousWall) {
        // Check if wall took damage
        if (wall.health < previousWall.health) {
          // Wall was hit - add hit particles and sound
          this.particleSystem.addWallHitParticles(
            wall.x,
            wall.y,
            wall.material
          );
          this.soundManager.play("wallHit");
        }
      }

      // Update tracked wall state
      this.previousWalls.set(wall.id, { ...wall });
    }

    // Check for destroyed walls
    for (const [wallId, wall] of this.previousWalls.entries()) {
      if (!currentWallIds.has(wallId)) {
        // Wall was destroyed - add destruction particles and sound
        this.particleSystem.addWallDestructionParticles(wall);
        this.soundManager.play("wallDestroy");
        this.previousWalls.delete(wallId);
      }
    }
  }

  /**
   * Detect boon pickups to trigger particle effects
   */
  private detectBoonPickups(state: GameState): void {
    const currentBoonIds = new Set<string>();

    for (const boon of state.boons) {
      currentBoonIds.add(boon.id);

      // Track new boons
      if (!this.previousBoons.has(boon.id)) {
        this.previousBoons.set(boon.id, { ...boon });
      }
    }

    // Check for collected boons
    for (const [boonId, boon] of this.previousBoons.entries()) {
      if (!currentBoonIds.has(boonId)) {
        // Boon was collected - add pickup burst and sound
        const effect = BOON_EFFECTS[boon.type];
        this.particleSystem.addBoonPickupBurst(boon.x, boon.y, effect.color);
        this.soundManager.play("pickup");
        this.previousBoons.delete(boonId);
      }
    }
  }

  /**
   * Detect player damage and boost state changes for sound effects
   */
  private detectPlayerChanges(state: GameState): void {
    for (const player of Object.values(state.players)) {
      const previous = this.previousPlayers.get(player.id);

      if (previous) {
        // Check for shield damage
        if (player.shield < previous.shield) {
          // Shield was hit
          if (player.shield <= 0 && previous.shield > 0) {
            // Shield just broke
            this.soundManager.play("shieldBreak");
          } else {
            // Shield took damage
            this.soundManager.play("shieldHit");
          }
        }

        // Check for health damage
        if (player.health < previous.health) {
          this.soundManager.play("hit");

          // Check if glider was destroyed (health dropped to 0)
          if (player.health <= 0 && previous.health > 0) {
            // Glider destroyed - trigger explosion!
            this.particleSystem.addGliderExplosionParticles(
              player.x,
              player.y,
              player.color,
              player.glowColor || player.color,
              player.tier || 1
            );
            this.soundManager.play("explosion");
          }
        }

        // Check for boost state changes
        if (player.isBoosting && !previous.isBoosting) {
          this.soundManager.startBoost();
        } else if (!player.isBoosting && previous.isBoosting) {
          this.soundManager.stopBoost();
        }
      }

      // Update tracked state
      this.previousPlayers.set(player.id, {
        health: player.health,
        shield: player.shield,
        isBoosting: player.isBoosting,
      });
    }

    // Clean up disconnected players
    for (const playerId of this.previousPlayers.keys()) {
      if (!state.players[playerId]) {
        this.previousPlayers.delete(playerId);
      }
    }
  }

  /**
   * Draw all cars
   */
  private drawCars(state: GameState, myPlayerId: string | null): void {
    const players = Object.values(state.players);

    for (const car of players) {
      const isCurrentPlayer = car.id === myPlayerId;
      this.carRenderer.draw(this.ctx, car, isCurrentPlayer);
    }
  }

  /**
   * Resize canvas
   */
  resize(width: number = GAME_WIDTH, height: number = GAME_HEIGHT): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get rendering context
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Clear all particles
   */
  clearParticles(): void {
    this.particleSystem.clear();
  }

  /**
   * Get current theme name
   */
  getThemeName(): string {
    return this.themeManager.getThemeName();
  }

  /**
   * Get sound manager for external control
   */
  getSoundManager(): SoundManager {
    return this.soundManager;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.themeManager.destroy();
    this.soundManager.stopBoost();
  }
}
