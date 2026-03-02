"""Evaluation runner — runs agent graphs against datasets and scores results."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable

from pydantic import BaseModel, Field


class EvalExample(BaseModel):
    """A single evaluation example: input + criteria."""

    input: dict[str, Any]
    criteria: dict[str, Any]


class EvalResult(BaseModel):
    """Aggregate evaluation results."""

    total_examples: int
    mean_score: float
    min_score: float
    max_score: float
    scores: list[float] = Field(default_factory=list)
    failures: list[dict[str, Any]] = Field(default_factory=list)


def load_dataset(path: str | Path) -> list[EvalExample]:
    """Load an evaluation dataset from a JSON file."""
    with open(path) as f:
        data = json.load(f)
    return [EvalExample(**item) for item in data]


def run_eval(
    run_fn: Callable[[dict[str, Any]], Any],
    dataset: list[EvalExample],
    score_fn: Callable[[Any, dict[str, Any]], float],
    threshold: float = 0.0,
) -> EvalResult:
    """Run an evaluation suite.

    Args:
        run_fn: Function that takes input dict and returns agent output.
        dataset: List of (input, criteria) pairs.
        score_fn: Function that takes (output, criteria) and returns 0-1 score.
        threshold: Minimum score to consider a passing result.

    Returns:
        Aggregated evaluation results.
    """
    scores: list[float] = []
    failures: list[dict[str, Any]] = []

    for i, example in enumerate(dataset):
        try:
            output = run_fn(example.input)
            score = score_fn(output, example.criteria)
            scores.append(score)

            if score < threshold:
                failures.append({
                    "index": i,
                    "score": score,
                    "input": example.input,
                    "criteria": example.criteria,
                })
        except Exception as e:
            scores.append(0.0)
            failures.append({
                "index": i,
                "score": 0.0,
                "error": str(e),
                "input": example.input,
            })

    if not scores:
        return EvalResult(
            total_examples=0, mean_score=0.0, min_score=0.0, max_score=0.0
        )

    return EvalResult(
        total_examples=len(scores),
        mean_score=round(sum(scores) / len(scores), 3),
        min_score=round(min(scores), 3),
        max_score=round(max(scores), 3),
        scores=scores,
        failures=failures,
    )
