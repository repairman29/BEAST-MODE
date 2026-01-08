"use strict";
// Test file for BEAST MODE Extension
// Open this file and try the extension commands!
function calculateSum(a, b) {
    return a + b;
}
function processData(data) {
    let total = 0;
    for (let i = 0; i < data.length; i++) {
        total += data[i].length;
    }
    return total;
}
class TestClass {
    constructor(value) {
        this.value = value;
    }
    getValue() {
        return this.value;
    }
    setValue(newValue) {
        this.value = newValue;
    }
}
// Try these commands:
// 1. Cmd+Shift+P → "BEAST MODE: Analyze Code Quality"
// 2. Cmd+Shift+B → Get suggestions
// 3. Cmd+Shift+C → Open chat
//# sourceMappingURL=test-file.js.map