const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentTransactions() {
  try {
    console.log('🔍 Checking recent transactions...\n');

    // Get the 10 most recent transactions
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`Found ${transactions.length} recent transactions:\n`);

    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction ID: ${tx.id}`);
      console.log(`   User: ${tx.user.name || tx.user.email}`);
      console.log(`   Type: ${tx.type.toUpperCase()}`);
      console.log(`   Category: ${tx.category}`);
      console.log(`   Amount: ${tx.amount.toLocaleString()} ${tx.currency}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log('');
    });

    // Calculate total fees
    const feeTransactions = await prisma.transaction.findMany({
      where: {
        category: 'Fee',
        status: 'completed',
      },
    });

    const totalFees = feeTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    console.log('='.repeat(60));
    console.log('💰 PLATFORM FEES SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Fee Transactions: ${feeTransactions.length}`);
    console.log(`Total Platform Revenue: ${Math.abs(totalFees).toLocaleString()} FCFA`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentTransactions();
