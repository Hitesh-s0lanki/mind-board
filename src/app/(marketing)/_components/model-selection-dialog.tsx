"use client";

import { useEffect, useState } from "react";
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
  matchMode: "human-vs-agent" | "agent-vs-agent" | "human-vs-human";
  models: ModelChoice[];
  onClose: () => void;
  onSelect: (model: ModelChoice) => void;
  onStart: (
    model: ModelChoice,
    options?: {
      blackAgentProvider?: ModelChoice;
      claudeApiKey?: string;
      whiteAgentProvider?: ModelChoice;
    },
  ) => void;
  selectedModel: ModelChoice;
};

export function ModelSelectionDialog({
  isOpen,
  matchMode,
  models,
  onClose,
  onSelect,
  onStart,
  selectedModel,
}: ModelSelectionDialogProps) {
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [whiteAgentModel, setWhiteAgentModel] = useState<ModelChoice>(models[0]);
  const [blackAgentModel, setBlackAgentModel] = useState<ModelChoice>(
    models[1] ?? models[0],
  );
  const isAgentMatch = matchMode === "agent-vs-agent";
  const claudeSelected = isAgentMatch
    ? whiteAgentModel.id === "claude" || blackAgentModel.id === "claude"
    : selectedModel.id === "claude";
  const providersAreDifferent =
    !isAgentMatch || whiteAgentModel.id !== blackAgentModel.id;
  const claudeApiKeyReady = !claudeSelected || claudeApiKey.trim().length > 0;
  const canStart = providersAreDifferent && claudeApiKeyReady;

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
        className={[
          "mb-rise w-full rounded-lg border border-white/12 bg-[#101513] p-4 text-[#f6f3e8] shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-5",
          isAgentMatch ? "max-w-3xl" : "max-w-lg",
        ].join(" ")}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9df6cf]">
              {isAgentMatch ? "Select agents" : "Select opponent"}
            </p>
            <h2 id="model-dialog-title" className="mt-2 text-2xl font-black text-white">
              {isAgentMatch ? "Choose both sides." : "Choose the model."}
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

        {isAgentMatch ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AgentSidePicker
              label="White"
              models={models}
              selectedModel={whiteAgentModel}
              onSelect={setWhiteAgentModel}
            />
            <AgentSidePicker
              label="Black"
              models={models}
              selectedModel={blackAgentModel}
              onSelect={setBlackAgentModel}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {models.map((model) => {
              const isSelected = model.id === selectedModel.id;

              return (
                <ModelOption
                  key={model.id}
                  model={model}
                  selected={isSelected}
                  onClick={() => onSelect(model)}
                />
              );
            })}
          </div>
        )}

        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.05] p-3">
          <p className="text-sm font-semibold leading-6 text-[#c8d8ce]">
            {isAgentMatch && !providersAreDifferent
              ? "Choose two different providers so the agents can compete."
              : claudeSelected
              ? "Claude requires your API key before play starts. It is only used for that game and is not saved anywhere."
              : (isAgentMatch
                    ? whiteAgentModel.id === "qwen" || blackAgentModel.id === "qwen"
                    : selectedModel.id === "qwen")
                ? "Qwen may respond more slowly because it runs on a Modal serverless endpoint."
                : isAgentMatch
                  ? `${whiteAgentModel.name} plays White. ${blackAgentModel.name} plays Black.`
                  : `${selectedModel.name} will take the other side when the match begins.`}
          </p>
        </div>

        {claudeSelected ? (
          <div className="mt-4 rounded-md border border-[#f0b66f]/35 bg-[#f0b66f]/10 p-3">
            <label
              htmlFor="model-dialog-claude-key"
              className="text-xs font-black uppercase tracking-[0.16em] text-[#f0b66f]"
            >
              Claude API key
            </label>
            <input
              id="model-dialog-claude-key"
              type="password"
              value={claudeApiKey}
              onChange={(event) => setClaudeApiKey(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-..."
              className="mt-2 h-11 w-full rounded-md border border-white/12 bg-[#0d1110] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#879b90] focus:border-[#f0b66f] focus:ring-2 focus:ring-[#f0b66f]/35"
            />
            <p className="mt-2 text-xs font-semibold leading-5 text-[#c8d8ce]">
              Mandatory for Claude. This key is only used for this game and is
              not saved anywhere.
            </p>
          </div>
        ) : null}

        <button
          type="button"
          disabled={!canStart}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#9df6cf] px-5 text-base font-black text-[#101513] shadow-[0_16px_38px_rgba(55,203,152,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c9ffe5] focus:outline-none focus:ring-2 focus:ring-[#f6f3e8] focus:ring-offset-2 focus:ring-offset-[#101513] disabled:cursor-not-allowed disabled:bg-[#486259] disabled:text-[#9bac9f] disabled:shadow-none disabled:hover:translate-y-0"
          onClick={() =>
            onStart(selectedModel, {
              claudeApiKey: claudeSelected ? claudeApiKey.trim() : undefined,
              whiteAgentProvider: isAgentMatch ? whiteAgentModel : undefined,
              blackAgentProvider: isAgentMatch ? blackAgentModel : undefined,
            })
          }
        >
          Start fight
        </button>
      </div>
    </div>
  );
}

function AgentSidePicker({
  label,
  models,
  onSelect,
  selectedModel,
}: {
  label: string;
  models: ModelChoice[];
  onSelect: (model: ModelChoice) => void;
  selectedModel: ModelChoice;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9df6cf]">
        {label}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {models.map((model) => (
          <ModelOption
            compact
            key={`${label}-${model.id}`}
            model={model}
            selected={selectedModel.id === model.id}
            onClick={() => onSelect(model)}
          />
        ))}
      </div>
    </div>
  );
}

function ModelOption({
  compact = false,
  model,
  onClick,
  selected,
}: {
  compact?: boolean;
  model: ModelChoice;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        "group flex flex-col items-center justify-center gap-3 rounded-lg border p-3 text-center transition duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]",
        compact ? "min-h-24" : "min-h-28",
        selected
          ? "border-[#9df6cf] bg-[#9df6cf]/12"
          : "border-white/10 bg-white/[0.05] hover:border-white/22 hover:bg-white/[0.08]",
      ].join(" ")}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span
        className={[
          "flex items-center justify-center rounded-full bg-[#f6f3e8] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.3)] transition group-hover:scale-105",
          compact ? "h-12 w-12" : "h-14 w-14",
        ].join(" ")}
        style={{
          boxShadow: `0 0 0 1px ${model.accent}, 0 14px 34px rgba(0,0,0,0.3)`,
        }}
      >
        <Image
          src={model.icon}
          alt={`${model.name} logo`}
          width={32}
          height={32}
          className={compact ? "h-7 w-7 object-contain" : "h-8 w-8 object-contain"}
        />
      </span>
      <span className="text-sm font-black text-white">{model.name}</span>
    </button>
  );
}
