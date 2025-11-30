import {
  BOON_EFFECTS,
  BULLET_SPEED,
  CAR_HEIGHT,
  CAR_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "../../shared/constants/index.js";
import type {
  Boon,
  Bullet,
  CarState,
  GameState,
  PlayerInput,
  Wall,
} from "../../shared/types/index.js";
import { createDefaultInput } from "../../shared/types/index.js";
import { normalizeAngle } from "../../shared/utils/index.js";

/**
 * Bot difficulty levels
 */
export type BotDifficulty = "easy" | "medium" | "hard";

/**
 * Bot personality types - determines playstyle
 */
export type BotPersonality =
  | "aggressive" // Rush enemy, high damage output
  | "defensive" // Use cover, prioritize survival
  | "sniper" // Keep distance, precise shots
  | "flanker" // Circle strafe, attack from angles
  | "opportunist"; // Collect boons, pick fights wisely

/**
 * Tactical states for advanced behavior
 */
export type TacticalState =
  | "engage" // Active combat with enemy
  | "pursue" // Chasing enemy
  | "retreat" // Falling back (low health or outgunned)
  | "seek_cover" // Moving to wall for protection
  | "collect_boon" // Going for a power-up
  | "flank" // Circling around enemy
  | "ambush" // Waiting in cover for enemy
  | "kite" // Attack while backing away
  | "patrol"; // No enemy visible, roaming

/**
 * Bot configuration based on difficulty
 */
interface BotConfig {
  reactionTime: number; // ms delay before reacting
  aimAccuracy: number; // 0-1, how accurate the aiming is
  shootProbability: number; // 0-1, chance to shoot when aligned
  dodgeProbability: number; // 0-1, chance to dodge incoming bullets
  aggressiveness: number; // 0-1, how aggressively the bot pursues
  wallAwareness: number; // 0-1, how well it uses cover
  boonPriority: number; // 0-1, how much it prioritizes boons
  predictionSkill: number; // 0-1, how well it predicts enemy movement
}

/**
 * Personality modifiers that affect base config
 */
const PERSONALITY_MODIFIERS: Record<
  BotPersonality,
  Partial<BotConfig> & { preferredDistance: number; flankTendency: number }
> = {
  aggressive: {
    aggressiveness: 0.95,
    shootProbability: 0.9,
    boonPriority: 0.3,
    preferredDistance: 150,
    flankTendency: 0.2,
  },
  defensive: {
    aggressiveness: 0.3,
    dodgeProbability: 0.9,
    wallAwareness: 0.95,
    preferredDistance: 400,
    flankTendency: 0.1,
  },
  sniper: {
    aimAccuracy: 0.98,
    shootProbability: 0.95,
    aggressiveness: 0.4,
    preferredDistance: 500,
    flankTendency: 0.15,
  },
  flanker: {
    aggressiveness: 0.7,
    wallAwareness: 0.7,
    preferredDistance: 250,
    flankTendency: 0.9,
  },
  opportunist: {
    boonPriority: 0.95,
    wallAwareness: 0.6,
    aggressiveness: 0.5,
    preferredDistance: 350,
    flankTendency: 0.4,
  },
};

/**
 * Bot names based on personality type
 */
const BOT_NAMES: Record<BotPersonality, string[]> = {
  aggressive: [
    "Rampage",
    "Fury",
    "Blitz",
    "Havoc",
    "Chaos",
    "Rage",
    "Crusher",
    "Mayhem",
    "Berserker",
    "Onslaught",
  ],
  defensive: [
    "Sentinel",
    "Guardian",
    "Bastion",
    "Fortress",
    "Shield",
    "Bulwark",
    "Aegis",
    "Rampart",
    "Warden",
    "Protector",
  ],
  sniper: [
    "Hawk",
    "Deadshot",
    "Viper",
    "Scope",
    "Reaper",
    "Phantom",
    "Silencer",
    "Precision",
    "Sharpshooter",
    "Longshot",
  ],
  flanker: [
    "Shadow",
    "Ghost",
    "Specter",
    "Wraith",
    "Rogue",
    "Ninja",
    "Stalker",
    "Serpent",
    "Mirage",
    "Phantom",
  ],
  opportunist: [
    "Scavenger",
    "Prowler",
    "Hunter",
    "Jackal",
    "Vulture",
    "Looter",
    "Seeker",
    "Tracker",
    "Scout",
    "Opportune",
  ],
};

const DIFFICULTY_CONFIGS: Record<BotDifficulty, BotConfig> = {
  easy: {
    reactionTime: 300,
    aimAccuracy: 0.5,
    shootProbability: 0.3,
    dodgeProbability: 0.2,
    aggressiveness: 0.3,
    wallAwareness: 0.2,
    boonPriority: 0.3,
    predictionSkill: 0.2,
  },
  medium: {
    reactionTime: 150,
    aimAccuracy: 0.75,
    shootProbability: 0.6,
    dodgeProbability: 0.5,
    aggressiveness: 0.6,
    wallAwareness: 0.5,
    boonPriority: 0.6,
    predictionSkill: 0.5,
  },
  hard: {
    reactionTime: 50,
    aimAccuracy: 0.95,
    shootProbability: 0.85,
    dodgeProbability: 0.8,
    aggressiveness: 0.85,
    wallAwareness: 0.85,
    boonPriority: 0.8,
    predictionSkill: 0.85,
  },
};

/**
 * Memory entry for tracking enemy behavior
 */
interface EnemyMemory {
  lastSeenPosition: { x: number; y: number };
  lastSeenTime: number;
  averageVelocity: { x: number; y: number };
  shotsFired: number;
  shotsHit: number;
  preferredDistance: number;
}

/**
 * Cover point near a wall
 */
interface CoverPoint {
  x: number;
  y: number;
  wall: Wall;
  quality: number; // 0-1, how good this cover is
}

/**
 * Bot state tracking
 */
interface BotState {
  id: string;
  name: string; // Display name based on personality
  config: BotConfig;
  personality: BotPersonality;
  preferredDistance: number;
  flankTendency: number;
  lastDecisionTime: number;
  currentStrategy: TacticalState;
  previousStrategy: TacticalState;
  strategyStartTime: number;
  targetAngle: number;
  patrolTarget: { x: number; y: number };
  flankDirection: 1 | -1; // Clockwise or counter-clockwise
  flankTimer: number;
  currentCover: CoverPoint | null;
  targetBoon: Boon | null;
  enemyMemory: Map<string, EnemyMemory>;
  stuckTimer: number;
  lastPosition: { x: number; y: number };
  consecutiveHits: number;
  lastHealthChange: number;
}

/**
 * Manages AI-controlled bot players
 */
export class BotManager {
  private bots: Map<string, BotState> = new Map();
  private inputs: Map<string, PlayerInput> = new Map();
  private readonly personalities: BotPersonality[] = [
    "aggressive",
    "defensive",
    "sniper",
    "flanker",
    "opportunist",
  ];

  /**
   * Generate a random name for a bot based on personality
   */
  private generateBotName(personality: BotPersonality): string {
    const names = BOT_NAMES[personality];
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Register a new bot and return the generated name
   */
  addBot(
    botId: string,
    difficulty: BotDifficulty = "medium",
    personality?: BotPersonality
  ): string {
    // Random personality if not specified
    const selectedPersonality =
      personality ||
      this.personalities[Math.floor(Math.random() * this.personalities.length)];

    // Generate a personality-based name
    const botName = this.generateBotName(selectedPersonality);

    // Merge difficulty config with personality modifiers
    const baseConfig = { ...DIFFICULTY_CONFIGS[difficulty] };
    const personalityMods = PERSONALITY_MODIFIERS[selectedPersonality];

    const config: BotConfig = {
      ...baseConfig,
      ...Object.fromEntries(
        Object.entries(personalityMods).filter(
          ([key]) =>
            key !== "preferredDistance" &&
            key !== "flankTendency" &&
            personalityMods[key as keyof BotConfig] !== undefined
        )
      ),
    } as BotConfig;

    const botState: BotState = {
      id: botId,
      name: botName,
      config,
      personality: selectedPersonality,
      preferredDistance: personalityMods.preferredDistance,
      flankTendency: personalityMods.flankTendency,
      lastDecisionTime: 0,
      currentStrategy: "patrol",
      previousStrategy: "patrol",
      strategyStartTime: Date.now(),
      targetAngle: 0,
      patrolTarget: this.generatePatrolPoint(),
      flankDirection: Math.random() > 0.5 ? 1 : -1,
      flankTimer: 0,
      currentCover: null,
      targetBoon: null,
      enemyMemory: new Map(),
      stuckTimer: 0,
      lastPosition: { x: 0, y: 0 },
      consecutiveHits: 0,
      lastHealthChange: Date.now(),
    };

    this.bots.set(botId, botState);
    this.inputs.set(botId, createDefaultInput());

    return botName;
  }

  /**
   * Remove a bot
   */
  removeBot(botId: string): void {
    this.bots.delete(botId);
    this.inputs.delete(botId);
  }

  /**
   * Check if a player is a bot
   */
  isBot(playerId: string): boolean {
    return this.bots.has(playerId);
  }

  /**
   * Get bot input for the current tick
   */
  getBotInput(botId: string): PlayerInput {
    return this.inputs.get(botId) || createDefaultInput();
  }

  /**
   * Update all bot AI decisions based on game state
   */
  update(gameState: GameState): void {
    const now = Date.now();
    const players = Object.values(gameState.players);

    for (const [botId, botState] of this.bots) {
      const botCar = gameState.players[botId];
      if (!botCar || botCar.health <= 0) continue;

      // Check reaction time
      if (now - botState.lastDecisionTime < botState.config.reactionTime) {
        continue;
      }
      botState.lastDecisionTime = now;

      // Update stuck detection
      this.updateStuckDetection(botCar, botState);

      // Find enemy
      const enemy = players.find((p) => p.id !== botId && p.health > 0);

      // Update enemy memory
      if (enemy) {
        this.updateEnemyMemory(enemy, botState);
      }

      // Determine strategy based on full game context
      this.determineAdvancedStrategy(botCar, enemy, gameState, botState);

      // Execute strategy
      this.executeStrategy(botCar, enemy, gameState, botState);
    }
  }

  /**
   * Detect if bot is stuck and needs to unstick
   */
  private updateStuckDetection(bot: CarState, botState: BotState): void {
    const dx = bot.x - botState.lastPosition.x;
    const dy = bot.y - botState.lastPosition.y;
    const moved = Math.sqrt(dx * dx + dy * dy);

    if (moved < 2) {
      botState.stuckTimer++;
    } else {
      botState.stuckTimer = 0;
    }

    botState.lastPosition = { x: bot.x, y: bot.y };
  }

  /**
   * Update memory of enemy behavior
   */
  private updateEnemyMemory(enemy: CarState, botState: BotState): void {
    let memory = botState.enemyMemory.get(enemy.id);

    if (!memory) {
      memory = {
        lastSeenPosition: { x: enemy.x, y: enemy.y },
        lastSeenTime: Date.now(),
        averageVelocity: { x: 0, y: 0 },
        shotsFired: 0,
        shotsHit: 0,
        preferredDistance: 300,
      };
      botState.enemyMemory.set(enemy.id, memory);
    }

    // Smooth velocity tracking
    memory.averageVelocity.x =
      memory.averageVelocity.x * 0.8 + enemy.velocityX * 0.2;
    memory.averageVelocity.y =
      memory.averageVelocity.y * 0.8 + enemy.velocityY * 0.2;
    memory.lastSeenPosition = { x: enemy.x, y: enemy.y };
    memory.lastSeenTime = Date.now();
  }

  /**
   * Advanced strategy determination based on full game context
   */
  private determineAdvancedStrategy(
    bot: CarState,
    enemy: CarState | undefined,
    gameState: GameState,
    botState: BotState
  ): void {
    const config = botState.config;
    const now = Date.now();
    const previousStrategy = botState.currentStrategy;

    // Handle being stuck
    if (botState.stuckTimer > 30) {
      this.setStrategy(botState, "patrol");
      botState.patrolTarget = this.generatePatrolPoint();
      return;
    }

    // No enemy - patrol or collect boons
    if (!enemy) {
      const valuableBoon = this.findValuableBoon(
        bot,
        gameState.boons,
        botState
      );
      if (valuableBoon) {
        botState.targetBoon = valuableBoon;
        this.setStrategy(botState, "collect_boon");
      } else {
        this.setStrategy(botState, "patrol");
      }
      return;
    }

    const healthRatio = bot.health / bot.maxHealth;
    const shieldRatio = bot.shield / bot.maxShield;
    const totalDefense = healthRatio * 0.7 + shieldRatio * 0.3;
    const enemyHealthRatio = enemy.health / enemy.maxHealth;
    const distanceToEnemy = Math.hypot(enemy.x - bot.x, enemy.y - bot.y);
    const dangerousBullets = this.findDangerousBullets(bot, gameState.bullets);

    // Emergency evasion for incoming bullets
    if (
      dangerousBullets.length > 0 &&
      Math.random() < config.dodgeProbability
    ) {
      // Find cover if possible
      if (config.wallAwareness > 0.5 && gameState.walls.length > 0) {
        const cover = this.findBestCover(bot, enemy, gameState.walls);
        if (cover && cover.quality > 0.5) {
          botState.currentCover = cover;
          this.setStrategy(botState, "seek_cover");
          return;
        }
      }
      this.setStrategy(botState, "retreat");
      return;
    }

    // Check for valuable boons nearby
    const valuableBoon = this.findValuableBoon(bot, gameState.boons, botState);
    const boonDistance = valuableBoon
      ? Math.hypot(valuableBoon.x - bot.x, valuableBoon.y - bot.y)
      : Infinity;

    // Prioritize health boon when low
    if (
      valuableBoon &&
      ((healthRatio < 0.4 && valuableBoon.type === "health") ||
        (shieldRatio < 0.3 && valuableBoon.type === "shield"))
    ) {
      if (boonDistance < distanceToEnemy * 0.8) {
        botState.targetBoon = valuableBoon;
        this.setStrategy(botState, "collect_boon");
        return;
      }
    }

    // Opportunist personality: prioritize boons more
    if (
      botState.personality === "opportunist" &&
      valuableBoon &&
      boonDistance < 300 &&
      Math.random() < config.boonPriority
    ) {
      botState.targetBoon = valuableBoon;
      this.setStrategy(botState, "collect_boon");
      return;
    }

    // Critical health - retreat to cover or just retreat
    if (totalDefense < 0.25 && Math.random() > config.aggressiveness * 0.5) {
      if (
        config.wallAwareness > 0.4 &&
        gameState.walls.length > 0 &&
        botState.personality !== "aggressive"
      ) {
        const cover = this.findBestCover(bot, enemy, gameState.walls);
        if (cover) {
          botState.currentCover = cover;
          this.setStrategy(botState, "seek_cover");
          return;
        }
      }
      this.setStrategy(botState, "retreat");
      return;
    }

    // Health disadvantage - consider defensive options
    if (
      enemyHealthRatio > totalDefense + 0.3 &&
      Math.random() > config.aggressiveness
    ) {
      if (
        botState.personality === "defensive" ||
        botState.personality === "sniper"
      ) {
        this.setStrategy(botState, "kite");
        return;
      }
    }

    // Personality-based strategy selection
    switch (botState.personality) {
      case "aggressive":
        if (distanceToEnemy > botState.preferredDistance * 1.5) {
          this.setStrategy(botState, "pursue");
        } else {
          this.setStrategy(botState, "engage");
        }
        break;

      case "defensive":
        if (distanceToEnemy < botState.preferredDistance * 0.6) {
          this.setStrategy(botState, "kite");
        } else if (config.wallAwareness > 0.5 && !botState.currentCover) {
          const cover = this.findBestCover(bot, enemy, gameState.walls);
          if (cover && cover.quality > 0.4) {
            botState.currentCover = cover;
            this.setStrategy(botState, "seek_cover");
          } else {
            this.setStrategy(botState, "engage");
          }
        } else {
          this.setStrategy(botState, "engage");
        }
        break;

      case "sniper":
        if (distanceToEnemy < botState.preferredDistance * 0.7) {
          this.setStrategy(botState, "kite");
        } else if (distanceToEnemy > botState.preferredDistance * 1.3) {
          this.setStrategy(botState, "pursue");
        } else {
          this.setStrategy(botState, "engage");
        }
        break;

      case "flanker":
        // Periodically switch to flanking maneuver
        if (
          Math.random() < botState.flankTendency &&
          now - botState.strategyStartTime > 2000
        ) {
          botState.flankDirection = Math.random() > 0.5 ? 1 : -1;
          this.setStrategy(botState, "flank");
        } else if (previousStrategy === "flank") {
          // Continue flanking for a bit
          if (now - botState.strategyStartTime < 3000) {
            return; // Keep flanking
          }
          this.setStrategy(botState, "engage");
        } else {
          this.setStrategy(botState, "engage");
        }
        break;

      case "opportunist":
        // Already handled boon collection above
        if (totalDefense > enemyHealthRatio) {
          this.setStrategy(botState, "engage");
        } else {
          this.setStrategy(botState, "kite");
        }
        break;

      default:
        this.setStrategy(botState, "engage");
    }
  }

  /**
   * Set strategy and track timing
   */
  private setStrategy(botState: BotState, strategy: TacticalState): void {
    if (botState.currentStrategy !== strategy) {
      botState.previousStrategy = botState.currentStrategy;
      botState.currentStrategy = strategy;
      botState.strategyStartTime = Date.now();
    }
  }

  /**
   * Execute the current strategy
   */
  private executeStrategy(
    bot: CarState,
    enemy: CarState | undefined,
    gameState: GameState,
    botState: BotState
  ): void {
    switch (botState.currentStrategy) {
      case "engage":
        if (enemy) this.engageBehavior(bot, enemy, gameState, botState);
        break;
      case "pursue":
        if (enemy) this.pursueBehavior(bot, enemy, gameState, botState);
        break;
      case "retreat":
        this.retreatBehavior(bot, enemy, gameState, botState);
        break;
      case "seek_cover":
        this.seekCoverBehavior(bot, enemy, gameState, botState);
        break;
      case "collect_boon":
        this.collectBoonBehavior(bot, gameState, botState);
        break;
      case "flank":
        if (enemy) this.flankBehavior(bot, enemy, gameState, botState);
        break;
      case "kite":
        if (enemy) this.kiteBehavior(bot, enemy, gameState, botState);
        break;
      case "ambush":
        this.ambushBehavior(bot, enemy, gameState, botState);
        break;
      case "patrol":
      default:
        this.patrolBehavior(bot, botState);
        break;
    }
  }

  /**
   * Engage behavior - active combat at optimal distance
   */
  private engageBehavior(
    bot: CarState,
    enemy: CarState,
    gameState: GameState,
    botState: BotState
  ): void {
    const config = botState.config;
    const input = this.inputs.get(botState.id)!;

    // Calculate angle to enemy with prediction
    const dx = enemy.x - bot.x;
    const dy = enemy.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Use prediction based on skill
    const leadAngle = this.calculateAdvancedLeadAngle(bot, enemy, botState);
    const targetAngle = leadAngle;

    // Apply aim accuracy jitter
    const jitter = (1 - config.aimAccuracy) * (Math.random() - 0.5) * 0.5;
    botState.targetAngle = targetAngle + jitter;

    // Calculate angle difference
    const angleDiff = normalizeAngle(botState.targetAngle - bot.angle);

    // Turn towards target
    input.left = angleDiff < -0.1;
    input.right = angleDiff > 0.1;

    // Manage distance based on personality
    const optimalDistance = botState.preferredDistance;
    const distanceTolerance = 80;

    // Check for walls in movement path
    const wallAhead = this.checkWallInDirection(
      bot,
      bot.angle,
      100,
      gameState.walls
    );

    if (distance > optimalDistance + distanceTolerance) {
      if (wallAhead) {
        // Strafe around wall
        input.left = !input.left;
        input.right = !input.right;
        input.forward = true;
      } else {
        input.forward = true;
        input.backward = false;
        input.boost = distance > 500 && Math.random() < config.aggressiveness;
      }
    } else if (distance < optimalDistance - distanceTolerance) {
      const wallBehind = this.checkWallInDirection(
        bot,
        bot.angle + Math.PI,
        80,
        gameState.walls
      );
      if (wallBehind) {
        // Strafe instead of backing into wall
        input.forward = true;
        input.left = true;
      } else {
        input.forward = false;
        input.backward = true;
      }
      input.boost = false;
    } else {
      // At optimal distance - circle strafe
      input.forward = true;
      input.backward = false;
      input.boost = false;
    }

    // Shooting logic
    this.handleShooting(bot, enemy, angleDiff, distance, botState, input);
  }

  /**
   * Pursue behavior - chase down enemy aggressively
   */
  private pursueBehavior(
    bot: CarState,
    enemy: CarState,
    gameState: GameState,
    botState: BotState
  ): void {
    const config = botState.config;
    const input = this.inputs.get(botState.id)!;

    const dx = enemy.x - bot.x;
    const dy = enemy.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToEnemy = Math.atan2(dy, dx);

    // Pure pursuit - aim directly at enemy
    const angleDiff = normalizeAngle(angleToEnemy - bot.angle);

    input.left = angleDiff < -0.15;
    input.right = angleDiff > 0.15;

    // Check for walls
    const wallAhead = this.checkWallInDirection(
      bot,
      bot.angle,
      120,
      gameState.walls
    );

    if (wallAhead) {
      // Navigate around wall
      const wallLeft = this.checkWallInDirection(
        bot,
        bot.angle - Math.PI / 4,
        100,
        gameState.walls
      );
      const wallRight = this.checkWallInDirection(
        bot,
        bot.angle + Math.PI / 4,
        100,
        gameState.walls
      );

      if (!wallLeft) {
        input.left = true;
        input.right = false;
      } else if (!wallRight) {
        input.left = false;
        input.right = true;
      }
      input.forward = true;
      input.boost = false;
    } else {
      input.forward = true;
      input.boost = distance > 300 && Math.random() < config.aggressiveness;
    }

    input.backward = false;

    // Fire while pursuing if roughly aligned
    this.handleShooting(bot, enemy, angleDiff, distance, botState, input);
  }

  /**
   * Retreat behavior - back away while defending
   */
  private retreatBehavior(
    bot: CarState,
    enemy: CarState | undefined,
    gameState: GameState,
    botState: BotState
  ): void {
    const input = this.inputs.get(botState.id)!;

    // Find direction away from enemy or toward center
    let retreatAngle: number;

    if (enemy) {
      // Retreat away from enemy
      retreatAngle = Math.atan2(bot.y - enemy.y, bot.x - enemy.x);
    } else {
      // Move toward center if no enemy
      retreatAngle = Math.atan2(
        GAME_HEIGHT / 2 - bot.y,
        GAME_WIDTH / 2 - bot.x
      );
    }

    // Check for walls behind us
    const wallBehind = this.checkWallInDirection(
      bot,
      retreatAngle,
      100,
      gameState.walls
    );

    if (wallBehind) {
      // Strafe instead
      retreatAngle += (Math.PI / 2) * botState.flankDirection;
    }

    const angleDiff = normalizeAngle(retreatAngle - bot.angle);

    // Face away from enemy
    input.left = angleDiff < -0.15;
    input.right = angleDiff > 0.15;
    input.forward = true;
    input.backward = false;
    input.boost = true;

    // Suppress fire while retreating
    input.shoot = false;
    input.shootCannon = false;
    input.shootMachineGun = enemy ? Math.random() < 0.3 : false;
  }

  /**
   * Seek cover behavior - move to cover behind wall
   */
  private seekCoverBehavior(
    bot: CarState,
    enemy: CarState | undefined,
    gameState: GameState,
    botState: BotState
  ): void {
    const input = this.inputs.get(botState.id)!;

    if (!botState.currentCover) {
      // No cover target, fall back to retreat
      this.retreatBehavior(bot, enemy, gameState, botState);
      return;
    }

    const cover = botState.currentCover;
    const dx = cover.x - bot.x;
    const dy = cover.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToCover = Math.atan2(dy, dx);

    if (distance < 30) {
      // Reached cover, switch to engage or ambush
      if (enemy) {
        this.setStrategy(botState, "engage");
      } else {
        this.setStrategy(botState, "ambush");
      }
      return;
    }

    const angleDiff = normalizeAngle(angleToCover - bot.angle);

    input.left = angleDiff < -0.1;
    input.right = angleDiff > 0.1;
    input.forward = true;
    input.backward = false;
    input.boost = distance > 150;

    // Suppress fire while moving to cover
    input.shoot = false;
    input.shootCannon = false;
    input.shootMachineGun = false;
  }

  /**
   * Collect boon behavior - go get power-up
   */
  private collectBoonBehavior(
    bot: CarState,
    gameState: GameState,
    botState: BotState
  ): void {
    const input = this.inputs.get(botState.id)!;

    // Check if target boon still exists
    if (
      !botState.targetBoon ||
      !gameState.boons.find((b) => b.id === botState.targetBoon?.id)
    ) {
      // Boon gone, find new one or patrol
      const newBoon = this.findValuableBoon(bot, gameState.boons, botState);
      if (newBoon) {
        botState.targetBoon = newBoon;
      } else {
        this.setStrategy(botState, "patrol");
        return;
      }
    }

    const boon = botState.targetBoon!;
    const dx = boon.x - bot.x;
    const dy = boon.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToBoon = Math.atan2(dy, dx);
    const angleDiff = normalizeAngle(angleToBoon - bot.angle);

    // Check for walls
    const wallAhead = this.checkWallInDirection(
      bot,
      angleToBoon,
      Math.min(distance, 100),
      gameState.walls
    );

    if (wallAhead) {
      // Navigate around
      const wallLeft = this.checkWallInDirection(
        bot,
        angleToBoon - Math.PI / 4,
        80,
        gameState.walls
      );
      if (!wallLeft) {
        input.left = true;
        input.right = false;
      } else {
        input.left = false;
        input.right = true;
      }
    } else {
      input.left = angleDiff < -0.1;
      input.right = angleDiff > 0.1;
    }

    input.forward = true;
    input.backward = false;
    input.boost = distance > 200;

    // Don't shoot while collecting
    input.shoot = false;
    input.shootCannon = false;
    input.shootMachineGun = false;
  }

  /**
   * Flank behavior - circle around enemy
   */
  private flankBehavior(
    bot: CarState,
    enemy: CarState,
    gameState: GameState,
    botState: BotState
  ): void {
    const input = this.inputs.get(botState.id)!;

    const dx = enemy.x - bot.x;
    const dy = enemy.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToEnemy = Math.atan2(dy, dx);

    // Calculate flanking angle (perpendicular + slight toward enemy)
    const flankOffset = (Math.PI / 2) * botState.flankDirection;
    const approachFactor = 0.2; // Slight approach while flanking
    const flankAngle = angleToEnemy + flankOffset * (1 - approachFactor);

    // Check for walls in flank path
    const wallInPath = this.checkWallInDirection(
      bot,
      flankAngle,
      100,
      gameState.walls
    );

    if (wallInPath) {
      // Reverse flank direction
      botState.flankDirection *= -1;
    }

    const targetAngle =
      angleToEnemy +
      (Math.PI / 2) * botState.flankDirection * (1 - approachFactor);
    const angleDiff = normalizeAngle(targetAngle - bot.angle);

    input.left = angleDiff < -0.1;
    input.right = angleDiff > 0.1;
    input.forward = true;
    input.backward = false;
    input.boost = distance > 400;

    // Keep aiming at enemy while flanking
    const aimAngle = this.calculateAdvancedLeadAngle(bot, enemy, botState);
    const aimDiff = normalizeAngle(aimAngle - bot.angle);

    // Fire while flanking if aligned
    this.handleShooting(bot, enemy, aimDiff, distance, botState, input);
  }

  /**
   * Kite behavior - attack while backing away
   */
  private kiteBehavior(
    bot: CarState,
    enemy: CarState,
    gameState: GameState,
    botState: BotState
  ): void {
    const input = this.inputs.get(botState.id)!;

    const dx = enemy.x - bot.x;
    const dy = enemy.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Aim at enemy for shooting
    const aimAngle = this.calculateAdvancedLeadAngle(bot, enemy, botState);
    const aimDiff = normalizeAngle(aimAngle - bot.angle);

    // Turn to face enemy
    input.left = aimDiff < -0.1;
    input.right = aimDiff > 0.1;

    // Check for walls behind
    const retreatAngle = Math.atan2(bot.y - enemy.y, bot.x - enemy.x);
    const wallBehind = this.checkWallInDirection(
      bot,
      retreatAngle,
      80,
      gameState.walls
    );

    if (distance < botState.preferredDistance * 0.7) {
      // Too close, back away
      if (wallBehind) {
        // Strafe instead
        input.forward = true;
        input.backward = false;
        input.left = true;
      } else {
        input.forward = false;
        input.backward = true;
      }
    } else if (distance > botState.preferredDistance * 1.2) {
      // Too far, approach slightly
      input.forward = true;
      input.backward = false;
    } else {
      // Good distance, strafe
      input.forward = true;
      input.backward = false;
    }

    input.boost = false;

    // Fire while kiting - prioritize accuracy
    this.handleShooting(bot, enemy, aimDiff, distance, botState, input);
  }

  /**
   * Ambush behavior - wait in cover
   */
  private ambushBehavior(
    bot: CarState,
    enemy: CarState | undefined,
    _gameState: GameState,
    botState: BotState
  ): void {
    const input = this.inputs.get(botState.id)!;

    // Stay still and wait
    input.forward = false;
    input.backward = false;
    input.left = false;
    input.right = false;
    input.boost = false;

    if (enemy) {
      const distance = Math.hypot(enemy.x - bot.x, enemy.y - bot.y);

      // Enemy close enough, spring the ambush
      if (distance < 350) {
        this.setStrategy(botState, "engage");
        return;
      }

      // Track enemy while waiting
      const angleToEnemy = Math.atan2(enemy.y - bot.y, enemy.x - bot.x);
      const angleDiff = normalizeAngle(angleToEnemy - bot.angle);
      input.left = angleDiff < -0.1;
      input.right = angleDiff > 0.1;
    }

    // No shooting while ambushing
    input.shoot = false;
    input.shootCannon = false;
    input.shootMachineGun = false;
  }

  /**
   * Handle shooting decisions
   */
  private handleShooting(
    _bot: CarState,
    _enemy: CarState,
    angleDiff: number,
    _distance: number,
    botState: BotState,
    input: PlayerInput
  ): void {
    const config = botState.config;

    // Alignment thresholds based on accuracy
    const alignmentThreshold = 0.3 + (1 - config.aimAccuracy) * 0.5;
    const isAligned = Math.abs(angleDiff) < alignmentThreshold;
    const looseAlignment = Math.abs(angleDiff) < alignmentThreshold * 1.5;

    // Reset weapon inputs
    input.shoot = false;
    input.shootCannon = false;
    input.shootMachineGun = false;

    // Cannon - precise, high damage (best for aligned shots)
    if (isAligned && Math.random() < config.shootProbability) {
      input.shootCannon = true;
      input.shoot = true;
    }

    // Machine gun - suppressive fire (more liberal use)
    if (looseAlignment && Math.random() < config.shootProbability * 1.2) {
      input.shootMachineGun = true;
    }

    // Sniper personality: only shoot when very aligned
    if (botState.personality === "sniper") {
      if (Math.abs(angleDiff) > 0.15) {
        input.shootCannon = false;
        input.shoot = false;
      }
    }

    // Aggressive personality: spray more
    if (botState.personality === "aggressive" && looseAlignment) {
      input.shootMachineGun = true;
    }
  }

  /**
   * Check if there's a wall in a given direction from a position
   */
  private checkWallInDirection(
    bot: CarState,
    direction: number,
    distance: number,
    walls: Wall[]
  ): Wall | null {
    const checkX = bot.x + Math.cos(direction) * distance;
    const checkY = bot.y + Math.sin(direction) * distance;

    for (const wall of walls) {
      // Simple AABB check for the endpoint
      const halfW = wall.width / 2 + CAR_WIDTH / 2;
      const halfH = wall.height / 2 + CAR_HEIGHT / 2;

      if (
        checkX > wall.x - halfW &&
        checkX < wall.x + halfW &&
        checkY > wall.y - halfH &&
        checkY < wall.y + halfH
      ) {
        return wall;
      }

      // Also check midpoint
      const midX = bot.x + Math.cos(direction) * (distance / 2);
      const midY = bot.y + Math.sin(direction) * (distance / 2);

      if (
        midX > wall.x - halfW &&
        midX < wall.x + halfW &&
        midY > wall.y - halfH &&
        midY < wall.y + halfH
      ) {
        return wall;
      }
    }

    return null;
  }

  /**
   * Find the best cover point relative to enemy
   */
  private findBestCover(
    bot: CarState,
    enemy: CarState,
    walls: Wall[]
  ): CoverPoint | null {
    if (walls.length === 0) return null;

    const coverPoints: CoverPoint[] = [];

    for (const wall of walls) {
      // Generate cover points on sides of walls away from enemy
      const wallToEnemy = Math.atan2(enemy.y - wall.y, enemy.x - wall.x);

      // Check each side of the wall
      const offsets = [
        { x: wall.width / 2 + 40, y: 0 },
        { x: -wall.width / 2 - 40, y: 0 },
        { x: 0, y: wall.height / 2 + 40 },
        { x: 0, y: -wall.height / 2 - 40 },
      ];

      for (const offset of offsets) {
        const coverX = wall.x + offset.x;
        const coverY = wall.y + offset.y;

        // Skip if out of bounds
        if (
          coverX < 50 ||
          coverX > GAME_WIDTH - 50 ||
          coverY < 50 ||
          coverY > GAME_HEIGHT - 50
        ) {
          continue;
        }

        // Calculate cover quality
        const distanceFromBot = Math.hypot(coverX - bot.x, coverY - bot.y);
        const angleFromEnemy = Math.atan2(coverY - enemy.y, coverX - enemy.x);
        const angleBehindWall = Math.abs(
          normalizeAngle(angleFromEnemy - wallToEnemy)
        );

        // Good cover is on the opposite side of wall from enemy
        const coverQuality =
          angleBehindWall > Math.PI / 2
            ? 1 - distanceFromBot / 500
            : 0.3 - distanceFromBot / 500;

        if (coverQuality > 0) {
          coverPoints.push({
            x: coverX,
            y: coverY,
            wall,
            quality: Math.max(0, Math.min(1, coverQuality)),
          });
        }
      }
    }

    if (coverPoints.length === 0) return null;

    // Sort by quality and pick the best
    coverPoints.sort((a, b) => b.quality - a.quality);
    return coverPoints[0];
  }

  /**
   * Find the most valuable boon to collect
   */
  private findValuableBoon(
    bot: CarState,
    boons: Boon[],
    botState: BotState
  ): Boon | null {
    if (boons.length === 0) return null;

    const config = botState.config;
    const healthRatio = bot.health / bot.maxHealth;
    const shieldRatio = bot.shield / bot.maxShield;

    let bestBoon: Boon | null = null;
    let bestValue = 0;

    for (const boon of boons) {
      const distance = Math.hypot(boon.x - bot.x, boon.y - bot.y);
      if (distance > 600) continue; // Too far

      // Calculate value based on bot's needs
      let value = 0;

      switch (boon.type) {
        case "health":
          // More valuable when health is low
          value = (1 - healthRatio) * BOON_EFFECTS.health.value;
          break;
        case "shield":
          value = (1 - shieldRatio) * BOON_EFFECTS.shield.value;
          break;
        case "speed":
          value = 30 * config.aggressiveness;
          break;
        case "damage":
          value = 40 * config.aggressiveness;
          break;
        case "rapidfire":
          value = 35 * config.shootProbability;
          break;
      }

      // Adjust for distance (closer is better)
      value *= 1 - distance / 800;

      // Adjust for boon priority
      value *= config.boonPriority;

      if (value > bestValue) {
        bestValue = value;
        bestBoon = boon;
      }
    }

    return bestBoon;
  }

  /**
   * Patrol behavior - move around when no enemy
   */
  private patrolBehavior(bot: CarState, botState: BotState): void {
    const input = this.inputs.get(botState.id)!;

    // Check if reached patrol point
    const dx = botState.patrolTarget.x - bot.x;
    const dy = botState.patrolTarget.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 50) {
      botState.patrolTarget = this.generatePatrolPoint();
    }

    // Move to patrol point
    const angleToTarget = Math.atan2(dy, dx);
    const angleDiff = normalizeAngle(angleToTarget - bot.angle);

    input.left = angleDiff < -0.1;
    input.right = angleDiff > 0.1;
    input.forward = true;
    input.backward = false;
    input.boost = false;
    input.shoot = false;
    input.shootCannon = false;
    input.shootMachineGun = false;
  }

  /**
   * Find bullets that are heading towards the bot
   */
  private findDangerousBullets(bot: CarState, bullets: Bullet[]): Bullet[] {
    const dangerRadius = 120;
    const dangerous: Bullet[] = [];

    for (const bullet of bullets) {
      // Skip own bullets
      if (bullet.ownerId === bot.id) continue;

      // Calculate if bullet is heading towards bot
      const dx = bot.x - bullet.x;
      const dy = bot.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > dangerRadius * 2) continue;

      // Check if bullet is moving towards bot
      const bulletDir = Math.atan2(bullet.velocityY, bullet.velocityX);
      const toBot = Math.atan2(dy, dx);
      const angleDiff = Math.abs(normalizeAngle(bulletDir - toBot));

      // Predict if bullet will hit us
      const bulletSpeed = Math.hypot(bullet.velocityX, bullet.velocityY);
      const timeToHit = distance / bulletSpeed;
      const predictedBulletX = bullet.x + bullet.velocityX * timeToHit;
      const predictedBulletY = bullet.y + bullet.velocityY * timeToHit;
      const missDistance = Math.hypot(
        predictedBulletX - bot.x,
        predictedBulletY - bot.y
      );

      // Bullet will pass close to us
      if (
        (angleDiff < Math.PI / 3 && distance < dangerRadius) ||
        missDistance < 50
      ) {
        dangerous.push(bullet);
      }
    }

    // Sort by time to impact (closest first)
    return dangerous.sort((a, b) => {
      const distA = Math.hypot(bot.x - a.x, bot.y - a.y);
      const distB = Math.hypot(bot.x - b.x, bot.y - b.y);
      const speedA = Math.hypot(a.velocityX, a.velocityY);
      const speedB = Math.hypot(b.velocityX, b.velocityY);
      return distA / speedA - distB / speedB;
    });
  }

  /**
   * Advanced lead angle calculation with prediction skill
   */
  private calculateAdvancedLeadAngle(
    bot: CarState,
    enemy: CarState,
    botState: BotState
  ): number {
    const config = botState.config;
    const memory = botState.enemyMemory.get(enemy.id);

    const dx = enemy.x - bot.x;
    const dy = enemy.y - bot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Base prediction
    const bulletTime = distance / BULLET_SPEED;

    // Use memory for better prediction if available
    let predictedVelX = enemy.velocityX;
    let predictedVelY = enemy.velocityY;

    if (memory && config.predictionSkill > 0.5) {
      // Use smoothed velocity for better prediction
      predictedVelX =
        enemy.velocityX * (1 - config.predictionSkill) +
        memory.averageVelocity.x * config.predictionSkill;
      predictedVelY =
        enemy.velocityY * (1 - config.predictionSkill) +
        memory.averageVelocity.y * config.predictionSkill;
    }

    // Apply prediction skill (lower skill = less prediction)
    const predictionFactor = config.predictionSkill;

    // Predict enemy position
    const predictedX = enemy.x + predictedVelX * bulletTime * predictionFactor;
    const predictedY = enemy.y + predictedVelY * bulletTime * predictionFactor;

    // Clamp to game bounds
    const clampedX = Math.max(50, Math.min(GAME_WIDTH - 50, predictedX));
    const clampedY = Math.max(50, Math.min(GAME_HEIGHT - 50, predictedY));

    return Math.atan2(clampedY - bot.y, clampedX - bot.x);
  }

  /**
   * Generate a random patrol point
   */
  private generatePatrolPoint(): { x: number; y: number } {
    const margin = 100;
    return {
      x: margin + Math.random() * (GAME_WIDTH - margin * 2),
      y: margin + Math.random() * (GAME_HEIGHT - margin * 2),
    };
  }

  /**
   * Get all bot IDs
   */
  getBotIds(): string[] {
    return Array.from(this.bots.keys());
  }

  /**
   * Get bot personality
   */
  getBotPersonality(botId: string): BotPersonality | undefined {
    return this.bots.get(botId)?.personality;
  }

  /**
   * Get bot display name
   */
  getBotName(botId: string): string | undefined {
    return this.bots.get(botId)?.name;
  }

  /**
   * Get bot current strategy
   */
  getBotStrategy(botId: string): TacticalState | undefined {
    return this.bots.get(botId)?.currentStrategy;
  }

  /**
   * Clear all bots
   */
  clear(): void {
    this.bots.clear();
    this.inputs.clear();
  }
}
