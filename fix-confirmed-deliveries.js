const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixConfirmedDeliveries() {
  try {
    console.log('🔍 Finding deliveries with confirmation messages but PENDING status...\n');

    // Find all deliveries with confirmation messages
    const deliveries = await prisma.delivery.findMany({
      where: {
        OR: [
          { status: 'PENDING' }, // PENDING deliveries
          { receiverId: null }    // Or DELIVERED but missing receiverId
        ]
      },
      include: {
        conversations: {
          include: {
            messages: {
              where: {
                messageType: 'deliveryConfirmation'
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      }
    });

    console.log(`📦 Found ${deliveries.length} deliveries with PENDING status\n`);

    let updatedCount = 0;

    for (const delivery of deliveries) {
      // Check all conversations for this delivery
      let confirmationMsg = null;
      for (const conv of delivery.conversations) {
        if (conv.messages.length > 0) {
          confirmationMsg = conv.messages[0];
          break;
        }
      }
      
      if (confirmationMsg) {
        // This delivery has been confirmed but status wasn't updated
        // The receiver is the person who sent the confirmation message
        const receiverId = confirmationMsg.senderId;
        
        console.log(`📝 Delivery ${delivery.id}:`);
        console.log(`   - Has confirmation message from ${confirmationMsg.createdAt}`);
        console.log(`   - Receiver ID: ${receiverId}`);
        console.log(`   - Updating status to DELIVERED...`);

        await prisma.delivery.update({
          where: { id: delivery.id },
          data: {
            status: 'DELIVERED',
            receiverId: receiverId,
          }
        });

        updatedCount++;
        console.log(`   ✅ Updated!\n`);
      }
    }

    console.log(`\n✨ Summary:`);
    console.log(`   - Total deliveries checked: ${deliveries.length}`);
    console.log(`   - Deliveries updated: ${updatedCount}`);
    console.log(`   - Deliveries unchanged: ${deliveries.length - updatedCount}`);
    
    if (updatedCount > 0) {
      console.log('\n🎯 These deliveries will now trigger rating reminders!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixConfirmedDeliveries();
