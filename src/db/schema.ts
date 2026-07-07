import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const appUsers = pgTable("app_users", {
  sessionId: text("session_id").primaryKey(),
  name: text("name").notNull().default("Human Challenger"),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const games = pgTable(
  "games",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").references(() => appUsers.sessionId, {
      onDelete: "set null",
    }),
    fen: text("fen").notNull(),
    whiteName: text("white_name").notNull(),
    blackName: text("black_name").notNull(),
    gameMode: text("game_mode").notNull().default("human-vs-agent"),
    humanSide: text("human_side"),
    agentProvider: text("agent_provider"),
    whiteAgentProvider: text("white_agent_provider"),
    blackAgentProvider: text("black_agent_provider"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_games_session_id").on(table.sessionId)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    structuredJson: text("structured_json"),
    fenBefore: text("fen_before"),
    fenAfter: text("fen_after"),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_chat_messages_game_id_id").on(table.gameId, table.id)],
);
