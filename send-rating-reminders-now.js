// Direct rating reminder sender - bypasses HTTP endpoint
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Reminder intervals
const REMINDER_INTERVALS = [
  { hours: 3, ms: 3 * 60 * 60 * 1000 },
  { hours: 24, ms: 24 * 60 * 60 * 1000 },
  { hours: 48, ms: 48 * 60 * 60 * 1000 },
  { hours: 96, ms: 96 * 60 * 60 * 1000 },
  { hours: 168, ms: 168 * 60 * 60 * 1000 },
];

async function createRatingReminder(userId, partnerId, deliveryId, partnerName, hoursElapsed) {
  try {
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

    const conversationId = conversation?.id || deliveryId;

    let timeDescription = '';
    if (hoursElapsed === 3) timeDescription = '3 hours';
    else if (hoursElapsed === 24) timeDescription = '24 hours';
    else if (hoursElapsed === 48) timeDescription = '2 days';
    else if (hoursElapsed === 96) timeDescription = '4 days';
    else if (hoursElapsed === 168) timeDescription = '7 days';
    else timeDescription = `${hoursElapsed} hours`;

    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'rating_reminder',
        title: '⭐ Rate your delivery partner',
        message: `It's been ${timeDescription} since your delivery was completed. How was your experience with ${partnerName}? Share your feedback!`,
        relatedId: conversationId,
        isRead: false,
      },
    });

    console.log(`✅ Rating reminder created for user ${userId}`);
  } catch (error) {
    console.error('❌ Error creating rating reminder:', error);
  }
}

async function sendRatingReminders() {
  try {
    console.log('\n🔔 Sending rating reminders...');
    console.log('⏰ Current time:', new Date().toISOString(), '\n');

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

    console.log(`📦 Found ${completedDeliveries.length} DELIVERED deliveries\n`);

    const now = new Date();
    let remindersSent = 0;

    for (const delivery of completedDeliveries) {
      if (!delivery.receiverId) continue;

      // Skip if sender and receiver are the same person (can't rate yourself)
      if (delivery.senderId === delivery.receiverId) {
        console.log(`\n📦 Delivery ${delivery.id}: Skipped (same user as sender and receiver)`);
        continue;
      }

      const confirmationMsg = delivery.conversations[0]?.messages[0];
      if (!confirmationMsg) {
        console.log(`⚠️ Delivery ${delivery.id}: No confirmation message`);
        continue;
      }

      const completionTime = confirmationMsg.createdAt;
      const timeSinceCompletion = now.getTime() - completionTime.getTime();
      const hoursSinceCompletion = timeSinceCompletion / (1000 * 60 * 60);

      console.log(`\n📦 Delivery ${delivery.id}:`);
      console.log(`   Completed: ${completionTime.toISOString()}`);
      console.log(`   Hours ago: ${hoursSinceCompletion.toFixed(2)}`);
      console.log(`   Sender: ${delivery.senderId}`);
      console.log(`   Receiver: ${delivery.receiverId}`);

      for (const interval of REMINDER_INTERVALS) {
        if (timeSinceCompletion >= interval.ms) {
          console.log(`   ✓ ${interval.hours}h threshold passed`);

          // Check sender review
          const senderReview = await prisma.review.findFirst({
            where: {
              deliveryId: delivery.id,
              reviewerId: delivery.senderId,
              revieweeId: delivery.receiverId,
            },
          });

          if (!senderReview) {
            const existingReminder = await prisma.notification.findFirst({
              where: {
                userId: delivery.senderId,
                type: 'rating_reminder',
                relatedId: delivery.conversations[0]?.id || delivery.id,
                message: {
                  contains: `${interval.hours} hour`,
                },
              },
            });

            if (!existingReminder) {
              console.log(`   → Sending ${interval.hours}h reminder to sender...`);
              await createRatingReminder(
                delivery.senderId,
                delivery.receiverId,
                delivery.id,
                delivery.receiver?.name || 'your delivery partner',
                interval.hours
              );
              remindersSent++;
            } else {
              console.log(`   → ${interval.hours}h reminder already sent to sender`);
            }
          } else {
            console.log(`   → Sender already rated`);
          }

          // Check receiver review
          const receiverReview = await prisma.review.findFirst({
            where: {
              deliveryId: delivery.id,
              reviewerId: delivery.receiverId,
              revieweeId: delivery.senderId,
            },
          });

          if (!receiverReview) {
            const existingReminder = await prisma.notification.findFirst({
              where: {
                userId: delivery.receiverId,
                type: 'rating_reminder',
                relatedId: delivery.conversations[0]?.id || delivery.id,
                message: {
                  contains: `${interval.hours} hour`,
                },
              },
            });

            if (!existingReminder) {
              console.log(`   → Sending ${interval.hours}h reminder to receiver...`);
              await createRatingReminder(
                delivery.receiverId,
                delivery.senderId,
                delivery.id,
                delivery.sender?.name || 'your delivery partner',
                interval.hours
              );
              remindersSent++;
            } else {
              console.log(`   → ${interval.hours}h reminder already sent to receiver`);
            }
          } else {
            console.log(`   → Receiver already rated`);
          }
        } else {
          console.log(`   ✗ ${interval.hours}h threshold not reached yet`);
        }
      }
    }

    console.log(`\n🎉 Complete! Sent ${remindersSent} reminders.`);
    return { success: true, remindersSent };
  } catch (error) {
    console.error('\n❌ Error:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run it
sendRatingReminders().then(result => {
  console.log('\n=== RESULT ===');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
