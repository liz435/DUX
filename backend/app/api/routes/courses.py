from __future__ import annotations

import asyncio
from typing import AsyncGenerator
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.models.api import (
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
    UpdateLessonRequest,
)
from app.services.course_service import (
    create_step_queue,
    get_all_courses,
    get_course,
    get_step_queue,
    grade_quiz_answers,
    remove_step_queue,
    run_course_generation,
    store_course,
)

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
    """Kick off course generation and return a course_id for SSE streaming."""
    course_id = str(uuid4())
    queue = create_step_queue(course_id)
    background_tasks.add_task(run_course_generation, course_id, body.preferences, queue)
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
    "/courses/{course_id}/feedback",
    response_model=FeedbackResponse,
)
async def submit_feedback(
    course_id: str, body: SubmitFeedbackRequest
) -> FeedbackResponse:
    """Submit user interaction feedback (placeholder — will use tutor agent in Phase 3)."""
    course = get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    return FeedbackResponse(
        message="Thank you for your feedback! The tutor agent will process this in a future phase.",
        adaptations={},
    )
