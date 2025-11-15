const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Reminder intervals in hours
const REMINDER_INTERVALS = [3, 24, 48, 96, 168];

async function testRatingReminders() {
  try {
    console.log('🔍 Testing rating reminder logic...\n');

    // Get deliveries with confirmation messages
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'DELIVERED',
        receiverId: { not: null }
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        },
        receiver: {
          select: { id: true, name: true, email: true }
        },
        conversations: {
          include: {
            messages: {
              where: { messageType: 'deliveryConfirmation' },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        reviews: true
      }
    });

    console.log(`📦 Found ${deliveries.length} DELIVERED deliveries with receivers\n`);

    let remindersToSend = 0;

    for (const delivery of deliveries) {
      // Get confirmation message
      let confirmationMsg = null;
      for (const conv of delivery.conversations) {
        if (conv.messages.length > 0) {
          confirmationMsg = conv.messages[0];
          break;
        }
      }

      if (!confirmationMsg) {
        console.log(`⚠️  Delivery ${delivery.id}: Has receiver but no confirmation message`);
        continue;
      }

      const confirmationTime = confirmationMsg.createdAt;
      const hoursago = (Date.now() - confirmationTime.getTime()) / (1000 * 60 * 60);

      console.log(`\n📦 Delivery: ${delivery.title || delivery.id.slice(0, 12)}`);
      console.log(`   Confirmed: ${confirmationTime.toLocaleString()}`);
      console.log(`   Hours ago: ${hoursago.toFixed(2)}`);
      console.log(`   Sender: ${delivery.sender.name} (${delivery.sender.id})`);
      console.log(`   Receiver: ${delivery.receiver.name} (${delivery.receiver.id})`);
      console.log(`   Reviews: ${delivery.reviews.length}`);

      // Check if sender has reviewed
      const senderHasReviewed = delivery.reviews.some(r => r.reviewerId === delivery.senderId);
      const receiverHasReviewed = delivery.reviews.some(r => r.reviewerId === delivery.receiverId);

      console.log(`   Sender reviewed: ${senderHasReviewed ? '✅' : '❌'}`);
      console.log(`   Receiver reviewed: ${receiverHasReviewed ? '✅' : '❌'}`);

      // Check which reminders should be sent
      for (const intervalHours of REMINDER_INTERVALS) {
        if (hoursago >= intervalHours) {
          // Check if sender needs reminder
          if (!senderHasReviewed) {
            // Check if reminder already sent (check for rating reminder messages)
            const reminderMsg = await prisma.message.findFirst({
              where: {
                conversationId: delivery.conversations[0]?.id,
                messageType: 'system',
                content: {
                  contains: `${intervalHours} hour`
                }
              }
            });

            if (!reminderMsg) {
              console.log(`   🔔 SHOULD SEND ${intervalHours}h reminder to SENDER`);
              remindersToSend++;
            } else {
              console.log(`   ✓ ${intervalHours}h reminder already sent to sender`);
            }
          }

          // Check if receiver needs reminder
          if (!receiverHasReviewed) {
            const reminderMsg = await prisma.message.findFirst({
              where: {
                conversationId: delivery.conversations[0]?.id,
                messageType: 'system',
                content: {
                  contains: `${intervalHours} hour`
                }
              }
            });

            if (!reminderMsg) {
              console.log(`   🔔 SHOULD SEND ${intervalHours}h reminder to RECEIVER`);
              remindersToSend++;
            } else {
              console.log(`   ✓ ${intervalHours}h reminder already sent to receiver`);
            }
          }
        }
      }
    }

    console.log(`\n\n✨ Summary:`);
    console.log(`   Total DELIVERED deliveries: ${deliveries.length}`);
    console.log(`   Reminders that should be sent: ${remindersToSend}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRatingReminders();
