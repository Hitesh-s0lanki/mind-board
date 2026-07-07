import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, toolStrategy } from "langchain";
import { createChessUserMessage, getChessSystemPrompt } from "./chess-prompt";
import {
  ChessAgentOutputSchema,
} from "./chess-schema";
import type { ChessAgentInput, ChessAgentOutput } from "../game/types";

export type ChessAgentProvider =
  | "openai"
  | "claude"
  | "gemini"
  | "qwen";

const DEFAULT_PROVIDER: ChessAgentProvider = "openai";
const DEFAULT_MODELS: Record<ChessAgentProvider, string> = {
  openai: "gpt-4o-mini",
  claude: "claude-sonnet-4-5-20250929",
  gemini: "gemini-2.5-flash",
  qwen: "Qwen/Qwen3.6-35B-A3B",
};
const PROVIDER_MODEL_ENV: Record<ChessAgentProvider, string> = {
  openai: "OPENAI_AGENT_MODEL",
  claude: "CLAUDE_AGENT_MODEL",
  gemini: "GEMINI_AGENT_MODEL",
  qwen: "QWEN_AGENT_MODEL",
};
const PROVIDERS = new Set<ChessAgentProvider>([
  "openai",
  "claude",
  "gemini",
  "qwen",
]);

function getEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getProvider(value: string | undefined): ChessAgentProvider {
  const provider = value?.trim().toLowerCase();

  if (!provider) {
    return DEFAULT_PROVIDER;
  }

  if (provider === "google") {
    return "gemini";
  }

  if (PROVIDERS.has(provider as ChessAgentProvider)) {
    return provider as ChessAgentProvider;
  }

  return DEFAULT_PROVIDER;
}

function getProviderModel(provider: ChessAgentProvider) {
  const model = getEnvValue(PROVIDER_MODEL_ENV[provider]) ?? DEFAULT_MODELS[provider];

  if (!model) {
    throw new Error(
      `${PROVIDER_MODEL_ENV[provider]} is missing. Add it to .env.local or .env.`,
    );
  }

  return model;
}

function modalBaseURL(endpointURL: string) {
  const endpoint = endpointURL.replace(/\/+$/, "");

  if (endpoint.endsWith("/v1")) {
    return endpoint;
  }

  return `${endpoint}/v1`;
}

function createModel(agentProvider?: string, options: { apiKey?: string } = {}) {
  const provider = getProvider(agentProvider);
  const model = getProviderModel(provider);

  if (provider === "gemini") {
    const apiKey = getEnvValue("GOOGLE_API_KEY", "GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY or GEMINI_API_KEY is missing. Add it to .env.local or .env.",
      );
    }

    return new ChatGoogleGenerativeAI({
      model,
      temperature: 0.25,
      apiKey,
    });
  }

  if (provider === "claude") {
    const apiKey = options.apiKey?.trim();
    if (!apiKey) {
      throw new Error(
        "Claude API key is required for this game. It is only used for the current match and is not saved.",
      );
    }

    return new ChatAnthropic({
      model,
      temperature: 0.25,
      apiKey,
    });
  }

  if (provider === "qwen") {
    const endpointURL = getEnvValue("MODAL_ENDPOINT_URL", "QWEN_MODAL_ENDPOINT_URL");
    const modalKey = getEnvValue("MODAL_PROXY_TOKEN_ID", "MODAL_KEY");
    const modalSecret = getEnvValue("MODAL_PROXY_TOKEN_SECRET", "MODAL_SECRET");

    if (!endpointURL || !modalKey || !modalSecret) {
      throw new Error(
        "MODAL_ENDPOINT_URL, MODAL_PROXY_TOKEN_ID, and MODAL_PROXY_TOKEN_SECRET are missing. Add them to .env.local or .env.",
      );
    }

    return new ChatOpenAI({
      model,
      temperature: 0.25,
      streamUsage: false,
      apiKey: getEnvValue("QWEN_MODAL_API_KEY") ?? "not-needed",
      configuration: {
        baseURL: modalBaseURL(endpointURL),
        defaultHeaders: {
          "Modal-Key": modalKey,
          "Modal-Secret": modalSecret,
        },
      },
    });
  }

  const apiKey = getEnvValue("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local or .env.");
  }

  return new ChatOpenAI({
    model,
    temperature: 0.25,
    apiKey,
  });
}

export async function getChessAgentMove(
  input: ChessAgentInput,
  agentProvider?: string,
  options: { apiKey?: string } = {},
): Promise<ChessAgentOutput> {
  const agent = createAgent({
    model: createModel(agentProvider, options),
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
