/**
 * Print utilities for FreeMind maps
 */

export interface PrintOptions {
  /**
   * Page title for print
   */
  title?: string;

  /**
   * Whether to show print dialog immediately
   */
  showDialog?: boolean;

  /**
   * Custom CSS to apply during print
   */
  customCSS?: string;

  /**
   * Paper size (default: 'A4')
   */
  paperSize?: 'A4' | 'Letter' | 'Legal';

  /**
   * Orientation (default: 'landscape')
   */
  orientation?: 'portrait' | 'landscape';

  /**
   * Scale factor (default: 1)
   */
  scale?: number;
}

/**
 * Print the current mind map
 */
export const printMap = (options: PrintOptions = {}): void => {
  const {
    title = 'Mind Map',
    showDialog = true,
    customCSS = '',
    paperSize = 'A4',
    orientation = 'landscape',
    scale = 1,
  } = options;

  // Set document title for print
  const originalTitle = document.title;
  document.title = title;

  // Apply scale transformation if needed
  const mapElement = document.querySelector('.freemind-map') as HTMLElement;
  const originalTransform = mapElement?.style.transform || '';
  
  if (mapElement && scale !== 1) {
    mapElement.style.transform = `scale(${scale})`;
    mapElement.style.transformOrigin = 'top left';
  }

  // Add custom CSS if provided
  let styleElement: HTMLStyleElement | null = null;
  if (customCSS) {
    styleElement = document.createElement('style');
    styleElement.textContent = customCSS;
    document.head.appendChild(styleElement);
  }

  // Add page size CSS
  const pageSizeCSS = `
    @page {
      size: ${paperSize} ${orientation};
      margin: 1cm;
    }
  `;
  const pageSizeStyle = document.createElement('style');
  pageSizeStyle.textContent = pageSizeCSS;
  document.head.appendChild(pageSizeStyle);

  // Trigger print
  if (showDialog) {
    window.print();
  }

  // Cleanup after print
  window.addEventListener('afterprint', () => {
    // Restore original title
    document.title = originalTitle;

    // Restore transform
    if (mapElement) {
      mapElement.style.transform = originalTransform;
    }

    // Remove custom CSS
    if (styleElement) {
      document.head.removeChild(styleElement);
    }

    // Remove page size CSS
    document.head.removeChild(pageSizeStyle);
  }, { once: true });
};

/**
 * Enter print preview mode
 * Adds special class for preview styling
 */
export const enterPrintPreview = (): void => {
  document.body.classList.add('print-preview');
};

/**
 * Exit print preview mode
 */
export const exitPrintPreview = (): void => {
  document.body.classList.remove('print-preview');
};

/**
 * Check if browser supports print
 */
export const supportsPrint = (): boolean => {
  return typeof window !== 'undefined' && 'print' in window;
};

/**
 * Get estimated page count for current map
 * Note: This is an approximation based on viewport size
 */
export const estimatePageCount = (paperSize: 'A4' | 'Letter' | 'Legal' = 'A4'): number => {
  const mapElement = document.querySelector('.freemind-map') as HTMLElement;
  if (!mapElement) return 1;

  const mapBounds = mapElement.getBoundingClientRect();
  
  // Paper dimensions in pixels (approximate, assuming 96 DPI)
  const paperSizes = {
    A4: { width: 1122, height: 793 }, // 297mm x 210mm landscape
    Letter: { width: 1056, height: 816 }, // 11" x 8.5" landscape
    Legal: { width: 1344, height: 816 }, // 14" x 8.5" landscape
  };

  const paper = paperSizes[paperSize];
  
  // Account for margins (1cm = ~38px at 96 DPI)
  const usableWidth = paper.width - 76;
  const usableHeight = paper.height - 76;

  const pagesWide = Math.ceil(mapBounds.width / usableWidth);
  const pagesTall = Math.ceil(mapBounds.height / usableHeight);

  return pagesWide * pagesTall;
};
