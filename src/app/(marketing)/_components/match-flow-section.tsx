const githubUrl = "https://github.com/Hitesh-s0lanki/mind-board";

const footerStats = [
  { label: "Side", value: "random" },
  { label: "Rules", value: "legal" },
  { label: "Mode", value: "human vs AI" },
];

export function MatchFlowSection() {
  return (
    <footer className="bg-[#101513] px-4 py-12 text-[#f6f3e8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7bdcb5]">
              Ready when the board is
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Pick a name. The arena picks the side.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#c8d8ce]">
              You may land as White or Black. The board reveals the allocation
              before the first move.
            </p>
          </div>

          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/12 bg-white/[0.06] px-5 text-sm font-black text-white transition duration-200 hover:-translate-y-0.5 hover:border-[#9df6cf]/50 hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
          >
            GitHub
          </a>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {footerStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7bdcb5]">
                {stat.label}
              </p>
              <p className="mt-3 text-lg font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm font-semibold text-[#879b90] sm:flex-row sm:items-center sm:justify-between">
          <p>Mindboard arena</p>
          <p>Human vs AI chess</p>
        </div>
      </div>
    </footer>
  );
}
