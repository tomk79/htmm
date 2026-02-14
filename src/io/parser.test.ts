import { describe, it, expect } from 'vitest';
import { parseFreeMindXML } from '../io/parser';
import { generateFreeMindXML } from '../io/generator';
import type { MindMapData } from '../types/mindmap';

describe('XML Parser and Generator', () => {
  const simpleXML = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
  <node TEXT="Root Node" ID="ID_1">
    <node TEXT="Child 1" ID="ID_2" POSITION="right"/>
    <node TEXT="Child 2" ID="ID_3" POSITION="left"/>
  </node>
</map>`;

  const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
  <node TEXT="Root" ID="ID_ROOT" BACKGROUND_COLOR="#FF0000" COLOR="#FFFFFF">
    <font NAME="Arial" SIZE="14" BOLD="true"/>
    <edge COLOR="#0000FF" STYLE="bezier" WIDTH="2"/>
    <node TEXT="Child with Icon" ID="ID_CHILD1" POSITION="right">
      <icon BUILTIN="yes"/>
      <cloud COLOR="#00FF00"/>
    </node>
    <node TEXT="Folded Child" ID="ID_CHILD2" FOLDED="true" POSITION="left">
      <node TEXT="Hidden Grandchild" ID="ID_GRANDCHILD"/>
    </node>
  </node>
</map>`;

  describe('parseFreeMindXML', () => {
    it('should parse a simple mind map', () => {
      const result = parseFreeMindXML(simpleXML);
      
      expect(result).toBeDefined();
      expect(result.root.text).toBe('Root Node');
      expect(result.root.id).toBe('ID_1');
      expect(result.root.children).toHaveLength(2);
      expect(result.root.children![0].text).toBe('Child 1');
      expect(result.root.children![0].position).toBe('right');
      expect(result.root.children![1].text).toBe('Child 2');
      expect(result.root.children![1].position).toBe('left');
    });

    it('should parse node styles', () => {
      const result = parseFreeMindXML(complexXML);
      
      expect(result.root.backgroundColor).toBe('#FF0000');
      expect(result.root.color).toBe('#FFFFFF');
      expect(result.root.font?.name).toBe('Arial');
      expect(result.root.font?.size).toBe(14);
      expect(result.root.font?.bold).toBe(true);
    });

    it('should parse edge styles', () => {
      const result = parseFreeMindXML(complexXML);
      
      expect(result.root.edge?.color).toBe('#0000FF');
      expect(result.root.edge?.style).toBe('bezier');
      expect(result.root.edge?.width).toBe('2');
    });

    it('should parse icons and clouds', () => {
      const result = parseFreeMindXML(complexXML);
      
      const childWithIcon = result.root.children![0];
      expect(childWithIcon.icons).toHaveLength(1);
      expect(childWithIcon.icons![0].builtin).toBe('yes');
      expect(childWithIcon.cloud?.color).toBe('#00FF00');
    });

    it('should parse folded nodes', () => {
      const result = parseFreeMindXML(complexXML);
      
      const foldedChild = result.root.children![1];
      expect(foldedChild.folded).toBe(true);
      expect(foldedChild.children).toHaveLength(1);
    });

    it('should handle empty/invalid XML gracefully', () => {
      expect(() => parseFreeMindXML('')).toThrow();
      expect(() => parseFreeMindXML('<invalid>')).toThrow();
    });

    it('should parse version information', () => {
      const result = parseFreeMindXML(simpleXML);
      
      expect(result.version).toBe('1.0.1');
    });
  });

  describe('generateFreeMindXML', () => {
    it('should generate valid XML for a simple mind map', () => {
      const data: MindMapData = {
        version: '1.0.1',
        root: {
          id: 'ID_1',
          text: 'Root Node',
          created: Date.now(),
          modified: Date.now(),
          children: [
            {
              id: 'ID_2',
              text: 'Child 1',
              position: 'right',
              created: Date.now(),
              modified: Date.now(),
              children: [],
            },
            {
              id: 'ID_3',
              text: 'Child 2',
              position: 'left',
              created: Date.now(),
              modified: Date.now(),
              children: [],
            },
          ],
        },
      };
      
      const xml = generateFreeMindXML(data);
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<map version="1.0.1">');
      expect(xml).toContain('TEXT="Root Node"');
      expect(xml).toContain('TEXT="Child 1"');
      expect(xml).toContain('TEXT="Child 2"');
      expect(xml).toContain('POSITION="right"');
      expect(xml).toContain('POSITION="left"');
    });

    it('should generate XML with styles', () => {
      const data: MindMapData = {
        version: '1.0.1',
        root: {
          id: 'ID_1',
          text: 'Root',
          backgroundColor: '#FF0000',
          color: '#FFFFFF',
          font: {
            name: 'Arial',
            size: 14,
            bold: true,
          },
          edge: {
            color: '#0000FF',
            style: 'bezier',
            width: '2',
          },
          created: Date.now(),
          modified: Date.now(),
          children: [],
        },
      };
      
      const xml = generateFreeMindXML(data);
      
      expect(xml).toContain('BACKGROUND_COLOR="#FF0000"');
      expect(xml).toContain('COLOR="#FFFFFF"');
      expect(xml).toContain('<font NAME="Arial" SIZE="14" BOLD="true"');
      expect(xml).toContain('<edge COLOR="#0000FF" STYLE="bezier" WIDTH="2"');
    });

    it('should escape special characters in text', () => {
      const data: MindMapData = {
        version: '1.0.1',
        root: {
          id: 'ID_1',
          text: 'Text with <special> & "characters"',
          created: Date.now(),
          modified: Date.now(),
          children: [],
        },
      };
      
      const xml = generateFreeMindXML(data);
      
      expect(xml).toContain('&lt;special&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve data through parse and generate cycle', () => {
      const original = parseFreeMindXML(simpleXML);
      const xml = generateFreeMindXML(original);
      const parsed = parseFreeMindXML(xml);
      
      expect(parsed.root.text).toBe(original.root.text);
      expect(parsed.root.children).toHaveLength(original.root.children!.length);
      expect(parsed.root.children![0].text).toBe(original.root.children![0].text);
      expect(parsed.root.children![1].text).toBe(original.root.children![1].text);
    });

    it('should preserve complex styles through round-trip', () => {
      const original = parseFreeMindXML(complexXML);
      const xml = generateFreeMindXML(original);
      const parsed = parseFreeMindXML(xml);
      
      expect(parsed.root.backgroundColor).toBe(original.root.backgroundColor);
      expect(parsed.root.color).toBe(original.root.color);
      expect(parsed.root.font?.name).toBe(original.root.font?.name);
      expect(parsed.root.font?.size).toBe(original.root.font?.size);
      expect(parsed.root.edge?.style).toBe(original.root.edge?.style);
    });
  });
});
