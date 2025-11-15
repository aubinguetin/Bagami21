import { NextResponse } from 'next/server';
import { calculatePlatformFee } from '@/config/platform';

export async function GET() {
  try {
    const testAmount = 100000;
    
    console.log('🧪 Testing platform fee calculation...');
    const result = await calculatePlatformFee(testAmount);
    
    console.log('✅ Calculation result:', result);
    
    return NextResponse.json({
      success: true,
      testAmount,
      result,
      message: 'Platform fee calculation test successful'
    });
  } catch (error) {
    console.error('❌ Error in test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
