/**
 * Shared scan results store
 * Allows Quality tab to access GitHub scan results
 */

export interface ScanResult {
  repo: string;
  score: number;
  issues: number;
  improvements: number;
  status: 'scanning' | 'completed' | 'error';
  detectedIssues?: Array<{ 
    title: string; 
    description: string; 
    priority: string; 
    category: string; 
    type: string;
    count?: number;
  }>;
  recommendations?: Array<{ 
    title: string; 
    description: string; 
    priority: string; 
    category: string; 
    message: string;
    file?: string;
    line?: number;
  }>;
  metrics?: any;
  timestamp?: string;
}

class ScanResultsStore {
  private scans: ScanResult[] = [];
  private listeners: Set<() => void> = new Set();

  // Load from localStorage on init
  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('beast-mode-scan-results');
        if (stored) {
          this.scans = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to load scan results from localStorage:', e);
      }
    }
  }

  // Get all scans
  getScans(): ScanResult[] {
    return this.scans;
  }

  // Get latest scan
  getLatestScan(): ScanResult | null {
    return this.scans.length > 0 ? this.scans[0] : null;
  }

  // Get latest completed scan
  getLatestCompletedScan(): ScanResult | null {
    return this.scans.find(s => s.status === 'completed') || null;
  }

  // Add a scan
  addScan(scan: ScanResult) {
    // Remove existing scan for same repo
    this.scans = this.scans.filter(s => s.repo !== scan.repo);
    // Add new scan at the beginning
    this.scans.unshift(scan);
    // Keep only last 50 scans
    this.scans = this.scans.slice(0, 50);
    this.save();
    this.notify();
  }

  // Update a scan
  updateScan(repo: string, updates: Partial<ScanResult>) {
    const index = this.scans.findIndex(s => s.repo === repo);
    if (index !== -1) {
      this.scans[index] = { ...this.scans[index], ...updates };
      this.save();
      this.notify();
    }
  }

  // Clear all scans
  clearScans() {
    this.scans = [];
    this.save();
    this.notify();
  }

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify listeners
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Save to localStorage
  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('beast-mode-scan-results', JSON.stringify(this.scans));
      } catch (e) {
        console.error('Failed to save scan results to localStorage:', e);
      }
    }
  }
}

// Singleton instance
export const scanResultsStore = new ScanResultsStore();

