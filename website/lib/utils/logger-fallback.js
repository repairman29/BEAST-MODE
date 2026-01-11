/**
 * Logger Fallback
 * Provides logger when main logger is not available
 */
function createLogger(name) {
  return {
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  };
}

module.exports = { createLogger };
module.exports.default = { createLogger };
