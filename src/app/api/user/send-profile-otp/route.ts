import { NextRequest, NextResponse } from 'next/server';
import { SMSService, OTPStorage } from '@/services/smsService';
import { emailService } from '@/lib/email';
import { prisma } from '@/lib/prisma';

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact, countryInfo, userId, language = 'en' } = body;

    // Validate request
    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact information is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Detect if input is email or phone number
    const isEmail = isValidEmail(contact);

    // For phone numbers, validate country code match
    if (!isEmail && countryInfo) {
      if (!contact.startsWith(countryInfo.dialCode)) {
        console.error('🚨 Server-side country code mismatch detected!', {
          contact,
          expectedDialCode: countryInfo.dialCode,
          countryName: countryInfo.name,
          countryCode: countryInfo.code
        });
        return NextResponse.json(
          { 
            success: false, 
            message: `Country code mismatch: Phone number ${contact} does not match selected country ${countryInfo.name} (${countryInfo.dialCode})` 
          },
          { status: 400 }
        );
      }
      
      console.log('✅ Server-side country validation passed:', {
        contact,
        country: countryInfo.name,
        dialCode: countryInfo.dialCode
      });
    }

    // Check if the contact is already used by another user
    try {
      console.log('🔍 Checking for existing user with contact:', contact, 'userId:', userId);
      
      const existingUser = await prisma.$queryRaw`
        SELECT id, email, 
               CASE 
                 WHEN countryCode IS NOT NULL AND phone IS NOT NULL 
                 THEN CONCAT(countryCode, phone)
                 ELSE NULL 
               END as fullContact
        FROM User 
        WHERE (email = ${contact} OR 
               (countryCode IS NOT NULL AND phone IS NOT NULL AND CONCAT(countryCode, phone) = ${contact}))
        AND id != ${userId}
        LIMIT 1
      ` as any[];

      console.log('📊 Query result:', existingUser);

      if (existingUser.length > 0) {
        console.log('⚠️ Contact already exists for another user');
        return NextResponse.json(
          { 
            success: false, 
            message: `This ${isEmail ? 'email address' : 'phone number'} is already associated with another account` 
          },
          { status: 409 }
        );
      }
      
      console.log('✅ Contact is available for use');
    } catch (error) {
      console.error('❌ Error checking existing user:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        contact,
        userId,
        isEmail
      });
      return NextResponse.json(
        { success: false, message: 'Failed to validate contact information' },
        { status: 500 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiration
    OTPStorage.store(contact, otp);

    if (isEmail) {
      // Send email OTP
      try {
        await emailService.sendSignupOTP(contact, otp, language);
        
        console.log('✅ Email OTP sent successfully:', {
          email: contact,
          language,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'OTP sent to your email address',
          method: 'email'
        });

      } catch (error) {
        console.error('❌ Failed to send email OTP:', error);
        
        // Clean up stored OTP on failure
        OTPStorage.clear(contact);
        
        return NextResponse.json(
          { success: false, message: 'Failed to send email verification. Please try again.' },
          { status: 500 }
        );
      }
    } else {
      // Send SMS OTP
      try {
        await SMSService.sendOTP(contact, otp, language);
        
        console.log('✅ SMS OTP sent successfully:', {
          phoneNumber: contact,
          language,
          countryInfo: countryInfo || 'Not provided',
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'OTP sent to your phone number',
          method: 'sms'
        });

      } catch (error) {
        console.error('❌ Failed to send SMS OTP:', error);
        
        // Clean up stored OTP on failure
        OTPStorage.clear(contact);
        
        return NextResponse.json(
          { success: false, message: 'Failed to send SMS verification. Please try again.' },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Profile OTP send error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}