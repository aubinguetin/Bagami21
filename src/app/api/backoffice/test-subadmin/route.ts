import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    console.log('Testing subadmin creation without auth...');
    
    // Test 1: Check if prisma works
    console.log('Prisma exists:', !!prisma);
    console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')).slice(0, 20));
    
    // Test 2: Count users
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Test 3: Check if subadmin model exists
    const hasSubadmin = 'subadmin' in prisma;
    console.log('Has subadmin model:', hasSubadmin);
    
    // Test 4: Try to use subadmin model
    let subadminCount = 0;
    let subadminError = null;
    try {
      subadminCount = await (prisma as any).subadmin.count();
      console.log('Subadmin count:', subadminCount);
    } catch (err) {
      subadminError = err instanceof Error ? err.message : String(err);
      console.error('Subadmin count error:', subadminError);
    }
    
    return NextResponse.json({
      success: true,
      prismaWorks: true,
      userCount,
      hasSubadmin,
      subadminCount,
      subadminError,
      availableModels: Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
