'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  FiSearch, 
  FiFilter, 
  FiPackage, 
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiTrash2,
  FiAlertCircle,
  FiSend,
  FiDownload,
} from 'react-icons/fi';

interface Delivery {
  id: string;
  title: string;
  type: 'request' | 'offer';
  fromCity: string;
  fromCountry: string;
  toCity: string;
  toCountry: string;
  price: number;
  currency: string;
  weight: number | null;
  status: string;
  createdAt: Date;
  departureDate: Date | null;
  arrivalDate: Date | null;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface DeliveryStats {
  total: number;
  requests: number;
  offers: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function DeliveriesManagementPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchDeliveries();
    fetchStats();
  }, [currentPage, debouncedSearchTerm, filterType, filterPriceMin, filterPriceMax, filterDateFrom, filterDateTo, sortField, sortOrder]);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortField,
        sortOrder,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterPriceMin && { priceMin: filterPriceMin }),
        ...(filterPriceMax && { priceMax: filterPriceMax }),
        ...(filterDateFrom && { dateFrom: filterDateFrom }),
        ...(filterDateTo && { dateTo: filterDateTo }),
      });

      const response = await fetch(`/api/backoffice/deliveries?${params}`);
      const data = await response.json();
      
      if (data.deliveries) {
        setDeliveries(data.deliveries);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/backoffice/deliveries/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (!confirm('Are you sure you want to delete this delivery? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/deliveries/${deliveryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDeliveries();
        fetchStats();
      } else {
        alert('Failed to delete delivery');
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Error deleting delivery');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      // Fetch all deliveries matching current filters (without pagination)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Get all records
        sortField,
        sortOrder,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterPriceMin && { priceMin: filterPriceMin }),
        ...(filterPriceMax && { priceMax: filterPriceMax }),
        ...(filterDateFrom && { dateFrom: filterDateFrom }),
        ...(filterDateTo && { dateTo: filterDateTo }),
      });

      const response = await fetch(`/api/backoffice/deliveries?${params}`);
      const data = await response.json();
      
      if (!data.deliveries || data.deliveries.length === 0) {
        alert('No deliveries to export');
        return;
      }

      // Format data for Excel
      const excelData = data.deliveries.map((delivery: Delivery) => ({
        'ID': delivery.id,
        'Title': delivery.title,
        'Type': delivery.type.toUpperCase(),
        'From City': delivery.fromCity,
        'From Country': delivery.fromCountry,
        'To City': delivery.toCity,
        'To Country': delivery.toCountry,
        'Price': delivery.price,
        'Currency': delivery.currency,
        'Weight (kg)': delivery.weight || 'N/A',
        'Status': delivery.status,
        'Sender Name': delivery.sender.name || 'N/A',
        'Sender Email': delivery.sender.email || 'N/A',
        'Departure Date': delivery.departureDate ? formatDate(delivery.departureDate) : 'N/A',
        'Arrival Date': delivery.arrivalDate ? formatDate(delivery.arrivalDate) : 'N/A',
        'Created Date': formatDate(delivery.createdAt),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // ID
        { wch: 30 }, // Title
        { wch: 10 }, // Type
        { wch: 20 }, // From City
        { wch: 15 }, // From Country
        { wch: 20 }, // To City
        { wch: 15 }, // To Country
        { wch: 12 }, // Price
        { wch: 10 }, // Currency
        { wch: 12 }, // Weight
        { wch: 15 }, // Status
        { wch: 25 }, // Sender Name
        { wch: 30 }, // Sender Email
        { wch: 15 }, // Departure Date
        { wch: 15 }, // Arrival Date
        { wch: 15 }, // Created Date
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Deliveries');

      // Generate filename with current date and filters
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let filename = `deliveries_${dateStr}`;
      
      if (filterType !== 'all') {
        filename += `_${filterType}`;
      }
      if (filterDateFrom || filterDateTo) {
        filename += '_filtered';
      }
      
      filename += '.xlsx';

      // Save file
      XLSX.writeFile(wb, filename);
      
      alert(`Successfully exported ${excelData.length} deliveries to Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deliveries Management</h1>
          <p className="text-slate-600 mt-1">Monitor and manage all deliveries</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting || deliveries.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                Export to Excel
              </>
            )}
          </button>
          <button
            onClick={() => fetchDeliveries()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Requests</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.requests}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiPackage className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Offers</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.offers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiSend className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, location, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>
            
            {/* Active filters count */}
            {(filterType !== 'all' || filterPriceMin || filterPriceMax || filterDateFrom || filterDateTo) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {[filterType !== 'all', filterPriceMin, filterPriceMax, filterDateFrom, filterDateTo].filter(Boolean).length} active filter(s)
                </span>
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterPriceMin('');
                    setFilterPriceMax('');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiPackage className="w-4 h-4" />
                      Type
                    </div>
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="request">Request</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>

                {/* Min Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="w-4 h-4" />
                      Min Price (FCFA)
                    </div>
                  </label>
                  <input
                    type="number"
                    value={filterPriceMin}
                    onChange={(e) => {
                      setFilterPriceMin(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Max Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="w-4 h-4" />
                      Max Price (FCFA)
                    </div>
                  </label>
                  <input
                    type="number"
                    value={filterPriceMax}
                    onChange={(e) => {
                      setFilterPriceMax(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="∞"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Date From Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Created From
                    </div>
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Date To Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Created To
                    </div>
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600">Loading deliveries...</p>
            </div>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No deliveries found</h3>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        Delivery
                        {sortField === 'title' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        Type
                        {sortField === 'type' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        Price
                        {sortField === 'price' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        Created
                        {sortField === 'createdAt' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {deliveries.map((delivery) => (
                    <tr 
                      key={delivery.id} 
                      className="hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => router.push(`/backoffice/deliveries/${delivery.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{delivery.title}</div>
                        {delivery.weight && (
                          <div className="text-xs text-slate-500">{delivery.weight} kg</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          delivery.type === 'request'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {delivery.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {delivery.fromCity}, {delivery.fromCountry}
                        </div>
                        <div className="text-xs text-slate-500">
                          → {delivery.toCity}, {delivery.toCountry}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(delivery.price, delivery.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/backoffice/users/${delivery.sender.id}`);
                          }}
                        >
                          {delivery.sender.name || delivery.sender.email || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(delivery.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/backoffice/deliveries/${delivery.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="View details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDelivery(delivery.id);
                            }}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
