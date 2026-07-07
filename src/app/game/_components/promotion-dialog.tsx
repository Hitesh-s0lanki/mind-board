import Image from "next/image";
import type { PieceSymbol } from "chess.js";
import { pieceImageSrc, promotionPieces } from "./chess-ui";
import type { PendingPromotion } from "./types";

export function PromotionDialog({
  onPromote,
  pendingPromotion,
}: {
  onPromote: (piece: PieceSymbol) => void;
  pendingPromotion: PendingPromotion;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050706]/72 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-white/12 bg-[#101513] p-5 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Choose promotion</h2>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {promotionPieces.map((piece) => (
            <button
              key={piece}
              type="button"
              onClick={() => onPromote(piece)}
              className="aspect-square rounded-md border border-white/10 bg-white/[0.06] text-4xl text-[#f6f3e8] transition hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-[#9df6cf]"
              aria-label={`Promote to ${piece}`}
            >
              <Image
                src={pieceImageSrc(pendingPromotion.color, piece)}
                alt={`Promote to ${piece}`}
                width={60}
                height={60}
                className="mx-auto h-[72%] w-[72%] object-contain"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
