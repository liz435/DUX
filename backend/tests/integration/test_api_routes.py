from __future__ import annotations

import time

from fastapi.testclient import TestClient

from app.models.course import Course
from app.services.course_service import store_course


class TestHealthEndpoint:
    def test_health_returns_ok(self, test_client: TestClient) -> None:
        resp = test_client.get("/api/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "version" in body


class TestCreateCourse:
    def test_create_course_returns_201(self, test_client: TestClient) -> None:
        resp = test_client.post(
            "/api/courses",
            json={
                "preferences": {
                    "topic": "Python decorators",
                    "level": "intermediate",
                    "course_length": "quick",
                    "learning_style": "mixed",
                }
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "course_id" in body
        assert body["status"] == "generating"

    def test_create_course_invalid_body(self, test_client: TestClient) -> None:
        resp = test_client.post("/api/courses", json={"preferences": {"topic": ""}})
        assert resp.status_code == 422


class TestGetCourse:
    def test_get_existing_course(
        self, test_client: TestClient, sample_course: Course
    ) -> None:
        store_course(sample_course)
        resp = test_client.get(f"/api/courses/{sample_course.id}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["course"]["id"] == sample_course.id
        assert len(body["course"]["lessons"]) == 3

    def test_get_nonexistent_course(self, test_client: TestClient) -> None:
        resp = test_client.get("/api/courses/nonexistent-id")
        assert resp.status_code == 404


class TestGenerateLesson:
    def test_generate_lesson_returns_existing(
        self, test_client: TestClient, sample_course: Course
    ) -> None:
        store_course(sample_course)
        resp = test_client.post(f"/api/courses/{sample_course.id}/lessons/0/generate")
        assert resp.status_code == 200
        body = resp.json()
        assert body["lesson"]["index"] == 0

    def test_generate_lesson_out_of_range(
        self, test_client: TestClient, sample_course: Course
    ) -> None:
        store_course(sample_course)
        resp = test_client.post(f"/api/courses/{sample_course.id}/lessons/99/generate")
        assert resp.status_code == 404


class TestGradeQuiz:
    def test_grade_quiz_perfect_score(
        self, test_client: TestClient, sample_course: Course
    ) -> None:
        store_course(sample_course)
        resp = test_client.post(
            f"/api/courses/{sample_course.id}/quizzes/0/grade",
            json={"answers": {"q1": "a", "q2": "true"}},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["score"] == 1.0
        assert body["correct_count"] == 2
        assert body["total_questions"] == 2

    def test_grade_quiz_partial_score(
        self, test_client: TestClient, sample_course: Course
    ) -> None:
        store_course(sample_course)
        resp = test_client.post(
            f"/api/courses/{sample_course.id}/quizzes/0/grade",
            json={"answers": {"q1": "a", "q2": "false"}},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["score"] == 0.5
        assert body["correct_count"] == 1

    def test_grade_quiz_not_found(self, test_client: TestClient) -> None:
        resp = test_client.post(
            "/api/courses/nonexistent/quizzes/0/grade",
            json={"answers": {}},
        )
        assert resp.status_code == 404


class TestSubmitFeedback:
    def test_submit_feedback(
        self, test_client: TestClient, sample_course: Course
    ) -> None:
        store_course(sample_course)
        resp = test_client.post(
            f"/api/courses/{sample_course.id}/feedback",
            json={
                "lesson_index": 0,
                "interaction_type": "confidence_rating",
                "data": {"confidence": 7},
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "message" in body


class TestSSEStream:
    def test_stream_generates_events(self, test_client: TestClient) -> None:
        # Create a course first to get an ID with active queue
        create_resp = test_client.post(
            "/api/courses",
            json={
                "preferences": {
                    "topic": "Testing",
                    "level": "beginner",
                    "course_length": "quick",
                    "learning_style": "conceptual",
                }
            },
        )
        course_id = create_resp.json()["course_id"]

        # Give the background task a moment to start
        time.sleep(0.3)

        # Stream events — use the stream context manager
        events = []
        with test_client.stream("GET", f"/api/courses/{course_id}/stream") as resp:
            assert resp.status_code == 200
            for line in resp.iter_lines():
                if line.startswith("event:"):
                    events.append(line.split(":", 1)[1].strip())
                if "complete" in line:
                    break

        assert "planning" in events
        assert "complete" in events

    def test_stream_nonexistent_course(self, test_client: TestClient) -> None:
        resp = test_client.get("/api/courses/nonexistent/stream")
        assert resp.status_code == 404
