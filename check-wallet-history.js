const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWalletHistory() {
  try {
    console.log('🔍 Checking wallet balances and transaction history...\n');

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    for (const user of users) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 User: ${user.name || user.email}`);
      console.log('='.repeat(60));

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      });

      if (wallet) {
        console.log(`💰 Current Balance: ${wallet.balance.toLocaleString()} ${wallet.currency}`);
        console.log(`📅 Wallet Created: ${wallet.createdAt}`);
        console.log(`📅 Last Updated: ${wallet.updatedAt}`);
      } else {
        console.log('❌ No wallet found');
      }

      // Get all transactions
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      console.log(`\n📊 Transaction History (${transactions.length} transactions):`);
      console.log('-'.repeat(60));

      let runningBalance = 0;
      transactions.forEach((tx, index) => {
        const amount = tx.type === 'credit' ? tx.amount : -tx.amount;
        runningBalance += amount;
        
        console.log(`\n${index + 1}. ${tx.type.toUpperCase()} - ${tx.category}`);
        console.log(`   Amount: ${tx.amount.toLocaleString()} ${tx.currency}`);
        console.log(`   Description: ${tx.description}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Date: ${tx.createdAt}`);
        console.log(`   Running Balance: ${runningBalance.toLocaleString()} ${tx.currency}`);
      });

      if (wallet) {
        console.log(`\n✅ Final Balance Match: ${runningBalance === wallet.balance ? 'YES' : 'NO'}`);
        if (runningBalance !== wallet.balance) {
          console.log(`   Expected: ${runningBalance.toLocaleString()}`);
          console.log(`   Actual: ${wallet.balance.toLocaleString()}`);
          console.log(`   Difference: ${(wallet.balance - runningBalance).toLocaleString()}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWalletHistory();
