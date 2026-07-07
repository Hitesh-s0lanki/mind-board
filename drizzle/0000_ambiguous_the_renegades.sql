CREATE TABLE "app_users" (
	"session_id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Human Challenger' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"structured_json" text,
	"fen_before" text,
	"fen_after" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"fen" text NOT NULL,
	"white_name" text NOT NULL,
	"black_name" text NOT NULL,
	"human_side" text,
	"agent_provider" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_session_id_app_users_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."app_users"("session_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_messages_game_id_id" ON "chat_messages" USING btree ("game_id","id");--> statement-breakpoint
CREATE INDEX "idx_games_session_id" ON "games" USING btree ("session_id");