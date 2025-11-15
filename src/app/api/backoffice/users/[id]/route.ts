import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        country: true,
        gender: true,
        dateOfBirth: true,
        idDocuments: {
          select: {
            id: true,
            documentType: true,
            frontImagePath: true,
            backImagePath: true,
            verificationStatus: true,
            uploadedAt: true,
          },
          take: 1,
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        reviewsReceived: {
          select: {
            rating: true,
          },
        },
        sentDeliveries: {
          select: {
            id: true,
            title: true,
            fromCity: true,
            toCity: true,
            price: true,
            currency: true,
            status: true,
            createdAt: true,
            type: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        receivedDeliveries: {
          select: {
            id: true,
            title: true,
            fromCity: true,
            toCity: true,
            price: true,
            currency: true,
            status: true,
            createdAt: true,
            type: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        wallet: {
          select: {
            balance: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate ID verification status
    const idDocument = user.idDocuments[0];
    let idVerificationStatus: 'not_verified' | 'pending' | 'verified' | 'rejected' = 'not_verified';
    
    if (idDocument) {
      if (idDocument.verificationStatus === 'approved') {
        idVerificationStatus = 'verified';
      } else if (idDocument.verificationStatus === 'rejected') {
        idVerificationStatus = 'rejected';
      } else {
        idVerificationStatus = 'pending';
      }
    }

    // Calculate average rating
    const ratings = user.reviewsReceived.map((r: { rating: number }) => r.rating);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
      : 0;

    // Calculate wallet balance
    const walletBalance = user.wallet?.balance || 0;

    // Calculate transaction totals
    const totalSpent = user.transactions
      .filter((t: { type: string }) => t.type.includes('debit') || t.type.includes('payment'))
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

    const totalReceived = user.transactions
      .filter((t: { type: string }) => t.type.includes('credit') || t.type.includes('refund'))
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

    // Combine all deliveries
    const allDeliveries = [
      ...user.sentDeliveries.map((d: any) => ({ ...d, direction: 'sent' })),
      ...user.receivedDeliveries.map((d: any) => ({ ...d, direction: 'received' })),
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const userDetails = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      country: user.country,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      idVerificationStatus,
      averageRating,
      totalReviews: ratings.length,
      sentDeliveries: user.sentDeliveries.length,
      receivedDeliveries: user.receivedDeliveries.length,
      walletBalance,
      transactions: user.transactions.length,
      totalSpent,
      totalReceived,
    };

    // Get the most recent ID document
    const latestIdDocument = user.idDocuments[0] || null;

    return NextResponse.json({
      user: userDetails,
      deliveries: allDeliveries.slice(0, 10),
      transactions: user.transactions,
      idDocument: latestIdDocument,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
