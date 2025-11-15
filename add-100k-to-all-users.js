const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addFundsToAllUsers() {
  try {
    console.log('🚀 Starting to add 100,000 FCFA to all user wallets...\n');

    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    console.log(`📊 Found ${users.length} active users\n`);

    let successCount = 0;
    let errorCount = 0;

    // Add 100,000 FCFA to each user
    for (const user of users) {
      try {
        // Check if wallet exists
        let wallet = await prisma.wallet.findUnique({
          where: { userId: user.id },
        });

        if (!wallet) {
          // Create wallet if it doesn't exist
          wallet = await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: 0,
              currency: 'XOF',
            },
          });
          console.log(`✨ Created wallet for user: ${user.name || user.email || user.phone}`);
        }

        // Add 100,000 FCFA
        const updatedWallet = await prisma.wallet.update({
          where: { userId: user.id },
          data: {
            balance: {
              increment: 100000,
            },
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'credit',
            amount: 100000,
            currency: 'XOF',
            status: 'completed',
            description: 'Admin bonus - 100,000 FCFA added to wallet',
            category: 'Bonus',
            referenceId: `BONUS_${Date.now()}_${user.id}`,
          },
        });

        console.log(
          `✅ Added 100,000 FCFA to ${user.name || user.email || user.phone} - New balance: ${updatedWallet.balance.toLocaleString()} FCFA`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error adding funds to ${user.name || user.email || user.phone}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total processed: ${users.length}`);
    console.log('='.repeat(50));

    if (successCount > 0) {
      console.log('\n🎉 Funds have been added successfully!');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addFundsToAllUsers();
