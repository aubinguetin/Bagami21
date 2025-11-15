'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, RefreshCw, Mail } from 'lucide-react';
import { useT, useLocale } from '@/lib/i18n-helpers';

interface OtpModalProps {
  isOpen: boolean;
  contact: string;
  type: 'email' | 'phone';
  onVerify: (otp: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function OtpModal({ isOpen, contact, type, onVerify, onClose, isLoading = false }: OtpModalProps) {
  const { settings } = useT();
  const locale = useLocale();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
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

  // Reset OTP when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setCountdown(0);
      setCanResend(true);
    }
  }, [isOpen]);

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

  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: contact,
          type: `${type}_verification`,
          language: locale,
          ...(type === 'phone' && { countryInfo: { dialCode: contact.substring(0, 4) } })
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setCountdown(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        // Focus first input after resend
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        alert(result.message || settings('otpModal.resendFailed'));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      alert(settings('otpModal.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  const formatContact = (contact: string) => {
    if (type === 'email') return contact;
    
    // Format phone number for display
    const cleaned = contact.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      // For Burkina Faso numbers (+226XXXXXXXX) - format as +226 XX XX XX XX
      if (cleaned.startsWith('226') && cleaned.length === 11) {
        return `+226 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
      }
      // For other international numbers - format appropriately
      else if (cleaned.length >= 10) {
        // Try to detect country code length and format accordingly
        if (cleaned.length === 11 && (cleaned.startsWith('1') || cleaned.startsWith('7'))) {
          // US/Canada or Russia format: +1 XXX XXX XXXX
          return `+${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
        } else if (cleaned.length === 12 && cleaned.startsWith('33')) {
          // France format: +33 X XX XX XX XX
          return `+33 ${cleaned.slice(2, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
        } else {
          // Generic international format
          return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
        }
      }
    }
    return contact;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {type === 'email' ? (
              <Mail className="w-8 h-8 text-orange-600" />
            ) : (
              <Phone className="w-8 h-8 text-orange-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {type === 'email' 
              ? settings('otpModal.verifyEmail')
              : settings('otpModal.verifyPhone')
            }
          </h2>
          
          <p className="text-gray-600">
            {settings('otpModal.codeSentTo')}{' '}
            <span className="font-medium text-gray-900">
              {formatContact(contact)}
            </span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center space-x-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={isLoading}
            />
          ))}
        </div>

        {/* Resend section */}
        <div className="text-center mb-6">
          {countdown > 0 ? (
            <p className="text-gray-600">
              {settings('otpModal.resendIn')} <span className="font-medium">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending || isLoading}
              className="text-orange-600 hover:text-orange-700 font-medium disabled:text-gray-400 flex items-center justify-center mx-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {settings('otpModal.sending')}
                </>
              ) : (
                settings('otpModal.resendCode')
              )}
            </button>
          )}
        </div>

        {/* Verify button */}
        <button
          onClick={() => onVerify(otp.join(''))}
          disabled={otp.join('').length !== 6 || isLoading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {settings('otpModal.verifying')}
            </>
          ) : (
            settings('otpModal.verifyButton')
          )}
        </button>
      </div>
    </div>
  );
}