import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocale, generateWithdrawalRejectionNotification } from '@/lib/notificationTranslations';

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
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

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

    // Perform rejection in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update withdrawal status to failed
      const updatedWithdrawal = await tx.transaction.update({
        where: { id },
        data: {
          status: 'failed',
          metadata: JSON.stringify({
            ...JSON.parse(withdrawal.metadata || '{}'),
            rejectedBy: session.user.id,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason,
          }),
        },
      });

      // Refund the amount back to user's wallet
      await tx.wallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balance: {
            increment: withdrawal.amount,
          },
        },
      });

      // Create refund transaction
      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'credit',
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          status: 'completed',
          description: `Withdrawal rejected - Amount refunded`,
          category: 'Bonus',
          referenceId: `REFUND-${withdrawal.referenceId}`,
          metadata: JSON.stringify({
            originalWithdrawalId: id,
            rejectionReason: reason,
          }),
        },
      });

      return updatedWithdrawal;
    });

    // Create notification for user about rejection
    try {
      const locale = await getUserLocale(withdrawal.userId);
      const { title, message } = generateWithdrawalRejectionNotification(
        withdrawal.amount,
        withdrawal.currency,
        reason,
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
      console.error('Failed to create withdrawal rejection notification:', error);
    }

    // Create admin action log
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id!,
        action: 'REJECT_WITHDRAWAL',
        targetId: id,
        targetType: 'Transaction',
        details: `Rejected withdrawal of ${withdrawal.amount} XAF for user ${withdrawal.user.name || withdrawal.user.email}. Reason: ${reason}`,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: result,
      message: 'Withdrawal rejected and amount refunded to user',
    });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
