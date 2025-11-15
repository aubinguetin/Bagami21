import { NextResponse } from 'next/server';
import { creditWallet } from '@/services/walletService';
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

    // Credit wallet
    const result = await creditWallet(
      userId,
      amount,
      description,
      category || 'General',
      referenceId,
      metadata
    );

    // Platform fee is already deducted before crediting the net amount to the provider
    // We store the fee information in the transaction metadata for admin tracking
    // No separate fee transaction needed - users only see their net payment received

    return NextResponse.json({
      success: true,
      wallet: result.wallet,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Error crediting wallet:', error);
    return NextResponse.json(
      { error: 'Failed to credit wallet' },
      { status: 500 }
    );
  }
}
