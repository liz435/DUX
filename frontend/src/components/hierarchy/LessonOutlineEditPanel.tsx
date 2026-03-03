import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import type { Course } from '@/api/client'
import { useCourseStore } from '@/store/courseStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { HierarchyNode } from '@/types/hierarchy'

interface LessonOutlineEditPanelProps {
  node: HierarchyNode
  course: Course
  onClose: () => void
}

export function LessonOutlineEditPanel({
  node,
  course,
  onClose,
}: LessonOutlineEditPanelProps) {
  const lesson = course.lessons.find((l) => l.index === node.lessonIndex)
  const setCourse = useCourseStore((s) => s.setCourse)
  const courseId = useCourseStore((s) => s.courseId)

  const [title, setTitle] = useState(lesson?.title ?? '')
  const [summary, setSummary] = useState(lesson?.summary ?? '')
  const [keyTopics, setKeyTopics] = useState<string[]>(
    lesson?.key_topics ?? [],
  )
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    lesson?.estimated_minutes ?? 15,
  )
  const [difficulty, setDifficulty] = useState(lesson?.difficulty ?? 0.5)
  const [module, setModule] = useState(lesson?.module ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!courseId || lesson == null) return
    setSaving(true)
    setError(null)
    try {
      const { course: updated } = await api.updateLessonOutline(
        courseId,
        lesson.index,
        {
          title,
          summary,
          key_topics: keyTopics,
          estimated_minutes: estimatedMinutes,
          difficulty,
          module,
        },
      )
      setCourse(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const addTopic = () => setKeyTopics([...keyTopics, ''])
  const removeTopic = (idx: number) =>
    setKeyTopics(keyTopics.filter((_, i) => i !== idx))
  const updateTopic = (idx: number, value: string) =>
    setKeyTopics(keyTopics.map((t, i) => (i === idx ? value : t)))

  if (!lesson) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-96 border-l bg-card shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-sm font-semibold">Edit Lesson Outline</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Module */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Module
            </label>
            <Input
              value={module}
              onChange={(e) => setModule(e.target.value)}
              placeholder="e.g., Foundations"
              className="text-sm"
            />
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Key Topics */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Key Topics
              </label>
              <button
                onClick={addTopic}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="space-y-1.5">
              {keyTopics.map((topic, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    value={topic}
                    onChange={(e) => updateTopic(i, e.target.value)}
                    className="text-sm flex-1"
                    placeholder="Topic name"
                  />
                  <button
                    onClick={() => removeTopic(i)}
                    className="rounded-md p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Minutes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Estimated Minutes
            </label>
            <Input
              type="number"
              min={1}
              max={120}
              value={estimatedMinutes}
              onChange={(e) =>
                setEstimatedMinutes(parseInt(e.target.value, 10) || 1)
              }
              className="text-sm w-24"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Difficulty ({Math.round(difficulty * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={difficulty}
              onChange={(e) => setDifficulty(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Easy</span>
              <span>Hard</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  )
}
