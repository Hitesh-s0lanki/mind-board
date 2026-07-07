import { Chess, type Move, type PieceSymbol } from "chess.js";

const fromToPattern = /\b([a-h][1-8])[-\s]?([a-h][1-8])(?:[-=]?([qrbn]))?\b/i;

function tryMove(
  game: Chess,
  input: string | { from: string; to: string; promotion?: PieceSymbol },
) {
  try {
    return game.move(input);
  } catch {
    return null;
  }
}

export function applyHumanTextMove(game: Chess, message: string): Move | null {
  const trimmed = message.trim();
  const fromToMatch = trimmed.match(fromToPattern);

  if (fromToMatch) {
    const [, from, to, promotion] = fromToMatch;
    return tryMove(game, {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      promotion: promotion?.toLowerCase() as PieceSymbol | undefined,
    });
  }

  return tryMove(game, trimmed);
}
