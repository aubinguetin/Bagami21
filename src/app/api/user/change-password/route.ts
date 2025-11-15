import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getUserLocale, generatePasswordChangeNotification } from '@/lib/notificationTranslations'

// POST /api/user/change-password
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json()

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'New password and confirmation are required.' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirmation do not match.' }, { status: 400 })
    }

    // Basic server-side password policy (should mirror client)
    const policy = [
      { test: (s: string) => s.length >= 8, message: 'Password must be at least 8 characters.' },
      { test: (s: string) => /[A-Z]/.test(s), message: 'Password must include an uppercase letter.' },
      { test: (s: string) => /[a-z]/.test(s), message: 'Password must include a lowercase letter.' },
      { test: (s: string) => /[0-9]/.test(s), message: 'Password must include a number.' },
      { test: (s: string) => /[^A-Za-z0-9]/.test(s), message: 'Password must include a special character.' },
    ]
    for (const rule of policy) {
      if (!rule.test(newPassword)) {
        return NextResponse.json({ error: rule.message }, { status: 400 })
      }
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    // If the user already has a password, verify currentPassword
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
      }
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }
    }

    // Hash and update
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    // Create notification for password change
    try {
      const locale = await getUserLocale(user.id);
      const { title, message } = generatePasswordChangeNotification(locale);
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'update',
          title,
          message,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Failed to create password change notification:', error);
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('change-password error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
