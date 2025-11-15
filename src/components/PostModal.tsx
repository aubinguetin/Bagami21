import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  X,
  Package,
  Plane,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Scale
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
  
  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle click outside to close dropdown
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
              {searchTerm !== debouncedTerm && (
                <div className="text-xs text-gray-500 mt-1 px-2">Searching...</div>
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
  
  // Ultra-fast debounce for Trie-based instant search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 50); // Trie search is so fast we can use minimal debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle click outside to close dropdown
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
                placeholder={`Start typing city name...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
                autoComplete="off"
              />
              {debouncedTerm.length === 0 && (
                <div className="text-xs text-gray-600 mt-1 px-2">Instant search as you type</div>
              )}
              {cities.length > 0 && debouncedTerm.length > 0 && (
                <div className="text-xs text-gray-500 mt-1 px-2">{cities.length} cities found</div>
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
                  No cities found for "{debouncedTerm}"
                  <div className="text-xs text-gray-400 mt-1">Try a different spelling or shorter term</div>
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

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDelivery?: any;
  onSuccess?: () => void;
}

export function PostModal({ isOpen, onClose, editingDelivery, onSuccess }: PostModalProps) {
  const [postType, setPostType] = useState<'delivery' | 'travel'>('delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locale = useLocale();
  const countries = getCountriesList(locale);
  const { postModal } = useT();

  const [formData, setFormData] = useState(() => {
    if (editingDelivery) {
      return {
        itemType: editingDelivery.itemType || '',
        description: editingDelivery.description || '',
        weight: editingDelivery.weight || '',
        departureCountry: editingDelivery.fromCountry || '',
        departureCity: editingDelivery.fromCity || '',
        destinationCountry: editingDelivery.toCountry || '',
        destinationCity: editingDelivery.toCity || '',
        departureDate: editingDelivery.departureDate ? editingDelivery.departureDate.split('T')[0] : '',
        arrivalDate: editingDelivery.arrivalDate ? editingDelivery.arrivalDate.split('T')[0] : '',
        price: editingDelivery.price || '',
        notes: editingDelivery.notes || ''
      };
    }
    
    return {
      itemType: '',
      description: '',
      weight: '',
      departureCountry: '',
      departureCity: '',
      destinationCountry: '',
      destinationCity: '',
      departureDate: '',
      arrivalDate: '',
      price: '',
      notes: ''
    };
  });

  // Set post type from editing delivery
  useEffect(() => {
    if (editingDelivery) {
      setPostType(editingDelivery.type === 'request' ? 'delivery' : 'travel');
    }
  }, [editingDelivery]);

  // Removed city arrays - now using optimized CitySearchableSelect components

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      const url = editingDelivery ? `/api/deliveries/${editingDelivery.id}` : '/api/deliveries';
      const method = editingDelivery ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType,
          ...formData,
          currentUserId,
          currentUserContact
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(editingDelivery ? postModal('messages.updated') : postModal('messages.posted'));
        onSuccess?.();
        onClose();
        
        // Reset form for new posts
        if (!editingDelivery) {
          setFormData({
            itemType: '',
            description: '',
            weight: '',
            departureCountry: '',
            departureCity: '',
            destinationCountry: '',
            destinationCity: '',
            departureDate: '',
            arrivalDate: '',
            price: '',
            notes: ''
          });
        }
      } else {
        alert(postModal('messages.error').replace('{message}', result.error));
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert(postModal('messages.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[98vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className={`relative p-5 ${postType === 'delivery' ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {postType === 'delivery' ? <Package className="w-6 h-6" /> : <Plane className="w-6 h-6" />}
              <div>
                <h2 className="text-xl font-bold">
                  {editingDelivery 
                    ? (postType === 'delivery' ? postModal('delivery.editTitle') : postModal('travel.editTitle'))
                    : (postType === 'delivery' ? postModal('delivery.title') : postModal('travel.title'))
                  }
                </h2>
                <p className="text-white/80 text-sm">
                  {postType === 'delivery' ? postModal('delivery.subtitle') : postModal('travel.subtitle')}
                </p>
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

        {/* Post Type Selector - Compact */}
        {!editingDelivery && (
          <div className="p-4 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPostType('delivery')}
                className={`p-3 rounded-xl border transition-all ${
                  postType === 'delivery'
                    ? 'border-orange-400 bg-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className={`w-5 h-5 ${postType === 'delivery' ? 'text-orange-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <h3 className={`font-medium text-sm ${postType === 'delivery' ? 'text-orange-800' : 'text-gray-700'}`}>
                      {postModal('postType.needDelivery')}
                    </h3>
                    <p className={`text-xs ${postType === 'delivery' ? 'text-orange-600' : 'text-gray-500'}`}>
                      {postModal('postType.sendItems')}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPostType('travel')}
                className={`p-3 rounded-xl border transition-all ${
                  postType === 'travel'
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Plane className={`w-5 h-5 ${postType === 'travel' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <h3 className={`font-medium text-sm ${postType === 'travel' ? 'text-blue-800' : 'text-gray-700'}`}>
                      {postModal('postType.offerSpace')}
                    </h3>
                    <p className={`text-xs ${postType === 'travel' ? 'text-blue-600' : 'text-gray-500'}`}>
                      {postModal('postType.carryItems')}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(98vh-120px)]">
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {postType === 'delivery' ? (
              <>
                {/* Item & Route in Cards */}
                <div className="bg-orange-50/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Package className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-800">What & Where</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                      <select
                        value={formData.itemType}
                        onChange={(e) => handleInputChange('itemType', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">{postModal('itemDetails.itemTypePlaceholder')}</option>
                        <option value="documents">{postModal('itemDetails.itemTypes.documents')}</option>
                        <option value="electronics">{postModal('itemDetails.itemTypes.electronics')}</option>
                        <option value="clothing">{postModal('itemDetails.itemTypes.clothing')}</option>
                        <option value="food">{postModal('itemDetails.itemTypes.food')}</option>
                        <option value="gifts">{postModal('itemDetails.itemTypes.gifts')}</option>
                        <option value="other">{postModal('itemDetails.itemTypes.other')}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        placeholder="2.5"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                      placeholder="Describe what you want to send..."
                      required
                    />
                  </div>
                </div>

                {/* Route Card */}
                <div className="bg-blue-50/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Route</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <SearchableSelect
                        value={formData.departureCountry}
                        onChange={(value) => {
                          handleInputChange('departureCountry', value);
                          handleInputChange('departureCity', '');
                        }}
                        options={countries}
                        placeholder="From country"
                        label="From Country"
                        required
                      />
                      <CitySearchableSelect
                        value={formData.departureCity}
                        onChange={(value) => handleInputChange('departureCity', value)}
                        countryCode={formData.departureCountry}
                        placeholder="From city"
                        label="From City"
                        required
                        disabled={!formData.departureCountry}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <SearchableSelect
                        value={formData.destinationCountry}
                        onChange={(value) => {
                          handleInputChange('destinationCountry', value);
                          handleInputChange('destinationCity', '');
                        }}
                        options={countries}
                        placeholder="To country"
                        label="To Country"
                        required
                      />
                      <CitySearchableSelect
                        value={formData.destinationCity}
                        onChange={(value) => handleInputChange('destinationCity', value)}
                        countryCode={formData.destinationCountry}
                        placeholder="To city"
                        label="To City"
                        required
                        disabled={!formData.destinationCountry}
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline & Pricing Card */}
                <div className="bg-green-50/50 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">Timeline & Reward</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Needed by</label>
                      <input
                        type="date"
                        value={formData.arrivalDate}
                        onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reward (FCFA)</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        placeholder="2000"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Travel Route Card */}
                <div className="bg-blue-50/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Plane className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Travel Route</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <SearchableSelect
                        value={formData.departureCountry}
                        onChange={(value) => {
                          handleInputChange('departureCountry', value);
                          handleInputChange('departureCity', '');
                        }}
                        options={countries}
                        placeholder="From country"
                        label="From Country"
                        required
                        className="focus:ring-blue-500"
                      />
                      <CitySearchableSelect
                        value={formData.departureCity}
                        onChange={(value) => handleInputChange('departureCity', value)}
                        countryCode={formData.departureCountry}
                        placeholder="From city"
                        label="From City"
                        required
                        disabled={!formData.departureCountry}
                        className="focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <SearchableSelect
                        value={formData.destinationCountry}
                        onChange={(value) => {
                          handleInputChange('destinationCountry', value);
                          handleInputChange('destinationCity', '');
                        }}
                        options={countries}
                        placeholder="To country"
                        label="To Country"
                        required
                        className="focus:ring-blue-500"
                      />
                      <CitySearchableSelect
                        value={formData.destinationCity}
                        onChange={(value) => handleInputChange('destinationCity', value)}
                        countryCode={formData.destinationCountry}
                        placeholder="To city"
                        label="To City"
                        required
                        disabled={!formData.destinationCountry}
                        className="focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Travel Details Card */}
                <div className="bg-purple-50/50 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-800">Travel Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                      <input
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => handleInputChange('departureDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Available Space (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        placeholder="5.0"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate (FCFA per kg)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="500"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Additional Notes - Optional */}
            <div className="bg-gray-50/50 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Additional Notes (Optional)
                </label>
              </div>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                placeholder="Any special instructions or requirements..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 bg-gray-50/30 p-4 -mx-5 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all shadow-sm ${
                  postType === 'delivery'
                    ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 shadow-orange-200'
                    : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 shadow-blue-200'
                } disabled:cursor-not-allowed hover:shadow-md`}
              >
                {isSubmitting 
                  ? (editingDelivery ? 'Updating...' : 'Posting...') 
                  : editingDelivery 
                    ? '✓ Update' 
                    : (postType === 'delivery' ? '🚚 Post Request' : '✈️ Offer Space')
                }
              </button>
            </div>

            {/* Transparent spacer to lift the buttons and ensure they are fully visible */}
            <div className="h-12 w-full opacity-0 pointer-events-none"></div>

            {/* Additional transparent spacer to ensure buttons are fully visible */}
            <div className="h-8 w-full opacity-0 pointer-events-none"></div>
          </form>
        </div>
      </div>
    </div>
  );
}