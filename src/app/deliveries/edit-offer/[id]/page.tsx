'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Plane,
  MapPin,
  Calendar,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { getCountriesList, searchCitiesByCountry } from '@/data/locations';
import { useLocale, useT } from '@/lib/i18n-helpers';

// SearchableSelect component
function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label,
  required = false,
  disabled = false,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: { code: string; name: string }[];
  placeholder: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setDebouncedTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!debouncedTerm.trim()) {
      return options;
    }
    
    const lowerSearchTerm = debouncedTerm.toLowerCase();
    return options.filter(option =>
      option.name.toLowerCase().includes(lowerSearchTerm) ||
      option.code.toLowerCase().includes(lowerSearchTerm)
    );
  }, [options, debouncedTerm]);
  
  const selectedOption = options.find(option => option.code === value);
  
  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

  const handleSelect = useCallback((optionCode: string) => {
    onChange(optionCode);
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left border border-gray-200 rounded-lg bg-white transition-colors ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300'
          } ${className}`}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="max-h-40 overflow-y-auto">
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left hover:bg-gray-50"
              >
                {placeholder}
              </button>
              {filteredOptions.map((option) => (
                <button
                  key={option.code}
                  onClick={() => handleSelect(option.code)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// CitySearchableSelect component
function CitySearchableSelect({
  label,
  value,
  onChange,
  placeholder = "Select an option",
  countryCode,
  required = false,
  disabled = false,
  className = ''
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  countryCode: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 50);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setDebouncedTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const cities = useMemo(() => {
    if (!countryCode) return [];
    
    const cityNames = searchCitiesByCountry(countryCode, debouncedTerm, 40);
    return cityNames.map(city => ({ code: city, name: city }));
  }, [countryCode, debouncedTerm]);
  
  const selectedOption = cities.find(option => option.code === value) || 
    (value ? { code: value, name: value } : null);
  
  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

  const handleSelect = useCallback((optionCode: string) => {
    onChange(optionCode);
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left border border-gray-200 rounded-lg bg-white transition-colors ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300'
          } ${className}`}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="max-h-40 overflow-y-auto">
              {cities.length === 0 && debouncedTerm ? (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  No cities found
                </div>
              ) : (
                cities.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => handleSelect(option.code)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  >
                    {option.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditTravelOfferPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.id as string;
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canDelete, setCanDelete] = useState(true);
  const [deleteBlockReason, setDeleteBlockReason] = useState('');
  const [referrerPage, setReferrerPage] = useState<string>('/deliveries');
  const locale = useLocale();
  const countries = getCountriesList(locale);
  const { editOffer } = useT();

  const [formData, setFormData] = useState({
    weight: '',
    departureCountry: '',
    departureCity: '',
    destinationCountry: '',
    destinationCity: '',
    departureDate: '',
    price: '',
    notes: ''
  });

  // Track where the user came from
  useEffect(() => {
    // Try to get from sessionStorage first (more reliable for client-side navigation)
    const storedReferrer = sessionStorage.getItem('delivery_edit_referrer');
    if (storedReferrer) {
      setReferrerPage(storedReferrer);
      return;
    }
    
    // Fallback to document.referrer
    const referrer = document.referrer;
    console.log('🔍 Document referrer:', referrer);
    if (referrer.includes('/my-deliveries')) {
      console.log('✅ Setting referrer to /my-deliveries');
      setReferrerPage('/my-deliveries');
    } else if (referrer.includes('/deliveries')) {
      console.log('✅ Setting referrer to /deliveries');
      setReferrerPage('/deliveries');
    }
  }, []);

  // Fetch delivery data
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const response = await fetch(`/api/deliveries/${deliveryId}`);
        if (!response.ok) throw new Error('Failed to fetch delivery');
        
        const delivery = await response.json();
        
        // Check if user owns this delivery
        const currentUserId = localStorage.getItem('bagami_user_id');
        if (delivery.senderId !== currentUserId) {
          alert(editOffer('ownershipError'));
          router.push('/deliveries');
          return;
        }

        // Check if it's an offer type
        if (delivery.type !== 'offer') {
          router.push(`/deliveries/edit-request/${deliveryId}`);
          return;
        }

        // Check deletion eligibility based on payment and delivery status
        await checkDeletionEligibility(deliveryId);

        setFormData({
          weight: delivery.weight || '',
          departureCountry: delivery.fromCountry || '',
          departureCity: delivery.fromCity || '',
          destinationCountry: delivery.toCountry || '',
          destinationCity: delivery.toCity || '',
          departureDate: delivery.departureDate ? delivery.departureDate.split('T')[0] : '',
          price: delivery.price || '',
          notes: delivery.description || ''
        });
      } catch (error) {
        console.error('Error fetching delivery:', error);
        alert(editOffer('loadError'));
        router.push('/deliveries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelivery();
  }, [deliveryId, router]);

  // Redirect if not authenticated
  useEffect(() => {
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'unauthenticated' && !bagamiAuth) {
      router.push('/auth');
    }
  }, [status, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if delivery can be deleted based on payment and delivery status
  const checkDeletionEligibility = async (deliveryId: string) => {
    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');
      
      console.log('🔍 Checking deletion eligibility for delivery:', deliveryId);
      
      // Fetch all conversations for the current user
      const conversationsResponse = await fetch(
        `/api/conversations?currentUserId=${currentUserId}&currentUserContact=${encodeURIComponent(currentUserContact || '')}`
      );
      
      if (!conversationsResponse.ok) {
        console.log('✅ No conversations found - deletion allowed');
        setCanDelete(true);
        return;
      }
      
      const { conversations } = await conversationsResponse.json();
      console.log('📋 Total conversations:', conversations.length);
      
      // Filter conversations for this specific delivery
      const deliveryConversations = conversations.filter(
        (conv: any) => conv.deliveryId === deliveryId
      );
      
      console.log('📋 Conversations for this delivery:', deliveryConversations.length);
      
      if (deliveryConversations.length === 0) {
        console.log('✅ No conversations for this delivery - deletion allowed');
        setCanDelete(true);
        return;
      }
      
      // Check each conversation for payment and delivery confirmation
      let hasPayment = false;
      let hasDeliveryConfirmation = false;
      
      for (const conversation of deliveryConversations) {
        console.log('🔍 Checking conversation:', conversation.id);
        
        // Fetch messages for this conversation
        const messagesResponse = await fetch(`/api/conversations/${conversation.id}/messages`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log('📨 Response structure:', messagesData);
          
          // The API returns { success, conversation, messages }
          const messages = messagesData.messages || messagesData;
          console.log('📨 Messages in conversation:', messages.length);
          
          // Log all message types for debugging
          messages.forEach((msg: any, idx: number) => {
            console.log(`   Message ${idx + 1}: type="${msg.messageType}", content length=${msg.content?.length || 0}`);
          });
          
          // Check for payment message
          const paymentMsg = messages.find((msg: any) => msg.messageType === 'payment');
          if (paymentMsg) {
            hasPayment = true;
            console.log('💰 Payment found in conversation:', paymentMsg.id);
          }
          
          // Check for delivery confirmation message
          const confirmationMsg = messages.find((msg: any) => msg.messageType === 'deliveryConfirmation');
          if (confirmationMsg) {
            hasDeliveryConfirmation = true;
            console.log('✅ Delivery confirmation found:', confirmationMsg.id);
          }
        }
      }
      
      console.log('📊 Payment status:', hasPayment ? 'YES' : 'NO');
      console.log('📊 Delivery confirmed:', hasDeliveryConfirmation ? 'YES' : 'NO');
      
      // Deletion rules:
      // 1. Can delete if no payment has been made
      // 2. Can delete if payment made AND delivery has been confirmed
      // 3. Cannot delete if payment made but delivery NOT confirmed
      
      if (!hasPayment) {
        // No payment made - can delete
        console.log('✅ Deletion allowed - No payment made');
        setCanDelete(true);
        setDeleteBlockReason('');
      } else if (hasPayment && hasDeliveryConfirmation) {
        // Payment made and delivery confirmed - can delete
        console.log('✅ Deletion allowed - Payment made and delivery confirmed');
        setCanDelete(true);
        setDeleteBlockReason('');
      } else {
        // Payment made but delivery not confirmed - cannot delete
        console.log('❌ Deletion blocked - Payment made but not confirmed');
        setCanDelete(false);
        setDeleteBlockReason('paymentPending');
      }
    } catch (error) {
      console.error('❌ Error checking deletion eligibility:', error);
      // On error, block deletion as a safety measure
      setCanDelete(false);
      setDeleteBlockReason('verificationError');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      alert(deleteBlockReason);
      return;
    }

    if (!confirm(editOffer('confirmDelete'))) {
      return;
    }

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentUserId,
          currentUserContact
        }),
      });

      if (response.ok) {
        router.push('/deliveries');
      } else {
        const error = await response.json();
        alert(error.error || editOffer('deleteError'));
      }
    } catch (error) {
      console.error('Error deleting travel offer:', error);
      alert(editOffer('genericError'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      // Only send the editable fields: departureDate, price, and notes
      // Route fields (departureCountry, departureCity, destinationCountry, destinationCity) are read-only
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType: 'travel',
          // Keep original non-editable fields
          weight: formData.weight,
          departureCountry: formData.departureCountry,
          departureCity: formData.departureCity,
          destinationCountry: formData.destinationCountry,
          destinationCity: formData.destinationCity,
          // Editable fields
          departureDate: formData.departureDate,
          price: formData.price,
          notes: formData.notes,
          currentUserId,
          currentUserContact
        }),
      });

      if (response.ok) {
        alert(editOffer('updateSuccess'));
        // Redirect to the page the user came from
        router.push(referrerPage);
      } else {
        const error = await response.json();
        alert(error.error || editOffer('updateError'));
      }
    } catch (error) {
      console.error('Error updating travel offer:', error);
      alert(editOffer('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{editOffer('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-blue-500 text-blue-600 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-blue-500 border-blue-500 px-6 py-2 rounded-full border-2 flex items-center justify-center">
                <h1 className="text-base font-bold text-white text-center">{editOffer('title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>
      <div className="pt-20"></div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Card - Read Only */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 opacity-75">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-600">{editOffer('travelRoute')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  value={formData.departureCountry}
                  onChange={(value) => {}}
                  options={countries}
                  placeholder={editOffer('fromCountryPlaceholder')}
                  label={editOffer('fromCountry')}
                  required={false}
                  disabled={true}
                />
                <CitySearchableSelect
                  value={formData.departureCity}
                  onChange={(value) => {}}
                  countryCode={formData.departureCountry}
                  placeholder={editOffer('fromCityPlaceholder')}
                  label={editOffer('fromCity')}
                  required={false}
                  disabled={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  value={formData.destinationCountry}
                  onChange={(value) => {}}
                  options={countries}
                  placeholder={editOffer('toCountryPlaceholder')}
                  label={editOffer('toCountry')}
                  required={false}
                  disabled={true}
                />
                <CitySearchableSelect
                  value={formData.destinationCity}
                  onChange={(value) => {}}
                  countryCode={formData.destinationCountry}
                  placeholder={editOffer('toCityPlaceholder')}
                  label={editOffer('toCity')}
                  required={false}
                  disabled={true}
                />
              </div>
            </div>
          </div>

          {/* Travel Details Card - Weight field read-only, others editable */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Plane className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">{editOffer('travelDetails')}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editOffer('availableSpace')} *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={editOffer('spacePlaceholder')}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{editOffer('departureDate')} *</label>
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleInputChange('departureDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{editOffer('pricePerKg')} *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={editOffer('pricePlaceholder')}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editOffer('additionalNotes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={editOffer('notesPlaceholder')}
            />
          </div>

          {/* Deletion Warning Message */}
          {!canDelete && deleteBlockReason && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">{editOffer('deletionRestricted')}</h3>
                  <p className="text-sm text-yellow-800">
                    {deleteBlockReason === 'paymentPending' 
                      ? editOffer('deleteBlockedPaymentPending')
                      : deleteBlockReason === 'verificationError'
                      ? editOffer('deleteBlockedVerificationError')
                      : deleteBlockReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className={`flex-1 px-6 py-3 border rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                canDelete 
                  ? 'border-red-300 text-red-700 hover:bg-red-50' 
                  : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
              title={!canDelete && deleteBlockReason 
                ? (deleteBlockReason === 'paymentPending' 
                    ? editOffer('deleteBlockedPaymentPending')
                    : deleteBlockReason === 'verificationError'
                    ? editOffer('deleteBlockedVerificationError')
                    : deleteBlockReason)
                : editOffer('deleteButton')}
            >
              <Trash2 className="w-4 h-4" />
              {editOffer('deleteButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-medium transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? editOffer('saving') : editOffer('saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
