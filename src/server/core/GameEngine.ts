import {
  MAX_PLAYERS,
  SHIELD_RECHARGE_RATE,
  TICK_INTERVAL,
  TICKS_PER_NETWORK_UPDATE,
  BOOST_CONSUMPTION_RATE,
  BOOST_RECHARGE_RATE,
  BOOST_RECHARGE_DELAY,
} from "../../shared/constants/index.js";
import type { GameState } from "../../shared/types/index.js";
import type { PlayerData } from "../managers/index.js";
import {
  BoonManager,
  BotManager,
  GameStateManager,
  PlayerManager,
} from "../managers/index.js";
import {
  CollisionSystem,
  CombatSystem,
  PhysicsSystem,
} from "../systems/index.js";

/**
 * Game engine events
 */
export interface GameEngineEvents {
  onGameStart: (state: GameState) => void;
  onGameUpdate: (state: GameState) => void;
  onGameOver: (winnerId: string, state: GameState) => void;
}

/**
 * Core game loop and logic coordinator
 */
export class GameEngine {
  private physicsSystem: PhysicsSystem;
  private collisionSystem: CollisionSystem;
  private combatSystem: CombatSystem;
  private playerManager: PlayerManager;
  private stateManager: GameStateManager;
  private botManager: BotManager;
  private boonManager: BoonManager;
  private events: GameEngineEvents;
  private gameLoopInterval: NodeJS.Timeout | null = null;
  
  // Network optimization: only send state updates every N physics ticks
  private tickCounter: number = 0;

  constructor(
    playerManager: PlayerManager,
    stateManager: GameStateManager,
    botManager: BotManager,
    events: GameEngineEvents
  ) {
    this.playerManager = playerManager;
    this.stateManager = stateManager;
    this.botManager = botManager;
    this.boonManager = new BoonManager();
    this.events = events;

    // Initialize systems
    this.physicsSystem = new PhysicsSystem();
    this.collisionSystem = new CollisionSystem(this.physicsSystem);
    this.combatSystem = new CombatSystem(this.collisionSystem);
  }

  /**
   * Try to start the game
   */
  tryStartGame(): boolean {
    if (this.playerManager.getPlayerCount() !== MAX_PLAYERS) {
      return false;
    }

    this.startGame();
    return true;
  }

  /**
   * Start the game
   */
  private startGame(): void {
    this.stateManager.setStatus("playing");
    this.stateManager.setWinner(null);
    this.stateManager.clearBullets();

    // Generate random walls for this round
    this.stateManager.generateWalls();
    
    // Reset tick counter for network optimization
    this.tickCounter = 0;

    // Notify listeners
    this.events.onGameStart(this.stateManager.getState());

    // Start game loop
    this.startGameLoop();
  }

  /**
   * Start the game loop
   */
  private startGameLoop(): void {
    this.stopGameLoop();
    this.gameLoopInterval = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  /**
   * Stop the game loop
   */
  stopGameLoop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  /**
   * Single game tick
   */
  private tick(): void {
    if (!this.stateManager.isPlaying()) {
      return;
    }

    const state = this.stateManager.getState();

    // Update bot AI - calculate their inputs based on game state
    this.botManager.update(state);

    // Update bot inputs in player manager
    for (const botId of this.botManager.getBotIds()) {
      const botInput = this.botManager.getBotInput(botId);
      this.playerManager.updateInput(botId, botInput);
    }

    // Update each player
    this.updatePlayers(state);

    // Update shields (recharge after delay)
    this.updateShields(state);

    // Update boost fuel (consume when boosting, recharge when not)
    this.updateBoostFuel(state);

    // Update bullets
    this.combatSystem.updateBullets(state);

    // Check car collisions
    const cars = this.stateManager.getAllPlayers().filter((c) => c.health > 0);
    this.collisionSystem.checkAllCarCollisions(cars);

    // Check car-wall collisions
    const walls = this.stateManager.getWalls();
    this.collisionSystem.checkAllCarWallCollisions(cars, walls);

    // Update boons - spawn new ones and remove expired
    this.boonManager.update(walls);
    this.stateManager.setBoons(this.boonManager.getBoons());

    // Check boon pickups
    this.checkBoonPickups(cars);

    // Check win condition
    this.checkWinCondition();

    // Increment tick counter and broadcast state at reduced rate
    // Physics runs at 60 Hz, but network updates only at ~20 Hz (every 3 ticks)
    this.tickCounter++;
    if (this.stateManager.isPlaying() && this.tickCounter >= TICKS_PER_NETWORK_UPDATE) {
      this.tickCounter = 0;
      this.events.onGameUpdate(state);
    }
  }

  /**
   * Update shield recharge for all players
   */
  private updateShields(state: GameState): void {
    const deltaTime = TICK_INTERVAL / 1000; // Convert to seconds

    for (const playerId in state.players) {
      const car = state.players[playerId];
      if (car.health <= 0) continue;

      // Decrement recharge timer
      if (car.shieldRechargeTimer > 0) {
        car.shieldRechargeTimer -= TICK_INTERVAL;
      }

      // Recharge shield if timer expired and shield not full
      if (car.shieldRechargeTimer <= 0 && car.shield < car.maxShield) {
        car.shield = Math.min(
          car.maxShield,
          car.shield + SHIELD_RECHARGE_RATE * deltaTime
        );
      }
    }
  }

  /**
   * Update boost fuel consumption and recharge for all players
   */
  private updateBoostFuel(state: GameState): void {
    const deltaTime = TICK_INTERVAL / 1000; // Convert to seconds

    for (const playerId in state.players) {
      const car = state.players[playerId];
      if (car.health <= 0) continue;

      if (car.isBoosting && car.boostFuel > 0) {
        // Consume boost fuel
        car.boostFuel = Math.max(0, car.boostFuel - BOOST_CONSUMPTION_RATE * deltaTime);
        // Reset recharge timer when boosting
        car.boostRechargeTimer = BOOST_RECHARGE_DELAY;
        
        // If fuel runs out, stop boosting
        if (car.boostFuel <= 0) {
          car.isBoosting = false;
        }
      } else {
        // Not boosting - recharge boost fuel after delay
        if (car.boostRechargeTimer > 0) {
          car.boostRechargeTimer -= TICK_INTERVAL;
        }

        // Recharge boost if timer expired and not full
        if (car.boostRechargeTimer <= 0 && car.boostFuel < car.maxBoostFuel) {
          car.boostFuel = Math.min(
            car.maxBoostFuel,
            car.boostFuel + BOOST_RECHARGE_RATE * deltaTime
          );
        }
      }
    }
  }

  /**
   * Update all players
   */
  private updatePlayers(state: GameState): void {
    const walls = this.stateManager.getWalls();

    for (const playerData of this.playerManager.getAllPlayers()) {
      const car = state.players[playerData.id];
      if (!car || car.health <= 0) continue;

      // Update boost state - only allow boosting if player wants to boost AND has fuel
      car.isBoosting = playerData.input.boost && car.boostFuel > 0;

      // Apply physics
      this.physicsSystem.updateCar(car, playerData.input);

      // Handle shooting - both weapons can fire independently
      // Pass walls to prevent shooting through walls when next to them
      if (playerData.input.shootCannon || playerData.input.shoot) {
        this.combatSystem.tryShootCannon(car, state.bullets, walls);
      }
      if (playerData.input.shootMachineGun) {
        this.combatSystem.tryShootMachineGun(car, state.bullets, walls);
      }
    }
  }

  /**
   * Check boon pickups for all cars
   */
  private checkBoonPickups(
    cars: import("../../shared/types/index.js").CarState[]
  ): void {
    for (const car of cars) {
      const pickup = this.boonManager.checkPickup(car);
      if (pickup) {
        this.boonManager.applyBoonEffect(car, pickup.boon);
        // Update state after pickup
        this.stateManager.setBoons(this.boonManager.getBoons());
      }
    }
  }

  /**
   * Check for win condition
   */
  private checkWinCondition(): void {
    const result = this.stateManager.checkWinCondition();

    if (result.hasWinner && result.winnerId !== null) {
      this.endGame(result.winnerId);
    }
  }

  /**
   * End the game
   */
  private endGame(winnerId: string): void {
    this.stateManager.setStatus("gameover");
    this.stateManager.setWinner(winnerId === "draw" ? null : winnerId);

    this.events.onGameOver(winnerId, this.stateManager.getState());
  }

  /**
   * Handle player joining
   */
  handlePlayerJoin(playerData: PlayerData): void {
    const car = this.playerManager.createCarState(playerData);
    this.stateManager.addPlayer(car);
  }

  /**
   * Handle player leaving
   */
  handlePlayerLeave(playerId: string): void {
    this.stopGameLoop();
    this.stateManager.removePlayer(playerId);
    this.stateManager.setStatus("waiting");
    this.combatSystem.resetPlayer(playerId);

    // If it's a bot, remove from bot manager
    if (this.botManager.isBot(playerId)) {
      this.botManager.removeBot(playerId);
    }
  }

  /**
   * Check if a player is a bot
   */
  isBot(playerId: string): boolean {
    return this.botManager.isBot(playerId);
  }

  /**
   * Restart the game
   */
  restart(): void {
    // Reset player states
    for (const playerData of this.playerManager.getAllPlayers()) {
      const car = this.playerManager.createCarState(playerData);
      this.stateManager.addPlayer(car);
      this.playerManager.resetShootTime(playerData.id);
    }

    this.stateManager.resetForRestart();
    this.combatSystem.reset();
    this.boonManager.reset();

    // Notify listeners
    this.events.onGameStart(this.stateManager.getState());
  }

  /**
   * Check if game is running
   */
  isRunning(): boolean {
    return this.gameLoopInterval !== null;
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return this.stateManager.getState();
  }
}
