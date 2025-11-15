'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Package,
  MapPin,
  Clock,
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
              : 'focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-gray-300'
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
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              : 'focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-gray-300'
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
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

export default function EditDeliveryRequestPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.id as string;
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalDelivery, setOriginalDelivery] = useState<any>(null);
  const [canDelete, setCanDelete] = useState(true);
  const [deleteBlockReason, setDeleteBlockReason] = useState('');
  const [referrerPage, setReferrerPage] = useState<string>('/deliveries');
  const locale = useLocale();
  const countries = getCountriesList(locale);
  const { editRequest } = useT();

  const [formData, setFormData] = useState({
    itemType: '',
    description: '',
    weight: '',
    departureCountry: '',
    departureCity: '',
    destinationCountry: '',
    destinationCity: '',
    arrivalDate: '',
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
        
        // Store original delivery for reference
        setOriginalDelivery(delivery);
        
        // Check if user owns this delivery
        const currentUserId = localStorage.getItem('bagami_user_id');
        if (delivery.senderId !== currentUserId) {
          alert(editRequest('ownershipError'));
          router.push('/deliveries');
          return;
        }

        // Check if it's a request type
        if (delivery.type !== 'request') {
          router.push(`/deliveries/edit-offer/${deliveryId}`);
          return;
        }

        // Check deletion eligibility based on payment and delivery status
        await checkDeletionEligibility(deliveryId);

        // Parse description to separate main description and notes
        let mainDescription = delivery.description || '';
        let additionalNotes = '';
        
        if (mainDescription.includes('\n\nAdditional Notes:\n')) {
          const parts = mainDescription.split('\n\nAdditional Notes:\n');
          mainDescription = parts[0];
          additionalNotes = parts[1] || '';
        }

        // Extract item type from title (format: "Space request: itemType delivery")
        let extractedItemType = '';
        if (delivery.title) {
          // Try to match "Space request: {itemType} delivery" format
          let titleMatch = delivery.title.match(/^Space request:\s*(.+?)\s+delivery$/i);
          if (titleMatch) {
            extractedItemType = titleMatch[1].toLowerCase();
          } else {
            // Fallback: Try to match just "{itemType} delivery" format (old format)
            titleMatch = delivery.title.match(/^(.+?)\s+delivery$/i);
            if (titleMatch) {
              extractedItemType = titleMatch[1].toLowerCase();
            }
          }
        }
        
        console.log('📦 Extracted item type:', extractedItemType, 'from title:', delivery.title);

        setFormData({
          itemType: extractedItemType,
          description: mainDescription,
          weight: delivery.weight || '',
          departureCountry: delivery.fromCountry || '',
          departureCity: delivery.fromCity || '',
          destinationCountry: delivery.toCountry || '',
          destinationCity: delivery.toCity || '',
          arrivalDate: delivery.arrivalDate ? delivery.arrivalDate.split('T')[0] : '',
          price: delivery.price || '',
          notes: additionalNotes
        });
      } catch (error) {
        console.error('Error fetching delivery:', error);
        alert(editRequest('loadError'));
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

    if (!confirm(editRequest('confirmDelete'))) {
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
        alert(error.error || editRequest('deleteError'));
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert(editRequest('genericError'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      // Only send the editable fields: arrivalDate, price, and notes
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType: 'delivery',
          // Keep original non-editable fields from the loaded delivery
          itemType: formData.itemType,
          description: formData.description,
          weight: formData.weight,
          fromCountry: formData.departureCountry,
          fromCity: formData.departureCity,
          toCountry: formData.destinationCountry,
          toCity: formData.destinationCity,
          departureDate: originalDelivery?.departureDate || new Date().toISOString(),
          // Editable fields
          arrivalDate: formData.arrivalDate,
          price: formData.price,
          notes: formData.notes,
          currentUserId,
          currentUserContact
        }),
      });

      if (response.ok) {
        alert(editRequest('updateSuccess'));
        // Redirect to the page the user came from
        router.push(referrerPage);
      } else {
        const error = await response.json();
        alert(error.error || editRequest('updateError'));
      }
    } catch (error) {
      console.error('Error updating delivery request:', error);
      alert(editRequest('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{editRequest('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-20">
      {/* Fixed Transparent Header with Styled Elements */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-orange-500 text-orange-600 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-orange-500 border-orange-500 px-6 py-2 rounded-full border-2 flex items-center justify-center">
                <h1 className="text-base font-bold text-white text-center">{editRequest('title')}</h1>
              </div>
            </div>
            
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content padding to account for fixed header */}
      <div className="pt-20"></div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Details Card - Editable */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-orange-600" />
              <h2 className="font-semibold text-gray-800">{editRequest('itemDetails')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{editRequest('itemType')} *</label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => handleInputChange('itemType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">{editRequest('itemTypePlaceholder')}</option>
                    <option value="documents">{editRequest('itemTypes.documents')}</option>
                    <option value="electronics">{editRequest('itemTypes.electronics')}</option>
                    <option value="clothing">{editRequest('itemTypes.clothing')}</option>
                    <option value="food">{editRequest('itemTypes.food')}</option>
                    <option value="gifts">{editRequest('itemTypes.gifts')}</option>
                    <option value="other">{editRequest('itemTypes.other')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{editRequest('weight')} *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={editRequest('weightPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editRequest('description')} *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder={editRequest('descriptionPlaceholder')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Route Card - Read Only */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 opacity-75">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-600">{editRequest('route')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  value={formData.departureCountry}
                  onChange={(value) => {}}
                  options={countries}
                  placeholder={editRequest('fromCountryPlaceholder')}
                  label={editRequest('fromCountry')}
                  required={false}
                  disabled={true}
                />
                <CitySearchableSelect
                  value={formData.departureCity}
                  onChange={(value) => {}}
                  countryCode={formData.departureCountry}
                  placeholder={editRequest('fromCityPlaceholder')}
                  label={editRequest('fromCity')}
                  required={false}
                  disabled={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  value={formData.destinationCountry}
                  onChange={(value) => {}}
                  options={countries}
                  placeholder={editRequest('toCountryPlaceholder')}
                  label={editRequest('toCountry')}
                  required={false}
                  disabled={true}
                />
                <CitySearchableSelect
                  value={formData.destinationCity}
                  onChange={(value) => {}}
                  countryCode={formData.destinationCountry}
                  placeholder={editRequest('toCityPlaceholder')}
                  label={editRequest('toCity')}
                  required={false}
                  disabled={true}
                />
              </div>
            </div>
          </div>

          {/* Timeline & Pricing Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-800">{editRequest('timelineReward')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editRequest('neededBy')} *</label>
                <input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editRequest('reward')} *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={editRequest('rewardPlaceholder')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editRequest('additionalNotes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder={editRequest('notesPlaceholder')}
            />
          </div>

          {/* Deletion Warning Message */}
          {!canDelete && deleteBlockReason && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">{editRequest('deletionRestricted')}</h3>
                  <p className="text-sm text-yellow-800">
                    {deleteBlockReason === 'paymentPending' 
                      ? editRequest('deleteBlockedPaymentPending')
                      : deleteBlockReason === 'verificationError'
                      ? editRequest('deleteBlockedVerificationError')
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
                    ? editRequest('deleteBlockedPaymentPending')
                    : deleteBlockReason === 'verificationError'
                    ? editRequest('deleteBlockedVerificationError')
                    : deleteBlockReason)
                : editRequest('deleteButton')}
            >
              <Trash2 className="w-4 h-4" />
              {editRequest('deleteButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl font-medium transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? editRequest('saving') : editRequest('saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
