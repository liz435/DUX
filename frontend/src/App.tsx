import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { ProgressPage } from './pages/ProgressPage';
import { QuizPage } from './pages/QuizPage';
import { SyllabusPage } from './pages/SyllabusPage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses/:id/lessons/:idx" element={<LessonPage />} />
        <Route path="/courses/:id/quizzes/:idx" element={<QuizPage />} />
        <Route path="/courses/:id/progress" element={<ProgressPage />} />
        <Route path="/courses/:id/syllabus" element={<SyllabusPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
