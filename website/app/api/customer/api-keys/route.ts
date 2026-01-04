import { NextRequest, NextResponse } from 'next/server';
import { createCustomerAdminManager } from '@/../../../../shared-utils/admin-tools/customer-admin-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const manager = createCustomerAdminManager('beast-mode');
    const result = await manager.getCustomerAPIKeys(userId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, provider, keyName } = await request.json();

    if (!userId || !provider || !keyName) {
      return NextResponse.json(
        { error: 'userId, provider, and keyName are required' },
        { status: 400 }
      );
    }

    const manager = createCustomerAdminManager('beast-mode');
    const result = await manager.createCustomerAPIKey(userId, provider, keyName);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

