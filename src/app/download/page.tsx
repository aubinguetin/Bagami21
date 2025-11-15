'use client';

import { useEffect } from 'react';
import { Users, Shield, Zap, Globe, CheckCircle, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useT } from '@/lib/i18n-helpers';

export default function DownloadPage() {
  const { downloadPage } = useT();

  // Check if user is on mobile and redirect to appropriate store
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    // Auto-redirect after 3 seconds if on mobile (optional)
    // Uncomment the following if you want auto-redirect
    /*
    if (isIOS || isAndroid) {
      setTimeout(() => {
        if (isIOS) {
          window.location.href = 'https://apps.apple.com/app/bagami'; // Replace with actual App Store link
        } else if (isAndroid) {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.bagami'; // Replace with actual Play Store link
        }
      }, 3000);
    }
    */
  }, []);

  const handleAppStoreClick = () => {
    // Replace with actual App Store link
    window.open('https://apps.apple.com/app/bagami', '_blank');
  };

  const handlePlayStoreClick = () => {
    // Replace with actual Play Store link
    window.open('https://play.google.com/store/apps/details?id=com.bagami', '_blank');
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-50 to-yellow-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-orange-50 to-transparent rounded-full blur-3xl opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo/Brand Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-48 h-48 rounded-3xl flex items-center justify-center mx-auto mb-4 transform hover:scale-105 transition-transform duration-300">
            <Image 
              src="/bagamilogo_transparent2.png" 
              alt="Bagami Logo" 
              width={192}
              height={192}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-4xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-4">
            Bagami
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 font-semibold max-w-2xl mx-auto">
            {downloadPage('tagline')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-5xl w-full">
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 text-center border-2 border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-white" />
            </div>
            <p className="text-gray-800 text-sm font-bold">{downloadPage('features.trusted')}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 text-center border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <p className="text-gray-800 text-sm font-bold">{downloadPage('features.secure')}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 text-center border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <p className="text-gray-800 text-sm font-bold">{downloadPage('features.fast')}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 text-center border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <p className="text-gray-800 text-sm font-bold">{downloadPage('features.global')}</p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="space-y-4 w-full max-w-md mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {downloadPage('downloadNow')}
          </h2>
          
          {/* App Store Button */}
          <button
            onClick={handleAppStoreClick}
            className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl px-6 py-5 flex items-center justify-center gap-4 shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 border-2 border-transparent hover:border-gray-700"
          >
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left">
              <p className="text-xs opacity-90">{downloadPage('downloadOn')}</p>
              <p className="text-xl font-bold">App Store</p>
            </div>
          </button>

          {/* Play Store Button */}
          <button
            onClick={handlePlayStoreClick}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 rounded-2xl px-6 py-5 flex items-center justify-center gap-4 shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 border-2 border-gray-200 hover:border-gray-300"
          >
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.609 1.814L13.792 12L3.61 22.186C3.218 21.85 3 21.346 3 20.768V3.232C3 2.654 3.218 2.15 3.609 1.814Z" fill="url(#paint0_linear)"/>
              <path d="M20.538 10.946L16.754 8.778L13.443 12L16.754 15.222L20.538 13.054C21.487 12.522 21.487 11.478 20.538 10.946Z" fill="url(#paint1_linear)"/>
              <path d="M3.609 1.814L13.792 12L16.754 8.778L5.239 2.178C4.536 1.786 3.833 1.766 3.609 1.814Z" fill="url(#paint2_linear)"/>
              <path d="M3.609 22.186L13.792 12L16.754 15.222L5.239 21.822C4.536 22.214 3.833 22.234 3.609 22.186Z" fill="url(#paint3_linear)"/>
              <defs>
                <linearGradient id="paint0_linear" x1="11.395" y1="3.232" x2="2.605" y2="12.022" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00A0FF"/>
                  <stop offset="0.007" stopColor="#00A1FF"/>
                  <stop offset="0.26" stopColor="#00BEFF"/>
                  <stop offset="0.512" stopColor="#00D2FF"/>
                  <stop offset="0.76" stopColor="#00DFFF"/>
                  <stop offset="1" stopColor="#00E3FF"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="22.097" y1="12" x2="2.897" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFE000"/>
                  <stop offset="0.409" stopColor="#FFBD00"/>
                  <stop offset="0.775" stopColor="#FFA500"/>
                  <stop offset="1" stopColor="#FF9C00"/>
                </linearGradient>
                <linearGradient id="paint2_linear" x1="14.869" y1="-1.577" x2="-0.801" y2="14.093" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF3A44"/>
                  <stop offset="1" stopColor="#C31162"/>
                </linearGradient>
                <linearGradient id="paint3_linear" x1="-2.287" y1="34.405" x2="13.383" y2="18.735" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#32A071"/>
                  <stop offset="0.069" stopColor="#2DA771"/>
                  <stop offset="0.476" stopColor="#15CF74"/>
                  <stop offset="0.801" stopColor="#06E775"/>
                  <stop offset="1" stopColor="#00F076"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="text-left">
              <p className="text-xs opacity-70">{downloadPage('getItOn')}</p>
              <p className="text-xl font-bold">Google Play</p>
            </div>
          </button>
        </div>

        {/* Additional Info */}
        <div className="text-center max-w-2xl">
          <p className="text-gray-600 text-sm mb-4 font-medium">
            {downloadPage('availableOn')}
          </p>
          <div className="flex items-center justify-center gap-6 text-gray-500 text-xs">
            <span className="bg-gray-100 px-4 py-2 rounded-full font-semibold">iOS 13.0+</span>
            <span className="bg-gray-100 px-4 py-2 rounded-full font-semibold">Android 6.0+</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 Bagami. {downloadPage('allRightsReserved')}
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
