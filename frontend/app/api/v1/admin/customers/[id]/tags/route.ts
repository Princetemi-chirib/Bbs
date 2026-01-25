import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/customers/[id]/tags - Get all tags for a customer
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
    const tags = await prisma.customerTag.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error: any) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch tags',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/customers/[id]/tags - Add a tag to a customer
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
    const { tag, color } = body;
    const customerId = params.id;

    if (!tag) {
      return NextResponse.json(
        { success: false, error: { message: 'Tag is required' } },
        { status: 400 }
      );
    }

    const customerTag = await prisma.customerTag.create({
      data: {
        customerId,
        tag,
        color: color || null,
        createdBy: user.id,
      },
    });

    // Create audit log
    await prisma.customerAuditLog.create({
      data: {
        customerId,
        action: 'ADD_TAG',
        performedBy: user.id,
        metadata: { tag },
      },
    });

    return NextResponse.json({
      success: true,
      data: customerTag,
      message: 'Tag added successfully',
    });
  } catch (error: any) {
    // Handle unique constraint violation (tag already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Tag already exists for this customer',
          },
        },
        { status: 400 }
      );
    }
    console.error('Add tag error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to add tag',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/customers/[id]/tags - Remove a tag from a customer
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const customerId = params.id;

    if (!tag) {
      return NextResponse.json(
        { success: false, error: { message: 'Tag is required' } },
        { status: 400 }
      );
    }

    await prisma.customerTag.deleteMany({
      where: {
        customerId,
        tag,
      },
    });

    // Create audit log
    await prisma.customerAuditLog.create({
      data: {
        customerId,
        action: 'REMOVE_TAG',
        performedBy: user.id,
        metadata: { tag },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tag removed successfully',
    });
  } catch (error: any) {
    console.error('Remove tag error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to remove tag',
        },
      },
      { status: 500 }
    );
  }
}
