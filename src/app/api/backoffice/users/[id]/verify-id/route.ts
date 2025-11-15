import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocale, generateIdVerificationNotification } from '@/lib/notificationTranslations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;
    const body = await request.json();
    const { documentId, status } = body;

    if (!documentId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request. documentId and status (approved/rejected) are required.' },
        { status: 400 }
      );
    }

    // Update the ID document verification status
    const updatedDocument = await prisma.idDocument.update({
      where: {
        id: documentId,
        userId: userId, // Ensure the document belongs to this user
      },
      data: {
        verificationStatus: status,
      },
    });

    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: `id_verification_${status}`,
        targetType: 'IdDocument',
        targetId: documentId,
        details: JSON.stringify({
          userId,
          documentType: updatedDocument.documentType,
          status,
        }),
      },
    });

    // Create notification for user about ID verification status
    try {
      const locale = await getUserLocale(userId);
      const { title, message } = generateIdVerificationNotification(
        status as 'approved' | 'rejected',
        updatedDocument.documentType as 'national_id' | 'passport',
        locale
      );

      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'id_verification',
          title,
          message,
          relatedId: documentId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Failed to create ID verification notification:', error);
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Error updating ID verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
