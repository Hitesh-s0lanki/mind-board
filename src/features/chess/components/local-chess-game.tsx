"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import type { ChatMessageRecord } from "../game/db";

type CapturedPiece = {
  by: Color;
  color: Color;
  type: PieceSymbol;
};

type PendingPromotion = {
  from: Square;
  to: Square;
  color: Color;
};

type TurnResponse = {
  success: boolean;
  error?: string;
  gameId?: string;
  fen?: string;
  humanMove?: {
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
    san: string;
    lan: string;
  };
  agentMove?: {
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
    san?: string;
    reason: string;
    comment: string;
  };
  gameOver?: boolean;
  chatHistory?: ChatMessageRecord[];
};

export type PlayerNames = {
  white: string;
  black: string;
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;
const promotionPieces: PieceSymbol[] = ["q", "r", "b", "n"];
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

function createGameId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `game_${crypto.randomUUID()}`;
  }

  return `game_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function colorName(color: Color) {
  return color === "w" ? "White" : "Black";
}

function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function pieceImageSrc(color: Color, type: PieceSymbol) {
  return `/chess-pieces/${pieceImageNames[color][type]}`;
}

function squareName(fileIndex: number, rankIndex: number): Square {
  return `${files[fileIndex]}${ranks[rankIndex]}` as Square;
}

function findCheckedKing(game: Chess) {
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

function statusFor(game: Chess) {
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

function capturedFromMoves(moves: Move[]): CapturedPiece[] {
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

function materialScore(pieces: CapturedPiece[]) {
  return pieces.reduce((total, piece) => total + pieceValues[piece.type], 0);
}

export function LocalChessGame({
  initialChatHistory,
  initialFen,
  initialGameId,
  initialGameOver,
  playerNames = { white: "PLAYER-1", black: "MindBoard AI" },
}: {
  initialChatHistory: ChatMessageRecord[];
  initialFen: string;
  initialGameId: string;
  initialGameOver: boolean;
  playerNames?: PlayerNames;
}) {
  const router = useRouter();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [gameId] = useState(initialGameId);
  const [gameFen, setGameFen] = useState(initialFen);
  const [chatHistory, setChatHistory] = useState(initialChatHistory);
  const [humanMessage, setHumanMessage] = useState("");
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentComment, setAgentComment] = useState("Send a move like e2-e4, Nf3, or castle kingside.");
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(initialGameOver);

  const game = useMemo(() => new Chess(gameFen), [gameFen]);
  const board = game.board();
  const checkedKing = findCheckedKing(game);
  const gameOver = isGameOver || game.isGameOver();
  const status = statusFor(game);
  const lastMove = moveHistory.at(-1) ?? null;
  const playerCanMove = game.turn() === "w" && !agentThinking && !gameOver;

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
  const whiteMoveCount = moveHistory.filter((move) => move.color === "w").length;
  const blackMoveCount = moveHistory.filter((move) => move.color === "b").length;

  async function submitHumanMessage(message: string) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || agentThinking || gameOver) {
      return;
    }

    setAgentThinking(true);
    setAgentError(null);

    try {
      const response = await fetch(`/api/games/${encodeURIComponent(gameId)}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          whiteName: playerNames.white,
          blackName: playerNames.black,
        }),
      });
      const data = (await response.json()) as TurnResponse;

      if (!response.ok || !data.success || !data.fen) {
        throw new Error(data.error ?? "The turn could not be played.");
      }

      setMoveHistory((history) => {
        const replay = new Chess(gameFen);
        const newMoves: Move[] = [];

        if (data.humanMove) {
          newMoves.push(
            replay.move({
              from: data.humanMove.from,
              to: data.humanMove.to,
              promotion: data.humanMove.promotion,
            }),
          );
        }

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
      setHumanMessage("");
      setChatHistory(data.chatHistory ?? []);
      setIsGameOver(Boolean(data.gameOver));
      setAgentComment(data.agentMove?.comment ?? "Move accepted.");
      setSelectedSquare(null);
      setPendingPromotion(null);
    } catch (error) {
      setAgentError(
        error instanceof Error ? error.message : "The chess agent failed to move.",
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

    if (piece?.color === "w") {
      setSelectedSquare(square);
    }
  }

  function handleDragStart(square: Square) {
    if (pendingPromotion || !playerCanMove) {
      return;
    }

    const piece = game.get(square);

    if (piece?.color === "w") {
      setSelectedSquare(square);
    }
  }

  function handleDrop(square: Square) {
    if (selectedSquare && selectedSquare !== square) {
      tryMove(selectedSquare, square);
    }
  }

  function resetGame() {
    const nextGameId = createGameId();
    router.push(`/game/${nextGameId}`);
  }

  function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitHumanMessage(humanMessage);
  }

  return (
    <main className="min-h-screen bg-[#312e2b] px-4 py-5 text-[#f8f5ed] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="grid items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
          <PlayerPanel
            active={game.turn() === "w" && !gameOver}
            captures={whiteCaptures}
            color="w"
            moves={whiteMoveCount}
            score={materialScore(whiteCaptures)}
            title={playerNames.white || "PLAYER-1"}
          />

          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-[min(92vw,560px)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#4a4540] bg-[#262422] px-3 py-2">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="MindBoard Arena logo"
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain"
                    priority
                  />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c6d6a7]">
                      MindBoard Arena
                    </p>
                    <p className="text-xl font-bold text-white">{status}</p>
                    <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-[#b7afa5]">
                      {gameId}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-md border border-[#5b554f] bg-[#312e2b] px-3 py-2 text-sm font-semibold text-[#eaedd0]">
                    {agentThinking ? "AI thinking" : `Turn: ${colorName(game.turn())}`}
                  </div>
                  <Link
                    href="/"
                    className="flex h-9 items-center rounded-md border border-[#5b554f] px-3 text-sm font-semibold text-[#eaedd0] transition hover:border-[#eaedd0] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#c6d6a7] focus:ring-offset-2 focus:ring-offset-[#262422]"
                  >
                    Setup
                  </Link>
                </div>
              </div>

              <div
                className="grid aspect-square w-full overflow-hidden bg-[#4c433a] shadow-[20px_20px_70px_rgba(0,0,0,0.75)]"
                style={{
                  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
                  gridTemplateRows: "repeat(8, minmax(0, 1fr))",
                }}
              >
                {board.map((row, rankIndex) =>
                  row.map((piece, fileIndex) => {
                    const square = squareName(fileIndex, rankIndex);
                    const isLight = (rankIndex + fileIndex) % 2 === 0;
                    const isSelected = selectedSquare === square;
                    const isLegalTarget = legalTargets.has(square);
                    const isLastMove = lastMove?.from === square || lastMove?.to === square;
                    const isCheckedKing = checkedKing === square;

                    return (
                      <button
                        key={square}
                        type="button"
                        draggable={Boolean(piece && piece.color === "w" && playerCanMove)}
                        onClick={() => handleSquareSelect(square)}
                        onDragStart={() => handleDragStart(square)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleDrop(square);
                        }}
                        className={[
                          "relative flex min-h-0 min-w-0 items-center justify-center select-none transition",
                          isLight ? "bg-[#eaedd0]" : "bg-[#779457]",
                          isSelected ? "ring-2 ring-inset ring-[#006ed6]" : "",
                          isLastMove ? "after:absolute after:inset-2 after:rounded-[10px] after:bg-[#b9b45d]/65" : "",
                          isCheckedKing ? "before:absolute before:inset-1 before:bg-[#d64545]/45" : "",
                          isLegalTarget ? "hover:brightness-105" : "",
                        ].join(" ")}
                        aria-label={`${square}${piece ? ` ${colorName(piece.color)} ${piece.type}` : ""}`}
                      >
                        {fileIndex === 0 ? (
                          <span
                            className={[
                              "absolute left-1 top-1 text-[10px] font-bold sm:text-xs",
                              isLight ? "text-[#779457]" : "text-[#eaedd0]",
                            ].join(" ")}
                          >
                            {ranks[rankIndex]}
                          </span>
                        ) : null}
                        {rankIndex === 7 ? (
                          <span
                            className={[
                              "absolute bottom-1 right-1 text-[10px] font-bold sm:text-xs",
                              isLight ? "text-[#779457]" : "text-[#eaedd0]",
                            ].join(" ")}
                          >
                            {files[fileIndex]}
                          </span>
                        ) : null}
                        {isLegalTarget ? (
                          <span
                            className={[
                              "absolute z-10 rounded-full",
                              piece
                                ? "h-[86%] w-[86%] border-4 border-[#006ed6]/75"
                                : "h-4 w-4 bg-[#1b1b1b]/25 sm:h-5 sm:w-5",
                            ].join(" ")}
                          />
                        ) : null}
                        {piece ? (
                          <Image
                            src={pieceImageSrc(piece.color, piece.type)}
                            alt={`${colorName(piece.color)} ${piece.type}`}
                            width={60}
                            height={60}
                            draggable={false}
                            className="relative z-20 h-[78%] w-[78%] object-contain drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)]"
                            priority={rankIndex <= 1 || rankIndex >= 6}
                          />
                        ) : null}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            <section className="w-full max-w-[min(92vw,560px)] rounded-lg border border-[#4a4540] bg-[#262422] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.28)]">
              <h2 className="text-base font-bold text-white">Captured pieces</h2>
              <div className="mt-4 grid gap-4">
                <CapturedPieces title="White captured" pieces={whiteCaptures} />
                <CapturedPieces title="Black captured" pieces={blackCaptures} />
              </div>
            </section>

            <section className="w-full max-w-[min(92vw,560px)] rounded-lg border border-[#4a4540] bg-[#262422] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white">MindBoard AI</h2>
                <span className="text-sm font-semibold text-[#c6d6a7]">
                  {agentThinking ? "Thinking" : "Black"}
                </span>
              </div>
              <p className="mt-3 rounded-md bg-[#312e2b] px-3 py-3 text-sm leading-6 text-[#f8f5ed]">
                {agentError ?? agentComment}
              </p>
              <form className="mt-3 flex gap-2" onSubmit={handleMessageSubmit}>
                <input
                  value={humanMessage}
                  onChange={(event) => setHumanMessage(event.target.value)}
                  disabled={agentThinking || gameOver}
                  className="h-11 min-w-0 flex-1 rounded-md border border-[#5b554f] bg-[#312e2b] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#8e857b] focus:border-[#eaedd0] focus:ring-2 focus:ring-[#c6d6a7]/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Type a move, e.g. e2-e4 or Nf3"
                />
                <button
                  type="submit"
                  disabled={agentThinking || gameOver}
                  className="h-11 rounded-md bg-[#c6d6a7] px-4 text-sm font-black text-[#1f1d1a] transition hover:bg-[#eaedd0] focus:outline-none focus:ring-2 focus:ring-[#c6d6a7] focus:ring-offset-2 focus:ring-offset-[#262422] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </form>
              <div className="mt-3 grid gap-2 rounded-md bg-[#312e2b] px-3 py-3 text-xs font-semibold text-[#b7afa5]">
                <p className="truncate">Game: {gameId}</p>
                <p className="truncate">DB: data/mind-board.sqlite</p>
              </div>
            </section>

            <section className="w-full max-w-[min(92vw,560px)] rounded-lg border border-[#4a4540] bg-[#262422] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white">Chat history</h2>
                <span className="text-sm font-medium text-[#b7afa5]">
                  last {Math.min(chatHistory.length, 10)}
                </span>
              </div>
              <ol className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {chatHistory.slice(-10).map((message) => (
                  <li
                    key={message.id}
                    className="rounded-md bg-[#312e2b] px-3 py-2 text-sm"
                  >
                    <p className="font-semibold uppercase tracking-[0.12em] text-[#c6d6a7]">
                      {message.role}
                    </p>
                    <p className="mt-1 text-[#f8f5ed]">{message.content}</p>
                  </li>
                ))}
                {chatHistory.length === 0 ? (
                  <li className="rounded-md border border-dashed border-[#5b554f] px-3 py-8 text-center text-sm text-[#b7afa5]">
                    Chat messages will appear here.
                  </li>
                ) : null}
              </ol>
            </section>

            <section className="w-full max-w-[min(92vw,560px)] rounded-lg border border-[#4a4540] bg-[#262422] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white">Move history</h2>
                <span className="text-sm font-medium text-[#b7afa5]">
                  {moveHistory.length} moves
                </span>
              </div>
              <ol className="mt-4 max-h-[240px] space-y-2 overflow-y-auto pr-1">
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, index) => {
                  const whiteMove = moveHistory[index * 2];
                  const blackMove = moveHistory[index * 2 + 1];

                  return (
                    <li
                      key={`${index}-${whiteMove?.san ?? ""}-${blackMove?.san ?? ""}`}
                      className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 rounded-md bg-[#312e2b] px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-[#c6d6a7]">{index + 1}.</span>
                      <span className="font-medium text-[#f8f5ed]">{whiteMove?.san}</span>
                      <span className="font-medium text-[#f8f5ed]">{blackMove?.san}</span>
                    </li>
                  );
                })}
                {moveHistory.length === 0 ? (
                  <li className="rounded-md border border-dashed border-[#5b554f] px-3 py-8 text-center text-sm text-[#b7afa5]">
                    Moves will appear here.
                  </li>
                ) : null}
              </ol>
            </section>
          </div>

          <PlayerPanel
            active={game.turn() === "b" && !gameOver}
            captures={blackCaptures}
            color="b"
            moves={blackMoveCount}
            score={materialScore(blackCaptures)}
            title={playerNames.black || "PLAYER-2"}
          />
        </section>

        <section className="rounded-lg border border-[#4a4540] bg-[#262422] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c6d6a7]">
                Match controls
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-normal text-white">
                End this battle
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#b7afa5]">
                Clear the current board state and return the arena to the opening
                position.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetGame}
                className="h-11 rounded-md bg-[#e07a5f] px-5 text-sm font-black text-[#1f1d1a] transition hover:bg-[#f09a83] focus:outline-none focus:ring-2 focus:ring-[#e07a5f] focus:ring-offset-2 focus:ring-offset-[#262422]"
              >
                End game
              </button>
              <Link
                href="/"
                className="flex h-11 items-center rounded-md border border-[#5b554f] px-5 text-sm font-semibold text-[#eaedd0] transition hover:border-[#eaedd0] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#c6d6a7] focus:ring-offset-2 focus:ring-offset-[#262422]"
              >
                Setup new match
              </Link>
            </div>
          </div>
        </section>
      </div>

      {pendingPromotion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-lg border border-[#4a4540] bg-[#262422] p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Choose promotion</h2>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {promotionPieces.map((piece) => (
                <button
                  key={piece}
                  type="button"
                  onClick={() => makeMove(pendingPromotion.from, pendingPromotion.to, piece)}
                  className="aspect-square rounded-md border border-[#5b554f] bg-[#312e2b] text-4xl text-[#f8f5ed] transition hover:bg-[#3e3a35] focus:outline-none focus:ring-2 focus:ring-[#c6d6a7]"
                  aria-label={`Promote to ${piece}`}
                >
                  <Image
                    src={pieceImageSrc(pendingPromotion.color, piece)}
                    alt={`Promote to ${piece}`}
                    width={60}
                    height={60}
                    className="mx-auto h-[72%] w-[72%] object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function PlayerPanel({
  active,
  captures,
  color,
  moves,
  score,
  title,
}: {
  active: boolean;
  captures: CapturedPiece[];
  color: Color;
  moves: number;
  score: number;
  title: string;
}) {
  return (
    <aside
      className={[
        "flex min-h-0 flex-col items-center rounded-lg border p-4 text-center shadow-[0_16px_45px_rgba(0,0,0,0.28)] transition xl:min-h-[560px]",
        active
          ? "border-[#eaedd0] bg-[#f8f5ed] text-[#262422]"
          : "border-[#4a4540] bg-[#262422] text-[#f8f5ed]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-24 w-24 items-center justify-center rounded-full border",
          active
            ? "border-[#d4d0bd] bg-white"
            : "border-[#4a4540] bg-[#312e2b]",
        ].join(" ")}
      >
        <Image
          src={pieceImageSrc(color, "k")}
          alt={`${colorName(color)} king`}
          width={60}
          height={60}
          className="h-16 w-16 object-contain"
        />
      </div>
      <h2 className="mt-4 text-3xl font-black tracking-normal">{title}</h2>
      <p
        className={[
          "mt-1 text-sm font-semibold uppercase tracking-[0.18em]",
          active ? "text-[#55643f]" : "text-[#c6d6a7]",
        ].join(" ")}
      >
        {colorName(color)}
      </p>

      <div className="mt-6 grid w-full grid-cols-2 gap-3 xl:grid-cols-1">
        <div
          className={[
            "rounded-md p-3",
            active ? "bg-[#eaedd0]" : "bg-[#312e2b]",
          ].join(" ")}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em]">Score</p>
          <p className="mt-1 text-4xl font-black tabular-nums">
            {String(score).padStart(2, "0")}
          </p>
        </div>
        <div
          className={[
            "rounded-md p-3",
            active ? "bg-[#eaedd0]" : "bg-[#312e2b]",
          ].join(" ")}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em]">Moves</p>
          <p className="mt-1 text-4xl font-black tabular-nums">
            {String(moves).padStart(2, "0")}
          </p>
        </div>
      </div>

      <div className="mt-5 w-full">
        <p
          className={[
            "mb-2 text-left text-sm font-bold uppercase tracking-[0.14em]",
            active ? "text-[#55643f]" : "text-[#c6d6a7]",
          ].join(" ")}
        >
          Captured
        </p>
        <div
          className={[
            "flex min-h-12 flex-wrap items-center gap-1 rounded-md px-2 py-2 text-left",
            active ? "bg-[#eaedd0]" : "bg-[#312e2b]",
          ].join(" ")}
        >
          {captures.length ? (
            captures.map((piece, index) => (
              <Image
                key={`${title}-${piece.color}-${piece.type}-${index}`}
                src={pieceImageSrc(piece.color, piece.type)}
                alt={`${colorName(piece.color)} ${piece.type}`}
                width={60}
                height={60}
                className="h-7 w-7 object-contain"
              />
            ))
          ) : (
            <span className={active ? "text-sm text-[#625a50]" : "text-sm text-[#b7afa5]"}>
              None yet
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

function CapturedPieces({
  title,
  pieces,
}: {
  title: string;
  pieces: CapturedPiece[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#d8d2c8]">{title}</h3>
        <span className="text-xs font-semibold text-[#c6d6a7]">{pieces.length}</span>
      </div>
      <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-md bg-[#312e2b] px-2 py-2">
        {pieces.length ? (
          pieces.map((piece, index) => (
            <Image
              key={`${piece.by}-${piece.color}-${piece.type}-${index}`}
              src={pieceImageSrc(piece.color, piece.type)}
              alt={`${colorName(piece.color)} ${piece.type}`}
              width={60}
              height={60}
              className="h-7 w-7 object-contain"
            />
          ))
        ) : (
          <span className="text-sm text-[#b7afa5]">None yet</span>
        )}
      </div>
    </div>
  );
}
