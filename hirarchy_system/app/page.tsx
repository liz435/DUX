import { HierarchyTree } from "@/components/hierarchy-tree"
import { hierarchyData } from "@/lib/hierarchy-data"

export default function Page() {
  return <HierarchyTree data={hierarchyData} />
}
