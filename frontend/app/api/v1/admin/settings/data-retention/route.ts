import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep, verifyAdmin, isViewOnly } from '../../utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/settings/data-retention
 * §17 Data retention: list policies.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const policies = await prisma.dataRetentionPolicy.findMany({
      orderBy: { entity: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: policies.map((p) => ({
        id: p.id,
        entity: p.entity,
        retentionMonths: p.retentionMonths,
        archive: p.archive,
      })),
    });
  } catch (e) {
    console.error('Data retention GET error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch data retention policies' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/settings/data-retention
 * Update or create a retention policy (Admin only; VIEWER cannot write).
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user || isViewOnly(user)) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized or view-only' } },
        { status: 401 }
      );
    }
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Admin only' } },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const entity = typeof body.entity === 'string' ? body.entity.trim() : null;
    const retentionMonths = typeof body.retentionMonths === 'number' ? body.retentionMonths : null;
    const archive = typeof body.archive === 'boolean' ? body.archive : false;

    if (!entity || retentionMonths == null || retentionMonths < 0) {
      return NextResponse.json(
        { success: false, error: { message: 'entity and retentionMonths required' } },
        { status: 400 }
      );
    }

    const policy = await prisma.dataRetentionPolicy.upsert({
      where: { entity },
      create: { entity, retentionMonths, archive },
      update: { retentionMonths, archive },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: policy.id,
        entity: policy.entity,
        retentionMonths: policy.retentionMonths,
        archive: policy.archive,
      },
    });
  } catch (e) {
    console.error('Data retention PUT error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update data retention policy' } },
      { status: 500 }
    );
  }
}
