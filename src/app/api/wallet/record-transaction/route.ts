import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocale, generateDirectPaymentNotification } from '@/lib/notificationTranslations';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, amount, description, category, type = 'debit', referenceId, metadata } = body;

    // Validate inputs
    if (!userId || !amount || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get or create wallet
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        balance: 0,
        currency: 'XOF'
      }
    });

    // Record the transaction (but don't modify wallet balance - this is just for record keeping)
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type, // 'debit' for direct payments
        category,
        description,
        status: 'completed',
        currency: 'XOF',
        referenceId: referenceId || undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }
    });

    // Create notification for direct payment (non-blocking)
    try {
      const locale = await getUserLocale(userId);
      const { title, message } = generateDirectPaymentNotification(
        type,
        category,
        amount,
        description,
        metadata,
        locale
      );

      await prisma.notification.create({
        data: {
          userId,
          type: 'transaction',
          title,
          message,
          relatedId: transaction.id,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Failed to create transaction notification:', error);
    }

    return NextResponse.json({
      success: true,
      transaction,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency
      }
    });

  } catch (error) {
    console.error('Error recording transaction:', error);
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 }
    );
  }
}
