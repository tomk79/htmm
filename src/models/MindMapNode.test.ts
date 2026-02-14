import { describe, it, expect } from 'vitest';
import {
  generateNodeId,
  createNode,
  createRootNode,
  findNodeById,
  findParentNode,
  getNodePath,
  cloneNode,
  getDepth,
  isAncestor,
  getSiblings,
  getNodeIndex,
} from '../models/MindMapNode';

describe('MindMapNode', () => {
  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();
      const id3 = generateNodeId();
      
      expect(id1).toMatch(/^ID_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });
  });

  describe('createNode', () => {
    it('should create a node with default values', () => {
      const node = createNode();
      
      expect(node.id).toBeDefined();
      expect(node.text).toBe('');
      expect(node.created).toBeGreaterThan(0);
      expect(node.modified).toBeGreaterThan(0);
      expect(node.children).toEqual([]);
    });

    it('should create a node with custom text', () => {
      const node = createNode('Test Node');
      
      expect(node.text).toBe('Test Node');
    });

    it('should accept overrides', () => {
      const node = createNode('Test', {
        color: '#FF0000',
        backgroundColor: '#00FF00',
        folded: true,
      });
      
      expect(node.text).toBe('Test');
      expect(node.color).toBe('#FF0000');
      expect(node.backgroundColor).toBe('#00FF00');
      expect(node.folded).toBe(true);
    });
  });

  describe('createRootNode', () => {
    it('should create a root node with default text', () => {
      const root = createRootNode();
      
      expect(root.text).toBe('New Mind Map');
      expect(root.style).toBe('fork');
      expect(root.children).toEqual([]);
    });

    it('should create a root node with custom text', () => {
      const root = createRootNode('My Mind Map');
      
      expect(root.text).toBe('My Mind Map');
      expect(root.style).toBe('fork');
    });
  });

  describe('findNodeById', () => {
    it('should find the root node', () => {
      const root = createNode('Root');
      const found = findNodeById(root, root.id);
      
      expect(found).toBe(root);
    });

    it('should find a child node', () => {
      const child = createNode('Child');
      const root = createNode('Root', { children: [child] });
      
      const found = findNodeById(root, child.id);
      expect(found).toBe(child);
    });

    it('should find a deeply nested node', () => {
      const grandchild = createNode('Grandchild');
      const child = createNode('Child', { children: [grandchild] });
      const root = createNode('Root', { children: [child] });
      
      const found = findNodeById(root, grandchild.id);
      expect(found).toBe(grandchild);
    });

    it('should return null if node not found', () => {
      const root = createNode('Root');
      const found = findNodeById(root, 'nonexistent');
      
      expect(found).toBeNull();
    });
  });

  describe('findParentNode', () => {
    it('should find parent of a direct child', () => {
      const child = createNode('Child');
      const root = createNode('Root', { children: [child] });
      
      const parent = findParentNode(root, child.id);
      expect(parent).toBe(root);
    });

    it('should find parent of a deeply nested node', () => {
      const grandchild = createNode('Grandchild');
      const child = createNode('Child', { children: [grandchild] });
      const root = createNode('Root', { children: [child] });
      
      const parent = findParentNode(root, grandchild.id);
      expect(parent).toBe(child);
    });

    it('should return null for root node', () => {
      const root = createNode('Root');
      const parent = findParentNode(root, root.id);
      
      expect(parent).toBeNull();
    });

    it('should return null if node not found', () => {
      const root = createNode('Root');
      const parent = findParentNode(root, 'nonexistent');
      
      expect(parent).toBeNull();
    });
  });

  describe('getNodePath', () => {
    it('should return path for root node', () => {
      const root = createNode('Root');
      const path = getNodePath(root, root.id);
      
      expect(path).toEqual([root]);
    });

    it('should return path for child node', () => {
      const child = createNode('Child');
      const root = createNode('Root', { children: [child] });
      
      const path = getNodePath(root, child.id);
      expect(path).toEqual([root, child]);
    });

    it('should return path for deeply nested node', () => {
      const grandchild = createNode('Grandchild');
      const child = createNode('Child', { children: [grandchild] });
      const root = createNode('Root', { children: [child] });
      
      const path = getNodePath(root, grandchild.id);
      expect(path).toEqual([root, child, grandchild]);
    });

    it('should return null if node not found', () => {
      const root = createNode('Root');
      const path = getNodePath(root, 'nonexistent');
      
      expect(path).toBeNull();
    });
  });

  describe('cloneNode', () => {
    it('should clone a simple node', () => {
      const original = createNode('Test');
      const clone = cloneNode(original);
      
      expect(clone).not.toBe(original);
      expect(clone.id).not.toBe(original.id);
      expect(clone.text).toBe(original.text);
    });

    it('should clone a node with children', () => {
      const child = createNode('Child');
      const original = createNode('Parent', { children: [child] });
      const clone = cloneNode(original);
      
      expect(clone.children).toHaveLength(1);
      expect(clone.children![0]).not.toBe(child);
      expect(clone.children![0].text).toBe(child.text);
    });

    it('should preserve properties', () => {
      const original = createNode('Test', {
        color: '#FF0000',
        backgroundColor: '#00FF00',
        folded: true,
      });
      const clone = cloneNode(original);
      
      expect(clone.color).toBe('#FF0000');
      expect(clone.backgroundColor).toBe('#00FF00');
      expect(clone.folded).toBe(true);
    });
  });

  describe('getDepth', () => {
    it('should return 0 for root node', () => {
      const root = createNode('Root');
      const depth = getDepth(root, root.id);
      
      expect(depth).toBe(0);
    });

    it('should return 1 for direct child', () => {
      const child = createNode('Child');
      const root = createNode('Root', { children: [child] });
      
      const depth = getDepth(root, child.id);
      expect(depth).toBe(1);
    });

    it('should return correct depth for nested nodes', () => {
      const grandchild = createNode('Grandchild');
      const child = createNode('Child', { children: [grandchild] });
      const root = createNode('Root', { children: [child] });
      
      const depth = getDepth(root, grandchild.id);
      expect(depth).toBe(2);
    });

    it('should return -1 if node not found', () => {
      const root = createNode('Root');
      const depth = getDepth(root, 'nonexistent');
      
      expect(depth).toBe(-1);
    });
  });

  describe('isAncestor', () => {
    it('should return true if node is ancestor', () => {
      const grandchild = createNode('Grandchild');
      const child = createNode('Child', { children: [grandchild] });
      const root = createNode('Root', { children: [child] });
      
      expect(isAncestor(root, root.id, child.id)).toBe(true);
      expect(isAncestor(root, root.id, grandchild.id)).toBe(true);
      expect(isAncestor(root, child.id, grandchild.id)).toBe(true);
    });

    it('should return false if node is not ancestor', () => {
      const child1 = createNode('Child1');
      const child2 = createNode('Child2');
      const root = createNode('Root', { children: [child1, child2] });
      
      expect(isAncestor(root, child1.id, child2.id)).toBe(false);
      expect(isAncestor(root, child2.id, child1.id)).toBe(false);
    });

    it('should return false for same node', () => {
      const root = createNode('Root');
      
      expect(isAncestor(root, root.id, root.id)).toBe(false);
    });
  });

  describe('getSiblings', () => {
    it('should return empty array for root node', () => {
      const root = createNode('Root');
      const siblings = getSiblings(root, root.id);
      
      expect(siblings).toEqual([]);
    });

    it('should return siblings of a child node', () => {
      const child1 = createNode('Child1');
      const child2 = createNode('Child2');
      const child3 = createNode('Child3');
      const root = createNode('Root', { children: [child1, child2, child3] });
      
      const siblings = getSiblings(root, child2.id);
      expect(siblings).toHaveLength(2);
      expect(siblings).toContain(child1);
      expect(siblings).toContain(child3);
      expect(siblings).not.toContain(child2);
    });
  });

  describe('getNodeIndex', () => {
    it('should return -1 for root node', () => {
      const root = createNode('Root');
      const index = getNodeIndex(root, root.id);
      
      expect(index).toBe(-1);
    });

    it('should return correct index for child nodes', () => {
      const child1 = createNode('Child1');
      const child2 = createNode('Child2');
      const child3 = createNode('Child3');
      const root = createNode('Root', { children: [child1, child2, child3] });
      
      expect(getNodeIndex(root, child1.id)).toBe(0);
      expect(getNodeIndex(root, child2.id)).toBe(1);
      expect(getNodeIndex(root, child3.id)).toBe(2);
    });
  });
});
