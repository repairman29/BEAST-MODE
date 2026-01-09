/**
 * Export Quality Data Tests
 * 
 * Tests for export functionality
 */

import {
  exportToCSV,
  exportToJSON,
  generatePDFContent,
  QualityExportData,
} from '@/lib/export-quality-data';

describe('Export Quality Data', () => {
  const mockResults: QualityExportData[] = [
    {
      repo: 'owner/repo1',
      quality: 0.85,
      confidence: 0.9,
      percentile: 75,
      factors: {
        hasTests: { value: 1, importance: 0.8 },
        hasCI: { value: 1, importance: 0.7 },
      },
      recommendations: [
        { action: 'Add more tests', priority: 'high' },
        { action: 'Improve documentation', priority: 'medium' },
      ],
      timestamp: '2026-01-09T12:00:00Z',
    },
    {
      repo: 'owner/repo2',
      quality: 0.65,
      confidence: 0.8,
      percentile: 50,
      factors: {
        hasTests: { value: 0.5, importance: 0.6 },
      },
      recommendations: [{ action: 'Add tests', priority: 'high' }],
      timestamp: '2026-01-09T12:00:00Z',
    },
  ];

  describe('exportToCSV', () => {
    it('should generate valid CSV', () => {
      const csv = exportToCSV(mockResults);
      
      expect(csv).toContain('Repository');
      expect(csv).toContain('Quality Score');
      expect(csv).toContain('owner/repo1');
      expect(csv).toContain('85.00%');
      expect(csv.split('\n').length).toBeGreaterThan(2); // Header + data rows
    });

    it('should handle empty results', () => {
      const csv = exportToCSV([]);
      expect(csv).toContain('Repository');
      expect(csv.split('\n').length).toBe(1); // Only header
    });

    it('should include top factor', () => {
      const csv = exportToCSV(mockResults);
      expect(csv).toContain('hasTests'); // Top factor from first repo
    });
  });

  describe('exportToJSON', () => {
    it('should generate valid JSON', () => {
      const json = exportToJSON(mockResults);
      const parsed = JSON.parse(json);
      
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed.length).toBe(2);
      expect(parsed[0].repo).toBe('owner/repo1');
      expect(parsed[0].quality).toBe(0.85);
    });

    it('should preserve all data', () => {
      const json = exportToJSON(mockResults);
      const parsed = JSON.parse(json);
      
      expect(parsed[0].factors).toBeDefined();
      expect(parsed[0].recommendations).toBeDefined();
      expect(parsed[0].timestamp).toBeDefined();
    });
  });

  describe('generatePDFContent', () => {
    it('should generate HTML content', () => {
      const html = generatePDFContent(mockResults);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Quality Report');
      expect(html).toContain('owner/repo1');
      expect(html).toContain('85.0%');
    });

    it('should include quality classes', () => {
      const html = generatePDFContent(mockResults);
      
      expect(html).toContain('quality-high'); // 0.85 >= 0.7
      expect(html).toContain('quality-medium'); // 0.65 >= 0.4
    });

    it('should include recommendations', () => {
      const html = generatePDFContent(mockResults);
      
      expect(html).toContain('Add more tests');
      expect(html).toContain('Add tests');
    });
  });
});
