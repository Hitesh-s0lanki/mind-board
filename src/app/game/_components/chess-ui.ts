import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import type { CapturedPiece } from "./types";

export const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;
export const promotionPieces: PieceSymbol[] = ["q", "r", "b", "n"];

const pieceValues: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const pieceImageNames: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    k: "whiteKing.png",
    q: "whiteQueen.png",
    r: "whiteRook.png",
    b: "whiteBishop.png",
    n: "whiteKnight.png",
    p: "whitePawn.png",
  },
  b: {
    k: "blackKing.png",
    q: "blackQueen.png",
    r: "blackRook.png",
    b: "blackBishop.png",
    n: "blackKnight.png",
    p: "blackPawn.png",
  },
};

export function createGameId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `game_${crypto.randomUUID()}`;
  }

  return `game_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function colorName(color: Color) {
  return color === "w" ? "White" : "Black";
}

export function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

export function pieceImageSrc(color: Color, type: PieceSymbol) {
  return `/chess-pieces/${pieceImageNames[color][type]}`;
}

export function squareName(fileIndex: number, rankIndex: number): Square {
  return `${files[fileIndex]}${ranks[rankIndex]}` as Square;
}

export function findCheckedKing(game: Chess) {
  if (!game.isCheck()) {
    return null;
  }

  const checkedColor = game.turn();

  for (const row of game.board()) {
    for (const piece of row) {
      if (piece?.type === "k" && piece.color === checkedColor) {
        return piece.square;
      }
    }
  }

  return null;
}

export function statusFor(game: Chess) {
  const turn = colorName(game.turn());

  if (game.isCheckmate()) {
    return `${colorName(opposite(game.turn()))} wins by checkmate`;
  }

  if (game.isStalemate()) {
    return "Draw by stalemate";
  }

  if (game.isInsufficientMaterial()) {
    return "Draw by insufficient material";
  }

  if (game.isThreefoldRepetition()) {
    return "Draw by threefold repetition";
  }

  if (game.isDrawByFiftyMoves()) {
    return "Draw by the fifty-move rule";
  }

  if (game.isDraw()) {
    return "Draw";
  }

  if (game.isCheck()) {
    return `${turn} is in check`;
  }

  return `${turn} to move`;
}

export function capturedFromMoves(moves: Move[]): CapturedPiece[] {
  return moves.flatMap((move) => {
    if (!move.captured) {
      return [];
    }

    return [
      {
        by: move.color,
        color: opposite(move.color),
        type: move.captured,
      },
    ];
  });
}

export function materialScore(pieces: CapturedPiece[]) {
  return pieces.reduce((total, piece) => total + pieceValues[piece.type], 0);
}
