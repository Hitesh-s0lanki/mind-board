const claudeKeysByGameId = new Map<string, string>();

export function setEphemeralClaudeApiKey(gameId: string, apiKey: string) {
  claudeKeysByGameId.set(gameId, apiKey);
}

export function getEphemeralClaudeApiKey(gameId: string) {
  return claudeKeysByGameId.get(gameId) ?? "";
}
