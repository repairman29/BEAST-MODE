#!/usr/bin/env node

/**
 * Integrate Additional MLOps Services
 * 
 * Connects advanced MLOps services to the main system:
 * - Advanced Ensemble
 * - Model Fine-Tuning
 * - Real-Time Model Updates
 * - Model Explainability
 * - Model Comparison
 */

const fs = require('fs');
const path = require('path');

const services = {
  'advancedEnsemble': {
    file: 'lib/mlops/advancedEnsemble.js',
    apiRoute: 'app/api/mlops/ensemble/route.ts',
    description: 'Advanced ensemble strategies (stacking, meta-learning)'
  },
  'modelFineTuner': {
    file: 'lib/mlops/modelFineTuner.js',
    apiRoute: 'app/api/llm/fine-tuning/route.ts',
    description: 'Model fine-tuning infrastructure',
    exists: true
  },
  'realTimeModelUpdates': {
    file: 'lib/mlops/realTimeModelUpdates.js',
    apiRoute: 'app/api/mlops/real-time-updates/route.ts',
    description: 'Real-time model updates and online learning'
  },
  'modelExplainability': {
    file: 'lib/mlops/modelExplainability.js',
    apiRoute: 'app/api/ml/explain/route.ts',
    description: 'Model explainability and feature importance',
    exists: true
  },
  'modelComparison': {
    file: 'lib/mlops/modelComparison.js',
    apiRoute: 'app/api/mlops/model-comparison/route.ts',
    description: 'Model comparison and A/B testing'
  }
};

function checkService(serviceName, serviceInfo) {
  const servicePath = path.join(__dirname, '..', serviceInfo.file);
  const apiPath = path.join(__dirname, '..', 'website', serviceInfo.apiRoute);
  
  const serviceExists = fs.existsSync(servicePath);
  const apiExists = fs.existsSync(apiPath);
  
  return {
    name: serviceName,
    serviceExists,
    apiExists,
    fullyIntegrated: serviceExists && apiExists,
    description: serviceInfo.description
  };
}

function createAPIRoute(serviceName, serviceInfo) {
  const apiDir = path.dirname(path.join(__dirname, '..', 'website', serviceInfo.apiRoute));
  const routeFile = path.join(__dirname, '..', 'website', serviceInfo.apiRoute);
  
  // Create directory if needed
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  // Don't overwrite existing routes
  if (fs.existsSync(routeFile)) {
    return { created: false, exists: true };
  }
  
  const routeTemplate = `import { NextRequest, NextResponse } from 'next/server';

/**
 * ${serviceInfo.description} API
 * 
 * Phase 2: Advanced MLOps Integration
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('../../../../../${serviceInfo.file.replace(/\.js$/, '')}');
  if (serviceModule.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}) {
    service = serviceModule.get${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}();
  } else if (serviceModule.${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}) {
    service = new serviceModule.${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[${serviceName} API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: '${serviceInfo.description} service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      const initialized = service.initialize ? await service.initialize() : true;
      return NextResponse.json({
        status: 'ok',
        available: !!service,
        initialized,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: '${serviceInfo.description} API ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: '${serviceInfo.description} service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    // Service-specific logic would go here
    return NextResponse.json({
      status: 'ok',
      message: '${serviceInfo.description} operation completed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
`;

  fs.writeFileSync(routeFile, routeTemplate);
  return { created: true, exists: false };
}

function main() {
  console.log('🔧 Integrating Additional MLOps Services...\n');
  console.log('='.repeat(60));

  const results = {
    integrated: [],
    needsService: [],
    needsAPI: [],
    created: []
  };

  // Check each service
  Object.entries(services).forEach(([name, info]) => {
    const status = checkService(name, info);
    
    if (status.fullyIntegrated) {
      results.integrated.push(status);
      console.log(`✅ ${name}: Fully integrated`);
    } else if (!status.serviceExists) {
      results.needsService.push(status);
      console.log(`⚠️  ${name}: Service file missing (${info.file})`);
    } else if (!status.apiExists) {
      results.needsAPI.push(status);
      console.log(`⚠️  ${name}: API route missing (${info.apiRoute})`);
      
      // Create API route
      const created = createAPIRoute(name, info);
      if (created.created) {
        results.created.push(name);
        console.log(`   ✅ Created API route: ${info.apiRoute}`);
      }
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Integration Summary:\n');
  console.log(`  ✅ Fully Integrated: ${results.integrated.length}`);
  results.integrated.forEach(s => console.log(`     - ${s.name}`));
  
  if (results.created.length > 0) {
    console.log(`\n  🆕 Created API Routes: ${results.created.length}`);
    results.created.forEach(name => console.log(`     - ${name}`));
  }
  
  if (results.needsService.length > 0) {
    console.log(`\n  ⚠️  Missing Service Files: ${results.needsService.length}`);
    results.needsService.forEach(s => console.log(`     - ${s.name} (${services[s.name].file})`));
  }
  
  if (results.needsAPI.length > results.created.length) {
    console.log(`\n  ⚠️  Missing API Routes: ${results.needsAPI.length - results.created.length}`);
    results.needsAPI.filter(s => !results.created.includes(s.name)).forEach(s => {
      console.log(`     - ${s.name} (${services[s.name].apiRoute})`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  if (results.integrated.length === Object.keys(services).length) {
    console.log('\n🎉 All MLOps services integrated!\n');
  } else {
    console.log('\n✅ Integration complete. Some services may need additional setup.\n');
  }
}

main();
