import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      total,
      requests,
      offers,
      pending,
      inProgress,
      completed,
      cancelled,
    ] = await Promise.all([
      prisma.delivery.count({ where: { deletedAt: null } }),
      prisma.delivery.count({ where: { type: 'request', deletedAt: null } }),
      prisma.delivery.count({ where: { type: 'offer', deletedAt: null } }),
      prisma.delivery.count({ where: { status: 'pending', deletedAt: null } }),
      prisma.delivery.count({ where: { status: 'in_progress', deletedAt: null } }),
      prisma.delivery.count({ where: { status: 'completed', deletedAt: null } }),
      prisma.delivery.count({ where: { status: 'cancelled', deletedAt: null } }),
    ]);

    return NextResponse.json({
      total,
      requests,
      offers,
      pending,
      inProgress,
      completed,
      cancelled,
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
