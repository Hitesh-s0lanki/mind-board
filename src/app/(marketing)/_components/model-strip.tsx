import Image from "next/image";
import type { CSSProperties } from "react";

const modelLogos = [
  { name: "OpenAI", icon: "/llm-icons/openai.svg", accent: "#9df6cf" },
  { name: "Claude", icon: "/llm-icons/claude.svg", accent: "#f0b66f" },
  { name: "Gemini", icon: "/llm-icons/gemini.svg", accent: "#89b4ff" },
  { name: "Qwen", icon: "/llm-icons/qwen.svg", accent: "#b6f26a" },
];

export function ModelStrip() {
  return (
    <section
      id="models"
      className="relative overflow-visible border-y border-white/10 bg-[#17251f] px-4 py-7 sm:px-6 lg:px-8"
      aria-label="Supported model families"
    >
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1fr)] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9df6cf]">
            Choose the mind across the board
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#c8d8ce]">
            Model families framed as playable opponents, ready for the arena.
          </p>
        </div>

        <ul className="flex flex-wrap justify-center gap-4 lg:justify-end" aria-label="Model options">
          {modelLogos.map((model, index) => (
            <li key={model.name}>
              <ModelLogo {...model} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ModelLogo({
  accent,
  icon,
  index,
  name,
}: {
  accent: string;
  icon: string;
  index: number;
  name: string;
}) {
  const tooltipId = `model-tooltip-${name.toLowerCase()}`;

  return (
    <div
      aria-describedby={tooltipId}
      className="group/model relative mb-model-mark flex h-[76px] w-[76px] items-center justify-center rounded-full outline-none"
      style={
        {
          "--model-accent": accent,
          "--model-delay": `${index * 130}ms`,
        } as CSSProperties
      }
      tabIndex={0}
    >
      <span className="mb-model-ring pointer-events-none absolute inset-0 rounded-full border border-[var(--model-accent)] opacity-40" />
      <span className="pointer-events-none absolute inset-2 rounded-full border border-white/10 bg-white/[0.06]" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f3e8] p-3 shadow-[0_18px_46px_rgba(0,0,0,0.28)] transition duration-300 group-hover/model:-translate-y-1 group-hover/model:scale-110 group-focus-visible/model:-translate-y-1 group-focus-visible/model:scale-110 group-focus-visible/model:ring-2 group-focus-visible/model:ring-[var(--model-accent)] group-focus-visible/model:ring-offset-2 group-focus-visible/model:ring-offset-[#17251f]">
        <Image
          src={icon}
          alt={`${name} logo`}
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-white/10 bg-[#f6f3e8] px-3 py-2 text-xs font-black text-[#101513] opacity-0 shadow-[0_16px_38px_rgba(0,0,0,0.24)] transition duration-200 group-hover/model:translate-y-0 group-hover/model:opacity-100 group-focus-visible/model:translate-y-0 group-focus-visible/model:opacity-100"
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-white/10 bg-[#f6f3e8]" />
        {name}
      </span>
    </div>
  );
}
