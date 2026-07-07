import { Chess } from "chess.js";
import { NextResponse } from "next/server";
import { boardFromGame, formatGameBoard } from "@/features/chess/game/board";
import {
  getAllChatMessages,
  getGameMoveInputs,
  getOrCreateGame,
  updateGameStatus,
  upsertAppUser,
} from "@/features/chess/game/db";
import { readSessionIdFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const sessionId = readSessionIdFromRequest(request);
  const humanSide = url.searchParams.get("humanSide") === "black" ? "black" : "white";
  const whiteName = url.searchParams.get("white") ?? undefined;
  const blackName = url.searchParams.get("black") ?? undefined;

  if (sessionId) {
    await upsertAppUser(sessionId, humanSide === "white" ? whiteName : blackName);
  }

  const gameRecord = await getOrCreateGame(id, {
    whiteName: url.searchParams.get("white") ?? undefined,
    blackName: url.searchParams.get("black") ?? undefined,
    sessionId,
    humanSide,
    agentProvider: url.searchParams.get("model") ?? undefined,
  });
  const game = new Chess(gameRecord.fen);

  return NextResponse.json({
    success: true,
    game: gameRecord,
    fen: game.fen(),
    board: boardFromGame(game),
    boardView: formatGameBoard(game),
    gameOver: game.isGameOver(),
    chatHistory: await getAllChatMessages(id),
    moves: await getGameMoveInputs(id),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as { status?: string };
  const sessionId = readSessionIdFromRequest(request);

  if (body.status !== "ended") {
    return NextResponse.json(
      { success: false, error: "Unsupported game status." },
      { status: 400 },
    );
  }

  await updateGameStatus(id, "ended", sessionId);

  return NextResponse.json({ success: true });
}
