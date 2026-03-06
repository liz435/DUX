"""Course service — orchestrates LangGraph agents, manages state, grades quizzes."""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

from app.agents.graphs.course_planner import build_course_planner_graph
from app.agents.graphs.orchestrator import build_orchestrator_graph
from app.agents.graphs.lesson_writer import build_lesson_writer_graph
from app.agents.graphs.quiz_generator import build_quiz_generator_graph
from app.agents.graphs.tutor import build_tutor_graph
from app.models.agent import AgentStep
from app.models.course import (
    Course,
    CoursePreferences,
    Lesson,
    LessonOutline,
    Quiz,
    QuizOption,
    QuizQuestion,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Persistent course storage (JSON files in a folder)
# ---------------------------------------------------------------------------

COURSES_DIR = Path(__file__).resolve().parent.parent.parent / "courses"
COURSES_DIR.mkdir(exist_ok=True)

LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

_courses: dict[str, Course] = {}
_step_queues: dict[str, asyncio.Queue[AgentStep | None]] = {}


def _log_json(course_id: str, stage: str, data: Any) -> None:
    """Write a JSON log file: logs/<course_id>_<stage>_<timestamp>.json"""
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"{course_id[:8]}_{stage}_{ts}.json"
    try:
        payload = data if isinstance(data, str) else json.dumps(data, indent=2, default=str)
        (LOGS_DIR / filename).write_text(payload)
        logger.info("Logged %s for course %s", stage, course_id[:8])
    except Exception:
        logger.warning("Failed to write log %s", filename, exc_info=True)


def _course_path(course_id: str) -> Path:
    return COURSES_DIR / f"{course_id}.json"


def _save_to_disk(course: Course) -> None:
    """Persist a course as a JSON file."""
    try:
        _course_path(course.id).write_text(course.model_dump_json(indent=2))
    except Exception:
        logger.exception("Failed to save course %s to disk", course.id)


def _load_from_disk() -> None:
    """Load all courses from the courses folder into memory."""
    for path in COURSES_DIR.glob("*.json"):
        try:
            course = Course.model_validate_json(path.read_text())
            _courses[course.id] = course
            logger.info("Loaded course %s from %s", course.id, path.name)
        except Exception:
            logger.exception("Failed to load course from %s", path.name)


# Load persisted courses on module import
_load_from_disk()


def get_course(course_id: str) -> Course | None:
    return _courses.get(course_id)


def get_all_courses() -> list[Course]:
    return list(_courses.values())


def store_course(course: Course) -> None:
    _courses[course.id] = course
    _save_to_disk(course)


def update_lesson_outline(
    course_id: str,
    lesson_idx: int,
    updates: dict,
) -> Course | None:
    """Apply partial outline updates to a lesson and persist to disk."""
    course = get_course(course_id)
    if course is None:
        return None
    if lesson_idx < 0 or lesson_idx >= len(course.lessons):
        return None

    lesson = course.lessons[lesson_idx]
    course.lessons[lesson_idx] = lesson.model_copy(
        update={k: v for k, v in updates.items() if v is not None}
    )
    store_course(course)
    return course


def create_step_queue(course_id: str) -> asyncio.Queue[AgentStep | None]:
    q: asyncio.Queue[AgentStep | None] = asyncio.Queue()
    _step_queues[course_id] = q
    return q


def get_step_queue(course_id: str) -> asyncio.Queue[AgentStep | None] | None:
    return _step_queues.get(course_id)


def remove_step_queue(course_id: str) -> None:
    _step_queues.pop(course_id, None)


# ---------------------------------------------------------------------------
# LangGraph-powered course generation
# ---------------------------------------------------------------------------

_planner = build_course_planner_graph().compile()
_orchestrator = build_orchestrator_graph().compile()
_writer = build_lesson_writer_graph().compile()
_quiz_gen = build_quiz_generator_graph().compile()
_tutor = build_tutor_graph().compile()

# Store preferences between Phase 1 (outline) and Phase 2 (content generation)
_draft_preferences: dict[str, CoursePreferences] = {}


async def run_outline_generation(
    course_id: str,
    preferences: CoursePreferences,
    queue: asyncio.Queue[AgentStep | None],
) -> None:
    """Phase 1: Generate only the course outline, then pause for user confirmation."""
    try:
        await queue.put(
            AgentStep(type="planning", message="Analyzing topic and planning curriculum...")
        )

        # Run planner sub-graph directly (no lesson/quiz generation yet)
        result = await asyncio.to_thread(
            _planner.invoke,
            {
                "messages": [],
                "course_preferences": preferences,
                "outline": [],
                "lessons": [],
                "quizzes": [],
                "current_step": "start",
                "validation_result": None,
                "retry_count": 0,
                "student_profile": {},
            },
        )

        outlines: list[LessonOutline] = result.get("outline", [])

        # Convert outlines to stub Lesson objects (no content yet)
        stub_lessons = [
            Lesson(**outline.model_dump(), content="", is_unlocked=False)
            for outline in outlines
        ]

        # Create and persist draft course
        course = Course(
            id=course_id,
            title=f"Course: {preferences.topic}",
            description=(
                f"A {preferences.course_length} {preferences.level} course "
                f"on {preferences.topic}."
            ),
            topic=preferences.topic,
            level=preferences.level,
            lessons=stub_lessons,
            quizzes=[],
        )
        store_course(course)

        # Log syllabus / outline
        _log_json(course_id, "syllabus", {
            "preferences": preferences.model_dump(),
            "outlines": [o.model_dump() for o in outlines],
        })

        # Store preferences for Phase 2
        _draft_preferences[course_id] = preferences

        await queue.put(
            AgentStep(
                type="outline_ready",
                message=f"Course outline ready with {len(outlines)} lessons.",
                data={"lesson_count": len(outlines), "course_id": course_id},
            )
        )

        await queue.put(
            AgentStep(
                type="awaiting_confirmation",
                message="Review your syllabus and confirm to start generating lessons.",
            )
        )
    except Exception as e:
        await queue.put(AgentStep(type="error", message=str(e)))
    finally:
        await queue.put(None)


async def run_content_generation(
    course_id: str,
    queue: asyncio.Queue[AgentStep | None],
) -> None:
    """Phase 2: Generate full lesson content and quizzes from the (possibly edited) outline."""
    try:
        course = get_course(course_id)
        if course is None:
            await queue.put(AgentStep(type="error", message="Draft course not found."))
            return

        preferences = _draft_preferences.pop(course_id, None)
        if preferences is None:
            # Reconstruct from course data as fallback
            preferences = CoursePreferences(
                topic=course.topic,
                level=course.level,
                course_length=(
                    "quick" if len(course.lessons) <= 3
                    else "deep-dive" if len(course.lessons) >= 10
                    else "standard"
                ),
                learning_style="mixed",
            )

        lessons: list[Lesson] = []
        previous_titles: list[str] = []

        for stub in course.lessons:
            await queue.put(
                AgentStep(
                    type="generating_lesson",
                    message=f"Generating lesson: {stub.title}",
                    data={"lesson_index": stub.index, "title": stub.title},
                )
            )

            lesson = await generate_lesson_on_demand(
                stub, preferences, previous_titles
            )
            lessons.append(lesson)
            previous_titles.append(lesson.title)

            # Log lesson with interactive schemas
            _log_json(course_id, f"lesson_{lesson.index}", {
                "title": lesson.title,
                "content_length": len(lesson.content),
                "interactive_elements": lesson.interactive_elements,
            })

            await queue.put(
                AgentStep(
                    type="lesson_ready",
                    message=f"Lesson ready: {stub.title}",
                    data={"lesson_index": stub.index},
                )
            )

        # Generate quizzes
        quizzes: list[Quiz] = []
        for lesson in lessons:
            if not lesson.has_quiz:
                continue

            await queue.put(
                AgentStep(
                    type="generating_quiz",
                    message=f"Generating quiz for lesson {lesson.index + 1}",
                    data={"lesson_index": lesson.index},
                )
            )

            quiz = await generate_quiz_on_demand(lesson, preferences)
            quizzes.append(quiz)

            await queue.put(
                AgentStep(
                    type="quiz_ready",
                    message=f"Quiz ready for lesson {lesson.index + 1}",
                    data={"lesson_index": lesson.index},
                )
            )

        # Sort lessons, unlock first
        lessons.sort(key=lambda l: l.index)
        if lessons:
            lessons[0] = lessons[0].model_copy(update={"is_unlocked": True})

        # Update and persist the final course
        course = course.model_copy(update={"lessons": lessons, "quizzes": quizzes})
        store_course(course)

        # Log complete course
        _log_json(course_id, "course_complete", course.model_dump())

        await queue.put(
            AgentStep(
                type="complete",
                message="Course generation complete!",
                data={"course_id": course_id},
            )
        )
    except Exception as e:
        logger.error("Content generation failed for %s: %s", course_id[:8], e, exc_info=True)
        await queue.put(AgentStep(type="error", message=str(e)))
    finally:
        await queue.put(None)


# ---------------------------------------------------------------------------
# On-demand generation helpers
# ---------------------------------------------------------------------------


async def generate_lesson_on_demand(
    outline: LessonOutline,
    preferences: CoursePreferences,
    previous_titles: list[str] | None = None,
) -> Lesson:
    """Invoke the lesson writer graph for a single lesson."""
    result = await asyncio.to_thread(
        _writer.invoke,
        {
            "messages": [],
            "outline": outline,
            "course_preferences": preferences,
            "previous_lesson_titles": previous_titles or [],
            "draft_content": "",
            "interactive_elements": [],
            "validation_result": None,
            "retry_count": 0,
            "lesson": None,
        },
    )
    lesson: Lesson | None = result.get("lesson")
    if lesson:
        return lesson
    # Fallback
    return Lesson(
        **outline.model_dump(),
        content=f"# {outline.title}\n\nContent generation in progress.",
        is_unlocked=False,
    )


async def generate_quiz_on_demand(
    lesson: Lesson, preferences: CoursePreferences
) -> Quiz:
    """Invoke the quiz generator graph for a single lesson."""
    result = await asyncio.to_thread(
        _quiz_gen.invoke,
        {
            "messages": [],
            "lesson": lesson,
            "course_preferences": preferences,
            "key_concepts": lesson.key_topics,
            "questions": [],
            "validation_result": None,
            "retry_count": 0,
            "quiz": None,
        },
    )
    quiz: Quiz | None = result.get("quiz")
    if quiz:
        return quiz
    # Fallback
    return Quiz(
        lesson_index=lesson.index,
        questions=[
            QuizQuestion(
                id=f"fallback-{lesson.index}-0",
                question=f"What is a key concept from {lesson.title}?",
                question_type="short-answer",
                correct_answer=lesson.key_topics[0] if lesson.key_topics else "N/A",
                explanation="Review the lesson for the answer.",
            )
        ],
    )


async def run_tutor_check(
    course_id: str,
    quiz_scores: list[float],
    student_profile: dict[str, Any],
) -> dict[str, Any]:
    """Invoke the tutor agent to generate feedback + adaptations."""
    result = await asyncio.to_thread(
        _tutor.invoke,
        {
            "messages": [],
            "student_profile": student_profile,
            "quiz_scores": quiz_scores,
            "assessment": None,
            "action_plan": None,
            "feedback": "",
            "adaptations": {},
        },
    )
    return {
        "feedback": result.get("feedback", "Keep going!"),
        "adaptations": result.get("adaptations", {}),
    }


# ---------------------------------------------------------------------------
# Quiz grading
# ---------------------------------------------------------------------------


def _semantic_check(user_answer: str, correct_answer: str, question: str) -> tuple[bool, float]:
    """Use LLM to semantically compare a short answer against the expected answer.

    Returns (is_correct, score) where score is 0.0-1.0.
    """
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from app.agents.llm import get_llm

        llm = get_llm(purpose="validation")
        prompt = (
            f"Compare the student's answer to the expected answer.\n\n"
            f"Question: {question}\n"
            f"Expected answer: {correct_answer}\n"
            f"Student answer: {user_answer}\n\n"
            f"The student does NOT need to match word-for-word. "
            f"Accept any response that conveys the same meaning or concept.\n"
            f"Return ONLY a JSON object: "
            f'{{"correct": bool, "score": float_0_to_1}}'
        )
        response = llm.invoke([
            SystemMessage(content="You are a fair grader. Compare answers semantically, not literally."),
            HumanMessage(content=prompt),
        ])
        text = response.content if isinstance(response.content, str) else str(response.content)
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0]
        parsed = json.loads(text)
        return bool(parsed.get("correct", False)), float(parsed.get("score", 0.0))
    except Exception:
        logger.warning("Semantic check failed, falling back to exact match", exc_info=True)
        is_exact = user_answer.strip().lower() == correct_answer.strip().lower()
        return is_exact, 1.0 if is_exact else 0.0


def grade_quiz_answers(quiz: Quiz, answers: dict[str, str]) -> dict[str, Any]:
    """Grade user answers against a quiz. Returns scoring details."""
    results = []
    correct_count = 0

    for q in quiz.questions:
        user_answer = answers.get(q.id, "")

        if q.question_type in ("short-answer", "code-completion") and user_answer.strip():
            is_correct, _score = _semantic_check(user_answer, q.correct_answer, q.question)
        else:
            is_correct = user_answer.strip().lower() == q.correct_answer.strip().lower()

        if is_correct:
            correct_count += 1
        results.append(
            {
                "question_id": q.id,
                "correct": is_correct,
                "user_answer": user_answer,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
            }
        )

    total = len(quiz.questions)
    return {
        "score": correct_count / total if total > 0 else 0.0,
        "total_questions": total,
        "correct_count": correct_count,
        "results": results,
    }
