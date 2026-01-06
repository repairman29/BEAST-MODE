import { NextRequest, NextResponse } from 'next/server';
// Temporarily disabled - customer admin manager path needs fixing
// import { createCustomerAdminManager } from '@/../../../../shared-utils/admin-tools/customer-admin-manager';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Customer usage API temporarily disabled - path fix needed' },
    { status: 503 }
  );
}

