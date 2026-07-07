"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import { Button } from "@/components/ui/button";
import { applyHumanTextMove } from "@/features/chess/game/human-input";
import {
  capturedFromMoves,
  findCheckedKing,
  materialScore,
  statusFor,
} from "./chess-ui";
import { GameBoard } from "./game-board";
import { GameHeader } from "./game-header";
import { MoveConsole } from "./move-console";
import { PlayerPanel } from "./player-panel";
import { PromotionDialog } from "./promotion-dialog";
import type {
  AgentProvider,
  PendingPromotion,
  PlayerNames,
  TurnResponse,
} from "./types";

export type { AgentProvider, PlayerNames };

const modelAvatars: Record<AgentProvider, { alt: string; src: string }> = {
  openai: { alt: "OpenAI logo", src: "/llm-icons/openai.svg" },
  claude: { alt: "Claude logo", src: "/llm-icons/claude.svg" },
  gemini: { alt: "Gemini logo", src: "/llm-icons/gemini.svg" },
  qwen: { alt: "Qwen logo", src: "/llm-icons/qwen.svg" },
};

export function LocalChessGame({
  agentProvider,
  humanSide,
  initialFen,
  initialGameId,
  initialGameOver,
  playerNames = { white: "PLAYER-1", black: "MindBoard AI" },
}: {
  agentProvider: AgentProvider;
  humanSide: "white" | "black";
  initialFen: string;
  initialGameId: string;
  initialGameOver: boolean;
  playerNames?: PlayerNames;
}) {
  const router = useRouter();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);
  const [gameId] = useState(initialGameId);
  const [gameFen, setGameFen] = useState(initialFen);
  const [showAllocation, setShowAllocation] = useState(true);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(initialGameOver);
  const humanColor: Color = humanSide === "white" ? "w" : "b";
  const agentColor: Color = humanColor === "w" ? "b" : "w";

  const game = useMemo(() => new Chess(gameFen), [gameFen]);
  const board = game.board();
  const checkedKing = findCheckedKing(game);
  const gameOver = isGameOver || game.isGameOver();
  const status = statusFor(game);
  const lastMove = moveHistory.at(-1) ?? null;
  const playerCanMove =
    game.turn() === humanColor && !agentThinking && !gameOver && !showAllocation;

  const legalMoves = useMemo(() => {
    if (!selectedSquare || pendingPromotion) {
      return [];
    }

    return game.moves({ square: selectedSquare, verbose: true });
  }, [game, selectedSquare, pendingPromotion]);

  const legalTargets = new Set(legalMoves.map((move) => move.to));
  const captures = capturedFromMoves(moveHistory);
  const whiteCaptures = captures.filter((piece) => piece.by === "w");
  const blackCaptures = captures.filter((piece) => piece.by === "b");
  const whiteMoveCount = moveHistory.filter(
    (move) => move.color === "w",
  ).length;
  const blackMoveCount = moveHistory.filter(
    (move) => move.color === "b",
  ).length;
  const agentAvatar = modelAvatars[agentProvider];

  useEffect(() => {
    if (!showEndGameDialog) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowEndGameDialog(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEndGameDialog]);

  async function requestAgentMove() {
    if (agentThinking || gameOver || game.turn() !== agentColor) {
      return;
    }

    setAgentThinking(true);
    setAgentError(null);

    try {
      const response = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/turn`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentProvider,
            humanSide,
            whiteName: playerNames.white,
            blackName: playerNames.black,
          }),
        },
      );
      const data = (await response.json()) as TurnResponse;

      if (!response.ok || !data.success || !data.fen) {
        throw new Error(data.error ?? "The agent could not move.");
      }

      setMoveHistory((history) => {
        const replay = new Chess(gameFen);
        const newMoves: Move[] = [];

        if (data.agentMove) {
          newMoves.push(
            replay.move({
              from: data.agentMove.from,
              to: data.agentMove.to,
              promotion: data.agentMove.promotion,
            }),
          );
        }

        return [...history, ...newMoves];
      });
      setGameFen(data.fen);
      setIsGameOver(Boolean(data.gameOver));
      setSelectedSquare(null);
      setPendingPromotion(null);
    } catch (error) {
      setAgentError(
        error instanceof Error
          ? error.message
          : "The chess agent failed to move.",
      );
    } finally {
      setAgentThinking(false);
    }
  }

  async function submitHumanMessage(message: string) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || agentThinking || gameOver) {
      return;
    }

    setAgentThinking(true);
    setAgentError(null);
    const fenBeforeOptimisticMove = gameFen;
    const historyBeforeOptimisticMove = moveHistory;
    const optimisticGame = new Chess(gameFen);
    const optimisticHumanMove = applyHumanTextMove(optimisticGame, trimmedMessage);

    if (!optimisticHumanMove) {
      setAgentThinking(false);
      setAgentError(`That move is not legal for ${humanSide}.`);
      return;
    }

    setMoveHistory((history) => [...history, optimisticHumanMove]);
    setGameFen(optimisticGame.fen());
    setSelectedSquare(null);
    setPendingPromotion(null);

    try {
      const response = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/turn`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentProvider,
            message: trimmedMessage,
            humanSide,
            whiteName: playerNames.white,
            blackName: playerNames.black,
          }),
        },
      );
      const data = (await response.json()) as TurnResponse;

      if (!response.ok || !data.success || !data.fen) {
        throw new Error(data.error ?? "The turn could not be played.");
      }

      setMoveHistory((history) => {
        const replay = new Chess(optimisticGame.fen());
        const newMoves: Move[] = [];

        if (data.agentMove) {
          newMoves.push(
            replay.move({
              from: data.agentMove.from,
              to: data.agentMove.to,
              promotion: data.agentMove.promotion,
            }),
          );
        }

        return [...history, ...newMoves];
      });
      setGameFen(data.fen);
      setIsGameOver(Boolean(data.gameOver));
      setSelectedSquare(null);
      setPendingPromotion(null);
    } catch (error) {
      setGameFen(fenBeforeOptimisticMove);
      setMoveHistory(historyBeforeOptimisticMove);

      setAgentError(
        error instanceof Error
          ? error.message
          : "The chess agent failed to move.",
      );
    } finally {
      setAgentThinking(false);
    }
  }

  function makeMove(from: Square, to: Square, promotion?: PieceSymbol) {
    void submitHumanMessage(
      promotion ? `${from}-${to}-${promotion}` : `${from}-${to}`,
    );
  }

  function tryMove(from: Square, to: Square) {
    const matchingMove = game
      .moves({ square: from, verbose: true })
      .find((move) => move.to === to);

    if (!matchingMove) {
      setSelectedSquare(null);
      return;
    }

    if (matchingMove.isPromotion()) {
      setPendingPromotion({ from, to, color: matchingMove.color });
      return;
    }

    makeMove(from, to);
  }

  function handleSquareSelect(square: Square) {
    if (pendingPromotion || !playerCanMove) {
      return;
    }

    const piece = game.get(square);

    if (selectedSquare) {
      if (legalTargets.has(square)) {
        tryMove(selectedSquare, square);
        return;
      }

      if (piece?.color === game.turn()) {
        setSelectedSquare(square);
        return;
      }

      setSelectedSquare(null);
      return;
    }

    if (piece?.color === humanColor) {
      setSelectedSquare(square);
    }
  }

  function handleDragStart(square: Square) {
    if (pendingPromotion || !playerCanMove) {
      return;
    }

    const piece = game.get(square);

    if (piece?.color === humanColor) {
      setSelectedSquare(square);
    }
  }

  function handleDrop(square: Square) {
    if (selectedSquare && selectedSquare !== square) {
      tryMove(selectedSquare, square);
    }
  }

  function resetGame() {
    router.push("/");
  }

  function handleEnterArena() {
    setShowAllocation(false);
    if (game.turn() === agentColor && !gameOver) {
      void requestAgentMove();
    }
  }

  return (
    <main className="min-h-screen bg-[#101513] px-4 py-5 text-[#f6f3e8] sm:px-6 lg:px-20">
      <div className="mx-auto flex w-full flex-col gap-5">
        <GameHeader
          agentThinking={agentThinking}
          gameId={gameId}
          onResetGame={() => setShowEndGameDialog(true)}
          status={status}
          turn={game.turn()}
        />

        <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(220px,0.75fr)_minmax(520px,560px)_minmax(220px,0.75fr)]">
          <PlayerPanel
            active={game.turn() === "w" && !gameOver}
            avatarAlt={agentColor === "w" ? agentAvatar.alt : undefined}
            avatarSrc={agentColor === "w" ? agentAvatar.src : undefined}
            captures={whiteCaptures}
            color="w"
            moves={whiteMoveCount}
            score={materialScore(whiteCaptures)}
            title={playerNames.white || "PLAYER-1"}
          />

          <div className="flex flex-col items-center">
            <div className="w-full max-w-[min(92vw,560px)]">
              <GameBoard
                board={board}
                checkedKing={checkedKing}
                lastMove={lastMove}
                legalTargets={legalTargets}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onSquareSelect={handleSquareSelect}
                movableColor={humanColor}
                playerCanMove={playerCanMove}
                selectedSquare={selectedSquare}
              />
            </div>
          </div>

          <PlayerPanel
            active={game.turn() === "b" && !gameOver}
            avatarAlt={agentColor === "b" ? agentAvatar.alt : undefined}
            avatarSrc={agentColor === "b" ? agentAvatar.src : undefined}
            captures={blackCaptures}
            color="b"
            moves={blackMoveCount}
            score={materialScore(blackCaptures)}
            title={playerNames.black || "PLAYER-2"}
          />
        </section>

        <MoveConsole
          agentError={agentError}
          agentThinking={agentThinking}
          moveHistory={moveHistory}
        />
      </div>

      {showAllocation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050706]/72 px-4 backdrop-blur-sm">
          <div className="mb-rise w-full max-w-lg rounded-lg border border-white/12 bg-[#101513] p-5 text-[#f6f3e8] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9df6cf]">
              Random side allocation
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              You play {humanSide}.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9df6cf]">
                  White
                </p>
                <p className="mt-2 text-xl font-black">{playerNames.white}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9df6cf]">
                  Black
                </p>
                <p className="mt-2 text-xl font-black">{playerNames.black}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#c8d8ce]">
              {humanSide === "black"
                ? "The AI has White and will make the opening move first."
                : "You have White and make the opening move first."}
            </p>
            <Button
              type="button"
              className="mt-5 w-full bg-[#9df6cf] font-black text-[#101513] hover:bg-[#c9ffe5]"
              onClick={handleEnterArena}
            >
              Enter arena
            </Button>
          </div>
        </div>
      ) : null}

      {pendingPromotion ? (
        <PromotionDialog
          pendingPromotion={pendingPromotion}
          onPromote={(piece) =>
            makeMove(pendingPromotion.from, pendingPromotion.to, piece)
          }
        />
      ) : null}

      {showEndGameDialog ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050706]/76 px-4 backdrop-blur-sm"
          onMouseDown={() => setShowEndGameDialog(false)}
        >
          <div
            aria-describedby="end-game-description"
            aria-labelledby="end-game-title"
            aria-modal="true"
            className="mb-rise w-full max-w-md rounded-lg border border-white/12 bg-[#101513] p-5 text-[#f6f3e8] shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
            onMouseDown={(event) => event.stopPropagation()}
            role="alertdialog"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e07a5f]">
              End game
            </p>
            <h2 id="end-game-title" className="mt-3 text-2xl font-black text-white">
              Are you sure?
            </h2>
            <p
              id="end-game-description"
              className="mt-3 text-sm font-semibold leading-6 text-[#c8d8ce]"
            >
              This will leave the current match and return to the home screen.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/12 bg-white/[0.06] font-black text-[#f6f3e8] hover:bg-white/[0.12]"
                onClick={() => setShowEndGameDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="bg-[#e07a5f] font-black text-[#101513] hover:bg-[#f09a83] focus-visible:ring-[#e07a5f]"
                onClick={resetGame}
              >
                End game
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
