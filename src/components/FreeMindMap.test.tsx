/**
 * Tests for FreeMindMap component (single and multi-instance)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreeMindMap } from './FreeMindMap';
import { createRootNode } from '../models/MindMapNode';
import type { MindMapData } from '../types/mindmap';

function makeMapData(rootText: string): MindMapData {
  return {
    version: '1.0.1',
    root: createRootNode(rootText),
  };
}

describe('FreeMindMap', () => {
  describe('with initialMapData (multi-instance)', () => {
    it('renders two maps with different data independently', () => {
      const mapData1 = makeMapData('Map One');
      const mapData2 = makeMapData('Map Two');

      render(
        <div>
          <FreeMindMap initialMapData={mapData1} width={400} height={300} />
          <FreeMindMap initialMapData={mapData2} width={400} height={300} />
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
          <FreeMindMap initialMapData={mapDataA} width={400} height={300} />
          <FreeMindMap initialMapData={mapDataB} width={400} height={300} />
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
