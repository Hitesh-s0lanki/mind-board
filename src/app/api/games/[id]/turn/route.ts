import { Chess, type Color, type Square } from "chess.js";
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

const MAX_AGENT_MOVE_ATTEMPTS = 6;

type TurnRequest = {
  agentProvider?: string;
  humanSide?: "white" | "black";
  message?: string;
  whiteName?: string;
  blackName?: string;
};

function sideToColor(side: "white" | "black"): Color {
  return side === "white" ? "w" : "b";
}

function colorToSide(color: Color) {
  return color === "w" ? "white" : "black";
}

function colorLabel(color: Color) {
  return color === "w" ? "White" : "Black";
}

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
}, agentColor: Color) {
  const piece = game.get(move.from as Square);
  const agentLabel = colorLabel(agentColor);

  if (!piece) {
    return `The move ${move.move} is invalid because ${move.from} is empty. Choose a ${agentLabel} piece that exists on the current board.`;
  }

  const actualPiece = pieceCode(piece.color, piece.type);
  if (piece.color !== agentColor) {
    return `The move ${move.move} is invalid because ${move.from} contains ${actualPiece}, which belongs to ${colorLabel(piece.color)}. It is ${agentLabel}'s turn.`;
  }

  if (actualPiece !== move.piece) {
    return `The move ${move.move} is invalid because ${move.from} contains ${actualPiece}, not ${move.piece}.`;
  }

  return `The move ${move.move} is invalid under chess rules from the current board. Choose a different ${agentLabel} move.`;
}

function legalMoveOptionsForFeedback(
  legalMoves: ReturnType<typeof legalMovesForGame>,
) {
  return legalMoves
    .map((move) => `${move.move} (${move.piece}, SAN: ${move.san})`)
    .join(", ");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as TurnRequest;
    const humanText = body.message?.trim();
    const humanSide = body.humanSide ?? "white";
    const humanColor = sideToColor(humanSide);
    const agentColor = humanColor === "w" ? "b" : "w";

    if (body.humanSide && body.humanSide !== "white" && body.humanSide !== "black") {
      return NextResponse.json(
        { success: false, error: "Invalid human side." },
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

    let humanMove = null;
    let humanMoveSide: "white" | "black" | null = null;

    if (game.turn() === humanColor) {
      if (!humanText) {
        return NextResponse.json(
          { success: false, error: "Missing human message." },
          { status: 400 },
        );
      }

      const fenBeforeHuman = game.fen();
      humanMove = applyHumanTextMove(game, humanText);
      humanMoveSide = colorToSide(humanColor);

      if (!humanMove) {
        return NextResponse.json(
          {
            success: false,
            error: `Could not parse that as a legal ${colorLabel(humanColor)} move.`,
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
          side: humanMoveSide,
          move: humanMove.lan,
          from: humanMove.from,
          to: humanMove.to,
          san: humanMove.san,
          promotion: humanMove.promotion ?? null,
        },
        fenBefore: fenBeforeHuman,
        fenAfter: fenAfterHuman,
      });
    } else if (game.turn() !== agentColor) {
      return NextResponse.json(
        { success: false, error: "It is not a playable turn for this match." },
        { status: 400 },
      );
    }

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
    const legalMoveOptions = legalMoveOptionsForFeedback(legalMoves);
    const invalidAttempts: string[] = [];
    let validationFeedback: string | undefined;
    let agentMove = null;
    let legalMove = null;

    for (let attempt = 1; attempt <= MAX_AGENT_MOVE_ATTEMPTS; attempt += 1) {
      agentMove = await getChessAgentMove({
        side: colorToSide(agentColor),
        opponent: colorToSide(humanColor),
        boardView,
        lastMove: humanMove ? `${humanMoveSide}: ${humanMove.lan}` : null,
        chatHistory: agentChatHistory,
        validationFeedback,
      }, body.agentProvider);
      legalMove = findMatchingLegalMove(legalMoves, agentMove);

      if (legalMove) {
        break;
      }

      invalidAttempts.push(
        `${attempt}. ${agentMove.move} from ${agentMove.from} to ${agentMove.to} as ${agentMove.piece}`,
      );
      validationFeedback = [
        validationFeedbackForAgentMove(game, agentMove, agentColor),
        "Re-check the current board and output a new move.",
        `You must choose exactly one move from this legal ${colorLabel(agentColor)} move list:`,
        legalMoveOptions,
        `Invalid attempts so far:\n${invalidAttempts.join("\n")}`,
      ].join("\n\n");
    }

    if (!legalMove || !agentMove) {
      insertChatMessage({
        gameId: id,
        role: "agent",
        content: agentMove?.comment ?? "The agent could not produce a legal move.",
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
          error: "Agent could not repair its move after referee validation.",
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
      side: colorToSide(agentColor),
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
      humanMove: humanMove
        ? {
            from: humanMove.from,
            to: humanMove.to,
            san: humanMove.san,
            lan: humanMove.lan,
            promotion: humanMove.promotion,
          }
        : null,
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
