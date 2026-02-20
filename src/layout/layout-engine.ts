/**
 * Mind Map Layout Engine
 * Based on FreeMind NodeViewLayout algorithm (for .mm compatibility)
 */

import type { MindMapNode, LayoutNode } from '../types/mindmap';
import { isFolded } from '../models/MindMapNode';

export type GetNodeDimensions = (node: MindMapNode) => { width: number; height: number };

export interface CalculateLayoutOptions {
  getNodeDimensions?: GetNodeDimensions;
}

/**
 * Layout constants (matching .mm / FreeMind defaults)
 */
export const LAYOUT_CONSTANTS = {
  DEFAULT_HGAP: 20,      // Horizontal gap from parent
  SIBLING_VGAP: 9,       // Vertical gap between direct siblings (直接の兄弟)
  SUBTREE_VGAP: 15,      // Vertical gap between sibling subtrees (サブツリー同士)
  MIN_NODE_WIDTH: 150,   // Minimum node width
  MIN_NODE_HEIGHT: 20,   // Minimum node height
  MAX_NODE_TEXT_WIDTH: 280, // Max width for text before wrapping (text area only)
  ICON_SIZE: 16,         // Icon dimensions
  ICON_PADDING: 2,       // Padding between icons
  TEXT_PADDING_H: 8,     // Horizontal text padding
  TEXT_PADDING_V: 4,     // Vertical text padding
  FOLDING_SYMBOL_SIZE: 8,// Size of the folding triangle
  ROOT_X: 0,             // Root X position (center)
  ROOT_Y: 0,             // Root Y position (center)
};

/** Vertical gap after a child: SUBTREE_VGAP if child has children, else SIBLING_VGAP. Overridden by node.layout.vgap. */
function getVgapAfterChild(child: MindMapNode): number {
  if (child.layout?.vgap !== undefined) return child.layout.vgap;
  const hasSubtree = !!(child.children && child.children.length > 0 && !isFolded(child));
  return hasSubtree ? LAYOUT_CONSTANTS.SUBTREE_VGAP : LAYOUT_CONSTANTS.SIBLING_VGAP;
}

/**
 * Calculate text dimensions (approximate)
 */
export function calculateTextDimensions(
  text: string = '',
  fontSize: number = 12,
  fontFamily: string = 'Arial'
): { width: number; height: number } {
  // Create a temporary canvas for measurement
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    // Fallback: rough estimation
    return {
      width: text.length * fontSize * 0.6,
      height: fontSize * 1.2,
    };
  }
  
  context.font = `${fontSize}px ${fontFamily}`;
  const metrics = context.measureText(text);
  
  return {
    width: metrics.width,
    height: fontSize * 1.2, // Approximate line height
  };
}

const LINE_HEIGHT_RATIO = 1.2;

/**
 * Calculate text dimensions when wrapped at maxWidth.
 * Respects explicit newlines and wraps by character so CJK works.
 */
export function calculateWrappedTextDimensions(
  text: string = '',
  fontSize: number = 12,
  fontFamily: string = 'Arial',
  maxWidth: number = LAYOUT_CONSTANTS.MAX_NODE_TEXT_WIDTH
): { width: number; height: number } {
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context || maxWidth <= 0) {
    const fallback = calculateTextDimensions(text, fontSize, fontFamily);
    const width = maxWidth > 0 ? Math.min(fallback.width, maxWidth) : fallback.width;
    return { width, height: fallback.height };
  }

  context.font = `${fontSize}px ${fontFamily}`;
  const measure = (s: string) => (s ? context.measureText(s).width : 0);

  const lineWidths: number[] = [];

  for (const paragraph of text.split('\n')) {
    let currentLine = '';
    for (const char of paragraph) {
      const testLine = currentLine + char;
      const w = measure(testLine);
      if (w > maxWidth && currentLine !== '') {
        lineWidths.push(measure(currentLine));
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine !== '') {
      lineWidths.push(measure(currentLine));
    }
  }

  if (lineWidths.length === 0) {
    return { width: 0, height: lineHeight };
  }

  const width = Math.min(maxWidth, Math.max(...lineWidths));
  const height = lineWidths.length * lineHeight;
  return { width, height };
}

/**
 * Calculate node dimensions
 */
export function calculateNodeDimensions(node: MindMapNode): { width: number; height: number } {
  const fontSize = node.font?.size || 12;
  const fontFamily = node.font?.name || 'Arial';
  
  // Calculate text dimensions (wrapped at max width)
  const textDims = calculateWrappedTextDimensions(
    node.text || '',
    fontSize,
    fontFamily,
    LAYOUT_CONSTANTS.MAX_NODE_TEXT_WIDTH
  );
  
  // Add icon width if present
  let iconWidth = 0;
  if (node.icons && node.icons.length > 0) {
    iconWidth = node.icons.length * (LAYOUT_CONSTANTS.ICON_SIZE + LAYOUT_CONSTANTS.ICON_PADDING);
  }
  
  // Calculate total dimensions with padding (ceil so layout math is consistent with CSS pixels)
  const width = Math.max(
    LAYOUT_CONSTANTS.MIN_NODE_WIDTH,
    Math.ceil(textDims.width + iconWidth + LAYOUT_CONSTANTS.TEXT_PADDING_H * 2)
  );
  
  const height = Math.max(
    LAYOUT_CONSTANTS.MIN_NODE_HEIGHT,
    Math.ceil(textDims.height + LAYOUT_CONSTANTS.TEXT_PADDING_V * 2)
  );
  
  return { width, height };
}

/**
 * Calculate subtree height (including all visible children)
 */
function calculateSubtreeHeight(node: MindMapNode, getDims: GetNodeDimensions): number {
  if (!node.children || node.children.length === 0 || isFolded(node)) {
    const dims = getDims(node);
    return dims.height;
  }
  
  let totalHeight = 0;
  for (let i = 0; i < node.children.length; i++) {
    const childHeight = calculateSubtreeHeight(node.children[i], getDims);
    totalHeight += childHeight;
    
    if (i < node.children.length - 1) {
      totalHeight += getVgapAfterChild(node.children[i]);
    }
  }
  
  const dims = getDims(node);
  return Math.max(dims.height, totalHeight);
}

/**
 * Calculate total height for a group of children
 */
function calculateSubtreeHeightForChildren(children: MindMapNode[], getDims: GetNodeDimensions): number {
  if (children.length === 0) {
    return 0;
  }
  
  let totalHeight = 0;
  for (let i = 0; i < children.length; i++) {
    const childHeight = calculateSubtreeHeight(children[i], getDims);
    totalHeight += childHeight;
    
    if (i < children.length - 1) {
      totalHeight += getVgapAfterChild(children[i]);
    }
  }
  
  return totalHeight;
}

/**
 * Layout children recursively
 */
function layoutChildren(
  node: MindMapNode,
  parentX: number,
  parentY: number,
  side: 'left' | 'right' | 'center',
  depth: number,
  getDims: GetNodeDimensions
): LayoutNode[] {
  const result: LayoutNode[] = [];
  
  if (!node.children || node.children.length === 0 || isFolded(node)) {
    return result;
  }
  
  const nodeDims = getDims(node);
  
  // For root node (depth === 0), process left and right children separately
  if (depth === 0) {
    // Separate children by position
    const leftChildren = node.children.filter(child => child.position === 'left');
    const rightChildren = node.children.filter(child => child.position !== 'left');
    
    // Layout left children
    if (leftChildren.length > 0) {
      const leftSubtreeHeight = calculateSubtreeHeightForChildren(leftChildren, getDims);
      let currentY = parentY - leftSubtreeHeight / 2 + nodeDims.height / 2;
      
      for (const child of leftChildren) {
        const childDims = getDims(child);
        const childSubtreeHeight = calculateSubtreeHeight(child, getDims);
        
        const hgap = child.layout?.hgap !== undefined 
          ? child.layout.hgap 
          : LAYOUT_CONSTANTS.DEFAULT_HGAP;
        
        const childX = parentX - nodeDims.width / 2 - hgap - childDims.width / 2;
        const childY = currentY + childSubtreeHeight / 2 - childDims.height / 2;
        const vshift = child.layout?.vshift || 0;
        
        const layoutNode: LayoutNode = {
          ...child,
          x: childX,
          y: childY + vshift,
          width: childDims.width,
          height: childDims.height,
          depth: depth + 1,
          side: 'left',
        };
        
        result.push(layoutNode);
        
        const grandchildren = layoutChildren(
          child,
          childX,
          childY + vshift,
          'left',
          depth + 1,
          getDims
        );
        result.push(...grandchildren);
        
        currentY += childSubtreeHeight;
        currentY += getVgapAfterChild(child);
      }
    }
    
    // Layout right children
    if (rightChildren.length > 0) {
      const rightSubtreeHeight = calculateSubtreeHeightForChildren(rightChildren, getDims);
      let currentY = parentY - rightSubtreeHeight / 2 + nodeDims.height / 2;
      
      for (const child of rightChildren) {
        const childDims = getDims(child);
        const childSubtreeHeight = calculateSubtreeHeight(child, getDims);
        
        const hgap = child.layout?.hgap !== undefined 
          ? child.layout.hgap 
          : LAYOUT_CONSTANTS.DEFAULT_HGAP;
        
        const childX = parentX + nodeDims.width / 2 + hgap + childDims.width / 2;
        const childY = currentY + childSubtreeHeight / 2 - childDims.height / 2;
        const vshift = child.layout?.vshift || 0;
        
        const layoutNode: LayoutNode = {
          ...child,
          x: childX,
          y: childY + vshift,
          width: childDims.width,
          height: childDims.height,
          depth: depth + 1,
          side: 'right',
        };
        
        result.push(layoutNode);
        
        const grandchildren = layoutChildren(
          child,
          childX,
          childY + vshift,
          'right',
          depth + 1,
          getDims
        );
        result.push(...grandchildren);
        
        currentY += childSubtreeHeight;
        currentY += getVgapAfterChild(child);
      }
    }
  } else {
    // For non-root nodes, process all children together
    const subtreeHeight = calculateSubtreeHeight(node, getDims);
    let currentY = parentY - subtreeHeight / 2 + nodeDims.height / 2;
    
    for (const child of node.children) {
      const childDims = getDims(child);
      const childSubtreeHeight = calculateSubtreeHeight(child, getDims);
      
      const hgap = child.layout?.hgap !== undefined 
        ? child.layout.hgap 
        : LAYOUT_CONSTANTS.DEFAULT_HGAP;
      
      const childX = side === 'left' 
        ? parentX - nodeDims.width / 2 - hgap - childDims.width / 2
        : parentX + nodeDims.width / 2 + hgap + childDims.width / 2;
      
      const childY = currentY + childSubtreeHeight / 2 - childDims.height / 2;
      const vshift = child.layout?.vshift || 0;
      
      const layoutNode: LayoutNode = {
        ...child,
        x: childX,
        y: childY + vshift,
        width: childDims.width,
        height: childDims.height,
        depth: depth + 1,
        side: side,
      };
      
      result.push(layoutNode);
      
      const grandchildren = layoutChildren(
        child,
        childX,
        childY + vshift,
        side,
        depth + 1,
        getDims
      );
      result.push(...grandchildren);
      
      currentY += childSubtreeHeight;
      currentY += getVgapAfterChild(child);
    }
  }
  
  return result;
}

/**
 * Calculate complete layout for the mind map
 */
export function calculateLayout(root: MindMapNode, options?: CalculateLayoutOptions): LayoutNode[] {
  const getDims: GetNodeDimensions = options?.getNodeDimensions ?? ((n) => calculateNodeDimensions(n));
  const result: LayoutNode[] = [];
  
  // Layout root
  const rootDims = getDims(root);
  const rootLayout: LayoutNode = {
    ...root,
    x: LAYOUT_CONSTANTS.ROOT_X,
    y: LAYOUT_CONSTANTS.ROOT_Y,
    width: rootDims.width,
    height: rootDims.height,
    depth: 0,
    side: 'center',
  };
  
  result.push(rootLayout);
  
  // Layout all children
  if (root.children && root.children.length > 0 && !isFolded(root)) {
    const children = layoutChildren(
      root,
      LAYOUT_CONSTANTS.ROOT_X,
      LAYOUT_CONSTANTS.ROOT_Y,
      'center',
      0,
      getDims
    );
    result.push(...children);
  }
  
  return result;
}

/**
 * Get bounding box of all nodes
 */
export function getBoundingBox(nodes: LayoutNode[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (const node of nodes) {
    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    const bottom = node.y + node.height / 2;
    
    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  }
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Find edge connection points for a node
 */
export function getEdgePoints(
  sourceNode: LayoutNode,
  targetNode: LayoutNode
): {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
} {
  // Source point (right or left edge center)
  const sourceX = targetNode.x < sourceNode.x
    ? sourceNode.x - sourceNode.width / 2  // Left edge
    : sourceNode.x + sourceNode.width / 2; // Right edge
  const sourceY = sourceNode.y;
  
  // Target point (right or left edge center)
  const targetX = targetNode.x < sourceNode.x
    ? targetNode.x + targetNode.width / 2  // Right edge
    : targetNode.x - targetNode.width / 2; // Left edge
  const targetY = targetNode.y;
  
  return { sourceX, sourceY, targetX, targetY };
}
