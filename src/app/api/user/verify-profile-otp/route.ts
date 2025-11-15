import { NextRequest, NextResponse } from 'next/server';
import { OTPStorage } from '@/services/smsService';
import { prisma } from '@/lib/prisma';
import { getUserLocale, generateProfileUpdateNotification } from '@/lib/notificationTranslations';

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact, otp, userId, countryCode } = body;

    console.log('🔄 Profile OTP verification request:', {
      contact,
      userId,
      countryCode,
      timestamp: new Date().toISOString()
    });

    // Validate request
    if (!contact || !otp || !userId) {
      return NextResponse.json(
        { success: false, message: 'Contact, OTP, and user ID are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = OTPStorage.verify(contact, otp);

    if (!result.success) {
      // Handle specific OTP verification errors
      let statusCode = 400;
      let userMessage = result.message;

      if (result.message.includes('expired')) {
        userMessage = 'Verification code has expired. Please request a new one.';
        statusCode = 410;
      } else if (result.message.includes('not found') || result.message.includes('No OTP')) {
        userMessage = 'No verification code found. Please request a new one.';
        statusCode = 404;
      } else if (result.message.includes('Invalid')) {
        userMessage = 'Invalid verification code. Please check and try again.';
        statusCode = 400;
      }

      return NextResponse.json(
        { success: false, error: userMessage, message: userMessage },
        { status: statusCode }
      );
    }

    // OTP verified successfully, now update user profile
    const isEmail = isValidEmail(contact);

    try {
      // Check for duplicates before updating
      if (isEmail) {
        // Check if email is already used by another user
        const existingEmailUser = await prisma.user.findUnique({
          where: { email: contact },
          select: { id: true }
        });
        
        if (existingEmailUser && existingEmailUser.id !== userId) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'This email address is already in use by another account'
            },
            { status: 409 }
          );
        }

        // Update user's email and set as verified
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            email: contact,
            emailVerified: new Date(), // Set verification timestamp
          },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            phone: true,
            phoneVerified: true,
            countryCode: true,
            country: true
          }
        });

        console.log('✅ User email updated successfully:', {
          userId,
          newEmail: contact,
          timestamp: new Date().toISOString()
        });

        // Create notification for email update
        try {
          const locale = await getUserLocale(userId);
          const { title, message } = generateProfileUpdateNotification(['email'], locale);
          
          await prisma.notification.create({
            data: {
              userId: userId,
              type: 'update',
              title,
              message,
              isRead: false
            }
          });
          console.log('✅ Email update notification created');
        } catch (notifError) {
          console.error('⚠️ Failed to create email update notification:', notifError);
          // Don't fail the request if notification creation fails
        }

        return NextResponse.json({
          success: true,
          message: 'Email verified and updated successfully',
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            emailVerified: updatedUser.emailVerified,
            countryCode: updatedUser.countryCode,
            phone: updatedUser.phone,
            phoneVerified: updatedUser.phoneVerified
          }
        });
      } else {
        // Update user's phone number
        // Parse country code from contact if not provided separately
        let phoneCountryCode = countryCode;
        let phoneNumber = contact;

        if (!phoneCountryCode) {
          // Extract country code from contact
          const match = contact.match(/^(\+\d{1,4})(.*)$/);
          if (match) {
            phoneCountryCode = match[1];
            phoneNumber = match[2];
          } else {
            return NextResponse.json(
              { success: false, message: 'Invalid phone number format' },
              { status: 400 }
            );
          }
        } else {
          // Remove country code from phone number if it's included
          if (contact.startsWith(phoneCountryCode)) {
            phoneNumber = contact.substring(phoneCountryCode.length);
          }
        }

        // Check if phone is already used by another user  
        const existingPhoneUser = await prisma.user.findUnique({
          where: { phone: phoneNumber },
          select: { id: true }
        });
        
        if (existingPhoneUser && existingPhoneUser.id !== userId) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'This phone number is already in use by another account'
            },
            { status: 409 }
          );
        }

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            countryCode: phoneCountryCode,
            phone: phoneNumber,
            phoneVerified: new Date() // Set verification timestamp
          },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            phone: true,
            phoneVerified: true,
            countryCode: true,
            country: true
          }
        });

        console.log('✅ User phone updated successfully:', {
          userId,
          newPhone: contact,
          countryCode: phoneCountryCode,
          localPhone: phoneNumber,
          timestamp: new Date().toISOString()
        });

        // Create notification for phone update
        try {
          const locale = await getUserLocale(userId);
          const { title, message } = generateProfileUpdateNotification(['phone'], locale);
          
          await prisma.notification.create({
            data: {
              userId: userId,
              type: 'update',
              title,
              message,
              isRead: false
            }
          });
          console.log('✅ Phone update notification created');
        } catch (notifError) {
          console.error('⚠️ Failed to create phone update notification:', notifError);
          // Don't fail the request if notification creation fails
        }

        return NextResponse.json({
          success: true,
          message: 'Phone number verified and updated successfully',
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            emailVerified: updatedUser.emailVerified,
            countryCode: updatedUser.countryCode,
            phone: updatedUser.phone,
            phoneVerified: updatedUser.phoneVerified
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      
      return NextResponse.json(
        { success: false, message: 'Failed to update profile. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Profile OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}