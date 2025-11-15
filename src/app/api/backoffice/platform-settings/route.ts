import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkBackofficeAuth, hasPermission } from '@/lib/backofficeAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await checkBackofficeAuth();

    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view platform settings
    if (!hasPermission(auth, 'platform-settings')) {
      return NextResponse.json({ error: 'Forbidden - No platform-settings permission' }, { status: 403 });
    }

    // Fetch all platform settings
    const settings = await prisma.platformSettings.findMany();

    // Convert to object format for easier access
    const settingsObj: { [key: string]: any } = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
    });

    return NextResponse.json({
      settings: settingsObj,
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Check if user has permission to update platform settings
    if (!hasPermission(auth, 'platform-settings')) {
      return NextResponse.json({ error: 'Forbidden - No platform-settings permission' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, description } = body;

    // Validate required fields
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Validate commission rate if that's what's being updated
    if (key === 'commission_rate') {
      const rate = parseFloat(value);
      if (isNaN(rate) || rate < 0 || rate > 1) {
        return NextResponse.json(
          { error: 'Commission rate must be between 0 and 1 (0% to 100%)' },
          { status: 400 }
        );
      }
    }

    // Fetch old value before updating
    const existingSetting = await prisma.platformSettings.findUnique({
      where: { key },
    });
    const oldValue = existingSetting?.value || null;

    // Update or create the setting
    const setting = await prisma.platformSettings.upsert({
      where: { key },
      update: {
        value: value.toString(),
        description: description || undefined,
        updatedBy: auth.userId!,
      },
      create: {
        key,
        value: value.toString(),
        description: description || undefined,
        updatedBy: auth.userId!,
      },
    });

    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: auth.userId!,
        action: 'UPDATE_PLATFORM_SETTINGS',
        targetType: 'PlatformSettings',
        targetId: setting.id,
        details: JSON.stringify({
          key,
          oldValue,
          newValue: value,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
