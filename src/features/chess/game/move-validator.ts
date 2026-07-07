import { type Chess, type Move } from "chess.js";
import { pieceCode } from "./board";
import type { ChessAgentOutput, LegalChessMove } from "./types";

export function legalMovesForGame(game: Chess): LegalChessMove[] {
  return game.moves({ verbose: true }).map((move) => ({
    from: move.from,
    to: move.to,
    move: formatMove(move),
    piece: pieceCode(move.color, move.piece),
    san: move.san,
    promotion: move.promotion,
  }));
}

export function formatMove(move: Pick<Move, "from" | "to" | "promotion">): string {
  return move.promotion
    ? `${move.from}-${move.to}-${move.promotion}`
    : `${move.from}-${move.to}`;
}

export function normalizeAgentMove(move: ChessAgentOutput): string {
  return move.promotion ? `${move.from}-${move.to}-${move.promotion}` : move.move;
}

export function findMatchingLegalMove(
  legalMoves: LegalChessMove[],
  agentMove: ChessAgentOutput,
) {
  const normalizedMove = normalizeAgentMove(agentMove);

  return legalMoves.find(
    (legalMove) =>
      legalMove.move === normalizedMove &&
      legalMove.from === agentMove.from &&
      legalMove.to === agentMove.to &&
      legalMove.piece === agentMove.piece &&
      legalMove.promotion === agentMove.promotion,
  );
}
