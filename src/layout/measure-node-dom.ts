/**
 * Measure node dimensions using actual DOM layout (matches .node-text CSS).
 * Use a hidden div with the same styles to get real rendered height/width.
 */

import type { MindMapNode } from '../types/mindmap';
import { LAYOUT_CONSTANTS, calculateNodeDimensions } from './layout-engine';

/** Single reusable measurement div; created on first use when container is provided. */
function getOrCreateMeasureDiv(container: HTMLElement): HTMLDivElement {
  let div = container.querySelector('.htmm-measure-node') as HTMLDivElement | null;
  if (!div) {
    div = document.createElement('div');
    div.className = 'htmm-measure-node';
    div.setAttribute('aria-hidden', 'true');
    container.appendChild(div);
  }
  return div;
}

/**
 * Measure node dimensions via DOM. Uses the same styles as .node-text so
 * the result matches the actual rendered size. Falls back to
 * calculateNodeDimensions when container is null or node has rich content.
 */
export function measureNodeWithDom(
  node: MindMapNode,
  measureContainer: HTMLElement | null
): { width: number; height: number } {
  if (!measureContainer || typeof document === 'undefined') {
    return calculateNodeDimensions(node);
  }

  const hasRichContent = node.richContent?.some((rc) => rc.type === 'NODE' && rc.html);
  if (hasRichContent) {
    return calculateNodeDimensions(node);
  }

  const div = getOrCreateMeasureDiv(measureContainer);
  const fontSize = node.font?.size ?? 12;
  const fontFamily = node.font?.name ?? 'Arial, Helvetica, sans-serif';

  Object.assign(div.style, {
    position: 'absolute',
    left: '-9999px',
    visibility: 'hidden',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    maxWidth: `${LAYOUT_CONSTANTS.MAX_NODE_TEXT_WIDTH}px`,
    padding: '0',
    margin: '0',
    border: 'none',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: '1.4',
    fontSize: `${fontSize}px`,
    fontFamily,
    fontWeight: node.font?.bold ? 'bold' : 'normal',
    fontStyle: node.font?.italic ? 'italic' : 'normal',
    textDecoration: node.font?.strikethrough ? 'line-through' : 'none',
  });

  div.textContent = node.text ?? '';

  // Force reflow so getBoundingClientRect returns up-to-date layout (avoids stale/cached values)
  void div.offsetHeight;
  const rect = div.getBoundingClientRect();
  const textWidth = Math.min(rect.width, LAYOUT_CONSTANTS.MAX_NODE_TEXT_WIDTH);
  // Use max of rect.height and scrollHeight so multi-line content is not under-measured (avoids upward shift)
  const textHeight = Math.max(rect.height, div.scrollHeight);

  let iconWidth = 0;
  if (node.icons && node.icons.length > 0) {
    iconWidth =
      node.icons.length * (LAYOUT_CONSTANTS.ICON_SIZE + LAYOUT_CONSTANTS.ICON_PADDING);
  }

  // Round to integers so layout math is consistent with CSS pixel positioning
  const width = Math.max(
    LAYOUT_CONSTANTS.MIN_NODE_WIDTH,
    Math.ceil(textWidth + iconWidth + LAYOUT_CONSTANTS.TEXT_PADDING_H * 2)
  );
  const height = Math.max(
    LAYOUT_CONSTANTS.MIN_NODE_HEIGHT,
    Math.ceil(textHeight + LAYOUT_CONSTANTS.TEXT_PADDING_V * 2)
  );

  return { width, height };
}
