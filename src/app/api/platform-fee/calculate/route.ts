import { NextRequest, NextResponse } from 'next/server';
import { calculatePlatformFee } from '@/config/platform';

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    
    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }
    
    const result = await calculatePlatformFee(amount);
    
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error calculating platform fee:', error);
    return NextResponse.json(
      { error: 'Failed to calculate platform fee' },
      { status: 500 }
    );
  }
}
