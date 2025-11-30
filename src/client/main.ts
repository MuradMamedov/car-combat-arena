import { getSoundManager } from "./audio/index.js";
import { GameClient } from "./GameClient.js";

/**
 * Get WebSocket server URL based on current location
 * This allows the game to work on LAN when shared
 */
function getServerUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname || "localhost";
  const port = 8080;
  return `${protocol}//${host}:${port}`;
}

/**
 * Initialize theme switching functionality
 */
function initThemeSelector(): void {
  const themeButtons =
    document.querySelectorAll<HTMLButtonElement>(".theme-btn");
  const savedTheme = localStorage.getItem("gameTheme") || "cyberpunk";

  // Apply saved theme on load
  applyTheme(savedTheme);
  updateActiveButton(savedTheme);

  // Add click handlers to theme buttons
  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme || "cyberpunk";
      applyTheme(theme);
      updateActiveButton(theme);
      localStorage.setItem("gameTheme", theme);
    });
  });

  function applyTheme(theme: string): void {
    // Remove all theme classes
    document.body.classList.remove("theme-retro", "theme-military");
    // Add new theme class (cyberpunk is default, no class needed)
    if (theme !== "cyberpunk") {
      document.body.classList.add(`theme-${theme}`);
    }
  }

  function updateActiveButton(theme: string): void {
    themeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
  }
}

/**
 * Initialize sound toggle functionality
 */
function initSoundToggle(): void {
  const soundBtn = document.getElementById(
    "sound-toggle"
  ) as HTMLButtonElement | null;
  if (!soundBtn) return;

  const soundManager = getSoundManager();

  // Load saved preference
  const savedSound = localStorage.getItem("gameSound");
  if (savedSound === "off") {
    soundManager.setEnabled(false);
    soundBtn.textContent = "🔇";
    soundBtn.classList.add("muted");
    soundBtn.setAttribute("data-tooltip", "Sound Off");
  }

  // Toggle sound on click
  soundBtn.addEventListener("click", () => {
    const isEnabled = soundManager.toggle();

    if (isEnabled) {
      soundBtn.textContent = "🔊";
      soundBtn.classList.remove("muted");
      soundBtn.setAttribute("data-tooltip", "Sound On");
      localStorage.setItem("gameSound", "on");
    } else {
      soundBtn.textContent = "🔇";
      soundBtn.classList.add("muted");
      soundBtn.setAttribute("data-tooltip", "Sound Off");
      localStorage.setItem("gameSound", "off");
    }
  });
}

/**
 * Initialize menu panel navigation (carousel)
 */
function initMenuNavigation(): void {
  const panels = document.querySelectorAll<HTMLElement>(".menu-panel");
  const dots = document.querySelectorAll<HTMLButtonElement>(".panel-dot");
  const leftArrow = document.getElementById("menu-nav-left") as HTMLButtonElement | null;
  const rightArrow = document.getElementById("menu-nav-right") as HTMLButtonElement | null;
  
  if (!panels.length || !leftArrow || !rightArrow) return;
  
  let currentPanel = 1; // Start at center (game options)
  const totalPanels = panels.length;
  
  function showPanel(index: number, direction: "left" | "right" = "right"): void {
    // Clamp index
    if (index < 0) index = 0;
    if (index >= totalPanels) index = totalPanels - 1;
    
    // Skip if already on this panel
    if (index === currentPanel) return;
    
    // Determine animation direction
    const animClass = direction === "left" ? "slide-left" : "";
    
    // Hide all panels and update dots
    panels.forEach((panel, i) => {
      panel.classList.remove("active", "slide-left");
      if (i === index) {
        panel.classList.add("active");
        if (animClass) panel.classList.add(animClass);
      }
    });
    
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
    
    // Update arrow tooltips based on position
    updateArrowHints(index);
    
    currentPanel = index;
  }
  
  function updateArrowHints(index: number): void {
    const panelNames = ["Controls", "Play", "Glider"];
    const leftIndex = Math.max(0, index - 1);
    const rightIndex = Math.min(totalPanels - 1, index + 1);
    
    if (leftArrow) {
      leftArrow.setAttribute("data-tooltip", panelNames[leftIndex]);
      leftArrow.style.opacity = index === 0 ? "0.3" : "1";
      leftArrow.style.pointerEvents = index === 0 ? "none" : "auto";
    }
    
    if (rightArrow) {
      rightArrow.setAttribute("data-tooltip", panelNames[rightIndex]);
      rightArrow.style.opacity = index === totalPanels - 1 ? "0.3" : "1";
      rightArrow.style.pointerEvents = index === totalPanels - 1 ? "none" : "auto";
    }
  }
  
  // Initialize arrow hints
  updateArrowHints(currentPanel);
  
  // Arrow click handlers
  leftArrow.addEventListener("click", () => {
    showPanel(currentPanel - 1, "left");
  });
  
  rightArrow.addEventListener("click", () => {
    showPanel(currentPanel + 1, "right");
  });
  
  // Dot click handlers
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const direction = index < currentPanel ? "left" : "right";
      showPanel(index, direction);
    });
  });
  
  // Keyboard navigation (left/right arrows when not in input)
  document.addEventListener("keydown", (e) => {
    // Only handle when lobby is visible
    const lobby = document.getElementById("lobby");
    if (!lobby || lobby.style.display === "none") return;
    
    // Don't handle if focused on an input/select
    if (document.activeElement?.tagName === "INPUT" || 
        document.activeElement?.tagName === "SELECT") return;
    
    if (e.key === "ArrowLeft") {
      showPanel(currentPanel - 1, "left");
    } else if (e.key === "ArrowRight") {
      showPanel(currentPanel + 1, "right");
    }
  });
}

/**
 * Application entry point
 */
function main(): void {
  // Initialize theme selector
  initThemeSelector();

  // Initialize sound toggle
  initSoundToggle();

  // Initialize menu navigation (carousel)
  initMenuNavigation();

  // Initialize the game client with dynamic server URL
  const client = new GameClient({
    serverUrl: getServerUrl(),
  });

  // Start the client
  client.start();

  // Handle page unload
  window.addEventListener("beforeunload", () => {
    client.destroy();
  });
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
