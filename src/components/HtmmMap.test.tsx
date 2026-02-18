/**
 * Tests for HtmmMap component (single and multi-instance)
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
});
