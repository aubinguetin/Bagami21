'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Phone, Mail, Key, ChevronDown, Search } from 'lucide-react';
import { countryCodes, getDefaultCountry } from '@/data/countryCodes';
import { useT } from '@/lib/i18n-helpers';
import { useLocale } from '@/lib/i18n-helpers';

// Phone number regex for Burkina Faso format
const burkinaPhoneRegex = /^(\+226|00226|226)?[0-9]{8}$/;

// Validation schema for forgot password
const forgotPasswordSchema = yup.object({
  contactMethod: yup.string().oneOf(['phone', 'email']).required('Contact method is required'),
  phone: yup.string().when('contactMethod', {
    is: 'phone',
    then: (schema) => schema
      .test('phone', 'Please enter a valid phone number', function(value) {
        if (!value) return false;
        // Basic phone validation - at least 7 digits
        return /^\d{7,15}$/.test(String(value).replace(/\s/g, ''));
      })
      .required('Phone number is required'),
    otherwise: (schema) => schema.optional(),
  }),
  email: yup.string().when('contactMethod', {
    is: 'email',
    then: (schema) => schema.email('Invalid email').required('Email is required'),
    otherwise: (schema) => schema.optional(),
  }),
  countryCode: yup.string().when('contactMethod', {
    is: 'phone',
    then: (schema) => schema.required('Country code is required'),
    otherwise: (schema) => schema.optional(),
  }),
});

interface ForgotPasswordFormData {
  contactMethod: 'phone' | 'email';
  phone?: string;
  email?: string;
  countryCode?: string;
}

interface ForgotPasswordProps {
  onBack: () => void;
  onOtpSent: (identifier: string, type: 'phone' | 'email') => void;
}

export default function ForgotPassword({ onBack, onOtpSent }: ForgotPasswordProps) {
  const t = useT();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('phone');
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry());
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const form = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      contactMethod: 'phone',
      countryCode: getDefaultCountry().dialCode,
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      if (data.contactMethod === 'phone' && data.phone && data.countryCode) {
        const fullPhoneNumber = `${data.countryCode}${data.phone}`;
        
        // Send OTP for password reset via SMS
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: fullPhoneNumber,
            type: 'password-reset',
            language: locale,
            countryInfo: {
              code: selectedCountry.code,
              name: selectedCountry.name,
              dialCode: selectedCountry.dialCode
            }
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          // Handle specific error cases for password reset
          if (response.status === 404 && result.code === 'USER_NOT_FOUND') {
            alert(t.authPage('forgotPassword.userNotFoundAlert')
              .replace('{message}', result.message)
              .replace('{contactType}', t.authPage('forgotPassword.phoneNumber')));
            return;
          }
          throw new Error(result.error || result.message || 'Failed to send verification code');
        }

        setStep('sent');
        // Redirect to OTP verification after showing success message
        setTimeout(() => {
          onOtpSent(fullPhoneNumber, 'phone');
        }, 2000);
      } else if (data.contactMethod === 'email' && data.email) {
        // Send OTP for password reset via email
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: data.email, // API uses 'phoneNumber' param for both phone and email
            type: 'password-reset',
            language: locale
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          // Handle specific error cases for password reset
          if (response.status === 404 && result.code === 'USER_NOT_FOUND') {
            alert(t.authPage('forgotPassword.userNotFoundAlert')
              .replace('{message}', result.message)
              .replace('{contactType}', t.authPage('forgotPassword.emailAddress')));
            return;
          }
          throw new Error(result.error || result.message || 'Failed to send verification email');
        }

        setStep('sent');
        // Redirect to OTP verification after showing success message
        setTimeout(() => {
          if (data.email) {
            onOtpSent(data.email, 'email');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      alert(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const isPhone = (identifier: string) => {
    return burkinaPhoneRegex.test(identifier.replace(/\s/g, ''));
  };

  const formatIdentifier = (identifier: string) => {
    if (isPhone(identifier)) {
      const cleaned = identifier.replace(/\D/g, '');
      if (cleaned.startsWith('226')) {
        return `+226 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ** ** ${cleaned.slice(9, 11)}`;
      }
      return identifier;
    } else {
      // Email masking
      const parts = identifier.split('@');
      if (parts.length === 2) {
        const username = parts[0];
        const domain = parts[1];
        const maskedUsername = username.length > 2 
          ? username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
          : username;
        return `${maskedUsername}@${domain}`;
      }
    }
    return identifier;
  };

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!countrySearch.trim()) return countryCodes;
    
    const search = countrySearch.toLowerCase();
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(search) ||
      country.dialCode.includes(search) ||
      country.code.toLowerCase().includes(search)
    );
  }, [countrySearch]);

  // Handle keyboard navigation and close dropdown
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCountryDropdown && e.key === 'Escape') {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (showCountryDropdown && !target.closest('[data-country-dropdown]')) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showCountryDropdown]);

  if (step === 'sent') {
    const formData = form.getValues();
    const identifier = formData.contactMethod === 'phone' 
      ? `${formData.countryCode}${formData.phone}` 
      : formData.email || '';
    const isPhoneNumber = formData.contactMethod === 'phone';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.authPage('forgotPassword.backToLogin')}
            </button>
            
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              {isPhoneNumber ? (
                <Phone className="w-10 h-10 text-green-500" />
              ) : (
                <Mail className="w-10 h-10 text-green-500" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {isPhoneNumber ? t.authPage('forgotPassword.smsSent') : t.authPage('forgotPassword.emailSent')}
            </h1>
            <p className="text-gray-600 text-center">
              {isPhoneNumber ? (
                <>
                  {t.authPage('forgotPassword.smsSentMessage')} <br/>
                  <span className="font-semibold">{formatIdentifier(identifier)}</span>
                </>
              ) : (
                <>
                  {t.authPage('forgotPassword.emailSentMessage')} <br/>
                  <span className="font-semibold">{formatIdentifier(identifier)}</span>
                </>
              )}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            {isPhoneNumber ? (
              <p className="text-gray-600 mb-4">
                {t.authPage('forgotPassword.redirectMessage')}
              </p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  {t.authPage('forgotPassword.checkEmail')}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {t.authPage('forgotPassword.checkSpam')}
                </p>
              </>
            )}
            
            <button
              onClick={onBack}
              className="btn-secondary w-full"
            >
              {t.authPage('forgotPassword.backToLoginButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {t.authPage('forgotPassword.backToLogin')}
          </button>
          
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Key className="w-10 h-10 text-orange-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{t.authPage('forgotPassword.title')}</h1>
          <p className="text-gray-600 text-center">
            {t.authPage('forgotPassword.subtitle')}
          </p>
        </div>

        {/* Forgot Password Form Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact Method Tabs */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                {t.authPage('forgotPassword.resetVia')}
              </label>
              
              {/* Tab Headers */}
              <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setContactMethod('phone');
                    form.setValue('contactMethod', 'phone');
                  }}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    contactMethod === 'phone'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t.authPage('forgotPassword.tabPhone')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContactMethod('email');
                    form.setValue('contactMethod', 'email');
                  }}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    contactMethod === 'email'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  {t.authPage('forgotPassword.tabEmail')}
                </button>
              </div>

              {/* Phone Input */}
              {contactMethod === 'phone' && (
                <div>
                  <div className="flex space-x-2">
                    {/* Country Code Dropdown */}
                    <div className="relative" data-country-dropdown>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCountryDropdown(!showCountryDropdown);
                        }}
                        className="flex items-center px-3 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
                      >
                        <span className="mr-2">{selectedCountry.flag}</span>
                        <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
                        <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          {/* Search Bar */}
                          <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                placeholder={t.authPage('forgotPassword.searchCountries')}
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                              />
                            </div>
                          </div>
                          
                          {/* Country List */}
                          <div className="max-h-64 overflow-y-auto">
                            {filteredCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  form.setValue('countryCode', country.dialCode);
                                  setShowCountryDropdown(false);
                                  setCountrySearch('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <span className="mr-3 text-lg">{country.flag}</span>
                                  <span className="text-sm font-medium text-gray-900">{country.name}</span>
                                </div>
                                <span className="text-sm text-gray-500">{country.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Phone Number Input */}
                    <div className="flex-1">
                      <input
                        {...form.register('phone')}
                        type="tel"
                        className="input-field"
                        placeholder={t.authPage('forgotPassword.enterPhonePlaceholder')}
                      />
                    </div>
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              )}

              {/* Email Input */}
              {contactMethod === 'email' && (
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      {...form.register('email')}
                      type="email"
                      className="input-field pl-11"
                      placeholder={t.authPage('forgotPassword.enterEmailPlaceholder')}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? t.authPage('forgotPassword.sending') : t.authPage('forgotPassword.receiveCode')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t.authPage('forgotPassword.rememberPassword')}{' '}
              <button 
                onClick={onBack}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                {t.authPage('forgotPassword.signInInstead')}
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