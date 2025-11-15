import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Prisma in API route...');
    console.log('Prisma client:', !!prisma);
    console.log('Prisma type:', typeof prisma);
    console.log('Prisma.user:', typeof prisma?.user);
    console.log('Prisma.subadmin:', typeof (prisma as any)?.subadmin);
    
    // Test user query
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Test subadmin query
    const subadminCount = await (prisma as any).subadmin.count();
    console.log('Subadmin count:', subadminCount);
    
    return NextResponse.json({
      success: true,
      prismaWorks: true,
      userCount,
      subadminCount,
      prismaKeys: Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
