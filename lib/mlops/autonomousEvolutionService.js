/**
 * Autonomous Evolution Service with Database Integration
 * Uses new evolution tables for generations, candidates, selections, and metrics
 * 
 * Dog Fooding: Built using BEAST MODE
 */

const { createLogger } = require('../utils/logger');
const { getDatabaseWriter } = require('./databaseWriter');
const crypto = require('crypto');

const logger = createLogger('AutonomousEvolutionService');

class AutonomousEvolutionService {
  constructor() {
    this.databaseWriter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.initialized = true;
      logger.info('✅ Autonomous evolution service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize autonomous evolution service:', error);
      return false;
    }
  }

  /**
   * Create evolution generation
   */
  async createGeneration(userId, config) {
    if (!this.initialized) await this.initialize();

    const {
      populationSize,
      evolutionStrategy,
      fitnessFunction,
      mutationRate,
      crossoverRate,
      parentGenerationId
    } = config;

    try {
      // Get next generation number
      const lastGeneration = await this.databaseWriter.read({
        table: 'evolution_generations',
        orderBy: { generation_number: 'desc' },
        limit: 1
      });

      const generationNumber = lastGeneration && lastGeneration.length > 0
        ? lastGeneration[0].generation_number + 1
        : 1;

      const result = await this.databaseWriter.write({
        table: 'evolution_generations',
        data: {
          user_id: userId,
          generation_number: generationNumber,
          population_size: populationSize || 50,
          parent_generation_id: parentGenerationId,
          evolution_strategy: evolutionStrategy || 'genetic',
          fitness_function: fitnessFunction,
          mutation_rate: mutationRate || 0.1,
          crossover_rate: crossoverRate || 0.7,
          status: 'running'
        }
      });

      logger.info(`Created evolution generation ${generationNumber} (${result.id})`);
      return { success: true, id: result.id, generation: result, generationNumber };
    } catch (error) {
      logger.error('Failed to create generation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate evolution candidates
   */
  async generateCandidates(generationId, count) {
    if (!this.initialized) await this.initialize();

    try {
      // Get generation config
      const generation = await this.databaseWriter.read({
        table: 'evolution_generations',
        filter: { id: generationId }
      });

      if (!generation || generation.length === 0) {
        throw new Error('Generation not found');
      }

      const gen = generation[0];
      const candidates = [];

      // Get parent candidates if not first generation
      let parentCandidates = [];
      if (gen.parent_generation_id) {
        parentCandidates = await this.databaseWriter.read({
          table: 'evolution_candidates',
          filter: {
            generation_id: gen.parent_generation_id,
            selected_for_next_generation: true
          },
          orderBy: { fitness_score: 'desc' },
          limit: Math.floor(count / 2)
        });
      }

      // Generate candidates
      for (let i = 0; i < count; i++) {
        let candidateConfig;
        let parentIds = [];
        let mutationType = 'none';

        if (parentCandidates.length > 0 && Math.random() < gen.crossover_rate) {
          // Crossover from parents
          const parent1 = parentCandidates[Math.floor(Math.random() * parentCandidates.length)];
          const parent2 = parentCandidates[Math.floor(Math.random() * parentCandidates.length)];
          candidateConfig = this.crossover(parent1.candidate_config, parent2.candidate_config);
          parentIds = [parent1.id, parent2.id];
          mutationType = 'crossover';
        } else if (parentCandidates.length > 0) {
          // Mutate from parent
          const parent = parentCandidates[Math.floor(Math.random() * parentCandidates.length)];
          candidateConfig = this.mutate(parent.candidate_config, gen.mutation_rate, gen.evolution_strategy);
          parentIds = [parent.id];
          mutationType = this.getMutationType(gen.evolution_strategy);
        } else {
          // Random initialization
          candidateConfig = this.randomCandidate(gen.fitness_function);
        }

        // Hash candidate
        const candidateHash = this.hashCandidate(candidateConfig);

        // Check for duplicates
        const existing = await this.databaseWriter.read({
          table: 'evolution_candidates',
          filter: {
            generation_id: generationId,
            candidate_hash: candidateHash
          }
        });

        if (existing && existing.length > 0) {
          continue; // Skip duplicate
        }

        // Create candidate
        const candidate = await this.databaseWriter.write({
          table: 'evolution_candidates',
          data: {
            generation_id: generationId,
            candidate_config: candidateConfig,
            candidate_hash: candidateHash,
            parent_ids: parentIds,
            mutation_type: mutationType
          }
        });

        candidates.push(candidate);
      }

      logger.info(`Generated ${candidates.length} candidates for generation ${generationId}`);
      return { success: true, candidates: candidates.map(c => c.id), count: candidates.length };
    } catch (error) {
      logger.error('Failed to generate candidates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Evaluate candidate fitness
   */
  async evaluateCandidate(candidateId, fitnessScore, fitnessComponents = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const startTime = Date.now();

      await this.databaseWriter.update({
        table: 'evolution_candidates',
        filter: { id: candidateId },
        data: {
          fitness_score: fitnessScore,
          fitness_components: fitnessComponents,
          evaluated: true,
          evaluation_time_seconds: (Date.now() - startTime) / 1000
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to evaluate candidate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Select candidates for next generation
   */
  async selectCandidates(generationId, selectionMethod = 'tournament') {
    if (!this.initialized) await this.initialize();

    try {
      // Get all evaluated candidates
      const candidates = await this.databaseWriter.read({
        table: 'evolution_candidates',
        filter: {
          generation_id: generationId,
          evaluated: true
        },
        orderBy: { fitness_score: 'desc' }
      });

      if (!candidates || candidates.length === 0) {
        throw new Error('No evaluated candidates found');
      }

      // Select based on method
      const selected = this.performSelection(candidates, selectionMethod);

      // Mark selected candidates
      for (let i = 0; i < selected.length; i++) {
        const candidate = selected[i];
        await this.databaseWriter.write({
          table: 'evolution_selections',
          data: {
            generation_id: generationId,
            candidate_id: candidate.id,
            selection_method: selectionMethod,
            selection_rank: i + 1,
            fitness_at_selection: candidate.fitness_score,
            will_reproduce: i < Math.floor(selected.length * 0.5),
            will_mutate: Math.random() < 0.3
          }
        });

        await this.databaseWriter.update({
          table: 'evolution_candidates',
          filter: { id: candidate.id },
          data: {
            selected_for_next_generation: true
          }
        });
      }

      // Update generation metrics
      const bestFitness = selected[0].fitness_score;
      const avgFitness = selected.reduce((sum, c) => sum + c.fitness_score, 0) / selected.length;

      await this.databaseWriter.update({
        table: 'evolution_generations',
        filter: { id: generationId },
        data: {
          best_fitness: bestFitness,
          average_fitness: avgFitness,
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      });

      logger.info(`Selected ${selected.length} candidates for next generation`);
      return { success: true, selected: selected.map(c => c.id), count: selected.length };
    } catch (error) {
      logger.error('Failed to select candidates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform selection based on method
   */
  performSelection(candidates, method) {
    switch (method) {
      case 'tournament':
        return this.tournamentSelection(candidates);
      case 'roulette':
        return this.rouletteSelection(candidates);
      case 'rank':
        return this.rankSelection(candidates);
      case 'elitism':
        return this.elitismSelection(candidates);
      default:
        return this.tournamentSelection(candidates);
    }
  }

  /**
   * Tournament selection
   */
  tournamentSelection(candidates, tournamentSize = 3) {
    const selected = [];
    const topN = Math.floor(candidates.length * 0.5); // Select top 50%

    for (let i = 0; i < topN; i++) {
      const tournament = [];
      for (let j = 0; j < tournamentSize; j++) {
        tournament.push(candidates[Math.floor(Math.random() * candidates.length)]);
      }
      tournament.sort((a, b) => (b.fitness_score || 0) - (a.fitness_score || 0));
      selected.push(tournament[0]);
    }

    return selected;
  }

  /**
   * Roulette wheel selection
   */
  rouletteSelection(candidates) {
    const totalFitness = candidates.reduce((sum, c) => sum + (c.fitness_score || 0), 0);
    const selected = [];
    const topN = Math.floor(candidates.length * 0.5);

    for (let i = 0; i < topN; i++) {
      let random = Math.random() * totalFitness;
      for (const candidate of candidates) {
        random -= candidate.fitness_score || 0;
        if (random <= 0) {
          selected.push(candidate);
          break;
        }
      }
    }

    return selected;
  }

  /**
   * Rank-based selection
   */
  rankSelection(candidates) {
    // Sort by rank (fitness)
    candidates.sort((a, b) => (b.fitness_score || 0) - (a.fitness_score || 0));
    return candidates.slice(0, Math.floor(candidates.length * 0.5));
  }

  /**
   * Elitism selection
   */
  elitismSelection(candidates) {
    candidates.sort((a, b) => (b.fitness_score || 0) - (a.fitness_score || 0));
    return candidates.slice(0, Math.floor(candidates.length * 0.2)); // Top 20%
  }

  /**
   * Crossover operation
   */
  crossover(parent1, parent2) {
    // Placeholder - would perform actual crossover
    return {
      ...parent1,
      crossover: true,
      parent1: Object.keys(parent1).slice(0, Math.floor(Object.keys(parent1).length / 2)),
      parent2: Object.keys(parent2).slice(Math.floor(Object.keys(parent2).length / 2))
    };
  }

  /**
   * Mutation operation
   */
  mutate(candidate, mutationRate, strategy) {
    // Placeholder - would perform actual mutation
    return {
      ...candidate,
      mutated: true,
      mutationRate,
      strategy
    };
  }

  /**
   * Get mutation type based on strategy
   */
  getMutationType(strategy) {
    const types = {
      'genetic': 'point',
      'differential': 'gaussian',
      'particle_swarm': 'uniform',
      'neural_evolution': 'gaussian'
    };
    return types[strategy] || 'point';
  }

  /**
   * Random candidate generation
   */
  randomCandidate(fitnessFunction) {
    // Placeholder - would generate based on fitness function domain
    return {
      random: true,
      parameters: {}
    };
  }

  /**
   * Hash candidate config
   */
  hashCandidate(config) {
    const str = JSON.stringify(config);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Record evolution metrics
   */
  async recordMetrics(generationId, metrics) {
    if (!this.initialized) await this.initialize();

    try {
      for (const [metricName, metricValue] of Object.entries(metrics)) {
        await this.databaseWriter.write({
          table: 'evolution_metrics',
          data: {
            generation_id: generationId,
            metric_name: metricName,
            metric_value: metricValue
          }
        });
      }
      return { success: true };
    } catch (error) {
      logger.warn('Failed to record metrics:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let instance = null;

function getAutonomousEvolutionService() {
  if (!instance) {
    instance = new AutonomousEvolutionService();
  }
  return instance;
}

module.exports = {
  AutonomousEvolutionService,
  getAutonomousEvolutionService
};
