import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // Check user role in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error verifying admin:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
