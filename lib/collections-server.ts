import { prisma } from "./db";

/**
 * All descendant collection ids of `rootId` (not including itself), via BFS
 * over parentId. Used so viewing a parent collection shows bookmarks filed
 * anywhere in its subtree, not just ones filed directly on it.
 */
export async function descendantCollectionIds(rootId: string): Promise<string[]> {
  const all = await prisma.collection.findMany({ select: { id: true, parentId: true } });
  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    if (!c.parentId) continue;
    const list = childrenOf.get(c.parentId) ?? [];
    list.push(c.id);
    childrenOf.set(c.parentId, list);
  }

  const result: string[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const childId of childrenOf.get(current) ?? []) {
      result.push(childId);
      queue.push(childId);
    }
  }
  return result;
}
