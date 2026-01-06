import { NextRequest, NextResponse } from 'next/server';
// Temporarily disabled - customer admin manager path needs fixing
// import { createCustomerAdminManager } from '@/../../../../shared-utils/admin-tools/customer-admin-manager';

export async function GET(request: NextRequest) {
  // Temporarily return not implemented to fix build
  return NextResponse.json(
    { error: 'Customer billing API temporarily disabled - path fix needed' },
    { status: 503 }
  );
  
  /* Original code - re-enable after fixing import path:
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const manager = createCustomerAdminManager('echeo');
    const result = await manager.getCustomerBilling(userId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  */
}

