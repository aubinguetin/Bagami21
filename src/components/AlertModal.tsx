import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  X,
  Bell,
  MapPin
} from 'lucide-react';
import { getCountriesList, getCitiesByCountry, searchCitiesByCountry } from '@/data/locations';
import { useLocale, useT } from '@/lib/i18n-helpers';

// SearchableSelect component with optimization
function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label,
  className = "",
  locale = 'en'
}: {
  value: string;
  onChange: (value: string) => void;
  options: { code: string; name: string }[];
  placeholder: string;
  label: string;
  className?: string;
  locale?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { alertModal: t } = useT();
  
  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Memoized filtering for optimal performance
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
  
  // Optimized callbacks
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
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 text-left border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white ${className}`}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder={t('searchPlaceholder').replace('{label}', label.toLowerCase())}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {searchTerm !== debouncedTerm && (
                <div className="text-xs text-gray-500 mt-1 px-2">{t('searching')}</div>
              )}
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

// Optimized city searchable select component for better performance with large datasets
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
  const { alertModal: t } = useT();
  
  // Ultra-fast debounce for Trie-based instant search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 50); // Trie search is so fast we can use minimal debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // High-performance Trie-based city search
  const cities = useMemo(() => {
    if (!countryCode) return [];
    
    // Trie-based search provides instant autocomplete experience
    const cityNames = searchCitiesByCountry(countryCode, debouncedTerm, 40);
    return cityNames.map(city => ({ code: city, name: city }));
  }, [countryCode, debouncedTerm]);
  
  const selectedOption = cities.find(option => option.code === value) || 
    (value ? { code: value, name: value } : null);
  
  // Optimized callbacks
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
                placeholder={t('startTyping')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
                autoComplete="off"
              />
              {debouncedTerm.length === 0 && (
                <div className="text-xs text-gray-600 mt-1 px-2">{t('instantSearch')}</div>
              )}
              {cities.length > 0 && debouncedTerm.length > 0 && (
                <div className="text-xs text-gray-500 mt-1 px-2">{t('citiesFound').replace('{count}', cities.length.toString())}</div>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto">
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-gray-500 italic"
              >
                {placeholder}
              </button>
              {cities.length === 0 && debouncedTerm.length >= 1 && (
                <div className="px-3 py-2 text-gray-500 italic">
                  {t('noCitiesFound').replace('{term}', debouncedTerm)}
                  <div className="text-xs text-gray-400 mt-1">{t('tryDifferent')}</div>
                </div>
              )}
              {cities.map((option) => (
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

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: {
    searchQuery: string;
    departureCountry: string;
    destinationCountry: string;
    activeFilter: string;
  };
}

export function AlertModal({ isOpen, onClose, currentFilters }: AlertModalProps) {
  const [alertData, setAlertData] = useState({
    name: '',
    departureCountry: currentFilters.departureCountry,
    departureCity: '',
    destinationCountry: currentFilters.destinationCountry,
    destinationCity: '',
    alertType: currentFilters.activeFilter === 'all' ? 'all' : currentFilters.activeFilter,
    emailNotifications: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const locale = useLocale();
  const { alertModal: t } = useT();

  const countries = getCountriesList(locale);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate a descriptive name for the alert
      const fromLocation = alertData.departureCity 
        ? `${alertData.departureCity}, ${alertData.departureCountry}` 
        : alertData.departureCountry || 'Any location';
      const toLocation = alertData.destinationCity 
        ? `${alertData.destinationCity}, ${alertData.destinationCountry}` 
        : alertData.destinationCountry || 'Any location';
      const alertName = `${fromLocation} → ${toLocation} (${alertData.alertType})`;

      const payload = {
        name: alertName,
        departureCountry: alertData.departureCountry || null,
        departureCity: alertData.departureCity || null,
        destinationCountry: alertData.destinationCountry || null,
        destinationCity: alertData.destinationCity || null,
        alertType: alertData.alertType,
        emailNotifications: alertData.emailNotifications
      };

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        alert(t('error').replace('{message}', result.error));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert(t('networkError'));
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = (goToAlerts: boolean) => {
    setShowSuccessModal(false);
    setIsSubmitting(false);
    onClose();
    
    if (goToAlerts) {
      // Check if we're already on the alerts page
      const currentPath = window.location.pathname;
      if (currentPath !== '/alerts') {
        window.location.href = '/alerts';
      }
      // If already on alerts page, just close the modal (onClose will trigger refresh)
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setAlertData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">{t('title')}</h2>
                <p className="text-white/80 text-sm">{t('subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="bg-purple-50/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">{t('route')}</span>
              </div>
              <div className="space-y-3">
                {/* From Location - Horizontal Layout */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <SearchableSelect
                      value={alertData.departureCountry}
                      onChange={(value) => handleInputChange('departureCountry', value)}
                      options={countries}
                      placeholder={t('anyCountry')}
                      label={t('fromCountry')}
                      className="focus:ring-blue-500"
                      locale={locale}
                    />
                  </div>
                  <div className="flex-1">
                    <CitySearchableSelect
                      value={alertData.departureCity}
                      onChange={(value) => handleInputChange('departureCity', value)}
                      countryCode={alertData.departureCountry}
                      placeholder={t('anyCity')}
                      label={t('fromCity')}
                      disabled={!alertData.departureCountry}
                      className="focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* To Location - Horizontal Layout */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <SearchableSelect
                      value={alertData.destinationCountry}
                      onChange={(value) => handleInputChange('destinationCountry', value)}
                      options={countries}
                      placeholder={t('anyCountry')}
                      label={t('toCountry')}
                      className="focus:ring-blue-500"
                      locale={locale}
                    />
                  </div>
                  <div className="flex-1">
                    <CitySearchableSelect
                      value={alertData.destinationCity}
                      onChange={(value) => handleInputChange('destinationCity', value)}
                      countryCode={alertData.destinationCountry}
                      placeholder={t('anyCity')}
                      label={t('toCity')}
                      disabled={!alertData.destinationCountry}
                      className="focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50/50 rounded-2xl p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('alertType')}
                </label>
                <select
                  value={alertData.alertType}
                  onChange={(e) => handleInputChange('alertType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                >
                  <option value="all">{t('allDeliveries')}</option>
                  <option value="requests">{t('requestsOnly')}</option>
                  <option value="offers">{t('offersOnly')}</option>
                </select>
                
                {/* Explanatory text based on selection */}
                {alertData.alertType === 'requests' && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-800 leading-relaxed">
                      {t('requestsExplain')}
                    </p>
                  </div>
                )}
                
                {alertData.alertType === 'offers' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {t('offersExplain')}
                    </p>
                  </div>
                )}
                
                {alertData.alertType === 'all' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800 leading-relaxed">
                      {t('allExplain')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium transition-all hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md shadow-blue-200"
              >
                {isSubmitting ? t('creating') : t('createButton')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('successTitle')}</h3>
              <p className="text-gray-600 mb-6">
                {t('successMessage')}
              </p>
              <div className="flex flex-col gap-3">
                {window.location.pathname !== '/alerts' && (
                  <button
                    onClick={() => handleCloseSuccess(true)}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t('goToAlerts')}
                  </button>
                )}
                <button
                  onClick={() => handleCloseSuccess(false)}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  {window.location.pathname === '/alerts' ? t('close') : t('backToDeliveries')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}