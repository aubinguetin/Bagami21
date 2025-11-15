import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, isActive: true },
    });

    if (!admin || admin.role !== 'admin' || !admin.isActive) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users with relevant information
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        idDocuments: {
          select: {
            verificationStatus: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
          take: 1,
        },
        transactions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data to include computed fields
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      idVerificationStatus: user.idDocuments[0]?.verificationStatus || null,
      transactionCount: user.transactions.length,
      lastActivityAt: user.updatedAt.toISOString(), // Using updatedAt as proxy for last activity
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      count: transformedUsers.length,
    });

  } catch (error) {
    console.error('Error fetching users list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
