import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    const withdrawalId = params.id;

    // Get withdrawal transaction with user info
    const withdrawal = await prisma.transaction.findUnique({
      where: { 
        id: withdrawalId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
          },
        },
      },
    });

    if (!withdrawal || withdrawal.category !== 'Withdrawal') {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // Parse metadata
    let metadata = null;
    if (withdrawal.metadata) {
      try {
        metadata = JSON.parse(withdrawal.metadata);
      } catch (e) {
        metadata = withdrawal.metadata;
      }
    }

    // Get user's wallet info
    const wallet = await prisma.wallet.findUnique({
      where: { userId: withdrawal.userId },
    });

    // Get related transactions (refund if rejected)
    let refundTransaction = null;
    if (withdrawal.status === 'failed' && withdrawal.referenceId) {
      refundTransaction = await prisma.transaction.findFirst({
        where: {
          userId: withdrawal.userId,
          category: 'Bonus',
          type: 'credit',
          amount: withdrawal.amount,
          createdAt: {
            gte: withdrawal.createdAt,
          },
          description: {
            contains: 'refund',
          },
        },
      });
    }

    // Get admin action logs
    const adminLogs = await prisma.adminAction.findMany({
      where: {
        targetType: 'withdrawal',
        targetId: withdrawalId,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      withdrawal: {
        ...withdrawal,
        metadata,
      },
      wallet,
      refundTransaction,
      adminLogs,
    });
  } catch (error) {
    console.error('Error fetching withdrawal details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
