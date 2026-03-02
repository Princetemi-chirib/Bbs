import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/app/api/v1/utils/auth';
import { logRecruitmentAction } from '@/lib/server/recruitmentAudit';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const applicationId = params.id;

    const application = await prisma.barberApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, status: true, name: true },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: { message: 'Application not found' } },
        { status: 404 }
      );
    }

    await logRecruitmentAction({
      applicationId: application.id,
      action: 'DELETED',
      performedById: admin.id,
      metadata: { applicationName: application.name, previousStatus: application.status },
    });

    await prisma.barberApplication.delete({
      where: { id: applicationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Recruitment record deleted',
    });
  } catch (error: any) {
    console.error('Delete recruitment error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete' } },
      { status: 500 }
    );
  }
}
