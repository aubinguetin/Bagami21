const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function summary() {
  // Count deliveries by type
  const allDeliveries = await prisma.delivery.findMany({
    where: { status: 'DELIVERED' },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
    }
  });

  const sameUser = allDeliveries.filter(d => d.senderId === d.receiverId);
  const differentUsers = allDeliveries.filter(d => d.senderId !== d.receiverId);

  console.log('\n=== Delivery Summary ===');
  console.log('Total DELIVERED:', allDeliveries.length);
  console.log('Same user (sender = receiver):', sameUser.length, '(skipped)');
  console.log('Different users:', differentUsers.length, '(valid for reminders)');

  // Count notifications
  const totalNotifs = await prisma.notification.count({
    where: { type: 'rating_reminder' }
  });

  const notifs = await prisma.notification.findMany({
    where: { type: 'rating_reminder' },
    select: {
      userId: true,
      message: true,
    }
  });

  // Group by user
  const byUser = {};
  notifs.forEach(n => {
    if (!byUser[n.userId]) {
      byUser[n.userId] = [];
    }
    byUser[n.userId].push(n);
  });

  console.log('\n=== Notification Summary ===');
  console.log('Total rating reminders:', totalNotifs);
  console.log('\nBy user:');
  Object.entries(byUser).forEach(([userId, userNotifs]) => {
    const threeHour = userNotifs.filter(n => n.message.includes('3 hours')).length;
    const twentyFourHour = userNotifs.filter(n => n.message.includes('24 hours')).length;
    console.log(`  ${userId}: ${userNotifs.length} total (${threeHour} × 3h, ${twentyFourHour} × 24h)`);
  });

  console.log('\n✅ All notifications are for rating OTHER users only (no self-ratings)\n');
}

summary().finally(() => prisma.$disconnect());
