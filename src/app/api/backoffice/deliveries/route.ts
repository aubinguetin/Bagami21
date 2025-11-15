import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBackofficeAuth, hasPermission } from '@/lib/backofficeAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await checkBackofficeAuth();

    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view deliveries
    if (!hasPermission(auth, 'deliveries')) {
      return NextResponse.json({ error: 'Forbidden - No deliveries permission' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      // SQLite doesn't support mode: 'insensitive', so we'll handle it differently
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { fromCity: { contains: search } },
        { toCity: { contains: search } },
        { fromCountry: { contains: search } },
        { toCountry: { contains: search } },
        { sender: { name: { contains: search } } },
        { sender: { email: { contains: search } } },
      ];
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) {
        where.price.gte = parseFloat(priceMin);
      }
      if (priceMax) {
        where.price.lte = parseFloat(priceMax);
      }
    }

    // Date filters
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        // Set to start of day
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = fromDate;
      }
      if (dateTo) {
        // Set to end of day
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Build orderBy clause
    let orderBy: any = {};
    if (sortField === 'title' || sortField === 'type' || sortField === 'status' || sortField === 'price' || sortField === 'createdAt') {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.delivery.count({ where }),
    ]);

    return NextResponse.json({
      deliveries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}
