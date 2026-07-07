const arenaSignals = [
  { label: "Legal moves", value: "checked" },
  { label: "Turn state", value: "live" },
  { label: "AI reply", value: "queued" },
];

export function ArenaSection() {
  return (
    <section
      id="arena"
      className="border-y border-white/10 bg-[#f6f3e8] px-4 py-14 text-[#13201b] sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div className="max-w-xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#23765f]">
            Arena system
          </p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-[#101513] sm:text-5xl">
            Everything important stays on the board.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#486259]">
            Move legality, turn status, and model response live together, so the
            match feels like a real arena instead of a chat log.
          </p>
        </div>

        <div className="mb-rise rounded-lg border border-[#cad3c4] bg-[#101513] p-4 shadow-[0_24px_70px_rgba(16,21,19,0.18)] sm:p-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9df6cf]">
                Live match
              </p>
              <p className="mt-1 text-xl font-black text-white">White to move</p>
            </div>
            <div className="rounded-md bg-[#9df6cf] px-3 py-2 text-sm font-black text-[#101513]">
              e4 accepted
            </div>
          </div>

          <div className="grid gap-5 pt-5 md:grid-cols-[0.92fr_1.08fr] md:items-center">
            <div
              className="grid aspect-square overflow-hidden rounded-md border border-white/10"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
              aria-label="Simplified arena board preview"
              role="img"
            >
              {Array.from({ length: 16 }, (_, index) => {
                const isLight = (Math.floor(index / 4) + index) % 2 === 0;
                const isActive = index === 6 || index === 9 || index === 12;

                return (
                  <div
                    key={index}
                    className={[
                      "relative min-h-14",
                      isLight ? "bg-[#edf1d2]" : "bg-[#427c63]",
                      isActive
                        ? "after:absolute after:inset-[28%] after:rounded-full after:bg-[#9df6cf]/55"
                        : "",
                    ].join(" ")}
                  />
                );
              })}
            </div>

            <div className="grid gap-3">
              {arenaSignals.map((signal, index) => (
                <div
                  key={signal.label}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#9df6cf] shadow-[0_0_18px_rgba(157,246,207,0.8)]" />
                  <span className="text-sm font-bold text-[#d7e3dc]">{signal.label}</span>
                  <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#9df6cf]">
                    {signal.value}
                  </span>
                </div>
              ))}

              <div className="mt-2 rounded-md bg-[#f6f3e8] p-4 text-[#101513]">
                <p className="font-mono text-sm font-black">1. e4 c5 2. Nf3</p>
                <p className="mt-2 text-sm font-semibold text-[#486259]">
                  Clear state. Clean next move.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
