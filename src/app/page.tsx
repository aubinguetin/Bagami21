'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from '@/components/providers/TranslationProvider';
import { 
  Home,
  Package,
  User,
  Bell, 
  MessageCircle,
  Plane,
  Search,
  Users,
  Shield,
  TrendingUp,
  MapPin,
  ArrowRight,
  Check,
  Star,
  Zap,
  Heart,
  Globe,
  Lock,
  Clock,
  Award,
  ChevronRight,
  Plus
} from 'lucide-react';
import { PostTypeSelectionModal } from '@/components/PostTypeSelectionModal';

export default function Homepage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('homepage');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, observerOptions);

    // Observe all elements with data-animate attribute
    const animateElements = document.querySelectorAll('[data-animate]');
    animateElements.forEach(el => {
      el.classList.add('opacity-0', 'translate-y-10');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isAuthenticated]);

  // Get current user info from session or localStorage
  const getCurrentUserInfo = () => {
    // Try to get from NextAuth session first
    if (session?.user?.id) {
      const userContact = session.user.email || (session.user as any).phone;
      return {
        userId: session.user.id,
        userContact: userContact
      };
    }
    
    // Fallback to localStorage
    const currentUserId = localStorage.getItem('bagami_user_id');
    const currentUserContact = localStorage.getItem('bagami_user_contact');
    
    return {
      userId: currentUserId,
      userContact: currentUserContact
    };
  };

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      const params = new URLSearchParams();
      if (currentUserId) params.set('currentUserId', currentUserId);
      if (currentUserContact) params.set('currentUserContact', encodeURIComponent(currentUserContact));
      
      const url = `/api/messages/unread-count${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        setUnreadMessageCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    // Check for simple authentication flag
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      // Use a timeout to avoid router.push during render
      const timeoutId = setTimeout(() => {
        router.push('/auth');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [status, router]);

  // Enhanced polling with smart intervals and visibility detection
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();
    
    // Smart polling: faster when active, slower when background
    const getPollingInterval = () => {
      return document.hidden ? 30000 : 5000; // 30s background, 5s active
    };

    let interval = setInterval(fetchUnreadCount, getPollingInterval());

    // Handle visibility change for immediate updates
    const handleVisibilityChange = () => {
      clearInterval(interval);
      
      if (!document.hidden) {
        // Immediate refresh when returning to tab
        fetchUnreadCount();
      }
      
      // Restart with appropriate interval
      interval = setInterval(fetchUnreadCount, getPollingInterval());
    };

    // Listen for focus events for even faster response
    const handleFocus = () => {
      fetchUnreadCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]);

  // Helper function to get consistent user info
  const getUserInfo = () => {
    if (session?.user) {
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        contact: session.user.email || (session.user as any).phone
      };
    }
    
    // Fallback for localStorage-based authentication
    return {
      id: localStorage.getItem('bagami_user_id'),
      name: 'User',
      contact: localStorage.getItem('bagami_user_contact')
    };
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Please sign in</h2>
          <p className="mt-2 text-sm text-gray-600">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  const userInfo = getUserInfo();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50 pt-8 pb-12">
        {/* Decorative Elements with Animation */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Headline with fade in animation */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight animate-fade-in">
              {t('hero.title')}
              <br />
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent animate-gradient-x">
                {t('hero.titleGradient')}
              </span>
            </h1>

            {/* Subheadline with delayed animation */}
            <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto animate-fade-in animation-delay-200">
              {t('hero.subtitle')}
              <span className="text-gray-900 font-semibold"> {t('hero.subtitleBold')}</span>
            </p>

            {/* CTA Buttons with staggered animation */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-fade-in animation-delay-400">
              <button
                onClick={() => setShowPostTypeModal(true)}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-blue-500 hover:from-orange-600 hover:via-orange-700 hover:to-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 animate-pulse-gentle">
                <span>{t('hero.postDeliveries')}</span>
              </button>
              <button
                onClick={() => router.push('/deliveries')}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all border-2 border-gray-200 transform hover:scale-105 hover:-translate-y-1"
              >
                {t('hero.browseListings')}
              </button>
            </div>

            {/* Feature Pills with staggered animation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in animation-delay-600">
              <div className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-105 transition-all transform">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center animate-bounce-subtle">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('hero.affordableRates')}</p>
                  <p className="text-xs text-gray-600">{t('hero.saveUpTo')}</p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-105 transition-all transform animation-delay-100">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center animate-bounce-subtle animation-delay-200">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('hero.protectedPayments')}</p>
                  <p className="text-xs text-gray-600">{t('hero.guaranteed')}</p>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-105 transition-all transform animation-delay-200">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center animate-bounce-subtle animation-delay-400">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('hero.trustedCommunity')}</p>
                  <p className="text-xs text-gray-600">{t('hero.verifiedMembers')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('howItWorks.title')} <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {t('howItWorks.titleGradient')}
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto mt-2">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group" data-animate>
              <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border-2 border-orange-100 hover:border-orange-300 transition-all hover:shadow-xl h-full transform hover:scale-105 hover:-translate-y-2">
                {/* Step number badge - top left inside */}
                <div className="absolute top-6 left-6 w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-orange-100 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  1
                </div>
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:-rotate-6 transition-transform">
                    <Plane className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{t('howItWorks.step1.title')}</h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  <span className="font-semibold text-orange-600">{t('howItWorks.step1.needDelivery')}</span> {t('howItWorks.step1.needDeliveryDesc')}
                  <br />
                  <span className="font-semibold text-blue-600">{t('howItWorks.step1.traveling')}</span> {t('howItWorks.step1.travelingDesc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group" data-animate>
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl h-full transform hover:scale-105 hover:-translate-y-2 animation-delay-100">
                {/* Step number badge - top left inside */}
                <div className="absolute top-6 left-6 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-blue-100 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  2
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:rotate-6 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{t('howItWorks.step2.title')}</h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  {t('howItWorks.step2.description')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group" data-animate>
              <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-xl h-full transform hover:scale-105 hover:-translate-y-2 animation-delay-200">
                {/* Step number badge - top left inside */}
                <div className="absolute top-6 left-6 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-green-100 group-hover:scale-110 group-hover:rotate-12 transition-all">
                  3
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:rotate-6 transition-transform">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{t('howItWorks.step3.title')}</h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  {t('howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Win-Win Section */}
      <section className="py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('winWin.title')} <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {t('winWin.titleGradient')}
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
              {t('winWin.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Senders */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2" data-animate>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-subtle">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t('winWin.senders.title')}</h3>
              </div>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                {t('winWin.senders.description')} <span className="font-bold text-orange-600">{t('winWin.senders.savingHighlight')}</span> {t('winWin.senders.descriptionContinued')}
              </p>
              <button
                onClick={() => router.push('/deliveries/new-request')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <span>{t('winWin.senders.cta')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Transporters */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2 animation-delay-100" data-animate>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-subtle animation-delay-200">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t('winWin.travelers.title')}</h3>
              </div>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                {t('winWin.travelers.description')} <span className="font-bold text-blue-600">{t('winWin.travelers.earningHighlight')}</span> {t('winWin.travelers.descriptionContinued')}
              </p>
              <button
                onClick={() => router.push('/deliveries/new-offer')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <span>{t('winWin.travelers.cta')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Bagami Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('whyChoose.title')} <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{t('whyChoose.titleGradient')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="text-center group transform hover:scale-110 transition-all" data-animate>
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-md">
                <Heart className="w-8 h-8 text-green-600 animate-pulse-gentle" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('whyChoose.feature1.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('whyChoose.feature1.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group transform hover:scale-110 transition-all animation-delay-100" data-animate>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-md">
                <Shield className="w-8 h-8 text-blue-600 animate-pulse-gentle animation-delay-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('whyChoose.feature2.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('whyChoose.feature2.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group transform hover:scale-110 transition-all animation-delay-200" data-animate>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-md">
                <Users className="w-8 h-8 text-purple-600 animate-pulse-gentle animation-delay-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('whyChoose.feature3.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('whyChoose.feature3.description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center group transform hover:scale-110 transition-all animation-delay-300" data-animate>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform shadow-md">
                <Zap className="w-8 h-8 text-orange-600 animate-pulse-gentle animation-delay-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('whyChoose.feature4.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('whyChoose.feature4.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div data-animate>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('trustSecurity.title')} <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('trustSecurity.titleGradient')}</span>
              </h2>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                {t('trustSecurity.subtitle')}
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-4 transform hover:translate-x-2 transition-transform">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0 animate-bounce-subtle">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">{t('trustSecurity.securePayments.title')}</h4>
                    <p className="text-sm text-gray-600">{t('trustSecurity.securePayments.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 transform hover:translate-x-2 transition-transform animation-delay-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0 animate-bounce-subtle animation-delay-200">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">{t('trustSecurity.verifiedUsers.title')}</h4>
                    <p className="text-sm text-gray-600">{t('trustSecurity.verifiedUsers.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 transform hover:translate-x-2 transition-transform animation-delay-200">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0 animate-bounce-subtle animation-delay-400">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">{t('trustSecurity.ratings.title')}</h4>
                    <p className="text-sm text-gray-600">{t('trustSecurity.ratings.description')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative" data-animate>
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 transform hover:scale-105 transition-all animation-delay-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('trustSecurity.satisfaction.successRate')}</p>
                      <p className="text-xl font-bold text-gray-900">99.99%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500"></p>
                    <p className="text-xl font-bold text-gray-900"></p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                  </div>
                  <p className="text-sm text-gray-700 italic mb-2">
                    "{t('trustSecurity.satisfaction.testimonial')}"
                  </p>
                  <p className="text-xs font-semibold text-gray-900">{t('trustSecurity.satisfaction.testimonialAuthor')}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-orange-600">70%</p>
                    <p className="text-xs text-gray-600 mt-1">{t('trustSecurity.satisfaction.lowerCost')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-blue-600">{t('trustSecurity.satisfaction.fastMatching')}</p>
                    <p className="text-xs text-gray-600 mt-1">{t('trustSecurity.satisfaction.matching')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-green-600">4.8★</p>
                    <p className="text-xs text-gray-600 mt-1">{t('trustSecurity.satisfaction.rated')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-orange-600 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-64 h-64 bg-white/10 rounded-full -top-32 -right-32 animate-pulse-gentle"></div>
          <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -left-48 animate-blob"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center" data-animate>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fade-in">
            {t('finalCta.title')}
          </h2>
          <p className="text-lg text-orange-100 mb-6 max-w-2xl mx-auto animate-fade-in animation-delay-200">
            {t('finalCta.subtitle')}
          </p>
          <div className="flex justify-center animate-fade-in animation-delay-400">
            <button
              onClick={() => router.push('/deliveries')}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-orange-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-110 hover:-translate-y-1"
            >
              {t('finalCta.cta')}
            </button>
          </div>
          <h2 className="text-3xl md:text-10xl font-bold text-white mb-4 animate-fade-in"> </h2>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 h-16 max-w-screen-xl mx-auto">
          {/* Search */}
          <button
            onClick={() => router.push('/deliveries')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <Search className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.search')}</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => router.push('/messages')}
            className="group relative flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.messages')}</span>
          </button>

          {/* Post Button - Center */}
          <button
            onClick={() => setShowPostTypeModal(true)}
            className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95"
          >
            {/* Icon container with white background and orange border */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md blur-md opacity-40" />
              
              {/* Icon container */}
              <div className="relative bg-white border-2 border-orange-500 p-1 rounded-md shadow-lg">
                <Plus className="w-3 h-3 text-orange-500" />
              </div>
            </div>
            
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">{t('bottomNav.post')}</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => router.push('/notifications')}
            className="group relative flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <div className="relative">
              <Bell className="w-6 h-6 transition-transform group-hover:scale-110" />
              {/* Notification badge - placeholder for future */}
              {/* <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                3
              </span> */}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.notifications')}</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => router.push('/profile')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <User className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.profile')}</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-2">
          <button
            onClick={() => router.push('/deliveries')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <Search className="w-5 h-5" />
            <span className="font-medium">Search</span>
          </button>

          <button
            onClick={() => router.push('/messages')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </div>
            <span className="font-medium">Messages</span>
          </button>

          <button
            onClick={() => setShowPostTypeModal(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-orange-100 text-orange-700 hover:bg-orange-200"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Post</span>
          </button>

          <button
            onClick={() => router.push('/notifications')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
        </div>
      </aside>

      {/* Post Type Selection Modal */}
      <PostTypeSelectionModal 
        isOpen={showPostTypeModal}
        onClose={() => setShowPostTypeModal(false)}
      />
    </div>
  );
}