import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardScene } from "./board-scene";
import { SiteHeader } from "./site-header";

type HeroSectionProps = {
  matchMode: "human-vs-agent" | "agent-vs-agent" | "human-vs-human";
  onAgentMatch: () => void;
  onMatchModeChange: (
    mode: "human-vs-agent" | "agent-vs-agent" | "human-vs-human",
  ) => void;
  onPlayerNameChange: (value: string) => void;
  onSecondPlayerNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  playerName: string;
  secondPlayerName: string;
};

export function HeroSection({
  matchMode,
  onAgentMatch,
  onMatchModeChange,
  onPlayerNameChange,
  onSecondPlayerNameChange,
  onSubmit,
  playerName,
  secondPlayerName,
}: HeroSectionProps) {
  const isAgentMatch = matchMode === "agent-vs-agent";
  const isHumanMatch = matchMode === "human-vs-human";

  return (
    <section className="relative isolate min-h-[78dvh] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,#101513_0%,#17251f_48%,#20352c_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-[linear-gradient(180deg,rgba(123,220,181,0.18),transparent)]" />
      <div className="absolute inset-y-10 right-[-220px] -z-10 hidden w-[820px] opacity-50 blur-[1px] lg:block">
        <BoardScene isBackground />
      </div>

      <SiteHeader />

      <div
        id="top"
        className="mx-auto grid w-full max-w-7xl gap-8 py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(400px,0.78fr)] lg:items-center"
      >
        <div className="max-w-2xl">
          <p className="mb-rise text-sm font-black uppercase tracking-[0.18em] text-[#9df6cf]">
            {isAgentMatch
              ? "Agent vs agent arena"
              : isHumanMatch
                ? "Human vs human chess"
                : "Human vs AI chess"}
          </p>
          <h1 className="mb-rise mt-5 text-4xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {isAgentMatch
              ? "Run the duel."
              : isHumanMatch
                ? "Play locally."
                : "Start the match."}
          </h1>
          <p className="mb-rise mt-5 max-w-xl text-base leading-7 text-[#d7e3dc] sm:text-lg">
            {isAgentMatch
              ? "Pick two model providers, assign White and Black, then watch them compete move by move."
              : isHumanMatch
                ? "Enter both player names and start a saved local chess game on the same board."
                : "Enter your name. The arena assigns a side and opens a legal chess game against the AI."}
          </p>

          <div
            aria-label="Match mode"
            className="mb-rise mt-7 grid max-w-xl grid-cols-3 rounded-lg border border-white/12 bg-white/[0.06] p-1"
            role="tablist"
          >
            <button
              aria-selected={matchMode === "human-vs-agent"}
              className={[
                "h-11 rounded-md text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]",
                matchMode === "human-vs-agent"
                  ? "bg-[#9df6cf] text-[#101513]"
                  : "text-[#c8d8ce] hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
              onClick={() => onMatchModeChange("human-vs-agent")}
              role="tab"
              type="button"
            >
              Human vs AI
            </button>
            <button
              aria-selected={isHumanMatch}
              className={[
                "h-11 rounded-md text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]",
                isHumanMatch
                  ? "bg-[#9df6cf] text-[#101513]"
                  : "text-[#c8d8ce] hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
              onClick={() => onMatchModeChange("human-vs-human")}
              role="tab"
              type="button"
            >
              Human vs Human
            </button>
            <button
              aria-selected={isAgentMatch}
              className={[
                "h-11 rounded-md text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]",
                isAgentMatch
                  ? "bg-[#9df6cf] text-[#101513]"
                  : "text-[#c8d8ce] hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
              onClick={() => onMatchModeChange("agent-vs-agent")}
              role="tab"
              type="button"
            >
              Agent vs Agent
            </button>
          </div>

          <form
            id="play"
            className="mb-rise mt-8 max-w-xl rounded-lg border border-white/12 bg-white/[0.08] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur"
            onSubmit={onSubmit}
          >
            {isAgentMatch ? (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="rounded-md bg-[#0d1110]/82 px-4 py-3">
                  <p className="text-sm font-black text-white">
                    Choose White and Black agents
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#879b90]">
                    Providers must be different before the match begins.
                  </p>
                </div>
                <Button
                  type="button"
                  className="h-11 bg-[#9df6cf] px-6 text-base font-black text-[#101513] shadow-[0_16px_38px_rgba(55,203,152,0.22)] hover:-translate-y-0.5 hover:bg-[#c9ffe5] focus-visible:ring-[#f6f3e8]"
                  onClick={onAgentMatch}
                >
                  Choose agents
                </Button>
              </div>
            ) : isHumanMatch ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label htmlFor="white-player-name" className="sr-only">
                    White player name
                  </label>
                  <Input
                    id="white-player-name"
                    value={playerName}
                    onChange={(event) => onPlayerNameChange(event.target.value)}
                    className="h-11 border-white/10 bg-[#0d1110]/82 text-base font-bold text-white placeholder:text-[#7f9188] focus-visible:border-[#9df6cf] focus-visible:bg-[#0d1110] focus-visible:ring-[#9df6cf]/25"
                    maxLength={18}
                    placeholder="White player"
                    autoComplete="nickname"
                  />
                  <label htmlFor="black-player-name" className="sr-only">
                    Black player name
                  </label>
                  <Input
                    id="black-player-name"
                    value={secondPlayerName}
                    onChange={(event) =>
                      onSecondPlayerNameChange(event.target.value)
                    }
                    className="h-11 border-white/10 bg-[#0d1110]/82 text-base font-bold text-white placeholder:text-[#7f9188] focus-visible:border-[#9df6cf] focus-visible:bg-[#0d1110] focus-visible:ring-[#9df6cf]/25"
                    maxLength={18}
                    placeholder="Black player"
                    autoComplete="nickname"
                  />
                </div>
                <Button
                  type="submit"
                  className="mt-2 h-11 w-full bg-[#9df6cf] px-6 text-base font-black text-[#101513] shadow-[0_16px_38px_rgba(55,203,152,0.22)] hover:-translate-y-0.5 hover:bg-[#c9ffe5] focus-visible:ring-[#f6f3e8]"
                >
                  Start local game
                </Button>
              </>
            ) : (
              <>
                <label htmlFor="player-name" className="sr-only">
                  Challenger name
                </label>
                <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    id="player-name"
                    value={playerName}
                    onChange={(event) => onPlayerNameChange(event.target.value)}
                    className="h-11 border-white/10 bg-[#0d1110]/82 text-base font-bold text-white placeholder:text-[#7f9188] focus-visible:border-[#9df6cf] focus-visible:bg-[#0d1110] focus-visible:ring-[#9df6cf]/25"
                    maxLength={18}
                    placeholder="Your name"
                    autoComplete="nickname"
                  />
                  <Button
                    type="submit"
                    className="h-11 bg-[#9df6cf] px-6 text-base font-black text-[#101513] shadow-[0_16px_38px_rgba(55,203,152,0.22)] hover:-translate-y-0.5 hover:bg-[#c9ffe5] focus-visible:ring-[#f6f3e8]"
                  >
                    Start
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="mb-rise lg:translate-y-4">
          <BoardScene />
        </div>
      </div>
    </section>
  );
}
