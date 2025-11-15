'use client';

import { useState, useEffect } from 'react';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useT } from '@/lib/i18n-helpers';

export default function TermsAndPolicyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { termsAndPolicy: t } = useT();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchTermsPolicy = async () => {
      try {
        const response = await fetch('/api/backoffice/terms-policy');
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || '');
          setUpdatedAt(data.updatedAt);
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTermsPolicy();
  }, []);

  const handleBack = () => {
    // Check if there's a returnUrl parameter
    const returnUrl = searchParams.get('returnUrl');
    
    if (returnUrl) {
      router.push(returnUrl);
    } else if (session) {
      // If user is authenticated, go to settings page
      router.push('/settings');
    } else {
      // If user is not authenticated, go to auth page
      router.push('/auth');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-transparent sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-white px-6 py-2 rounded-full border border-gray-300 flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-orange-600" />
                <h1 className="text-base font-bold text-slate-900">{t('title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {content ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-center py-12">
              <FiFileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{t('noContent')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {updatedAt && (
          <div className="mt-6 text-center text-sm text-slate-500">
            {t('lastUpdated')}: {new Date(updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        )}
      </div>
    </div>
  );
}
