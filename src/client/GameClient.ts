import type { GameState, PlayerCustomization } from "../shared/index.js";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GLIDER_TIERS,
  DEFAULT_CUSTOMIZATION,
  COLOR_PRESETS,
  type GliderTier,
} from "../shared/index.js";
import { getSoundManager, SoundManager } from "./audio/index.js";
import { InputManager } from "./core/InputManager.js";
import { NetworkManager } from "./core/NetworkManager.js";
import { Renderer } from "./rendering/Renderer.js";
import { HUDController } from "./ui/HUDController.js";
import { ScreenManager } from "./ui/ScreenManager.js";

import type { BotDifficultyLevel } from "../shared/index.js";

/**
 * Configuration for the game client
 */
export interface GameClientConfig {
  serverUrl: string;
  canvasId: string;
  elements: {
    lobby: string;
    gameContainer: string;
    status: string;
    gameOver: string;
    winnerText: string;
    restartBtn: string;
    botBtn?: string;
    difficultySelect?: string;
    tierPrev?: string;
    tierNext?: string;
    tierName?: string;
    tierNumber?: string;
    tierPreview?: string;
    // Multiplayer elements
    hostBtn?: string;
    joinBtn?: string;
    roomCodeInput?: string;
    roomCodeDisplay?: string;
    copyCodeBtn?: string;
    leaveRoomBtn?: string;
    multiplayerSection?: string;
    // Random matchmaking elements
    randomBtn?: string;
    matchmakingStatus?: string;
    cancelMatchmakingBtn?: string;
    // Player name input
    playerNameInput?: string;
  };
  hudElements: {
    health1: string;
    healthText1: string;
    shield1: string;
    shieldText1: string;
    score1: string;
    name1: string;
    health2: string;
    healthText2: string;
    shield2: string;
    shieldText2: string;
    score2: string;
    name2: string;
    status: string;
    winnerText: string;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: GameClientConfig = {
  serverUrl: "ws://localhost:8080",
  canvasId: "game-canvas",
  elements: {
    lobby: "lobby",
    gameContainer: "game-container",
    status: "status",
    gameOver: "game-over",
    winnerText: "winner-text",
    restartBtn: "restart-btn",
    botBtn: "bot-btn",
    difficultySelect: "difficulty-select",
    tierPrev: "tier-prev",
    tierNext: "tier-next",
    tierName: "tier-name",
    tierNumber: "tier-number",
    tierPreview: "tier-preview",
    // Multiplayer elements
    hostBtn: "host-btn",
    joinBtn: "join-btn",
    roomCodeInput: "room-code-input",
    roomCodeDisplay: "room-code-display",
    copyCodeBtn: "copy-code-btn",
    leaveRoomBtn: "leave-room-btn",
    multiplayerSection: "multiplayer-section",
    // Random matchmaking elements
    randomBtn: "random-btn",
    matchmakingStatus: "matchmaking-status",
    cancelMatchmakingBtn: "cancel-matchmaking-btn",
    // Player name input
    playerNameInput: "player-name-input",
  },
  hudElements: {
    health1: "health1",
    healthText1: "health-text1",
    shield1: "shield1",
    shieldText1: "shield-text1",
    score1: "score1",
    name1: "player-name1",
    health2: "health2",
    healthText2: "health-text2",
    shield2: "shield2",
    shieldText2: "shield-text2",
    score2: "score2",
    name2: "player-name2",
    status: "status",
    winnerText: "winner-text",
  },
};

/**
 * Main game client orchestrator
 */
export class GameClient {
  private config: GameClientConfig;

  // Core systems
  private networkManager: NetworkManager;
  private inputManager: InputManager;
  private renderer: Renderer;
  private soundManager: SoundManager;

  // UI systems
  private screenManager: ScreenManager;
  private hudController: HUDController;

  // Game state
  private playerId: string | null = null;
  private gameState: GameState | null = null;
  private isRunning = false;
  private animationFrameId: number | null = null;

  // Tier selection
  private selectedTier: GliderTier = 3;
  
  // Customization state
  private customization: PlayerCustomization = { ...DEFAULT_CUSTOMIZATION };

  // Room state
  private currentRoomCode: string | null = null;
  private isInRoom = false;
  private isMatchmaking = false;

  constructor(config: Partial<GameClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize canvas and renderer
    const canvas = document.getElementById(
      this.config.canvasId
    ) as HTMLCanvasElement;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    this.renderer = new Renderer(canvas);

    // Initialize sound manager
    this.soundManager = getSoundManager();

    // Initialize UI
    this.screenManager = new ScreenManager();
    this.setupScreens();

    this.hudController = new HUDController(this.config.hudElements);

    // Initialize input
    this.inputManager = new InputManager();
    this.inputManager.setCanvas(canvas);
    this.inputManager.setOnInputChange((input) => {
      this.networkManager.send({ type: "input", input });
    });
    // Disable input controls until game starts
    this.inputManager.disable();

    // Initialize network
    this.networkManager = new NetworkManager(this.config.serverUrl, {
      onConnected: (playerId) => this.handleConnected(playerId),
      onWaiting: (message) => this.handleWaiting(message),
      onGameStart: (state) => this.handleGameStart(state),
      onGameState: (state) => this.handleGameState(state),
      onGameOver: (winnerId, state) => this.handleGameOver(winnerId, state),
      onPlayerDisconnected: (playerId) =>
        this.handlePlayerDisconnected(playerId),
      onError: (message) => this.handleError(message),
      onConnectionLost: () => this.handleConnectionLost(),
      onBotAdded: (botId) => this.handleBotAdded(botId),
      onRoomCreated: (roomCode) => this.handleRoomCreated(roomCode),
      onRoomJoined: (roomCode, playerCount) => this.handleRoomJoined(roomCode, playerCount),
      onRoomError: (message) => this.handleRoomError(message),
      onMatchmakingStatus: (status, queuePosition) => this.handleMatchmakingStatus(status, queuePosition),
      onMatchFound: (roomCode) => this.handleMatchFound(roomCode),
    });

    // Setup buttons
    this.setupRestartButton();
    this.setupBotButton();
    this.setupTierSelector();
    this.setupCustomization();
    this.setupMultiplayerButtons();
    this.setupMatchmakingButtons();
    this.setupPlayerNameInput();
    
    // Load saved customization from localStorage
    this.loadCustomization();
  }

  /**
   * Start the game client
   */
  start(): void {
    this.hudController.setStatus("Connecting to server...", true);
    this.networkManager.connect();
  }

  /**
   * Set up screen elements
   */
  private setupScreens(): void {
    const { elements } = this.config;

    this.screenManager.registerScreen(
      "lobby",
      document.getElementById(elements.lobby) as HTMLElement
    );
    this.screenManager.registerScreen(
      "game",
      document.getElementById(elements.gameContainer) as HTMLElement
    );
    this.screenManager.registerScreen(
      "gameOver",
      document.getElementById(elements.gameOver) as HTMLElement
    );
  }

  /**
   * Set up restart button handler
   */
  private setupRestartButton(): void {
    const restartBtn = document.getElementById(this.config.elements.restartBtn);
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.networkManager.send({ type: "restart" });
        this.screenManager.hideGameOver();
      });
    }
  }

  /**
   * Set up bot button handler
   */
  private setupBotButton(): void {
    const botBtn = document.getElementById(this.config.elements.botBtn || "");
    const difficultySelect = document.getElementById(
      this.config.elements.difficultySelect || ""
    ) as HTMLSelectElement | null;

    if (botBtn) {
      botBtn.addEventListener("click", () => {
        // First create a room for bot play
        if (!this.isInRoom) {
          this.networkManager.createRoom();
          // Store that we want to add bot after room creation
          botBtn.dataset.pendingBot = "true";
          botBtn.dataset.difficulty = difficultySelect?.value || "medium";
        } else {
          const difficulty =
            (difficultySelect?.value as BotDifficultyLevel) || "medium";
          this.requestBot(difficulty);
        }
      });
    }
  }

  /**
   * Check if player has entered a valid name for multiplayer
   */
  private validatePlayerName(): boolean {
    const playerName = this.customization.displayName?.trim();
    if (!playerName || playerName === "Player") {
      this.hudController.setStatus("Please enter your name in the Glider panel first!", false);
      this.highlightNameInput();
      return false;
    }
    return true;
  }

  /**
   * Highlight the name input to prompt the user
   */
  private highlightNameInput(): void {
    const playerNameInput = document.getElementById(this.config.elements.playerNameInput || "") as HTMLInputElement | null;
    if (playerNameInput) {
      playerNameInput.classList.add("name-required");
      playerNameInput.focus();
      // Navigate to glider panel
      const gliderPanel = document.getElementById("panel-glider");
      if (gliderPanel) {
        // Trigger panel switch to glider panel (panel 2)
        const panelDots = document.querySelectorAll(".panel-dot");
        panelDots.forEach((dot, index) => {
          dot.classList.toggle("active", index === 2);
        });
        const panels = document.querySelectorAll(".menu-panel");
        panels.forEach((panel, index) => {
          panel.classList.toggle("active", index === 2);
        });
      }
      // Remove highlight after animation
      setTimeout(() => {
        playerNameInput.classList.remove("name-required");
      }, 2000);
    }
  }

  /**
   * Set up multiplayer buttons
   */
  private setupMultiplayerButtons(): void {
    const hostBtn = document.getElementById(this.config.elements.hostBtn || "");
    const joinBtn = document.getElementById(this.config.elements.joinBtn || "");
    const roomCodeInput = document.getElementById(this.config.elements.roomCodeInput || "") as HTMLInputElement | null;
    const copyCodeBtn = document.getElementById(this.config.elements.copyCodeBtn || "");
    const leaveRoomBtn = document.getElementById(this.config.elements.leaveRoomBtn || "");

    // Host button
    if (hostBtn) {
      hostBtn.addEventListener("click", () => {
        if (!this.validatePlayerName()) return;
        this.networkManager.createRoom();
        this.hudController.setStatus("Creating room...", true);
      });
    }

    // Join button
    if (joinBtn && roomCodeInput) {
      joinBtn.addEventListener("click", () => {
        if (!this.validatePlayerName()) return;
        const roomCode = roomCodeInput.value.trim();
        if (roomCode) {
          this.networkManager.joinRoom(roomCode);
          this.hudController.setStatus("Joining room...", true);
        } else {
          this.hudController.setStatus("Please enter a room code", false);
        }
      });

      // Also allow pressing Enter to join
      roomCodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          if (!this.validatePlayerName()) return;
          const roomCode = roomCodeInput.value.trim();
          if (roomCode) {
            this.networkManager.joinRoom(roomCode);
            this.hudController.setStatus("Joining room...", true);
          }
        }
      });
    }

    // Copy code button
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener("click", () => {
        if (this.currentRoomCode) {
          navigator.clipboard.writeText(this.currentRoomCode).then(() => {
            copyCodeBtn.textContent = "Copied!";
            setTimeout(() => {
              copyCodeBtn.textContent = "Copy";
            }, 2000);
          });
        }
      });
    }

    // Leave room button
    if (leaveRoomBtn) {
      leaveRoomBtn.addEventListener("click", () => {
        this.networkManager.leaveRoom();
        this.resetRoomState();
        this.hudController.setStatus("Choose a game mode", true);
      });
    }
  }

  /**
   * Set up matchmaking buttons
   */
  private setupMatchmakingButtons(): void {
    const randomBtn = document.getElementById(this.config.elements.randomBtn || "");
    const cancelMatchmakingBtn = document.getElementById(this.config.elements.cancelMatchmakingBtn || "");

    // Random match button
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        if (!this.isMatchmaking && !this.isInRoom) {
          if (!this.validatePlayerName()) return;
          this.networkManager.findMatch();
          this.hudController.setStatus("Searching for opponent...", true);
        }
      });
    }

    // Cancel matchmaking button
    if (cancelMatchmakingBtn) {
      cancelMatchmakingBtn.addEventListener("click", () => {
        if (this.isMatchmaking) {
          this.networkManager.cancelMatchmaking();
        }
      });
    }
  }

  /**
   * Set up player name input handler
   */
  private setupPlayerNameInput(): void {
    const playerNameInput = document.getElementById(this.config.elements.playerNameInput || "") as HTMLInputElement | null;
    
    if (playerNameInput) {
      // Update customization when name changes (on blur or enter)
      playerNameInput.addEventListener("blur", () => {
        this.setPlayerName(playerNameInput.value.trim());
      });
      
      playerNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          playerNameInput.blur();
        }
      });
    }
  }

  /**
   * Set player display name
   */
  private setPlayerName(name: string): void {
    // Use a default if empty
    const displayName = name || "Player";
    this.customization.displayName = displayName;
    this.saveCustomization();
    this.sendCustomization();
  }

  /**
   * Set up tier selector buttons
   */
  private setupTierSelector(): void {
    const tierPrev = document.getElementById(
      this.config.elements.tierPrev || ""
    );
    const tierNext = document.getElementById(
      this.config.elements.tierNext || ""
    );

    if (tierPrev) {
      tierPrev.addEventListener("click", () => {
        if (this.selectedTier > 1) {
          this.setSelectedTier((this.selectedTier - 1) as GliderTier);
        }
      });
    }

    if (tierNext) {
      tierNext.addEventListener("click", () => {
        if (this.selectedTier < 10) {
          this.setSelectedTier((this.selectedTier + 1) as GliderTier);
        }
      });
    }

    // Initialize display
    this.updateTierDisplay();
  }

  /**
   * Set selected tier and update display
   */
  private setSelectedTier(tier: GliderTier): void {
    this.selectedTier = tier;
    this.updateTierDisplay();

    // Send tier selection to server if in room
    if (this.isInRoom) {
      this.networkManager.send({ type: "selectTier", tier });
    }
  }

  /**
   * Update tier display UI
   */
  private updateTierDisplay(): void {
    const tierConfig = GLIDER_TIERS[this.selectedTier];

    // Update tier name
    const tierName = document.getElementById(
      this.config.elements.tierName || ""
    );
    if (tierName) {
      tierName.textContent = tierConfig.name;
      tierName.style.color = tierConfig.primaryColor;
      tierName.style.textShadow = `0 0 10px ${tierConfig.glowColor}`;
    }

    // Update tier number
    const tierNumber = document.getElementById(
      this.config.elements.tierNumber || ""
    );
    if (tierNumber) {
      tierNumber.textContent = `Tier ${this.selectedTier}`;
    }

    // Update preview color
    const tierPreview = document.getElementById(
      this.config.elements.tierPreview || ""
    );
    if (tierPreview) {
      tierPreview.style.setProperty("--tier-color", tierConfig.primaryColor);
      tierPreview.style.borderColor = tierConfig.primaryColor;
      tierPreview.style.boxShadow = `0 0 20px ${tierConfig.glowColor}40`;
    }

    // Update tier selection section colors
    const tierSection = document.querySelector(".tier-selection-section");
    if (tierSection instanceof HTMLElement) {
      tierSection.style.setProperty("--tier-color", tierConfig.primaryColor);
    }

    // Update stats
    this.updateStatBar("stat-health", tierConfig.maxHealth, 250);
    this.updateStatBar("stat-shield", tierConfig.maxShield, 150);
    this.updateStatBar("stat-speed", tierConfig.maxSpeed, 12);
    this.updateStatBar("stat-damage", tierConfig.bulletDamageMultiplier, 2);
  }

  /**
   * Update a stat bar fill percentage
   */
  private updateStatBar(elementId: string, value: number, max: number): void {
    const statFill = document.getElementById(elementId);
    if (statFill) {
      const percent = Math.min((value / max) * 100, 100);
      statFill.style.width = `${percent}%`;
    }
  }

  /**
   * Set up customization UI event handlers
   */
  private setupCustomization(): void {
    // Color preset selection
    const colorOptions = document.querySelectorAll<HTMLElement>('.color-option');
    colorOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const colorId = option.dataset.colorId;
        if (colorId) {
          this.setCustomizationColor(colorId);
          this.updateColorSelection(colorId);
        }
      });
    });

    // Shape preset selection
    const shapeOptions = document.querySelectorAll<HTMLElement>('.shape-option');
    shapeOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const shapeId = option.dataset.shapeId;
        if (shapeId) {
          this.setCustomizationShape(shapeId);
          this.updateShapeSelection(shapeId);
        }
      });
    });

    // Gun effect preset selection
    const gunOptions = document.querySelectorAll<HTMLElement>('.gun-option');
    gunOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const gunId = option.dataset.gunId;
        if (gunId) {
          this.setCustomizationGun(gunId);
          this.updateGunSelection(gunId);
        }
      });
    });

    // Booster effect preset selection
    const boosterOptions = document.querySelectorAll<HTMLElement>('.booster-option');
    boosterOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const boosterId = option.dataset.boosterId;
        if (boosterId) {
          this.setCustomizationBooster(boosterId);
          this.updateBoosterSelection(boosterId);
        }
      });
    });
  }

  /**
   * Load customization from localStorage
   */
  private loadCustomization(): void {
    const saved = localStorage.getItem('gliderCustomization');
    if (saved) {
      try {
        this.customization = { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) };
      } catch {
        this.customization = { ...DEFAULT_CUSTOMIZATION };
      }
    }
    
    // Update UI to reflect loaded customization
    this.updateColorSelection(this.customization.colorPresetId);
    this.updateShapeSelection(this.customization.shapePresetId);
    this.updateGunSelection(this.customization.gunEffectPresetId);
    this.updateBoosterSelection(this.customization.boosterEffectPresetId);
    
    // Restore player name in input
    const playerNameInput = document.getElementById(this.config.elements.playerNameInput || "") as HTMLInputElement | null;
    if (playerNameInput && this.customization.displayName) {
      playerNameInput.value = this.customization.displayName;
    }
  }

  /**
   * Save customization to localStorage
   */
  private saveCustomization(): void {
    localStorage.setItem('gliderCustomization', JSON.stringify(this.customization));
  }

  /**
   * Send customization to server
   */
  private sendCustomization(): void {
    if (this.isInRoom) {
      this.networkManager.send({ type: 'customization', customization: this.customization });
    }
  }

  /**
   * Set customization color preset
   */
  private setCustomizationColor(colorId: string): void {
    this.customization.colorPresetId = colorId;
    this.saveCustomization();
    this.sendCustomization();
  }

  /**
   * Set customization shape preset
   */
  private setCustomizationShape(shapeId: string): void {
    this.customization.shapePresetId = shapeId;
    this.saveCustomization();
    this.sendCustomization();
  }

  /**
   * Set customization gun effect preset
   */
  private setCustomizationGun(gunId: string): void {
    this.customization.gunEffectPresetId = gunId;
    this.saveCustomization();
    this.sendCustomization();
  }

  /**
   * Set customization booster effect preset
   */
  private setCustomizationBooster(boosterId: string): void {
    this.customization.boosterEffectPresetId = boosterId;
    this.saveCustomization();
    this.sendCustomization();
  }

  /**
   * Update color selection UI
   */
  private updateColorSelection(colorId: string): void {
    const options = document.querySelectorAll<HTMLElement>('.color-option');
    options.forEach((opt) => {
      opt.classList.toggle('selected', opt.dataset.colorId === colorId);
    });
    
    // Update the preview
    const preset = COLOR_PRESETS.find(p => p.id === colorId);
    if (preset) {
      const preview = document.getElementById('customization-preview');
      if (preview) {
        preview.style.setProperty('--custom-color', preset.primary);
        preview.style.setProperty('--custom-glow', preset.glow);
      }
    }
  }

  /**
   * Update shape selection UI
   */
  private updateShapeSelection(shapeId: string): void {
    const options = document.querySelectorAll<HTMLElement>('.shape-option');
    options.forEach((opt) => {
      opt.classList.toggle('selected', opt.dataset.shapeId === shapeId);
    });
  }

  /**
   * Update gun effect selection UI
   */
  private updateGunSelection(gunId: string): void {
    const options = document.querySelectorAll<HTMLElement>('.gun-option');
    options.forEach((opt) => {
      opt.classList.toggle('selected', opt.dataset.gunId === gunId);
    });
  }

  /**
   * Update booster effect selection UI
   */
  private updateBoosterSelection(boosterId: string): void {
    const options = document.querySelectorAll<HTMLElement>('.booster-option');
    options.forEach((opt) => {
      opt.classList.toggle('selected', opt.dataset.boosterId === boosterId);
    });
  }

  /**
   * Request a bot opponent
   */
  requestBot(difficulty: BotDifficultyLevel = "medium"): void {
    this.hudController.setStatus("Adding bot opponent...", true);
    // Send customization first, then add bot
    this.sendCustomization();
    // Send tier selection
    this.networkManager.send({ type: "selectTier", tier: this.selectedTier });
    // Include selected tier when adding bot
    this.networkManager.send({
      type: "addBot",
      difficulty,
      tier: this.selectedTier,
    });
  }

  /**
   * Handle bot added event
   */
  private handleBotAdded(_botId: string): void {
    this.hudController.setStatus("Bot added! Starting game...", true);
  }

  /**
   * Handle room created event
   */
  private handleRoomCreated(roomCode: string): void {
    this.currentRoomCode = roomCode;
    this.isInRoom = true;
    
    // Update UI
    this.showRoomCode(roomCode);
    this.updateMultiplayerUI(true);
    
    // Send customization and tier
    this.sendCustomization();
    this.networkManager.send({ type: "selectTier", tier: this.selectedTier });
    
    // Check if we have a pending bot request
    const botBtn = document.getElementById(this.config.elements.botBtn || "");
    if (botBtn && botBtn.dataset.pendingBot === "true") {
      const difficulty = (botBtn.dataset.difficulty as BotDifficultyLevel) || "medium";
      delete botBtn.dataset.pendingBot;
      delete botBtn.dataset.difficulty;
      this.requestBot(difficulty);
    } else {
      this.hudController.setStatus(`Room created! Share code: ${roomCode}`, true);
    }
  }

  /**
   * Handle room joined event
   */
  private handleRoomJoined(roomCode: string, _playerCount: number): void {
    this.currentRoomCode = roomCode;
    this.isInRoom = true;
    
    // Update UI
    this.showRoomCode(roomCode);
    this.updateMultiplayerUI(true);
    
    // Send customization and tier
    this.sendCustomization();
    this.networkManager.send({ type: "selectTier", tier: this.selectedTier });
    
    this.hudController.setStatus(`Joined room ${roomCode}!`, true);
  }

  /**
   * Handle room error event
   */
  private handleRoomError(message: string): void {
    this.hudController.setStatus(message, false);
  }

  /**
   * Handle matchmaking status event
   */
  private handleMatchmakingStatus(status: "searching" | "cancelled", _queuePosition?: number): void {
    if (status === "searching") {
      this.isMatchmaking = true;
      this.updateMatchmakingUI(true);
    } else if (status === "cancelled") {
      this.isMatchmaking = false;
      this.updateMatchmakingUI(false);
      this.hudController.setStatus("Matchmaking cancelled. Choose a game mode.", true);
    }
  }

  /**
   * Handle match found event
   */
  private handleMatchFound(roomCode: string): void {
    this.isMatchmaking = false;
    this.currentRoomCode = roomCode;
    this.isInRoom = true;
    
    this.updateMatchmakingUI(false);
    this.showRoomCode(roomCode);
    this.updateMultiplayerUI(true);
    
    // Send customization and tier
    this.sendCustomization();
    this.networkManager.send({ type: "selectTier", tier: this.selectedTier });
    
    this.hudController.setStatus("Match found! Starting game...", true);
  }

  /**
   * Update matchmaking UI
   */
  private updateMatchmakingUI(searching: boolean): void {
    const randomBtn = document.getElementById(this.config.elements.randomBtn || "");
    const matchmakingStatus = document.getElementById(this.config.elements.matchmakingStatus || "");
    const hostBtn = document.getElementById(this.config.elements.hostBtn || "");
    const joinSection = document.querySelector(".join-section");
    const multiplayerDivider = document.querySelector(".multiplayer-divider");

    if (searching) {
      // Show matchmaking status, hide other buttons
      if (randomBtn) randomBtn.style.display = "none";
      if (matchmakingStatus) matchmakingStatus.style.display = "flex";
      if (hostBtn) hostBtn.style.display = "none";
      if (joinSection) (joinSection as HTMLElement).style.display = "none";
      if (multiplayerDivider) (multiplayerDivider as HTMLElement).style.display = "none";
    } else {
      // Hide matchmaking status, show buttons
      if (randomBtn) randomBtn.style.display = "block";
      if (matchmakingStatus) matchmakingStatus.style.display = "none";
      if (hostBtn) hostBtn.style.display = "block";
      if (joinSection) (joinSection as HTMLElement).style.display = "flex";
      if (multiplayerDivider) (multiplayerDivider as HTMLElement).style.display = "flex";
    }
  }

  /**
   * Show room code in UI
   */
  private showRoomCode(roomCode: string): void {
    const roomCodeDisplay = document.getElementById(this.config.elements.roomCodeDisplay || "");
    if (roomCodeDisplay) {
      roomCodeDisplay.textContent = roomCode;
      roomCodeDisplay.parentElement?.classList.add("visible");
    }
  }

  /**
   * Reset room state
   */
  private resetRoomState(): void {
    this.currentRoomCode = null;
    this.isInRoom = false;
    this.isMatchmaking = false;
    this.updateMultiplayerUI(false);
    this.updateMatchmakingUI(false);
    
    const roomCodeDisplay = document.getElementById(this.config.elements.roomCodeDisplay || "");
    if (roomCodeDisplay) {
      roomCodeDisplay.textContent = "";
      roomCodeDisplay.parentElement?.classList.remove("visible");
    }
  }

  /**
   * Update multiplayer UI based on room state
   */
  private updateMultiplayerUI(inRoom: boolean): void {
    const hostBtn = document.getElementById(this.config.elements.hostBtn || "");
    const roomCodeInput = document.getElementById(this.config.elements.roomCodeInput || "") as HTMLInputElement | null;
    const leaveRoomBtn = document.getElementById(this.config.elements.leaveRoomBtn || "");
    const roomCodeContainer = document.querySelector(".room-code-container");
    const joinSection = document.querySelector(".join-section");

    if (inRoom) {
      // Hide join UI, show room info
      if (hostBtn) hostBtn.style.display = "none";
      if (joinSection) (joinSection as HTMLElement).style.display = "none";
      if (leaveRoomBtn) leaveRoomBtn.style.display = "block";
      if (roomCodeContainer) (roomCodeContainer as HTMLElement).style.display = "flex";
    } else {
      // Show join UI, hide room info
      if (hostBtn) hostBtn.style.display = "block";
      if (joinSection) (joinSection as HTMLElement).style.display = "flex";
      if (leaveRoomBtn) leaveRoomBtn.style.display = "none";
      if (roomCodeContainer) (roomCodeContainer as HTMLElement).style.display = "none";
      if (roomCodeInput) roomCodeInput.value = "";
    }
  }

  /**
   * Handle connected event
   */
  private handleConnected(playerId: string): void {
    this.playerId = playerId;
    this.hudController.setStatus("Connected! Choose a game mode.", true);
  }

  /**
   * Handle waiting event
   */
  private handleWaiting(message: string): void {
    this.hudController.setStatus(message, true);
    this.screenManager.showLobby();
  }

  /**
   * Handle game start event
   */
  private handleGameStart(state: GameState): void {
    this.gameState = state;
    this.screenManager.showGameScreen(false);
    this.hudController.reset();
    this.updateInputCarPosition();
    this.soundManager.play("gameStart");
    // Enable input controls when entering the game map
    this.inputManager.enable();
    this.startGameLoop();
  }

  /**
   * Handle game state update
   */
  private handleGameState(state: GameState): void {
    this.gameState = state;
    this.hudController.update(state);
    this.updateInputCarPosition();
  }

  /**
   * Update the input manager with the current player's car position
   */
  private updateInputCarPosition(): void {
    if (this.playerId && this.gameState) {
      const myPlayer = this.gameState.players[this.playerId];
      if (myPlayer) {
        this.inputManager.updateCarPosition({ x: myPlayer.x, y: myPlayer.y });
      }
    }
  }

  /**
   * Handle game over event
   */
  private handleGameOver(winnerId: string, state: GameState): void {
    this.gameState = state;
    this.hudController.showWinner(winnerId, this.playerId);
    this.screenManager.showGameOver();

    // Play appropriate sound based on win/loss
    if (winnerId === this.playerId) {
      this.soundManager.play("victory");
    } else {
      this.soundManager.play("gameOver");
    }

    // Stop any ongoing sounds
    this.soundManager.stopBoost();
    
    // Disable input controls when game is over
    this.inputManager.disable();
  }

  /**
   * Handle player disconnected event
   */
  private handlePlayerDisconnected(_playerId: string): void {
    this.hudController.setStatus(
      "Opponent disconnected. Waiting for new player...",
      true
    );
    this.screenManager.showLobby();
    this.stopGameLoop();
    // Disable input controls when returning to lobby
    this.inputManager.disable();
  }

  /**
   * Handle error event
   */
  private handleError(message: string): void {
    this.hudController.setStatus(message, false);
  }

  /**
   * Handle connection lost
   */
  private handleConnectionLost(): void {
    this.hudController.setStatus("Disconnected. Refresh to reconnect.", false);
    this.screenManager.showLobby();
    this.stopGameLoop();
    this.resetRoomState();
    // Disable input controls when returning to lobby
    this.inputManager.disable();
  }

  /**
   * Start the render loop
   */
  private startGameLoop(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.gameLoop();
  }

  /**
   * Stop the render loop
   */
  private stopGameLoop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) return;

    if (this.gameState && this.gameState.gameStatus !== "waiting") {
      this.renderer.render(this.gameState, this.playerId);
    }

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopGameLoop();
    this.networkManager.disconnect();
    this.inputManager.destroy();
    this.soundManager.stopBoost();
  }
}
