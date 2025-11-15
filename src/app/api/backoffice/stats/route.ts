import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBackofficeAuth, hasPermission } from '@/lib/backofficeAuth';

export async function GET() {
  try {
    const auth = await checkBackofficeAuth();

    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view dashboard
    if (!hasPermission(auth, 'dashboard')) {
      return NextResponse.json({ error: 'Forbidden - No dashboard permission' }, { status: 403 });
    }

    // Calculate date for "recent" stats (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch all stats in parallel
    const [
      totalUsers,
      activeUsers,
      recentUsers,
      totalDeliveries,
      activeDeliveries,
      recentDeliveries,
      totalTransactions,
      platformFees,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (not suspended)
      prisma.user.count({
        where: { isActive: true },
      }),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),
      
      // Total deliveries
      prisma.delivery.count({
        where: { deletedAt: null },
      }),
      
      // Active deliveries (not deleted, status pending or in progress)
      prisma.delivery.count({
        where: {
          deletedAt: null,
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
      }),
      
      // Recent deliveries (last 7 days)
      prisma.delivery.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),
      
      // Total transactions
      prisma.transaction.count(),
      
      // Get all completed Delivery Income transactions to calculate platform fees from metadata
      prisma.transaction.findMany({
        where: {
          category: 'Delivery Income',
          status: 'completed',
        },
        select: {
          metadata: true,
        },
      }),
    ]);

    // Calculate total platform fees from Delivery Income metadata
    let totalRevenue = 0;
    platformFees.forEach((transaction) => {
      if (transaction.metadata) {
        try {
          const metadata = JSON.parse(transaction.metadata);
          if (metadata.platformFee) {
            totalRevenue += metadata.platformFee;
          }
        } catch (e) {
          // Skip if metadata is not valid JSON
        }
      }
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      recentUsers,
      totalDeliveries,
      activeDeliveries,
      recentDeliveries,
      totalTransactions,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
