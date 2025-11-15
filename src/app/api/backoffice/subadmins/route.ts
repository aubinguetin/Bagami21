import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Verify prisma is initialized
if (!prisma) {
  throw new Error('Prisma client failed to initialize');
}

// GET - Fetch all subadmins
export async function GET(req: NextRequest) {
  console.log('🔍 GET /api/backoffice/subadmins called');
  console.log('Prisma exists:', !!prisma);
  console.log('Prisma type:', typeof prisma);
  
  try {
    console.log('Getting session...');
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ 
        error: 'Session error: ' + (sessionError instanceof Error ? sessionError.message : 'Unknown') 
      }, { status: 500 });
    }
    console.log('Session obtained:', !!session);

    if (!session?.user?.id) {
      console.log('No session user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking if user is admin...');
    console.log('prisma object keys:', Object.keys(prisma).slice(0, 10));
    
    // Check if user is admin
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
    } catch (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ 
        error: 'User lookup error: ' + (userError instanceof Error ? userError.message : 'Unknown') 
      }, { status: 500 });
    }
    console.log('User found:', !!user);

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all subadmins created by this admin
    const subadmins = await prisma.subadmin.findMany({
      where: {
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse permissions JSON
    const subadminsWithParsedPermissions = subadmins.map(subadmin => ({
      ...subadmin,
      permissions: JSON.parse(subadmin.permissions),
    }));

    return NextResponse.json({
      success: true,
      subadmins: subadminsWithParsedPermissions,
    });
  } catch (error) {
    console.error('Error fetching subadmins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subadmins' },
      { status: 500 }
    );
  }
}

// POST - Create new subadmin
export async function POST(req: NextRequest) {
  console.log('🚀 POST /api/backoffice/subadmins called');
  
  try {
    console.log('📝 Creating new subadmin...');
    console.log('Prisma client exists:', !!prisma);
    console.log('Prisma.user exists:', !!prisma?.user);
    console.log('Prisma.subadmin exists:', !!prisma?.subadmin);
    
    const session = await getServerSession(authOptions);
    console.log('Session user ID:', session?.user?.id);

    if (!session?.user?.id) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('About to call prisma.user.findUnique...');
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    console.log('User role:', user?.role);

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      console.log('❌ User is not admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, password, name, roleTitle, permissions } = await req.json();
    console.log('Request data:', { email, name, roleTitle, permissionsCount: permissions?.length });

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!permissions || permissions.length === 0) {
      console.log('❌ No permissions selected');
      return NextResponse.json(
        { error: 'At least one permission must be selected' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSubadmin = await prisma.subadmin.findUnique({
      where: { email },
    });

    if (existingSubadmin) {
      console.log('❌ Email already in use:', email);
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    console.log('🔐 Hashing password...');
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('💾 Creating subadmin in database...');
    // Create subadmin
    const subadmin = await prisma.subadmin.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        roleTitle: roleTitle || 'Subadmin',
        permissions: JSON.stringify(permissions),
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    console.log('✅ Subadmin created:', subadmin.id);

    console.log('📋 Logging admin action...');
    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: 'subadmin_create',
        targetType: 'Subadmin',
        targetId: subadmin.id,
        details: JSON.stringify({
          email: subadmin.email,
          roleTitle: subadmin.roleTitle,
          permissions: permissions,
        }),
      },
    });
    console.log('✅ Admin action logged');

    return NextResponse.json({
      success: true,
      subadmin: {
        ...subadmin,
        permissions: JSON.parse(subadmin.permissions),
      },
    });
  } catch (error) {
    console.error('❌ Error creating subadmin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subadmin';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
