import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/customers/[id]/notes - Get all notes for a customer
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
    const notes = await prisma.customerNote.findMany({
      where: { customerId },
      include: {
        customer: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch notes',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/customers/[id]/notes - Add a note to a customer
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
    const { note, isInternal = true } = body;
    const customerId = params.id;

    if (!note) {
      return NextResponse.json(
        { success: false, error: { message: 'Note is required' } },
        { status: 400 }
      );
    }

    const customerNote = await prisma.customerNote.create({
      data: {
        customerId,
        createdBy: user.id,
        note,
        isInternal,
      },
    });

    // Create audit log
    await prisma.customerAuditLog.create({
      data: {
        customerId,
        action: 'ADD_NOTE',
        performedBy: user.id,
        metadata: { note: note.substring(0, 100) },
      },
    });

    return NextResponse.json({
      success: true,
      data: customerNote,
      message: 'Note added successfully',
    });
  } catch (error: any) {
    console.error('Add note error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to add note',
        },
      },
      { status: 500 }
    );
  }
}
