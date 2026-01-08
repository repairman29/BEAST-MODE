// Test file for BEAST MODE Extension
// Open this file and try the extension commands!

function calculateSum(a: number, b: number): number {
  return a + b;
}

function processData(data: string[]): number {
  let total = 0;
  for (let i = 0; i < data.length; i++) {
    total += data[i].length;
  }
  return total;
}

class TestClass {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  setValue(newValue: number): void {
    this.value = newValue;
  }
}

// Try these commands:
// 1. Cmd+Shift+P → "BEAST MODE: Analyze Code Quality"
// 2. Cmd+Shift+B → Get suggestions
// 3. Cmd+Shift+C → Open chat

