/**
 * Mind map XML Generator
 * Generates .mm (FreeMind-compatible) files from MindMapData objects
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
} from '../types/mindmap';

/**
 * Generate .mm mind map XML string from MindMapData
 */
export function generateMindMapXML(data: MindMapData): string {
  const doc = document.implementation.createDocument('', '', null);
  
  const mapElement = doc.createElement('map');
  mapElement.setAttribute('version', data.version);
  
  const rootNodeElement = generateNodeElement(doc, data.root);
  mapElement.appendChild(rootNodeElement);
  
  doc.appendChild(mapElement);
  
  const serializer = new XMLSerializer();
  let xmlString = serializer.serializeToString(doc);
  
  // Add XML declaration
  xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
  
  return xmlString;
}

/**
 * Generate <node> element from MindMapNode
 */
function generateNodeElement(doc: Document, node: MindMapNode): Element {
  const element = doc.createElement('node');
  
  // Required ID
  element.setAttribute('ID', node.id);
  
  // TEXT attribute
  if (node.text !== undefined && node.text !== null) {
    element.setAttribute('TEXT', node.text);
  }
  
  // Optional attributes
  if (node.position) {
    element.setAttribute('POSITION', node.position);
  }
  
  if (node.folded === true) {
    element.setAttribute('FOLDED', 'true');
  }
  
  if (node.color) {
    element.setAttribute('COLOR', node.color);
  }
  
  if (node.backgroundColor) {
    element.setAttribute('BACKGROUND_COLOR', node.backgroundColor);
  }
  
  if (node.style) {
    element.setAttribute('STYLE', node.style);
  }
  
  if (node.link) {
    element.setAttribute('LINK', node.link);
  }
  
  if (node.created !== undefined) {
    element.setAttribute('CREATED', node.created.toString());
  }
  
  if (node.modified !== undefined) {
    element.setAttribute('MODIFIED', node.modified.toString());
  }
  
  if (node.encrypted) {
    element.setAttribute('ENCRYPTED_CONTENT', node.encrypted);
  }
  
  // Layout attributes
  if (node.layout) {
    if (node.layout.hgap !== undefined) {
      element.setAttribute('HGAP', node.layout.hgap.toString());
    }
    if (node.layout.vgap !== undefined) {
      element.setAttribute('VGAP', node.layout.vgap.toString());
    }
    if (node.layout.vshift !== undefined) {
      element.setAttribute('VSHIFT', node.layout.vshift.toString());
    }
  }
  
  // Font element
  if (node.font) {
    const fontElement = generateFontElement(doc, node.font);
    element.appendChild(fontElement);
  }
  
  // Edge element
  if (node.edge) {
    const edgeElement = generateEdgeElement(doc, node.edge);
    element.appendChild(edgeElement);
  }
  
  // Cloud element
  if (node.cloud) {
    const cloudElement = generateCloudElement(doc, node.cloud);
    element.appendChild(cloudElement);
  }
  
  // Icon elements
  if (node.icons && node.icons.length > 0) {
    for (const icon of node.icons) {
      const iconElement = generateIconElement(doc, icon);
      element.appendChild(iconElement);
    }
  }
  
  // Arrow link elements
  if (node.arrowLinks && node.arrowLinks.length > 0) {
    for (const arrowLink of node.arrowLinks) {
      const arrowLinkElement = generateArrowLinkElement(doc, arrowLink);
      element.appendChild(arrowLinkElement);
    }
  }
  
  // Rich content elements
  if (node.richContent && node.richContent.length > 0) {
    for (const richContent of node.richContent) {
      const richContentElement = generateRichContentElement(doc, richContent);
      element.appendChild(richContentElement);
    }
  }
  
  // Attribute elements
  if (node.attributes && node.attributes.length > 0) {
    for (const attribute of node.attributes) {
      const attributeElement = generateAttributeElement(doc, attribute);
      element.appendChild(attributeElement);
    }
  }
  
  // Attribute layout element
  if (node.attributeLayout) {
    const attributeLayoutElement = generateAttributeLayoutElement(doc, node.attributeLayout);
    element.appendChild(attributeLayoutElement);
  }
  
  // Child nodes
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const childElement = generateNodeElement(doc, child);
      element.appendChild(childElement);
    }
  }
  
  return element;
}

/**
 * Generate <font> element
 */
function generateFontElement(doc: Document, font: FontInfo): Element {
  const element = doc.createElement('font');
  
  if (font.name) {
    element.setAttribute('NAME', font.name);
  }
  
  if (font.size !== undefined) {
    element.setAttribute('SIZE', font.size.toString());
  }
  
  if (font.bold === true) {
    element.setAttribute('BOLD', 'true');
  }
  
  if (font.italic === true) {
    element.setAttribute('ITALIC', 'true');
  }
  
  if (font.strikethrough === true) {
    element.setAttribute('STRIKETHROUGH', 'true');
  }
  
  return element;
}

/**
 * Generate <edge> element
 */
function generateEdgeElement(doc: Document, edge: EdgeInfo): Element {
  const element = doc.createElement('edge');
  
  if (edge.color) {
    element.setAttribute('COLOR', edge.color);
  }
  
  if (edge.style) {
    element.setAttribute('STYLE', edge.style);
  }
  
  if (edge.width) {
    element.setAttribute('WIDTH', edge.width);
  }
  
  return element;
}

/**
 * Generate <cloud> element
 */
function generateCloudElement(doc: Document, cloud: CloudInfo): Element {
  const element = doc.createElement('cloud');
  
  if (cloud.color) {
    element.setAttribute('COLOR', cloud.color);
  }
  
  return element;
}

/**
 * Generate <icon> element
 */
function generateIconElement(doc: Document, icon: IconInfo): Element {
  const element = doc.createElement('icon');
  element.setAttribute('BUILTIN', icon.builtin);
  return element;
}

/**
 * Generate <arrowlink> element
 */
function generateArrowLinkElement(doc: Document, arrowLink: ArrowLinkInfo): Element {
  const element = doc.createElement('arrowlink');
  
  element.setAttribute('DESTINATION', arrowLink.destination);
  
  if (arrowLink.color) {
    element.setAttribute('COLOR', arrowLink.color);
  }
  
  if (arrowLink.startArrow) {
    element.setAttribute('STARTARROW', arrowLink.startArrow);
  }
  
  if (arrowLink.endArrow) {
    element.setAttribute('ENDARROW', arrowLink.endArrow);
  }
  
  if (arrowLink.startInclination) {
    element.setAttribute('STARTINCLINATION', arrowLink.startInclination);
  }
  
  if (arrowLink.endInclination) {
    element.setAttribute('ENDINCLINATION', arrowLink.endInclination);
  }
  
  return element;
}

/**
 * Generate <richcontent> element
 */
function generateRichContentElement(doc: Document, richContent: RichContentInfo): Element {
  const element = doc.createElement('richcontent');
  element.setAttribute('TYPE', richContent.type);
  
  // Parse and append the HTML content
  if (richContent.html) {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(richContent.html, 'text/html');
    const htmlElement = doc.importNode(htmlDoc.documentElement, true);
    element.appendChild(htmlElement);
  }
  
  return element;
}

/**
 * Generate <attribute> element
 */
function generateAttributeElement(doc: Document, attribute: AttributeInfo): Element {
  const element = doc.createElement('attribute');
  element.setAttribute('NAME', attribute.name);
  element.setAttribute('VALUE', attribute.value);
  return element;
}

/**
 * Generate <attribute_layout> element
 */
function generateAttributeLayoutElement(doc: Document, layout: AttributeLayoutInfo): Element {
  const element = doc.createElement('attribute_layout');
  
  if (layout.nameWidth !== undefined) {
    element.setAttribute('NAME_WIDTH', layout.nameWidth.toString());
  }
  
  if (layout.valueWidth !== undefined) {
    element.setAttribute('VALUE_WIDTH', layout.valueWidth.toString());
  }
  
  return element;
}

/**
 * Save MindMapData as .mm file (download)
 */
export function saveMindMapFile(data: MindMapData, filename: string = 'mindmap.mm'): void {
  const xmlString = generateMindMapXML(data);
  const blob = new Blob([xmlString], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Get XML string as Blob
 */
export function getMindMapBlob(data: MindMapData): Blob {
  const xmlString = generateMindMapXML(data);
  return new Blob([xmlString], { type: 'application/xml' });
}
