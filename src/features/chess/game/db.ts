import { Chess } from "chess.js";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { appUsers, chatMessages, games } from "@/db/schema";

export type GameRecord = {
  id: string;
  sessionId: string | null;
  fen: string;
  whiteName: string;
  blackName: string;
  gameMode: string;
  humanSide: string | null;
  agentProvider: string | null;
  whiteAgentProvider: string | null;
  blackAgentProvider: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatRole = "human" | "agent";

export type ChatMessageRecord = {
  id: number;
  gameId: string;
  role: ChatRole;
  content: string;
  structuredJson: string | null;
  fenBefore: string | null;
  fenAfter: string | null;
  createdAt: string;
};

export type StoredMoveInput = {
  from: string;
  to: string;
  promotion?: string;
};

type GameRow = typeof games.$inferSelect;
type ChatMessageRow = typeof chatMessages.$inferSelect;

function now() {
  return new Date().toISOString();
}

function cleanName(value: string | undefined, fallback: string) {
  return value?.trim().slice(0, 18) || fallback;
}

function mapGame(row: GameRow): GameRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    fen: row.fen,
    whiteName: row.whiteName,
    blackName: row.blackName,
    gameMode: row.gameMode,
    humanSide: row.humanSide,
    agentProvider: row.agentProvider,
    whiteAgentProvider: row.whiteAgentProvider,
    blackAgentProvider: row.blackAgentProvider,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapChatMessage(row: ChatMessageRow): ChatMessageRecord {
  return {
    id: row.id,
    gameId: row.gameId,
    role: row.role === "agent" ? "agent" : "human",
    content: row.content,
    structuredJson: row.structuredJson,
    fenBefore: row.fenBefore,
    fenAfter: row.fenAfter,
    createdAt: row.createdAt,
  };
}

function parseStructuredJson(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function moveInputFromMessage(message: ChatMessageRecord): StoredMoveInput | null {
  const structuredJson = parseStructuredJson(message.structuredJson);

  if (!structuredJson || structuredJson.valid === false) {
    return null;
  }

  if (
    typeof structuredJson.from !== "string" ||
    typeof structuredJson.to !== "string"
  ) {
    return null;
  }

  return {
    from: structuredJson.from,
    to: structuredJson.to,
    promotion:
      typeof structuredJson.promotion === "string"
        ? structuredJson.promotion
        : undefined,
  };
}

export async function upsertAppUser(sessionId: string, name?: string) {
  const displayName = cleanName(name, "Human Challenger");

  await getDb()
    .insert(appUsers)
    .values({
      sessionId,
      name: displayName,
      updatedAt: now(),
    })
    .onConflictDoUpdate({
      target: appUsers.sessionId,
      set: {
        ...(name?.trim() ? { name: displayName } : {}),
        updatedAt: now(),
      },
    });
}

export async function getGame(id: string): Promise<GameRecord | null> {
  const [row] = await getDb().select().from(games).where(eq(games.id, id)).limit(1);
  return row ? mapGame(row) : null;
}

export async function getOrCreateGame(
  id: string,
  options: {
    whiteName?: string;
    blackName?: string;
    sessionId?: string | null;
    gameMode?: "human-vs-agent" | "agent-vs-agent" | "human-vs-human";
    humanSide?: "white" | "black";
    agentProvider?: string;
    whiteAgentProvider?: string;
    blackAgentProvider?: string;
  } = {},
) {
  if (options.sessionId) {
    await upsertAppUser(
      options.sessionId,
      options.humanSide === "black" ? options.blackName : options.whiteName,
    );
  }

  const existing = await getGame(id);

  if (existing) {
    const updates: Partial<typeof games.$inferInsert> = {};
    const whiteName = options.whiteName?.trim()
      ? cleanName(options.whiteName, existing.whiteName)
      : undefined;
    const blackName = options.blackName?.trim()
      ? cleanName(options.blackName, existing.blackName)
      : undefined;

    if (options.sessionId && existing.sessionId !== options.sessionId) {
      updates.sessionId = options.sessionId;
    }

    if (options.gameMode && existing.gameMode !== options.gameMode) {
      updates.gameMode = options.gameMode;
    }

    if (options.humanSide && existing.humanSide !== options.humanSide) {
      updates.humanSide = options.humanSide;
    }

    if (
      options.agentProvider &&
      existing.agentProvider !== options.agentProvider
    ) {
      updates.agentProvider = options.agentProvider;
    }

    if (
      options.whiteAgentProvider &&
      existing.whiteAgentProvider !== options.whiteAgentProvider
    ) {
      updates.whiteAgentProvider = options.whiteAgentProvider;
    }

    if (
      options.blackAgentProvider &&
      existing.blackAgentProvider !== options.blackAgentProvider
    ) {
      updates.blackAgentProvider = options.blackAgentProvider;
    }

    if (whiteName && existing.whiteName !== whiteName) {
      updates.whiteName = whiteName;
    }

    if (blackName && existing.blackName !== blackName) {
      updates.blackName = blackName;
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    const [updated] = await getDb()
      .update(games)
      .set({ ...updates, updatedAt: now() })
      .where(eq(games.id, id))
      .returning();

    return mapGame(updated);
  }

  const [game] = await getDb()
    .insert(games)
    .values({
      id,
      sessionId: options.sessionId ?? null,
      fen: new Chess().fen(),
      whiteName: cleanName(options.whiteName, "PLAYER-1"),
      blackName: cleanName(options.blackName, "MindBoard AI"),
      gameMode: options.gameMode ?? "human-vs-agent",
      humanSide: options.humanSide ?? null,
      agentProvider: options.agentProvider ?? null,
      whiteAgentProvider: options.whiteAgentProvider ?? null,
      blackAgentProvider: options.blackAgentProvider ?? null,
      status: "active",
      updatedAt: now(),
    })
    .returning();

  return mapGame(game);
}

export async function updateGameFen(id: string, fen: string, status = "active") {
  await getDb()
    .update(games)
    .set({ fen, status, updatedAt: now() })
    .where(eq(games.id, id));
}

export async function updateGameStatus(
  id: string,
  status: "active" | "complete" | "ended",
  sessionId?: string | null,
) {
  await getDb()
    .update(games)
    .set({ status, updatedAt: now() })
    .where(
      sessionId
        ? and(eq(games.id, id), eq(games.sessionId, sessionId))
        : eq(games.id, id),
    );
}

export async function insertChatMessage(input: {
  gameId: string;
  role: ChatRole;
  content: string;
  structuredJson?: unknown;
  fenBefore?: string | null;
  fenAfter?: string | null;
}) {
  await getDb().insert(chatMessages).values({
    gameId: input.gameId,
    role: input.role,
    content: input.content,
    structuredJson:
      input.structuredJson === undefined
        ? null
        : JSON.stringify(input.structuredJson),
    fenBefore: input.fenBefore ?? null,
    fenAfter: input.fenAfter ?? null,
  });
}

export async function getRecentChatMessages(gameId: string, limit = 10) {
  const rows = await getDb()
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.gameId, gameId))
    .orderBy(desc(chatMessages.id))
    .limit(limit);

  return rows.map(mapChatMessage).reverse();
}

export async function getAllChatMessages(gameId: string) {
  const rows = await getDb()
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.gameId, gameId))
    .orderBy(chatMessages.id);

  return rows.map(mapChatMessage);
}

export async function getGameMoveInputs(gameId: string) {
  const messages = await getAllChatMessages(gameId);
  return messages.flatMap((message) => {
    const moveInput = moveInputFromMessage(message);
    return moveInput ? [moveInput] : [];
  });
}

export async function getGamesForSession(sessionId: string, limit = 12) {
  const rows = await getDb()
    .select()
    .from(games)
    .where(eq(games.sessionId, sessionId))
    .orderBy(desc(games.updatedAt))
    .limit(limit);

  return rows.map(mapGame);
}
