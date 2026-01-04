import { NextRequest, NextResponse } from 'next/server';
import { createCustomerAdminManager } from '@/../../../../shared-utils/admin-tools/customer-admin-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const manager = createCustomerAdminManager('beast-mode');
    const result = await manager.getCustomerUsage(userId, days);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

