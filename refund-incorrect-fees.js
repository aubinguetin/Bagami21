const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function refundIncorrectFees() {
  console.log('\n=== REFUNDING INCORRECTLY CHARGED PLATFORM FEES ===\n');
  
  // The incorrect fees we deleted were:
  // - 7 transactions total
  // - Each was a DEBIT from the payer (wrong!)
  // - Total: 2799 XAF incorrectly deducted
  
  // We need to credit back these amounts to the users who were incorrectly charged
  
  // Let's calculate how much each user was incorrectly charged
  const users = [
    { email: 'internegocebusiness@yahoo.com', name: 'ChinaBL', incorrectFees: 1050 + 874 + 175 + 175 + 175 }, // 2449 XAF
    { email: 'admin@bagami.com', name: 'Admin User', incorrectFees: 175 }, // 175 XAF
    { email: 'aubin.guetin@sciencespo.fr', name: 'SciencesPo2', incorrectFees: 0 }, // 0 XAF
    { email: 'guetinp@gmail.com', name: 'GuetinP', incorrectFees: 175 } // 175 XAF
  ];
  
  for (const userData of users) {
    if (userData.incorrectFees > 0) {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { wallet: true }
      });
      
      if (!user || !user.wallet) {
        console.log(`❌ User ${userData.email} not found or has no wallet`);
        continue;
      }
      
      // Create refund transaction
      const refundTx = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'credit',
          amount: userData.incorrectFees,
          currency: 'XAF',
          status: 'completed',
          description: `Refund for incorrectly charged platform fees`,
          category: 'Bonus',
          referenceId: `REFUND-INCORRECT-FEES-${Date.now()}`
        }
      });
      
      // Update wallet balance
      const newBalance = user.wallet.balance + userData.incorrectFees;
      await prisma.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: newBalance }
      });
      
      console.log(`✅ Refunded ${userData.incorrectFees} XAF to ${userData.name}`);
      console.log(`   Old balance: ${user.wallet.balance} XAF`);
      console.log(`   New balance: ${newBalance} XAF\n`);
    }
  }
  
  // Show final balances
  console.log('\n=== FINAL WALLET BALANCES ===\n');
  const allUsers = await prisma.user.findMany({
    where: { wallet: { isNot: null } },
    include: { wallet: true }
  });
  
  for (const user of allUsers) {
    if (user.wallet) {
      console.log(`${user.name || user.email}: ${user.wallet.balance} XAF`);
    }
  }
  
  await prisma.$disconnect();
}

refundIncorrectFees().catch(console.error);
