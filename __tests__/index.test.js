/**
 * BEAST MODE Core Library Tests
 */

const { BeastMode } = require('../lib/index');

describe('BEAST MODE Core', () => {
  test('should initialize BeastMode', () => {
    const beastMode = new BeastMode();
    expect(beastMode).toBeDefined();
    expect(typeof beastMode.initialize).toBe('function');
  });

  test('should have core components', () => {
    const beastMode = new BeastMode();
    expect(beastMode.components).toBeDefined();
    expect(typeof beastMode.components).toBe('object');
  });

  test('should have quality analysis method', () => {
    const beastMode = new BeastMode();
    expect(typeof beastMode.analyzeQuality).toBe('function');
  });

  test('should have deployment method', () => {
    const beastMode = new BeastMode();
    expect(typeof beastMode.deployApplication).toBe('function');
  });
});
