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

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching unread notification count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread notification count' },
      { status: 500 }
    );
  }
}
