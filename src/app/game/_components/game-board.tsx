import Image from "next/image";
import type { Chess, Color, Move, Square } from "chess.js";
import { colorName, files, pieceImageSrc, ranks, squareName } from "./chess-ui";

export function GameBoard({
  board,
  checkedKing,
  lastMove,
  legalTargets,
  movableColor,
  onDragStart,
  onDrop,
  onSquareSelect,
  playerCanMove,
  selectedSquare,
}: {
  board: ReturnType<Chess["board"]>;
  checkedKing: Square | null;
  lastMove: Move | null;
  legalTargets: Set<Square>;
  movableColor: Color;
  onDragStart: (square: Square) => void;
  onDrop: (square: Square) => void;
  onSquareSelect: (square: Square) => void;
  playerCanMove: boolean;
  selectedSquare: Square | null;
}) {
  return (
    <div
      className="grid aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-[#0d1110] shadow-[0_34px_100px_rgba(0,0,0,0.46)]"
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
              draggable={Boolean(piece && piece.color === movableColor && playerCanMove)}
              onClick={() => onSquareSelect(square)}
              onDragStart={() => onDragStart(square)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onDrop(square);
              }}
              className={[
                "relative flex min-h-0 min-w-0 items-center justify-center select-none transition",
                isLight ? "bg-[#edf1d2]" : "bg-[#427c63]",
                isSelected ? "ring-2 ring-inset ring-[#9df6cf]" : "",
                isLastMove
                  ? "after:absolute after:inset-2 after:rounded-[10px] after:bg-[#9df6cf]/38"
                  : "",
                isCheckedKing ? "before:absolute before:inset-1 before:bg-[#e07a5f]/55" : "",
                isLegalTarget ? "hover:brightness-105" : "",
              ].join(" ")}
              aria-label={`${square}${piece ? ` ${colorName(piece.color)} ${piece.type}` : ""}`}
            >
              {fileIndex === 0 ? (
                <span
                  className={[
                    "absolute left-1 top-1 text-[10px] font-bold sm:text-xs",
                    isLight ? "text-[#427c63]" : "text-[#edf1d2]",
                  ].join(" ")}
                >
                  {ranks[rankIndex]}
                </span>
              ) : null}
              {rankIndex === 7 ? (
                <span
                  className={[
                    "absolute bottom-1 right-1 text-[10px] font-bold sm:text-xs",
                    isLight ? "text-[#427c63]" : "text-[#edf1d2]",
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
                      ? "h-[86%] w-[86%] border-4 border-[#9df6cf]/75"
                      : "h-4 w-4 bg-[#101513]/35 sm:h-5 sm:w-5",
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
  );
}
