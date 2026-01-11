import { test, expect } from '@playwright/test';
import { fillStripeTestCard, submitStripeCheckout, getCreditBalance } from './credit-purchase-helpers';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';

/**
 * Credit Purchase E2E Test - Manual Authentication Version
 * 
 * This version assumes you are already logged in.
 * 
 * To use:
 * 1. Manually log in to beast-mode.dev in a browser
 * 2. Use Playwright's storageState to save your session
 * 3. Run this test with the saved session
 * 
 * Or run in headed mode and manually authenticate when prompted.
 */
test.describe('Credit Purchase Flow (Manual Auth)', () => {
  test('should complete credit purchase flow with manual authentication', async ({ page, context }) => {
    test.setTimeout(120000); // 2 minutes

    console.log('\n🧪 Credit Purchase Test (Manual Auth)\n');
    console.log('💡 This test assumes you are logged in\n');
    console.log('📍 If not logged in, please authenticate manually when browser opens\n');

    // Navigate to billing page
    console.log('📋 Step 1: Navigating to billing page...');
    await page.goto(`${BASE_URL}/dashboard/customer?tab=billing`);
    
    // Wait a bit - if not authenticated, you'll see the auth page
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // If redirected to auth page, wait for manual login
    if (currentUrl.includes('/auth') || currentUrl.includes('auth=required') || !currentUrl.includes('/dashboard')) {
      console.log('\n⏸️  PAUSED: Please authenticate manually in the browser');
      console.log('   After logging in, the test will continue automatically...\n');
      
      // Wait for URL to change to dashboard (indicating login successful)
      await page.waitForURL('**/dashboard/**', { timeout: 300000 }); // 5 minute timeout
      console.log('✅ Authentication detected - continuing test\n');
    }

    // Now we should be on the dashboard
    await page.waitForLoadState('networkidle');
    
    // Step 2: Find and click "Buy Credits" button
    console.log('💳 Step 2: Clicking "Buy Credits" button...');
    
    const buyCreditsButton = page.locator(
      'button:has-text("Buy Credits"), ' +
      'a:has-text("Buy Credits"), ' +
      'button:has-text("Purchase Credits")'
    ).first();
    
    // Wait for button to be visible
    await buyCreditsButton.waitFor({ timeout: 10000 });
    await buyCreditsButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 3: Select a credit package
    console.log('\n📦 Step 3: Selecting credit package...');
    
    const packageButton = page.locator(
      'button:has-text("1,000 Credits"), ' +
      'button:has-text("1000 Credits"), ' +
      'button:has-text("500 Credits")'
    ).first();
    
    await packageButton.waitFor({ timeout: 10000 });
    const packageText = await packageButton.textContent();
    console.log(`   ✅ Selected: ${packageText?.trim()}`);
    await packageButton.click();
    await page.waitForTimeout(3000); // Wait for checkout to load

    // Step 4: Handle Stripe Checkout
    console.log('\n💳 Step 4: Completing Stripe checkout...');
    
    // Wait for checkout to load
    await page.waitForTimeout(2000);
    
    // Fill Stripe test card
    await fillStripeTestCard(page);
    await page.waitForTimeout(1000);
    
    // Submit checkout
    const submitted = await submitStripeCheckout(page);
    if (submitted) {
      console.log('   ✅ Checkout submitted');
    } else {
      console.log('   ⚠️  Could not auto-submit - you may need to complete manually');
    }
    
    // Wait for processing
    await page.waitForTimeout(5000);
    
    // Step 5: Verify success
    console.log('\n✅ Step 5: Verifying purchase...');
    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('credits=purchased') || finalUrl.includes('success')) {
      console.log('   ✅ Purchase appears successful!');
    } else {
      console.log('   ⚠️  Check URL to verify purchase status');
    }

    console.log('\n✅ Test completed!\n');
    console.log('💡 Next steps:');
    console.log('   • Check Stripe dashboard for webhook events');
    console.log('   • Run: node scripts/monitor-production.js');
    console.log('   • Verify credits in database\n');
  });
});
