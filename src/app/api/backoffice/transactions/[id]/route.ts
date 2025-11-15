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

    const transactionId = params.id;

    // Get transaction with user and related delivery info
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Parse metadata if it exists
    let metadata = null;
    if (transaction.metadata) {
      try {
        metadata = JSON.parse(transaction.metadata);
      } catch (e) {
        metadata = transaction.metadata;
      }
    }

    // Get delivery info if this is a delivery-related transaction
    let delivery = null;
    if (transaction.referenceId && transaction.referenceId.startsWith('DEL-')) {
      const deliveryId = transaction.referenceId.replace('DEL-', '');
      delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              countryCode: true,
            },
          },
          receiver: {
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
    }

    // Get related transactions (same reference ID)
    let relatedTransactions: any[] = [];
    if (transaction.referenceId) {
      relatedTransactions = await prisma.transaction.findMany({
        where: {
          referenceId: transaction.referenceId,
          id: { not: transactionId },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      transaction: {
        ...transaction,
        metadata,
      },
      delivery,
      relatedTransactions,
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
