/**
 * HTML Sanitization Utilities
 * Uses DOMPurify to prevent XSS attacks in rich content
 */

import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

/**
 * Default DOMPurify configuration for mind map content
 */
const DEFAULT_CONFIG: Config = {
  // Allow common HTML tags used in rich text
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del', 'ins',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'code', 'pre',
    'div', 'span',
  ],
  
  // Allow specific attributes
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'id', 'style',
  ],
  
  // Allow styling
  ALLOW_DATA_ATTR: false,
  
  // Additional security
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  
  // Sanitize style attributes
  SANITIZE_NAMED_PROPS: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param html - The HTML string to sanitize
 * @param config - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * ```ts
 * const userInput = '<script>alert("XSS")</script><p>Hello</p>';
 * const safeHtml = sanitizeHtml(userInput);
 * // Returns: '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(html: string, config?: Config): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return DOMPurify.sanitize(html, finalConfig) as string;
}

/**
 * Sanitize HTML for rich content display in mind map nodes
 * More permissive than default, allows formatting and structure
 * 
 * @param html - The rich content HTML to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeRichContent(html: string): string {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del', 'ins',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'code', 'pre',
      'div', 'span', 'font',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id', 'style',
      'color', 'size', 'face', // For <font> tag
    ],
  });
}

/**
 * Sanitize plain text input
 * Strips all HTML tags and only returns text content
 * 
 * @param text - The text to sanitize
 * @returns Plain text with all HTML removed
 */
export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize a URL to ensure it's safe
 * Only allows http, https, mailto, and relative URLs
 * 
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  
  // Allow relative URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }
  
  // Check for safe protocols
  const safeProtocols = ['http:', 'https:', 'mailto:'];
  try {
    const urlObj = new URL(trimmed);
    if (safeProtocols.includes(urlObj.protocol)) {
      return trimmed;
    }
  } catch {
    // Invalid URL
    return '';
  }
  
  // Unsafe or invalid
  return '';
}

/**
 * Check if HTML content contains potentially dangerous elements
 * 
 * @param html - The HTML to check
 * @returns True if content appears safe, false otherwise
 */
export function isHtmlSafe(html: string): boolean {
  const sanitized = sanitizeHtml(html);
  // If sanitization changed the content significantly, it was unsafe
  return sanitized.length > 0 && sanitized.length >= html.length * 0.8;
}

/**
 * Create a safe HTML config for a specific use case
 * 
 * @param allowedTags - Array of allowed HTML tags
 * @param allowedAttrs - Array of allowed attributes
 * @returns DOMPurify configuration object
 */
export function createSafeConfig(
  allowedTags: string[],
  allowedAttrs: string[] = []
): Config {
  return {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  };
}
