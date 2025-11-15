'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  X,
  Package,
  MapPin,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { getCountriesList, searchCitiesByCountry } from '@/data/locations';
import { useLocale, useT } from '@/lib/i18n-helpers';

// SearchableSelect component (reused from PostModal)
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

export default function NewDeliveryRequestPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locale = useLocale();
  const countries = getCountriesList(locale);
  const { newRequest } = useT();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType: 'delivery',
          itemType: formData.itemType,
          description: formData.description,
          weight: formData.weight,
          departureCountry: formData.departureCountry,
          departureCity: formData.departureCity,
          destinationCountry: formData.destinationCountry,
          destinationCity: formData.destinationCity,
          arrivalDate: formData.arrivalDate,
          price: formData.price,
          notes: formData.notes,
          currentUserId,
          currentUserContact
        }),
      });

      if (response.ok) {
        router.push('/deliveries');
      } else {
        const error = await response.json();
        alert(error.error || newRequest('errors.createFailed'));
      }
    } catch (error) {
      console.error('Error creating delivery request:', error);
      alert(newRequest('errors.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{newRequest('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-20">
      {/* Header */}
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
                <h1 className="text-base font-bold text-white text-center">{newRequest('title')}</h1>
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
          {/* Item Details Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-orange-600" />
              <h2 className="font-semibold text-gray-800">{newRequest('itemDetails.title')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{newRequest('itemDetails.itemType')} *</label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => handleInputChange('itemType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">{newRequest('itemDetails.itemTypePlaceholder')}</option>
                    <option value="documents">{newRequest('itemDetails.itemTypes.documents')}</option>
                    <option value="electronics">{newRequest('itemDetails.itemTypes.electronics')}</option>
                    <option value="clothing">{newRequest('itemDetails.itemTypes.clothing')}</option>
                    <option value="food">{newRequest('itemDetails.itemTypes.food')}</option>
                    <option value="gifts">{newRequest('itemDetails.itemTypes.gifts')}</option>
                    <option value="other">{newRequest('itemDetails.itemTypes.other')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{newRequest('itemDetails.weight')} *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={newRequest('itemDetails.weightPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{newRequest('itemDetails.description')} *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder={newRequest('itemDetails.descriptionPlaceholder')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Route Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">{newRequest('route.title')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  value={formData.departureCountry}
                  onChange={(value) => {
                    handleInputChange('departureCountry', value);
                    handleInputChange('departureCity', '');
                  }}
                  options={countries}
                  placeholder={newRequest('route.fromCountryPlaceholder')}
                  label={newRequest('route.fromCountry')}
                  required
                />
                <CitySearchableSelect
                  value={formData.departureCity}
                  onChange={(value) => handleInputChange('departureCity', value)}
                  countryCode={formData.departureCountry}
                  placeholder={newRequest('route.fromCityPlaceholder')}
                  label={newRequest('route.fromCity')}
                  required
                  disabled={!formData.departureCountry}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  value={formData.destinationCountry}
                  onChange={(value) => {
                    handleInputChange('destinationCountry', value);
                    handleInputChange('destinationCity', '');
                  }}
                  options={countries}
                  placeholder={newRequest('route.toCountryPlaceholder')}
                  label={newRequest('route.toCountry')}
                  required
                />
                <CitySearchableSelect
                  value={formData.destinationCity}
                  onChange={(value) => handleInputChange('destinationCity', value)}
                  countryCode={formData.destinationCountry}
                  placeholder={newRequest('route.toCityPlaceholder')}
                  label={newRequest('route.toCity')}
                  required
                  disabled={!formData.destinationCountry}
                />
              </div>
            </div>
          </div>

          {/* Timeline & Pricing Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-800">{newRequest('timeline.title')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{newRequest('timeline.neededBy')} *</label>
                <input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{newRequest('timeline.reward')} *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={newRequest('timeline.rewardPlaceholder')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {newRequest('notes.title')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder={newRequest('notes.placeholder')}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              {newRequest('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl font-medium transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {isSubmitting ? newRequest('actions.submitting') : newRequest('actions.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
