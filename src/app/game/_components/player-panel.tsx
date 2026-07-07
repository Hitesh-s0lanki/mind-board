import Image from "next/image";
import type { Color } from "chess.js";
import { colorName, pieceImageSrc } from "./chess-ui";
import type { CapturedPiece } from "./types";

export function PlayerPanel({
  active,
  avatarAlt,
  avatarSrc,
  captures,
  color,
  moves,
  score,
  title,
}: {
  active: boolean;
  avatarAlt?: string;
  avatarSrc?: string;
  captures: CapturedPiece[];
  color: Color;
  moves: number;
  score: number;
  title: string;
}) {
  return (
    <aside
      className={[
        "flex min-h-0 flex-col items-center rounded-lg border p-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition xl:min-h-[560px]",
        active
          ? "border-[#9df6cf] bg-[#f6f3e8] text-[#101513]"
          : "border-white/10 bg-[#17251f] text-[#f6f3e8]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-24 w-24 items-center justify-center rounded-full border",
          active
            ? "border-[#c8d8ce] bg-white shadow-[0_0_34px_rgba(157,246,207,0.28)]"
            : "border-white/10 bg-white/[0.06]",
        ].join(" ")}
      >
        <Image
          src={avatarSrc ?? pieceImageSrc(color, "k")}
          alt={avatarAlt ?? `${colorName(color)} king`}
          width={60}
          height={60}
          className="h-16 w-16 object-contain"
        />
      </div>
      <h2 className="mt-4 max-w-full truncate text-3xl font-black tracking-normal">
        {title}
      </h2>
      <p
        className={[
          "mt-1 text-sm font-semibold uppercase tracking-[0.18em]",
          active ? "text-[#23765f]" : "text-[#9df6cf]",
        ].join(" ")}
      >
        {colorName(color)}
      </p>

      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <PlayerMetric active={active} label="Score" value={score} />
        <PlayerMetric active={active} label="Moves" value={moves} />
      </div>

      <div className="mt-5 w-full">
        <p
          className={[
            "mb-2 text-left text-sm font-bold uppercase tracking-[0.14em]",
            active ? "text-[#23765f]" : "text-[#9df6cf]",
          ].join(" ")}
        >
          Captured
        </p>
        <div
          className={[
            "flex min-h-12 flex-wrap items-center gap-1 rounded-md px-2 py-2 text-left",
            active ? "bg-[#e4ead4]" : "bg-white/[0.06]",
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
            <span className={active ? "text-sm text-[#486259]" : "text-sm text-[#879b90]"}>
              None yet
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

function PlayerMetric({
  active,
  label,
  value,
}: {
  active: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className={["rounded-md p-3", active ? "bg-[#e4ead4]" : "bg-white/[0.06]"].join(" ")}>
      <p className="text-xs font-bold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}
