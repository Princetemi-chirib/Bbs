import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : 'UNKNOWN';
    const entity = typeof body.entity === 'string' ? body.entity : null;
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : null;

    await prisma.analyticsAuditLog.create({
      data: {
        userId: user.id,
        action,
        entity,
        metadata,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to record audit' } },
      { status: 500 }
    );
  }
}
