const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPlatformFees() {
  console.log('\n=== FIXING PLATFORM FEE TRANSACTIONS ===\n');
  
  // 1. Delete all existing platform fee transactions (they were incorrectly debiting users)
  const deletedFees = await prisma.transaction.deleteMany({
    where: { category: 'Fee' }
  });
  
  console.log(`✅ Deleted ${deletedFees.count} incorrect fee transactions\n`);
  
  // 2. Find all Delivery Income transactions with platform fee metadata
  const deliveryIncomes = await prisma.transaction.findMany({
    where: {
      category: 'Delivery Income',
      status: 'completed'
    }
  });
  
  console.log(`📊 Found ${deliveryIncomes.length} delivery income transactions\n`);
  
  let feesCreated = 0;
  
  // 3. Create correct platform fee transactions
  for (const income of deliveryIncomes) {
    try {
      const metadata = income.metadata ? JSON.parse(income.metadata) : {};
      
      if (metadata.platformFee && metadata.platformFee > 0) {
        await prisma.transaction.create({
          data: {
            userId: income.userId,
            type: 'debit',
            amount: metadata.platformFee,
            currency: income.currency,
            status: 'completed',
            description: `Platform fee (17.5%) from ${income.description}`,
            category: 'Fee',
            referenceId: `FEE-${income.referenceId}`,
            createdAt: income.createdAt, // Use same timestamp as income
            metadata: JSON.stringify({
              relatedTransactionId: income.id,
              deliveryId: metadata.deliveryId,
              originalTransactionId: metadata.originalTransactionId,
              grossAmount: metadata.grossAmount,
              platformFee: metadata.platformFee,
              netAmount: metadata.netAmount,
              note: 'Platform fee deducted from gross payment - provider received net amount only'
            })
          }
        });
        
        console.log(`✅ Created fee transaction: ${metadata.platformFee} XAF for delivery ${metadata.deliveryId}`);
        feesCreated++;
      }
    } catch (error) {
      console.error(`❌ Error processing income transaction ${income.id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Created ${feesCreated} correct platform fee transactions\n`);
  
  // 4. Calculate total platform revenue
  const totalFees = await prisma.transaction.aggregate({
    where: {
      category: 'Fee',
      status: 'completed'
    },
    _sum: {
      amount: true
    }
  });
  
  console.log(`💰 Total platform revenue: ${totalFees._sum.amount || 0} XAF\n`);
  
  // 5. Verify user balances are correct (should show wallet balance for each user)
  const users = await prisma.user.findMany({
    where: {
      wallet: { isNot: null }
    },
    include: {
      wallet: true
    }
  });
  
  console.log('=== USER WALLET BALANCES ===\n');
  for (const user of users) {
    if (user.wallet) {
      console.log(`${user.name || user.email}: ${user.wallet.balance} XAF`);
    }
  }
  
  await prisma.$disconnect();
}

fixPlatformFees().catch(console.error);
