import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Get available states and cities where active barbers are located
 * This endpoint is used to filter location options on the checkout page
 */
export async function GET(request: NextRequest) {
  try {
    // Get all active barbers with their locations
    const barbers = await prisma.barber.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        state: true,
        city: true,
        location: true,
      },
    });

    // Extract unique states and cities
    const statesMap = new Map<string, Set<string>>();

    barbers.forEach((barber: typeof barbers[0]) => {
      // Prefer state field, fallback to location field
      const state = barber.state || (barber.location ? barber.location.split(',')[0].trim() : null);
      const city = barber.city || barber.location || null;

      if (state) {
        if (!statesMap.has(state)) {
          statesMap.set(state, new Set<string>());
        }
        if (city) {
          statesMap.get(state)!.add(city);
        }
      }
    });

    // Convert Map to object format
    const locations: Record<string, string[]> = {};
    statesMap.forEach((cities: Set<string>, state: string) => {
      locations[state] = Array.from(cities).sort();
    });

    return NextResponse.json({
      success: true,
      data: {
        locations,
        states: Array.from(statesMap.keys()).sort(),
      },
    });
  } catch (error: any) {
    console.error('Get locations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch locations',
        },
      },
      { status: 500 }
    );
  }
}
