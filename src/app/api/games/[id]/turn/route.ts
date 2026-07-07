import { Chess, type Square } from "chess.js";
import { NextResponse } from "next/server";
import { getChessAgentMove } from "@/features/chess/agents/chess-agent";
import { boardFromGame, formatGameBoard, pieceCode } from "@/features/chess/game/board";
import {
  getOrCreateGame,
  getRecentChatMessages,
  insertChatMessage,
  updateGameFen,
} from "@/features/chess/game/db";
import { applyHumanTextMove } from "@/features/chess/game/human-input";
import { findMatchingLegalMove, legalMovesForGame } from "@/features/chess/game/move-validator";

export const runtime = "nodejs";

type TurnRequest = {
  message?: string;
  whiteName?: string;
  blackName?: string;
};

function gameStatus(game: Chess) {
  if (game.isGameOver()) {
    return "complete";
  }

  return "active";
}

function validationFeedbackForAgentMove(game: Chess, move: {
  from: string;
  to: string;
  piece: string;
  move: string;
}) {
  const piece = game.get(move.from as Square);

  if (!piece) {
    return `The move ${move.move} is invalid because ${move.from} is empty. Choose a black piece that exists on the current board.`;
  }

  const actualPiece = pieceCode(piece.color, piece.type);
  if (piece.color !== "b") {
    return `The move ${move.move} is invalid because ${move.from} contains ${actualPiece}, which belongs to White. It is Black's turn.`;
  }

  if (actualPiece !== move.piece) {
    return `The move ${move.move} is invalid because ${move.from} contains ${actualPiece}, not ${move.piece}.`;
  }

  return `The move ${move.move} is invalid under chess rules from the current board. Choose a different Black move.`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as TurnRequest;
    const humanText = body.message?.trim();

    if (!humanText) {
      return NextResponse.json(
        { success: false, error: "Missing human message." },
        { status: 400 },
      );
    }

    const gameRecord = getOrCreateGame(id, {
      whiteName: body.whiteName,
      blackName: body.blackName,
    });
    const game = new Chess(gameRecord.fen);

    if (game.isGameOver()) {
      return NextResponse.json(
        { success: false, error: "This game is already complete." },
        { status: 400 },
      );
    }

    if (game.turn() !== "w") {
      return NextResponse.json(
        { success: false, error: "It is not the human player's turn." },
        { status: 400 },
      );
    }

    const fenBeforeHuman = game.fen();
    const humanMove = applyHumanTextMove(game, humanText);

    if (!humanMove) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not parse that as a legal White move.",
        },
        { status: 400 },
      );
    }

    const fenAfterHuman = game.fen();
    insertChatMessage({
      gameId: id,
      role: "human",
      content: humanText,
      structuredJson: {
        side: "white",
        move: humanMove.lan,
        from: humanMove.from,
        to: humanMove.to,
        san: humanMove.san,
        promotion: humanMove.promotion ?? null,
      },
      fenBefore: fenBeforeHuman,
      fenAfter: fenAfterHuman,
    });

    if (game.isGameOver()) {
      updateGameFen(id, game.fen(), gameStatus(game));
      return NextResponse.json({
        success: true,
        gameId: id,
        humanMove,
        agentMove: null,
        fen: game.fen(),
        board: boardFromGame(game),
        boardView: formatGameBoard(game),
        gameOver: true,
        chatHistory: getRecentChatMessages(id, 10),
      });
    }

    const chatHistory = getRecentChatMessages(id, 10);
    const boardView = formatGameBoard(game);
    const agentChatHistory = chatHistory.map((message) => ({
      role: message.role,
      content:
        message.role === "agent" && message.structuredJson
          ? message.structuredJson
          : message.content,
    }));
    const legalMoves = legalMovesForGame(game);
    let validationFeedback: string | undefined;
    let agentMove = await getChessAgentMove({
      side: "black",
      opponent: "white",
      boardView,
      lastMove: `white: ${humanMove.lan}`,
      chatHistory: agentChatHistory,
    });
    let legalMove = findMatchingLegalMove(legalMoves, agentMove);

    for (let attempt = 0; !legalMove && attempt < 2; attempt += 1) {
      validationFeedback = validationFeedbackForAgentMove(game, agentMove);
      agentMove = await getChessAgentMove({
        side: "black",
        opponent: "white",
        boardView,
        lastMove: `white: ${humanMove.lan}`,
        chatHistory: agentChatHistory,
        validationFeedback,
      });
      legalMove = findMatchingLegalMove(legalMoves, agentMove);
    }

    if (!legalMove) {
      insertChatMessage({
        gameId: id,
        role: "agent",
        content: agentMove.comment,
        structuredJson: {
          ...agentMove,
          valid: false,
        },
        fenBefore: game.fen(),
        fenAfter: game.fen(),
      });

      updateGameFen(id, game.fen(), gameStatus(game));
      return NextResponse.json(
        {
          success: false,
          error: "Agent returned a structured but illegal move.",
          agentMove,
          fen: game.fen(),
          board: boardFromGame(game),
          boardView,
          chatHistory: getRecentChatMessages(id, 10),
        },
        { status: 422 },
      );
    }

    const fenBeforeAgent = game.fen();
    const appliedAgentMove = game.move({
      from: legalMove.from,
      to: legalMove.to,
      promotion: legalMove.promotion,
    });
    const fenAfterAgent = game.fen();
    const structuredAgentMove = {
      ...agentMove,
      side: "black" as const,
      move: legalMove.move,
      from: legalMove.from,
      to: legalMove.to,
      piece: pieceCode(appliedAgentMove.color, appliedAgentMove.piece),
      promotion: legalMove.promotion ?? null,
      san: appliedAgentMove.san,
      valid: true,
    };

    insertChatMessage({
      gameId: id,
      role: "agent",
      content: agentMove.comment,
      structuredJson: structuredAgentMove,
      fenBefore: fenBeforeAgent,
      fenAfter: fenAfterAgent,
    });
    updateGameFen(id, game.fen(), gameStatus(game));

    return NextResponse.json({
      success: true,
      gameId: id,
      humanMove: {
        from: humanMove.from,
        to: humanMove.to,
        san: humanMove.san,
        lan: humanMove.lan,
        promotion: humanMove.promotion,
      },
      agentMove: structuredAgentMove,
      fen: game.fen(),
      board: boardFromGame(game),
      boardView: formatGameBoard(game),
      gameOver: game.isGameOver(),
      chatHistory: getRecentChatMessages(id, 10),
    });
  } catch (error) {
    console.error("Game turn API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to play turn.",
      },
      { status: 500 },
    );
  }
}
