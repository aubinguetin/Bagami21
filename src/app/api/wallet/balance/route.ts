import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        balance: true,
        currency: true
      }
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'XOF'
        },
        select: {
          balance: true,
          currency: true
        }
      });
    }

    return NextResponse.json({
      balance: wallet.balance,
      currency: wallet.currency
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}
