/**
 * ArrowLinkView Component
 * Renders arrow links between nodes using SVG paths with arrow markers
 */

import React from 'react';
import type { ArrowLinkInfo, ArrowType, LayoutNode } from '../types/mindmap';

interface ArrowLinkViewProps {
  sourceNode: LayoutNode;
  targetNode: LayoutNode;
  arrowLink: ArrowLinkInfo;
}

export const ArrowLinkView: React.FC<ArrowLinkViewProps> = React.memo(({
  sourceNode,
  targetNode,
  arrowLink,
}) => {
  const color = arrowLink.color || '#ff0000';
  const strokeWidth = 2;
  
  // Calculate source and target positions
  const { x: sx, y: sy } = calculateSourcePosition(sourceNode, arrowLink.startInclination);
  const { x: tx, y: ty } = calculateTargetPosition(targetNode, arrowLink.endInclination);
  
  // Generate unique IDs for markers
  const startMarkerId = `arrow-start-${sourceNode.id}-${targetNode.id}`;
  const endMarkerId = `arrow-end-${sourceNode.id}-${targetNode.id}`;
  
  // Generate path
  const pathData = generateArrowPath(sx, sy, tx, ty, arrowLink.startInclination, arrowLink.endInclination);
  
  return (
    <g className="arrow-link-view">
      {/* Define arrow markers */}
      <defs>
        {arrowLink.startArrow && arrowLink.startArrow !== 'None' && (
          <marker
            id={startMarkerId}
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            {renderArrowMarker(arrowLink.startArrow, color)}
          </marker>
        )}
        {arrowLink.endArrow && arrowLink.endArrow !== 'None' && (
          <marker
            id={endMarkerId}
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {renderArrowMarker(arrowLink.endArrow, color)}
          </marker>
        )}
      </defs>
      
      {/* Arrow path */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        markerStart={arrowLink.startArrow && arrowLink.startArrow !== 'None' ? `url(#${startMarkerId})` : undefined}
        markerEnd={arrowLink.endArrow && arrowLink.endArrow !== 'None' ? `url(#${endMarkerId})` : undefined}
        className="arrow-link-path"
        style={{ pointerEvents: 'stroke' }}
      />
    </g>
  );
});

/**
 * Calculate source position with optional inclination
 */
function calculateSourcePosition(node: LayoutNode, inclination?: string): { x: number; y: number } {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  
  if (inclination) {
    const [dx, dy] = parseInclination(inclination);
    return { x: centerX + dx, y: centerY + dy };
  }
  
  return { x: centerX, y: centerY };
}

/**
 * Calculate target position with optional inclination
 */
function calculateTargetPosition(node: LayoutNode, inclination?: string): { x: number; y: number } {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  
  if (inclination) {
    const [dx, dy] = parseInclination(inclination);
    return { x: centerX + dx, y: centerY + dy };
  }
  
  return { x: centerX, y: centerY };
}

/**
 * Parse inclination string format "x;y;"
 */
function parseInclination(inclination: string): [number, number] {
  const parts = inclination.split(';').filter(p => p.trim() !== '');
  const x = parts.length > 0 ? parseFloat(parts[0]) : 0;
  const y = parts.length > 1 ? parseFloat(parts[1]) : 0;
  return [x, y];
}

/**
 * Generate SVG path for arrow link with smooth curve
 */
function generateArrowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  startInclination?: string,
  endInclination?: string
): string {
  // Use cubic Bezier curve for smooth arrows
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Control points based on inclination or automatic calculation
  let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
  
  if (startInclination) {
    const [sdx, sdy] = parseInclination(startInclination);
    cp1x = x1 + sdx * 2;
    cp1y = y1 + sdy * 2;
  } else {
    // Default control point: 1/3 of the way
    cp1x = x1 + dx * 0.33;
    cp1y = y1 + dy * 0.33;
  }
  
  if (endInclination) {
    const [edx, edy] = parseInclination(endInclination);
    cp2x = x2 - edx * 2;
    cp2y = y2 - edy * 2;
  } else {
    // Default control point: 2/3 of the way
    cp2x = x1 + dx * 0.67;
    cp2y = y1 + dy * 0.67;
  }
  
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Render arrow marker based on type
 */
function renderArrowMarker(arrowType: ArrowType, color: string): React.ReactNode {
  switch (arrowType) {
    case 'Default':
      // Standard triangle arrow
      return (
        <polygon
          points="0,0 10,5 0,10"
          fill={color}
        />
      );
    
    case 'Forward':
      // Forward arrow (same as default)
      return (
        <polygon
          points="0,0 10,5 0,10"
          fill={color}
        />
      );
    
    case 'Back':
      // Backward arrow
      return (
        <polygon
          points="10,0 0,5 10,10"
          fill={color}
        />
      );
    
    case 'None':
      return null;
    
    default:
      // Fallback to default arrow
      return (
        <polygon
          points="0,0 10,5 0,10"
          fill={color}
        />
      );
  }
}
