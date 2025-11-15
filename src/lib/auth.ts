import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { countryCodes } from '@/data/countryCodes';

// Initialize Prisma Client with singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "backoffice",
      name: "Backoffice",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Backoffice login attempt:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            console.log('❌ User not found');
            return null;
          }

          if (!user.password) {
            console.log('❌ User has no password set');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return null;
          }

          // Check if user account is suspended
          if (!user.isActive) {
            console.log('❌ User account is suspended');
            throw new Error('ACCOUNT_SUSPENDED');
          }

          // Check if user has admin or superadmin role
          if (user.role !== 'admin' && user.role !== 'superadmin') {
            console.log('❌ User is not an admin. Role:', user.role);
            return null;
          }

          console.log('✅ Backoffice login success for admin:', user.email);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role
          };
        } catch (error) {
          console.error('🚨 Backoffice auth error:', error);
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: "phone-email",
      name: "Phone/Email",
      credentials: {
        contact: { label: "Phone/Email", type: "text" },
        password: { label: "Password", type: "password" },
        verified: { label: "Verified", type: "text" }
      },
      async authorize(credentials) {
        console.log('🔍 Credentials provider called with:', credentials);
        
        if (!credentials?.contact) {
          console.log('❌ Missing contact information');
          return null;
        }

        try {
          console.log('🔎 Looking for user with contact:', credentials.contact);
          // Find user by phone or email - handle both old and new phone storage formats
          let user = null;
          
          if (credentials.contact.includes('@')) {
            // Email lookup
            user = await prisma.user.findFirst({
              where: { email: credentials.contact }
            });
          } else {
            // Phone lookup - try multiple formats for compatibility
            
            // First try: exact match (old format with full phone number)
            user = await prisma.user.findFirst({
              where: { phone: credentials.contact }
            });
            
            // Second try: new format (country code + local phone separated)
            if (!user && credentials.contact.startsWith('+')) {
              // Use sophisticated parsing with countryCodes reference - same logic as verify-OTP
              const sortedCountryCodes = countryCodes
                .slice()
                .sort((a, b) => b.dialCode.length - a.dialCode.length);

              for (const countryData of sortedCountryCodes) {
                if (credentials.contact.startsWith(countryData.dialCode)) {
                  const countryCode = countryData.dialCode;
                  const localPhone = credentials.contact.slice(countryData.dialCode.length);
                  
                  console.log('🔍 Trying authentication lookup:', { countryCode, localPhone });
                  
                  user = await prisma.user.findFirst({
                    where: {
                      AND: [
                        { countryCode: countryCode },
                        { phone: localPhone }
                      ]
                    }
                  });
                  
                  if (user) {
                    console.log('✅ Found user with separated phone format');
                    break;
                  }
                }
              }
            }
          }
          
          user = user as any;

          console.log('👤 Found user:', user ? 'Yes' : 'No');

          if (!user) {
            console.log('🚫 User not found');
            return null;
          }

          // Check if user account is suspended
          if (!user.isActive) {
            console.log('❌ User account is suspended');
            throw new Error('ACCOUNT_SUSPENDED');
          }

          // Check if this is OTP verification (signup flow) or password login
          if (credentials.verified === "true" && !credentials.password) {
            // OTP verification flow - check if contact method is verified
            const isVerified = credentials.contact.includes('@') 
              ? user.emailVerified 
              : user.phoneVerified;

            console.log('✅ OTP verification - User verification status:', isVerified ? 'Verified' : 'Not verified');

            if (isVerified) {
              const authUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                phone: user.phone,
                role: user.role || 'user'
              };
              console.log('🎯 OTP verification success - Returning authenticated user:', authUser);
              return authUser;
            }
          } else if (credentials.password) {
            // Password login flow - validate password
            console.log('🔐 Password login attempt');
            
            if (!user.password) {
              console.log('❌ User has no password set');
              return null;
            }

            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            console.log('🔑 Password validation:', isPasswordValid ? 'Valid' : 'Invalid');

            if (isPasswordValid) {
              // Also check if contact method is verified
              const isVerified = credentials.contact.includes('@') 
                ? user.emailVerified 
                : user.phoneVerified;

              if (isVerified) {
                const authUser = {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  image: user.image,
                  phone: user.phone,
                  role: user.role || 'user'
                };
                console.log('🎯 Password login success - Returning authenticated user:', authUser);
                return authUser;
              } else {
                console.log('❌ User contact not verified');
                return null;
              }
            }
          }

          console.log('🚫 Authentication failed');
          return null;
        } catch (error) {
          console.error('🚨 Credentials auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      if (user) {
        token.user = user;
        // Store user ID for future database queries
        token.sub = user.id;
        token.role = (user as any).role || 'user';
      }

      // Refresh role from database on each request (for admin role changes)
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, isActive: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token.user) {
        session.user = token.user as any;
      }
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      session.user.role = token.role as string;
      session.user.isActive = token.isActive as boolean;
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth providers
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        console.log(`${account.provider} sign-in successful:`, {
          user: user.email,
          name: user.name
        });
        
        try {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // Create new user for OAuth
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              }
            });
          }
        } catch (error) {
          console.error('Error creating/checking user:', error);
        }
        
        return true;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle backoffice redirects
      if (url.includes('/backoffice')) {
        return url;
      }
      // Redirect OAuth sign-ins to deliveries page
      // Redirect to homepage for signup, deliveries for login
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/deliveries`;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}