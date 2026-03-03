from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncGenerator
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.models.api import (
    CheckInteractiveRequest,
    CheckInteractiveResponse,
    CourseListResponse,
    CourseResponse,
    CourseSummary,
    CreateCourseRequest,
    CreateCourseResponse,
    FeedbackResponse,
    GradeQuizRequest,
    GradeResult,
    LessonResponse,
    QuestionResult,
    QuizResponse,
    SubmitFeedbackRequest,
    UpdateLessonOutlineRequest,
    UpdateLessonRequest,
)
from app.services.course_service import (
    create_step_queue,
    get_all_courses,
    get_course,
    get_step_queue,
    grade_quiz_answers,
    remove_step_queue,
    run_content_generation,
    run_outline_generation,
    store_course,
    update_lesson_outline,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


@router.get("/courses", response_model=CourseListResponse)
async def list_courses() -> CourseListResponse:
    """Return summaries of all saved courses."""
    courses = get_all_courses()
    summaries = [
        CourseSummary(
            id=c.id,
            title=c.title,
            topic=c.topic,
            level=c.level,
            lesson_count=len(c.lessons),
            completed_count=sum(1 for l in c.lessons if l.is_completed),
            created_at=c.created_at.isoformat(),
        )
        for c in sorted(courses, key=lambda c: c.created_at, reverse=True)
    ]
    return CourseListResponse(courses=summaries)


@router.post("/courses", status_code=201, response_model=CreateCourseResponse)
async def create_course(
    body: CreateCourseRequest,
    background_tasks: BackgroundTasks,
) -> CreateCourseResponse:
    """Kick off outline generation (Phase 1) and return a course_id for SSE streaming."""
    course_id = str(uuid4())
    queue = create_step_queue(course_id)
    background_tasks.add_task(run_outline_generation, course_id, body.preferences, queue)
    return CreateCourseResponse(course_id=course_id)


@router.post("/courses/{course_id}/confirm", response_model=CreateCourseResponse)
async def confirm_course(
    course_id: str,
    background_tasks: BackgroundTasks,
) -> CreateCourseResponse:
    """Confirm syllabus and kick off content generation (Phase 2)."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    queue = create_step_queue(course_id)
    background_tasks.add_task(run_content_generation, course_id, queue)
    return CreateCourseResponse(course_id=course_id)


@router.get("/courses/{course_id}/stream")
async def stream_course_generation(course_id: str) -> EventSourceResponse:
    """SSE endpoint — streams AgentStep events during generation."""
    queue = get_step_queue(course_id)
    if queue is None:
        raise HTTPException(status_code=404, detail="No active generation for this course ID.")

    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        try:
            while True:
                step = await queue.get()
                if step is None:
                    break
                yield {"event": step.type, "data": step.model_dump_json()}
        finally:
            remove_step_queue(course_id)

    return EventSourceResponse(event_generator())


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course_detail(course_id: str) -> CourseResponse:
    """Return full course data."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    return CourseResponse(course=course)


@router.post(
    "/courses/{course_id}/lessons/{lesson_idx}/generate",
    response_model=LessonResponse,
)
async def generate_lesson(course_id: str, lesson_idx: int) -> LessonResponse:
    """On-demand lesson generation (placeholder — will use LangGraph in Phase 3)."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    if lesson_idx < 0 or lesson_idx >= len(course.lessons):
        raise HTTPException(status_code=404, detail="Lesson index out of range.")
    return LessonResponse(lesson=course.lessons[lesson_idx])


@router.patch(
    "/courses/{course_id}/lessons/{lesson_idx}",
    response_model=LessonResponse,
)
async def update_lesson(
    course_id: str, lesson_idx: int, body: UpdateLessonRequest
) -> LessonResponse:
    """Update lesson progress (e.g. mark as completed) and persist to disk."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    if lesson_idx < 0 or lesson_idx >= len(course.lessons):
        raise HTTPException(status_code=404, detail="Lesson index out of range.")

    lesson = course.lessons[lesson_idx]
    if body.is_completed is not None:
        course.lessons[lesson_idx] = lesson.model_copy(
            update={"is_completed": body.is_completed}
        )
        # Auto-unlock the next lesson
        if body.is_completed and lesson_idx + 1 < len(course.lessons):
            next_lesson = course.lessons[lesson_idx + 1]
            course.lessons[lesson_idx + 1] = next_lesson.model_copy(
                update={"is_unlocked": True}
            )

    store_course(course)
    return LessonResponse(lesson=course.lessons[lesson_idx])


@router.patch(
    "/courses/{course_id}/outline/{lesson_idx}",
    response_model=CourseResponse,
)
async def update_lesson_outline_endpoint(
    course_id: str,
    lesson_idx: int,
    body: UpdateLessonOutlineRequest,
) -> CourseResponse:
    """Update lesson outline fields (title, summary, key_topics, etc.)."""
    course = update_lesson_outline(
        course_id,
        lesson_idx,
        body.model_dump(exclude_none=True),
    )
    if course is None:
        raise HTTPException(status_code=404, detail="Course or lesson not found.")
    return CourseResponse(course=course)


@router.post(
    "/courses/{course_id}/quizzes/{quiz_idx}/generate",
    response_model=QuizResponse,
)
async def generate_quiz(course_id: str, quiz_idx: int) -> QuizResponse:
    """On-demand quiz generation (placeholder — will use LangGraph in Phase 3)."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    if quiz_idx < 0 or quiz_idx >= len(course.quizzes):
        raise HTTPException(status_code=404, detail="Quiz index out of range.")
    return QuizResponse(quiz=course.quizzes[quiz_idx])


@router.post(
    "/courses/{course_id}/quizzes/{quiz_idx}/grade",
    response_model=GradeResult,
)
async def grade_quiz(
    course_id: str, quiz_idx: int, body: GradeQuizRequest
) -> GradeResult:
    """Grade a quiz submission."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    if quiz_idx < 0 or quiz_idx >= len(course.quizzes):
        raise HTTPException(status_code=404, detail="Quiz index out of range.")

    quiz = course.quizzes[quiz_idx]
    result = grade_quiz_answers(quiz, body.answers)
    return GradeResult(
        score=result["score"],
        total_questions=result["total_questions"],
        correct_count=result["correct_count"],
        results=[QuestionResult(**r) for r in result["results"]],
    )


@router.post(
    "/courses/{course_id}/lessons/{lesson_idx}/check/{element_idx}",
    response_model=CheckInteractiveResponse,
)
async def check_interactive_answer(
    course_id: str,
    lesson_idx: int,
    element_idx: int,
    body: CheckInteractiveRequest,
) -> CheckInteractiveResponse:
    """Check a user's answer to an interactive knowledge check."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    if lesson_idx < 0 or lesson_idx >= len(course.lessons):
        raise HTTPException(status_code=404, detail="Lesson index out of range.")

    lesson = course.lessons[lesson_idx]
    if element_idx < 0 or element_idx >= len(lesson.interactive_elements):
        raise HTTPException(status_code=404, detail="Interactive element not found.")

    element = lesson.interactive_elements[element_idx]
    correct_answer = element.get("correct_answer", {})
    explanation = element.get("explanation", "")

    # Determine if the element has a definitive correct answer
    has_correct = bool(correct_answer)
    is_text_type = any(
        f.get("type") == "text" for f in element.get("fields", [])
    )

    if has_correct and not is_text_type:
        # Direct comparison for single-choice, multiple-choice, boolean
        all_correct = all(
            str(body.answers.get(field_id, "")).strip().lower()
            == str(expected).strip().lower()
            for field_id, expected in correct_answer.items()
        )
        score = 1.0 if all_correct else 0.0
        feedback = (
            "Great job! You got it right!"
            if all_correct
            else "Not quite. Review the material above and try again."
        )
        return CheckInteractiveResponse(
            correct=all_correct,
            score=score,
            correct_answer=correct_answer,
            explanation=explanation,
            feedback=feedback,
        )

    if is_text_type:
        # For text/reflection answers, use LLM to evaluate
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from app.agents.llm import get_llm

            llm = get_llm(purpose="validation")
            user_text = " ".join(str(v) for v in body.answers.values())
            eval_prompt = (
                f"Evaluate this student's response to a knowledge check.\n\n"
                f"Question context: {element.get('description', '')}\n"
                f"Question: {element.get('fields', [{}])[0].get('label', '')}\n"
                f"Student answer: {user_text}\n\n"
                f"Score from 0.0 to 1.0 based on understanding shown. "
                f"Return ONLY a JSON object: "
                f'{{"score": float, "feedback": "encouraging feedback string"}}'
            )
            messages = [
                SystemMessage(content="You are a supportive tutor evaluating student responses. Be encouraging but honest."),
                HumanMessage(content=eval_prompt),
            ]
            response = await asyncio.to_thread(llm.invoke, messages)
            result_text = response.content if isinstance(response.content, str) else str(response.content)
            # Try to parse JSON from the response
            result_text = result_text.strip()
            if result_text.startswith("```"):
                result_text = result_text.split("\n", 1)[-1].rsplit("```", 1)[0]
            parsed = json.loads(result_text)
            score = float(parsed.get("score", 0.5))
            feedback = parsed.get("feedback", "Good effort! Keep learning.")
        except Exception:
            logger.warning("LLM evaluation failed, using default", exc_info=True)
            score = 0.5
            feedback = "Thanks for your response! Reflection exercises help deepen understanding."

        return CheckInteractiveResponse(
            correct=score >= 0.7,
            score=score,
            correct_answer=correct_answer,
            explanation=explanation or "This is a reflection exercise — your thoughtful engagement is what matters.",
            feedback=feedback,
        )

    # Fallback: no correct answer defined (exploration type)
    return CheckInteractiveResponse(
        correct=True,
        score=1.0,
        correct_answer={},
        explanation=explanation or "Exploration exercises are about experimenting — there's no wrong answer!",
        feedback="Great exploration! Experimenting with parameters builds intuition.",
    )


@router.post(
    "/courses/{course_id}/feedback",
    response_model=FeedbackResponse,
)
async def submit_feedback(
    course_id: str, body: SubmitFeedbackRequest
) -> FeedbackResponse:
    """Submit user interaction feedback — invokes the tutor agent for personalized guidance."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")

    try:
        from app.agents.graphs.tutor import build_tutor_graph

        # Build student profile from course data
        completed_lessons = sum(1 for l in course.lessons if l.is_completed)
        quiz_scores: list[float] = []
        for quiz in course.quizzes:
            # Calculate score from quiz (if graded data is available)
            quiz_scores.append(0.5)  # Default if no grade data stored

        tutor_state: dict[str, Any] = {
            "messages": [],
            "student_profile": {
                "level": course.level,
                "topic": course.topic,
                "completed_lessons": completed_lessons,
                "total_lessons": len(course.lessons),
                "topic_scores": {},
            },
            "quiz_scores": quiz_scores,
            "missed_questions": [],
            "time_per_lesson": {},
            "assessment": None,
            "action_plan": None,
            "feedback": "",
            "adaptations": {},
        }

        graph = build_tutor_graph().compile()
        result = await asyncio.to_thread(graph.invoke, tutor_state)

        return FeedbackResponse(
            message=result.get("feedback", "Keep up the great work!"),
            adaptations=result.get("adaptations", {}),
        )
    except Exception:
        logger.warning("Tutor agent failed, using fallback", exc_info=True)
        return FeedbackResponse(
            message="Keep up the great work! Continue with your lessons to build mastery.",
            adaptations={},
        )
