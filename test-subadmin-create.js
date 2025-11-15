const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateSubadmin() {
  try {
    console.log('🧪 Testing Subadmin creation directly...\n');

    // First, get an admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['admin', 'superadmin'] }
      }
    });

    if (!adminUser) {
      console.error('❌ No admin user found in database');
      console.log('Creating a test admin user...');
      
      const testAdmin = await prisma.user.create({
        data: {
          email: 'testadmin@example.com',
          role: 'admin',
          name: 'Test Admin',
        }
      });
      console.log('✅ Test admin created:', testAdmin.email);
      
      // Use the test admin
      adminUser.id = testAdmin.id;
    } else {
      console.log('✅ Found admin user:', adminUser.email);
    }

    // Create a test subadmin
    const testEmail = `test-subadmin-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    console.log('\n📝 Creating test subadmin...');
    console.log('Email:', testEmail);
    console.log('Created by:', adminUser.email);

    const subadmin = await prisma.subadmin.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: 'Test Subadmin',
        roleTitle: 'Test Manager',
        permissions: JSON.stringify(['users', 'deliveries']),
        createdById: adminUser.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('\n✅ Subadmin created successfully!');
    console.log('ID:', subadmin.id);
    console.log('Email:', subadmin.email);
    console.log('Name:', subadmin.name);
    console.log('Role:', subadmin.roleTitle);
    console.log('Active:', subadmin.isActive);
    console.log('Permissions:', JSON.parse(subadmin.permissions));
    console.log('Created by:', subadmin.createdBy.email);

    // Clean up - delete the test subadmin
    console.log('\n🧹 Cleaning up test data...');
    await prisma.subadmin.delete({
      where: { id: subadmin.id }
    });
    console.log('✅ Test subadmin deleted');

    console.log('\n✅ All tests passed! Subadmin creation works correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateSubadmin();
