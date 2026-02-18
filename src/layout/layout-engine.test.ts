import { describe, it, expect } from 'vitest';
import { createRootNode, createNode } from '../models/MindMapNode';
import {
  LAYOUT_CONSTANTS,
  calculateTextDimensions,
  calculateNodeDimensions,
  calculateLayout,
  getBoundingBox,
  getEdgePoints,
} from './layout-engine';
import type { LayoutNode } from '../types/mindmap';

describe('Layout Engine', () => {
  describe('LAYOUT_CONSTANTS', () => {
    it('should have expected constant values', () => {
      expect(LAYOUT_CONSTANTS.DEFAULT_HGAP).toBe(20);
      expect(LAYOUT_CONSTANTS.SIBLING_VGAP).toBe(3);
      expect(LAYOUT_CONSTANTS.SUBTREE_VGAP).toBe(12);
      expect(LAYOUT_CONSTANTS.MIN_NODE_WIDTH).toBe(150);
      expect(LAYOUT_CONSTANTS.MIN_NODE_HEIGHT).toBe(20);
      expect(LAYOUT_CONSTANTS.ICON_SIZE).toBe(16);
      expect(LAYOUT_CONSTANTS.TEXT_PADDING_H).toBe(8);
      expect(LAYOUT_CONSTANTS.TEXT_PADDING_V).toBe(4);
      expect(LAYOUT_CONSTANTS.ROOT_X).toBe(0);
      expect(LAYOUT_CONSTANTS.ROOT_Y).toBe(0);
    });
  });

  describe('calculateTextDimensions', () => {
    it('should return width and height for empty text', () => {
      const result = calculateTextDimensions('', 12, 'Arial');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(typeof result.width).toBe('number');
      expect(typeof result.height).toBe('number');
      expect(result.width).toBeGreaterThanOrEqual(0);
      expect(result.height).toBe(12 * 1.2);
    });

    it('should return positive dimensions for non-empty text', () => {
      const result = calculateTextDimensions('Hello', 12, 'Arial');
      expect(result.width).toBeGreaterThanOrEqual(0);
      expect(result.height).toBe(12 * 1.2);
    });

    it('should use default fontSize and fontFamily when omitted', () => {
      const result = calculateTextDimensions('Test');
      expect(result.height).toBe(12 * 1.2);
      expect(typeof result.width).toBe('number');
    });
  });

  describe('calculateNodeDimensions', () => {
    it('should respect MIN_NODE_WIDTH and MIN_NODE_HEIGHT for short text', () => {
      const node = createNode('A');
      const result = calculateNodeDimensions(node);
      expect(result.width).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_NODE_WIDTH);
      expect(result.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_NODE_HEIGHT);
    });

    it('should include icon width when node has icons', () => {
      const longText = 'A'.repeat(80);
      const nodeWithoutIcons = createNode(longText);
      const nodeWithIcons = createNode(longText, {
        icons: [{ builtin: 'yes' }, { builtin: 'idea' }],
      });
      const dimsWithout = calculateNodeDimensions(nodeWithoutIcons);
      const dimsWith = calculateNodeDimensions(nodeWithIcons);
      const iconWidth = 2 * (LAYOUT_CONSTANTS.ICON_SIZE + LAYOUT_CONSTANTS.ICON_PADDING);
      expect(dimsWith.width).toBeGreaterThanOrEqual(dimsWithout.width + iconWidth);
    });

    it('should use node font when provided', () => {
      const node = createNode('Test', { font: { size: 16, name: 'Arial' } });
      const result = calculateNodeDimensions(node);
      expect(result.width).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_NODE_WIDTH);
      expect(result.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_NODE_HEIGHT);
    });
  });

  describe('calculateLayout', () => {
    it('should place root at (0, 0) with depth 0 and side center', () => {
      const root = createRootNode('Root');
      const nodes = calculateLayout(root);
      expect(nodes.length).toBe(1);
      expect(nodes[0].x).toBe(LAYOUT_CONSTANTS.ROOT_X);
      expect(nodes[0].y).toBe(LAYOUT_CONSTANTS.ROOT_Y);
      expect(nodes[0].depth).toBe(0);
      expect(nodes[0].side).toBe('center');
    });

    it('should layout root with children on left and right', () => {
      const root = createRootNode('Root');
      const leftChild = createNode('Left', { position: 'left' });
      const rightChild = createNode('Right', { position: 'right' });
      root.children = [leftChild, rightChild];
      const nodes = calculateLayout(root);
      expect(nodes.length).toBeGreaterThanOrEqual(3);
      const rootLayout = nodes.find((n) => n.depth === 0);
      const leftLayout = nodes.find((n) => n.side === 'left' && n.depth === 1);
      const rightLayout = nodes.find((n) => n.side === 'right' && n.depth === 1);
      expect(rootLayout).toBeDefined();
      expect(rootLayout!.x).toBe(0);
      expect(rootLayout!.y).toBe(0);
      expect(leftLayout).toBeDefined();
      expect(rightLayout).toBeDefined();
      expect(leftLayout!.x).toBeLessThan(0);
      expect(rightLayout!.x).toBeGreaterThan(0);
    });

    it('should not layout children when root is folded', () => {
      const root = createRootNode('Root');
      root.children = [createNode('Child', { position: 'right' })];
      root.folded = true;
      const nodes = calculateLayout(root);
      expect(nodes.length).toBe(1);
    });
  });

  describe('getBoundingBox', () => {
    it('should return zeros for empty array', () => {
      const box = getBoundingBox([]);
      expect(box).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 });
    });

    it('should return node bounds for single node', () => {
      const root = createRootNode('Root');
      const nodes = calculateLayout(root);
      const box = getBoundingBox(nodes);
      expect(box.minX).toBeLessThanOrEqual(box.maxX);
      expect(box.minY).toBeLessThanOrEqual(box.maxY);
      expect(box.width).toBe(box.maxX - box.minX);
      expect(box.height).toBe(box.maxY - box.minY);
    });

    it('should encompass all nodes for multiple nodes', () => {
      const root = createRootNode('Root');
      root.children = [
        createNode('L', { position: 'left' }),
        createNode('R', { position: 'right' }),
      ];
      const nodes = calculateLayout(root);
      const box = getBoundingBox(nodes);
      for (const node of nodes) {
        const left = node.x - node.width / 2;
        const right = node.x + node.width / 2;
        const top = node.y - node.height / 2;
        const bottom = node.y + node.height / 2;
        expect(box.minX).toBeLessThanOrEqual(left);
        expect(box.maxX).toBeGreaterThanOrEqual(right);
        expect(box.minY).toBeLessThanOrEqual(top);
        expect(box.maxY).toBeGreaterThanOrEqual(bottom);
      }
    });
  });

  describe('getEdgePoints', () => {
    it('should return source on left and target on right when target is left of source', () => {
      const sourceNode: LayoutNode = {
        ...createNode('Source'),
        x: 100,
        y: 0,
        width: 80,
        height: 24,
        depth: 0,
        side: 'center',
      };
      const targetNode: LayoutNode = {
        ...createNode('Target'),
        x: -100,
        y: 0,
        width: 80,
        height: 24,
        depth: 0,
        side: 'center',
      };
      const points = getEdgePoints(sourceNode, targetNode);
      expect(points.sourceX).toBe(sourceNode.x - sourceNode.width / 2);
      expect(points.sourceY).toBe(sourceNode.y);
      expect(points.targetX).toBe(targetNode.x + targetNode.width / 2);
      expect(points.targetY).toBe(targetNode.y);
    });

    it('should return source on right and target on left when target is right of source', () => {
      const sourceNode: LayoutNode = {
        ...createNode('Source'),
        x: -100,
        y: 0,
        width: 80,
        height: 24,
        depth: 0,
        side: 'center',
      };
      const targetNode: LayoutNode = {
        ...createNode('Target'),
        x: 100,
        y: 0,
        width: 80,
        height: 24,
        depth: 0,
        side: 'center',
      };
      const points = getEdgePoints(sourceNode, targetNode);
      expect(points.sourceX).toBe(sourceNode.x + sourceNode.width / 2);
      expect(points.sourceY).toBe(sourceNode.y);
      expect(points.targetX).toBe(targetNode.x - targetNode.width / 2);
      expect(points.targetY).toBe(targetNode.y);
    });
  });
});
