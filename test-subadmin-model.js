const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSubadminModel() {
  try {
    console.log('🔍 Testing Subadmin model access...\n');

    // Check if subadmin model exists
    if (!prisma.subadmin) {
      console.error('❌ Error: prisma.subadmin is undefined!');
      console.log('Available models:', Object.keys(prisma).filter(k => k[0] === k[0].toLowerCase()));
      process.exit(1);
    }

    console.log('✅ Subadmin model is accessible');

    // Try to count subadmins
    const count = await prisma.subadmin.count();
    console.log(`📊 Current subadmin count: ${count}`);

    // Try to fetch all subadmins
    const subadmins = await prisma.subadmin.findMany({
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    console.log(`\n📋 Subadmins in database: ${subadmins.length}`);
    
    if (subadmins.length > 0) {
      console.log('\nExisting subadmins:');
      subadmins.forEach(sa => {
        console.log(`  - ${sa.email} (${sa.isActive ? 'Active' : 'Suspended'})`);
      });
    }

    console.log('\n✅ Subadmin model is working correctly!');

  } catch (error) {
    console.error('❌ Error testing subadmin model:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSubadminModel();
