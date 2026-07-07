import { Chess } from "chess.js";
import {
  getGameMoveInputs,
  getOrCreateGame,
  upsertAppUser,
} from "@/features/chess/game/db";
import { getRequestSessionId } from "@/lib/server-session";
import {
  LocalChessGame,
  type AgentProvider,
  type GameMode,
} from "../_components/local-chess-game";

type GamePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    black?: string;
    blackModel?: string;
    humanSide?: string;
    mode?: string;
    model?: string;
    white?: string;
    whiteModel?: string;
  }>;
};

const agentProviders = new Set<AgentProvider>([
  "openai",
  "claude",
  "gemini",
  "qwen",
]);

function cleanAgentProvider(value: string | undefined): AgentProvider {
  const provider = value?.trim().toLowerCase();

  if (agentProviders.has(provider as AgentProvider)) {
    return provider as AgentProvider;
  }

  return "openai";
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const queryGameMode: GameMode | undefined =
    query.mode === "agent-vs-agent"
      ? "agent-vs-agent"
      : query.mode === "human-vs-human"
        ? "human-vs-human"
        : undefined;
  const queryHumanSide = query.humanSide === "black" ? "black" : query.humanSide === "white" ? "white" : undefined;
  const queryAgentProvider = query.model ? cleanAgentProvider(query.model) : undefined;
  const whiteAgentProvider = query.whiteModel
    ? cleanAgentProvider(query.whiteModel)
    : undefined;
  const blackAgentProvider = query.blackModel
    ? cleanAgentProvider(query.blackModel)
    : undefined;
  const sessionId = await getRequestSessionId();
  const game = await getOrCreateGame(id, {
    whiteName: query.white,
    blackName: query.black,
    sessionId,
    gameMode: queryGameMode,
    humanSide: queryHumanSide,
    agentProvider: queryAgentProvider,
    whiteAgentProvider,
    blackAgentProvider,
  });
  const gameMode: GameMode =
    game.gameMode === "agent-vs-agent"
      ? "agent-vs-agent"
      : game.gameMode === "human-vs-human"
        ? "human-vs-human"
        : "human-vs-agent";
  const humanSide = game.humanSide === "black" ? "black" : "white";
  const agentProvider = cleanAgentProvider(
    game.agentProvider ?? query.model ?? game.blackAgentProvider ?? undefined,
  );
  const savedWhiteAgentProvider = cleanAgentProvider(
    game.whiteAgentProvider ?? query.whiteModel,
  );
  const savedBlackAgentProvider = cleanAgentProvider(
    game.blackAgentProvider ?? query.blackModel,
  );
  const initialMoves = await getGameMoveInputs(id);

  if (sessionId) {
    await upsertAppUser(
      sessionId,
      humanSide === "white" ? game.whiteName : game.blackName,
    );
  }

  return (
    <LocalChessGame
      initialFen={game.fen}
      initialGameId={id}
      initialGameOver={new Chess(game.fen).isGameOver()}
      initialMoves={initialMoves}
      agentProvider={agentProvider}
      gameMode={gameMode}
      humanSide={humanSide}
      playerNames={{
        white: game.whiteName,
        black: game.blackName,
      }}
      whiteAgentProvider={savedWhiteAgentProvider}
      blackAgentProvider={savedBlackAgentProvider}
    />
  );
}
