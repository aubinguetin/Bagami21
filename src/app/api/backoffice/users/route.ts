import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBackofficeAuth, hasPermission } from '@/lib/backofficeAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await checkBackofficeAuth();

    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users
    if (!hasPermission(auth, 'users')) {
      return NextResponse.json({ error: 'Forbidden - No users permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';
    const verification = searchParams.get('verification') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search filter (SQLite doesn't support case-insensitive search)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Role filter
    if (role !== 'all') {
      where.role = role;
    }

    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'suspended') {
      where.isActive = false;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = fromDate;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Build orderBy clause
    let orderBy: any = {};
    if (sortField === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortField === 'role') {
      orderBy = { role: sortOrder };
    } else if (sortField === 'isActive') {
      orderBy = { isActive: sortOrder };
    } else if (sortField === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    // Fetch users with counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip,
        orderBy,
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
          wallet: {
            select: {
              balance: true,
              currency: true,
            },
          },
          _count: {
            select: {
              sentDeliveries: true,
              receivedDeliveries: true,
              transactions: true,
            },
          },
          idDocuments: {
            select: {
              verificationStatus: true,
            },
            take: 1,
            orderBy: {
              uploadedAt: 'desc',
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Map users to include ID verification status and filter by verification if needed
    let usersWithStatus = users.map((user) => {
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

      return {
        ...user,
        idDocuments: undefined, // Remove from response
        idVerificationStatus,
      };
    });

    // Apply verification filter
    if (verification !== 'all') {
      usersWithStatus = usersWithStatus.filter(user => user.idVerificationStatus === verification);
    }

    // Sort by idVerificationStatus if that's the sort field (can't do in DB)
    if (sortField === 'idVerificationStatus') {
      usersWithStatus.sort((a, b) => {
        const order = ['not_verified', 'pending', 'rejected', 'verified'];
        const aIndex = order.indexOf(a.idVerificationStatus);
        const bIndex = order.indexOf(b.idVerificationStatus);
        return sortOrder === 'asc' ? aIndex - bIndex : bIndex - aIndex;
      });
    }

    // Update total count for verification filter
    const filteredTotal = verification !== 'all' ? usersWithStatus.length : total;

    return NextResponse.json({
      users: usersWithStatus,
      pagination: {
        total: filteredTotal,
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
