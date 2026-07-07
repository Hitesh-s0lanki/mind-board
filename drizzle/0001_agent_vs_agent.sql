ALTER TABLE "games" ADD COLUMN "game_mode" text DEFAULT 'human-vs-agent' NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "white_agent_provider" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "black_agent_provider" text;