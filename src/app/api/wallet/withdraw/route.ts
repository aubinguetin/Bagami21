import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/checkUserActive';
import { emailService } from '@/lib/email';

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
    const { amount, phoneNumber } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal transaction and update wallet balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the withdrawal transaction with pending status
      const withdrawalTransaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'debit',
          amount: amount,
          currency: 'XOF',
          status: 'pending',
          description: `Withdrawal to mobile money (${phoneNumber})`,
          category: 'Withdrawal',
          referenceId: `WITHDRAWAL-${Date.now()}`,
          metadata: JSON.stringify({
            phoneNumber: phoneNumber,
            requestedAt: new Date().toISOString(),
            withdrawalType: 'mobile_money'
          })
        }
      });

      // Deduct the amount from wallet balance immediately
      const updatedWallet = await tx.wallet.update({
        where: { userId: session.user.id },
        data: {
          balance: {
            decrement: amount
          }
        }
      });

      return { transaction: withdrawalTransaction, wallet: updatedWallet };
    });

    // Get user details for email notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    // Send admin notification email (non-blocking)
    if (user && user.email) {
      emailService.sendWithdrawalNotification({
        userId: session.user.id,
        userName: user.name || 'Unknown User',
        userEmail: user.email,
        userPhone: user.phone || 'Not provided',
        amount,
        currency: 'XOF',
        phoneNumber,
        transactionId: result.transaction.referenceId || result.transaction.id,
        submittedAt: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Africa/Douala',
        }),
        currentBalance: result.wallet.balance,
      }).catch(error => {
        console.error('Failed to send withdrawal notification email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      wallet: result.wallet,
      message: 'Withdrawal request submitted successfully. Pending admin approval.'
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
}
