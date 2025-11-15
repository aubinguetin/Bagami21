'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Phone, ChevronDown, Search } from 'lucide-react';
import OtpVerification from '@/components/OtpVerification';
import ForgotPassword from '@/components/ForgotPassword';
import NewPasswordForm from '@/components/NewPasswordForm';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import FacebookSignInButton from '@/components/FacebookSignInButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { countryCodes, getDefaultCountry } from '@/data/countryCodes';
import { useT } from '@/lib/i18n-helpers';
import { useLocale } from '@/lib/i18n-helpers';

// Phone number regex for Burkina Faso format
const burkinaPhoneRegex = /^(\+226|00226|226)?[0-9]{8}$/;

// Validation schemas
const loginSchema = yup.object({
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
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const signupSchema = yup.object({
  fullName: yup.string().required('Full name is required'),
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
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  termsAccepted: yup.boolean().oneOf([true], 'You must agree to Bagami\'s Terms and Policy').required('Terms acceptance is required'),
});

interface LoginFormData {
  contactMethod: 'phone' | 'email';
  phone?: string;
  email?: string;
  countryCode?: string;
  password: string;
}

interface SignupFormData {
  fullName: string;
  contactMethod: 'phone' | 'email';
  phone?: string;
  email?: string;
  countryCode?: string;
  password: string;
  termsAccepted: boolean;
}

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [phoneForVerification, setPhoneForVerification] = useState('');
  const [verificationType, setVerificationType] = useState<'phone' | 'email'>('phone');
  const [fullNameForSignup, setFullNameForSignup] = useState('');
  const [passwordForSignup, setPasswordForSignup] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('phone');
  const [loginContactMethod, setLoginContactMethod] = useState<'phone' | 'email'>('phone');
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const defaultCountry = getDefaultCountry();
    console.log('🏁 Initial default country set to:', {
      name: defaultCountry.name,
      dialCode: defaultCountry.dialCode,
      code: defaultCountry.code
    });
    return defaultCountry;
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryForSignup, setCountryForSignup] = useState(getDefaultCountry());

  // ALL REACT HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const loginForm = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      contactMethod: 'phone',
      countryCode: getDefaultCountry().dialCode,
    }
  });

  const signupForm = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      contactMethod: 'phone',
      countryCode: getDefaultCountry().dialCode,
      termsAccepted: false,
    }
  });

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

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  // Redirect authenticated users to deliveries page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/deliveries');
    }
  }, [status, router]);

  // ✅ CRITICAL: Real-time validation to catch country code mismatches
  useEffect(() => {
    const currentFormCountryCode = signupForm.getValues('countryCode');
    if (currentFormCountryCode && selectedCountry.dialCode !== currentFormCountryCode) {
      console.warn('⚠️ Country code mismatch detected in real-time:', {
        selectedCountry: selectedCountry.name,
        selectedDialCode: selectedCountry.dialCode,
        formCountryCode: currentFormCountryCode
      });
      
      // Auto-fix by updating form to match selected country
      signupForm.setValue('countryCode', selectedCountry.dialCode);
      console.log('🔧 Auto-fixed country code to match selection');
    }
  }, [selectedCountry, signupForm]);

  // Show loading screen while checking authentication status
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Prepare identifier based on contact method
      const identifier = data.contactMethod === 'phone' 
        ? `${data.countryCode}${data.phone}` 
        : data.email;
      
      console.log('Login attempt:', { identifier, contactMethod: data.contactMethod });
      
      // Try to sign in with credentials (phone/email and password)
      const result = await signIn('phone-email', {
        contact: identifier,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
        // Store authentication info in localStorage for consistent access
        localStorage.setItem('bagami_authenticated', 'true');
        if (identifier) {
          localStorage.setItem('bagami_user_contact', identifier);
        }
        
        // Get user info from session and store in localStorage
        // Note: The session might not be immediately available, so we'll also handle this in dashboard
        setTimeout(async () => {
          try {
            const sessionResponse = await fetch('/api/auth/session');
            const sessionData = await sessionResponse.json();
            if (sessionData?.user?.id) {
              localStorage.setItem('bagami_user_id', sessionData.user.id);
            }
            if (sessionData?.user?.name) {
              localStorage.setItem('bagami_user_name', sessionData.user.name);
            }
          } catch (error) {
            console.warn('Could not update localStorage with session data:', error);
          }
        }, 500);
        
        // Redirect to deliveries page after login
        router.push('/deliveries');
      } else {
        throw new Error(result?.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      if (data.contactMethod === 'phone' && data.phone && data.countryCode) {
        // ✅ CRITICAL VALIDATION: Ensure selected country matches form data
        if (selectedCountry.dialCode !== data.countryCode) {
          console.error('🚨 Country code mismatch detected!', {
            selectedCountry: selectedCountry.dialCode,
            formCountryCode: data.countryCode,
            selectedCountryName: selectedCountry.name
          });
          alert(`Error: Country selection mismatch. Selected ${selectedCountry.name} (${selectedCountry.dialCode}) but form has ${data.countryCode}. Please try again.`);
          setIsLoading(false);
          return;
        }
        
        const fullPhoneNumber = `${data.countryCode}${data.phone}`;
        
        console.log('📱 Sending OTP with validated country:', {
          fullPhoneNumber,
          selectedCountry: selectedCountry.name,
          dialCode: selectedCountry.dialCode
        });
        
        // Send OTP via SMS
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: fullPhoneNumber,
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
          // Handle specific error cases
          if (response.status === 409) {
            // Check if this is a verified user or unverified user
            if (result.code === 'USER_EXISTS') {
              alert(`⚠️ ${result.message}\n\nIf you've already registered, please try logging in. If you need to complete verification, please contact support.`);
            } else {
              alert('This phone number is already registered and verified. Please try logging in instead.');
            }
            setIsLogin(true); // Switch to login mode
            return;
          }
          throw new Error(result.error || result.message || 'Failed to send OTP');
        }

        setPhoneForVerification(fullPhoneNumber);
        setVerificationType('phone');
        setFullNameForSignup(data.fullName);
        setPasswordForSignup(data.password);
        setCountryForSignup(selectedCountry);
        setShowOtpVerification(true);
      } else if (data.contactMethod === 'email' && data.email) {
        // Send OTP via email
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: data.email, // API uses 'phoneNumber' param for both phone and email
            type: 'signup',
            language: locale
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 409) {
            // Check if this is a verified user or unverified user  
            if (result.code === 'USER_EXISTS') {
              alert(`⚠️ ${result.message}\n\nIf you've already registered, please try logging in. If you need to complete verification, please contact support.`);
            } else {
              alert('This email is already registered and verified. Please try logging in instead.');
            }
            setIsLogin(true); // Switch to login mode
            return;
          }
          throw new Error(result.error || result.message || 'Failed to send verification email');
        }

        setPhoneForVerification(data.email);
        setVerificationType('email');
        setFullNameForSignup(data.fullName);
        setPasswordForSignup(data.password);
        setShowOtpVerification(true);
      } else {
        alert('Please select a valid contact method and fill in the required information.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    setIsLoading(true);
    
    // Sanitize OTP input - remove spaces and ensure it's a string
    const sanitizedOtp = String(otp).trim().replace(/\s/g, '');
    console.log('🔐 Starting OTP verification for:', phoneForVerification, 'OTP:', sanitizedOtp);
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneForVerification,
          otp: sanitizedOtp,
          fullName: !isForgotPasswordMode ? fullNameForSignup : undefined,
          password: !isForgotPasswordMode ? passwordForSignup : undefined,
          countryInfo: !isForgotPasswordMode ? {
            code: countryForSignup.code,
            name: countryForSignup.name,
            dialCode: countryForSignup.dialCode
          } : undefined
        }),
      });

      const result = await response.json();
      console.log('📱 OTP verification response:', result);
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          alert('This contact is already registered. Please try logging in instead.');
          setShowOtpVerification(false);
          setPhoneForVerification('');
          signupForm.reset();
          setIsLogin(true);
          return;
        }
        throw new Error(result.error || result.message || 'Invalid verification code');
      }

      // Check if this is forgot password flow
      if (isForgotPasswordMode) {
        console.log('✅ OTP verified for password reset, showing new password form...');
        
        // Clean up OTP state and show new password form
        setShowOtpVerification(false);
        setShowNewPasswordForm(true);
        
        return;
      }
      
      // Regular signup flow - create session and redirect
      console.log('✅ OTP verified successfully, creating session and redirecting...');
      
      // Store authentication info in localStorage as backup
      localStorage.setItem('bagami_authenticated', 'true');
      localStorage.setItem('bagami_user_contact', phoneForVerification);
      if (result.user?.id) {
        localStorage.setItem('bagami_user_id', result.user.id);
      }
      if (result.user?.name) {
        localStorage.setItem('bagami_user_name', result.user.name);
      }
      
      // Try to sign in with NextAuth to create proper session
      try {
        const signInResult = await signIn('phone-email', {
          contact: phoneForVerification,
          verified: 'true',
          redirect: false
        });
        
        if (signInResult?.ok) {
          console.log('✅ NextAuth session created successfully');
        } else {
          console.log('⚠️ NextAuth session creation failed, but user is verified');
        }
      } catch (sessionError) {
        console.error('NextAuth session error:', sessionError);
        // Continue with redirect even if session creation fails
      }
      
      // Show success message
      alert('Phone number verified successfully! Welcome to Bagami!');
      
      // Clean up state
      setShowOtpVerification(false);
      setPhoneForVerification('');
      setPasswordForSignup('');
      signupForm.reset();
      
      // Use router for better navigation with fallback
      try {
        await router.push('/');
        // Add small delay then force redirect if router push doesn't work
        setTimeout(() => {
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }, 1000);
      } catch (routerError) {
        console.error('Router navigation failed:', routerError);
        // Fallback to window location
        window.location.href = '/';
      }
      
    } catch (error) {
      console.error('OTP verification error:', error);
      alert(error instanceof Error ? error.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackFromOtp = () => {
    setShowOtpVerification(false);
    setPhoneForVerification('');
    setFullNameForSignup('');
    setPasswordForSignup('');
    setIsForgotPasswordMode(false);
  };

  const handleNewPasswordSubmit = async (newPassword: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 Submitting password reset for:', phoneForVerification);
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: phoneForVerification,
          newPassword: newPassword
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Reset password API error:', result);
        throw new Error(result.error || result.message || 'Failed to reset password');
      }

      // Show success message
      alert('Password reset successfully! Please sign in with your new password.');
      
      // Clean up all states and redirect to sign in
      setShowNewPasswordForm(false);
      setPhoneForVerification('');
      setIsForgotPasswordMode(false);
      setIsLogin(true);
      
    } catch (error) {
      console.error('Password reset error:', error);
      alert(error instanceof Error ? error.message : 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackFromNewPassword = () => {
    setShowNewPasswordForm(false);
    setPhoneForVerification('');
    setIsForgotPasswordMode(false);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackFromForgotPassword = () => {
    setShowForgotPassword(false);
  };

  const handleForgotPasswordOtpSent = (identifier: string, type: 'phone' | 'email') => {
    setPhoneForVerification(identifier);
    setVerificationType(type);
    setShowForgotPassword(false);
    setIsForgotPasswordMode(true);
    setShowOtpVerification(true);
  };

  const switchToLogin = () => {
    setIsLogin(true);
    signupForm.reset();
  };

  const switchToSignup = () => {
    setIsLogin(false);
    loginForm.reset();
  };

  const handleTestAccountAccess = async (testUser: 1 | 2) => {
    setIsLoading(true);
    try {
      const testPhoneNumber = testUser === 1 ? '+22677889900' : '+337783928899';
      const testUserName = testUser === 1 ? 'Test user 1' : 'Test user 2';
      
      console.log(`🧪 Test account access (${testUserName}) - bypassing OTP verification`);
      
      // Create or update the test user first
      const createUserResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
          otp: 'TEST_BYPASS', // Special bypass code
          testAccount: true // Flag to indicate this is a test account
        }),
      });

      const createResult = await createUserResponse.json();
      
      if (!createUserResponse.ok) {
        throw new Error(createResult.error || createResult.message || 'Failed to create test account');
      }

      console.log('🔐 Test account verified, attempting NextAuth sign-in...');
      
      // Now sign in with NextAuth using credentials
      const signInResult = await signIn('phone-email', {
        contact: testPhoneNumber,
        verified: 'true',
        redirect: false,
      });

      console.log('🔐 NextAuth sign-in result:', signInResult);

      // Handle different NextAuth response scenarios
      if (signInResult?.error) {
        console.error('🚨 NextAuth sign-in error:', signInResult.error);
        throw new Error(`NextAuth failed: ${signInResult.error}`);
      }

      // NextAuth authentication succeeded (either ok=true or url provided)
      if (signInResult?.ok || signInResult?.url) {
        // Store user info in localStorage
        localStorage.setItem('bagami_authenticated', 'true');
        localStorage.setItem('bagami_user_contact', testPhoneNumber);
        console.log(`✅ ${testUserName} authentication successful`);
        
        // Handle redirect
        if (signInResult?.url) {
          console.log('� NextAuth provided redirect URL:', signInResult.url);
          window.location.href = signInResult.url;
        } else {
          // Direct navigation to homepage
          console.log('🏠 Navigating to homepage...');
          setTimeout(() => {
            router.push('/');
          }, 500);
        }
      } else {
        console.error('🚨 Unexpected NextAuth result:', signInResult);
        throw new Error('Authentication completed but redirect failed - please try refreshing the page');
      }
    } catch (error) {
      console.error('Test account access error:', error);
      alert(error instanceof Error ? error.message : 'Failed to access test account');
    } finally {
      setIsLoading(false);
    }
  };



  // Show forgot password if needed
  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBack={handleBackFromForgotPassword}
        onOtpSent={handleForgotPasswordOtpSent}
      />
    );
  }

  // Show new password form after OTP verification in forgot password flow
  if (showNewPasswordForm) {
    return (
      <NewPasswordForm
        phoneNumber={phoneForVerification}
        onPasswordReset={handleNewPasswordSubmit}
        onBack={handleBackFromNewPassword}
        isLoading={isLoading}
      />
    );
  }

  // Show OTP verification if needed
  if (showOtpVerification) {
    return (
      <OtpVerification
        contact={phoneForVerification}
        verificationType={verificationType}
        onVerify={handleOtpVerify}
        onBack={handleBackFromOtp}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      {/* Language Switcher - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-32 h-32 mb-4 flex items-center justify-center">
            <img 
              src="/bagamilogo_transparent2.png" 
              alt="Bagami Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Bagami</h1>
          <p className="text-gray-600 text-center max-w-md mx-auto">
            {isLogin ? 
              t.authPage('welcome.login') : 
              t.authPage('welcome.signup')
            }
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Form Toggle */}
          <div className="flex mb-6">
            <button
              onClick={switchToLogin}
              className={`flex-1 py-3 text-center font-medium rounded-l-lg transition-colors ${
                isLogin
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.authPage('tabs.signIn')}
            </button>
            <button
              onClick={switchToSignup}
              className={`flex-1 py-3 text-center font-medium rounded-r-lg transition-colors ${
                !isLogin
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.authPage('tabs.signUp')}
            </button>
          </div>

          {/* Login Form */}
          {isLogin && (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              {/* Login Contact Method Tabs */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {t.authPage('labels.signInWith')}
                </label>
                
                {/* Tab Headers */}
                <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginContactMethod('phone');
                      loginForm.setValue('contactMethod', 'phone');
                    }}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      loginContactMethod === 'phone'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Phone className="w-4 h-4 inline mr-2" />
                    {t.authPage('labels.phoneNumber')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginContactMethod('email');
                      loginForm.setValue('contactMethod', 'email');
                    }}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      loginContactMethod === 'email'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    {t.authPage('labels.email')}
                  </button>
                </div>

                {/* Phone Input */}
                {loginContactMethod === 'phone' && (
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
                                  placeholder="Search countries..."
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
                                    console.log('🌍 Login Country selected:', {
                                      name: country.name,
                                      code: country.code,
                                      dialCode: country.dialCode,
                                      previousCountry: selectedCountry.name
                                    });
                                    setSelectedCountry(country);
                                    loginForm.setValue('countryCode', country.dialCode);
                                    setShowCountryDropdown(false);
                                    setCountrySearch('');
                                    console.log('✅ Login form country code updated to:', country.dialCode);
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
                          {...loginForm.register('phone')}
                          type="tel"
                          className="input-field"
                          placeholder={t.authPage('placeholders.phoneNumber')}
                        />
                      </div>
                    </div>
                    {loginForm.formState.errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                )}

                {/* Email Input */}
                {loginContactMethod === 'email' && (
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        {...loginForm.register('email')}
                        type="email"
                        className="input-field pl-11"
                        placeholder={t.authPage('placeholders.email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.authPage('labels.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    {...loginForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-11 pr-11"
                    placeholder={t.authPage('placeholders.password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                  <span className="ml-2 text-sm text-gray-600">{t.authPage('labels.rememberMe')}</span>
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  {t.authPage('buttons.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? t.authPage('buttons.signingIn') : t.authPage('buttons.signIn')}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {!isLogin && (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.authPage('labels.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    {...signupForm.register('fullName')}
                    type="text"
                    className="input-field pl-11"
                    placeholder={t.authPage('placeholders.fullName')}
                  />
                </div>
                {signupForm.formState.errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.fullName.message}</p>
                )}
              </div>

              {/* Contact Method Tabs */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {t.authPage('labels.contactInfo')}
                </label>
                
                {/* Tab Headers */}
                <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setContactMethod('phone');
                      signupForm.setValue('contactMethod', 'phone');
                    }}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      contactMethod === 'phone'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Phone className="w-4 h-4 inline mr-2" />
                    {t.authPage('labels.phoneNumber')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContactMethod('email');
                      signupForm.setValue('contactMethod', 'email');
                    }}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      contactMethod === 'email'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    {t.authPage('labels.email')}
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
                                  placeholder="Search countries..."
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                              </div>
                            </div>
                            
                            {/* Countries List */}
                            <div className="max-h-60 overflow-y-auto">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🌍 Country selected:', {
                                        name: country.name,
                                        code: country.code,
                                        dialCode: country.dialCode,
                                        previousCountry: selectedCountry.name
                                      });
                                      setSelectedCountry(country);
                                      setShowCountryDropdown(false);
                                      setCountrySearch('');
                                      signupForm.setValue('countryCode', country.dialCode);
                                      console.log('✅ Form country code updated to:', country.dialCode);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                  >
                                    <span className="mr-3">{country.flag}</span>
                                    <span className="flex-1 text-sm text-gray-700">{country.name}</span>
                                    <span className="text-sm font-medium text-gray-500">{country.dialCode}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                  {t.authPage('hints.noCountriesFound')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Phone Number Input */}
                      <div className="flex-1 relative">
                        <input
                          {...signupForm.register('phone')}
                          type="tel"
                          className="input-field"
                          placeholder={t.authPage('placeholders.phoneNumber')}
                        />
                      </div>
                    </div>
                    {signupForm.formState.errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                )}

                {/* Email Input */}
                {contactMethod === 'email' && (
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        {...signupForm.register('email')}
                        type="email"
                        className="input-field pl-11"
                        placeholder="Enter your email address"
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>
                )}

                {/* Hidden field for contact method */}
                <input
                  {...signupForm.register('contactMethod')}
                  type="hidden"
                  value={contactMethod}
                />
                <input
                  {...signupForm.register('countryCode')}
                  type="hidden"
                  value={selectedCountry.dialCode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.authPage('labels.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    {...signupForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-11 pr-11"
                    placeholder={t.authPage('placeholders.password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...signupForm.register('termsAccepted')}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {t.authPage('terms.agreeText')}{' '}
                    <a 
                      href="/terms-and-policy"
                      className="text-orange-500 hover:text-orange-600 underline"
                    >
                      {t.authPage('terms.terms')} {t.authPage('terms.and')} {t.authPage('terms.policy')}
                    </a>
                  </span>
                </div>
                {signupForm.formState.errors.termsAccepted && (
                  <p className="text-red-500 text-sm">{signupForm.formState.errors.termsAccepted.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? t.authPage('buttons.creatingAccount') : t.authPage('buttons.signUp')}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-bagami-dark-gray text-sm">{t.authPage('or')}</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Sign-In */}
          <div className="space-y-3">
            <GoogleSignInButton isSignUp={!isLogin} />
            <FacebookSignInButton isSignUp={!isLogin} />
          </div>

          {/* Links */}
          {isLogin && (
            <div className="text-center mt-4">
              <button 
                onClick={handleForgotPassword}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {t.authPage('footer')}
        </div>
      </div>
    </div>
  );
}