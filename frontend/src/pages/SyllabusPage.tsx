import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Plus } from 'lucide-react'
import { api } from '../api/client'
import { useCourseStore } from '../store/courseStore'
import { HierarchyTree } from '../components/hierarchy/hierarchy-tree'
import { LessonOutlineEditPanel } from '../components/hierarchy/LessonOutlineEditPanel'
import { courseToHierarchy } from '../lib/courseToHierarchy'
import type { HierarchyNode } from '../types/hierarchy'

export function SyllabusPage() {
  const { id } = useParams<{ id: string }>()
  const course = useCourseStore((s) => s.course)
  const courseId = useCourseStore((s) => s.courseId)
  const setCourse = useCourseStore((s) => s.setCourse)
  const setCourseId = useCourseStore((s) => s.setCourseId)
  const [loading, setLoading] = useState(false)
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null)

  // Deep-link: fetch course from API if not in store or mismatched
  useEffect(() => {
    if (id && (!course || courseId !== id)) {
      setLoading(true)
      api
        .getCourse(id)
        .then(({ course }) => {
          setCourse(course)
          setCourseId(id)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [id, course, courseId, setCourse, setCourseId])

  const hierarchyData = useMemo(
    () => (course ? courseToHierarchy(course) : null),
    [course],
  )

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading syllabus...</p>
      </div>
    )
  }

  if (!course || !hierarchyData) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground mb-4">No course loaded.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create a Course
        </Link>
      </div>
    )
  }

  return (
    <div>
      <HierarchyTree
        data={hierarchyData}
        onEdit={(node) => {
          if (node.type === 'topic') setEditingNode(node)
        }}
      />

      {editingNode && (
        <LessonOutlineEditPanel
          node={editingNode}
          course={course}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  )
}
