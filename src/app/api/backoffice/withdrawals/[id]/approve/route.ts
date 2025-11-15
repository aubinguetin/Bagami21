import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocale, generateWithdrawalApprovalNotification } from '@/lib/notificationTranslations';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the withdrawal request
    const withdrawal = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal request has already been processed' },
        { status: 400 }
      );
    }

    // Update withdrawal status to completed
    const updatedWithdrawal = await prisma.transaction.update({
      where: { id },
      data: {
        status: 'completed',
        metadata: JSON.stringify({
          ...JSON.parse(withdrawal.metadata || '{}'),
          approvedBy: session.user.id,
          approvedAt: new Date().toISOString(),
        }),
      },
    });

    // Create notification for user about approval
    try {
      const locale = await getUserLocale(withdrawal.userId);
      const { title, message } = generateWithdrawalApprovalNotification(
        withdrawal.amount,
        withdrawal.currency,
        locale
      );
      
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          type: 'transaction',
          title,
          message,
          relatedId: id,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Failed to create withdrawal approval notification:', error);
    }

    // Create admin action log
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id!,
        action: 'APPROVE_WITHDRAWAL',
        targetId: id,
        targetType: 'Transaction',
        details: `Approved withdrawal of ${withdrawal.amount} XAF for user ${withdrawal.user.name || withdrawal.user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: 'Withdrawal approved successfully',
    });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
