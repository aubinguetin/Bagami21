const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRatingReminders() {
  console.log('🔍 Checking database for all deliveries...\n');

  // Find ALL deliveries first
  const allDeliveries = await prisma.delivery.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      status: true,
      receiverId: true,
      deletedAt: true,
      updatedAt: true,
    },
  });

  console.log(`📦 Total deliveries: ${allDeliveries.length}\n`);
  
  const statusCount = {};
  allDeliveries.forEach(d => {
    statusCount[d.status] = (statusCount[d.status] || 0) + 1;
  });
  
  console.log('Status breakdown:');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  
  const withReceiver = allDeliveries.filter(d => d.receiverId !== null).length;
  console.log(`\nDeliveries with receiver: ${withReceiver}`);
  
  console.log('\n--- Looking for DELIVERED clothing delivery from Ouahigouya to Kumasi ---\n');

  // Find delivered deliveries (not COMPLETED, but DELIVERED)
  const completedDeliveries = await prisma.delivery.findMany({
    where: {
      title: { contains: 'clothing' },
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      status: true,
      senderId: true,
      receiverId: true,
      updatedAt: true,
      fromCity: true,
      toCity: true,
      sender: {
        select: {
          name: true,
          email: true,
        },
      },
      receiver: {
        select: {
          name: true,
          email: true,
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
              content: true,
            },
          },
        },
      },
    },
  });

  console.log(`📦 Found ${completedDeliveries.length} clothing deliveries\n`);

  for (const delivery of completedDeliveries) {
    console.log(`\n📦 Delivery: ${delivery.title}`);
    console.log(`   ID: ${delivery.id}`);
    console.log(`   Updated at: ${delivery.updatedAt.toISOString()}`);
    
    const confirmationMsg = delivery.conversations[0]?.messages[0];
    if (confirmationMsg) {
      console.log(`   ✅ Confirmation message found:`);
      console.log(`      Created at: ${confirmationMsg.createdAt.toISOString()}`);
      
      const now = new Date();
      const timeSince = (now.getTime() - confirmationMsg.createdAt.getTime()) / (1000 * 60 * 60);
      console.log(`      Hours since: ${timeSince.toFixed(2)}`);
    } else {
      console.log(`   ⚠️ No confirmation message found`);
    }
    
    console.log(`   Sender: ${delivery.sender.name} (${delivery.sender.email})`);
    console.log(`   Receiver: ${delivery.receiver?.name} (${delivery.receiver?.email})`);
    
    // Check for existing reviews
    const reviews = await prisma.review.findMany({
      where: {
        deliveryId: delivery.id,
      },
      select: {
        reviewerId: true,
        revieweeId: true,
        rating: true,
      },
    });
    
    console.log(`   Reviews: ${reviews.length}`);
    reviews.forEach(review => {
      console.log(`      - Reviewer ${review.reviewerId} → Reviewee ${review.revieweeId} (${review.rating}★)`);
    });
    
    // Check for existing notifications
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'rating_reminder',
        OR: [
          { relatedId: delivery.id },
          { relatedId: delivery.conversations[0]?.id },
        ],
      },
      select: {
        userId: true,
        message: true,
        createdAt: true,
      },
    });
    
    console.log(`   Rating reminders sent: ${notifications.length}`);
    notifications.forEach(notif => {
      console.log(`      - User ${notif.userId}: ${notif.message.substring(0, 50)}...`);
    });
  }

  await prisma.$disconnect();
}

testRatingReminders().catch(console.error);
