import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client with singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// PATCH - Update subadmin
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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

    const subadminId = params.id;

    // Verify subadmin belongs to this admin
    const existingSubadmin = await prisma.subadmin.findFirst({
      where: {
        id: subadminId,
        createdById: session.user.id,
      },
    });

    if (!existingSubadmin) {
      return NextResponse.json(
        { error: 'Subadmin not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { email, password, name, roleTitle, permissions, isActive } = body;

    // Prepare update data
    const updateData: any = {};

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name || null;
    if (roleTitle !== undefined) updateData.roleTitle = roleTitle;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (permissions !== undefined) {
      if (permissions.length === 0) {
        return NextResponse.json(
          { error: 'At least one permission must be selected' },
          { status: 400 }
        );
      }
      updateData.permissions = JSON.stringify(permissions);
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update subadmin
    const updatedSubadmin = await prisma.subadmin.update({
      where: { id: subadminId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Log admin action
    const actionType = isActive !== undefined
      ? (isActive ? 'subadmin_activate' : 'subadmin_suspend')
      : 'subadmin_update';

    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: actionType,
        targetType: 'Subadmin',
        targetId: subadminId,
        details: JSON.stringify({
          email: updatedSubadmin.email,
          changes: Object.keys(updateData),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      subadmin: {
        ...updatedSubadmin,
        permissions: JSON.parse(updatedSubadmin.permissions),
      },
    });
  } catch (error) {
    console.error('Error updating subadmin:', error);
    return NextResponse.json(
      { error: 'Failed to update subadmin' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subadmin
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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

    const subadminId = params.id;

    // Verify subadmin belongs to this admin
    const existingSubadmin = await prisma.subadmin.findFirst({
      where: {
        id: subadminId,
        createdById: session.user.id,
      },
    });

    if (!existingSubadmin) {
      return NextResponse.json(
        { error: 'Subadmin not found' },
        { status: 404 }
      );
    }

    // Delete subadmin
    await prisma.subadmin.delete({
      where: { id: subadminId },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: 'subadmin_delete',
        targetType: 'Subadmin',
        targetId: subadminId,
        details: JSON.stringify({
          email: existingSubadmin.email,
          roleTitle: existingSubadmin.roleTitle,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subadmin deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subadmin:', error);
    return NextResponse.json(
      { error: 'Failed to delete subadmin' },
      { status: 500 }
    );
  }
}
