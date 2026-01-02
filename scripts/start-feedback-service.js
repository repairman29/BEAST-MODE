/**
 * Start Feedback Service
 * Run feedback collection as a background service
 */

const { getFeedbackService } = require('../lib/services/feedbackService');

async function main() {
  console.log('🚀 Starting Feedback Service...\n');

  const service = getFeedbackService();
  
  // Start the service
  await service.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️  Stopping feedback service...');
    service.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n⏹️  Stopping feedback service...');
    service.stop();
    process.exit(0);
  });

  console.log('✅ Feedback service running (Press Ctrl+C to stop)');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

