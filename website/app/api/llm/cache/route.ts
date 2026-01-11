/**
 * LLM Cache Management API
 * Manages caching for LLM requests
 */

import { NextRequest, NextResponse } from 'next/server';
// Use dynamic require to avoid build-time errors
let cache: any = null;

try {
  const llmCacheModule = require('@/lib/mlops/llmCache');
  const getLLMCache = llmCacheModule.getLLMCache || llmCacheModule.default?.getLLMCache;
  if (getLLMCache) {
    cache = getLLMCache({ enabled: true });
  } else if (llmCacheModule.LLMCache) {
    cache = new llmCacheModule.LLMCache({ enabled: true });
  }
} catch (error) {
  console.warn('[LLM Cache API] Module not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    const stats = cache.getStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    cache.clear();
    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
