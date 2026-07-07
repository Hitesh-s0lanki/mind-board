import { mkdirSync } from "node:fs";
import path from "node:path";
import { Chess } from "chess.js";
import { DatabaseSync } from "node:sqlite";

export type GameRecord = {
  id: string;
  fen: string;
  whiteName: string;
  blackName: string;
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

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "mind-board.sqlite");

let db: DatabaseSync | null = null;

function getDb() {
  if (db) {
    return db;
  }

  mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      fen TEXT NOT NULL,
      white_name TEXT NOT NULL,
      black_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('human', 'agent')),
      content TEXT NOT NULL,
      structured_json TEXT,
      fen_before TEXT,
      fen_after TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id_id
      ON chat_messages(game_id, id);
  `);

  return db;
}

function now() {
  return new Date().toISOString();
}

function mapGame(row: Record<string, unknown>): GameRecord {
  return {
    id: String(row.id),
    fen: String(row.fen),
    whiteName: String(row.white_name),
    blackName: String(row.black_name),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapChatMessage(row: Record<string, unknown>): ChatMessageRecord {
  return {
    id: Number(row.id),
    gameId: String(row.game_id),
    role: row.role === "agent" ? "agent" : "human",
    content: String(row.content),
    structuredJson:
      typeof row.structured_json === "string" ? row.structured_json : null,
    fenBefore: typeof row.fen_before === "string" ? row.fen_before : null,
    fenAfter: typeof row.fen_after === "string" ? row.fen_after : null,
    createdAt: String(row.created_at),
  };
}

export function getGame(id: string): GameRecord | null {
  const row = getDb()
    .prepare("SELECT * FROM games WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapGame(row) : null;
}

export function getOrCreateGame(
  id: string,
  options: { whiteName?: string; blackName?: string } = {},
) {
  const existing = getGame(id);
  if (existing) {
    return existing;
  }

  const timestamp = now();
  const game = {
    id,
    fen: new Chess().fen(),
    whiteName: options.whiteName?.trim() || "PLAYER-1",
    blackName: options.blackName?.trim() || "MindBoard AI",
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  getDb()
    .prepare(
      `INSERT INTO games
        (id, fen, white_name, black_name, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      game.id,
      game.fen,
      game.whiteName,
      game.blackName,
      game.status,
      game.createdAt,
      game.updatedAt,
    );

  return game;
}

export function updateGameFen(id: string, fen: string, status = "active") {
  getDb()
    .prepare("UPDATE games SET fen = ?, status = ?, updated_at = ? WHERE id = ?")
    .run(fen, status, now(), id);
}

export function insertChatMessage(input: {
  gameId: string;
  role: ChatRole;
  content: string;
  structuredJson?: unknown;
  fenBefore?: string | null;
  fenAfter?: string | null;
}) {
  getDb()
    .prepare(
      `INSERT INTO chat_messages
        (game_id, role, content, structured_json, fen_before, fen_after, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.gameId,
      input.role,
      input.content,
      input.structuredJson === undefined
        ? null
        : JSON.stringify(input.structuredJson),
      input.fenBefore ?? null,
      input.fenAfter ?? null,
      now(),
    );
}

export function getRecentChatMessages(gameId: string, limit = 10) {
  const rows = getDb()
    .prepare(
      `SELECT *
       FROM chat_messages
       WHERE game_id = ?
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(gameId, limit) as Record<string, unknown>[];

  return rows.map(mapChatMessage).reverse();
}

export function getAllChatMessages(gameId: string) {
  const rows = getDb()
    .prepare(
      `SELECT *
       FROM chat_messages
       WHERE game_id = ?
       ORDER BY id ASC`,
    )
    .all(gameId) as Record<string, unknown>[];

  return rows.map(mapChatMessage);
}
