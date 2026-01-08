/**
 * Simple logger utility
 * Creates loggers with consistent formatting
 */

function createLogger(name) {
  return {
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => {
      if (process.env.DEBUG) {
        console.log(`[${name}]`, ...args);
      }
    }
  };
}

module.exports = {
  createLogger
};
