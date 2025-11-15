'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  ChevronDown,
  Search
} from 'lucide-react';
import { countryCodes, getDefaultCountry } from '@/data/countryCodes';
import OtpModal from '@/components/OtpModal';
import { useT, useLocale } from '@/lib/i18n-helpers';

export default function MyInformationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { settings } = useT();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });

  // Original values to track changes
  const [originalData, setOriginalData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });

  // Verification status
  const [verificationStatus, setVerificationStatus] = useState({
    email: true, // Assume verified initially
    phone: true  // Assume verified initially
  });

  // Country code state
  const [selectedCountry, setSelectedCountry] = useState(() => getDefaultCountry());
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // OTP verification state
  const [otpState, setOtpState] = useState({
    show: false,
    type: '' as 'email' | 'phone' | '',
    contact: '',
    isVerifying: false
  });

  // Filtered countries based on search
  const filteredCountries = () => {
    if (!countrySearch.trim()) return countryCodes;
    
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch)
    );
  };

  // Load user information on component mount
  useEffect(() => {
    if (session?.user) {
      console.log('Loading user data...');
      // Fetch latest user data from API instead of relying on session
      fetchUserData();
    }
  }, [session]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCountryDropdown && !target.closest('[data-country-dropdown]')) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryDropdown]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update verification status when email or phone changes
    if (field === 'email') {
      if (value !== originalData.email) {
        setVerificationStatus(prev => ({ ...prev, email: false }));
      } else {
        // If user returns to original verified value, restore verified status
        setVerificationStatus(prev => ({ ...prev, email: true }));
      }
    }
    if (field === 'phoneNumber') {
      if (value !== originalData.phoneNumber) {
        setVerificationStatus(prev => ({ ...prev, phone: false }));
      } else {
        // If user returns to original verified value, restore verified status
        setVerificationStatus(prev => ({ ...prev, phone: true }));
      }
    }
  };

  // Loading states for individual buttons
  const [loadingStates, setLoadingStates] = useState({
    fullName: false,
    email: false,
    phone: false
  });

  // Function to fetch user data from API
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const result = await response.json();
      
      if (result.success && result.user) {
        const user = result.user;
        
        // Extract phone number without country code
        let phoneWithoutCode = '';
        let detectedCountry = getDefaultCountry();
        
        if (user.phone) {
          // Try to detect country from phone number (if it starts with country code)
          for (const country of countryCodes) {
            if (user.phone.startsWith(country.dialCode)) {
              phoneWithoutCode = user.phone.substring(country.dialCode.length);
              detectedCountry = country;
              break;
            }
          }
          
          // Fallback 1: use stored country code
          if (!phoneWithoutCode && user.countryCode) {
            const countryFromCode = countryCodes.find(c => c.dialCode === user.countryCode);
            if (countryFromCode) {
              // Check if phone starts with country code
              if (user.phone.startsWith(user.countryCode)) {
                phoneWithoutCode = user.phone.substring(user.countryCode.length);
              } else {
                // Phone doesn't include country code, use as is
                phoneWithoutCode = user.phone;
              }
              detectedCountry = countryFromCode;
            }
          }
          
          // Fallback 2: if still no phone parsed, assume it's without country code
          if (!phoneWithoutCode) {
            phoneWithoutCode = user.phone;
            // Use default country or keep current selected
            detectedCountry = getDefaultCountry();
          }
        }
        
        // Update form data
        setFormData({
          fullName: user.name || '',
          email: user.email || '',
          phoneNumber: phoneWithoutCode
        });
        
        // Update original data
        setOriginalData({
          fullName: user.name || '',
          email: user.email || '',
          phoneNumber: phoneWithoutCode
        });
        
        // Update verification status
        setVerificationStatus({
          email: !!user.emailVerified,
          phone: !!user.phoneVerified
        });
        
        // Set selected country
        setSelectedCountry(detectedCountry);
        
        console.log('✅ User data loaded from API:', {
          user: user,
          detectedCountry: detectedCountry,
          phoneWithoutCode: phoneWithoutCode
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Save full name
    const handleSaveFullName = async () => {
    if (!formData.fullName || formData.fullName.trim() === '') {
      alert(settings('myInformation.fullName.error'));
      return;
    }

    setLoadingStates(prev => ({ ...prev, fullName: true }));
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName
        })
      });

      const result = await response.json();
      if (response.ok) {
        setOriginalData(prev => ({ ...prev, fullName: formData.fullName }));
        alert(settings('myInformation.fullName.success'));
        // Mark profile as updated in localStorage
        localStorage.setItem('profileUpdated', Date.now().toString());
        // Dispatch event to notify other pages (like Profile page) to refresh
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        alert(result.error || settings('myInformation.fullName.failed'));
      }
    } catch (error) {
      console.error('Error saving full name:', error);
      alert(settings('myInformation.fullName.failed'));
    } finally {
      setLoadingStates(prev => ({ ...prev, fullName: false }));
    }
  };

  // Verify email
  const handleVerifyEmail = async () => {
    if (!formData.email) {
      alert(settings('myInformation.email.errorEmpty'));
      return;
    }

    // Check if email is the same as current (no need to verify)
    if (formData.email === originalData.email && verificationStatus.email) {
      alert(settings('myInformation.email.alreadyVerified'));
      return;
    }

    setLoadingStates(prev => ({ ...prev, email: true }));
    try {
      // Send OTP to email
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.email, // API expects 'phoneNumber' for both email and phone
          type: 'email_verification',
          language: locale
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Show OTP verification modal
        setOtpState({
          show: true,
          type: 'email',
          contact: formData.email,
          isVerifying: false
        });
      } else {
        alert(result.message || settings('myInformation.email.verificationFailed'));
      }
    } catch (error) {
      console.error('Error sending email verification:', error);
      alert(settings('myInformation.email.verificationFailed'));
    } finally {
      setLoadingStates(prev => ({ ...prev, email: false }));
    }
  };

  // Verify phone number
  const handleVerifyPhone = async () => {
    if (!formData.phoneNumber) {
      alert(settings('myInformation.phone.errorEmpty'));
      return;
    }

    const fullPhoneNumber = selectedCountry.dialCode + formData.phoneNumber;
    
    // Check if phone is the same as current (no need to verify)
    if (formData.phoneNumber === originalData.phoneNumber && verificationStatus.phone) {
      alert(settings('myInformation.phone.alreadyVerified'));
      return;
    }

    setLoadingStates(prev => ({ ...prev, phone: true }));
    
    try {
      // Send OTP to phone
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber, // API expects 'phoneNumber' for both email and phone
          type: 'phone_verification',
          language: locale,
          countryInfo: { dialCode: selectedCountry.dialCode } // Include country info for validation
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Show OTP verification modal
        setOtpState({
          show: true,
          type: 'phone',
          contact: fullPhoneNumber,
          isVerifying: false
        });
      } else {
        alert(result.message || settings('myInformation.phone.verificationFailed'));
      }
    } catch (error) {
      console.error('Error sending SMS verification:', error);
      alert(settings('myInformation.phone.verificationFailed'));
    } finally {
      setLoadingStates(prev => ({ ...prev, phone: false }));
    }
  };

  // Handle OTP verification
  const handleOtpVerification = async (otp: string) => {
    setOtpState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // Use the profile-specific OTP verification endpoint
      const response = await fetch('/api/user/verify-profile-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: otpState.contact,
          otp,
          userId: session?.user?.id,
          ...(otpState.type === 'phone' && {
            countryCode: selectedCountry.dialCode
          })
        })
      });

      const result = await response.json();
      
      console.log('📤 OTP verification response:', {
        status: response.status,
        result: result
      });
      
      if (result.success) {
        // Update verification status and original data based on the updated user data
        if (otpState.type === 'email') {
          setVerificationStatus(prev => ({ ...prev, email: true }));
          setOriginalData(prev => ({ ...prev, email: formData.email }));
        } else if (otpState.type === 'phone') {
          setVerificationStatus(prev => ({ ...prev, phone: true }));
          setOriginalData(prev => ({ ...prev, phoneNumber: formData.phoneNumber }));
        }
        
        // Refresh user data to get the latest information
        await fetchUserData();
        
        alert(otpState.type === 'email' ? settings('myInformation.email.success') : settings('myInformation.phone.success'));
        
        // Mark profile as updated in localStorage
        localStorage.setItem('profileUpdated', Date.now().toString());
        // Dispatch event to notify other pages (like Profile page) to refresh
        window.dispatchEvent(new Event('profileUpdated'));
        
        // Close OTP modal
        setOtpState({ show: false, type: '', contact: '', isVerifying: false });
      } else {
        console.error('❌ OTP verification failed:', result);
        
        // Handle specific error cases
        if (response.status === 409) {
          // Duplicate email/phone error
          const contactType = otpState.type === 'email' ? settings('myInformation.verification.emailAddress') : settings('myInformation.verification.phoneNumber');
          const errorMessage = settings('myInformation.verification.alreadyInUse').replace(/{contactType}/g, contactType);
          alert(errorMessage);
        } else {
          // Generic error
          alert(result.message || settings('myInformation.verification.invalidOTP'));
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert(settings('myInformation.verification.verificationFailed'));
    } finally {
      setOtpState(prev => ({ ...prev, isVerifying: false }));
    }
  };



  // Close OTP modal
  const handleOtpClose = () => {
    setOtpState({ show: false, type: '', contact: '', isVerifying: false });
  };



  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
                <h1 className="text-base font-semibold text-gray-900">{settings('myInformation.title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>
      <div className="pt-16"></div>

      {/* Form Content */}
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        
        {/* Full Name Field */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <User className="w-4 h-4 text-gray-600" />
            <label className="text-xs font-medium text-gray-700">{settings('myInformation.fullName.label')}</label>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder={settings('myInformation.fullName.placeholder')}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-gray-50 text-gray-900"
            />
            <button
              onClick={handleSaveFullName}
              disabled={loadingStates.fullName || formData.fullName === originalData.fullName}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                formData.fullName !== originalData.fullName
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-green-100 text-green-700 cursor-default'
              } ${loadingStates.fullName ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingStates.fullName ? settings('myInformation.fullName.saving') : formData.fullName !== originalData.fullName ? settings('myInformation.fullName.save') : settings('myInformation.fullName.saved')}
            </button>
          </div>
        </div>

        {/* Email Field */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <Mail className="w-4 h-4 text-gray-600" />
            <label className="text-xs font-medium text-gray-700">{settings('myInformation.email.label')}</label>
          </div>
          <div className="flex space-x-2">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={settings('myInformation.email.placeholder')}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-gray-50 text-gray-900"
            />
            <button
              onClick={handleVerifyEmail}
              disabled={loadingStates.email || (verificationStatus.email && formData.email === originalData.email)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                !verificationStatus.email || formData.email !== originalData.email
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-100 text-green-700 cursor-not-allowed'
              } ${loadingStates.email ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingStates.email ? settings('myInformation.email.verifying') : (verificationStatus.email && formData.email === originalData.email) ? settings('myInformation.email.verified') : settings('myInformation.email.verify')}
            </button>
          </div>
        </div>

        {/* Phone Number Field */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <Phone className="w-4 h-4 text-gray-600" />
            <label className="text-xs font-medium text-gray-700">{settings('myInformation.phone.label')}</label>
          </div>
          <div className="flex space-x-2">
            {/* Country Code Dropdown */}
            <div className="relative" data-country-dropdown>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCountryDropdown(!showCountryDropdown);
                }}
                className="flex items-center px-2 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
              >
                <span className="mr-1 text-sm">{selectedCountry.flag}</span>
                <span className="text-xs font-medium text-gray-700">{selectedCountry.dialCode}</span>
                <ChevronDown className={`w-3 h-3 ml-1 text-gray-500 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={settings('myInformation.phone.searchCountry')}
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  
                  {/* Country List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredCountries().map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
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
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder={settings('myInformation.phone.placeholder')}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-gray-50 text-gray-900"
            />

            {/* Verify Button */}
            <button
              onClick={handleVerifyPhone}
              disabled={loadingStates.phone || (verificationStatus.phone && formData.phoneNumber === originalData.phoneNumber)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-all whitespace-nowrap ${
                !verificationStatus.phone || formData.phoneNumber !== originalData.phoneNumber
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-100 text-green-700 cursor-not-allowed'
              } ${loadingStates.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingStates.phone ? settings('myInformation.phone.verifying') : (verificationStatus.phone && formData.phoneNumber === originalData.phoneNumber) ? settings('myInformation.phone.verified') : settings('myInformation.phone.verify')}
            </button>
          </div>
        </div>

        {/* Information Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">{settings('myInformation.security.title')}</h3>
              <p className="text-sm text-blue-700">
                {settings('myInformation.security.description')}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpState.show}
        contact={otpState.contact}
        type={otpState.type as 'email' | 'phone'}
        onVerify={handleOtpVerification}
        onClose={handleOtpClose}
        isLoading={otpState.isVerifying}
      />
    </div>
  );
}
