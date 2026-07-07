import { type Chess, type Color, type PieceSymbol } from "chess.js";
import type { BoardCell, ChessBoard, ChessSide, PieceCode } from "./types";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const pieceLetters: Record<PieceSymbol, Uppercase<PieceSymbol>> = {
  p: "P",
  n: "N",
  b: "B",
  r: "R",
  q: "Q",
  k: "K",
};

export function sideFromColor(color: Color): ChessSide {
  return color === "w" ? "White" : "Black";
}

export function oppositeSide(side: ChessSide): ChessSide {
  return side === "White" ? "Black" : "White";
}

export function pieceCode(color: Color, type: PieceSymbol): PieceCode {
  return `${color === "w" ? "W" : "B"}${pieceLetters[type]}` as PieceCode;
}

export function boardFromGame(game: Chess): ChessBoard {
  return game.board().map((row) =>
    row.map((piece): BoardCell => {
      if (!piece) {
        return "--";
      }

      return pieceCode(piece.color, piece.type);
    }),
  );
}

export function formatBoard(board: ChessBoard): string {
  const rows = board.map((row, index) => {
    const rank = 8 - index;
    return `${rank} | ${row.join(" ")}`;
  });

  return [
    ...rows,
    "  +------------------------",
    `    ${files.join("  ")}`,
  ].join("\n");
}

export function formatGameBoard(game: Chess): string {
  return formatBoard(boardFromGame(game));
}
