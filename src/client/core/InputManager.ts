import type { PlayerInput, Vector2 } from "../../shared/index.js";
import { createDefaultInput, INPUT_THROTTLE_MS } from "../../shared/index.js";

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
  
  // Input throttling - reduce network traffic by limiting how often we send updates
  private lastInputSendTime: number = 0;
  private pendingNotify: boolean = false;
  private throttleTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastSentInput: PlayerInput | null = null;

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
      this.notifyChange(true); // Immediate for discrete action
    } else if (event.button === 2) {
      // Right click - cannon
      this.rightMouseDown = true;
      this.input.shootCannon = true;
      this.notifyChange(true); // Immediate for discrete action
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
      this.notifyChange(true); // Immediate for discrete action
    } else if (event.button === 2 && this.rightMouseDown) {
      // Right click released - stop cannon
      this.rightMouseDown = false;
      this.input.shootCannon = false;
      this.notifyChange(true); // Immediate for discrete action
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
    this.notifyChange(true); // Immediate for mode change
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
    this.notifyChange(true); // Immediate for mode change
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
    this.notifyChange(); // Throttled - continuous mouse movement
  }

  /**
   * Handle key down event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const action = this.keyToAction.get(event.code);
    if (action && !this.input[action]) {
      this.input[action] = true;
      this.notifyChange(true); // Immediate for discrete action
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
      this.notifyChange(true); // Immediate for discrete action
      event.preventDefault();
    }
  }

  /**
   * Notify listeners of input change with throttling
   * Immediate sends for discrete actions (key presses), throttled for continuous (mouse)
   */
  private notifyChange(immediate: boolean = false): void {
    if (!this.onInputChange) return;
    
    const now = performance.now();
    const timeSinceLastSend = now - this.lastInputSendTime;
    
    // Check if input actually changed (skip duplicate sends)
    const currentInput = { ...this.input };
    if (this.lastSentInput && this.inputsEqual(this.lastSentInput, currentInput)) {
      return;
    }
    
    // Immediate send for discrete actions or if enough time has passed
    if (immediate || timeSinceLastSend >= INPUT_THROTTLE_MS) {
      this.sendInput(currentInput);
      return;
    }
    
    // Schedule a delayed send for throttled updates
    if (!this.pendingNotify) {
      this.pendingNotify = true;
      const delay = INPUT_THROTTLE_MS - timeSinceLastSend;
      
      this.throttleTimeoutId = setTimeout(() => {
        this.pendingNotify = false;
        this.throttleTimeoutId = null;
        // Send the latest input state
        if (this.onInputChange) {
          const latestInput = { ...this.input };
          if (!this.lastSentInput || !this.inputsEqual(this.lastSentInput, latestInput)) {
            this.sendInput(latestInput);
          }
        }
      }, delay);
    }
  }
  
  /**
   * Actually send the input
   */
  private sendInput(inputState: PlayerInput): void {
    this.lastInputSendTime = performance.now();
    this.lastSentInput = { ...inputState };
    if (this.onInputChange) {
      this.onInputChange(inputState);
    }
  }
  
  /**
   * Compare two input states for equality
   */
  private inputsEqual(a: PlayerInput, b: PlayerInput): boolean {
    return (
      a.forward === b.forward &&
      a.backward === b.backward &&
      a.left === b.left &&
      a.right === b.right &&
      a.shoot === b.shoot &&
      a.shootCannon === b.shootCannon &&
      a.shootMachineGun === b.shootMachineGun &&
      a.boost === b.boost &&
      a.useMouseControl === b.useMouseControl &&
      // For targetAngle, consider them equal if both undefined or within small threshold
      (a.targetAngle === b.targetAngle ||
        (a.targetAngle !== undefined &&
          b.targetAngle !== undefined &&
          Math.abs(a.targetAngle - b.targetAngle) < 0.01))
    );
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
    // Clear any pending throttle timeout
    if (this.throttleTimeoutId) {
      clearTimeout(this.throttleTimeoutId);
      this.throttleTimeoutId = null;
    }
    
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
