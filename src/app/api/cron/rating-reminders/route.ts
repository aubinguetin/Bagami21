import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendRatingReminders } from '@/services/ratingReminderService';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Optional: Add authentication to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      console.log('⚠️ Unauthorized cron request - invalid secret');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting rating reminder cron job...');
    console.log('📅 Triggered at:', new Date().toISOString());
    
    const result = await checkAndSendRatingReminders();
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Cron job completed in ${duration}ms`);

    return NextResponse.json({
      success: result.success,
      remindersSent: result.remindersSent || 0,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error('❌ Rating reminder cron job failed:', error);
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
