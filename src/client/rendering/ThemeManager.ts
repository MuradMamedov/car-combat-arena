/**
 * Theme color definitions for canvas rendering
 * Maps CSS theme variables to canvas-friendly colors
 */
export interface ThemeColors {
  // Primary colors
  primaryAccent: string;
  secondaryAccent: string;
  highlight: string;
  winColor: string;

  // Background colors
  darkBg: string;
  darkSurface: string;
  gridColor: string;

  // Text colors
  textColor: string;
  textMuted: string;

  // Player-specific colors
  player1Color: string;
  player2Color: string;

  // Effect colors
  shieldColor: string;
  boostFlameCore: string;
  boostFlameOuter: string;

  // Wall material tints (multiplied with base material colors)
  wallTint: string;
  wallGlowColor: string;
}

/**
 * Theme presets for each available theme
 */
const THEME_PRESETS: Record<string, ThemeColors> = {
  // Cyberpunk theme (default)
  cyberpunk: {
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
  },

  // Military tactical theme
  military: {
    primaryAccent: "#7fba00",
    secondaryAccent: "#ff6600",
    highlight: "#ffa500",
    winColor: "#00ff00",
    darkBg: "#0d1117",
    darkSurface: "#161b22",
    gridColor: "rgba(127, 186, 0, 0.06)",
    textColor: "#c9d1d9",
    textMuted: "rgba(201, 209, 217, 0.6)",
    player1Color: "#7fba00",
    player2Color: "#ff6600",
    shieldColor: "#4a9f00",
    boostFlameCore: "#7fba00",
    boostFlameOuter: "#ff6600",
    wallTint: "#7fba00",
    wallGlowColor: "#ff6600",
  },

  // Retro arcade theme
  retro: {
    primaryAccent: "#39ff14",
    secondaryAccent: "#ff3131",
    highlight: "#ffd700",
    winColor: "#ffffff",
    darkBg: "#1a0a2e",
    darkSurface: "#2d1b4e",
    gridColor: "rgba(57, 255, 20, 0.08)",
    textColor: "#f0e6d3",
    textMuted: "rgba(240, 230, 211, 0.6)",
    player1Color: "#39ff14",
    player2Color: "#ff3131",
    shieldColor: "#39ff14",
    boostFlameCore: "#ffd700",
    boostFlameOuter: "#ff3131",
    wallTint: "#39ff14",
    wallGlowColor: "#ffd700",
  },
};

/**
 * Manages theme colors for canvas rendering
 * Reads CSS variables and provides theme-appropriate colors
 */
export class ThemeManager {
  private currentTheme: string = "cyberpunk";
  private colors: ThemeColors = THEME_PRESETS.cyberpunk;
  private listeners: Array<(colors: ThemeColors) => void> = [];
  private observer: MutationObserver | null = null;

  constructor() {
    this.detectTheme();
    this.setupObserver();
  }

  /**
   * Detect current theme from body classes
   */
  private detectTheme(): void {
    const body = document.body;

    if (body.classList.contains("theme-military")) {
      this.currentTheme = "military";
    } else if (body.classList.contains("theme-retro")) {
      this.currentTheme = "retro";
    } else {
      this.currentTheme = "cyberpunk";
    }

    this.colors = { ...THEME_PRESETS[this.currentTheme] };
  }

  /**
   * Setup MutationObserver to detect theme changes
   */
  private setupObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const oldTheme = this.currentTheme;
          this.detectTheme();

          if (oldTheme !== this.currentTheme) {
            this.notifyListeners();
          }
        }
      }
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  /**
   * Get current theme colors
   */
  getColors(): ThemeColors {
    return this.colors;
  }

  /**
   * Get current theme name
   */
  getThemeName(): string {
    return this.currentTheme;
  }

  /**
   * Add listener for theme changes
   */
  onThemeChange(callback: (colors: ThemeColors) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove theme change listener
   */
  removeListener(callback: (colors: ThemeColors) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.colors);
    }
  }

  /**
   * Cleanup observer
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.listeners = [];
  }

  /**
   * Utility: Adjust color opacity
   */
  static withAlpha(color: string, alpha: number): string {
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

  /**
   * Utility: Lighten a color
   */
  static lighten(color: string, amount: number): string {
    const hex = color.replace("#", "");
    const r = Math.min(
      255,
      Math.floor(parseInt(hex.substring(0, 2), 16) * amount)
    );
    const g = Math.min(
      255,
      Math.floor(parseInt(hex.substring(2, 4), 16) * amount)
    );
    const b = Math.min(
      255,
      Math.floor(parseInt(hex.substring(4, 6), 16) * amount)
    );
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Utility: Darken a color
   */
  static darken(color: string, amount: number): string {
    const hex = color.replace("#", "");
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * amount);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * amount);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
