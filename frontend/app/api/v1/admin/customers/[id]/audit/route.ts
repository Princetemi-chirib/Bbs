import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/customers/[id]/audit - Get audit log for a customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep access required.' } },
        { status: 401 }
      );
    }

    const customerId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const auditLogs = await prisma.customerAuditLog.findMany({
      where: { customerId },
      include: {
        customer: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get performer names
    const performerIds = [...new Set(auditLogs.map(log => log.performedBy))];
    const performers = await prisma.user.findMany({
      where: {
        id: { in: performerIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const performerMap = new Map(performers.map(p => [p.id, p]));

    return NextResponse.json({
      success: true,
      data: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        performedBy: performerMap.get(log.performedBy) || { id: log.performedBy, name: 'Unknown', email: '' },
        reason: log.reason,
        oldValue: log.oldValue,
        newValue: log.newValue,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get audit log error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch audit log',
        },
      },
      { status: 500 }
    );
  }
}
