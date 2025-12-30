/**
 * Shared Missions Storage
 * 
 * In-memory storage for missions (replace with database in production)
 */

export let missions: any[] = [
  {
    id: '1',
    name: 'Code Refactoring',
    description: 'Improve code quality and maintainability',
    type: 'code-refactor',
    priority: 'high',
    status: 'planning',
    progress: 0,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tasks: [
      { id: '1', name: 'Identify code smells', status: 'pending', progress: 0 },
      { id: '2', name: 'Refactor large components', status: 'pending', progress: 0 },
      { id: '3', name: 'Improve test coverage', status: 'pending', progress: 0 }
    ],
    createdAt: new Date().toISOString()
  }
];

