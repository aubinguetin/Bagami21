'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Star, 
  User,
  Calendar,
  MessageCircle,
  TrendingUp,
  Award,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useT, useLocale, translateDeliveryTitle } from '@/lib/i18n-helpers';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    image?: string;
  };
  delivery?: {
    id: string;
    title: string;
    type: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const highlightedReviewRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const locale = useLocale();

  // Get reviewId from URL params
  useEffect(() => {
    const reviewId = searchParams.get('reviewId');
    if (reviewId) {
      setHighlightedReviewId(reviewId);
      
      // Remove highlight after 5 seconds
      const timer = setTimeout(() => {
        setHighlightedReviewId(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Scroll to highlighted review
  useEffect(() => {
    if (highlightedReviewId && highlightedReviewRef.current && !isLoading) {
      setTimeout(() => {
        highlightedReviewRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [highlightedReviewId, isLoading]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Authentication check
  useEffect(() => {
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      router.push('/auth');
    }
  }, [status, router]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const currentUserId = localStorage.getItem('bagami_user_id');
        const currentUserContact = localStorage.getItem('bagami_user_contact');

        const params = new URLSearchParams();
        if (currentUserId) params.set('userId', currentUserId);
        if (currentUserContact) params.set('userContact', encodeURIComponent(currentUserContact));
        if (filterRating) params.set('rating', filterRating.toString());

        const response = await fetch(`/api/reviews?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setReviews(data.reviews || []);
          setStats(data.stats || null);
        } else {
          console.error('Error fetching reviews:', data.error);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [isAuthenticated, filterRating]);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    if (!stats || stats.totalReviews === 0) return 0;
    return (stats.ratingDistribution[rating as 5 | 4 | 3 | 2 | 1] / stats.totalReviews) * 100;
  };

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t.reviewsPage('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
                <h1 className="text-base font-bold text-slate-800">{t.reviewsPage('title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>
      <div className="pt-16"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="text-6xl font-bold text-orange-600">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div>
                    {renderStars(Math.round(stats.averageRating), 'lg')}
                    <p className="text-sm text-gray-600 mt-1">
                      {stats.totalReviews} {stats.totalReviews === 1 ? t.reviewsPage('review') : t.reviewsPage('reviews')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getRatingPercentage(rating)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 w-8 text-right">
                      {stats.ratingDistribution[rating as 5 | 4 | 3 | 2 | 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalReviews || 0}</p>
            <p className="text-xs text-gray-600">{t.reviewsPage('totalReviews')}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats?.averageRating.toFixed(1) || '0.0'}</p>
            <p className="text-xs text-gray-600">{t.reviewsPage('avgRating')}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-blue-600 fill-current" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats ? stats.ratingDistribution[5] : 0}
            </p>
            <p className="text-xs text-gray-600">{t.reviewsPage('fiveStarReviews')}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">{t.reviewsPage('allReviews')}</h2>
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {filterRating ? `${filterRating} ${t.reviewsPage('stars')}` : t.reviewsPage('allRatings')}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setFilterRating(null);
                    setShowFilterDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
                >
                  {t.reviewsPage('allRatings')}
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      setFilterRating(rating);
                      setShowFilterDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <span>{rating}</span>
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div 
                key={review.id} 
                ref={review.id === highlightedReviewId ? highlightedReviewRef : null}
                className={`bg-white rounded-xl p-6 shadow-sm transition-all duration-300 ${
                  review.id === highlightedReviewId 
                    ? 'border-2 border-orange-400 shadow-lg' 
                    : 'border border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Reviewer Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {review.reviewer.image ? (
                      <img 
                        src={review.reviewer.image} 
                        alt={review.reviewer.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Reviewer Info */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{review.reviewer.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {renderStars(review.rating, 'sm')}
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Comment */}
                    {review.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {review.comment}
                      </p>
                    )}

                    {/* Related Delivery */}
                    {review.delivery && (
                      <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                        <MessageCircle className="w-3 h-3" />
                        <span className="truncate">
                          {review.delivery.type === 'request' ? t.reviewsPage('deliveryRequest') : t.reviewsPage('spaceOffer')}: {translateDeliveryTitle(review.delivery.title, locale)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.reviewsPage('emptyState.title')}</h3>
              <p className="text-gray-600">
                {filterRating 
                  ? t.reviewsPage('emptyState.withFilter').replace('{rating}', filterRating.toString())
                  : t.reviewsPage('emptyState.noFilter')
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
