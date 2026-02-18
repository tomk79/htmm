/**
 * MindMapNode Model
 * Based on FreeMind NodeAdapter / MindMapNodeModel (for .mm compatibility)
 */

import type { MindMapNode } from '../types/mindmap';

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
  return `ID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new mind map node with default values
 */
export function createNode(text: string = '', overrides: Partial<MindMapNode> = {}): MindMapNode {
  return {
    id: generateNodeId(),
    text,
    created: Date.now(),
    modified: Date.now(),
    children: [],
    ...overrides,
  };
}

/**
 * Create a root node for a new mind map
 */
export function createRootNode(text: string = 'New Mind Map'): MindMapNode {
  return createNode(text, {
    style: 'fork',
    children: [],
  });
}

/**
 * Find a node by ID in the tree
 */
export function findNodeById(root: MindMapNode, id: string): MindMapNode | null {
  if (root.id === id) {
    return root;
  }
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Find parent node of a given node
 */
export function findParentNode(root: MindMapNode, targetId: string): MindMapNode | null {
  if (!root.children) {
    return null;
  }
  
  for (const child of root.children) {
    if (child.id === targetId) {
      return root;
    }
    
    const found = findParentNode(child, targetId);
    if (found) {
      return found;
    }
  }
  
  return null;
}

/**
 * Get the path from root to a node
 */
export function getNodePath(root: MindMapNode, targetId: string): MindMapNode[] | null {
  if (root.id === targetId) {
    return [root];
  }
  
  if (root.children) {
    for (const child of root.children) {
      const path = getNodePath(child, targetId);
      if (path) {
        return [root, ...path];
      }
    }
  }
  
  return null;
}

/**
 * Count total nodes in the tree
 */
export function countNodes(node: MindMapNode): number {
  let count = 1;
  
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  
  return count;
}

/**
 * Get the depth of a node (distance from root)
 */
export function getNodeDepth(root: MindMapNode, targetId: string): number {
  const path = getNodePath(root, targetId);
  return path ? path.length - 1 : -1;
}

/**
 * Check if a node is folded
 */
export function isFolded(node: MindMapNode): boolean {
  return node.folded === true;
}

/**
 * Get visible children (returns empty array if folded)
 */
export function getVisibleChildren(node: MindMapNode): MindMapNode[] {
  if (isFolded(node)) {
    return [];
  }
  return node.children || [];
}

/**
 * Get all children (regardless of folding state)
 */
export function getAllChildren(node: MindMapNode): MindMapNode[] {
  return node.children || [];
}

/**
 * Check if node has children
 */
export function hasChildren(node: MindMapNode): boolean {
  return (node.children?.length || 0) > 0;
}

/**
 * Clone a node (deep copy)
 */
export function cloneNode(node: MindMapNode, includeChildren: boolean = true): MindMapNode {
  const cloned: MindMapNode = {
    ...node,
    id: generateNodeId(), // New ID for the clone
    created: Date.now(),
    modified: Date.now(),
  };
  
  // Deep copy arrays
  if (node.icons) {
    cloned.icons = [...node.icons];
  }
  if (node.arrowLinks) {
    cloned.arrowLinks = [...node.arrowLinks];
  }
  if (node.richContent) {
    cloned.richContent = [...node.richContent];
  }
  if (node.attributes) {
    cloned.attributes = [...node.attributes];
  }
  
  // Deep copy font, edge, cloud, layout
  if (node.font) {
    cloned.font = { ...node.font };
  }
  if (node.edge) {
    cloned.edge = { ...node.edge };
  }
  if (node.cloud) {
    cloned.cloud = { ...node.cloud };
  }
  if (node.layout) {
    cloned.layout = { ...node.layout };
  }
  if (node.attributeLayout) {
    cloned.attributeLayout = { ...node.attributeLayout };
  }
  
  // Clone children recursively
  if (includeChildren && node.children) {
    cloned.children = node.children.map(child => cloneNode(child, true));
  } else {
    cloned.children = [];
  }
  
  return cloned;
}

/**
 * Get sibling nodes
 */
export function getSiblings(root: MindMapNode, nodeId: string): MindMapNode[] {
  const parent = findParentNode(root, nodeId);
  if (!parent || !parent.children) {
    return [];
  }
  return parent.children.filter(child => child.id !== nodeId);
}

/**
 * Get node index among siblings
 */
export function getNodeIndex(root: MindMapNode, nodeId: string): number {
  const parent = findParentNode(root, nodeId);
  if (!parent || !parent.children) {
    return -1;
  }
  return parent.children.findIndex(child => child.id === nodeId);
}

/**
 * Get the depth of a node in the tree
 * Returns 0 for root, 1 for root's children, etc.
 * Returns -1 if node not found
 */
export function getDepth(root: MindMapNode, nodeId: string): number {
  const path = getNodePath(root, nodeId);
  if (!path) {
    return -1;
  }
  return path.length - 1;
}

/**
 * Check if a node is an ancestor of another node
 * Returns false if nodeIds are the same
 */
export function isAncestor(root: MindMapNode, ancestorId: string, descendantId: string): boolean {
  if (ancestorId === descendantId) {
    return false;
  }
  
  const descendantPath = getNodePath(root, descendantId);
  if (!descendantPath) {
    return false;
  }
  
  return descendantPath.some(node => node.id === ancestorId);
}

/**
 * Check if node is a leaf (has no children)
 */
export function isLeaf(node: MindMapNode): boolean {
  return !hasChildren(node);
}

/**
 * Get all descendant nodes
 */
export function getDescendants(node: MindMapNode): MindMapNode[] {
  const descendants: MindMapNode[] = [];
  
  if (node.children) {
    for (const child of node.children) {
      descendants.push(child);
      descendants.push(...getDescendants(child));
    }
  }
  
  return descendants;
}

/**
 * Get next sibling node
 * When the parent is the root node, only returns siblings on the same side (left/right)
 */
export function getNextSibling(root: MindMapNode, nodeId: string): MindMapNode | null {
  const parent = findParentNode(root, nodeId);
  if (!parent || !parent.children) {
    return null;
  }
  
  const currentNode = parent.children.find(child => child.id === nodeId);
  if (!currentNode) {
    return null;
  }
  
  // If parent is the root node, filter siblings by position
  const isRootChild = parent.id === root.id;
  const siblings = isRootChild && currentNode.position
    ? parent.children.filter(child => child.position === currentNode.position)
    : parent.children;
  
  const currentIndex = siblings.findIndex(child => child.id === nodeId);
  if (currentIndex === -1 || currentIndex === siblings.length - 1) {
    return null;
  }
  
  return siblings[currentIndex + 1];
}

/**
 * Get previous sibling node
 * When the parent is the root node, only returns siblings on the same side (left/right)
 */
export function getPreviousSibling(root: MindMapNode, nodeId: string): MindMapNode | null {
  const parent = findParentNode(root, nodeId);
  if (!parent || !parent.children) {
    return null;
  }
  
  const currentNode = parent.children.find(child => child.id === nodeId);
  if (!currentNode) {
    return null;
  }
  
  // If parent is the root node, filter siblings by position
  const isRootChild = parent.id === root.id;
  const siblings = isRootChild && currentNode.position
    ? parent.children.filter(child => child.position === currentNode.position)
    : parent.children;
  
  const currentIndex = siblings.findIndex(child => child.id === nodeId);
  if (currentIndex <= 0) {
    return null;
  }
  
  return siblings[currentIndex - 1];
}

/**
 * Get first child node
 */
export function getFirstChild(node: MindMapNode): MindMapNode | null {
  if (!node.children || node.children.length === 0) {
    return null;
  }
  
  return node.children[0];
}

/**
 * Get last child node
 */
export function getLastChild(node: MindMapNode): MindMapNode | null {
  if (!node.children || node.children.length === 0) {
    return null;
  }
  
  return node.children[node.children.length - 1];
}

/**
 * Get the last descendant of startNode at targetDepth (from root).
 * Walks down always taking the last child. If no children before reaching targetDepth, returns the deepest node reached.
 */
export function getLastDescendantAtDepth(root: MindMapNode, startNode: MindMapNode, targetDepth: number): MindMapNode {
  let current: MindMapNode = startNode;
  let d = getDepth(root, startNode.id);
  while (d < targetDepth && current.children && current.children.length > 0) {
    current = current.children[current.children.length - 1];
    d += 1;
  }
  return current;
}

/**
 * Get the first descendant of startNode at targetDepth (from root).
 * Walks down always taking the first child. If no children before reaching targetDepth, returns the deepest node reached.
 */
export function getFirstDescendantAtDepth(root: MindMapNode, startNode: MindMapNode, targetDepth: number): MindMapNode {
  let current: MindMapNode = startNode;
  let d = getDepth(root, startNode.id);
  while (d < targetDepth && current.children && current.children.length > 0) {
    current = current.children[0];
    d += 1;
  }
  return current;
}

/**
 * Get previous sibling, or if none: the last descendant at same depth under the previous sibling of the nearest ancestor that has one.
 * Does not cross the root (never moves to the other side).
 */
export function getPreviousSiblingOrAbove(root: MindMapNode, nodeId: string): MindMapNode | null {
  const prev = getPreviousSibling(root, nodeId);
  if (prev) return prev;
  const node = findNodeById(root, nodeId);
  if (!node) return null;
  const targetDepth = getDepth(root, nodeId);
  let current: MindMapNode = node;
  while (true) {
    const parent = findParentNode(root, current.id);
    if (!parent || parent.id === root.id) return null;
    const prevSibling = getPreviousSibling(root, parent.id);
    if (prevSibling) {
      return getLastDescendantAtDepth(root, prevSibling, targetDepth);
    }
    current = parent;
  }
}

/**
 * Get next sibling, or if none: the first descendant at same depth under the next sibling of the nearest ancestor that has one.
 * Does not cross the root (never moves to the other side).
 */
export function getNextSiblingOrBelow(root: MindMapNode, nodeId: string): MindMapNode | null {
  const next = getNextSibling(root, nodeId);
  if (next) return next;
  const node = findNodeById(root, nodeId);
  if (!node) return null;
  const targetDepth = getDepth(root, nodeId);
  let current: MindMapNode = node;
  while (true) {
    const parent = findParentNode(root, current.id);
    if (!parent || parent.id === root.id) return null;
    const nextSibling = getNextSibling(root, parent.id);
    if (nextSibling) {
      return getFirstDescendantAtDepth(root, nextSibling, targetDepth);
    }
    current = parent;
  }
}

/**
 * Get first child node by position (for root node's children)
 */
export function getFirstChildByPosition(node: MindMapNode, position: 'left' | 'right'): MindMapNode | null {
  if (!node.children || node.children.length === 0) {
    return null;
  }
  
  // Find the first child with the specified position
  for (const child of node.children) {
    if (child.position === position) {
      return child;
    }
  }
  
  return null;
}

/**
 * Collect all arrow links from the tree
 */
export function collectAllArrowLinks(root: MindMapNode): Array<{ sourceId: string; targetId: string; arrowLink: import('../types/mindmap').ArrowLinkInfo }> {
  const arrowLinks: Array<{ sourceId: string; targetId: string; arrowLink: import('../types/mindmap').ArrowLinkInfo }> = [];
  
  function traverse(node: MindMapNode) {
    // Collect arrow links from this node
    if (node.arrowLinks && node.arrowLinks.length > 0) {
      for (const arrowLink of node.arrowLinks) {
        arrowLinks.push({
          sourceId: node.id,
          targetId: arrowLink.destination,
          arrowLink,
        });
      }
    }
    
    // Traverse children
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  
  traverse(root);
  return arrowLinks;
}
