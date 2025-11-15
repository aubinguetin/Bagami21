import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserLocale, generateProfileUpdateNotification } from '@/lib/notificationTranslations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile with all fields including countryCode and idDocuments
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        idDocuments: {
          select: {
            id: true,
            verificationStatus: true,
            documentType: true
          }
        }
      }
    }) as any;

    if (user) {
      // Extract only the fields we want to return (excluding sensitive data)
      const { password, ...userProfile } = user;
      
      return NextResponse.json({
        success: true,
        user: {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          emailVerified: userProfile.emailVerified,
          phone: userProfile.phone,
          phoneVerified: userProfile.phoneVerified,
          countryCode: userProfile.countryCode,
          country: userProfile.country,
          gender: userProfile.gender,
          dateOfBirth: userProfile.dateOfBirth,
          image: userProfile.image,
          createdAt: userProfile.createdAt,
          idDocuments: userProfile.idDocuments
        }
      });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, country, email, countryCode, phone, gender, dateOfBirth, emailVerified, phoneVerified } = body;

    console.log('🔄 Profile update request:', {
      userId: session.user.id,
      requestData: body,
      timestamp: new Date().toISOString()
    });

    // Build update data object with only provided fields
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (country !== undefined) updateData.country = country;
    if (email !== undefined) updateData.email = email;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined && gender !== '') updateData.gender = gender;
    
    // Handle verification timestamps
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified instanceof Date ? emailVerified : new Date(emailVerified);
    }
    if (phoneVerified !== undefined) {
      updateData.phoneVerified = phoneVerified instanceof Date ? phoneVerified : new Date(phoneVerified);
    }
    
    // Handle dateOfBirth conversion - convert empty strings to null, valid dates to Date objects
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === '' || dateOfBirth === null) {
        updateData.dateOfBirth = null;
      } else {
        // Convert date string to proper Date object
        const parsedDate = new Date(dateOfBirth);
        if (!isNaN(parsedDate.getTime())) {
          updateData.dateOfBirth = parsedDate;
        } else {
          updateData.dateOfBirth = null;
        }
      }
    }

    console.log('📝 Updating user profile with data:', updateData);

    // Check for unique constraint violations before updating
    if (updateData.email) {
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: updateData.email },
        select: { id: true }
      });
      
      if (existingEmailUser && existingEmailUser.id !== session.user.id) {
        return NextResponse.json(
          { 
            error: 'Email address is already in use by another account',
            field: 'email'
          },
          { status: 409 }
        );
      }
    }

    if (updateData.phone) {
      const existingPhoneUser = await prisma.user.findUnique({
        where: { phone: updateData.phone },
        select: { id: true }
      });
      
      if (existingPhoneUser && existingPhoneUser.id !== session.user.id) {
        return NextResponse.json(
          { 
            error: 'Phone number is already in use by another account',
            field: 'phone'
          },
          { status: 409 }
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    }) as any;

    // Create notification for profile updates (only for important fields)
    try {
      const updatedFields = Object.keys(updateData);
      const importantFields = ['name', 'email', 'phone'];
      const updatedImportantFields = updatedFields.filter(field => importantFields.includes(field));

      if (updatedImportantFields.length > 0) {
        const locale = await getUserLocale(session.user.id);
        const { title, message } = generateProfileUpdateNotification(updatedImportantFields, locale);

        await prisma.notification.create({
          data: {
            userId: session.user.id,
            type: 'update',
            title,
            message,
            isRead: false
          }
        });
      }
    } catch (error) {
      console.error('Failed to create profile update notification:', error);
    }

    // Extract only the fields we want to return (excluding sensitive data)
    const { password, ...userProfile } = updatedUser;
    const responseUser = {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      emailVerified: userProfile.emailVerified,
      phone: userProfile.phone,
      phoneVerified: userProfile.phoneVerified,
      countryCode: userProfile.countryCode,
      country: userProfile.country,
      gender: userProfile.gender,
      dateOfBirth: userProfile.dateOfBirth,
      image: userProfile.image,
      createdAt: userProfile.createdAt
    };

    console.log('✅ User profile updated successfully:', {
      userId: session.user.id,
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      user: responseUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('❌ Profile update error:', {
      error: error,
      message: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    });

    const errorMessage = (error as Error).message;
    
    // Handle specific Prisma unique constraint errors
    if (errorMessage.includes('Unique constraint failed on the fields: (`email`)')) {
      return NextResponse.json(
        { 
          error: 'Email address is already in use by another account',
          field: 'email'
        },
        { status: 409 }
      );
    }
    
    if (errorMessage.includes('Unique constraint failed on the fields: (`phone`)')) {
      return NextResponse.json(
        { 
          error: 'Phone number is already in use by another account',
          field: 'phone'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}