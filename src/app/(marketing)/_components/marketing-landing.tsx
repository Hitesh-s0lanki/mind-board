"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArenaSection } from "./arena-section";
import { HeroSection } from "./hero-section";
import { MatchFlowSection } from "./match-flow-section";
import {
  ModelSelectionDialog,
  modelChoices,
  type ModelChoice,
} from "./model-selection-dialog";
import { ModelStrip } from "./model-strip";

export function MarketingLanding() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("Human Challenger");
  const [selectedModel, setSelectedModel] = useState<ModelChoice>(modelChoices[0]);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsModelDialogOpen(true);
  }

  function startMatch(model: ModelChoice) {
    const gameId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `game_${crypto.randomUUID()}`
        : `game_${Date.now().toString(36)}`;

    const challengerName = playerName.trim() || "Human Challenger";
    const modelName = `${model.name} Agent`;
    const playerIsWhite = Math.random() >= 0.5;

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
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        onSubmit={handleSubmit}
      />
      <ModelStrip />
      <ArenaSection />
      <MatchFlowSection />
      <ModelSelectionDialog
        isOpen={isModelDialogOpen}
        models={modelChoices}
        selectedModel={selectedModel}
        onClose={() => setIsModelDialogOpen(false)}
        onSelect={setSelectedModel}
        onStart={startMatch}
      />
    </main>
  );
}
