import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBackofficeAuth, hasPermission } from '@/lib/backofficeAuth';

export async function GET(request: NextRequest) {
  try {
    // Get the latest terms and policy
    const termsPolicy = await prisma.termsPolicy.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!termsPolicy) {
      return NextResponse.json({ content: null });
    }

    return NextResponse.json({
      id: termsPolicy.id,
      content: termsPolicy.content,
      updatedAt: termsPolicy.updatedAt
    });

  } catch (error) {
    console.error('Error fetching terms and policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terms and policy' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkBackofficeAuth();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update terms and policy
    // Check if user has permission to update terms and policy
    if (!hasPermission(auth, 'terms-policy')) {
      return NextResponse.json({ error: 'Forbidden - No terms-policy permission' }, { status: 403 });
    }

    const body = await request.json();
    const { content, adminId } = body;

    // Validation
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Create or update terms and policy
    const termsPolicy = await prisma.termsPolicy.upsert({
      where: { id: 'default' },
      update: {
        content: content.trim(),
        updatedBy: adminId || auth.userId!
      },
      create: {
        id: 'default',
        content: content.trim(),
        createdBy: adminId || auth.userId!,
        updatedBy: adminId || auth.userId!
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: adminId || auth.userId!,
        action: 'terms_policy_update',
        targetType: 'TermsPolicy',
        targetId: termsPolicy.id,
        details: JSON.stringify({
          contentLength: content.length,
          timestamp: new Date().toISOString()
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      id: termsPolicy.id,
      updatedAt: termsPolicy.updatedAt
    });

  } catch (error) {
    console.error('Error saving terms and policy:', error);
    return NextResponse.json(
      { error: 'Failed to save terms and policy' },
      { status: 500 }
    );
  }
}
