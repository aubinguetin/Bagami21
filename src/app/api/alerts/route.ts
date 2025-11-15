import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('📧 Alert creation - Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📧 Alert creation - Body received:', body);
    
    const {
      name,
      departureCountry,
      departureCity,
      destinationCountry,
      destinationCity,
      alertType,
      emailNotifications
    } = body;

    // Validate required fields
    if (!name || !alertType) {
      console.log('❌ Missing required fields - name:', name, 'alertType:', alertType);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or get user ID
    let userId: string | undefined = session.user?.id;
    console.log('📧 Alert creation - Initial userId from session:', userId);
    
    if (!userId && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      userId = user?.id;
      console.log('📧 Alert creation - userId from email lookup:', userId);
    }

    if (!userId) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('📧 Alert creation - Creating alert with userId:', userId);

    // Create the alert in the database
    const alert = await prisma.alert.create({
      data: {
        userId,
        name,
        departureCountry: departureCountry || null,
        departureCity: departureCity || null,
        destinationCountry: destinationCountry || null,
        destinationCity: destinationCity || null,
        alertType,
        emailNotifications: emailNotifications ?? true,
        isActive: true
      }
    });

    console.log('🔔 New delivery alert created:', alert);

    return NextResponse.json({ 
      success: true, 
      message: 'Alert created successfully',
      alert 
    });
    
  } catch (error) {
    console.error('❌ Error creating alert:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or get user ID
    let userId: string | undefined = session.user?.id;
    if (!userId && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's alerts from database
    const alerts = await prisma.alert.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      alerts
    });
    
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}