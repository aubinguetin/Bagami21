import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchCitiesAndCountries } from '@/utils/locationService';
import countries from 'i18n-iso-countries';

// Initialize countries with English locale
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

// Helper function to get current user ID consistently
const getCurrentUserId = async (fallbackUserId?: string, fallbackUserContact?: string): Promise<string | undefined> => {
  console.log('🔍 Resolving user ID with:', { fallbackUserId: !!fallbackUserId, fallbackUserContact: !!fallbackUserContact });
  
  // Try fallback user ID first (most reliable)
  if (fallbackUserId) {
    console.log('✅ Using fallback user ID:', fallbackUserId);
    return fallbackUserId;
  }

  // Try fallback user contact
  if (fallbackUserContact) {
    console.log('🔍 Looking up user by contact:', fallbackUserContact);
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: fallbackUserContact },
          { phone: fallbackUserContact }
        ]
      }
    });

    // If not found and it looks like a phone number, try separated format
    if (!user && fallbackUserContact.startsWith('+')) {
      console.log('🔍 Trying separated phone format for:', fallbackUserContact);
      try {
        const result = await prisma.$queryRaw`
          SELECT * FROM User 
          WHERE countryCode IS NOT NULL AND phone IS NOT NULL 
          AND CONCAT(countryCode, phone) = ${fallbackUserContact}
          LIMIT 1
        ` as any[];
        
        if (result && result.length > 0) {
          console.log('✅ Found user with separated phone format:', result[0].id);
          return result[0].id;
        }
      } catch (error) {
        console.error('Error in separated phone query:', error);
      }
    } else if (user) {
      console.log('✅ Found user by contact:', user.id);
      return user.id;
    }
  }

  // Fallback to NextAuth session
  console.log('🔍 Trying NextAuth session...');
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (session) {
    let userId: string | undefined = session.user?.id;
    if (!userId && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      userId = user?.id;
    }
    
    if (userId) {
      console.log('✅ Found user via NextAuth:', userId);
      return userId;
    }
  }

  console.log('❌ Could not resolve user ID');
  return undefined;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const departureCountry = searchParams.get('departureCountry') || '';
    const destinationCountry = searchParams.get('destinationCountry') || '';
    const mineOnly = searchParams.get('mineOnly') === 'true';
    const includeExpired = searchParams.get('includeExpired') === 'true';
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Support fallback authentication
    const fallbackUserId = searchParams.get('currentUserId');
    const fallbackUserContact = searchParams.get('currentUserContact');

    console.log('🔍 Search API called with mineOnly:', mineOnly, 'includeExpired:', includeExpired);
    console.log('🔎 BACKEND: Received search query:', searchQuery ? `"${searchQuery}"` : '(empty)');

    // Get current user ID consistently for both filtering and ownership
    const currentUserId = await getCurrentUserId(fallbackUserId || undefined, fallbackUserContact || undefined);
    console.log('🎯 Resolved current user ID:', currentUserId);

    // Check authentication for "mine only" filter
    if (mineOnly && !currentUserId) {
      console.log('❌ Authentication required for mine filter but no user ID found');
      return NextResponse.json({ error: 'Authentication required for this filter' }, { status: 401 });
    }

    // Build the where clause
    const where: any = {};

    // Filter by type if specified
    if (filter === 'requests') {
      where.type = 'request';
    } else if (filter === 'offers') {
      where.type = 'offer';
    }

    // Filter by countries (handle both country codes and full names)
    if (departureCountry) {
      // Get country name from country code if needed
      const countryName = countries.getNames('en')[departureCountry] || departureCountry;
      
      where.fromCountry = {
        in: [departureCountry, countryName] // Match either country code or full name
      };
    }
    if (destinationCountry) {
      // Get country name from country code if needed  
      const countryName = countries.getNames('en')[destinationCountry] || destinationCountry;
      
      where.toCountry = {
        in: [destinationCountry, countryName] // Match either country code or full name
      };
    }

    // Filter by current user if "mine" is selected
    if (mineOnly && currentUserId) {
      where.senderId = currentUserId;
      console.log('🔍 Filtering deliveries for user:', currentUserId);
    }

    // For non-mine view or when includeExpired is false, exclude expired posts
    if (!includeExpired) {
      const now = new Date();
      
      // Build expiration conditions based on the type filter
      if (filter === 'requests') {
        // Only delivery requests: check arrivalDate (when they need it delivered)
        where.arrivalDate = { gte: now };
      } else if (filter === 'offers') {
        // Only travel offers: check departureDate (when traveler is departing)
        where.departureDate = { gte: now };
      } else {
        // All types: check appropriate date for each type
        where.OR = [
          {
            // For delivery requests: check arrivalDate (when they need it delivered)
            AND: [
              { type: 'request' },
              { arrivalDate: { gte: now } }
            ]
          },
          {
            // For travel offers: check departureDate (when traveler is departing)
            AND: [
              { type: 'offer' },
              { departureDate: { gte: now } }
            ]
          }
        ];
      }
    }

    // Enhanced search in description, title, or cities (including country-to-cities mapping)
    if (searchQuery) {
      console.log('🔍 Processing search query:', searchQuery);
      
      // Get enhanced search results that include cities from matching countries
      const searchResults = searchCitiesAndCountries(searchQuery, 500); // Increased limit
      const cityNames = searchResults.cities; // This includes cities from matching countries
      
      console.log('🌍 Enhanced search found cities:', cityNames.slice(0, 5), `(${cityNames.length} total)`);
      
      // Split search query into individual terms for better matching
      // This allows "cadeaux gifts" to match deliveries containing either "cadeaux" OR "gifts"
      const searchTerms = searchQuery.trim().split(/\s+/);
      console.log('🔤 Search terms:', searchTerms);
      
      // For SQLite, we need to handle case-insensitive search differently
      // We'll use Prisma's 'contains' which uses LIKE in SQLite (case-insensitive for ASCII)
      const baseSearchConditions: any[] = [];
      
      // Add searches for EACH individual term in title and description
      searchTerms.forEach(term => {
        if (term.length >= 2) { // Minimum 2 characters
          baseSearchConditions.push(
            { title: { contains: term } },
            { description: { contains: term } }
          );
        }
      });
      
      // Add city searches for each term
      searchTerms.forEach(term => {
        if (term.length >= 2) {
          baseSearchConditions.push(
            { fromCity: { contains: term } },
            { toCity: { contains: term } }
          );
        }
      });
      
      // Add country searches - search in both fromCountry and toCountry fields
      // This handles country codes (e.g., "FR", "US") and country names
      searchTerms.forEach(term => {
        if (term.length >= 2) { // Minimum 2 characters for country code/name
          baseSearchConditions.push(
            { fromCountry: { contains: term } },
            { toCountry: { contains: term } }
          );
        }
      });
      
      // Add city-specific searches 
      if (cityNames.length > 0) {
        console.log('🏙️ Searching for deliveries in cities:', cityNames.slice(0, 5));
        console.log('🔍 Total cities to search:', cityNames.length);
        
        // Limit city searches to prevent query from being too large
        const limitedCities = cityNames.slice(0, 50); // Limit to first 50 cities
        limitedCities.forEach(cityName => {
          baseSearchConditions.push(
            { fromCity: { contains: cityName } },
            { toCity: { contains: cityName } }
          );
        });
      }
      
      console.log('📊 Total search conditions:', baseSearchConditions.length);
      
      // If there's already an OR condition (for expiration), we need to combine them properly
      if (where.OR) {
        // Combine search conditions with existing OR conditions using AND
        where.AND = [
          { OR: where.OR }, // Existing expiration conditions
          { OR: baseSearchConditions }, // Enhanced search conditions
          { deletedAt: null } // Exclude soft-deleted deliveries
        ];
        delete where.OR; // Remove the original OR to avoid conflicts
      } else {
        // No existing OR conditions, just add enhanced search conditions
        where.AND = [
          { OR: baseSearchConditions },
          { deletedAt: null } // Exclude soft-deleted deliveries
        ];
      }
    } else {
      // No search query - just filter out deleted deliveries
      where.deletedAt = null;
    }

    console.log('📋 Where clause:', JSON.stringify(where, null, 2));

    // Get total count for pagination
    const totalCount = await prisma.delivery.count({ where });

    // Fetch deliveries from database
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            reviewsReceived: {
              select: {
                rating: true
              }
            },
            idDocuments: {
              select: {
                verificationStatus: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    console.log('📦 Found deliveries:', deliveries.length, 'of', totalCount, 'total');

    // Transform the data for frontend consumption
    const transformedDeliveries = deliveries.map(delivery => {
      const now = new Date();
      const deliveryType = delivery.type; // Use the actual type from database
      
      // Determine if expired based on delivery type
      let isExpired = false;
      if (deliveryType === 'request') {
        // Delivery requests expire when arrivalDate (needed by) has passed
        isExpired = delivery.arrivalDate ? new Date(delivery.arrivalDate) < now : false;
      } else {
        // Travel offers expire when departureDate has passed
        isExpired = new Date(delivery.departureDate) < now;
      }

      const isOwned = delivery.senderId === currentUserId;

      // Calculate average rating for the sender
      const reviews = delivery.sender.reviewsReceived || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : null;
      const reviewCount = reviews.length;

      // Check if user has at least one approved ID document
      const isVerified = delivery.sender.idDocuments?.some(
        (doc) => doc.verificationStatus === 'approved'
      ) || false;

      return {
        id: delivery.id,
        type: deliveryType,
        title: delivery.title,
        description: delivery.description,
        weight: delivery.weight,
        price: delivery.price,
        currency: delivery.currency,
        fromCountry: delivery.fromCountry,
        fromCity: delivery.fromCity,
        toCountry: delivery.toCountry,
        toCity: delivery.toCity,
        departureDate: delivery.departureDate,
        arrivalDate: delivery.arrivalDate,
        status: delivery.status,
        sender: {
          ...delivery.sender,
          averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
          reviewCount,
          isVerified
        },
        createdAt: delivery.createdAt,
        route: `${delivery.fromCity} → ${delivery.toCity}`,
        isOwnedByCurrentUser: isOwned,
        isExpired: isExpired
      };
    });

    return NextResponse.json({
      success: true,
      deliveries: transformedDeliveries,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching deliveries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}