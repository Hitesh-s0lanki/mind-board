# MindBoard Arena

MindBoard Arena is a Next.js chess arena where a human player can challenge an LLM-powered opponent. The app pairs a polished marketing landing page with a playable chess board, legal move validation, move history, game persistence, and an agent route that can request structured chess moves from OpenAI models.

## Features

- Marketing homepage for the Human vs LLM chess experience.
- Local chess board with legal move validation powered by `chess.js`.
- Game pages with shareable ids at `/game/[id]`.
- API routes for loading game state and advancing turns.
- SQLite-backed game/message persistence using Node's built-in SQLite support.
- LangChain chess agent with structured move output across OpenAI, Gemini, Claude, and Qwen.
- Optional Python LangChain CLI entrypoint for quick agent experiments.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- LangChain and chat model provider packages
- `chess.js`
- Python 3.13 helper entrypoint with `uv`

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Then add API credentials for the model provider you want to play against.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Scripts

```bash
npm run dev     # Start Next.js on port 3001
npm run build   # Create a production build
npm run start   # Serve the production build on port 3001
npm run lint    # Run ESLint
```

## Project Structure

```text
src/app/                         App Router pages and API routes
src/app/api/games/[id]/          Game state and turn endpoints
src/app/game/                    Game route entrypoints
src/features/chess/agents/       LLM chess agent prompts and schemas
src/features/chess/components/   Landing page and chess game UI
src/features/chess/game/         Board, validation, persistence, and types
public/chess-pieces/             Chess piece image assets
public/llm-icons/                Model family logo assets
ai/                              Optional Python LangChain CLI agent
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes for OpenAI moves | OpenAI API key used by the chess agent. |
| `OPENAI_AGENT_MODEL` | No | OpenAI model for the Next.js chess agent. Defaults to `gpt-4o-mini`. |
| `QWEN_AGENT_MODEL` | No | Qwen model served by Modal. Defaults to `Qwen/Qwen3.6-35B-A3B`. |
| `MODAL_ENDPOINT_URL` | Yes for Qwen moves | Modal endpoint base URL, with or without `/v1`. |
| `MODAL_PROXY_TOKEN_ID` | Yes for Qwen moves | Modal proxy token id sent as `Modal-Key`. |
| `MODAL_PROXY_TOKEN_SECRET` | Yes for Qwen moves | Modal proxy token secret sent as `Modal-Secret`. |
| `MIND_BOARD_AGENT_MODEL` | No | Model for the optional Python CLI agent. Defaults to `openai:gpt-4.1-mini`. |

Do not commit `.env`, `.env.local`, API keys, or generated game logs.

## Optional Python Agent

The Python helper uses Python 3.13 and `uv`.

```bash
uv sync
uv run python main.py "Count the words in this sentence"
```

It reads `OPENAI_API_KEY` from `.env` or the shell environment.

## Production

Build and start the app:

```bash
npm run build
npm run start
```

The production server also listens on [http://localhost:3001](http://localhost:3001).
