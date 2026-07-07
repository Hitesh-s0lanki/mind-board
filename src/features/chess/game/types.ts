import type { PieceSymbol, Square } from "chess.js";

export type ChessSide = "White" | "Black";
export type AgentSide = "white" | "black";

export type PieceCode =
  | "WP"
  | "WN"
  | "WB"
  | "WR"
  | "WQ"
  | "WK"
  | "BP"
  | "BN"
  | "BB"
  | "BR"
  | "BQ"
  | "BK";

export type BoardCell = PieceCode | "--";

export type ChessBoard = BoardCell[][];

export type LegalChessMove = {
  from: Square;
  to: Square;
  move: string;
  piece: PieceCode;
  san: string;
  promotion?: PieceSymbol;
};

export interface ChessAgentInput {
  side: AgentSide;
  opponent: AgentSide;
  boardView: string;
  lastMove?: string | null;
  chatHistory: {
    role: "human" | "agent";
    content: string;
  }[];
  validationFeedback?: string;
}

export interface ChessAgentOutput {
  side: AgentSide;
  move: string;
  from: Square;
  to: Square;
  piece: PieceCode;
  reason: string;
  comment: string;
  promotion?: PieceSymbol;
}
