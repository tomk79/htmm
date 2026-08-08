/**
 * Tests for HtmmMap component (single and multi-instance)
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HtmmMap, type HtmmMapHandle } from './HtmmMap';
import { createRootNode } from '../models/MindMapNode';
import type { MindMapData } from '../types/mindmap';

vi.mock('../io/parser', () => ({
  loadMindMapURL: vi.fn(() =>
    Promise.resolve({
      version: '1.0.1',
      root: { id: 'url-root', text: 'From URL', children: [] },
    } as MindMapData)
  ),
}));

function makeMapData(rootText: string): MindMapData {
  return {
    version: '1.0.1',
    root: createRootNode(rootText),
  };
}

describe('HtmmMap', () => {
  describe('without initialMapData and without src', () => {
    it('renders empty map with default root text', () => {
      render(<HtmmMap width={400} height={300} />);
      expect(screen.getByText('New Mind Map')).toBeInTheDocument();
    });
  });

  describe('with src', () => {
    it('loads map from URL and displays it', async () => {
      render(<HtmmMap src="/test.mm" width={400} height={300} />);
      await waitFor(() => {
        expect(screen.getByText('From URL')).toBeInTheDocument();
      });
    });
  });

  describe('with ref', () => {
    it('exposes loadMap and getMapData via ref', async () => {
      const ref = React.createRef<HtmmMapHandle>();
      const mapData = makeMapData('Loaded via ref');
      render(<HtmmMap ref={ref} width={400} height={300} />);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      ref.current!.loadMap(mapData);
      await waitFor(() => {
        expect(screen.getByText('Loaded via ref')).toBeInTheDocument();
      });

      const data = ref.current!.getMapData();
      expect(data?.root.text).toBe('Loaded via ref');
    });
  });

  describe('with initialMapData (multi-instance)', () => {
    it('renders two maps with different data independently', () => {
      const mapData1 = makeMapData('Map One');
      const mapData2 = makeMapData('Map Two');

      render(
        <div>
          <HtmmMap initialMapData={mapData1} width={400} height={300} />
          <HtmmMap initialMapData={mapData2} width={400} height={300} />
        </div>
      );

      expect(screen.getByRole('tree', { name: /Mind map: Map One/i })).toBeInTheDocument();
      expect(screen.getByRole('tree', { name: /Mind map: Map Two/i })).toBeInTheDocument();
      expect(screen.getByText('Map One')).toBeInTheDocument();
      expect(screen.getByText('Map Two')).toBeInTheDocument();
    });

    it('each instance shows only its own root text', () => {
      const mapDataA = makeMapData('Instance A');
      const mapDataB = makeMapData('Instance B');

      render(
        <div>
          <HtmmMap initialMapData={mapDataA} width={400} height={300} />
          <HtmmMap initialMapData={mapDataB} width={400} height={300} />
        </div>
      );

      const trees = screen.getAllByRole('tree');
      expect(trees).toHaveLength(2);
      const firstTree = trees[0];
      const secondTree = trees[1];
      expect(firstTree).toHaveAttribute('aria-label', expect.stringContaining('Instance A'));
      expect(secondTree).toHaveAttribute('aria-label', expect.stringContaining('Instance B'));
    });
  });

  describe('fullscreen', () => {
    afterEach(() => {
      document.body.style.overflow = '';
    });

    it('portals map to document.body and keeps a placeholder in place', async () => {
      const user = userEvent.setup();
      const mapData = makeMapData('Fullscreen Map');
      const { container } = render(
        <div data-testid="embed-parent" style={{ transform: 'translateZ(0)' }}>
          <HtmmMap initialMapData={mapData} width={400} height={300} />
        </div>
      );

      const tree = screen.getByRole('tree', { name: /Mind map: Fullscreen Map/i });
      expect(tree).toHaveClass('htmm-map');
      expect(tree).not.toHaveClass('htmm-map-fullscreen');
      expect(container.querySelector('[data-testid="embed-parent"]')?.contains(tree)).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Fullscreen' }));

      const fullscreenTree = screen.getByRole('tree', { name: /Mind map: Fullscreen Map/i });
      expect(fullscreenTree).toHaveClass('htmm-map-fullscreen');
      expect(fullscreenTree.parentElement).toBe(document.body);
      expect(document.body.style.overflow).toBe('hidden');

      const placeholder = container.querySelector('.htmm-map-placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder).toHaveStyle({ width: '400px', height: '300px' });
    });

    it('restores body scroll position when exiting fullscreen', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'scrollX', { configurable: true, value: 12 });
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 150 });
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      render(<HtmmMap initialMapData={makeMapData('Scroll Map')} width={400} height={300} />);

      await user.click(screen.getByRole('button', { name: 'Fullscreen' }));
      expect(document.body.style.overflow).toBe('hidden');

      await user.click(screen.getByRole('button', { name: 'Exit fullscreen' }));
      expect(document.body.style.overflow).toBe('');
      expect(scrollToSpy).toHaveBeenCalledWith(12, 150);
      scrollToSpy.mockRestore();
    });

    it('keeps wheel pan working after entering and exiting fullscreen', async () => {
      const user = userEvent.setup();
      render(<HtmmMap initialMapData={makeMapData('Wheel Pan Map')} width={400} height={300} />);

      const mockSize = (el: HTMLElement) => {
        Object.defineProperty(el, 'clientWidth', { configurable: true, value: 400 });
        Object.defineProperty(el, 'clientHeight', { configurable: true, value: 300 });
      };

      const readTransform = () => {
        const canvas = screen.getByRole('tree').querySelector('.htmm-canvas') as HTMLElement;
        return canvas.style.transform;
      };

      await user.click(screen.getByRole('button', { name: 'Fullscreen' }));
      let tree = screen.getByRole('tree', { name: /Mind map: Wheel Pan Map/i });
      mockSize(tree);
      const afterEnter = readTransform();
      await act(async () => {
        fireEvent.wheel(tree, { deltaX: 0, deltaY: 40 });
      });
      expect(readTransform()).not.toBe(afterEnter);

      await user.click(screen.getByRole('button', { name: 'Exit fullscreen' }));
      tree = screen.getByRole('tree', { name: /Mind map: Wheel Pan Map/i });
      mockSize(tree);
      const afterExit = readTransform();
      await act(async () => {
        fireEvent.wheel(tree, { deltaX: 0, deltaY: 40 });
      });
      expect(readTransform()).not.toBe(afterExit);
    });
  });

  describe('drag pan', () => {
    it('starts pan from map body even when canvas is translated away', async () => {
      render(<HtmmMap initialMapData={makeMapData('Drag Pan Map')} width={400} height={300} />);

      const tree = screen.getByRole('tree', { name: /Mind map: Drag Pan Map/i });
      Object.defineProperty(tree, 'clientWidth', { configurable: true, value: 400 });
      Object.defineProperty(tree, 'clientHeight', { configurable: true, value: 300 });

      const body = tree.querySelector('.htmm-map-body') as HTMLElement;
      const canvas = tree.querySelector('.htmm-canvas') as HTMLElement;
      expect(body).toBeTruthy();
      expect(canvas).toBeTruthy();

      // Simulate being at a pan limit: canvas translated far, so empty body is the hit target
      await act(async () => {
        fireEvent.wheel(tree, { deltaX: 0, deltaY: 5000 });
      });
      const before = canvas.style.transform;

      await act(async () => {
        fireEvent.mouseDown(body, { button: 0, clientX: 200, clientY: 150 });
        fireEvent.mouseMove(window, { clientX: 200, clientY: 100 });
        fireEvent.mouseUp(window);
      });

      expect(canvas.style.transform).not.toBe(before);
    });

    it('does not start pan when mousedown is on a node', async () => {
      render(<HtmmMap initialMapData={makeMapData('Node Drag Map')} width={400} height={300} />);

      const tree = screen.getByRole('tree', { name: /Mind map: Node Drag Map/i });
      Object.defineProperty(tree, 'clientWidth', { configurable: true, value: 400 });
      Object.defineProperty(tree, 'clientHeight', { configurable: true, value: 300 });

      const canvas = tree.querySelector('.htmm-canvas') as HTMLElement;
      const node = screen.getByText('Node Drag Map');
      const before = canvas.style.transform;

      await act(async () => {
        fireEvent.mouseDown(node, { button: 0, clientX: 200, clientY: 150 });
        fireEvent.mouseMove(window, { clientX: 200, clientY: 50 });
        fireEvent.mouseUp(window);
      });

      expect(canvas.style.transform).toBe(before);
    });
  });
});
