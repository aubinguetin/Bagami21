const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAllMissingPlatformFees() {
  try {
    console.log('🔍 Looking for delivery payments without platform fees...\n');

    // Find all delivery payment transactions
    const paymentTxs = await prisma.transaction.findMany({
      where: {
        category: 'Delivery Payment',
        type: 'debit',
        status: 'completed',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Found ${paymentTxs.length} delivery payment transactions\n`);

    let created = 0;
    let skipped = 0;

    for (const paymentTx of paymentTxs) {
      // Check if fee transaction already exists
      const existingFee = await prisma.transaction.findFirst({
        where: {
          category: 'Fee',
          referenceId: `FEE-${paymentTx.referenceId}`,
        },
      });

      if (existingFee) {
        console.log(`⏭️  Skipping ${paymentTx.amount} FCFA - Fee already exists`);
        skipped++;
        continue;
      }

      // Parse metadata to get platform fee
      let metadata = {};
      try {
        metadata = JSON.parse(paymentTx.metadata || '{}');
      } catch (e) {
        // Ignore parse errors
      }

      const platformFee = metadata.platformFee || Math.floor(paymentTx.amount * 0.175); // 17.5%

      console.log(`\n📝 Creating fee for payment: ${paymentTx.amount} FCFA`);
      console.log(`   User: ${paymentTx.user.name || paymentTx.user.email}`);
      console.log(`   Platform Fee: ${platformFee} FCFA`);

      // Create the platform fee transaction
      await prisma.transaction.create({
        data: {
          userId: paymentTx.userId,
          type: 'debit',
          amount: platformFee,
          currency: paymentTx.currency,
          status: 'completed',
          description: `Platform fee (17.5%) for ${paymentTx.description}`,
          category: 'Fee',
          referenceId: `FEE-${paymentTx.referenceId}`,
          metadata: JSON.stringify({
            relatedTransactionId: paymentTx.id,
            deliveryId: metadata.deliveryId,
            grossAmount: paymentTx.amount,
            platformFee: platformFee,
            netAmount: paymentTx.amount - platformFee,
          }),
          createdAt: paymentTx.createdAt, // Use same timestamp as original payment
        },
      });

      console.log(`   ✅ Fee transaction created`);
      created++;
    }

    // Calculate total platform revenue
    const allFees = await prisma.transaction.aggregate({
      where: {
        category: 'Fee',
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Fee transactions created: ${created}`);
    console.log(`Fee transactions skipped: ${skipped}`);
    console.log(`Total payment transactions: ${paymentTxs.length}`);
    console.log('='.repeat(60));
    console.log('💰 TOTAL PLATFORM REVENUE');
    console.log('='.repeat(60));
    console.log(`${Math.abs(allFees._sum.amount || 0).toLocaleString()} FCFA`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAllMissingPlatformFees();
