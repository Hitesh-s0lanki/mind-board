import type { Color, PieceSymbol, Square } from "chess.js";
import type { ChatMessageRecord } from "@/features/chess/game/db";

export type CapturedPiece = {
  by: Color;
  color: Color;
  type: PieceSymbol;
};

export type PendingPromotion = {
  from: Square;
  to: Square;
  color: Color;
};

export type TurnResponse = {
  success: boolean;
  error?: string;
  gameId?: string;
  fen?: string;
  humanMove?: {
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
    san: string;
    lan: string;
  } | null;
  agentMove?: {
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
    san?: string;
    reason: string;
    comment: string;
  };
  gameOver?: boolean;
  chatHistory?: ChatMessageRecord[];
};

export type PlayerNames = {
  white: string;
  black: string;
};

export type AgentProvider =
  | "openai"
  | "claude"
  | "gemini"
  | "qwen";
