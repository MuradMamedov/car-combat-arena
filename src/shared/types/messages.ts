import type { GliderTier } from "../constants/game.js";
import type { PlayerInput } from "./common.js";
import type { PlayerCustomization } from "./customization.js";
import type { GameState } from "./game.js";

/**
 * Bot difficulty levels (shared between client and server)
 */
export type BotDifficultyLevel = "easy" | "medium" | "hard";

/**
 * Multiplayer mode types
 */
export type MultiplayerMode = "bot" | "host" | "join";

/**
 * Re-export GliderTier for convenience
 */
export type { GliderTier };

/**
 * Messages sent from server to client
 */
export type ServerMessage =
  | ServerConnectedMessage
  | ServerWaitingMessage
  | ServerGameStartMessage
  | ServerGameStateMessage
  | ServerGameOverMessage
  | ServerPlayerDisconnectedMessage
  | ServerErrorMessage
  | ServerBotAddedMessage
  | ServerRoomCreatedMessage
  | ServerRoomJoinedMessage
  | ServerRoomErrorMessage
  | ServerMatchmakingStatusMessage
  | ServerMatchFoundMessage;

export interface ServerConnectedMessage {
  readonly type: "connected";
  readonly playerId: string;
}

export interface ServerWaitingMessage {
  readonly type: "waiting";
  readonly message: string;
}

export interface ServerRoomCreatedMessage {
  readonly type: "roomCreated";
  readonly roomCode: string;
}

export interface ServerRoomJoinedMessage {
  readonly type: "roomJoined";
  readonly roomCode: string;
  readonly playerCount: number;
}

export interface ServerRoomErrorMessage {
  readonly type: "roomError";
  readonly message: string;
}

export interface ServerMatchmakingStatusMessage {
  readonly type: "matchmakingStatus";
  readonly status: "searching" | "cancelled";
  readonly queuePosition?: number;
}

export interface ServerMatchFoundMessage {
  readonly type: "matchFound";
  readonly roomCode: string;
}

export interface ServerGameStartMessage {
  readonly type: "gameStart";
  readonly state: GameState;
}

export interface ServerGameStateMessage {
  readonly type: "gameState";
  readonly state: GameState;
}

export interface ServerGameOverMessage {
  readonly type: "gameOver";
  readonly winner: string;
  readonly state: GameState;
}

export interface ServerPlayerDisconnectedMessage {
  readonly type: "playerDisconnected";
  readonly playerId: string;
}

export interface ServerErrorMessage {
  readonly type: "error";
  readonly message: string;
}

export interface ServerBotAddedMessage {
  readonly type: "botAdded";
  readonly botId: string;
}

/**
 * Messages sent from client to server
 */
export type ClientMessage =
  | ClientInputMessage
  | ClientRestartMessage
  | ClientAddBotMessage
  | ClientSelectTierMessage
  | ClientCustomizationMessage
  | ClientCreateRoomMessage
  | ClientJoinRoomMessage
  | ClientLeaveRoomMessage
  | ClientFindMatchMessage
  | ClientCancelMatchmakingMessage;

export interface ClientInputMessage {
  readonly type: "input";
  readonly input: PlayerInput;
}

export interface ClientRestartMessage {
  readonly type: "restart";
}

export interface ClientAddBotMessage {
  readonly type: "addBot";
  readonly difficulty?: BotDifficultyLevel;
  readonly tier?: GliderTier;
}

export interface ClientSelectTierMessage {
  readonly type: "selectTier";
  readonly tier: GliderTier;
}

export interface ClientCustomizationMessage {
  readonly type: "customization";
  readonly customization: PlayerCustomization;
}

export interface ClientCreateRoomMessage {
  readonly type: "createRoom";
  readonly customization?: PlayerCustomization;
  readonly tier?: GliderTier;
}

export interface ClientJoinRoomMessage {
  readonly type: "joinRoom";
  readonly roomCode: string;
  readonly customization?: PlayerCustomization;
  readonly tier?: GliderTier;
}

export interface ClientLeaveRoomMessage {
  readonly type: "leaveRoom";
}

export interface ClientFindMatchMessage {
  readonly type: "findMatch";
  readonly customization?: PlayerCustomization;
  readonly tier?: GliderTier;
}

export interface ClientCancelMatchmakingMessage {
  readonly type: "cancelMatchmaking";
}

/**
 * Type guards for message validation
 */
export const MessageGuards = {
  isClientInputMessage(msg: ClientMessage): msg is ClientInputMessage {
    return msg.type === "input" && "input" in msg;
  },

  isClientRestartMessage(msg: ClientMessage): msg is ClientRestartMessage {
    return msg.type === "restart";
  },
};
