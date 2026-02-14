/**
 * EdgeView Component
 * Renders connections between nodes using SVG paths
 */

import React from 'react';
import type { EdgeStyle, LayoutNode } from '../types/mindmap';
import { getEdgePoints } from '../layout/layout-engine';

interface EdgeViewProps {
  source: LayoutNode;
  target: LayoutNode;
  color?: string;
  style?: EdgeStyle;
  width?: number;
}

export const EdgeView: React.FC<EdgeViewProps> = React.memo(({
  source,
  target,
  color = '#999',
  style = 'bezier',
  width = 1,
}) => {
  const { sourceX, sourceY, targetX, targetY } = getEdgePoints(source, target);
  
  // Generate path based on style
  const pathData = generatePath(sourceX, sourceY, targetX, targetY, style);
  
  return (
    <path
      d={pathData}
      stroke={color}
      strokeWidth={width}
      fill="none"
      className="edge-view"
    />
  );
});

/**
 * Generate SVG path data based on edge style
 */
function generatePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: EdgeStyle
): string {
  switch (style) {
    case 'linear':
      return generateLinearPath(x1, y1, x2, y2);
    
    case 'bezier':
      return generateBezierPath(x1, y1, x2, y2);
    
    case 'sharp_linear':
      return generateSharpLinearPath(x1, y1, x2, y2);
    
    case 'sharp_bezier':
      return generateSharpBezierPath(x1, y1, x2, y2);
    
    default:
      return generateBezierPath(x1, y1, x2, y2);
  }
}

/**
 * Linear path (straight line)
 */
function generateLinearPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/**
 * Bezier curve path (smooth curve)
 */
function generateBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  
  // Control point offset (proportional to distance)
  const cpOffset = Math.abs(dx) * 0.5;
  
  // Control points for cubic Bezier curve
  const cp1x = x1 + (dx > 0 ? cpOffset : -cpOffset);
  const cp1y = y1;
  const cp2x = x2 - (dx > 0 ? cpOffset : -cpOffset);
  const cp2y = y2;
  
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Sharp linear path (right angle)
 */
function generateSharpLinearPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
}

/**
 * Sharp bezier path (right angle with curves)
 */
function generateSharpBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  const radius = 10;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Determine direction
  const horizontal = dx > 0 ? 1 : -1;
  const vertical = dy > 0 ? 1 : -1;
  
  // Path with rounded corners
  return `
    M ${x1} ${y1}
    L ${midX - radius * horizontal} ${y1}
    Q ${midX} ${y1}, ${midX} ${y1 + radius * vertical}
    L ${midX} ${y2 - radius * vertical}
    Q ${midX} ${y2}, ${midX + radius * horizontal} ${y2}
    L ${x2} ${y2}
  `.replace(/\s+/g, ' ').trim();
}
