"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

const modelLogos = [
  { name: "OpenAI", icon: "/llm-icons/openai.svg", detail: "Tactical pressure" },
  { name: "Claude", icon: "/llm-icons/claude.svg", detail: "Deep reasoning" },
  { name: "Gemini", icon: "/llm-icons/gemini.svg", detail: "Pattern vision" },
  { name: "Llama", icon: "/llm-icons/meta.svg", detail: "Open-weight play" },
  { name: "Mistral", icon: "/llm-icons/mistral.svg", detail: "Fast replies" },
];

const benefits = [
  {
    eyebrow: "Refereed play",
    title: "Legal chess, not loose chat.",
    body: "Every attempted move is validated before it reaches the board, so the match stays readable and fair.",
  },
  {
    eyebrow: "Arena view",
    title: "The whole battle stays in sight.",
    body: "Board state, turns, captures, status, and match context live together instead of being scattered across a transcript.",
  },
  {
    eyebrow: "Model ready",
    title: "Built for AI opponents.",
    body: "Start with the local arena today and grow into richer model personalities, commentary, and replay logs.",
  },
];

const steps = [
  "Name your challenger",
  "Take White in the arena",
  "Force the model to answer",
];

const metrics = [
  { value: "64", label: "squares under pressure" },
  { value: "5", label: "model families framed" },
  { value: "0", label: "illegal moves accepted" },
];

export function ChessLanding() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("Human Challenger");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const gameId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `game_${crypto.randomUUID()}`
        : `game_${Date.now().toString(36)}`;

    const params = new URLSearchParams({
      white: playerName.trim() || "Human Challenger",
      black: "LLM Arena Agent",
    });

    router.push(`/game/${gameId}?${params.toString()}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#101513] text-[#f6f3e8]">
      <Hero playerName={playerName} onPlayerNameChange={setPlayerName} onSubmit={handleSubmit} />
      <ModelStrip />
      <section
        id="arena"
        className="border-y border-white/10 bg-[#f6f3e8] px-4 py-14 text-[#13201b] sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#23765f]">
              Why it feels different
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-[#101513] sm:text-5xl">
              A chess board made for watching minds collide.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[#486259] sm:text-lg">
            MindBoard Arena turns an AI chess game into a focused product experience:
            clear stakes, crisp state, visible reasoning hooks, and a direct path from
            curiosity to the first move.
          </p>
        </div>

        <div className="mx-auto mt-10 grid w-full max-w-7xl gap-4 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <article
              key={benefit.title}
              className="mb-rise rounded-lg border border-[#d2d8c7] bg-white p-5 shadow-[0_20px_60px_rgba(16,21,19,0.08)]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#23765f]">
                {benefit.eyebrow}
              </p>
              <h3 className="mt-4 text-2xl font-black leading-snug text-[#101513]">
                {benefit.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#486259]">{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#101513] px-4 py-14 text-[#f6f3e8] sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7bdcb5]">
              From landing to live match
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
              The CTA is the product demo.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#c8d8ce]">
              No signup maze and no placeholder promise. A visitor can type a name,
              launch a match, and immediately see how the arena handles human vs LLM
              chess.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-lg border border-white/10 bg-white/[0.06] p-5"
              >
                <p className="font-mono text-sm font-black text-[#9df6cf]">
                  0{index + 1}
                </p>
                <p className="mt-5 text-xl font-black leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Hero({
  onPlayerNameChange,
  onSubmit,
  playerName,
}: {
  onPlayerNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  playerName: string;
}) {
  return (
    <section className="relative isolate min-h-[86dvh] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,#101513_0%,#17251f_48%,#20352c_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-[linear-gradient(180deg,rgba(123,220,181,0.18),transparent)]" />
      <div className="absolute inset-y-10 right-[-220px] -z-10 hidden w-[820px] opacity-50 blur-[1px] lg:block">
        <BoardScene isBackground />
      </div>

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 py-3">
        <a
          href="#top"
          className="flex min-h-12 items-center gap-3 rounded-md pr-2 focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
          aria-label="MindBoard Arena home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={52}
            height={52}
            className="h-12 w-12 rounded-md object-contain"
            priority
          />
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.18em] text-[#9df6cf]">
              MindBoard
            </span>
            <span className="block text-sm font-semibold text-[#c8d8ce]">LLM Chess Arena</span>
          </span>
        </a>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
          <NavLink href="#arena">Arena</NavLink>
          <NavLink href="#models">Models</NavLink>
          <a
            href="#play"
            className="ml-2 inline-flex min-h-11 items-center justify-center rounded-md bg-[#f6f3e8] px-4 text-sm font-black text-[#101513] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
          >
            Start match
          </a>
        </nav>
      </header>

      <div
        id="top"
        className="mx-auto grid w-full max-w-7xl gap-8 py-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(420px,0.78fr)] lg:items-center lg:py-10"
      >
        <div className="max-w-3xl">
          <p className="mb-rise text-sm font-black uppercase tracking-[0.18em] text-[#9df6cf]">
            Human strategy vs model instinct
          </p>
          <h1 className="mb-rise mt-5 text-5xl font-black leading-[0.98] text-white sm:text-7xl lg:text-8xl">
            MindBoard Arena
          </h1>
          <p className="mb-rise mt-6 max-w-2xl text-lg leading-8 text-[#d7e3dc] sm:text-xl">
            A cinematic chess arena where you challenge an LLM opponent, watch every
            legal move land, and turn the match into a clear battle story.
          </p>

          <div className="mb-rise mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#play"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#9df6cf] px-6 text-base font-black text-[#101513] shadow-[0_18px_45px_rgba(55,203,152,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c9ffe5] focus:outline-none focus:ring-2 focus:ring-[#f6f3e8] focus:ring-offset-2 focus:ring-offset-[#101513]"
            >
              Challenge the AI
            </a>
            <a
              href="#arena"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/20 bg-white/[0.07] px-6 text-base font-black text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
            >
              Explore the arena
            </a>
          </div>

          <form
            id="play"
            className="mb-rise mt-8 max-w-2xl rounded-lg border border-white/12 bg-[#0d1110]/80 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur"
            onSubmit={onSubmit}
          >
            <label
              htmlFor="player-name"
              className="block px-1 pb-2 text-sm font-bold text-[#d7e3dc]"
            >
              Choose your challenger name
            </label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="player-name"
                value={playerName}
                onChange={(event) => onPlayerNameChange(event.target.value)}
                className="h-12 min-w-0 rounded-md border border-white/12 bg-white/[0.08] px-4 text-base font-semibold text-white outline-none transition placeholder:text-[#7f9188] focus:border-[#9df6cf] focus:ring-2 focus:ring-[#9df6cf]/25"
                maxLength={18}
                placeholder="Enter your name"
                autoComplete="nickname"
              />
              <button
                type="submit"
                className="inline-flex h-12 min-w-36 items-center justify-center rounded-md bg-[#f6f3e8] px-5 text-base font-black text-[#101513] transition duration-200 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
              >
                Start match
              </button>
            </div>
          </form>

          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="border-l border-white/14 pl-4">
                <p className="font-mono text-3xl font-black text-[#9df6cf]">{metric.value}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#c8d8ce]">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-rise lg:translate-y-4">
          <BoardScene />
        </div>
      </div>
    </section>
  );
}

function BoardScene({ isBackground = false }: { isBackground?: boolean }) {
  return (
    <div
      className={[
        "relative mx-auto w-full max-w-[560px]",
        isBackground ? "pointer-events-none rotate-[-8deg] scale-110" : "",
      ].join(" ")}
      aria-hidden={isBackground}
    >
      <div className="mb-float rounded-lg border border-white/12 bg-[#0d1110]/88 p-3 shadow-[0_34px_110px_rgba(0,0,0,0.46)] backdrop-blur">
        <div className="grid gap-3 pb-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <Contestant label="Human" name="You" tone="light" />
          <div className="text-center text-xs font-black uppercase tracking-[0.18em] text-[#9df6cf]">
            vs
          </div>
          <Contestant label="LLM model" name="Arena Agent" tone="dark" />
        </div>

        <div className="relative overflow-hidden rounded-md border border-black/20">
          <div className="mb-scan absolute inset-0 z-10 bg-[linear-gradient(90deg,transparent,rgba(157,246,207,0.18),transparent)]" />
          <ChessBoard />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_0.82fr]">
          <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9df6cf]">
              Arena feed
            </p>
            <p className="mt-2 text-sm leading-6 text-[#d7e3dc]">
              Human opens e4. The model answers c5 and steers the match into an
              imbalanced Sicilian fight.
            </p>
          </div>
          <div className="rounded-md bg-[#f6f3e8] p-3 text-[#101513]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#23765f]">
              Current turn
            </p>
            <p className="mt-2 text-2xl font-black">White to move</p>
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
              isFocusSquare ? "after:absolute after:inset-[18%] after:rounded-full after:bg-[#9df6cf]/35" : "",
            ].join(" ")}
          >
            {piece ? (
              <Image
                src={piece.src}
                alt=""
                width={60}
                height={60}
                className="relative z-10 h-[78%] w-[78%] object-contain drop-shadow-[0_4px_2px_rgba(0,0,0,0.35)]"
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
        "rounded-md border p-3",
        tone === "light"
          ? "border-white/10 bg-white/[0.06]"
          : "border-[#9df6cf]/30 bg-[#15392f]",
      ].join(" ")}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9df6cf]">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{name}</p>
    </div>
  );
}

function ModelStrip() {
  return (
    <section
      id="models"
      className="border-t border-white/10 bg-[#17251f] px-4 py-5 sm:px-6 lg:px-8"
      aria-label="Supported model families"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9df6cf]">
          Model opponents framed for the arena
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {modelLogos.map((model) => (
            <ModelLogo key={model.name} {...model} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModelLogo({
  detail,
  icon,
  name,
}: {
  detail: string;
  icon: string;
  name: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f6f3e8] p-2">
        <Image
          src={icon}
          alt={`${name} logo`}
          width={24}
          height={24}
          className="h-6 w-6 object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-white">{name}</p>
        <p className="text-xs leading-5 text-[#c8d8ce]">{detail}</p>
      </div>
    </div>
  );
}

function NavLink({ children, href }: { children: string; href: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-bold text-[#d7e3dc] transition duration-200 hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
    >
      {children}
    </a>
  );
}
