import { Chess, type Color } from "chess.js";
import {
  getGamesForSession,
  type GameRecord,
} from "@/features/chess/game/db";
import { getRequestSessionId } from "@/lib/server-session";
import { MarketingLanding } from "./_components/marketing-landing";
import type { PreviousGameLog } from "./_components/previous-games-section";

function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function sideLabel(color: Color) {
  return color === "w" ? "White" : "Black";
}

function playerNameForColor(game: GameRecord, color: Color) {
  return color === "w" ? game.whiteName : game.blackName;
}

function summarizeGame(game: GameRecord): PreviousGameLog {
  const chess = new Chess(game.fen);
  const humanColor: Color = game.humanSide === "black" ? "b" : "w";

  if (game.status === "ended") {
    return {
      id: game.id,
      whiteName: game.whiteName,
      blackName: game.blackName,
      statusLabel: "Ended",
      statusTone: "ended",
      detail: "Left before completion.",
      updatedAt: game.updatedAt,
      href: `/game/${game.id}`,
    };
  }

  if (chess.isCheckmate()) {
    const winnerColor = opposite(chess.turn());
    const winnerName = playerNameForColor(game, winnerColor);
    const playerWon = winnerColor === humanColor;

    return {
      id: game.id,
      whiteName: game.whiteName,
      blackName: game.blackName,
      statusLabel: playerWon ? "You won" : "You lost",
      statusTone: playerWon ? "win" : "loss",
      detail: `${winnerName} won by checkmate as ${sideLabel(winnerColor)}.`,
      updatedAt: game.updatedAt,
      href: `/game/${game.id}`,
    };
  }

  if (chess.isDraw()) {
    return {
      id: game.id,
      whiteName: game.whiteName,
      blackName: game.blackName,
      statusLabel: "Draw",
      statusTone: "draw",
      detail: "The game ended without a winner.",
      updatedAt: game.updatedAt,
      href: `/game/${game.id}`,
    };
  }

  return {
    id: game.id,
    whiteName: game.whiteName,
    blackName: game.blackName,
    statusLabel: "Active",
    statusTone: "active",
    detail: `Resume from ${sideLabel(chess.turn())}'s turn.`,
    updatedAt: game.updatedAt,
    href: `/game/${game.id}`,
  };
}

export default async function Home() {
  const sessionId = await getRequestSessionId();
  const previousGames = sessionId
    ? (await getGamesForSession(sessionId)).map(summarizeGame)
    : [];

  return <MarketingLanding previousGames={previousGames} />;
}
