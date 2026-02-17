/**
 * FreeMind compatibility tests
 * - Parse .mm content (as if created by FreeMind or exported by FreeMind Web)
 * - Round-trip: parse -> generate -> parse, assert structural equality
 * - Ensures files edited in FreeMind Web remain parseable and valid
 */

import { describe, it, expect } from 'vitest';
import { parseMindMapXML } from './parser';
import { generateMindMapXML } from './generator';
import type { MindMapNode } from '../types/mindmap';

/** Minimal .mm similar to what FreeMind might export */
const FREEMIND_STYLE_MM = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
  <node CREATED="1234567890000" ID="ID_1" MODIFIED="1234567891000" TEXT="Root">
    <node CREATED="1234567892000" ID="ID_2" MODIFIED="1234567893000" POSITION="right" TEXT="Child A"/>
    <node CREATED="1234567894000" ID="ID_3" MODIFIED="1234567895000" POSITION="left" TEXT="Child B">
      <node CREATED="1234567896000" ID="ID_4" MODIFIED="1234567897000" TEXT="Grandchild"/>
    </node>
  </node>
</map>`;

/** Sample used by E2E / load tests */
const SAMPLE_MM = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
  <node ID="fixture-root" TEXT="Loaded Map">
    <node ID="fixture-c1" TEXT="Child A"/>
    <node ID="fixture-c2" TEXT="Child B"/>
  </node>
</map>`;

function assertTreeShape(actual: MindMapNode, expected: { text?: string; childCount?: number; childTexts?: string[] }) {
  if (expected.text !== undefined) expect(actual.text).toBe(expected.text);
  if (expected.childCount !== undefined) expect(actual.children?.length ?? 0).toBe(expected.childCount);
  if (expected.childTexts !== undefined && actual.children) {
    expect(actual.children.map((c) => c.text)).toEqual(expected.childTexts);
  }
}

describe('FreeMind compatibility', () => {
  describe('Parse FreeMind-style .mm', () => {
    it('should parse FreeMind-style file with CREATED/MODIFIED', () => {
      const data = parseMindMapXML(FREEMIND_STYLE_MM);
      expect(data.version).toBe('1.0.1');
      assertTreeShape(data.root, { text: 'Root', childCount: 2, childTexts: ['Child A', 'Child B'] });
      expect(data.root.created).toBe(1234567890000);
      expect(data.root.modified).toBe(1234567891000);
      const childB = data.root.children!.find((c) => c.text === 'Child B');
      expect(childB?.children).toHaveLength(1);
      expect(childB?.children![0].text).toBe('Grandchild');
    });

    it('should parse sample fixture used by E2E', () => {
      const data = parseMindMapXML(SAMPLE_MM);
      assertTreeShape(data.root, { text: 'Loaded Map', childCount: 2, childTexts: ['Child A', 'Child B'] });
      expect(data.root.id).toBe('fixture-root');
    });
  });

  describe('Round-trip (FreeMind Web edited .mm remains valid)', () => {
    it('should preserve structure and key fields through parse -> generate -> parse', () => {
      const first = parseMindMapXML(FREEMIND_STYLE_MM);
      const xml = generateMindMapXML(first);
      const second = parseMindMapXML(xml);

      expect(second.version).toBe(first.version);
      expect(second.root.id).toBe(first.root.id);
      expect(second.root.text).toBe(first.root.text);
      expect(second.root.children?.length).toBe(first.root.children?.length);
      second.root.children?.forEach((c, i) => {
        expect(c.text).toBe(first.root.children![i].text);
        expect(c.id).toBe(first.root.children![i].id);
        expect(c.children?.length ?? 0).toBe(first.root.children![i].children?.length ?? 0);
      });
    });

    it('should produce parseable XML from parsed data (sample fixture)', () => {
      const data = parseMindMapXML(SAMPLE_MM);
      const xml = generateMindMapXML(data);
      const reparsed = parseMindMapXML(xml);
      assertTreeShape(reparsed.root, { text: 'Loaded Map', childCount: 2, childTexts: ['Child A', 'Child B'] });
    });
  });
});
