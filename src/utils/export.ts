/**
 * Export Utilities
 * Export mind maps to various formats (PNG, SVG, PDF)
 */

import jsPDF from 'jspdf';

/**
 * Export options for mind map export
 */
export interface ExportOptions {
  /** Background color for the export (default: transparent) */
  backgroundColor?: string;
  /** Padding around the mind map (default: 20) */
  padding?: number;
  /** Scale factor for export (default: 1) */
  scale?: number;
  /** Image quality for PNG/JPEG (0-1, default: 0.95) */
  quality?: number;
}

/**
 * Export mind map to PNG format
 * 
 * @param containerElement - The htmm map container element
 * @param filename - The filename for the downloaded PNG
 * @param options - Export options
 */
export async function exportToPNG(
  containerElement: HTMLElement,
  filename: string = 'mindmap.png',
  options: ExportOptions = {}
): Promise<void> {
  const {
    backgroundColor = 'white',
    padding = 20,
    scale = 2,
    quality = 0.95,
  } = options;

  // Find the canvas element
  const canvas = containerElement.querySelector('.htmm-canvas') as HTMLElement;
  if (!canvas) {
    throw new Error('Mind map canvas not found');
  }

  // Get all node elements
  const nodeElements = Array.from(canvas.querySelectorAll('.node-view')) as HTMLElement[];
  if (nodeElements.length === 0) {
    throw new Error('No nodes found to export');
  }

  // Calculate bounding box
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  nodeElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    const left = rect.left - canvasRect.left;
    const top = rect.top - canvasRect.top;
    const right = left + rect.width;
    const bottom = top + rect.height;

    bounds.minX = Math.min(bounds.minX, left);
    bounds.minY = Math.min(bounds.minY, top);
    bounds.maxX = Math.max(bounds.maxX, right);
    bounds.maxY = Math.max(bounds.maxY, bottom);
  });

  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;

  // Create canvas
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width * scale;
  exportCanvas.height = height * scale;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set scale
  ctx.scale(scale, scale);

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw edges
  const svgElement = canvas.querySelector('.edges-layer');
  if (svgElement) {
    await drawSVGToCanvas(ctx, svgElement as SVGElement, {
      offsetX: padding - bounds.minX,
      offsetY: padding - bounds.minY,
    });
  }

  // Draw nodes
  for (const element of nodeElements) {
    const rect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    const x = rect.left - canvasRect.left - bounds.minX + padding;
    const y = rect.top - canvasRect.top - bounds.minY + padding;

    await drawElementToCanvas(ctx, element, x, y);
  }

  // Convert to blob and download
  exportCanvas.toBlob(
    (blob) => {
      if (blob) {
        downloadBlob(blob, filename);
      }
    },
    'image/png',
    quality
  );
}

/**
 * Export mind map to SVG format
 * 
 * @param containerElement - The htmm map container element
 * @param filename - The filename for the downloaded SVG
 * @param options - Export options
 */
export function exportToSVG(
  containerElement: HTMLElement,
  filename: string = 'mindmap.svg',
  options: ExportOptions = {}
): void {
  const { backgroundColor = 'white', padding = 20 } = options;

  const canvas = containerElement.querySelector('.htmm-canvas') as HTMLElement;
  if (!canvas) {
    throw new Error('Mind map canvas not found');
  }

  const nodeElements = Array.from(canvas.querySelectorAll('.node-view')) as HTMLElement[];
  if (nodeElements.length === 0) {
    throw new Error('No nodes found to export');
  }

  // Calculate bounding box
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  nodeElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    const left = rect.left - canvasRect.left;
    const top = rect.top - canvasRect.top;
    const right = left + rect.width;
    const bottom = top + rect.height;

    bounds.minX = Math.min(bounds.minX, left);
    bounds.minY = Math.min(bounds.minY, top);
    bounds.maxX = Math.max(bounds.maxX, right);
    bounds.maxY = Math.max(bounds.maxY, bottom);
  });

  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add background
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', width.toString());
  background.setAttribute('height', height.toString());
  background.setAttribute('fill', backgroundColor);
  svg.appendChild(background);

  // Copy edges
  const edgesLayer = canvas.querySelector('.edges-layer');
  if (edgesLayer) {
    const edgesClone = edgesLayer.cloneNode(true) as SVGElement;
    edgesClone.setAttribute(
      'transform',
      `translate(${padding - bounds.minX}, ${padding - bounds.minY})`
    );
    svg.appendChild(edgesClone);
  }

  // Convert nodes to SVG
  const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodesGroup.setAttribute(
    'transform',
    `translate(${padding - bounds.minX}, ${padding - bounds.minY})`
  );

  nodeElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    const x = rect.left - canvasRect.left;
    const y = rect.top - canvasRect.top;

    const nodeGroup = elementToSVG(element, x, y);
    nodesGroup.appendChild(nodeGroup);
  });

  svg.appendChild(nodesGroup);

  // Convert SVG to string and download
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  downloadBlob(blob, filename);
}

/**
 * Helper: Draw SVG element to canvas
 */
async function drawSVGToCanvas(
  ctx: CanvasRenderingContext2D,
  svgElement: SVGElement,
  offset: { offsetX: number; offsetY: number }
): Promise<void> {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, offset.offsetX, offset.offsetY);
      resolve();
    };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
  });
}

/**
 * Helper: Draw HTML element to canvas
 */
async function drawElementToCanvas(
  ctx: CanvasRenderingContext2D,
  element: HTMLElement,
  x: number,
  y: number
): Promise<void> {
  const computedStyle = window.getComputedStyle(element);
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  // Draw background
  if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'transparent') {
    ctx.fillStyle = computedStyle.backgroundColor;
    ctx.fillRect(x, y, width, height);
  }

  // Draw border
  if (computedStyle.border && computedStyle.borderWidth !== '0px') {
    ctx.strokeStyle = computedStyle.borderColor;
    ctx.lineWidth = parseFloat(computedStyle.borderWidth);
    ctx.strokeRect(x, y, width, height);
  }

  // Draw text
  const textElement = element.querySelector('.node-text');
  if (textElement) {
    const text = textElement.textContent || '';
    ctx.fillStyle = computedStyle.color;
    ctx.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 10, y + height / 2);
  }
}

/**
 * Helper: Convert HTML element to SVG
 */
function elementToSVG(element: HTMLElement, x: number, y: number): SVGGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const computedStyle = window.getComputedStyle(element);
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  // Background rectangle
  if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'transparent') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x.toString());
    rect.setAttribute('y', y.toString());
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', computedStyle.backgroundColor);
    group.appendChild(rect);
  }

  // Text
  const textElement = element.querySelector('.node-text');
  if (textElement) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (x + 10).toString());
    text.setAttribute('y', (y + height / 2).toString());
    text.setAttribute('fill', computedStyle.color);
    text.setAttribute('font-size', computedStyle.fontSize);
    text.setAttribute('font-family', computedStyle.fontFamily);
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = textElement.textContent;
    group.appendChild(text);
  }

  return group;
}

/**
 * Helper: Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export mind map to PDF format
 * 
 * @param containerElement - The htmm map container element
 * @param filename - The filename for the downloaded PDF
 * @param options - Export options
 */
export async function exportToPDF(
  containerElement: HTMLElement,
  filename: string = 'mindmap.pdf',
  options: ExportOptions = {}
): Promise<void> {
  const {
    backgroundColor = 'white',
    padding = 20,
    scale = 2,
  } = options;

  // Find the canvas element
  const canvas = containerElement.querySelector('.htmm-canvas') as HTMLElement;
  if (!canvas) {
    throw new Error('Mind map canvas not found');
  }

  // Get all node elements
  const nodeElements = Array.from(canvas.querySelectorAll('.node-view')) as HTMLElement[];
  if (nodeElements.length === 0) {
    throw new Error('No nodes found to export');
  }

  // Calculate bounding box
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  nodeElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    const left = rect.left - canvasRect.left;
    const top = rect.top - canvasRect.top;
    const right = left + rect.width;
    const bottom = top + rect.height;

    bounds.minX = Math.min(bounds.minX, left);
    bounds.minY = Math.min(bounds.minY, top);
    bounds.maxX = Math.max(bounds.maxX, right);
    bounds.maxY = Math.max(bounds.maxY, bottom);
  });

  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;

  // Create canvas for rendering
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width * scale;
  exportCanvas.height = height * scale;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set scale
  ctx.scale(scale, scale);

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw edges
  const svgElement = canvas.querySelector('.edges-layer');
  if (svgElement) {
    await drawSVGToCanvas(ctx, svgElement as SVGElement, {
      offsetX: padding - bounds.minX,
      offsetY: padding - bounds.minY,
    });
  }

  // Draw nodes
  for (const element of nodeElements) {
    const rect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    const x = rect.left - canvasRect.left - bounds.minX + padding;
    const y = rect.top - canvasRect.top - bounds.minY + padding;

    await drawElementToCanvas(ctx, element, x, y);
  }

  // Convert canvas to image data URL
  const imgData = exportCanvas.toDataURL('image/png');

  // Create PDF
  // Determine orientation based on aspect ratio
  const aspectRatio = width / height;
  const orientation = aspectRatio > 1 ? 'landscape' : 'portrait';
  
  // Create PDF with appropriate size
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
  });

  // Add image to PDF
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);

  // Save PDF
  pdf.save(filename);
}
