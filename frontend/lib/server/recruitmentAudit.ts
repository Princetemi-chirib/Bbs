import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type RecruitmentAuditAction =
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELETED'
  | 'CREATED_MANUAL';

export async function logRecruitmentAction(params: {
  applicationId: string;
  action: RecruitmentAuditAction;
  performedById: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.barberApplicationAuditLog.create({
      data: {
        applicationId: params.applicationId,
        action: params.action,
        performedById: params.performedById,
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error('Failed to write recruitment audit log:', e);
  }
}
