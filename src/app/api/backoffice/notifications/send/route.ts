import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBackofficeAuth, hasPermission } from '@/lib/backofficeAuth';

export async function POST(request: NextRequest) {
  try {
    const auth = await checkBackofficeAuth();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to send notifications
    if (!hasPermission(auth, 'notifications')) {
      return NextResponse.json({ error: 'Forbidden - No notifications permission' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, link, sendToAll, userIds } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!sendToAll && (!userIds || userIds.length === 0)) {
      return NextResponse.json(
        { error: 'Please select at least one user or choose "Send to all users"' },
        { status: 400 }
      );
    }

    let targetUserIds: string[] = [];

    if (sendToAll) {
      // Get all active user IDs
      const allUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { not: 'admin' }, // Don't send to other admins
        },
        select: { id: true },
      });
      targetUserIds = allUsers.map(u => u.id);
    } else {
      targetUserIds = userIds;
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No users found to send notification' },
        { status: 400 }
      );
    }

    // Create notifications for all target users
    const notifications = targetUserIds.map(userId => ({
      userId,
      type: 'admin_notification',
      title: title.trim(),
      message: message.trim(),
      relatedId: link && link.trim() ? link.trim() : null,
      isRead: false,
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });

    // Log admin action
    try {
      await prisma.adminAction.create({
        data: {
          adminId: auth.userId!,
          action: 'notification_sent',
          targetType: 'Notification',
          targetId: null,
          details: JSON.stringify({
            title,
            message: message.substring(0, 100), // Truncate for storage
            link,
            sendToAll,
            recipientCount: targetUserIds.length,
            userIds: sendToAll ? 'all_users' : userIds,
          }),
        },
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Continue even if logging fails
    }

    console.log(`✅ Admin notification sent to ${targetUserIds.length} users`);

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Notification sent successfully to ${result.count} user${result.count !== 1 ? 's' : ''}`,
    });

  } catch (error) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
