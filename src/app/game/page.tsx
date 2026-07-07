import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

export default function GameRedirectPage() {
  redirect(`/game/game_${randomUUID()}`);
}
