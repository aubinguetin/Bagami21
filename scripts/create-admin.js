const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin User';

  if (!email || !password) {
    console.error('❌ Usage: node scripts/create-admin.js <email> <password> [name]');
    console.error('   Example: node scripts/create-admin.js admin@example.com SecurePassword123 "John Admin"');
    process.exit(1);
  }

  // Validate email format
  if (!email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists. Updating to admin role...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'admin',
          password: hashedPassword,
          name,
          emailVerified: new Date(),
        },
      });

      console.log('✅ User updated successfully!');
      console.log('📧 Email:', updatedUser.email);
      console.log('👤 Name:', updatedUser.name);
      console.log('🔐 Role:', updatedUser.role);
      console.log('\n🎉 You can now login at /backoffice/login');
    } else {
      console.log('Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'admin',
          emailVerified: new Date(),
          isActive: true,
        },
      });

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.name);
      console.log('🔐 Role:', user.role);
      console.log('\n🎉 You can now login at /backoffice/login');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
