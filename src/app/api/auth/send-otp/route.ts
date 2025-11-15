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
    const { phoneNumber, type = 'signup', countryInfo, language = 'en' } = body;

    // Validate request
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Contact information is required' },
        { status: 400 }
      );
    }

    // ✅ CRITICAL SERVER-SIDE VALIDATION: Ensure phone number matches country info
    if (countryInfo && !phoneNumber.includes('@')) {
      if (!phoneNumber.startsWith(countryInfo.dialCode)) {
        console.error('🚨 Server-side country code mismatch detected!', {
          phoneNumber,
          expectedDialCode: countryInfo.dialCode,
          countryName: countryInfo.name,
          countryCode: countryInfo.code
        });
        return NextResponse.json(
          { 
            success: false, 
            message: `Country code mismatch: Phone number ${phoneNumber} does not match selected country ${countryInfo.name} (${countryInfo.dialCode})` 
          },
          { status: 400 }
        );
      }
      
      console.log('✅ Server-side country validation passed:', {
        phoneNumber,
        country: countryInfo.name,
        dialCode: countryInfo.dialCode
      });
    }

    // Detect if input is email or phone number
    const isEmail = phoneNumber.includes('@');
    
    // Validate format based on type
    if (!isEmail && !SMSService.isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (isEmail && !isValidEmail(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists (for signup) - prevents unnecessary OTP costs
    if (type === 'signup') {
      try {
        const isEmail = phoneNumber.includes('@');
        
        // First check for verified users - they definitely need to login
        let existingVerifiedUser = null;
        
        if (isEmail) {
          existingVerifiedUser = await prisma.user.findFirst({
            where: { email: phoneNumber, emailVerified: { not: null } }
          });
        } else {
          // First try full phone number
          existingVerifiedUser = await prisma.user.findFirst({
            where: { phone: phoneNumber, phoneVerified: { not: null } }
          });
          
          // If not found and we have country info, try separated format  
          if (!existingVerifiedUser && countryInfo && phoneNumber.startsWith(countryInfo.dialCode)) {
            const localPhone = phoneNumber.substring(countryInfo.dialCode.length);
            const result = await prisma.$queryRaw`
              SELECT * FROM User 
              WHERE countryCode = ${countryInfo.dialCode} AND phone = ${localPhone} AND phoneVerified IS NOT NULL
              LIMIT 1
            `;
            
            if (Array.isArray(result) && result.length > 0) {
              existingVerifiedUser = result[0] as any;
            }
          }
        }

        if (existingVerifiedUser) {
          console.log('🛑 Preventing OTP send - verified user exists:', { 
            contact: phoneNumber, 
            type: isEmail ? 'email' : 'phone',
            userId: existingVerifiedUser.id 
          });
          return NextResponse.json(
            { success: false, message: 'This contact is already registered and verified. Please try logging in instead.' },
            { status: 409 }
          );
        }

        // Then check for any existing user (verified or not) - prevents duplicate registrations
        let existingUser = null;
        
        if (isEmail) {
          existingUser = await prisma.user.findFirst({
            where: { email: phoneNumber }
          });
        } else {
          // For phone numbers, we need to handle both formats:
          // 1. Full international format (e.g., "+22665502626")  
          // 2. Separated format (countryCode: "+226", phone: "65502626")
          
          // First try to find by full phone number  
          existingUser = await prisma.user.findFirst({
            where: { phone: phoneNumber }
          });
          
          // If not found and we have country info, try separated format
          if (!existingUser && countryInfo && phoneNumber.startsWith(countryInfo.dialCode)) {
            const localPhone = phoneNumber.substring(countryInfo.dialCode.length);
            console.log('🔍 Checking separated phone format:', { 
              fullPhone: phoneNumber, 
              countryCode: countryInfo.dialCode, 
              localPhone 
            });
            
            // Use raw SQL query as workaround for TypeScript issue
            const result = await prisma.$queryRaw`
              SELECT * FROM User 
              WHERE countryCode = ${countryInfo.dialCode} AND phone = ${localPhone}
              LIMIT 1
            `;
            
            if (Array.isArray(result) && result.length > 0) {
              existingUser = result[0] as any;
            }
          }
        }

        if (existingUser) {
          console.log('💰 Preventing OTP send - unverified user exists:', { 
            contact: phoneNumber, 
            type: isEmail ? 'email' : 'phone',
            userId: existingUser.id,
            verified: isEmail ? !!existingUser.emailVerified : !!existingUser.phoneVerified
          });
          return NextResponse.json(
            { 
              success: false, 
              message: `This ${isEmail ? 'email' : 'phone number'} is already registered. Please complete verification or try logging in.`,
              code: 'USER_EXISTS'
            },
            { status: 409 }
          );
        }

        console.log('✅ No existing user found - proceeding with OTP:', { 
          contact: phoneNumber, 
          type: isEmail ? 'email' : 'phone' 
        });
        
      } catch (dbError) {
        console.error('🚨 Database error checking existing user:', dbError);
        // Continue with OTP sending even if DB check fails to avoid blocking legitimate users
      }
    }

    // Check if user exists (for password-reset) - prevents sending OTPs to non-existent users
    if (type === 'password-reset') {
      try {
        const isEmail = phoneNumber.includes('@');
        let existingUser = null;
        
        if (isEmail) {
          existingUser = await prisma.user.findFirst({
            where: { email: phoneNumber }
          });
        } else {
          // For phone numbers, we need to handle the split storage format
          // Phone numbers are stored as: countryCode (e.g., +226) + phone (e.g., 77889900)
          const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
          
          console.log('🔍 Password reset - searching for user with phone:', normalizedPhone);
          
          // First, try to find by full phone number (legacy format)
          existingUser = await prisma.user.findFirst({
            where: { 
              OR: [
                { phone: normalizedPhone },
                { phone: normalizedPhone.replace(/^\+/, '') },
                { phone: normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}` }
              ]
            }
          });
          
          // If not found, try the split format (countryCode + phone)
          if (!existingUser) {
            // Parse the phone number to extract country code
            const { countryCodes } = await import('@/data/countryCodes');
            const sortedCountryCodes = [...countryCodes].sort((a, b) => b.dialCode.length - a.dialCode.length);
            
            for (const country of sortedCountryCodes) {
              if (normalizedPhone.startsWith(country.dialCode)) {
                const localPhone = normalizedPhone.substring(country.dialCode.length);
                console.log('🔍 Trying split format:', { countryCode: country.dialCode, localPhone });
                
                existingUser = await prisma.user.findFirst({
                  where: {
                    countryCode: country.dialCode,
                    phone: localPhone
                  }
                });
                
                if (existingUser) {
                  console.log('✅ Found user with split format!');
                  break;
                }
              }
            }
          }
          
          // Final fallback: try the countryInfo if provided
          if (!existingUser && countryInfo && normalizedPhone.startsWith(countryInfo.dialCode)) {
            const localPhone = normalizedPhone.substring(countryInfo.dialCode.length);
            console.log('🔍 Trying countryInfo format:', { countryCode: countryInfo.dialCode, localPhone });
            
            existingUser = await prisma.user.findFirst({
              where: {
                countryCode: countryInfo.dialCode,
                phone: localPhone
              }
            });
          }
        }

        if (!existingUser) {
          // Debug: Show what formats exist in the database
          const sampleUsers = await prisma.user.findMany({
            select: { id: true, phone: true, countryCode: true, email: true },
            take: 5,
            orderBy: { createdAt: 'desc' }
          });
          console.log('💰 Preventing password reset OTP - user does not exist:', { 
            contact: phoneNumber, 
            type: isEmail ? 'email' : 'phone',
            sampleFormatsInDB: sampleUsers.map(u => ({ 
              phone: u.phone, 
              countryCode: u.countryCode,
              fullPhone: u.countryCode && u.phone ? `${u.countryCode}${u.phone}` : u.phone,
              email: u.email 
            }))
          });
          return NextResponse.json(
            { 
              success: false, 
              message: `No account found with this ${isEmail ? 'email' : 'phone number'}. Please check your information or create a new account.`,
              code: 'USER_NOT_FOUND'
            },
            { status: 404 }
          );
        }

        console.log('✅ User found - proceeding with password reset OTP:', { 
          contact: phoneNumber, 
          type: isEmail ? 'email' : 'phone',
          userId: existingUser.id,
          userPhone: existingUser.phone,
          userCountryCode: existingUser.countryCode
        });
        
      } catch (dbError) {
        console.error('🚨 Database error checking user for password reset:', dbError);
        // Continue with OTP sending even if DB check fails to avoid blocking legitimate users
      }
    }

    // Clear any existing OTP for this phone number to allow new requests
    if (OTPStorage.exists(phoneNumber)) {
      OTPStorage.clear(phoneNumber);
      console.log('🔄 Cleared existing OTP for:', phoneNumber);
    }

    // Generate OTP
    const otp = SMSService.generateOTP();

    // Send OTP via email or SMS based on input type
    let sendResponse: { success: boolean; message?: string; cost?: number; currency?: string } = { success: false };
    
    if (isEmail) {
      // Send OTP via email
      console.log(`📧 Sending ${type} OTP email to:`, phoneNumber, `in language:`, language);
      
      if (type === 'password-reset') {
        sendResponse.success = await emailService.sendPasswordResetOTP(phoneNumber, otp, language);
      } else {
        sendResponse.success = await emailService.sendSignupOTP(phoneNumber, otp, language);
      }
      
      if (!sendResponse.success) {
        sendResponse.message = 'Failed to send verification email';
      } else {
        sendResponse.message = 'Verification email sent successfully';
      }
    } else {
      // Send OTP via SMS
      console.log(`📱 Sending ${type} OTP SMS to:`, phoneNumber, `in language:`, language);
      
      if (type === 'password-reset') {
        sendResponse = await SMSService.sendPasswordResetOTP(phoneNumber, otp, language);
      } else {
        sendResponse = await SMSService.sendOTP(phoneNumber, otp, language);
      }
    }

    if (!sendResponse.success) {
      // Handle specific errors
      let statusCode = 500;
      let userMessage = isEmail ? 'Failed to send verification email' : 'Failed to send verification code';

      if (!isEmail && sendResponse.message) {
        // SMS-specific error handling
        if (sendResponse.message.includes('insufficient credit') || sendResponse.message.includes('balance')) {
          userMessage = 'Service temporarily unavailable. Please try again later.';
          statusCode = 503;
        } else if (sendResponse.message.includes('invalid number') || sendResponse.message.includes('number')) {
          userMessage = 'Invalid phone number. Please check and try again.';
          statusCode = 400;
        } else if (sendResponse.message.includes('authentication') || sendResponse.message.includes('token')) {
          userMessage = 'Service configuration error. Please contact support.';
          statusCode = 503;
        }
      }

      return NextResponse.json(
        { success: false, error: userMessage, message: userMessage },
        { status: statusCode }
      );
    }

    // Store OTP for verification
    OTPStorage.store(phoneNumber, otp);

    return NextResponse.json({
      success: true,
      message: isEmail ? 'Verification email sent successfully' : 'OTP sent successfully',
      method: isEmail ? 'email' : 'sms',
      cost: sendResponse.cost,
      currency: sendResponse.currency,
    });

  } catch (error) {
    console.error('Send OTP API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}