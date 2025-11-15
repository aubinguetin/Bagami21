'use client';

import React, { useState, useRef, useEffect, FormEvent, ClipboardEvent, KeyboardEvent } from 'react';
import { Phone, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useT, useLocale } from '@/lib/i18n-helpers';

interface OtpVerificationProps {
  contact: string; // Email or phone number
  verificationType: 'phone' | 'email';
  onVerify: (otp: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function OtpVerification({ contact, verificationType, onVerify, onBack, isLoading = false }: OtpVerificationProps) {
  const t = useT();
  const locale = useLocale();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0); // Start at 0 - allow immediate resend
  const [canResend, setCanResend] = useState(true); // Allow resend immediately
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      onVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    if (pastedData.length === 6) {
      onVerify(pastedData);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: contact, // API uses 'phoneNumber' param for both
          type: 'signup',
          language: locale
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(t.authPage('otpVerification.resendSuccess'));
        setCountdown(10); // Short 10-second cooldown after resend
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
      } else {
        alert(result.message || t.authPage('otpVerification.resendFailed'));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      alert(t.authPage('otpVerification.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format Burkina Faso phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('226')) {
      return `+226 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t.authPage('otpVerification.back')}
          </button>
          
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            {verificationType === 'phone' ? (
              <Phone className="w-10 h-10 text-orange-500" />
            ) : (
              <Mail className="w-10 h-10 text-orange-500" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {verificationType === 'phone' ? t.authPage('otpVerification.titlePhone') : t.authPage('otpVerification.titleEmail')}
          </h1>
          <p className="text-gray-600 text-center">
            {t.authPage('otpVerification.subtitleSent')}
          </p>
          <p className="font-semibold text-slate-800">
            {verificationType === 'phone' ? formatPhoneNumber(contact) : contact}
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            {t.authPage('otpVerification.hintRequest')}
          </p>
        </div>

        {/* OTP Form Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-4 text-center">
              {t.authPage('otpVerification.enterCode')}
            </label>
            
            <div className="flex justify-center space-x-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Resend Code */}
          <div className="text-center mb-6">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center justify-center mx-auto text-orange-500 hover:text-orange-600 font-medium"
              >
                {isResending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isResending ? t.authPage('otpVerification.sendingNewCode') : t.authPage('otpVerification.sendNewCode')}
              </button>
            ) : (
              <p className="text-gray-500 text-sm">
                {t.authPage('otpVerification.requestNewCodeIn').replace('{seconds}', countdown.toString())}
              </p>
            )}
          </div>

          {/* Manual Verify Button */}
          <button
            onClick={() => onVerify(otp.join(''))}
            disabled={otp.join('').length !== 6 || isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t.authPage('otpVerification.verifying') : t.authPage('otpVerification.verifyCode')}
          </button>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t.authPage('otpVerification.didNotReceive')}{' '}
              <button 
                onClick={onBack}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                {verificationType === 'phone' ? t.authPage('otpVerification.changePhone') : t.authPage('otpVerification.changeEmail')}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {t.authPage('footer')}
        </div>
      </div>
    </div>
  );
}