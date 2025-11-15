import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/checkUserActive';
import { getUserLocale, generateTransactionNotification } from '@/lib/notificationTranslations';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is suspended
    try {
      await requireActiveUser(session.user.id);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Your account has been suspended. Please contact customer service.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }

    const body = await request.json();
    const { amount, paymentMethod } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum amount is 100 FCFA' },
        { status: 400 }
      );
    }

    if (amount > 10000000) {
      return NextResponse.json(
        { error: 'Maximum amount is 10,000,000 FCFA per transaction' },
        { status: 400 }
      );
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Add money to wallet and create transaction
    // NOTE: This is a temporary implementation. Real payment gateway integration will be added later.
    const result = await prisma.$transaction(async (tx) => {
      // Create the add money transaction
      const addMoneyTransaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'credit',
          amount: amount,
          currency: 'XOF',
          status: 'completed', // In real implementation, this would be 'pending' until payment is confirmed
          description: `Wallet top-up via ${paymentMethod || 'payment gateway'}`,
          category: 'Bonus', // Or create a new category like 'Top-up' or 'Deposit'
          referenceId: `TOPUP-${Date.now()}`,
          metadata: JSON.stringify({
            paymentMethod: paymentMethod || 'mobile_money',
            topupType: 'manual', // Will be 'gateway' when real payment is integrated
            processedAt: new Date().toISOString(),
            note: 'Temporary manual top-up - Payment gateway integration pending'
          })
        }
      });

      // Add the amount to wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId: session.user.id },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      return { transaction: addMoneyTransaction, wallet: updatedWallet };
    });

    // Create notification for wallet top-up (non-blocking)
    try {
      const locale = await getUserLocale(session.user.id);
      const { title, message } = generateTransactionNotification(
        'credit',
        'Bonus', // Category that triggers wallet top-up notification
        amount,
        'XOF',
        `Wallet top-up via ${paymentMethod || 'payment gateway'}`,
        locale
      );

      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'transaction',
          title,
          message,
          relatedId: result.transaction.id,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Failed to create wallet top-up notification:', error);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      wallet: result.wallet,
      message: 'Money added to wallet successfully'
    });

  } catch (error) {
    console.error('Error adding money to wallet:', error);
    return NextResponse.json(
      { error: 'Failed to add money to wallet' },
      { status: 500 }
    );
  }
}
