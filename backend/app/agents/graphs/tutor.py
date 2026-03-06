"""Tutor Agent — LangGraph state machine.

Nodes:  assess → decide → generate_feedback → adapt
"""

from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.llm import get_llm
from app.agents.prompts.output_schemas import TutorOutput
from app.agents.prompts.system_prompts import TUTOR_SYSTEM
from app.models.agent import TutorState

# ---------------------------------------------------------------------------
# Node implementations
# ---------------------------------------------------------------------------


def assess_performance_node(state: TutorState) -> dict[str, Any]:
    """Analyze quiz scores and interaction patterns."""
    scores = state.get("quiz_scores", [])
    profile = state.get("student_profile", {})

    avg_score = sum(scores) / len(scores) if scores else 0.0
    trend = "improving" if len(scores) >= 2 and scores[-1] > scores[0] else "stable"

    weak_topics: list[str] = []
    for topic, score in profile.get("topic_scores", {}).items():
        if score < 0.7:
            weak_topics.append(topic)

    return {
        "assessment": {
            "average_score": round(avg_score, 2),
            "trend": trend,
            "weak_topics": weak_topics,
            "total_quizzes": len(scores),
        }
    }


def decide_action_node(state: TutorState) -> dict[str, Any]:
    """Decide what the student needs based on assessment."""
    assessment = state.get("assessment", {})
    avg = assessment.get("average_score", 0.0)

    if avg < 0.7:
        action = "supplement"
        strategy = "Provide simpler explanations and additional practice for weak topics."
    elif avg > 0.9:
        action = "challenge"
        strategy = "Offer advanced content and deeper exploration."
    else:
        action = "continue"
        strategy = "Maintain current pace with minor targeted reinforcement."

    return {
        "action_plan": {
            "action": action,
            "strategy": strategy,
            "weak_topics": assessment.get("weak_topics", []),
        }
    }


def generate_feedback_node(state: TutorState) -> dict[str, Any]:
    """Generate personalized feedback for the student."""
    assessment = state.get("assessment", {})
    action_plan = state.get("action_plan", {})
    profile = state.get("student_profile", {})
    scores = state.get("quiz_scores", [])

    llm = get_llm(purpose="writing")
    scores_by_lesson = {f"Lesson {i}": round(s, 2) for i, s in enumerate(scores)}
    system_prompt = TUTOR_SYSTEM.format(
        level=profile.get("level", "intermediate"),
        topic=profile.get("topic", "the course"),
        quiz_scores=json.dumps(scores_by_lesson) if scores else "{}",
        completed_count=profile.get("completed_lessons", 0),
        total_lessons=profile.get("total_lessons", 0),
        missed_questions=json.dumps(state.get("missed_questions", [])),
        time_per_lesson=json.dumps(state.get("time_per_lesson", {})),
    )

    try:
        structured_llm = llm.with_structured_output(TutorOutput)
        result: TutorOutput = structured_llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=f"Strategy: {action_plan.get('strategy', '')}. "
                    f"Generate feedback for the student."
                ),
            ]
        )
        return {
            "feedback": result.feedback,
            "adaptations": {a.area: a.recommendation for a in result.adaptations},
        }
    except Exception:
        return {"feedback": _fallback_feedback(assessment, action_plan)}


def adapt_next_lesson_node(state: TutorState) -> dict[str, Any]:
    """Determine adaptations for the next lesson."""
    action_plan = state.get("action_plan", {})
    action = action_plan.get("action", "continue")

    adaptations: dict[str, Any] = {}

    if action == "supplement":
        adaptations["adjust_depth"] = "simpler"
        adaptations["add_examples"] = True
        adaptations["slow_down"] = True
        adaptations["focus_topics"] = action_plan.get("weak_topics", [])
    elif action == "challenge":
        adaptations["adjust_depth"] = "deeper"
        adaptations["speed_up"] = True
        adaptations["add_examples"] = False
    else:
        adaptations["adjust_depth"] = "maintain"

    return {"adaptations": adaptations}


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_tutor_graph() -> StateGraph:
    """Build and return the (uncompiled) tutor state graph."""
    graph = StateGraph(TutorState)

    graph.add_node("assess", assess_performance_node)
    graph.add_node("decide", decide_action_node)
    graph.add_node("generate_feedback", generate_feedback_node)
    graph.add_node("adapt", adapt_next_lesson_node)

    graph.add_edge(START, "assess")
    graph.add_edge("assess", "decide")
    graph.add_edge("decide", "generate_feedback")
    graph.add_edge("generate_feedback", "adapt")
    graph.add_edge("adapt", END)

    return graph


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fallback_feedback(assessment: dict, action_plan: dict) -> str:
    avg = assessment.get("average_score", 0.0)
    action = action_plan.get("action", "continue")

    if action == "supplement":
        return (
            f"Your average score is {avg:.0%}. Let's take a step back and "
            f"reinforce some key concepts before moving forward. "
            f"Don't worry — everyone learns at their own pace!"
        )
    elif action == "challenge":
        return (
            f"Excellent work! Your average score is {avg:.0%}. "
            f"You're clearly mastering this material. "
            f"Let's kick it up a notch with some advanced content."
        )
    return (
        f"Good progress! Your average score is {avg:.0%}. "
        f"You're on track. Keep up the momentum!"
    )
