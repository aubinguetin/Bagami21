'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useT } from '@/lib/i18n-helpers';

// Validation schema for new password
const newPasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
});

interface NewPasswordFormData {
  password: string;
}

interface NewPasswordFormProps {
  phoneNumber: string;
  onPasswordReset: (password: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function NewPasswordForm({ phoneNumber, onPasswordReset, onBack, isLoading = false }: NewPasswordFormProps) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<NewPasswordFormData>({
    resolver: yupResolver(newPasswordSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: NewPasswordFormData) => {
    onPasswordReset(data.password);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('226')) {
      return `+226 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    }
    return phone;
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    Object.values(checks).forEach(check => check && score++);
    return { score, checks };
  };

  const password = form.watch('password') || '';
  const { score, checks } = getPasswordStrength(password);

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
            {t.authPage('newPassword.back')}
          </button>
          
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{t.authPage('newPassword.title')}</h1>
          <p className="text-gray-600 text-center">
            {t.authPage('newPassword.subtitle')} <br/>
            <span className="font-semibold">{formatPhoneNumber(phoneNumber)}</span>
          </p>
        </div>

        {/* New Password Form Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.authPage('newPassword.newPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  {...form.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder={t.authPage('newPassword.newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center mb-2">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            score < 2 ? 'bg-red-500 w-1/5' :
                            score < 4 ? 'bg-yellow-500 w-3/5' :
                            score === 4 ? 'bg-orange-500 w-4/5' :
                            'bg-green-500 w-full'
                          }`}
                        />
                      </div>
                    </div>
                    <span className={`ml-3 text-sm font-medium ${
                      score < 2 ? 'text-red-600' :
                      score < 4 ? 'text-yellow-600' :
                      score === 4 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {score < 2 ? t.authPage('newPassword.strengthWeak') :
                       score < 4 ? t.authPage('newPassword.strengthFair') :
                       score === 4 ? t.authPage('newPassword.strengthGood') :
                       t.authPage('newPassword.strengthStrong')}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {Object.entries(checks).map(([key, passed]) => (
                      <div key={key} className={`flex items-center text-xs ${passed ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle className={`w-3 h-3 mr-2 ${passed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span>
                          {key === 'length' && t.authPage('newPassword.requirement8Chars')}
                          {key === 'uppercase' && t.authPage('newPassword.requirementUppercase')}
                          {key === 'lowercase' && t.authPage('newPassword.requirementLowercase')}
                          {key === 'number' && t.authPage('newPassword.requirementNumber')}
                          {key === 'special' && t.authPage('newPassword.requirementSpecial')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t.authPage('newPassword.updatingPassword') : t.authPage('newPassword.updatePassword')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {t.authPage('footer')}
        </div>
      </div>
    </div>
  );
}