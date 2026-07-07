import { ChatOpenAI } from "@langchain/openai";
import { createAgent, toolStrategy } from "langchain";
import { createChessUserMessage, getChessSystemPrompt } from "./chess-prompt";
import {
  ChessAgentOutputSchema,
} from "./chess-schema";
import type { ChessAgentInput, ChessAgentOutput } from "../game/types";

const DEFAULT_MODEL = "gpt-4o-mini";

function createModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local or .env.");
  }

  return new ChatOpenAI({
    model: process.env.CHESS_AGENT_MODEL ?? DEFAULT_MODEL,
    temperature: 0.25,
  });
}

export async function getChessAgentMove(
  input: ChessAgentInput,
): Promise<ChessAgentOutput> {
  const agent = createAgent({
    model: createModel(),
    tools: [],
    systemPrompt: getChessSystemPrompt(),
    responseFormat: toolStrategy(ChessAgentOutputSchema, {
      toolMessageContent: "Structured chess move selected.",
    }),
  });
  const result = await agent.invoke({
    messages: [{ role: "user", content: createChessUserMessage(input) }],
  });
  const parsed = ChessAgentOutputSchema.parse(result.structuredResponse);

  return {
    ...parsed,
    from: parsed.from as ChessAgentOutput["from"],
    to: parsed.to as ChessAgentOutput["to"],
    promotion: parsed.promotion ?? undefined,
  };
}
