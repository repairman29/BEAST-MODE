/**
 * Export Quality Data Utilities
 * 
 * Functions to export quality dashboard data to CSV, JSON, and PDF
 */

export interface QualityExportData {
  repo: string;
  quality: number;
  confidence: number;
  percentile: number;
  factors?: Record<string, { value: number; importance: number }>;
  recommendations?: Array<{
    action: string;
    priority?: string;
    categorization?: {
      type: string;
      roi: string;
      effort: string;
    };
  }>;
  timestamp: string;
}

/**
 * Export quality results to CSV
 */
export function exportToCSV(results: QualityExportData[]): string {
  const headers = ['Repository', 'Quality Score', 'Confidence', 'Percentile', 'Top Factor', 'Recommendations Count', 'Timestamp'];
  const rows = results.map(result => {
    const topFactor = result.factors 
      ? Object.entries(result.factors)
          .sort((a, b) => (b[1].importance || 0) - (a[1].importance || 0))[0]?.[0] || 'N/A'
      : 'N/A';
    const recCount = result.recommendations?.length || 0;
    
    return [
      result.repo,
      (result.quality * 100).toFixed(2) + '%',
      (result.confidence * 100).toFixed(2) + '%',
      result.percentile.toFixed(0) + 'th',
      topFactor,
      recCount.toString(),
      result.timestamp
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Export quality results to JSON
 */
export function exportToJSON(results: QualityExportData[]): string {
  return JSON.stringify(results, null, 2);
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to CSV and download
 */
export function exportQualityToCSV(results: QualityExportData[]) {
  const csv = exportToCSV(results);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csv, `quality-report-${timestamp}.csv`, 'text/csv');
}

/**
 * Export to JSON and download
 */
export function exportQualityToJSON(results: QualityExportData[]) {
  const json = exportToJSON(results);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(json, `quality-report-${timestamp}.json`, 'application/json');
}

/**
 * Generate PDF content (simplified - would need a PDF library for full implementation)
 */
export function generatePDFContent(results: QualityExportData[]): string {
  // This is a simplified version - in production, use a PDF library like jsPDF
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quality Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .quality-high { color: green; }
        .quality-medium { color: orange; }
        .quality-low { color: red; }
      </style>
    </head>
    <body>
      <h1>Quality Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>Repository</th>
            <th>Quality Score</th>
            <th>Confidence</th>
            <th>Percentile</th>
            <th>Top Recommendations</th>
          </tr>
        </thead>
        <tbody>
  `;

  results.forEach(result => {
    const qualityClass = result.quality >= 0.7 ? 'quality-high' : result.quality >= 0.4 ? 'quality-medium' : 'quality-low';
    const topRecs = result.recommendations?.slice(0, 3).map(r => r.action).join(', ') || 'None';
    
    html += `
      <tr>
        <td>${result.repo}</td>
        <td class="${qualityClass}">${(result.quality * 100).toFixed(1)}%</td>
        <td>${(result.confidence * 100).toFixed(1)}%</td>
        <td>${result.percentile.toFixed(0)}th</td>
        <td>${topRecs}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html;
}

/**
 * Export to PDF (opens print dialog)
 */
export function exportQualityToPDF(results: QualityExportData[]) {
  const html = generatePDFContent(results);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}
