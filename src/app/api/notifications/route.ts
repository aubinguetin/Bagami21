import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('📬 Fetching notifications for user:', userId, { limit, unreadOnly });

    // Build where clause
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        relatedId: true,
        isRead: true,
        readAt: true,
        createdAt: true
      }
    });

    console.log('✅ Found notifications:', notifications.length);

    return NextResponse.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, notificationId, markAllAsRead } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('📬 Mark as read request:', { userId, notificationId, markAllAsRead });

    let result;

    if (markAllAsRead) {
      // Mark all unread notifications as read
      result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log('✅ Marked all notifications as read:', result.count);
    } else if (notificationId) {
      // Mark single notification as read
      result = await prisma.notification.update({
        where: {
          id: notificationId,
          userId // Ensure user owns this notification
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log('✅ Marked notification as read:', notificationId);
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAllAsRead must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: markAllAsRead ? result.count : 1
    });
  } catch (error) {
    console.error('❌ Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
