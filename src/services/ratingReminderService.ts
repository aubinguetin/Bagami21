import { prisma } from '@/lib/prisma';
import { getUserLocale, generateRatingReminderNotification } from '@/lib/notificationTranslations';

// Reminder intervals in milliseconds
const REMINDER_INTERVALS = [
  { hours: 3, ms: 3 * 60 * 60 * 1000 },      // 3 hours
  { hours: 24, ms: 24 * 60 * 60 * 1000 },    // 24 hours
  { hours: 48, ms: 48 * 60 * 60 * 1000 },    // 48 hours
  { hours: 96, ms: 96 * 60 * 60 * 1000 },    // 96 hours (4 days)
  { hours: 168, ms: 168 * 60 * 60 * 1000 },  // 168 hours (7 days)
];

interface DeliveryForReminder {
  id: string;
  senderId: string;
  receiverId: string | null;
  updatedAt: Date;
  sender: {
    id: string;
    name: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
  } | null;
  conversations: Array<{
    id: string;
    messages: Array<{
      createdAt: Date;
    }>;
  }>;
}

export async function checkAndSendRatingReminders() {
  try {
    console.log('🔔 Checking for rating reminders...');
    console.log('⏰ Current time:', new Date().toISOString());

    // Find delivered deliveries with receivers (status should be DELIVERED not COMPLETED)
    const completedDeliveries = await prisma.delivery.findMany({
      where: {
        status: 'DELIVERED',
        receiverId: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        updatedAt: true,
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
        conversations: {
          select: {
            id: true,
            messages: {
              where: {
                messageType: 'deliveryConfirmation',
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                createdAt: true,
              },
            },
          },
        },
      },
    });

    console.log(`📦 Found ${completedDeliveries.length} completed deliveries`);

    if (completedDeliveries.length > 0) {
      const firstDelivery = completedDeliveries[0];
      const confirmationMsg = firstDelivery.conversations[0]?.messages[0];
      console.log('📋 Sample delivery:', {
        id: firstDelivery.id,
        updatedAt: firstDelivery.updatedAt,
        confirmationTime: confirmationMsg?.createdAt || 'N/A',
      });
    }

    const now = new Date();
    let remindersSent = 0;

    for (const delivery of completedDeliveries) {
      if (!delivery.receiverId) continue;

      // Skip if sender and receiver are the same person (can't rate yourself)
      if (delivery.senderId === delivery.receiverId) {
        console.log(`\n📦 Delivery ${delivery.id}: Skipped (same user as sender and receiver)`);
        continue;
      }

      // Get the confirmation time from the deliveryConfirmation message
      const confirmationMsg = delivery.conversations[0]?.messages[0];
      if (!confirmationMsg) {
        console.log(`⚠️ No confirmation message found for delivery ${delivery.id}, skipping...`);
        continue;
      }

      const completionTime = confirmationMsg.createdAt;
      const timeSinceCompletion = now.getTime() - completionTime.getTime();
      const hoursSinceCompletion = timeSinceCompletion / (1000 * 60 * 60);
      
      console.log(`\n📦 Checking delivery ${delivery.id}:`);
      console.log(`   Completed at: ${completionTime.toISOString()}`);
      console.log(`   Hours since completion: ${hoursSinceCompletion.toFixed(2)}`);
      console.log(`   Sender: ${delivery.senderId}`);
      console.log(`   Receiver: ${delivery.receiverId}`);

      // Process sender (needs to rate receiver)
      const senderReview = await prisma.review.findFirst({
        where: {
          deliveryId: delivery.id,
          reviewerId: delivery.senderId,
          revieweeId: delivery.receiverId,
        },
      });

      if (!senderReview) {
        console.log(`   → Sender hasn't rated receiver yet`);
        
        // Find which reminder interval we should send (the latest one that has passed)
        let reminderToSend: { hours: number; ms: number } | null = null;
        
        for (const interval of REMINDER_INTERVALS) {
          if (timeSinceCompletion >= interval.ms) {
            reminderToSend = interval;
          }
        }

        if (reminderToSend) {
          console.log(`   → Should send ${reminderToSend.hours}h reminder, checking if already sent...`);
          
          // Check if we already sent a reminder at or after this interval
          const existingReminder = await prisma.notification.findFirst({
            where: {
              userId: delivery.senderId,
              type: 'rating_reminder',
              relatedId: {
                in: [delivery.conversations[0]?.id || '', delivery.id],
              },
              createdAt: {
                gte: new Date(completionTime.getTime() + (reminderToSend.hours - 1) * 60 * 60 * 1000),
              },
            },
          });

          if (!existingReminder) {
            console.log(`   → No recent reminder found for sender, sending ${reminderToSend.hours}h reminder...`);
            await createRatingReminder(
              delivery.senderId,
              delivery.receiverId,
              delivery.id,
              delivery.receiver?.name || 'your delivery partner',
              reminderToSend.hours
            );
            remindersSent++;
            console.log(`✅ Sent ${reminderToSend.hours}h reminder to sender ${delivery.senderId}`);
          } else {
            console.log(`   → Reminder already sent to sender (created at ${existingReminder.createdAt.toISOString()})`);
          }
        } else {
          console.log(`   → No reminder interval reached yet`);
        }
      } else {
        console.log(`   → Sender already rated receiver ✓`);
      }

      // Process receiver (needs to rate sender)
      const receiverReview = await prisma.review.findFirst({
        where: {
          deliveryId: delivery.id,
          reviewerId: delivery.receiverId,
          revieweeId: delivery.senderId,
        },
      });

      if (!receiverReview) {
        console.log(`   → Receiver hasn't rated sender yet`);
        
        // Find which reminder interval we should send (the latest one that has passed)
        let reminderToSend: { hours: number; ms: number } | null = null;
        
        for (const interval of REMINDER_INTERVALS) {
          if (timeSinceCompletion >= interval.ms) {
            reminderToSend = interval;
          }
        }

        if (reminderToSend) {
          console.log(`   → Should send ${reminderToSend.hours}h reminder, checking if already sent...`);
          
          // Check if we already sent a reminder at or after this interval
          const existingReminder = await prisma.notification.findFirst({
            where: {
              userId: delivery.receiverId,
              type: 'rating_reminder',
              relatedId: {
                in: [delivery.conversations[0]?.id || '', delivery.id],
              },
              createdAt: {
                gte: new Date(completionTime.getTime() + (reminderToSend.hours - 1) * 60 * 60 * 1000),
              },
            },
          });

          if (!existingReminder) {
            console.log(`   → No recent reminder found for receiver, sending ${reminderToSend.hours}h reminder...`);
            await createRatingReminder(
              delivery.receiverId,
              delivery.senderId,
              delivery.id,
              delivery.sender?.name || 'your delivery partner',
              reminderToSend.hours
            );
            remindersSent++;
            console.log(`✅ Sent ${reminderToSend.hours}h reminder to receiver ${delivery.receiverId}`);
          } else {
            console.log(`   → Reminder already sent to receiver (created at ${existingReminder.createdAt.toISOString()})`);
          }
        } else {
          console.log(`   → No reminder interval reached yet`);
        }
      } else {
        console.log(`   → Receiver already rated sender ✓`);
      }
    }

    console.log(`🎉 Rating reminder check complete. Sent ${remindersSent} reminders.`);
    return { success: true, remindersSent };
  } catch (error) {
    console.error('❌ Error checking rating reminders:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function createRatingReminder(
  userId: string,
  partnerId: string,
  deliveryId: string,
  partnerName: string,
  hoursElapsed: number
) {
  try {
    // Get conversation ID for this delivery and these participants
    const conversation = await prisma.conversation.findFirst({
      where: {
        deliveryId: deliveryId,
        OR: [
          { participant1Id: userId, participant2Id: partnerId },
          { participant1Id: partnerId, participant2Id: userId },
        ],
      },
      select: {
        id: true,
      },
    });

    const conversationId = conversation?.id || deliveryId; // Fallback to deliveryId if no conversation

    const locale = await getUserLocale(userId);
    const { title, message } = generateRatingReminderNotification(
      hoursElapsed,
      partnerName,
      locale
    );

    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'rating_reminder',
        title,
        message,
        relatedId: conversationId,
        isRead: false,
      },
    });

    console.log(`✅ Rating reminder created for user ${userId}`);
  } catch (error) {
    console.error('❌ Error creating rating reminder:', error);
    throw error;
  }
}
