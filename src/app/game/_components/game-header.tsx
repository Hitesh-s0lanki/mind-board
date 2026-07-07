import Image from "next/image";
import type { Color } from "chess.js";
import { Button } from "@/components/ui/button";
import { colorName } from "./chess-ui";

export function GameHeader({
  agentThinking,
  gameId,
  onResetGame,
  status,
  turn,
}: {
  agentThinking: boolean;
  gameId: string;
  onResetGame: () => void;
  status: string;
  turn: Color;
}) {
  return (
    <nav className="grid w-full gap-3 rounded-lg border border-white/10 bg-[#0d1110]/88 px-3 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src="/logo.png"
          alt="MindBoard Arena logo"
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
          priority
        />
        <div className="min-w-0">
          <p className="text-sm font-black tracking-[0.16em] text-[#9df6cf]">
            Mindboard arena
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-[#879b90]">
            {gameId}
          </p>
        </div>
      </div>

      <div className="min-w-0 lg:text-center">
        <p className="truncate text-xl font-black text-white">{status}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <div className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-[#d7e3dc]">
          {agentThinking ? "AI thinking" : `Turn: ${colorName(turn)}`}
        </div>
        <Button
          variant="destructive"
          size="default"
          type="button"
          onClick={onResetGame}
          className="bg-[#e07a5f] px-3 font-semibold text-[#101513] hover:bg-[#f09a83] focus-visible:ring-[#e07a5f]"
        >
          End game
        </Button>
      </div>
    </nav>
  );
}
