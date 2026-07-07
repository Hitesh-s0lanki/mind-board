import { Chess } from "chess.js";
import { LocalChessGame, type PlayerNames } from "@/features/chess/components/local-chess-game";
import { getAllChatMessages, getOrCreateGame } from "@/features/chess/game/db";

type GamePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    white?: string;
    black?: string;
  }>;
};

function cleanName(value: string | undefined, fallback: string) {
  return value?.trim().slice(0, 18) || fallback;
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
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
      initialChatHistory={getAllChatMessages(id)}
      initialFen={game.fen}
      initialGameId={id}
      initialGameOver={new Chess(game.fen).isGameOver()}
      playerNames={{
        white: game.whiteName,
        black: game.blackName,
      }}
    />
  );
}
