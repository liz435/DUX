import type { Course } from '@/api/client'
import type { HierarchyNode } from '@/types/hierarchy'

/**
 * Transform a Course into a HierarchyNode tree:
 *   Course (root) → Module groups (category) → Lessons (topic) → Key topics (item)
 */
export function courseToHierarchy(course: Course): HierarchyNode {
  // Group lessons by module
  const moduleMap = new Map<string, typeof course.lessons>()
  for (const lesson of course.lessons) {
    const key = lesson.module || 'General'
    if (!moduleMap.has(key)) moduleMap.set(key, [])
    moduleMap.get(key)!.push(lesson)
  }

  const categoryNodes: HierarchyNode[] = Array.from(moduleMap.entries()).map(
    ([moduleName, lessons], moduleIdx) => ({
      id: `module-${moduleIdx}`,
      label: moduleName,
      type: 'category' as const,
      summary: `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`,
      children: lessons.map((lesson) => {
        // Determine status tag
        const statusTag = lesson.is_completed
          ? 'Completed'
          : lesson.is_unlocked
            ? 'Active'
            : 'Locked'

        // Format learning objectives as AI insight text
        const objectives = lesson.learning_objectives
        const aiInsight =
          objectives && objectives.length > 0
            ? `Learning objectives: ${objectives.map((o: Record<string, string>) => o.description || o.objective || Object.values(o).join(' ')).join('; ')}`
            : undefined

        return {
          id: `lesson-${lesson.index}`,
          label: lesson.title,
          type: 'topic' as const,
          summary: lesson.summary,
          confidence: lesson.difficulty ?? 0.5,
          lessonIndex: lesson.index,
          aiInsight,
          tags: [statusTag, ...(lesson.has_quiz ? ['Quiz'] : [])],
          metadata: {
            source: `${lesson.estimated_minutes} min`,
            relevance: lesson.difficulty ?? 0.5,
          },
          children: (lesson.key_topics ?? []).map(
            (topic: string, i: number) => ({
              id: `topic-${lesson.index}-${i}`,
              label: topic,
              type: 'item' as const,
            }),
          ),
        } satisfies HierarchyNode
      }),
    }),
  )

  return {
    id: 'root',
    label: course.title,
    type: 'root',
    summary: course.description,
    tags: [course.level],
    children: categoryNodes,
  }
}
