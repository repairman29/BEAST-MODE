/**
 * Model Quantization Service
 * Reduces model size and improves inference speed
 * 
 * Month 6: Week 3 - Performance Optimization
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const logger = createLogger('ModelQuantization');

class ModelQuantization {
  constructor() {
    this.quantizedModels = {};
    this.quantizationConfig = {
      bits: 8, // 8-bit quantization
      preserveAccuracy: true,
      minValue: -128,
      maxValue: 127
    };
  }

  /**
   * Quantize a model
   */
  quantizeModel(model, modelName, options = {}) {
    try {
      logger.info(`Quantizing model: ${modelName}`);

      const config = { ...this.quantizationConfig, ...options };
      const quantized = this.quantizeWeights(model, config);

      const originalSize = this.calculateModelSize(model);
      const quantizedSize = this.calculateModelSize(quantized);
      const compressionRatio = (1 - quantizedSize / originalSize) * 100;

      this.quantizedModels[modelName] = {
        model: quantized,
        config,
        originalSize,
        quantizedSize,
        compressionRatio: compressionRatio.toFixed(2),
        timestamp: Date.now()
      };

      logger.info(`✅ Model quantized: ${compressionRatio.toFixed(2)}% size reduction`);
      return this.quantizedModels[modelName];
    } catch (error) {
      logger.error(`Quantization failed for ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Quantize model weights
   */
  quantizeWeights(model, config) {
    const quantized = JSON.parse(JSON.stringify(model)); // Deep copy

    // Quantize neural network layers
    if (quantized.layers) {
      for (const layer of quantized.layers) {
        if (layer.weights) {
          for (let i = 0; i < layer.weights.length; i++) {
            layer.weights[i] = this.quantizeArray(layer.weights[i], config);
          }
        }
        if (layer.biases) {
          layer.biases = this.quantizeArray(layer.biases, config);
        }
      }
    }

    // Quantize transformer layers
    if (quantized.embedding) {
      if (quantized.embedding.weights) {
        for (let i = 0; i < quantized.embedding.weights.length; i++) {
          quantized.embedding.weights[i] = this.quantizeArray(quantized.embedding.weights[i], config);
        }
      }
    }

    if (quantized.layers) {
      for (const layer of quantized.layers) {
        if (layer.attention) {
          this.quantizeAttention(layer.attention, config);
        }
        if (layer.feedForward) {
          this.quantizeFeedForward(layer.feedForward, config);
        }
      }
    }

    return quantized;
  }

  /**
   * Quantize an array of weights
   */
  quantizeArray(weights, config) {
    if (!Array.isArray(weights)) return weights;

    // Find min/max for scaling
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const scale = (max - min) / (config.maxValue - config.minValue);
    const zeroPoint = Math.round(-min / scale);

    // Quantize
    const quantized = weights.map(w => {
      const q = Math.round(w / scale + zeroPoint);
      return Math.max(config.minValue, Math.min(config.maxValue, q));
    });

    // Store scale and zero point for dequantization
    return {
      values: quantized,
      scale,
      zeroPoint,
      min,
      max
    };
  }

  /**
   * Quantize attention layer
   */
  quantizeAttention(attention, config) {
    if (attention.heads) {
      for (const head of attention.heads) {
        if (head.q && head.q.weights) {
          for (let i = 0; i < head.q.weights.length; i++) {
            head.q.weights[i] = this.quantizeArray(head.q.weights[i], config);
          }
        }
        if (head.k && head.k.weights) {
          for (let i = 0; i < head.k.weights.length; i++) {
            head.k.weights[i] = this.quantizeArray(head.k.weights[i], config);
          }
        }
        if (head.v && head.v.weights) {
          for (let i = 0; i < head.v.weights.length; i++) {
            head.v.weights[i] = this.quantizeArray(head.v.weights[i], config);
          }
        }
      }
    }
    if (attention.outputProj && attention.outputProj.weights) {
      for (let i = 0; i < attention.outputProj.weights.length; i++) {
        attention.outputProj.weights[i] = this.quantizeArray(attention.outputProj.weights[i], config);
      }
    }
  }

  /**
   * Quantize feed-forward layer
   */
  quantizeFeedForward(ff, config) {
    if (ff.linear1 && ff.linear1.weights) {
      for (let i = 0; i < ff.linear1.weights.length; i++) {
        ff.linear1.weights[i] = this.quantizeArray(ff.linear1.weights[i], config);
      }
    }
    if (ff.linear2 && ff.linear2.weights) {
      for (let i = 0; i < ff.linear2.weights.length; i++) {
        ff.linear2.weights[i] = this.quantizeArray(ff.linear2.weights[i], config);
      }
    }
  }

  /**
   * Dequantize for prediction
   */
  dequantizeArray(quantized) {
    if (!quantized || !quantized.values) return quantized;

    const { values, scale, zeroPoint } = quantized;
    return values.map(q => (q - zeroPoint) * scale);
  }

  /**
   * Calculate model size (approximate)
   */
  calculateModelSize(model) {
    let size = 0;

    // Count weights in layers
    if (model.layers) {
      for (const layer of model.layers) {
        if (layer.weights) {
          for (const weight of layer.weights) {
            if (Array.isArray(weight)) {
              size += weight.length * 4; // 4 bytes per float32
            } else if (weight.values) {
              size += weight.values.length * 1; // 1 byte per int8
            }
          }
        }
        if (layer.biases) {
          if (Array.isArray(layer.biases)) {
            size += layer.biases.length * 4;
          } else if (layer.biases.values) {
            size += layer.biases.values.length * 1;
          }
        }
      }
    }

    return size;
  }

  /**
   * Get quantized model
   */
  getQuantizedModel(modelName) {
    return this.quantizedModels[modelName] || null;
  }

  /**
   * Get quantization stats
   */
  getQuantizationStats() {
    const stats = {
      totalModels: Object.keys(this.quantizedModels).length,
      models: {}
    };

    for (const [name, data] of Object.entries(this.quantizedModels)) {
      stats.models[name] = {
        compressionRatio: data.compressionRatio,
        originalSize: data.originalSize,
        quantizedSize: data.quantizedSize
      };
    }

    return stats;
  }
}

// Singleton instance
let instance = null;

function getModelQuantization() {
  if (!instance) {
    instance = new ModelQuantization();
  }
  return instance;
}

module.exports = {
  ModelQuantization,
  getModelQuantization
};

