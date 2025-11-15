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

    // Get total transactions count
    const totalTransactions = await prisma.transaction.count();

    // Get completed transactions count
    const completedCount = await prisma.transaction.count({
      where: { status: 'completed' },
    });

    // Get pending transactions count
    const pendingCount = await prisma.transaction.count({
      where: { status: 'pending' },
    });

    // Get failed transactions count
    const failedCount = await prisma.transaction.count({
      where: { status: 'failed' },
    });

    // Get total credits (completed only)
    const creditsResult = await prisma.transaction.aggregate({
      where: {
        type: 'credit',
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    // Get total debits (completed only)
    const debitsResult = await prisma.transaction.aggregate({
      where: {
        type: 'debit',
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    // Get all completed Delivery Income transactions to calculate platform fees from metadata
    const deliveryIncomes = await prisma.transaction.findMany({
      where: {
        category: 'Delivery Income',
        status: 'completed',
      },
      select: {
        metadata: true,
      },
    });

    // Calculate total platform fees from metadata
    let totalFees = 0;
    deliveryIncomes.forEach((transaction) => {
      if (transaction.metadata) {
        try {
          const metadata = JSON.parse(transaction.metadata);
          if (metadata.platformFee) {
            totalFees += metadata.platformFee;
          }
        } catch (e) {
          // Skip if metadata is not valid JSON
        }
      }
    });

    return NextResponse.json({
      totalTransactions,
      completedCount,
      pendingCount,
      failedCount,
      totalCredits: creditsResult._sum.amount || 0,
      totalDebits: debitsResult._sum.amount || 0,
      totalFees,
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
