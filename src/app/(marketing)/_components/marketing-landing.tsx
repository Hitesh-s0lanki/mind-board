"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setEphemeralClaudeApiKey } from "@/features/chess/agents/ephemeral-claude-key";
import { ArenaSection } from "./arena-section";
import { HeroSection } from "./hero-section";
import { MatchFlowSection } from "./match-flow-section";
import {
  ModelSelectionDialog,
  modelChoices,
  type ModelChoice,
} from "./model-selection-dialog";
import { ModelStrip } from "./model-strip";
import {
  PreviousGamesSection,
  type PreviousGameLog,
} from "./previous-games-section";

export function MarketingLanding({
  previousGames = [],
}: {
  previousGames?: PreviousGameLog[];
}) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("Human Challenger");
  const [secondPlayerName, setSecondPlayerName] = useState("Player 2");
  const [matchMode, setMatchMode] = useState<
    "human-vs-agent" | "agent-vs-agent" | "human-vs-human"
  >("human-vs-agent");
  const [selectedModel, setSelectedModel] = useState<ModelChoice>(modelChoices[0]);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (matchMode === "human-vs-human") {
      startHumanMatch();
      return;
    }

    setIsModelDialogOpen(true);
  }

  function handleAgentMatch() {
    setMatchMode("agent-vs-agent");
    setIsModelDialogOpen(true);
  }

  function startHumanMatch() {
    const gameId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `game_${crypto.randomUUID()}`
        : `game_${Date.now().toString(36)}`;
    const whiteName = playerName.trim() || "Player 1";
    const blackName = secondPlayerName.trim() || "Player 2";
    const params = new URLSearchParams({
      white: whiteName,
      black: blackName,
      mode: "human-vs-human",
    });

    router.push(`/game/${gameId}?${params.toString()}`);
  }

  function startMatch(
    model: ModelChoice,
    options: {
      blackAgentProvider?: ModelChoice;
      claudeApiKey?: string;
      whiteAgentProvider?: ModelChoice;
    } = {},
  ) {
    const gameId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `game_${crypto.randomUUID()}`
        : `game_${Date.now().toString(36)}`;

    if (matchMode === "agent-vs-agent") {
      const whiteAgent = options.whiteAgentProvider ?? modelChoices[0];
      const blackAgent = options.blackAgentProvider ?? modelChoices[1] ?? modelChoices[0];

      if (options.claudeApiKey) {
        setEphemeralClaudeApiKey(gameId, options.claudeApiKey);
      }

      const params = new URLSearchParams({
        white: `${whiteAgent.name} Agent`,
        black: `${blackAgent.name} Agent`,
        mode: "agent-vs-agent",
        whiteModel: whiteAgent.id,
        blackModel: blackAgent.id,
      });

      router.push(`/game/${gameId}?${params.toString()}`);
      return;
    }

    const challengerName = playerName.trim() || "Human Challenger";
    const modelName = `${model.name} Agent`;
    const playerIsWhite = Math.random() >= 0.5;

    if (model.id === "claude" && options.claudeApiKey) {
      setEphemeralClaudeApiKey(gameId, options.claudeApiKey);
    }

    const params = new URLSearchParams({
      white: playerIsWhite ? challengerName : modelName,
      black: playerIsWhite ? modelName : challengerName,
      humanSide: playerIsWhite ? "white" : "black",
      model: model.id,
    });

    router.push(`/game/${gameId}?${params.toString()}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#101513] text-[#f6f3e8]">
      <HeroSection
        matchMode={matchMode}
        onAgentMatch={handleAgentMatch}
        onMatchModeChange={setMatchMode}
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        secondPlayerName={secondPlayerName}
        onSecondPlayerNameChange={setSecondPlayerName}
        onSubmit={handleSubmit}
      />
      <ModelStrip />
      <PreviousGamesSection games={previousGames} />
      <ArenaSection />
      <MatchFlowSection />
      <ModelSelectionDialog
        isOpen={isModelDialogOpen}
        matchMode={matchMode}
        models={modelChoices}
        selectedModel={selectedModel}
        onClose={() => setIsModelDialogOpen(false)}
        onSelect={setSelectedModel}
        onStart={startMatch}
      />
    </main>
  );
}
