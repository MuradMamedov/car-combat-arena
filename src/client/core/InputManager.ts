import type { PlayerInput, Vector2 } from "../../shared/index.js";
import { createDefaultInput } from "../../shared/index.js";

/**
 * Key binding configuration
 */
export interface KeyBindings {
  forward: string[];
  backward: string[];
  left: string[];
  right: string[];
  shoot: string[];
  shootCannon: string[];
  shootMachineGun: string[];
  boost: string[];
}

/**
 * Default key bindings
 * Space = Cannon (slow, high damage)
 * Q / Left Click = Machine Gun (rapid fire, low damage)
 */
const DEFAULT_KEY_BINDINGS: KeyBindings = {
  forward: ["KeyW", "ArrowUp"],
  backward: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  shoot: [], // Legacy - deprecated
  shootCannon: ["Space"],
  shootMachineGun: ["KeyQ", "KeyE"],
  boost: ["ShiftLeft", "ShiftRight"],
};

/**
 * Input change callback
 */
export type InputChangeCallback = (input: PlayerInput) => void;

/**
 * Boolean input keys that can be mapped to keyboard
 */
type BooleanInputKey =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "shoot"
  | "shootCannon"
  | "shootMachineGun"
  | "boost";

/**
 * Manages keyboard and mouse input for the game
 */
export class InputManager {
  private input: PlayerInput;
  private keyBindings: KeyBindings;
  private keyToAction: Map<string, BooleanInputKey>;
  private onInputChange: InputChangeCallback | null = null;
  private enabled = true;

  // Mouse control state
  private canvas: HTMLCanvasElement | null = null;
  private mousePosition: Vector2 = { x: 0, y: 0 };
  private carPosition: Vector2 | null = null;
  private isMouseOnCanvas = false;
  private leftMouseDown = false;
  private rightMouseDown = false;

  // Bound event handlers for cleanup
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleContextMenu: (e: MouseEvent) => void;
  private boundHandleMouseEnter: () => void;
  private boundHandleMouseLeave: () => void;

  constructor(keyBindings: KeyBindings = DEFAULT_KEY_BINDINGS) {
    this.input = createDefaultInput();
    this.keyBindings = keyBindings;
    this.keyToAction = this.buildKeyMap();

    // Bind handlers
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleContextMenu = this.handleContextMenu.bind(this);
    this.boundHandleMouseEnter = this.handleMouseEnter.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);

    this.setupEventListeners();
  }

  /**
   * Build a map from key codes to actions
   */
  private buildKeyMap(): Map<string, BooleanInputKey> {
    const map = new Map<string, BooleanInputKey>();

    for (const [action, keys] of Object.entries(this.keyBindings)) {
      for (const key of keys) {
        map.set(key, action as BooleanInputKey);
      }
    }

    return map;
  }

  /**
   * Set up keyboard event listeners
   */
  private setupEventListeners(): void {
    document.addEventListener("keydown", this.boundHandleKeyDown);
    document.addEventListener("keyup", this.boundHandleKeyUp);
  }

  /**
   * Set canvas for mouse input handling
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    // Remove old canvas listeners if any
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.boundHandleMouseMove);
      this.canvas.removeEventListener("mousedown", this.boundHandleMouseDown);
      this.canvas.removeEventListener("mouseup", this.boundHandleMouseUp);
      this.canvas.removeEventListener(
        "contextmenu",
        this.boundHandleContextMenu
      );
      this.canvas.removeEventListener("mouseenter", this.boundHandleMouseEnter);
      this.canvas.removeEventListener("mouseleave", this.boundHandleMouseLeave);
    }

    this.canvas = canvas;

    // Add new canvas listeners
    this.canvas.addEventListener("mousemove", this.boundHandleMouseMove);
    this.canvas.addEventListener("mousedown", this.boundHandleMouseDown);
    this.canvas.addEventListener("mouseup", this.boundHandleMouseUp);
    this.canvas.addEventListener("contextmenu", this.boundHandleContextMenu);
    this.canvas.addEventListener("mouseenter", this.boundHandleMouseEnter);
    this.canvas.addEventListener("mouseleave", this.boundHandleMouseLeave);

    // Also listen for mouseup on document in case mouse is released outside canvas
    document.addEventListener("mouseup", this.boundHandleMouseUp);
  }

  /**
   * Update car position for angle calculation
   */
  updateCarPosition(position: Vector2): void {
    this.carPosition = position;
    this.updateTargetAngle();
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.enabled || !this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    // Scale mouse position if canvas is scaled
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.mousePosition = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };

    this.updateTargetAngle();
  }

  /**
   * Handle mouse down event
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.enabled) return;

    if (event.button === 0) {
      // Left click - machine gun
      this.leftMouseDown = true;
      this.input.shootMachineGun = true;
      this.notifyChange();
    } else if (event.button === 2) {
      // Right click - cannon
      this.rightMouseDown = true;
      this.input.shootCannon = true;
      this.notifyChange();
    }
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.enabled) return;

    if (event.button === 0 && this.leftMouseDown) {
      // Left click released - stop machine gun
      this.leftMouseDown = false;
      this.input.shootMachineGun = false;
      this.notifyChange();
    } else if (event.button === 2 && this.rightMouseDown) {
      // Right click released - stop cannon
      this.rightMouseDown = false;
      this.input.shootCannon = false;
      this.notifyChange();
    }
  }

  /**
   * Prevent context menu on right click
   */
  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  /**
   * Handle mouse entering canvas
   */
  private handleMouseEnter(): void {
    this.isMouseOnCanvas = true;
    this.input.useMouseControl = true;
    this.notifyChange();
  }

  /**
   * Handle mouse leaving canvas
   */
  private handleMouseLeave(): void {
    this.isMouseOnCanvas = false;
    this.input.useMouseControl = false;
    this.input.targetAngle = undefined;
    // Release any held mouse buttons
    if (this.leftMouseDown) {
      this.leftMouseDown = false;
      this.input.shootMachineGun = false;
    }
    if (this.rightMouseDown) {
      this.rightMouseDown = false;
      this.input.shootCannon = false;
    }
    this.notifyChange();
  }

  /**
   * Update target angle based on mouse and car position
   */
  private updateTargetAngle(): void {
    if (!this.isMouseOnCanvas || !this.carPosition) {
      this.input.targetAngle = undefined;
      this.input.useMouseControl = false;
      return;
    }

    // Calculate angle from car to mouse
    const dx = this.mousePosition.x - this.carPosition.x;
    const dy = this.mousePosition.y - this.carPosition.y;
    this.input.targetAngle = Math.atan2(dy, dx);
    this.input.useMouseControl = true;
    this.notifyChange();
  }

  /**
   * Handle key down event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const action = this.keyToAction.get(event.code);
    if (action && !this.input[action]) {
      this.input[action] = true;
      this.notifyChange();
      event.preventDefault();
    }
  }

  /**
   * Handle key up event
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const action = this.keyToAction.get(event.code);
    if (action) {
      this.input[action] = false;
      this.notifyChange();
      event.preventDefault();
    }
  }

  /**
   * Notify listeners of input change
   */
  private notifyChange(): void {
    if (this.onInputChange) {
      this.onInputChange({ ...this.input });
    }
  }

  /**
   * Set input change callback
   */
  setOnInputChange(callback: InputChangeCallback): void {
    this.onInputChange = callback;
  }

  /**
   * Get current input state
   */
  getInput(): PlayerInput {
    return { ...this.input };
  }

  /**
   * Enable input handling
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable input handling
   */
  disable(): void {
    this.enabled = false;
    this.reset();
  }

  /**
   * Reset all input to default
   */
  reset(): void {
    this.input = createDefaultInput();
    this.leftMouseDown = false;
    this.rightMouseDown = false;
  }

  /**
   * Update key bindings
   */
  updateKeyBindings(bindings: Partial<KeyBindings>): void {
    this.keyBindings = { ...this.keyBindings, ...bindings };
    this.keyToAction = this.buildKeyMap();
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener("keydown", this.boundHandleKeyDown);
    document.removeEventListener("keyup", this.boundHandleKeyUp);
    document.removeEventListener("mouseup", this.boundHandleMouseUp);

    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.boundHandleMouseMove);
      this.canvas.removeEventListener("mousedown", this.boundHandleMouseDown);
      this.canvas.removeEventListener("mouseup", this.boundHandleMouseUp);
      this.canvas.removeEventListener(
        "contextmenu",
        this.boundHandleContextMenu
      );
      this.canvas.removeEventListener("mouseenter", this.boundHandleMouseEnter);
      this.canvas.removeEventListener("mouseleave", this.boundHandleMouseLeave);
    }
  }
}
