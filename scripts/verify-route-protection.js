#!/usr/bin/env node

/**
 * Verify Route Protection and Payment Integration
 * 
 * Checks that routes are properly protected and payment pages are wired to Stripe
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../website/app');
const apiDir = path.join(__dirname, '../website/app/api');

// Routes that should be protected
const protectedRoutes = [
  '/admin',
  '/admin/analytics',
  '/admin/monitoring',
  '/admin/performance',
  '/admin/productivity',
  '/admin/bug-tracking',
  '/admin/feedback',
  '/admin/cost-tracking',
  '/dashboard',
  '/dashboard/customer',
];

// Payment-related routes
const paymentRoutes = [
  '/pricing',
  '/api/stripe/create-checkout',
  '/api/stripe/webhook',
  '/api/user/subscription',
];

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFileContent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function checkRouteProtection(route) {
  const routeParts = route.split('/').filter(Boolean);
  const pagePath = path.join(appDir, ...routeParts, 'page.tsx');
  const layoutPath = path.join(appDir, ...routeParts, 'layout.tsx');
  
  // Check parent layouts for admin routes
  if (route.startsWith('/admin')) {
    const adminLayoutPath = path.join(appDir, 'admin', 'layout.tsx');
    const adminLayoutContent = readFileContent(adminLayoutPath);
    if (adminLayoutContent && adminLayoutContent.includes('isAdmin')) {
      return { exists: !!readFileContent(pagePath), protected: true };
    }
  }
  
  // Check parent layouts for dashboard routes
  if (route.startsWith('/dashboard')) {
    const dashboardLayoutPath = path.join(appDir, 'dashboard', 'layout.tsx');
    const dashboardLayoutContent = readFileContent(dashboardLayoutPath);
    if (dashboardLayoutContent && dashboardLayoutContent.includes('isAuthenticated')) {
      return { exists: !!readFileContent(pagePath), protected: true };
    }
  }
  
  const pageContent = readFileContent(pagePath);
  const layoutContent = readFileContent(layoutPath);
  
  const hasAuth = 
    (pageContent && (pageContent.includes('isAdmin') || pageContent.includes('requireAuth') || pageContent.includes('getUser'))) ||
    (layoutContent && (layoutContent.includes('isAdmin') || layoutContent.includes('requireAuth')));
  
  return { exists: !!pageContent, protected: hasAuth };
}

function checkPaymentIntegration() {
  const pricingPage = readFileContent(path.join(appDir, 'pricing/page.tsx'));
  const checkoutRoute = readFileContent(path.join(apiDir, 'stripe/create-checkout/route.ts'));
  const webhookRoute = readFileContent(path.join(apiDir, 'stripe/webhook/route.ts'));
  const subscriptionRoute = readFileContent(path.join(apiDir, 'user/subscription/route.ts'));
  
  const pricingHasStripe = pricingPage && (
    pricingPage.includes('/api/stripe/create-checkout') ||
    pricingPage.includes('stripe') ||
    pricingPage.includes('checkout')
  );
  
  const checkoutExists = !!checkoutRoute;
  const webhookExists = !!webhookRoute;
  const subscriptionExists = !!subscriptionRoute;
  
  const checkoutHasStripe = checkoutRoute && (
    checkoutRoute.includes('stripe') ||
    checkoutRoute.includes('Stripe') ||
    checkoutRoute.includes('checkout.sessions.create')
  );
  
  // Check if webhook handles events - look for switch cases or handler functions
  // Check if webhook handles events - look for switch statement with cases
  const hasSwitchCase = webhookRoute && webhookRoute.includes('switch') && webhookRoute.includes('case');
  const hasEventHandlers = webhookRoute && (
    webhookRoute.includes('handleCheckoutSessionCompleted') ||
    webhookRoute.includes('handleSubscriptionUpdated') ||
    webhookRoute.includes('handlePaymentSucceeded') ||
    webhookRoute.includes('handlePaymentFailed') ||
    webhookRoute.includes('handleSubscriptionDeleted')
  );
  const hasEventCases = webhookRoute && (
    webhookRoute.includes("case 'checkout.session.completed'") ||
    webhookRoute.includes("case 'customer.subscription.updated'") ||
    webhookRoute.includes("case 'customer.subscription.deleted'") ||
    webhookRoute.includes("case 'invoice.payment_succeeded'") ||
    webhookRoute.includes("case 'invoice.payment_failed'")
  );
  
  const webhookHandlesEvents = webhookRoute && (hasSwitchCase || hasEventHandlers || hasEventCases);
  
  return {
    pricingPage: { exists: !!pricingPage, hasStripe: pricingHasStripe },
    checkoutRoute: { exists: checkoutExists, hasStripe: checkoutHasStripe },
    webhookRoute: { exists: webhookExists, handlesEvents: webhookHandlesEvents },
    subscriptionRoute: { exists: subscriptionExists }
  };
}

async function verifyRoutes() {
  console.log('\n🔒 Verifying Route Protection and Payment Integration\n');
  console.log('='.repeat(60));
  
  // Check middleware
  console.log('\n🛡️  Checking Middleware:\n');
  const middlewarePath = path.join(__dirname, '../website/middleware.ts');
  const middlewareExists = checkFileExists(middlewarePath);
  const middlewareContent = readFileContent(middlewarePath);
  
  if (middlewareExists) {
    console.log('   ✅ Middleware exists');
    if (middlewareContent) {
      const hasAuth = middlewareContent.includes('auth') || middlewareContent.includes('protect');
      console.log(`   ${hasAuth ? '✅' : '⚠️ '} Middleware ${hasAuth ? 'has' : 'may need'} auth protection`);
    }
  } else {
    console.log('   ⚠️  No middleware.ts found');
  }
  
  // Check protected routes
  console.log('\n🔐 Checking Protected Routes:\n');
  const protectionResults = {};
  
  protectedRoutes.forEach(route => {
    const result = checkRouteProtection(route);
    protectionResults[route] = result;
    const icon = result.protected ? '✅' : (result.exists ? '⚠️ ' : '❌');
    console.log(`   ${icon} ${route} ${result.protected ? '(protected)' : result.exists ? '(exists, not protected)' : '(missing)'}`);
  });
  
  // Check payment integration
  console.log('\n💳 Checking Payment Integration:\n');
  const paymentResults = checkPaymentIntegration();
  
  console.log(`   ${paymentResults.pricingPage.exists ? '✅' : '❌'} Pricing page: ${paymentResults.pricingPage.exists ? 'exists' : 'missing'}`);
  if (paymentResults.pricingPage.exists) {
    console.log(`   ${paymentResults.pricingPage.hasStripe ? '✅' : '⚠️ '} Pricing page ${paymentResults.pricingPage.hasStripe ? 'wired to Stripe' : 'not wired to Stripe'}`);
  }
  
  console.log(`   ${paymentResults.checkoutRoute.exists ? '✅' : '❌'} Checkout route: ${paymentResults.checkoutRoute.exists ? 'exists' : 'missing'}`);
  if (paymentResults.checkoutRoute.exists) {
    console.log(`   ${paymentResults.checkoutRoute.hasStripe ? '✅' : '⚠️ '} Checkout route ${paymentResults.checkoutRoute.hasStripe ? 'uses Stripe' : 'not using Stripe'}`);
  }
  
  console.log(`   ${paymentResults.webhookRoute.exists ? '✅' : '❌'} Webhook route: ${paymentResults.webhookRoute.exists ? 'exists' : 'missing'}`);
  if (paymentResults.webhookRoute.exists) {
    // The webhook code clearly handles events (verified manually)
    // The pattern matching may have false negatives, so we'll trust the code exists
    const webhookContent = readFileContent(path.join(apiDir, 'stripe/webhook/route.ts'));
    const actuallyHandlesEvents = webhookContent && (
      webhookContent.includes("case 'checkout.session.completed'") ||
      webhookContent.includes('handleCheckoutSessionCompleted')
    );
    console.log(`   ${actuallyHandlesEvents ? '✅' : '⚠️ '} Webhook ${actuallyHandlesEvents ? 'handles events' : 'may not handle events'}`);
    paymentResults.webhookHandlesEvents = actuallyHandlesEvents;
  }
  
  console.log(`   ${paymentResults.subscriptionRoute.exists ? '✅' : '❌'} Subscription route: ${paymentResults.subscriptionRoute.exists ? 'exists' : 'missing'}`);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  
  const protectedCount = Object.values(protectionResults).filter(r => r.protected).length;
  const unprotectedCount = Object.values(protectionResults).filter(r => r.exists && !r.protected).length;
  
  console.log(`   🔐 Protected Routes: ${protectedCount}/${protectedRoutes.length}`);
  console.log(`   ⚠️  Unprotected Routes: ${unprotectedCount}`);
  
  const paymentComplete = 
    paymentResults.pricingPage.exists &&
    paymentResults.pricingPage.hasStripe &&
    paymentResults.checkoutRoute.exists &&
    paymentResults.checkoutRoute.hasStripe &&
    paymentResults.webhookRoute.exists &&
    paymentResults.webhookHandlesEvents;
  
  console.log(`   💳 Payment Integration: ${paymentComplete ? '✅ Complete' : '⚠️  Needs attention'}`);
  
  if (unprotectedCount > 0) {
    console.log('\n⚠️  Unprotected Routes:');
    Object.entries(protectionResults).forEach(([route, result]) => {
      if (result.exists && !result.protected) {
        console.log(`   • ${route}`);
      }
    });
  }
  
  if (!paymentComplete) {
    console.log('\n⚠️  Payment Integration Issues:');
    if (!paymentResults.pricingPage.exists) {
      console.log('   • Pricing page missing');
    }
    if (!paymentResults.pricingPage.hasStripe) {
      console.log('   • Pricing page not wired to Stripe');
    }
    if (!paymentResults.checkoutRoute.exists) {
      console.log('   • Checkout route missing');
    }
    if (!paymentResults.checkoutRoute.hasStripe) {
      console.log('   • Checkout route not using Stripe');
    }
    if (!paymentResults.webhookRoute.exists) {
      console.log('   • Webhook route missing');
    }
    if (!paymentResults.webhookHandlesEvents) {
      console.log('   • Webhook may not handle events properly');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (protectedCount === protectedRoutes.length && paymentComplete) {
    console.log('\n✅ All routes are protected and payments are wired!\n');
  } else {
    console.log('\n⚠️  Some routes need attention\n');
  }
  
  return { protectionResults, paymentResults };
}

if (require.main === module) {
  verifyRoutes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyRoutes };
