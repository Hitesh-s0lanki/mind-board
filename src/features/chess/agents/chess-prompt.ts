import { readFileSync } from "node:fs";
import path from "node:path";
import type { ChessAgentInput } from "../game/types";

const promptTemplate = readFileSync(
  path.join(process.cwd(), "src/features/chess/agents/prompts/chess-agent.md"),
  "utf8",
).trim();

export function getChessSystemPrompt() {
  return promptTemplate;
}

export function createChessUserMessage(input: ChessAgentInput): string {
  const chatHistory = input.chatHistory.length
    ? input.chatHistory
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n")
    : "No previous chat messages.";

  return `
Side to move: ${input.side}
Opponent: ${input.opponent}

Current board:
${input.boardView}

Last move:
${input.lastMove ?? "No last move"}

Recent chat history (last 10 messages):
${chatHistory}

${input.validationFeedback ? `Validation feedback from the referee:\n${input.validationFeedback}` : ""}
`.trim();
}
