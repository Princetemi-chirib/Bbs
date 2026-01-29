import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(_request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const [barbers, assignableUsers] = await Promise.all([
      prisma.barber.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          user: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'REP'] }, isActive: true },
        select: { id: true, name: true, email: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        barbers: barbers.map((b) => ({ id: b.id, name: b.user?.name ?? '—' })),
        assignableUsers: assignableUsers.map((u) => ({ id: u.id, name: u.name, email: u.email })),
        ratings: [1, 2, 3, 4, 5],
        sources: ['APP', 'GOOGLE', 'WALK_IN'] as const,
        statuses: ['NEW', 'RESPONDED', 'ESCALATED', 'RESOLVED', 'IGNORED'] as const,
      },
    });
  } catch (e: unknown) {
    console.error('Review filter options error:', e);
    return NextResponse.json(
      { success: false, error: { message: e instanceof Error ? e.message : 'Failed to load filter options' } },
      { status: 500 }
    );
  }
}
