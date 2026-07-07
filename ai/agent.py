"""Simple LangChain agent entrypoint."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any, Sequence

from dotenv import load_dotenv

PROMPT_PATH = Path(__file__).parent / "prompts" / "agent.md"
DEFAULT_MODEL = "openai:gpt-4.1-mini"
PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_system_prompt(prompt_path: Path = PROMPT_PATH) -> str:
    """Load the agent's system prompt from Markdown."""
    return prompt_path.read_text(encoding="utf-8").strip()


def count_words(text: str) -> str:
    """Count the number of words in a piece of text."""
    words = [word for word in text.split() if word.strip()]
    return f"{len(words)} words"


def build_agent(model: str | None = None) -> Any:
    """Build the LangChain agent with the Markdown prompt."""
    from langchain.agents import create_agent

    load_dotenv(PROJECT_ROOT / ".env")
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("OPENAI_ADMIN_KEY"):
        raise RuntimeError(
            "Missing OpenAI credentials. Add OPENAI_API_KEY to .env or export it "
            "before running the agent."
        )

    selected_model = model or os.getenv("MIND_BOARD_AGENT_MODEL", DEFAULT_MODEL)
    return create_agent(
        model=selected_model,
        tools=[count_words],
        system_prompt=load_system_prompt(),
        name="mind_board_agent",
    )


def run_agent(message: str, model: str | None = None) -> str:
    """Run one user message through the agent and return the final text."""
    agent = build_agent(model=model)
    result = agent.invoke(
        {"messages": [{"role": "user", "content": message}]}
    )
    return extract_response_text(result)


def extract_response_text(result: Any) -> str:
    """Extract the final assistant text from a LangChain agent result."""
    if isinstance(result, dict):
        messages = result.get("messages", [])
        if messages:
            content = getattr(messages[-1], "content", None)
            if isinstance(content, str):
                return content
            if isinstance(messages[-1], dict):
                dict_content = messages[-1].get("content")
                if isinstance(dict_content, str):
                    return dict_content
        return str(result)

    content = getattr(result, "content", None)
    if isinstance(content, str):
        return content
    return str(result)


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Run the mind-board LangChain agent.")
    parser.add_argument("message", nargs="*", help="Message to send to the agent.")
    parser.add_argument(
        "--model",
        default=None,
        help="LangChain model id, e.g. openai:gpt-4.1-mini.",
    )
    args = parser.parse_args(argv)

    message = " ".join(args.message).strip()
    if not message:
        message = input("Message: ").strip()

    print(run_agent(message, model=args.model))


if __name__ == "__main__":
    main()
