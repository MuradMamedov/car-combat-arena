// Common types
export { createDefaultInput } from "./common.js";
export type { Bounds, GameStatus, PlayerInput, Vector2 } from "./common.js";

// Entity types
export { EntityFactory } from "./entities.js";
export type { Boon, Bullet, CarState, Particle, Wall } from "./entities.js";

// Game state types
export { createInitialGameState } from "./game.js";
export type { GameState } from "./game.js";

// Message types
export { MessageGuards } from "./messages.js";
export type {
  BotDifficultyLevel,
  ClientAddBotMessage,
  ClientCreateRoomMessage,
  ClientCustomizationMessage,
  ClientInputMessage,
  ClientJoinRoomMessage,
  ClientLeaveRoomMessage,
  ClientMessage,
  ClientRestartMessage,
  ClientSelectTierMessage,
  MultiplayerMode,
  ServerBotAddedMessage,
  ServerConnectedMessage,
  ServerErrorMessage,
  ServerGameOverMessage,
  ServerGameStartMessage,
  ServerGameStateMessage,
  ServerMessage,
  ServerPlayerDisconnectedMessage,
  ServerRoomCreatedMessage,
  ServerRoomErrorMessage,
  ServerRoomJoinedMessage,
  ServerWaitingMessage,
} from "./messages.js";

// Customization types
export {
  BOOSTER_EFFECT_PRESETS,
  COLOR_PRESETS,
  DEFAULT_CUSTOMIZATION,
  GUN_EFFECT_PRESETS,
  SHAPE_PRESETS,
  getBoosterEffectPreset,
  getColorPreset,
  getGunEffectPreset,
  getShapePreset,
  resolveCustomization,
} from "./customization.js";
export type {
  BoosterEffectPreset,
  ColorPreset,
  GunEffectPreset,
  PlayerCustomization,
  ResolvedCustomization,
  ShapePreset,
} from "./customization.js";
