/**
 * Test Setup
 * 
 * Global test configuration
 */

// Mock window for server-side tests
if (typeof window === 'undefined') {
  global.window = {} as any;
}

// Mock document for server-side tests
if (typeof document === 'undefined') {
  global.document = {} as any;
}

// Mock navigator
if (typeof navigator === 'undefined') {
  global.navigator = {
    clipboard: {
      writeText: jest.fn(),
    },
  } as any;
}

// Suppress console errors in tests (optional)
// global.console.error = jest.fn();
