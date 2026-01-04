import { NextRequest, NextResponse } from 'next/server';
import { createCustomerAdminManager } from '@/../../../../../../shared-utils/admin-tools/customer-admin-manager';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const { userId } = await request.json();
    const { keyId } = params;

    if (!userId || !keyId) {
      return NextResponse.json(
        { error: 'userId and keyId are required' },
        { status: 400 }
      );
    }

    const manager = createCustomerAdminManager('beast-mode');
    const result = await manager.revokeCustomerAPIKey(userId, keyId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

