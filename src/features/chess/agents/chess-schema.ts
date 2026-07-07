import { z } from "zod";

export const ChessAgentOutputSchema = z.object({
  side: z.enum(["white", "black"]),
  move: z
    .string()
    .regex(/^[a-h][1-8]-[a-h][1-8](-[qrbn])?$/)
    .describe("Move in from-to format, for example e2-e4 or g8-f6."),
  from: z
    .string()
    .regex(/^[a-h][1-8]$/)
    .describe("Starting square, for example e2."),
  to: z
    .string()
    .regex(/^[a-h][1-8]$/)
    .describe("Target square, for example e4."),
  piece: z.enum([
    "WP",
    "WN",
    "WB",
    "WR",
    "WQ",
    "WK",
    "BP",
    "BN",
    "BB",
    "BR",
    "BQ",
    "BK",
  ]),
  reason: z.string().min(1).max(220).describe("Short reason for the move."),
  comment: z
    .string()
    .min(1)
    .max(180)
    .describe("Short chess-style comment for the player."),
  promotion: z
    .enum(["q", "r", "b", "n"])
    .nullable()
    .describe("Promotion piece for promotion moves, otherwise null."),
});

export type ChessAgentOutput = z.infer<typeof ChessAgentOutputSchema>;
