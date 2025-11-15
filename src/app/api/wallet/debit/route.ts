import { NextResponse } from 'next/server';
import { debitWallet } from '@/services/walletService';
import { requireActiveUser } from '@/lib/checkUserActive';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, description, category, referenceId, metadata } = body;

    if (!userId || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, description' },
        { status: 400 }
      );
    }

    // Check if user is suspended (real-time check)
    try {
      await requireActiveUser(userId);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Your account has been suspended. Please contact customer service.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Debit wallet
    const result = await debitWallet(
      userId,
      amount,
      description,
      category || 'General',
      referenceId,
      metadata
    );

    return NextResponse.json({
      success: true,
      wallet: result.wallet,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Error debiting wallet:', error);
    
    // Check if it's an insufficient balance error
    if (error instanceof Error && error.message.includes('Insufficient balance')) {
      return NextResponse.json(
        { error: 'Insufficient balance in wallet' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to debit wallet' },
      { status: 500 }
    );
  }
}
