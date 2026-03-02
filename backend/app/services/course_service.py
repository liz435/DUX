from __future__ import annotations

import asyncio
from typing import Any
from uuid import uuid4

from app.models.agent import AgentStep
from app.models.course import (
    Course,
    CoursePreferences,
    Lesson,
    LessonOutline,
    Quiz,
    QuizQuestion,
    QuizOption,
)

# ---------------------------------------------------------------------------
# In-memory course store (replaced by a real DB in production)
# ---------------------------------------------------------------------------

_courses: dict[str, Course] = {}
_step_queues: dict[str, asyncio.Queue[AgentStep | None]] = {}


def get_course(course_id: str) -> Course | None:
    return _courses.get(course_id)


def store_course(course: Course) -> None:
    _courses[course.id] = course


def create_step_queue(course_id: str) -> asyncio.Queue[AgentStep | None]:
    q: asyncio.Queue[AgentStep | None] = asyncio.Queue()
    _step_queues[course_id] = q
    return q


def get_step_queue(course_id: str) -> asyncio.Queue[AgentStep | None] | None:
    return _step_queues.get(course_id)


def remove_step_queue(course_id: str) -> None:
    _step_queues.pop(course_id, None)


# ---------------------------------------------------------------------------
# Placeholder orchestration (will be replaced by LangGraph in Phase 3)
# ---------------------------------------------------------------------------


async def run_course_generation(
    course_id: str,
    preferences: CoursePreferences,
    queue: asyncio.Queue[AgentStep | None],
) -> None:
    """Generate a course skeleton.

    This is a placeholder implementation that creates a deterministic course
    structure. It will be replaced by the LangGraph orchestrator in Phase 3.
    """
    try:
        await queue.put(AgentStep(type="planning", message="Analyzing topic and planning curriculum..."))
        await asyncio.sleep(0.1)

        lesson_count = preferences.lesson_count
        outlines = [
            LessonOutline(
                index=i,
                title=f"Lesson {i + 1}: {preferences.topic} — Part {i + 1}",
                summary=f"Introduction to part {i + 1} of {preferences.topic}.",
                key_topics=[f"topic-{i}-{j}" for j in range(3)],
                has_quiz=(i % 2 == 1),
                estimated_minutes=15,
            )
            for i in range(lesson_count)
        ]

        await queue.put(
            AgentStep(
                type="outline_ready",
                message=f"Course outline ready with {lesson_count} lessons.",
                data={"lesson_count": lesson_count},
            )
        )

        lessons: list[Lesson] = []
        for outline in outlines:
            await queue.put(
                AgentStep(
                    type="generating_lesson",
                    message=f"Generating lesson: {outline.title}",
                    data={"lesson_index": outline.index, "title": outline.title},
                )
            )
            await asyncio.sleep(0.05)

            lesson = Lesson(
                **outline.model_dump(),
                content=f"# {outline.title}\n\nPlaceholder content for {preferences.topic}.",
                interactive_elements=[],
                is_completed=False,
                is_unlocked=(outline.index == 0),
            )
            lessons.append(lesson)

            await queue.put(
                AgentStep(
                    type="lesson_ready",
                    message=f"Lesson ready: {outline.title}",
                    data={"lesson_index": outline.index},
                )
            )

        quizzes: list[Quiz] = []
        for outline in outlines:
            if not outline.has_quiz:
                continue
            await queue.put(
                AgentStep(
                    type="generating_quiz",
                    message=f"Generating quiz for lesson {outline.index + 1}",
                    data={"lesson_index": outline.index},
                )
            )
            await asyncio.sleep(0.05)

            quiz = Quiz(
                lesson_index=outline.index,
                questions=[
                    QuizQuestion(
                        id=f"q-{outline.index}-{j}",
                        question=f"Sample question {j + 1} for lesson {outline.index + 1}?",
                        question_type="multiple-choice",
                        options=[
                            QuizOption(value="a", label="Option A"),
                            QuizOption(value="b", label="Option B"),
                            QuizOption(value="c", label="Option C"),
                        ],
                        correct_answer="a",
                        explanation="This is a placeholder explanation.",
                    )
                    for j in range(3)
                ],
            )
            quizzes.append(quiz)

            await queue.put(
                AgentStep(
                    type="quiz_ready",
                    message=f"Quiz ready for lesson {outline.index + 1}",
                    data={"lesson_index": outline.index},
                )
            )

        course = Course(
            id=course_id,
            title=f"Course: {preferences.topic}",
            description=f"A {preferences.course_length} {preferences.level} course on {preferences.topic}.",
            topic=preferences.topic,
            level=preferences.level,
            lessons=lessons,
            quizzes=quizzes,
        )
        store_course(course)

        await queue.put(
            AgentStep(
                type="complete",
                message="Course generation complete!",
                data={"course_id": course_id},
            )
        )
    except Exception as e:
        await queue.put(AgentStep(type="error", message=str(e)))
    finally:
        await queue.put(None)  # sentinel to end the SSE stream


def grade_quiz_answers(quiz: Quiz, answers: dict[str, str]) -> dict[str, Any]:
    """Grade user answers against a quiz. Returns scoring details."""
    results = []
    correct_count = 0

    for q in quiz.questions:
        user_answer = answers.get(q.id, "")
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
