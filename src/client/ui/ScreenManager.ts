/**
 * Available screens in the game
 */
export type ScreenName = "lobby" | "game" | "gameOver";

/**
 * Manages screen visibility and transitions
 */
export class ScreenManager {
  private screens: Map<ScreenName, HTMLElement> = new Map();
  private currentScreen: ScreenName | null = null;

  /**
   * Register a screen element
   */
  registerScreen(name: ScreenName, element: HTMLElement): void {
    this.screens.set(name, element);
  }

  /**
   * Show a specific screen, hiding all others
   */
  showScreen(name: ScreenName): void {
    // Hide all screens
    this.screens.forEach((element, screenName) => {
      if (screenName === name) {
        element.style.display = "block";
      } else if (screenName !== "gameOver") {
        // GameOver is special - it's an overlay
        element.style.display = "none";
      }
    });

    this.currentScreen = name;
  }

  /**
   * Show game screen with optional game over overlay
   */
  showGameScreen(showGameOver: boolean = false): void {
    const lobby = this.screens.get("lobby");
    const game = this.screens.get("game");
    const gameOver = this.screens.get("gameOver");

    if (lobby) lobby.style.display = "none";
    if (game) game.style.display = "block";
    if (gameOver) gameOver.style.display = showGameOver ? "block" : "none";

    this.currentScreen = showGameOver ? "gameOver" : "game";
  }

  /**
   * Show lobby screen
   */
  showLobby(): void {
    this.showScreen("lobby");
    const gameOver = this.screens.get("gameOver");
    if (gameOver) gameOver.style.display = "none";
  }

  /**
   * Show game over overlay
   */
  showGameOver(): void {
    const gameOver = this.screens.get("gameOver");
    if (gameOver) {
      gameOver.style.display = "block";
    }
    this.currentScreen = "gameOver";
  }

  /**
   * Hide game over overlay
   */
  hideGameOver(): void {
    const gameOver = this.screens.get("gameOver");
    if (gameOver) {
      gameOver.style.display = "none";
    }
    if (this.currentScreen === "gameOver") {
      this.currentScreen = "game";
    }
  }

  /**
   * Get current screen
   */
  getCurrentScreen(): ScreenName | null {
    return this.currentScreen;
  }

  /**
   * Get screen element
   */
  getScreen(name: ScreenName): HTMLElement | undefined {
    return this.screens.get(name);
  }
}
