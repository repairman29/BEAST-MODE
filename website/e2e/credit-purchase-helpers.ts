/**
 * Helper functions for credit purchase E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Authenticate user via localStorage (for BEAST MODE auth)
 */
export async function authenticateUser(page: Page, user: { id: string; email: string; name?: string }) {
  await page.addInitScript((userData) => {
    localStorage.setItem('beastModeUser', JSON.stringify(userData));
    localStorage.setItem('beastModeToken', 'test-token-' + Date.now());
  }, user);
  
  // Reload page to apply auth
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for Stripe checkout to load
 */
export async function waitForStripeCheckout(page: Page, timeout = 10000) {
  // Check if we're on Stripe domain
  const isStripe = page.url().includes('stripe.com');
  if (isStripe) {
    return true;
  }
  
  // Wait for Stripe iframe
  try {
    await page.waitForSelector('iframe[src*="stripe"], iframe[name*="stripe"]', { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fill Stripe test card details
 */
export async function fillStripeTestCard(page: Page) {
  const testCard = {
    number: '4242 4242 4242 4242',
    expiry: '12/25',
    cvc: '123',
    zip: '12345'
  };
  
  // Try multiple selectors for card number
  const cardSelectors = [
    'input[name="cardNumber"]',
    'input[placeholder*="card" i]',
    'input[id*="card"]',
    '#cardNumber',
    'input[autocomplete="cc-number"]',
    'input[data-elements-stable-field-name="cardNumber"]'
  ];
  
  for (const selector of cardSelectors) {
    try {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(testCard.number);
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  // Try iframe approach for Stripe Elements
  const iframes = page.locator('iframe');
  const iframeCount = await iframes.count();
  
  if (iframeCount > 0) {
    for (let i = 0; i < iframeCount; i++) {
      try {
        const frame = page.frameLocator('iframe').nth(i);
        const cardInput = frame.locator('input[name="cardNumber"], input[placeholder*="card" i]').first();
        if (await cardInput.count() > 0) {
          await cardInput.fill(testCard.number);
        }
      } catch (e) {
        // Continue
      }
    }
  }
  
  // Fill expiry
  const expirySelectors = [
    'input[name="expiry"], input[name="exp"]',
    'input[placeholder*="expir" i]',
    'input[id*="expir"]',
    '#cardExpiry',
    'input[autocomplete="cc-exp"]'
  ];
  
  for (const selector of expirySelectors) {
    try {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(testCard.expiry);
        break;
      }
    } catch (e) {
      // Continue
    }
  }
  
  // Fill CVC
  const cvcSelectors = [
    'input[name="cvc"], input[name="cvv"]',
    'input[placeholder*="cvc" i], input[placeholder*="cvv" i]',
    'input[id*="cvc"], input[id*="cvv"]',
    '#cardCvc',
    'input[autocomplete="cc-csc"]'
  ];
  
  for (const selector of cvcSelectors) {
    try {
      const input = page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        await input.fill(testCard.cvc);
        break;
      }
    } catch (e) {
      // Continue
    }
  }
}

/**
 * Submit Stripe checkout form
 */
export async function submitStripeCheckout(page: Page) {
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Pay")',
    'button:has-text("Complete")',
    'button:has-text("Purchase")',
    'button:has-text("Subscribe")',
    '[data-testid="submit"]',
    'button.submit-button'
  ];
  
  for (const selector of submitSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.count() > 0 && await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(2000);
        return true;
      }
    } catch (e) {
      // Continue
    }
  }
  
  return false;
}

/**
 * Get credit balance from API
 */
export async function getCreditBalance(page: Page, userId: string, baseUrl: string): Promise<number> {
  try {
    const response = await page.request.get(`${baseUrl}/api/credits/balance?userId=${userId}`);
    if (response.ok()) {
      const data = await response.json();
      return data.balance || 0;
    }
  } catch (e) {
    // API may not be available
  }
  return 0;
}
