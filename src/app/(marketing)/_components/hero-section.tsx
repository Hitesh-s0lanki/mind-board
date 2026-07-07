import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoardScene } from "./board-scene";
import { SiteHeader } from "./site-header";

type HeroSectionProps = {
  onPlayerNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  playerName: string;
};

export function HeroSection({
  onPlayerNameChange,
  onSubmit,
  playerName,
}: HeroSectionProps) {
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
            Human vs AI chess
          </p>
          <h1 className="mb-rise mt-5 text-4xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            Start the match.
          </h1>
          <p className="mb-rise mt-5 max-w-xl text-base leading-7 text-[#d7e3dc] sm:text-lg">
            Enter your name. The arena assigns a side and opens a legal chess
            game against the AI.
          </p>

          <form
            id="play"
            className="mb-rise mt-8 max-w-xl rounded-lg border border-white/12 bg-white/[0.08] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur"
            onSubmit={onSubmit}
          >
            <label htmlFor="player-name" className="sr-only">
              Challenger name
            </label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] items-center ">
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
                className="h-9 bg-[#9df6cf] text-base font-black text-[#101513] shadow-[0_16px_38px_rgba(55,203,152,0.22)] hover:-translate-y-0.5 hover:bg-[#c9ffe5] focus-visible:ring-[#f6f3e8]"
              >
                Start
              </Button>
            </div>
          </form>
        </div>

        <div className="mb-rise lg:translate-y-4">
          <BoardScene />
        </div>
      </div>
    </section>
  );
}
