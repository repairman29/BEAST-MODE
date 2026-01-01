/**
 * Test suite for Day 2 Operations (Janitor) Dashboard
 * Tests all UI components and interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Janitor Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        silentRefactoring: {
          enabled: true,
          overnightMode: true,
          lastRun: new Date().toISOString(),
          issuesFixed: 23,
          prsCreated: 5
        },
        architectureEnforcement: {
          enabled: true,
          violationsBlocked: 12,
          lastCheck: new Date().toISOString()
        },
        vibeRestoration: {
          enabled: true,
          lastRestore: null,
          regressionsDetected: 0
        },
        repoMemory: {
          enabled: true,
          graphSize: 1247,
          lastUpdate: new Date().toISOString()
        },
        vibeOps: {
          enabled: true,
          testsRun: 18,
          lastTest: new Date().toISOString()
        },
        invisibleCICD: {
          enabled: true,
          scansRun: 156,
          issuesFound: 3
        }
      })
    });
  });

  it('should render dashboard with all features', async () => {
    const { default: JanitorDashboard } = await import('../components/beast-mode/JanitorDashboard');
    render(<JanitorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Day 2 Operations/i)).toBeInTheDocument();
      expect(screen.getByText(/Silent Refactoring/i)).toBeInTheDocument();
      expect(screen.getByText(/Architecture Enforcement/i)).toBeInTheDocument();
      expect(screen.getByText(/Vibe Restoration/i)).toBeInTheDocument();
      expect(screen.getByText(/Repo-Level Memory/i)).toBeInTheDocument();
      expect(screen.getByText(/Vibe Ops/i)).toBeInTheDocument();
      expect(screen.getByText(/Invisible CI\/CD/i)).toBeInTheDocument();
    });
  });

  it('should display quick stats', async () => {
    const { default: JanitorDashboard } = await import('../components/beast-mode/JanitorDashboard');
    render(<JanitorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/23/i)).toBeInTheDocument(); // Issues fixed
      expect(screen.getByText(/12/i)).toBeInTheDocument(); // Violations blocked
      expect(screen.getByText(/1247/i)).toBeInTheDocument(); // Graph size
      expect(screen.getByText(/18/i)).toBeInTheDocument(); // Tests run
    });
  });

  it('should toggle feature on/off', async () => {
    const { default: JanitorDashboard } = await import('../components/beast-mode/JanitorDashboard');
    render(<JanitorDashboard />);

    await waitFor(() => {
      const toggleButtons = screen.getAllByText(/ON|OFF/i);
      expect(toggleButtons.length).toBeGreaterThan(0);
    });

    // Test toggle functionality
    const firstToggle = screen.getAllByText(/ON/i)[0];
    fireEvent.click(firstToggle);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should open configuration modal', async () => {
    const { default: JanitorDashboard } = await import('../components/beast-mode/JanitorDashboard');
    render(<JanitorDashboard />);

    await waitFor(() => {
      const configButtons = screen.getAllByText(/Configure/i);
      expect(configButtons.length).toBeGreaterThan(0);
    });

    const configButton = screen.getAllByText(/Configure/i)[0];
    fireEvent.click(configButton);

    await waitFor(() => {
      // Modal should appear
      expect(screen.getByText(/Configure/i)).toBeInTheDocument();
    });
  });
});

describe('Vibe Ops Test Creator', () => {
  it('should render test creator form', async () => {
    const { default: VibeOpsTestCreator } = await import('../components/beast-mode/VibeOpsTestCreator');
    const onClose = vi.fn();
    const onTestCreated = vi.fn();

    render(<VibeOpsTestCreator onClose={onClose} onTestCreated={onTestCreated} />);

    expect(screen.getByText(/Create Test in Plain English/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe what you want to test/i)).toBeInTheDocument();
  });

  it('should create test from description', async () => {
    const { default: VibeOpsTestCreator } = await import('../components/beast-mode/VibeOpsTestCreator');
    const onClose = vi.fn();
    const onTestCreated = vi.fn();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1',
        description: 'User can login',
        type: 'happy-path',
        status: 'created',
        code: 'describe("User can login", () => { it("should login", () => {}); });'
      })
    });

    render(<VibeOpsTestCreator onClose={onClose} onTestCreated={onTestCreated} />);

    const textarea = screen.getByPlaceholderText(/Describe what you want to test/i);
    fireEvent.change(textarea, { target: { value: 'User can login' } });

    const createButton = screen.getByText(/Create Test/i);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/beast-mode/janitor/vibe-ops/create-test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: 'User can login',
            type: 'happy-path'
          })
        })
      );
    });
  });
});

describe('Refactoring History', () => {
  it('should load and display refactoring history', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        runs: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            issuesFixed: 23,
            prsCreated: 5,
            status: 'completed',
            changes: []
          }
        ]
      })
    });

    const { default: RefactoringHistory } = await import('../components/beast-mode/RefactoringHistory');
    render(<RefactoringHistory />);

    await waitFor(() => {
      expect(screen.getByText(/Refactoring History/i)).toBeInTheDocument();
      expect(screen.getByText(/23 issues fixed/i)).toBeInTheDocument();
    });
  });
});

describe('Architecture Rules View', () => {
  it('should load and display architecture rules', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        rules: [
          {
            id: 'block-secrets',
            name: 'Block Secrets in Code',
            description: 'Prevents hardcoded API keys',
            enabled: true,
            severity: 'error',
            category: 'security',
            examples: []
          }
        ]
      })
    });

    const { default: ArchitectureRulesView } = await import('../components/beast-mode/ArchitectureRulesView');
    render(<ArchitectureRulesView />);

    await waitFor(() => {
      expect(screen.getByText(/Architecture Rules/i)).toBeInTheDocument();
      expect(screen.getByText(/Block Secrets in Code/i)).toBeInTheDocument();
    });
  });
});

