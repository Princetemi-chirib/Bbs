import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/settings/integrations
 * §19 Integrations: list third-party integrations (Google Analytics, Facebook Pixel, etc.).
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

    const integrations = await prisma.integration.findMany({
      orderBy: { type: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: integrations.map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type,
        isActive: i.isActive,
        lastSyncAt: i.lastSyncAt,
        configKeys: i.config ? Object.keys(i.config as Record<string, unknown>) : [],
      })),
    });
  } catch (e) {
    console.error('Integrations GET error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch integrations' } },
      { status: 500 }
    );
  }
}
