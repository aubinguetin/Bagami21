import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const frontImage = formData.get('frontImage') as File | null;
    const backImage = formData.get('backImage') as File | null;

    if (!documentType || !['national_id', 'passport'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Validate required images based on document type
    if (documentType === 'national_id' && (!frontImage || !backImage)) {
      return NextResponse.json(
        { error: 'National ID requires both front and back images' },
        { status: 400 }
      );
    }

    if (documentType === 'passport' && !frontImage) {
      return NextResponse.json(
        { error: 'Passport requires an information page image' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'id-documents');
    await mkdir(uploadDir, { recursive: true });

    let frontImagePath = null;
    let backImagePath = null;

    // Save front image (or passport info page)
    if (frontImage) {
      const frontBytes = await frontImage.arrayBuffer();
      const frontBuffer = Buffer.from(frontBytes);
      const frontFileName = `${session.user.id}_${documentType}_front_${Date.now()}.${frontImage.name.split('.').pop()}`;
      const frontPath = join(uploadDir, frontFileName);
      await writeFile(frontPath, frontBuffer);
      frontImagePath = `/uploads/id-documents/${frontFileName}`;
    }

    // Save back image (only for national_id)
    if (backImage && documentType === 'national_id') {
      const backBytes = await backImage.arrayBuffer();
      const backBuffer = Buffer.from(backBytes);
      const backFileName = `${session.user.id}_${documentType}_back_${Date.now()}.${backImage.name.split('.').pop()}`;
      const backPath = join(uploadDir, backFileName);
      await writeFile(backPath, backBuffer);
      backImagePath = `/uploads/id-documents/${backFileName}`;
    }

    // Delete existing document of the same type if it exists (cleanup files too)
    const existing = await prisma.idDocument.findMany({
      where: { userId: session.user.id, documentType }
    })
    for (const doc of existing) {
      try {
        if (doc.frontImagePath) {
          const p = join(process.cwd(), 'public', doc.frontImagePath.replace(/^\//, ''))
          await unlink(p).catch(() => {})
        }
        if (doc.backImagePath) {
          const p = join(process.cwd(), 'public', doc.backImagePath.replace(/^\//, ''))
          await unlink(p).catch(() => {})
        }
      } catch (e) {
        console.warn('Failed to remove existing ID document files', e)
      }
    }
    await prisma.idDocument.deleteMany({
      where: { userId: session.user.id, documentType }
    })

    // Save to database
    const idDocument = await prisma.idDocument.create({
      data: {
        userId: session.user.id,
        documentType: documentType,
        frontImagePath: frontImagePath,
        backImagePath: backImagePath
      }
    });

    // Get user details for email notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    // Send admin notification email (non-blocking)
    if (user && user.email) {
      const documentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${frontImagePath}`;
      emailService.sendIdVerificationNotification({
        userId: session.user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        phone: user.phone || 'Not provided',
        documentType: documentType === 'national_id' ? 'National ID Card' : 'Passport',
        documentUrl,
        submittedAt: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Africa/Douala',
        }),
      }).catch(error => {
        console.error('Failed to send ID verification notification email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: idDocument.id,
        documentType: idDocument.documentType,
        uploadedAt: idDocument.uploadedAt
      }
    });

  } catch (error) {
    console.error('ID Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's ID documents
    const documents = await prisma.idDocument.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        documentType: true,
        frontImagePath: true,
        backImagePath: true,
        verificationStatus: true,
        uploadedAt: true
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      documents: documents
    });

  } catch (error) {
    console.error('ID Document fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let body: any = {}
    if (contentType.includes('application/json')) {
      try {
        body = await request.json()
      } catch {}
    }

    const { id, documentType } = body || {}
    if (!id && !documentType) {
      return NextResponse.json({ error: 'Provide id or documentType' }, { status: 400 })
    }

    const where = id
      ? { id, userId: session.user.id }
      : { userId: session.user.id, documentType }

    const docs = await prisma.idDocument.findMany({ where })
    if (docs.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Remove files
    for (const doc of docs) {
      try {
        if (doc.frontImagePath) {
          const p = join(process.cwd(), 'public', doc.frontImagePath.replace(/^\//, ''))
          await unlink(p).catch(() => {})
        }
        if (doc.backImagePath) {
          const p = join(process.cwd(), 'public', doc.backImagePath.replace(/^\//, ''))
          await unlink(p).catch(() => {})
        }
      } catch (e) {
        console.warn('Failed to remove files for deletion', e)
      }
    }

    // Delete from DB
    await prisma.idDocument.deleteMany({ where })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ID Document delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
