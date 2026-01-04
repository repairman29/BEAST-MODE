/**
 * Test Utilities for BEAST MODE Product Tests
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

/**
 * Custom render with providers
 */
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

export * from '@testing-library/react'
export { customRender as render }

/**
 * Wait utility
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

