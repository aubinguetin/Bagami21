/**
 * Test Platform Fee Calculation
 * 
 * This script tests that the platform fee is being calculated
 * correctly from the database value.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPlatformFee() {
  try {
    console.log('🧪 Testing Platform Fee Calculation\n');
    
    // 1. Check what's in the database
    console.log('1️⃣ Checking database...');
    const setting = await prisma.platformSettings.findUnique({
      where: { key: 'commission_rate' },
    });
    
    if (!setting) {
      console.log('❌ No commission_rate setting found in database!');
      return;
    }
    
    console.log('✅ Found commission_rate:', setting.value);
    console.log('   Description:', setting.description);
    console.log('   Updated:', setting.updatedAt);
    
    // 2. Calculate the rate as percentage
    const rateDecimal = parseFloat(setting.value);
    const ratePercent = (rateDecimal * 100).toFixed(1);
    console.log('\n2️⃣ Rate conversion:');
    console.log('   Decimal:', rateDecimal);
    console.log('   Percentage:', ratePercent + '%');
    
    // 3. Test fee calculation with sample amounts
    console.log('\n3️⃣ Sample calculations:');
    const testAmounts = [10000, 50000, 100000, 500000];
    
    for (const amount of testAmounts) {
      const feeAmount = Math.floor(amount * rateDecimal);
      const netAmount = amount - feeAmount;
      console.log(`\n   Amount: ${amount.toLocaleString()} FCFA`);
      console.log(`   Fee (${ratePercent}%): ${feeAmount.toLocaleString()} FCFA`);
      console.log(`   Net: ${netAmount.toLocaleString()} FCFA`);
    }
    
    console.log('\n✅ Platform fee calculation test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlatformFee();
