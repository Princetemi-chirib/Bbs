import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Public tracking endpoint for §2 Site/Traffic analytics.
 * Logs page views to TrafficEvent. No auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === 'string' ? body.url.trim().slice(0, 2048) : null;
    if (!url || url.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'url required' } }, { status: 400 });
    }
    const referrer = typeof body.referrer === 'string' ? body.referrer.trim().slice(0, 2048) : null;
    const device = typeof body.device === 'string' && /^(desktop|mobile|tablet)$/i.test(body.device)
      ? body.device.toLowerCase()
      : null;
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim().slice(0, 256) : null;

    await prisma.trafficEvent.create({
      data: {
        url,
        referrer: referrer || undefined,
        device: device || undefined,
        sessionId: sessionId || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to track' } },
      { status: 500 }
    );
  }
}
