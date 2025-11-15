import { prisma } from '../src/lib/prisma';

async function seedPlatformSettings() {
  try {
    console.log('Seeding platform settings...');

    // Seed commission rate
    await prisma.platformSettings.upsert({
      where: { key: 'commission_rate' },
      update: {},
      create: {
        key: 'commission_rate',
        value: '0.175', // 17.5%
        description: 'Platform commission rate applied to all transactions',
      },
    });

    console.log('✅ Platform settings seeded successfully');
  } catch (error) {
    console.error('Error seeding platform settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPlatformSettings()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
