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

    const [barbers, cities, productCategories, serviceCategories, productTitles] = await Promise.all([
      prisma.barber.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          user: { select: { name: true } },
        },
      }),
      prisma.order.findMany({
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      }),
      prisma.service.findMany({
        select: { category: true },
        distinct: ['category'],
      }),
      prisma.orderItem.findMany({
        select: { title: true },
        distinct: ['title'],
        take: 200,
      }),
    ]);

    const locations = cities.map((c) => c.city).filter(Boolean).sort();
    const categories = [
      ...new Set([
        ...productCategories.map((c) => c.category),
        ...serviceCategories.map((c) => c.category),
      ]),
    ].sort();
    const services = productTitles.map((t) => t.title).filter(Boolean).sort();

    return NextResponse.json({
      success: true,
      data: {
        barbers: barbers.map((b) => ({ id: b.id, name: b.user.name })),
        locations,
        categories,
        services,
      },
    });
  } catch (e: any) {
    console.error('Filter options error:', e);
    return NextResponse.json(
      { success: false, error: { message: e?.message || 'Failed to load filter options' } },
      { status: 500 }
    );
  }
}





