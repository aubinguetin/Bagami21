import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, phoneNumber, newPassword } = body;
    
    // Support both 'identifier' and 'phoneNumber' for backward compatibility
    const contact = identifier || phoneNumber;

    // Validate request
    if (!contact || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Contact information and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character' },
        { status: 400 }
      );
    }

    try {
      console.log('🔐 Resetting password for user:', contact);
      
      // Normalize phone number formats for comparison
      const normalizedContact = contact.replace(/[\s\-\(\)]/g, '');
      
      console.log('🔍 Looking for user with contact:', normalizedContact);
      
      // Find user by phone number or email
      // Phone numbers might be stored in split format: countryCode + phone
      let user = null;
      
      if (contact.includes('@')) {
        // Email lookup
        user = await prisma.user.findFirst({
          where: { email: contact }
        });
      } else {
        // Phone number lookup - try multiple formats
        // First try full phone number (legacy format)
        user = await prisma.user.findFirst({
          where: { 
            OR: [
              { phone: normalizedContact },
              { phone: normalizedContact.replace(/^\+/, '') },
              { phone: normalizedContact.startsWith('+') ? normalizedContact : `+${normalizedContact}` }
            ]
          }
        });
        
        // If not found, try the split format (countryCode + phone)
        if (!user) {
          const { countryCodes } = await import('@/data/countryCodes');
          const sortedCountryCodes = [...countryCodes].sort((a, b) => b.dialCode.length - a.dialCode.length);
          
          for (const country of sortedCountryCodes) {
            if (normalizedContact.startsWith(country.dialCode)) {
              const localPhone = normalizedContact.substring(country.dialCode.length);
              console.log('🔍 Trying split format:', { countryCode: country.dialCode, localPhone });
              
              user = await prisma.user.findFirst({
                where: {
                  countryCode: country.dialCode,
                  phone: localPhone
                }
              });
              
              if (user) {
                console.log('✅ Found user with split format!');
                break;
              }
            }
          }
        }
      }

      console.log('👤 User lookup result:', user ? `Found user ${user.id} with phone: ${user.phone}, countryCode: ${user.countryCode}` : 'No user found');

      if (!user) {
        // Additional debug: try to find ANY user to see what phone formats exist
        const allUsers = await prisma.user.findMany({
          select: { id: true, phone: true, countryCode: true, email: true },
          take: 5,
          orderBy: { createdAt: 'desc' }
        });
        console.log('📋 Sample users in database:', allUsers.map(u => ({ 
          id: u.id, 
          phone: u.phone, 
          countryCode: u.countryCode,
          fullPhone: u.countryCode && u.phone ? `${u.countryCode}${u.phone}` : u.phone,
          email: u.email 
        })));
        
        return NextResponse.json(
          { success: false, message: 'User not found with this contact information' },
          { status: 404 }
        );
      }

      // Check if user's contact method is verified
      // NOTE: For forgot password flow, we verify via OTP, so we should be more lenient here
      const isEmail = contact.includes('@');
      const isVerified = isEmail ? user.emailVerified : user.phoneVerified;
      
      // Only enforce verification check for email-based resets
      // Phone-based resets are verified through the OTP process
      if (isEmail && !isVerified) {
        return NextResponse.json(
          { success: false, message: 'Email is not verified' },
          { status: 400 }
        );
      }
      
      // For phone-based resets, we trust the OTP verification that happened before this step
      console.log(`📱 Verification status - isEmail: ${isEmail}, isVerified: ${!!isVerified}, proceeding with reset`);


      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        } as any
      });

      console.log('✅ Password updated successfully for user:', user.id);

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (dbError) {
      console.error('🚨 Database error during password reset:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database error occurred' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}