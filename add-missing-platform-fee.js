const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMissingPlatformFee() {
  try {
    console.log('🔍 Looking for the 4,996 FCFA payment transaction...\n');

    // Find the transaction
    const paymentTx = await prisma.transaction.findFirst({
      where: {
        amount: 4996,
        category: 'Delivery Payment',
        type: 'debit',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!paymentTx) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log('✅ Found payment transaction:');
    console.log(`   ID: ${paymentTx.id}`);
    console.log(`   User: ${paymentTx.user.name || paymentTx.user.email}`);
    console.log(`   Amount: ${paymentTx.amount} ${paymentTx.currency}`);
    console.log(`   Description: ${paymentTx.description}`);
    console.log(`   Created: ${paymentTx.createdAt}\n`);

    // Parse metadata to get platform fee
    let metadata = {};
    try {
      metadata = JSON.parse(paymentTx.metadata || '{}');
    } catch (e) {
      console.log('⚠️  No metadata found, calculating fee...');
    }

    const platformFee = metadata.platformFee || Math.floor(4996 * 0.175); // 17.5%

    console.log(`💰 Platform Fee: ${platformFee} FCFA\n`);

    // Check if fee transaction already exists
    const existingFee = await prisma.transaction.findFirst({
      where: {
        category: 'Fee',
        referenceId: `FEE-${paymentTx.referenceId}`,
      },
    });

    if (existingFee) {
      console.log('⚠️  Platform fee transaction already exists!');
      console.log(`   ID: ${existingFee.id}`);
      console.log(`   Amount: ${existingFee.amount} ${existingFee.currency}`);
      return;
    }

    // Create the platform fee transaction
    const feeTransaction = await prisma.transaction.create({
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

    console.log('✅ Platform fee transaction created successfully!');
    console.log(`   ID: ${feeTransaction.id}`);
    console.log(`   Amount: ${feeTransaction.amount} ${feeTransaction.currency}`);
    console.log(`   Description: ${feeTransaction.description}`);
    console.log(`   Created: ${feeTransaction.createdAt}\n`);

    // Calculate total platform revenue now
    const allFees = await prisma.transaction.aggregate({
      where: {
        category: 'Fee',
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    console.log('='.repeat(60));
    console.log('💰 UPDATED PLATFORM REVENUE');
    console.log('='.repeat(60));
    console.log(`Total: ${Math.abs(allFees._sum.amount || 0).toLocaleString()} FCFA`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingPlatformFee();
