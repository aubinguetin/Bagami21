// Clean up rating reminder notifications where user would rate themselves
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupSelfRatingNotifications() {
  try {
    console.log('\n🔍 Finding rating reminders where sender = receiver...\n');

    // Find all deliveries where sender = receiver
    const selfDeliveries = await prisma.delivery.findMany({
      where: {
        status: 'DELIVERED',
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        conversations: {
          select: {
            id: true,
          },
        },
      },
    });

    const selfDeliveryConversationIds = [];
    const selfDeliveryIds = [];

    for (const delivery of selfDeliveries) {
      if (delivery.senderId === delivery.receiverId) {
        selfDeliveryIds.push(delivery.id);
        if (delivery.conversations[0]?.id) {
          selfDeliveryConversationIds.push(delivery.conversations[0].id);
        }
      }
    }

    console.log(`Found ${selfDeliveryIds.length} deliveries where sender = receiver`);
    console.log(`Conversation IDs:`, selfDeliveryConversationIds);

    // Find and delete notifications for these deliveries
    const notificationsToDelete = await prisma.notification.findMany({
      where: {
        type: 'rating_reminder',
        relatedId: {
          in: [...selfDeliveryConversationIds, ...selfDeliveryIds],
        },
      },
      select: {
        id: true,
        userId: true,
        message: true,
        relatedId: true,
      },
    });

    console.log(`\nFound ${notificationsToDelete.length} rating reminder notifications to delete:\n`);
    
    notificationsToDelete.forEach(notif => {
      console.log(`  - Notification ${notif.id} for user ${notif.userId}`);
      console.log(`    Message: ${notif.message.substring(0, 50)}...`);
      console.log(`    Related: ${notif.relatedId}\n`);
    });

    if (notificationsToDelete.length > 0) {
      const result = await prisma.notification.deleteMany({
        where: {
          id: {
            in: notificationsToDelete.map(n => n.id),
          },
        },
      });

      console.log(`✅ Deleted ${result.count} self-rating reminder notifications\n`);
    } else {
      console.log('✅ No self-rating notifications to delete\n');
    }

    // Show remaining valid notifications
    const remainingNotifications = await prisma.notification.count({
      where: { type: 'rating_reminder' },
    });

    console.log(`📊 Remaining rating reminder notifications: ${remainingNotifications}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSelfRatingNotifications();
