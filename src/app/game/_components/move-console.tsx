import type { Move } from "chess.js";

export function MoveConsole({
  agentError,
  agentThinking,
  moveHistory,
}: {
  agentError: string | null;
  agentThinking: boolean;
  moveHistory: Move[];
}) {
  const recentMovePairs = Array.from(
    { length: Math.ceil(moveHistory.length / 2) },
    (_, index) => ({
      black: moveHistory[index * 2 + 1]?.san,
      index,
      white: moveHistory[index * 2]?.san,
    }),
  ).slice(-4);

  return (
    <section className="w-full rounded-lg border border-white/10 bg-[#17251f] px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9df6cf]">
            Recent moves
          </p>
          <span className="text-xs font-semibold text-[#879b90]">
            {moveHistory.length}
          </span>
        </div>
        {agentError ? (
          <p className="truncate text-xs font-semibold text-[#e07a5f]">
            {agentError}
          </p>
        ) : agentThinking ? (
          <p className="text-xs font-semibold text-[#879b90]">Waiting for AI move.</p>
        ) : null}
      </div>

      <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {recentMovePairs.map((move) => (
          <li
            key={`${move.index}-${move.white ?? ""}-${move.black ?? ""}`}
            className="grid min-w-28 grid-cols-[1.4rem_1fr_1fr] gap-1.5 text-xs"
          >
            <span className="font-semibold text-[#9df6cf]">{move.index + 1}.</span>
            <span className="truncate font-semibold text-[#f6f3e8]">{move.white}</span>
            <span className="truncate font-semibold text-[#f6f3e8]">{move.black}</span>
          </li>
        ))}
        {moveHistory.length === 0 ? (
          <li className="text-sm font-semibold text-[#879b90]">
            Moves appear here.
          </li>
        ) : null}
      </ol>
    </section>
  );
}
