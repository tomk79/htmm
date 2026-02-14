/**
 * useViewportCulling Hook
 * Custom hook for viewport-based node culling (simple virtualization)
 * Only renders nodes visible in the viewport for better performance with large maps
 */

import { useMemo } from 'react';
import type { LayoutNode } from '../types/mindmap';

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const DEFAULT_MAX_RENDERED_NODES = 800;

export function useViewportCulling(
  nodes: LayoutNode[],
  containerWidth: number | string,
  containerHeight: number | string,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0,
  padding: number = 200, // Extra padding to load nodes just outside viewport
  maxRenderedNodes: number = DEFAULT_MAX_RENDERED_NODES // Hard cap for very large viewports
): LayoutNode[] {
  const visibleNodes = useMemo(() => {
    // Parse container dimensions
    const width = typeof containerWidth === 'number' ? containerWidth : 800;
    const height = typeof containerHeight === 'number' ? containerHeight : 600;
    
    // Calculate viewport bounds with padding
    const viewportBounds: ViewportBounds = {
      left: -panX / zoom - padding,
      top: -panY / zoom - padding,
      right: (-panX + width) / zoom + padding,
      bottom: (-panY + height) / zoom + padding,
    };
    
    const viewportCenterX = (viewportBounds.left + viewportBounds.right) / 2;
    const viewportCenterY = (viewportBounds.top + viewportBounds.bottom) / 2;
    
    // Filter nodes that intersect with viewport
    let filtered = nodes.filter(node => {
      const nodeLeft = node.x - node.width / 2;
      const nodeTop = node.y - node.height / 2;
      const nodeRight = node.x + node.width / 2;
      const nodeBottom = node.y + node.height / 2;
      
      const intersects =
        nodeRight >= viewportBounds.left &&
        nodeLeft <= viewportBounds.right &&
        nodeBottom >= viewportBounds.top &&
        nodeTop <= viewportBounds.bottom;
      
      return intersects;
    });
    
    // Virtual list cap: if too many nodes in view, render only those closest to viewport center
    if (filtered.length > maxRenderedNodes) {
      const withDist = filtered.map(node => {
        const dx = node.x - viewportCenterX;
        const dy = node.y - viewportCenterY;
        return { node, distSq: dx * dx + dy * dy };
      });
      withDist.sort((a, b) => a.distSq - b.distSq);
      filtered = withDist.slice(0, maxRenderedNodes).map(({ node }) => node);
    }
    
    return filtered;
  }, [nodes, containerWidth, containerHeight, zoom, panX, panY, padding, maxRenderedNodes]);
  
  // Always include root node even if outside viewport or beyond cap
  const enhancedVisibleNodes = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const additionalNodes: LayoutNode[] = [];
    
    for (const node of nodes) {
      if (node.depth === 0 && !visibleNodeIds.has(node.id)) {
        additionalNodes.push(node);
      }
    }
    
    return [...visibleNodes, ...additionalNodes];
  }, [nodes, visibleNodes]);
  
  return enhancedVisibleNodes;
}

/**
 * Calculate if viewport culling should be enabled based on node count
 */
export function shouldEnableViewportCulling(nodeCount: number, threshold: number = 100): boolean {
  return nodeCount > threshold;
}
