import Image from "next/image";

const previewPieces = [
  { src: "/chess-pieces/blackRook.png", square: "a8" },
  { src: "/chess-pieces/blackKnight.png", square: "b8" },
  { src: "/chess-pieces/blackBishop.png", square: "c8" },
  { src: "/chess-pieces/blackQueen.png", square: "d8" },
  { src: "/chess-pieces/blackKing.png", square: "e8" },
  { src: "/chess-pieces/blackPawn.png", square: "c5" },
  { src: "/chess-pieces/blackPawn.png", square: "d6" },
  { src: "/chess-pieces/whitePawn.png", square: "e4" },
  { src: "/chess-pieces/whiteKnight.png", square: "f3" },
  { src: "/chess-pieces/whiteBishop.png", square: "c4" },
  { src: "/chess-pieces/whiteQueen.png", square: "d1" },
  { src: "/chess-pieces/whiteKing.png", square: "e1" },
  { src: "/chess-pieces/whiteRook.png", square: "h1" },
];

export function BoardScene({ isBackground = false }: { isBackground?: boolean }) {
  return (
    <div
      className={[
        "relative mx-auto w-full max-w-[440px]",
        isBackground ? "pointer-events-none rotate-[-8deg] scale-105" : "",
      ].join(" ")}
      aria-hidden={isBackground}
    >
      <div className="mb-float rounded-lg border border-white/12 bg-[#0d1110]/88 p-2.5 shadow-[0_28px_88px_rgba(0,0,0,0.42)] backdrop-blur">
        <div className="grid gap-2 pb-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <Contestant label="Human" name="You" tone="light" />
          <div className="text-center text-[11px] font-black uppercase tracking-[0.16em] text-[#9df6cf]">
            vs
          </div>
          <Contestant label="LLM model" name="Arena Agent" tone="dark" />
        </div>

        <div className="relative overflow-hidden rounded-md border border-black/20">
          <div className="mb-scan absolute inset-0 z-10 bg-[linear-gradient(90deg,transparent,rgba(157,246,207,0.18),transparent)]" />
          <ChessBoard />
        </div>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_0.82fr]">
          <div className="rounded-md border border-white/10 bg-white/[0.06] p-2.5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9df6cf]">
              Arena feed
            </p>
            <p className="mt-1.5 text-xs leading-5 text-[#d7e3dc]">
              Human opens e4. The model answers c5.
            </p>
          </div>
          <div className="rounded-md bg-[#f6f3e8] p-2.5 text-[#101513]">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#23765f]">
              Current turn
            </p>
            <p className="mt-1.5 text-xl font-black">White to move</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChessBoard() {
  return (
    <div
      className="grid aspect-square"
      style={{
        gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
        gridTemplateRows: "repeat(8, minmax(0, 1fr))",
      }}
      aria-label="Preview chess board"
      role="img"
    >
      {Array.from({ length: 64 }, (_, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const square = `${String.fromCharCode(97 + col)}${8 - row}`;
        const piece = previewPieces.find((item) => item.square === square);
        const isFocusSquare = square === "e4" || square === "c5" || square === "f3";

        return (
          <div
            key={square}
            className={[
              "relative flex items-center justify-center",
              (row + col) % 2 === 0 ? "bg-[#edf1d2]" : "bg-[#427c63]",
              isFocusSquare
                ? "after:absolute after:inset-[18%] after:rounded-full after:bg-[#9df6cf]/35"
                : "",
            ].join(" ")}
          >
            {piece ? (
              <Image
                src={piece.src}
                alt=""
                width={52}
                height={52}
                className="relative z-10 h-[74%] w-[74%] object-contain drop-shadow-[0_4px_2px_rgba(0,0,0,0.35)]"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Contestant({
  label,
  name,
  tone,
}: {
  label: string;
  name: string;
  tone: "dark" | "light";
}) {
  return (
    <div
      className={[
        "rounded-md border p-2.5",
        tone === "light"
          ? "border-white/10 bg-white/[0.06]"
          : "border-[#9df6cf]/30 bg-[#15392f]",
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9df6cf]">
        {label}
      </p>
      <p className="mt-0.5 text-base font-black text-white">{name}</p>
    </div>
  );
}
