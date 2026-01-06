import { NextRequest, NextResponse } from 'next/server';
// Temporarily disabled - customer admin manager path needs fixing
// import { createCustomerAdminManager } from '@/../../../../../../shared-utils/admin-tools/customer-admin-manager';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  return NextResponse.json(
    { error: 'Customer API key deletion temporarily disabled - path fix needed' },
    { status: 503 }
  );
}

