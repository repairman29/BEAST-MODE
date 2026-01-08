/**
 * Model Selector for Cursor Extension
 * Manages custom model selection and configuration
 */

import axios from 'axios';
import * as vscode from 'vscode';

export interface Model {
  modelId: string;
  modelName: string;
  provider: string;
  type: 'provider' | 'custom';
  endpointUrl?: string;
  description?: string;
}

export class ModelSelector {
  private apiUrl: string;
  private selectedModel: string | null = null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.loadSelectedModel();
  }

  /**
   * Load selected model from settings
   */
  private loadSelectedModel() {
    const config = vscode.workspace.getConfiguration('beastMode');
    this.selectedModel = config.get<string>('selectedModel', null);
  }

  /**
   * Save selected model to settings
   */
  private saveSelectedModel(modelId: string) {
    const config = vscode.workspace.getConfiguration('beastMode');
    config.update('selectedModel', modelId, vscode.ConfigurationTarget.Global);
    this.selectedModel = modelId;
  }

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<Model[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/models/list`);
      if (response.data.success) {
        return response.data.models || [];
      }
      return [];
    } catch (error: any) {
      console.error('[Model Selector] Failed to fetch models:', error.message);
      return [];
    }
  }

  /**
   * Get currently selected model
   */
  getSelectedModel(): string | null {
    return this.selectedModel;
  }

  /**
   * Select a model
   */
  async selectModel(): Promise<string | null> {
    const models = await this.getAvailableModels();
    
    if (models.length === 0) {
      vscode.window.showWarningMessage('No models available. Please register a custom model first.');
      return null;
    }

    // Create quick pick items
    const items = models.map(model => ({
      label: model.modelName,
      description: `${model.type === 'custom' ? 'Custom' : 'Provider'}: ${model.modelId}`,
      detail: model.description || `${model.provider} model`,
      modelId: model.modelId
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a model to use',
      title: 'BEAST MODE Model Selection'
    });

    if (selected) {
      this.saveSelectedModel(selected.modelId);
      vscode.window.showInformationMessage(`Selected model: ${selected.label}`);
      return selected.modelId;
    }

    return null;
  }

  /**
   * Register a new custom model
   */
  async registerCustomModel(): Promise<boolean> {
    const modelName = await vscode.window.showInputBox({
      prompt: 'Enter a name for your custom model',
      placeHolder: 'My Local Llama'
    });

    if (!modelName) return false;

    const modelId = await vscode.window.showInputBox({
      prompt: 'Enter model ID (must start with "custom:")',
      placeHolder: 'custom:my-local-llama',
      validateInput: (value) => {
        if (!value.startsWith('custom:')) {
          return 'Model ID must start with "custom:"';
        }
        return null;
      }
    });

    if (!modelId) return false;

    const endpointUrl = await vscode.window.showInputBox({
      prompt: 'Enter endpoint URL',
      placeHolder: 'https://my-model.example.com/v1/chat/completions'
    });

    if (!endpointUrl) return false;

    const provider = await vscode.window.showQuickPick(
      [
        { label: 'OpenAI-Compatible', value: 'openai-compatible' },
        { label: 'Anthropic-Compatible', value: 'anthropic-compatible' },
        { label: 'Custom', value: 'custom' }
      ],
      {
        placeHolder: 'Select provider type'
      }
    );

    if (!provider) return false;

    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter API key (optional, press Enter to skip)',
      password: true
    });

    try {
      const response = await axios.post(`${this.apiUrl}/api/models/custom`, {
        modelName,
        modelId,
        endpointUrl,
        provider: provider.value,
        apiKey: apiKey || undefined
      });

      if (response.data.success) {
        vscode.window.showInformationMessage(`Custom model "${modelName}" registered successfully!`);
        return true;
      } else {
        vscode.window.showErrorMessage(`Failed to register model: ${response.data.error}`);
        return false;
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to register model: ${error.message}`);
      return false;
    }
  }

  /**
   * Show model selection status
   */
  async showModelStatus() {
    const selectedModel = this.getSelectedModel();
    const models = await this.getAvailableModels();
    const model = models.find(m => m.modelId === selectedModel);

    if (model) {
      vscode.window.showInformationMessage(
        `Current model: ${model.modelName} (${model.modelId})`
      );
    } else if (selectedModel) {
      vscode.window.showWarningMessage(
        `Selected model "${selectedModel}" not found. Please select a new model.`
      );
    } else {
      vscode.window.showInformationMessage('No model selected. Use "BEAST MODE: Select Model" to choose one.');
    }
  }
}
