import Link from "next/link";

export type PreviousGameLog = {
  id: string;
  whiteName: string;
  blackName: string;
  statusLabel: string;
  statusTone: "active" | "draw" | "ended" | "loss" | "win";
  detail: string;
  updatedAt: string;
  href: string;
};

export function PreviousGamesSection({
  games,
}: {
  games: PreviousGameLog[];
}) {
  if (games.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-white/10 bg-[#101513] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9df6cf]">
              Match log
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              Previous games
            </h2>
          </div>
          <p className="text-sm font-semibold text-[#879b90]">
            {games.length} saved {games.length === 1 ? "game" : "games"}
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="group rounded-lg border border-white/10 bg-[#17251f] p-4 transition hover:-translate-y-0.5 hover:border-[#9df6cf]/60 hover:bg-[#1b2d25] focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-white">
                    {game.whiteName} vs {game.blackName}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#879b90]">
                    {game.id}
                  </p>
                </div>
                <StatusBadge label={game.statusLabel} tone={game.statusTone} />
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#c8d8ce]">
                  {game.detail}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#879b90]">
                  {formatUpdatedAt(game.updatedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: PreviousGameLog["statusTone"];
}) {
  const toneClass = {
    active: "border-[#9df6cf]/30 bg-[#9df6cf]/12 text-[#9df6cf]",
    draw: "border-[#89b4ff]/30 bg-[#89b4ff]/12 text-[#b8d0ff]",
    ended: "border-white/15 bg-white/[0.08] text-[#c8d8ce]",
    loss: "border-[#e07a5f]/35 bg-[#e07a5f]/12 text-[#f09a83]",
    win: "border-[#b6f26a]/35 bg-[#b6f26a]/12 text-[#d8ffa5]",
  }[tone];

  return (
    <span
      className={[
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-xs font-black uppercase tracking-[0.12em]",
        toneClass,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
