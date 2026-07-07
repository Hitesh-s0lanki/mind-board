import { Chess } from "chess.js";
import { getOrCreateGame } from "@/features/chess/game/db";
import {
  LocalChessGame,
  type AgentProvider,
  type PlayerNames,
} from "../_components/local-chess-game";

type GamePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    humanSide?: string;
    model?: string;
    white?: string;
    black?: string;
  }>;
};

const agentProviders = new Set<AgentProvider>([
  "openai",
  "claude",
  "gemini",
  "qwen",
]);

function cleanName(value: string | undefined, fallback: string) {
  return value?.trim().slice(0, 18) || fallback;
}

function cleanAgentProvider(value: string | undefined): AgentProvider {
  const provider = value?.trim().toLowerCase();

  if (agentProviders.has(provider as AgentProvider)) {
    return provider as AgentProvider;
  }

  return "openai";
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const humanSide = query.humanSide === "black" ? "black" : "white";
  const agentProvider = cleanAgentProvider(query.model);
  const playerNames: PlayerNames = {
    white: cleanName(query.white, "PLAYER-1"),
    black: cleanName(query.black, "MindBoard AI"),
  };
  const game = getOrCreateGame(id, {
    whiteName: playerNames.white,
    blackName: playerNames.black,
  });

  return (
    <LocalChessGame
      initialFen={game.fen}
      initialGameId={id}
      initialGameOver={new Chess(game.fen).isGameOver()}
      agentProvider={agentProvider}
      humanSide={humanSide}
      playerNames={{
        white: game.whiteName,
        black: game.blackName,
      }}
    />
  );
}
