import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/barber-applications/history
 * Returns recent recruitment audit logs across all applications (for "Staff recruitment history").
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const logs = await prisma.barberApplicationAuditLog.findMany({
      orderBy: { performedAt: 'desc' },
      take: limit,
      include: {
        application: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
    });

    const performerIds = [...new Set(logs.map((l) => l.performedById).filter(Boolean))] as string[];
    const users = performerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: performerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const data = logs.map((log) => ({
      id: log.id,
      applicationId: log.applicationId,
      applicationName: log.application?.name,
      applicationEmail: log.application?.email,
      applicationStatus: log.application?.status,
      action: log.action,
      performedAt: log.performedAt,
      performedBy: log.performedById ? userMap[log.performedById] ?? null : null,
      metadata: log.metadata,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Get recruitment history error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch history' } },
      { status: 500 }
    );
  }
}
