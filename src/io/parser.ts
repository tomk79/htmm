/**
 * FreeMind XML Parser
 * Parses .mm (FreeMind) files into MindMapData objects
 */

import type {
  MindMapData,
  MindMapNode,
  FontInfo,
  EdgeInfo,
  CloudInfo,
  IconInfo,
  ArrowLinkInfo,
  RichContentInfo,
  AttributeInfo,
  AttributeLayoutInfo,
  NodeStyle,
  EdgeStyle,
  EdgeWidth,
  ArrowType,
  RichContentType,
} from '../types/mindmap';

/**
 * Parse a FreeMind .mm file from XML string
 */
export function parseFreeMindXML(xmlString: string): MindMapData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`);
  }
  
  const mapElement = doc.querySelector('map');
  if (!mapElement) {
    throw new Error('Invalid FreeMind file: missing <map> element');
  }
  
  const version = mapElement.getAttribute('version') || '1.0.1';
  
  const rootNodeElement = mapElement.querySelector(':scope > node');
  if (!rootNodeElement) {
    throw new Error('Invalid FreeMind file: missing root <node> element');
  }
  
  const root = parseNode(rootNodeElement);
  
  return {
    version,
    root,
  };
}

/**
 * Parse a <node> element into a MindMapNode
 */
function parseNode(element: Element): MindMapNode {
  const node: MindMapNode = {
    id: element.getAttribute('ID') || `ID_${Date.now()}_${Math.random()}`,
    text: element.getAttribute('TEXT') || undefined,
    children: [],
  };
  
  // Basic attributes
  const position = element.getAttribute('POSITION');
  if (position === 'left' || position === 'right') {
    node.position = position;
  }
  
  const folded = element.getAttribute('FOLDED');
  if (folded === 'true') {
    node.folded = true;
  }
  
  node.color = element.getAttribute('COLOR') || undefined;
  node.backgroundColor = element.getAttribute('BACKGROUND_COLOR') || undefined;
  
  const style = element.getAttribute('STYLE');
  if (style && isNodeStyle(style)) {
    node.style = style;
  }
  
  node.link = element.getAttribute('LINK') || undefined;
  
  const created = element.getAttribute('CREATED');
  if (created) {
    node.created = parseInt(created, 10);
  }
  
  const modified = element.getAttribute('MODIFIED');
  if (modified) {
    node.modified = parseInt(modified, 10);
  }
  
  node.encrypted = element.getAttribute('ENCRYPTED_CONTENT') || undefined;
  
  // Layout
  const hgap = element.getAttribute('HGAP');
  const vgap = element.getAttribute('VGAP');
  const vshift = element.getAttribute('VSHIFT');
  if (hgap || vgap || vshift) {
    node.layout = {};
    if (hgap) node.layout.hgap = parseInt(hgap, 10);
    if (vgap) node.layout.vgap = parseInt(vgap, 10);
    if (vshift) node.layout.vshift = parseInt(vshift, 10);
  }
  
  // Font
  const fontElement = element.querySelector(':scope > font');
  if (fontElement) {
    node.font = parseFont(fontElement);
  }
  
  // Edge
  const edgeElement = element.querySelector(':scope > edge');
  if (edgeElement) {
    node.edge = parseEdge(edgeElement);
  }
  
  // Cloud
  const cloudElement = element.querySelector(':scope > cloud');
  if (cloudElement) {
    node.cloud = parseCloud(cloudElement);
  }
  
  // Icons
  const iconElements = element.querySelectorAll(':scope > icon');
  if (iconElements.length > 0) {
    node.icons = Array.from(iconElements).map(parseIcon);
  }
  
  // Arrow links
  const arrowLinkElements = element.querySelectorAll(':scope > arrowlink');
  if (arrowLinkElements.length > 0) {
    node.arrowLinks = Array.from(arrowLinkElements).map(parseArrowLink);
  }
  
  // Rich content
  const richContentElements = element.querySelectorAll(':scope > richcontent');
  if (richContentElements.length > 0) {
    node.richContent = Array.from(richContentElements).map(parseRichContent);
  }
  
  // Attributes
  const attributeElements = element.querySelectorAll(':scope > attribute');
  if (attributeElements.length > 0) {
    node.attributes = Array.from(attributeElements).map(parseAttribute);
  }
  
  // Attribute layout
  const attributeLayoutElement = element.querySelector(':scope > attribute_layout');
  if (attributeLayoutElement) {
    node.attributeLayout = parseAttributeLayout(attributeLayoutElement);
  }
  
  // Child nodes
  const childNodeElements = element.querySelectorAll(':scope > node');
  if (childNodeElements.length > 0) {
    node.children = Array.from(childNodeElements).map(parseNode);
  }
  
  return node;
}

/**
 * Parse <font> element
 */
function parseFont(element: Element): FontInfo {
  const font: FontInfo = {};
  
  font.name = element.getAttribute('NAME') || undefined;
  
  const size = element.getAttribute('SIZE');
  if (size) {
    font.size = parseInt(size, 10);
  }
  
  if (element.getAttribute('BOLD') === 'true') {
    font.bold = true;
  }
  
  if (element.getAttribute('ITALIC') === 'true') {
    font.italic = true;
  }
  
  if (element.getAttribute('STRIKETHROUGH') === 'true') {
    font.strikethrough = true;
  }
  
  return font;
}

/**
 * Parse <edge> element
 */
function parseEdge(element: Element): EdgeInfo {
  const edge: EdgeInfo = {};
  
  edge.color = element.getAttribute('COLOR') || undefined;
  
  const style = element.getAttribute('STYLE');
  if (style && isEdgeStyle(style)) {
    edge.style = style;
  }
  
  const width = element.getAttribute('WIDTH');
  if (width && isEdgeWidth(width)) {
    edge.width = width;
  }
  
  return edge;
}

/**
 * Parse <cloud> element
 */
function parseCloud(element: Element): CloudInfo {
  return {
    color: element.getAttribute('COLOR') || undefined,
  };
}

/**
 * Parse <icon> element
 */
function parseIcon(element: Element): IconInfo {
  return {
    builtin: element.getAttribute('BUILTIN') || '',
  };
}

/**
 * Parse <arrowlink> element
 */
function parseArrowLink(element: Element): ArrowLinkInfo {
  const destination = element.getAttribute('DESTINATION');
  if (!destination) {
    throw new Error('Arrow link missing DESTINATION attribute');
  }
  
  return {
    destination,
    color: element.getAttribute('COLOR') || undefined,
    startArrow: (element.getAttribute('STARTARROW') as ArrowType) || undefined,
    endArrow: (element.getAttribute('ENDARROW') as ArrowType) || undefined,
    startInclination: element.getAttribute('STARTINCLINATION') || undefined,
    endInclination: element.getAttribute('ENDINCLINATION') || undefined,
  };
}

/**
 * Parse <richcontent> element
 */
function parseRichContent(element: Element): RichContentInfo {
  const type = element.getAttribute('TYPE');
  if (type !== 'NODE' && type !== 'NOTE') {
    throw new Error(`Invalid richcontent TYPE: ${type}`);
  }
  
  // Get the HTML content
  const htmlElement = element.querySelector('html');
  const html = htmlElement ? htmlElement.outerHTML : '';
  
  return {
    type: type as RichContentType,
    html,
  };
}

/**
 * Parse <attribute> element
 */
function parseAttribute(element: Element): AttributeInfo {
  return {
    name: element.getAttribute('NAME') || '',
    value: element.getAttribute('VALUE') || '',
  };
}

/**
 * Parse <attribute_layout> element
 */
function parseAttributeLayout(element: Element): AttributeLayoutInfo {
  const layout: AttributeLayoutInfo = {};
  
  const nameWidth = element.getAttribute('NAME_WIDTH');
  if (nameWidth) {
    layout.nameWidth = parseInt(nameWidth, 10);
  }
  
  const valueWidth = element.getAttribute('VALUE_WIDTH');
  if (valueWidth) {
    layout.valueWidth = parseInt(valueWidth, 10);
  }
  
  return layout;
}

/**
 * Type guards
 */
function isNodeStyle(value: string): value is NodeStyle {
  return ['bubble', 'fork', 'as_parent', 'combined'].includes(value);
}

function isEdgeStyle(value: string): value is EdgeStyle {
  return ['linear', 'bezier', 'sharp_linear', 'sharp_bezier'].includes(value);
}

function isEdgeWidth(value: string): value is EdgeWidth {
  return ['parent', 'thin', '1', '2', '4', '8'].includes(value);
}

/**
 * Load .mm file from File object
 */
export async function loadMindMapFile(file: File): Promise<MindMapData> {
  const text = await file.text();
  return parseFreeMindXML(text);
}

/**
 * Load .mm file from URL
 */
export async function loadMindMapURL(url: string): Promise<MindMapData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load mind map: ${response.statusText}`);
  }
  const text = await response.text();
  return parseFreeMindXML(text);
}
