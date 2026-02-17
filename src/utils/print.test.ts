/**
 * Tests for print utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  printMap,
  enterPrintPreview,
  exitPrintPreview,
  supportsPrint,
  estimatePageCount,
} from './print';

describe('Print utilities', () => {
  beforeEach(() => {
    // Mock window.print
    window.print = vi.fn();
    
    // Create a mock mind map element
    const mapElement = document.createElement('div');
    mapElement.className = 'htmm-map';
    document.body.appendChild(mapElement);
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('printMap', () => {
    it('calls window.print when showDialog is true', () => {
      printMap({ showDialog: true });
      
      expect(window.print).toHaveBeenCalled();
    });

    it('does not call window.print when showDialog is false', () => {
      printMap({ showDialog: false });
      
      expect(window.print).not.toHaveBeenCalled();
    });

    it('sets document title', () => {
      const originalTitle = document.title;
      
      printMap({ title: 'Test Map', showDialog: false });
      
      expect(document.title).toBe('Test Map');
      
      // Trigger afterprint event to restore
      window.dispatchEvent(new Event('afterprint'));
      
      expect(document.title).toBe(originalTitle);
    });

    it('applies scale transformation', () => {
      printMap({ scale: 0.8, showDialog: false });
      
      const mapElement = document.querySelector('.htmm-map') as HTMLElement;
      expect(mapElement.style.transform).toContain('scale(0.8)');
      
      // Cleanup
      window.dispatchEvent(new Event('afterprint'));
    });

    it('adds custom CSS', () => {
      const customCSS = '.test { color: red; }';
      
      printMap({ customCSS, showDialog: false });
      
      const styleElements = document.head.querySelectorAll('style');
      const hasCustomCSS = Array.from(styleElements).some(
        style => style.textContent?.includes('.test')
      );
      
      expect(hasCustomCSS).toBe(true);
      
      // Cleanup
      window.dispatchEvent(new Event('afterprint'));
    });

    it('adds page size CSS', () => {
      printMap({ paperSize: 'A4', orientation: 'landscape', showDialog: false });
      
      const styleElements = document.head.querySelectorAll('style');
      const hasPageSize = Array.from(styleElements).some(
        style => style.textContent?.includes('size: A4 landscape')
      );
      
      expect(hasPageSize).toBe(true);
      
      // Cleanup
      window.dispatchEvent(new Event('afterprint'));
    });

    it('cleans up after print', () => {
      const mapElement = document.querySelector('.htmm-map') as HTMLElement;
      const originalTransform = mapElement.style.transform;
      
      printMap({ scale: 1.5, showDialog: false });
      
      expect(mapElement.style.transform).toContain('scale(1.5)');
      
      // Trigger afterprint
      window.dispatchEvent(new Event('afterprint'));
      
      expect(mapElement.style.transform).toBe(originalTransform);
    });
  });

  describe('enterPrintPreview', () => {
    it('adds print-preview class to body', () => {
      enterPrintPreview();
      
      expect(document.body.classList.contains('print-preview')).toBe(true);
    });
  });

  describe('exitPrintPreview', () => {
    it('removes print-preview class from body', () => {
      document.body.classList.add('print-preview');
      
      exitPrintPreview();
      
      expect(document.body.classList.contains('print-preview')).toBe(false);
    });
  });

  describe('supportsPrint', () => {
    it('returns true when window.print exists', () => {
      expect(supportsPrint()).toBe(true);
    });

    it('returns false when window.print does not exist', () => {
      const originalPrint = window.print;
      // @ts-expect-error - Testing undefined case
      delete window.print;
      
      expect(supportsPrint()).toBe(false);
      
      // Restore
      window.print = originalPrint;
    });
  });

  describe('estimatePageCount', () => {
    it('returns 1 for small maps', () => {
      const mapElement = document.querySelector('.htmm-map') as HTMLElement;
      
      // Mock getBoundingClientRect
      vi.spyOn(mapElement, 'getBoundingClientRect').mockReturnValue({
        width: 500,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 500,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      
      expect(estimatePageCount('A4')).toBe(1);
    });

    it('returns multiple pages for large maps', () => {
      const mapElement = document.querySelector('.htmm-map') as HTMLElement;
      
      // Mock a large map
      vi.spyOn(mapElement, 'getBoundingClientRect').mockReturnValue({
        width: 2500,
        height: 2000,
        top: 0,
        left: 0,
        bottom: 2000,
        right: 2500,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      
      const pageCount = estimatePageCount('A4');
      expect(pageCount).toBeGreaterThan(1);
    });

    it('returns 1 when no map element exists', () => {
      document.body.innerHTML = '';
      
      expect(estimatePageCount('A4')).toBe(1);
    });

    it('calculates correctly for different paper sizes', () => {
      const mapElement = document.querySelector('.htmm-map') as HTMLElement;
      
      vi.spyOn(mapElement, 'getBoundingClientRect').mockReturnValue({
        width: 1500,
        height: 1000,
        top: 0,
        left: 0,
        bottom: 1000,
        right: 1500,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      
      const a4Pages = estimatePageCount('A4');
      const letterPages = estimatePageCount('Letter');
      const legalPages = estimatePageCount('Legal');
      
      expect(a4Pages).toBeGreaterThanOrEqual(1);
      expect(letterPages).toBeGreaterThanOrEqual(1);
      expect(legalPages).toBeGreaterThanOrEqual(1);
    });
  });
});
