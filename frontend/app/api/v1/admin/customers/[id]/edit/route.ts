import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// PUT /api/v1/admin/customers/[id]/edit - Edit customer data (limited fields)
export async function PUT(
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
    const customerId = params.id;
    const {
      preferredBranch,
      preferredBarberId,
      allergies,
      servicePreferences,
      membershipType,
    } = body;

    // Only allow editing of limited fields
    const updateData: any = {};
    if (preferredBranch !== undefined) updateData.preferredBranch = preferredBranch;
    if (preferredBarberId !== undefined) updateData.preferredBarberId = preferredBarberId;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (servicePreferences !== undefined) updateData.servicePreferences = servicePreferences;
    if (membershipType !== undefined) updateData.membershipType = membershipType;

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    // Create audit log
    try {
      await prisma.customerAuditLog.create({
        data: {
          customerId,
          action: 'EDIT',
          performedBy: user.id,
          oldValue: {},
          newValue: updateData,
          metadata: { editedFields: Object.keys(updateData) },
        },
      });
    } catch (e) {
      // Audit log might not exist yet
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully',
    });
  } catch (error: any) {
    console.error('Edit customer error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update customer',
        },
      },
      { status: 500 }
    );
  }
}
