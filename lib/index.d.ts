/**
 * BEAST MODE TypeScript Definitions
 * Type definitions for @beast-mode/core package
 */

export interface BeastModeOptions {
  debug?: boolean;
  enterprise?: boolean;
  marketplace?: boolean;
  intelligence?: boolean;
  oracle?: boolean | OracleOptions;
  codeRoach?: boolean | CodeRoachOptions;
  daisyChain?: boolean | DaisyChainOptions;
  conversationalAI?: boolean | ConversationalAIOptions;
  healthMonitor?: boolean | HealthMonitorOptions;
  missionGuidance?: boolean | MissionGuidanceOptions;
  deploymentOrchestrator?: boolean | DeploymentOrchestratorOptions;
}

export interface OracleOptions {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
}

export interface CodeRoachOptions {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
}

export interface DaisyChainOptions {
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
}

export interface ConversationalAIOptions {
  enabled?: boolean;
  model?: string;
  temperature?: number;
}

export interface HealthMonitorOptions {
  enabled?: boolean;
  interval?: number;
  alerts?: boolean;
}

export interface MissionGuidanceOptions {
  enabled?: boolean;
  autoRecommend?: boolean;
}

export interface DeploymentOrchestratorOptions {
  enabled?: boolean;
  platforms?: string[];
}

export interface QualityScore {
  overall: number;
  grade: string;
  breakdown: Record<string, any>;
  issues: QualityIssue[];
  timestamp: string;
}

export interface QualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  validator: string;
  file?: string;
  line?: number;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating?: number;
  downloads?: number;
  version: string;
  publisher: string;
  publishedAt: string;
  tags?: string[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Deployment {
  id: string;
  platform: string;
  environment: string;
  status: 'pending' | 'in-progress' | 'success' | 'failed';
  startedAt: string;
  completedAt?: string;
  url?: string;
}

export class BeastMode {
  constructor(options?: BeastModeOptions);
  
  initialize(): Promise<this>;
  getQualityScore(options?: QualityOptions): Promise<QualityScore>;
  predict(options?: PredictOptions): Promise<any>;
  browseMarketplace(options?: MarketplaceOptions): Promise<MarketplaceItem[]>;
  installFromMarketplace(id: string, options?: InstallOptions): Promise<any>;
  createMission(missionData: MissionData): Promise<Mission>;
  startMission(missionId: string): Promise<Mission>;
  getActiveMissions(): Mission[];
  getMissionRecommendations(projectContext: any): Promise<Mission[]>;
  deployApplication(config: DeploymentConfig): Promise<Deployment>;
  getActiveDeployments(): Deployment[];
  getDeploymentHistory(limit?: number): Deployment[];
  getSupportedPlatforms(): string[];
  getSupportedStrategies(): string[];
  getComponent(name: string): any;
  shutdown(): Promise<void>;
  
  readonly info: BeastModeInfo;
  readonly initialized: boolean;
}

export interface QualityOptions {
  scope?: 'repo' | 'team' | 'org';
  detailed?: boolean;
  cache?: boolean;
}

export interface PredictOptions {
  metric?: 'quality' | 'velocity' | 'bugs';
  horizon?: number;
}

export interface MarketplaceOptions {
  category?: string;
  type?: 'plugin' | 'integration' | 'tool';
  search?: string;
}

export interface InstallOptions {
  version?: string;
  licenseKey?: string;
  autoUpdate?: boolean;
}

export interface MissionData {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'railway' | 'aws' | 'gcp' | 'azure';
  environment: 'development' | 'staging' | 'production';
  strategy?: 'blue-green' | 'canary' | 'rolling';
  rollbackOnFailure?: boolean;
}

export interface BeastModeInfo {
  name: string;
  version: string;
  description: string;
  tagline: string;
  capabilities: string[];
  economicImpact: {
    annualSavings: number;
    errorReduction: number;
    predictionAccuracy: number;
    marketplacePotential: number;
  };
  initialized: boolean;
  components: string[];
  options: BeastModeOptions;
}

export function createBeastMode(options?: BeastModeOptions): BeastMode;
export function initializeBeastMode(options?: BeastModeOptions): Promise<BeastMode>;

export const info: BeastModeInfo;

// Re-exported components
export const QualityEngine: any;
export const OrganizationQualityIntelligence: any;
export const PredictiveDevelopmentAnalytics: any;
export const AutomatedTeamOptimization: any;
export const EnterpriseKnowledgeManagement: any;
export const PluginMarketplace: any;
export const IntegrationMarketplace: any;
export const ToolDiscovery: any;
export const MonetizationPrograms: any;

