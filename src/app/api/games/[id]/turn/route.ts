import { Chess, type Color, type Square } from "chess.js";
import { NextResponse } from "next/server";
import { getChessAgentMove } from "@/features/chess/agents/chess-agent";
import { boardFromGame, formatGameBoard, pieceCode } from "@/features/chess/game/board";
import {
  getOrCreateGame,
  getRecentChatMessages,
  insertChatMessage,
  updateGameFen,
  upsertAppUser,
} from "@/features/chess/game/db";
import { applyHumanTextMove } from "@/features/chess/game/human-input";
import { findMatchingLegalMove, legalMovesForGame } from "@/features/chess/game/move-validator";
import { readSessionIdFromRequest } from "@/lib/session";

export const runtime = "nodejs";

const MAX_AGENT_MOVE_ATTEMPTS = 6;

type TurnRequest = {
  agentProvider?: string;
  blackAgentProvider?: string;
  claudeApiKey?: string;
  gameMode?: "human-vs-agent" | "agent-vs-agent" | "human-vs-human";
  humanSide?: "white" | "black";
  message?: string;
  whiteAgentProvider?: string;
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

async function playAgentOnlyTurn(input: {
  agentProvider?: string;
  claudeApiKey?: string;
  game: Chess;
  gameId: string;
}) {
  const { agentProvider, claudeApiKey, game, gameId } = input;
  const agentColor = game.turn();
  const opponentColor = agentColor === "w" ? "b" : "w";
  const chatHistory = await getRecentChatMessages(gameId, 10);
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
    agentMove = await getChessAgentMove(
      {
        side: colorToSide(agentColor),
        opponent: colorToSide(opponentColor),
        boardView,
        lastMove: null,
        chatHistory: agentChatHistory,
        validationFeedback,
      },
      agentProvider,
      { apiKey: claudeApiKey },
    );
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
    await insertChatMessage({
      gameId,
      role: "agent",
      content: agentMove?.comment ?? "The agent could not produce a legal move.",
      structuredJson: {
        ...agentMove,
        side: colorToSide(agentColor),
        valid: false,
      },
      fenBefore: game.fen(),
      fenAfter: game.fen(),
    });

    await updateGameFen(gameId, game.fen(), gameStatus(game));

    return NextResponse.json(
      {
        success: false,
        error: "Agent could not repair its move after referee validation.",
        agentMove,
        fen: game.fen(),
        board: boardFromGame(game),
        boardView,
        chatHistory: await getRecentChatMessages(gameId, 10),
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

  await insertChatMessage({
    gameId,
    role: "agent",
    content: agentMove.comment,
    structuredJson: structuredAgentMove,
    fenBefore: fenBeforeAgent,
    fenAfter: fenAfterAgent,
  });
  await updateGameFen(gameId, game.fen(), gameStatus(game));

  return NextResponse.json({
    success: true,
    gameId,
    humanMove: null,
    agentMove: structuredAgentMove,
    fen: game.fen(),
    board: boardFromGame(game),
    boardView: formatGameBoard(game),
    gameOver: game.isGameOver(),
    chatHistory: await getRecentChatMessages(gameId, 10),
  });
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
    const sessionId = readSessionIdFromRequest(request);
    const agentProvider = body.agentProvider?.trim().toLowerCase();
    const claudeApiKey = body.claudeApiKey?.trim();
    const isAgentVsAgent = body.gameMode === "agent-vs-agent";
    const isHumanVsHuman = body.gameMode === "human-vs-human";

    if (body.humanSide && body.humanSide !== "white" && body.humanSide !== "black") {
      return NextResponse.json(
        { success: false, error: "Invalid human side." },
        { status: 400 },
      );
    }

    if (agentProvider === "claude" && !claudeApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Claude API key is required for this game. It is only used for this match and is not saved.",
        },
        { status: 400 },
      );
    }

    if (sessionId) {
      await upsertAppUser(
        sessionId,
        humanSide === "white" ? body.whiteName : body.blackName,
      );
    }

    const gameRecord = await getOrCreateGame(id, {
      whiteName: body.whiteName,
      blackName: body.blackName,
      sessionId,
      gameMode: body.gameMode,
      humanSide,
      agentProvider: body.agentProvider,
      whiteAgentProvider: body.whiteAgentProvider,
      blackAgentProvider: body.blackAgentProvider,
    });
    const game = new Chess(gameRecord.fen);

    if (game.isGameOver()) {
      return NextResponse.json(
        { success: false, error: "This game is already complete." },
        { status: 400 },
      );
    }

    if (isAgentVsAgent) {
      return playAgentOnlyTurn({
        agentProvider: body.agentProvider,
        claudeApiKey,
        game,
        gameId: id,
      });
    }

    if (isHumanVsHuman) {
      if (!humanText) {
        return NextResponse.json(
          { success: false, error: "Missing move." },
          { status: 400 },
        );
      }

      const fenBeforeHuman = game.fen();
      const humanMove = applyHumanTextMove(game, humanText);

      if (!humanMove) {
        return NextResponse.json(
          {
            success: false,
            error: `Could not parse that as a legal ${colorLabel(game.turn())} move.`,
          },
          { status: 400 },
        );
      }

      const fenAfterHuman = game.fen();
      await insertChatMessage({
        gameId: id,
        role: "human",
        content: humanText,
        structuredJson: {
          side: colorToSide(humanMove.color),
          move: humanMove.lan,
          from: humanMove.from,
          to: humanMove.to,
          san: humanMove.san,
          promotion: humanMove.promotion ?? null,
        },
        fenBefore: fenBeforeHuman,
        fenAfter: fenAfterHuman,
      });
      await updateGameFen(id, game.fen(), gameStatus(game));

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
        agentMove: null,
        fen: game.fen(),
        board: boardFromGame(game),
        boardView: formatGameBoard(game),
        gameOver: game.isGameOver(),
        chatHistory: await getRecentChatMessages(id, 10),
      });
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
      await insertChatMessage({
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
      await updateGameFen(id, game.fen(), gameStatus(game));
      return NextResponse.json({
        success: true,
        gameId: id,
        humanMove,
        agentMove: null,
        fen: game.fen(),
        board: boardFromGame(game),
        boardView: formatGameBoard(game),
        gameOver: true,
        chatHistory: await getRecentChatMessages(id, 10),
      });
    }

    const chatHistory = await getRecentChatMessages(id, 10);
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
      agentMove = await getChessAgentMove(
        {
          side: colorToSide(agentColor),
          opponent: colorToSide(humanColor),
          boardView,
          lastMove: humanMove ? `${humanMoveSide}: ${humanMove.lan}` : null,
          chatHistory: agentChatHistory,
          validationFeedback,
        },
        body.agentProvider,
        { apiKey: claudeApiKey },
      );
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
      await insertChatMessage({
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

      await updateGameFen(id, game.fen(), gameStatus(game));
      return NextResponse.json(
        {
          success: false,
          error: "Agent could not repair its move after referee validation.",
          agentMove,
          fen: game.fen(),
          board: boardFromGame(game),
          boardView,
          chatHistory: await getRecentChatMessages(id, 10),
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

    await insertChatMessage({
      gameId: id,
      role: "agent",
      content: agentMove.comment,
      structuredJson: structuredAgentMove,
      fenBefore: fenBeforeAgent,
      fenAfter: fenAfterAgent,
    });
    await updateGameFen(id, game.fen(), gameStatus(game));

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
      chatHistory: await getRecentChatMessages(id, 10),
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
