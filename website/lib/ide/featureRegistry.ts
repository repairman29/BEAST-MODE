/**
 * Feature Registry
 * 
 * Manages and loads all generated IDE features
 */

// Import features metadata
// Using dynamic import to avoid build issues
let features: Array<{ id: string; title: string; category: string; file: string }> = [];

// Load features metadata at runtime
if (typeof window !== 'undefined') {
  // Client-side: load dynamically
  import('@/components/ide/features').then(module => {
    features = module.features || [];
  }).catch(() => {
    // Features will be loaded on demand
  });
} else {
  // Server-side: try to require
  try {
    const featuresModule = require('@/components/ide/features');
    features = featuresModule.features || [];
  } catch (error) {
    // Features will be loaded on demand
  }
}

export interface Feature {
  id: string;
  title: string;
  category: string;
  file: string;
  component?: React.ComponentType<any>;
}

export class FeatureRegistry {
  private static instance: FeatureRegistry;
  private features: Map<string, Feature> = new Map();
  private components: Map<string, React.ComponentType<any>> = new Map();

  private constructor() {
    this.loadFeatures();
  }

  static getInstance(): FeatureRegistry {
    if (!FeatureRegistry.instance) {
      FeatureRegistry.instance = new FeatureRegistry();
    }
    return FeatureRegistry.instance;
  }

  private loadFeatures() {
    // Load feature metadata
    features.forEach(feature => {
      this.features.set(feature.id, feature);
    });
  }

  async loadComponent(featureId: string): Promise<React.ComponentType<any> | null> {
    if (this.components.has(featureId)) {
      return this.components.get(featureId)!;
    }

    // For now, return null - features will be loaded on demand via explicit imports
    // This avoids webpack dynamic import issues
    return null;
  }

  getFeature(featureId: string): Feature | undefined {
    return this.features.get(featureId);
  }

  getFeaturesByCategory(category: string): Feature[] {
    return Array.from(this.features.values()).filter(
      f => f.category.includes(category)
    );
  }

  getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  getFeatureCount(): number {
    return this.features.size;
  }
}

export const featureRegistry = FeatureRegistry.getInstance();
