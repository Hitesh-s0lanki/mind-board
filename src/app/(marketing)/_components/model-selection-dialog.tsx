"use client";

import { useEffect } from "react";
import Image from "next/image";

export type ModelChoice = {
  id: string;
  name: string;
  icon: string;
  accent: string;
};

export const modelChoices: ModelChoice[] = [
  { id: "openai", name: "OpenAI", icon: "/llm-icons/openai.svg", accent: "#9df6cf" },
  { id: "claude", name: "Claude", icon: "/llm-icons/claude.svg", accent: "#f0b66f" },
  { id: "gemini", name: "Gemini", icon: "/llm-icons/gemini.svg", accent: "#89b4ff" },
  { id: "qwen", name: "Qwen", icon: "/llm-icons/qwen.svg", accent: "#b6f26a" },
];

type ModelSelectionDialogProps = {
  isOpen: boolean;
  models: ModelChoice[];
  onClose: () => void;
  onSelect: (model: ModelChoice) => void;
  onStart: (model: ModelChoice) => void;
  selectedModel: ModelChoice;
};

export function ModelSelectionDialog({
  isOpen,
  models,
  onClose,
  onSelect,
  onStart,
  selectedModel,
}: ModelSelectionDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050706]/72 px-4 py-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="model-dialog-title"
        aria-modal="true"
        className="mb-rise w-full max-w-lg rounded-lg border border-white/12 bg-[#101513] p-4 text-[#f6f3e8] shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-5"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9df6cf]">
              Select opponent
            </p>
            <h2 id="model-dialog-title" className="mt-2 text-2xl font-black text-white">
              Choose the model.
            </h2>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-lg font-black text-[#d7e3dc] transition hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
            onClick={onClose}
            aria-label="Close model selection"
          >
            x
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {models.map((model) => {
            const isSelected = model.id === selectedModel.id;

            return (
              <button
                key={model.id}
                type="button"
                className={[
                  "group flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border p-3 text-center transition duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]",
                  isSelected
                    ? "border-[#9df6cf] bg-[#9df6cf]/12"
                    : "border-white/10 bg-white/[0.05] hover:border-white/22 hover:bg-white/[0.08]",
                ].join(" ")}
                onClick={() => onSelect(model)}
                aria-pressed={isSelected}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f3e8] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.3)] transition group-hover:scale-105"
                  style={{ boxShadow: `0 0 0 1px ${model.accent}, 0 14px 34px rgba(0,0,0,0.3)` }}
                >
                  <Image
                    src={model.icon}
                    alt={`${model.name} logo`}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </span>
                <span className="text-sm font-black text-white">{model.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.05] p-3">
          <p className="text-sm font-semibold leading-6 text-[#c8d8ce]">
            {selectedModel.name} will take the other side when the match begins.
          </p>
        </div>

        <button
          type="button"
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#9df6cf] px-5 text-base font-black text-[#101513] shadow-[0_16px_38px_rgba(55,203,152,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c9ffe5] focus:outline-none focus:ring-2 focus:ring-[#f6f3e8] focus:ring-offset-2 focus:ring-offset-[#101513]"
          onClick={() => onStart(selectedModel)}
        >
          Start fight
        </button>
      </div>
    </div>
  );
}
