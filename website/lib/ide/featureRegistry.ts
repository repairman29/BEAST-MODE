/**
 * Feature Registry
 * 
 * Manages and loads all generated IDE features
 */

import { features } from '@/components/ide/features';

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

    try {
      // Dynamically import the component
      const module = await import(`@/components/ide/features/${featureId.replace(/[^a-zA-Z0-9]/g, '_')}`);
      const component = module.default;
      
      if (component) {
        this.components.set(featureId, component);
        return component;
      }
    } catch (error) {
      console.error(`Failed to load feature ${featureId}:`, error);
    }

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
