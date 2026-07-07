import { Chess } from "chess.js";
import { NextResponse } from "next/server";
import { boardFromGame, formatGameBoard } from "@/features/chess/game/board";
import { getAllChatMessages, getOrCreateGame } from "@/features/chess/game/db";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const gameRecord = getOrCreateGame(id, {
    whiteName: url.searchParams.get("white") ?? undefined,
    blackName: url.searchParams.get("black") ?? undefined,
  });
  const game = new Chess(gameRecord.fen);

  return NextResponse.json({
    success: true,
    game: gameRecord,
    fen: game.fen(),
    board: boardFromGame(game),
    boardView: formatGameBoard(game),
    gameOver: game.isGameOver(),
    chatHistory: getAllChatMessages(id),
  });
}
