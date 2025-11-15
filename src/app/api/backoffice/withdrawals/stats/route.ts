import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get withdrawal statistics
    const [totalPending, totalCompleted, totalFailed, pendingAmountResult] = await Promise.all([
      prisma.transaction.count({
        where: {
          category: 'Withdrawal',
          status: 'pending',
        },
      }),
      prisma.transaction.count({
        where: {
          category: 'Withdrawal',
          status: 'completed',
        },
      }),
      prisma.transaction.count({
        where: {
          category: 'Withdrawal',
          status: 'failed',
        },
      }),
      prisma.transaction.aggregate({
        where: {
          category: 'Withdrawal',
          status: 'pending',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalPending,
      totalCompleted,
      totalFailed,
      pendingAmount: pendingAmountResult._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error fetching withdrawal stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
