import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function verifyBarber(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id },
      include: { barber: true },
    });
    
    if (!user || user.role !== 'BARBER' || !user.isActive || !user.barber) {
      return null;
    }
    
    return { user, barber: user.barber };
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyBarber(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const { barber } = auth;
    const orderId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Decline reason is required' } },
        { status: 400 }
      );
    }

    // Verify order is assigned to this barber and pending acceptance
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        assignedBarberId: barber.id,
        jobStatus: 'PENDING_ACCEPTANCE',
      },
    });

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Order not found or not available for decline' } 
        },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        jobStatus: 'DECLINED',
        declineReason: reason.trim(),
      },
      include: {
        items: true,
      },
    });

    // Send email notification to admin about decline (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bbslimited.online';
    try {
      const emailHtml = emailTemplates.barberDeclined({
        adminEmail,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        barberName: auth.user.name,
        declineReason: updatedOrder.declineReason ?? undefined,
        city: updatedOrder.city,
        location: updatedOrder.location,
      });
      await emailService.sendEmail({
        to: adminEmail,
        subject: `Order Declined by Barber - ${updatedOrder.orderNumber}`,
        html: emailHtml,
        text: `Order ${updatedOrder.orderNumber} was declined by barber ${auth.user.name}. Customer: ${updatedOrder.customerName}. Location: ${updatedOrder.city}, ${updatedOrder.location}. Reason: ${updatedOrder.declineReason ?? 'Not provided'}. Please reassign at ${process.env.NEXT_PUBLIC_BASE_URL || 'https://app'}/admin/orders`,
      });
      console.log(`✅ Barber decline notification sent to admin for order ${updatedOrder.orderNumber}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send admin notification for barber decline:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          jobStatus: updatedOrder.jobStatus,
          declineReason: updatedOrder.declineReason,
        },
        message: 'Order declined successfully',
      },
    });
  } catch (error: any) {
    console.error('Decline order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to decline order',
        },
      },
      { status: 500 }
    );
  }
}
