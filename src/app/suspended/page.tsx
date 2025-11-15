'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';

export default function SuspendedPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Sign out the user when they land on this page
  useEffect(() => {
    const handleSignOut = async () => {
      // Clear local storage
      localStorage.removeItem('bagami_authenticated');
      localStorage.removeItem('bagami_user_contact');
      localStorage.removeItem('bagami_user_id');
      localStorage.removeItem('bagami_user_name');

      // Sign out from NextAuth if session exists
      if (session) {
        await signOut({ redirect: false });
      }
    };

    handleSignOut();
  }, [session]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                Your account has been temporarily suspended due to a violation of our terms of service or community guidelines.
              </p>
              <p className="text-slate-600 text-sm">
                If you believe this is a mistake or would like to appeal this decision, please contact our customer service team.
              </p>
            </div>

            {/* Contact Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Contact Customer Service
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-700 min-w-[60px]">Email:</span>
                  <a 
                    href="mailto:baggami.services@gmail.com" 
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    baggami.services@gmail.com
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-700 min-w-[60px]">Phone:</span>
                  <a 
                    href="tel:+22665502626" 
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    +226 65 50 26 26
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-700 min-w-[60px]">Hours:</span>
                  <span className="text-slate-600">Monday - Friday, 9:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-amber-900 text-sm mb-2">Important Information</h3>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                <li>Your data and account information remain secure</li>
                <li>You cannot access your account until the suspension is lifted</li>
                <li>All pending deliveries have been paused</li>
                <li>Your wallet balance is safe and will be available when your account is restored</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/auth')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </button>
              
              <a
                href="mailto:baggami.services@gmail.com?subject=Account%20Suspension%20Appeal"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                Email Support
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              For immediate assistance, please contact our support team during business hours.
            </p>
          </div>
        </div>

        {/* Additional Note */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Need help? Visit our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
            Help Center
          </a>
        </p>
      </div>
    </div>
  );
}
