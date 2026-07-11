import type { CollectionDTO } from "./types";

export interface TreeNode extends CollectionDTO {
  children: TreeNode[];
  depth: number;
}

export function buildTree(flat: CollectionDTO[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [], depth: 0 }));
  const roots: TreeNode[] = [];
  const sorted = [...flat].sort((a, b) => a.sortOrder - b.sortOrder);

  function assignDepth(node: TreeNode, depth: number) {
    node.depth = depth;
    node.children.forEach((c) => assignDepth(c, depth + 1));
  }

  for (const c of sorted) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  roots.forEach((r) => assignDepth(r, 0));
  return roots;
}

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (list: TreeNode[]) => list.forEach((n) => (out.push(n), walk(n.children)));
  walk(nodes);
  return out;
}

export function descendantIds(node: TreeNode): Set<string> {
  const out = new Set<string>();
  const walk = (n: TreeNode) => n.children.forEach((c) => (out.add(c.id), walk(c)));
  walk(node);
  return out;
}

/** A collection's `icon` is either an emoji string or an uploaded /uploads/... image path. */
export function isIconImagePath(icon: string | null | undefined): icon is string {
  return !!icon && icon.startsWith("/uploads/");
}
