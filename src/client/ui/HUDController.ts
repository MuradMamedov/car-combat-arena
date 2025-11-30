import type { CarState, GameState } from "../../shared/index.js";
import { PLAYER_MAX_SHIELD } from "../../shared/index.js";

/**
 * HUD element references
 */
interface HUDElements {
  health1: HTMLElement;
  healthText1: HTMLElement;
  shield1: HTMLElement;
  shieldText1: HTMLElement;
  boost1: HTMLElement;
  score1: HTMLElement;
  name1: HTMLElement;
  health2: HTMLElement;
  healthText2: HTMLElement;
  shield2: HTMLElement;
  shieldText2: HTMLElement;
  boost2: HTMLElement;
  score2: HTMLElement;
  name2: HTMLElement;
  status: HTMLElement;
  winnerText: HTMLElement;
}

/**
 * Manages the heads-up display
 */
export class HUDController {
  private elements: HUDElements;

  constructor(elementIds: {
    health1: string;
    healthText1: string;
    shield1: string;
    shieldText1: string;
    boost1: string;
    score1: string;
    name1: string;
    health2: string;
    healthText2: string;
    shield2: string;
    shieldText2: string;
    boost2: string;
    score2: string;
    name2: string;
    status: string;
    winnerText: string;
  }) {
    this.elements = {
      health1: document.getElementById(elementIds.health1) as HTMLElement,
      healthText1: document.getElementById(
        elementIds.healthText1
      ) as HTMLElement,
      shield1: document.getElementById(elementIds.shield1) as HTMLElement,
      shieldText1: document.getElementById(
        elementIds.shieldText1
      ) as HTMLElement,
      boost1: document.getElementById(elementIds.boost1) as HTMLElement,
      score1: document.getElementById(elementIds.score1) as HTMLElement,
      name1: document.getElementById(elementIds.name1) as HTMLElement,
      health2: document.getElementById(elementIds.health2) as HTMLElement,
      healthText2: document.getElementById(
        elementIds.healthText2
      ) as HTMLElement,
      shield2: document.getElementById(elementIds.shield2) as HTMLElement,
      shieldText2: document.getElementById(
        elementIds.shieldText2
      ) as HTMLElement,
      boost2: document.getElementById(elementIds.boost2) as HTMLElement,
      score2: document.getElementById(elementIds.score2) as HTMLElement,
      name2: document.getElementById(elementIds.name2) as HTMLElement,
      status: document.getElementById(elementIds.status) as HTMLElement,
      winnerText: document.getElementById(elementIds.winnerText) as HTMLElement,
    };
  }

  /**
   * Update HUD from game state
   */
  update(state: GameState): void {
    const players = Object.values(state.players);

    // Assign players by order (first added = player 1, second = player 2)
    // Sort by ID to ensure consistent ordering
    const sortedPlayers = players.sort((a, b) => a.id.localeCompare(b.id));

    const player1 = sortedPlayers[0];
    const player2 = sortedPlayers[1];

    if (player1) {
      this.updatePlayerHUD(player1, 1);
    }

    if (player2) {
      this.updatePlayerHUD(player2, 2);
    }
  }

  /**
   * Update a specific player's HUD elements
   */
  private updatePlayerHUD(player: CarState, playerNum: 1 | 2): void {
    const healthBar =
      playerNum === 1 ? this.elements.health1 : this.elements.health2;
    const healthText =
      playerNum === 1 ? this.elements.healthText1 : this.elements.healthText2;
    const shieldBar =
      playerNum === 1 ? this.elements.shield1 : this.elements.shield2;
    const shieldText =
      playerNum === 1 ? this.elements.shieldText1 : this.elements.shieldText2;
    const boostBar =
      playerNum === 1 ? this.elements.boost1 : this.elements.boost2;
    const scoreEl =
      playerNum === 1 ? this.elements.score1 : this.elements.score2;
    const nameEl = playerNum === 1 ? this.elements.name1 : this.elements.name2;

    const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
    const shieldPercent = Math.max(0, (player.shield / player.maxShield) * 100);
    const boostPercent = Math.max(
      0,
      (player.boostFuel / player.maxBoostFuel) * 100
    );

    healthBar.style.width = `${healthPercent}%`;
    healthText.textContent = Math.max(0, Math.round(player.health)).toString();
    shieldBar.style.width = `${shieldPercent}%`;
    shieldText.textContent = Math.max(0, Math.round(player.shield)).toString();
    boostBar.style.width = `${boostPercent}%`;
    scoreEl.textContent = player.score.toString();

    // Update player name from game state
    if (nameEl && player.displayName) {
      nameEl.textContent = player.displayName;
    }
  }

  /**
   * Set status message
   */
  setStatus(message: string, isWaiting: boolean = false): void {
    this.elements.status.textContent = message;

    if (isWaiting) {
      this.elements.status.classList.add("waiting");
    } else {
      this.elements.status.classList.remove("waiting");
    }
  }

  /**
   * Show winner message
   */
  showWinner(winnerId: string, myPlayerId: string | null): void {
    if (winnerId === "draw") {
      this.elements.winnerText.textContent = "It's a Draw!";
      this.elements.winnerText.style.color = "#ffffff";
    } else if (winnerId === myPlayerId) {
      this.elements.winnerText.textContent = "🏆 You Win!";
      this.elements.winnerText.style.color = "#ffee00";
    } else {
      this.elements.winnerText.textContent = "You Lose!";
      this.elements.winnerText.style.color = "#ff4444";
    }
  }

  /**
   * Reset HUD to initial state
   */
  reset(): void {
    this.elements.health1.style.width = "100%";
    this.elements.health2.style.width = "100%";
    this.elements.healthText1.textContent = "100";
    this.elements.healthText2.textContent = "100";
    this.elements.shield1.style.width = "100%";
    this.elements.shield2.style.width = "100%";
    this.elements.shieldText1.textContent = PLAYER_MAX_SHIELD.toString();
    this.elements.shieldText2.textContent = PLAYER_MAX_SHIELD.toString();
    this.elements.boost1.style.width = "100%";
    this.elements.boost2.style.width = "100%";
    this.elements.score1.textContent = "0";
    this.elements.score2.textContent = "0";
    // Reset names to defaults
    if (this.elements.name1) {
      this.elements.name1.textContent = "Player 1";
    }
    if (this.elements.name2) {
      this.elements.name2.textContent = "Player 2";
    }
  }
}
