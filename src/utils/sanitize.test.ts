import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeRichContent,
  sanitizePlainText,
  sanitizeUrl,
  isHtmlSafe,
  createSafeConfig,
} from './sanitize';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("XSS")</script><p>Content</p>';
      const safe = sanitizeHtml(malicious);
      
      expect(safe).not.toContain('<script');
      expect(safe).toContain('<p>Content</p>');
    });

    it('should remove event handlers', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')" />';
      const safe = sanitizeHtml(malicious);
      
      expect(safe).not.toContain('onerror');
      expect(safe).toContain('<img');
    });

    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const safe = sanitizeHtml(input);
      
      expect(safe).toBe('<p>Hello <strong>world</strong></p>');
    });

    it('should remove dangerous tags', () => {
      const malicious = '<iframe src="evil.com"></iframe><p>Content</p>';
      const safe = sanitizeHtml(malicious);
      
      expect(safe).not.toContain('iframe');
      expect(safe).toContain('<p>Content</p>');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should preserve links with safe attributes', () => {
      const input = '<a href="https://example.com" title="Link">Click</a>';
      const safe = sanitizeHtml(input);
      
      expect(safe).toContain('<a');
      expect(safe).toContain('href="https://example.com"');
      expect(safe).toContain('title="Link"');
    });

    it('should remove javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const safe = sanitizeHtml(malicious);
      
      expect(safe).not.toContain('javascript:');
    });
  });

  describe('sanitizeRichContent', () => {
    it('should allow rich text formatting', () => {
      const richText = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;
      const safe = sanitizeRichContent(richText);
      
      expect(safe).toContain('<h1>');
      expect(safe).toContain('<strong>');
      expect(safe).toContain('<em>');
      expect(safe).toContain('<ul>');
      expect(safe).toContain('<li>');
    });

    it('should allow tables', () => {
      const table = `
        <table>
          <tr>
            <th>Header</th>
          </tr>
          <tr>
            <td>Data</td>
          </tr>
        </table>
      `;
      const safe = sanitizeRichContent(table);
      
      expect(safe).toContain('<table>');
      expect(safe).toContain('<th>');
      expect(safe).toContain('<td>');
    });

    it('should still remove scripts', () => {
      const malicious = '<p>Safe</p><script>alert("XSS")</script>';
      const safe = sanitizeRichContent(malicious);
      
      expect(safe).not.toContain('<script');
      expect(safe).toContain('<p>Safe</p>');
    });
  });

  describe('sanitizePlainText', () => {
    it('should strip all HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const plain = sanitizePlainText(html);
      
      expect(plain).not.toContain('<');
      expect(plain).not.toContain('>');
      expect(plain).toContain('Hello');
      expect(plain).toContain('world');
    });

    it('should handle script tags safely', () => {
      const malicious = '<script>alert("XSS")</script>Text';
      const plain = sanitizePlainText(malicious);
      
      expect(plain).not.toContain('<script');
      expect(plain).toContain('Text');
    });

    it('should preserve text content only', () => {
      const input = '<div><p>Line 1</p><p>Line 2</p></div>';
      const plain = sanitizePlainText(input);
      
      expect(plain).toContain('Line 1');
      expect(plain).toContain('Line 2');
      expect(plain).not.toContain('<div');
      expect(plain).not.toContain('<p>');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow https URLs', () => {
      const url = 'https://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should allow http URLs', () => {
      const url = 'http://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should allow mailto URLs', () => {
      const url = 'mailto:test@example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(sanitizeUrl('./relative')).toBe('./relative');
      expect(sanitizeUrl('../parent')).toBe('../parent');
    });

    it('should block javascript URLs', () => {
      const malicious = 'javascript:alert("XSS")';
      expect(sanitizeUrl(malicious)).toBe('');
    });

    it('should block data URLs', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      expect(sanitizeUrl(malicious)).toBe('');
    });

    it('should handle empty input', () => {
      expect(sanitizeUrl('')).toBe('');
    });

    it('should trim whitespace', () => {
      const url = '  https://example.com  ';
      expect(sanitizeUrl(url)).toBe('https://example.com');
    });
  });

  describe('isHtmlSafe', () => {
    it('should return true for safe content', () => {
      const safe = '<p>Hello <strong>world</strong></p>';
      expect(isHtmlSafe(safe)).toBe(true);
    });

    it('should return false for malicious content', () => {
      const malicious = '<script>alert("XSS")</script>';
      expect(isHtmlSafe(malicious)).toBe(false);
    });

    it('should return false when dangerous attributes are removed', () => {
      const input = '<p onclick="void(0)">Text</p>';
      // onclick will be removed, which significantly changes content
      expect(isHtmlSafe(input)).toBe(false);
    });
  });

  describe('createSafeConfig', () => {
    it('should create custom config with specified tags', () => {
      const config = createSafeConfig(['p', 'strong'], ['class']);
      
      expect(config.ALLOWED_TAGS).toEqual(['p', 'strong']);
      expect(config.ALLOWED_ATTR).toEqual(['class']);
    });

    it('should always forbid dangerous tags', () => {
      const config = createSafeConfig(['p']);
      
      expect(config.FORBID_TAGS).toContain('script');
      expect(config.FORBID_TAGS).toContain('iframe');
    });

    it('should always forbid dangerous attributes', () => {
      const config = createSafeConfig(['p'], ['href']);
      
      expect(config.FORBID_ATTR).toContain('onclick');
      expect(config.FORBID_ATTR).toContain('onerror');
    });
  });

  describe('Real-world attack vectors', () => {
    it('should prevent XSS via img tag', () => {
      const attack = '<img src=x onerror="alert(1)">';
      const safe = sanitizeHtml(attack);
      
      expect(safe).not.toContain('onerror');
      expect(safe).not.toContain('alert');
    });

    it('should prevent XSS via SVG', () => {
      const attack = '<svg onload="alert(1)">';
      const safe = sanitizeHtml(attack);
      
      expect(safe).not.toContain('onload');
    });

    it('should handle XSS via style attribute', () => {
      const attack = '<p style="background:url(javascript:alert(1))">Text</p>';
      const safe = sanitizeHtml(attack);
      
      // DOMPurify may strip the whole style attribute or the dangerous part
      // Either way, the text content should remain
      expect(safe).toContain('Text');
      expect(safe).toContain('<p');
    });

    it('should handle multiple attack vectors', () => {
      const complexAttack = `
        <script>alert(1)</script>
        <img src=x onerror="alert(2)">
        <iframe src="evil.com"></iframe>
        <p>Safe content</p>
        <a href="javascript:alert(3)">Link</a>
      `;
      const safe = sanitizeHtml(complexAttack);
      
      expect(safe).not.toContain('<script');
      expect(safe).not.toContain('onerror');
      expect(safe).not.toContain('<iframe');
      expect(safe).not.toContain('javascript:');
      expect(safe).toContain('Safe content');
    });
  });
});
