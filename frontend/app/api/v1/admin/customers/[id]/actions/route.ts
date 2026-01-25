import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// POST /api/v1/admin/customers/[id]/actions - Perform actions on customer (flag, block, unblock, etc.)
export async function POST(
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

    const body = await request.json();
    const { action, reason, note } = body;
    const customerId = params.id;

    if (!action) {
      return NextResponse.json(
        { success: false, error: { message: 'Action is required' } },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer not found' } },
        { status: 404 }
      );
    }

    const oldStatus = (customer as any).status || 'ACTIVE';
    let newStatus = oldStatus;
    let actionType = action;

    switch (action) {
      case 'FLAG':
        newStatus = 'FLAGGED';
        actionType = 'FLAG';
        break;
      case 'BLOCK':
        newStatus = 'BLOCKED';
        actionType = 'BLOCK';
        // Also deactivate user account
        await prisma.user.update({
          where: { id: customer.userId },
          data: { isActive: false },
        });
        break;
      case 'UNBLOCK':
        newStatus = 'ACTIVE';
        actionType = 'UNBLOCK';
        // Reactivate user account
        await prisma.user.update({
          where: { id: customer.userId },
          data: { isActive: true },
        });
        break;
      case 'RESTORE':
        newStatus = 'ACTIVE';
        actionType = 'RESTORE';
        await prisma.user.update({
          where: { id: customer.userId },
          data: { isActive: true },
        });
        break;
      default:
        return NextResponse.json(
          { success: false, error: { message: 'Invalid action' } },
          { status: 400 }
        );
    }

    // Update customer status (try to update status field if it exists)
    let updateData: any = {};
    try {
      // Check if status field exists by trying to read it
      const testCustomer = await prisma.customer.findUnique({ where: { id: customerId } });
      if ((testCustomer as any).status !== undefined) {
        updateData.status = newStatus;
      }
    } catch (e) {
      // Status field doesn't exist yet
    }

    const updatedCustomer = updateData.status 
      ? await prisma.customer.update({
          where: { id: customerId },
          data: updateData,
        })
      : customer;

    // Create audit log (if relation exists)
    try {
      await prisma.customerAuditLog.create({
        data: {
          customerId,
          action: actionType,
          performedBy: user.id,
          reason: reason || null,
          oldValue: { status: oldStatus },
          newValue: { status: newStatus },
          metadata: { note: note || null },
        },
      });
    } catch (e) {
      // Audit log relation doesn't exist yet - migration not run
      console.log('Audit log not available:', e);
    }

    // Add note if provided (if relation exists)
    if (note) {
      try {
        await prisma.customerNote.create({
          data: {
            customerId,
            createdBy: user.id,
            note: note,
            isInternal: true,
          },
        });
      } catch (e) {
        // Notes relation doesn't exist yet - migration not run
        console.log('Notes not available:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: `Customer ${action.toLowerCase()}ed successfully`,
    });
  } catch (error: any) {
    console.error('Customer action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to perform action',
        },
      },
      { status: 500 }
    );
  }
}
