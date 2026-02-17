/**
 * htmm - Type Definitions
 * Based on FreeMind XML Schema (freemind.xsd)
 */

export type NodePosition = 'left' | 'right';
export type NodeStyle = 'bubble' | 'fork' | 'as_parent' | 'combined';
export type EdgeStyle = 'linear' | 'bezier' | 'sharp_linear' | 'sharp_bezier';
export type EdgeWidth = 'parent' | 'thin' | '1' | '2' | '4' | '8';
export type ArrowType = 'None' | 'Default' | 'Forward' | 'Back' | 'Both';
export type RichContentType = 'NODE' | 'NOTE';

/**
 * Font styling information
 */
export interface FontInfo {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underlined?: boolean;
}

/**
 * Edge styling information
 */
export interface EdgeInfo {
  color?: string;
  style?: EdgeStyle;
  width?: EdgeWidth;
}

/**
 * Cloud (enclosure) styling information
 */
export interface CloudInfo {
  color?: string;
}

/**
 * Icon information
 */
export interface IconInfo {
  builtin: string; // Icon identifier (e.g., 'idea', 'help', 'yes', 'no')
}

/**
 * Arrow link between nodes
 */
export interface ArrowLinkInfo {
  destination: string; // Target node ID
  color?: string;
  startArrow?: ArrowType;
  endArrow?: ArrowType;
  startInclination?: string; // Format: "x;y;"
  endInclination?: string;   // Format: "x;y;"
}

/**
 * Rich content (HTML) information
 */
export interface RichContentInfo {
  type: RichContentType;
  html: string;
}

/**
 * Custom attribute
 */
export interface AttributeInfo {
  name: string;
  value: string;
}

/**
 * Attribute layout settings
 */
export interface AttributeLayoutInfo {
  nameWidth?: number;
  valueWidth?: number;
}

/**
 * Layout adjustments
 */
export interface LayoutInfo {
  hgap?: number;  // Horizontal gap from parent
  vgap?: number;  // Vertical gap between siblings
  vshift?: number; // Vertical shift from standard position
}

/**
 * Mind map node data structure
 */
export interface MindMapNode {
  id: string;
  text?: string;
  position?: NodePosition; // Only for root's children
  folded?: boolean;
  color?: string; // Text color (#RRGGBB)
  backgroundColor?: string; // Background color (#RRGGBB)
  style?: NodeStyle;
  link?: string; // URL or file path
  created?: number; // Timestamp
  modified?: number; // Timestamp
  encrypted?: string; // Encrypted content
  
  // Styling
  font?: FontInfo;
  edge?: EdgeInfo;
  cloud?: CloudInfo;
  
  // Layout
  layout?: LayoutInfo;
  
  // Collections
  icons?: IconInfo[];
  arrowLinks?: ArrowLinkInfo[];
  richContent?: RichContentInfo[];
  attributes?: AttributeInfo[];
  attributeLayout?: AttributeLayoutInfo;
  
  // Hierarchy
  children?: MindMapNode[];
}

/**
 * Mind map document structure
 */
export interface MindMapData {
  version: string; // FreeMind version (e.g., "1.0.1")
  root: MindMapNode;
}

/**
 * Node with computed layout information (for rendering)
 */
export interface LayoutNode extends MindMapNode {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number; // Distance from root
  side: 'left' | 'right' | 'center'; // Which side of root
}

/**
 * Edge rendering information
 */
export interface EdgeRenderInfo {
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
  style: EdgeStyle;
  width: number;
}