import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAndSendRatingReminders } from '@/services/ratingReminderService';

/**
 * Manual trigger for rating reminders
 * This endpoint can be used for testing or manual execution
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (optional - can be removed for public access)
    const session = await getServerSession(authOptions);
    
    console.log('🔄 Manually triggering rating reminder check...');
    const result = await checkAndSendRatingReminders();

    return NextResponse.json({
      success: result.success,
      remindersSent: result.remindersSent || 0,
      timestamp: new Date().toISOString(),
      triggeredBy: session?.user?.email || 'anonymous',
    });
  } catch (error) {
    console.error('❌ Manual rating reminder trigger failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
