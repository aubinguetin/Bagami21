const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetBalances() {
  try {
    console.log('🔄 Resetting all wallet balances to 100,000 FCFA...\n');

    // Get all users with wallets
    const wallets = await prisma.wallet.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📊 Found ${wallets.length} wallets to reset\n`);

    let successCount = 0;

    for (const wallet of wallets) {
      try {
        const oldBalance = wallet.balance;

        // Set balance to exactly 100,000
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: 100000 },
        });

        // Delete all existing transactions for this user
        await prisma.transaction.deleteMany({
          where: { userId: wallet.userId },
        });

        // Create a single initial transaction
        await prisma.transaction.create({
          data: {
            userId: wallet.userId,
            type: 'credit',
            amount: 100000,
            currency: 'XOF',
            status: 'completed',
            description: 'Initial wallet balance',
            category: 'Bonus',
            referenceId: `INITIAL_${Date.now()}_${wallet.userId}`,
          },
        });

        console.log(
          `✅ ${wallet.user.name || wallet.user.email}: ${oldBalance.toLocaleString()} → 100,000 FCFA`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error resetting wallet for ${wallet.user.name || wallet.user.email}:`,
          error.message
        );
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully reset: ${successCount} wallets`);
    console.log(`💰 New balance for all: 100,000 FCFA`);
    console.log('='.repeat(50));

    console.log('\n🎉 All wallet balances have been reset to 100,000 FCFA!');
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetBalances();
