'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  FiSearch, 
  FiFilter, 
  FiDollarSign,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiPhone,
  FiCalendar,
  FiDownload,
} from 'react-icons/fi';

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: Date;
  metadata: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface WithdrawalStats {
  totalPending: number;
  totalCompleted: number;
  totalFailed: number;
  pendingAmount: number;
}

export default function WithdrawalRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchWithdrawalRequests();
    fetchStats();
  }, [filterStatus, filterDateFrom, filterDateTo]);

  const fetchWithdrawalRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        ...(filterDateFrom && { dateFrom: filterDateFrom }),
        ...(filterDateTo && { dateTo: filterDateTo }),
      });

      const response = await fetch(`/api/backoffice/withdrawals?${params}`);
      const data = await response.json();
      
      if (data.withdrawals) {
        setRequests(data.withdrawals);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/backoffice/withdrawals/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/backoffice/withdrawals/${requestId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Withdrawal approved successfully!');
        fetchWithdrawalRequests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Failed to approve withdrawal: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Failed to approve withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/backoffice/withdrawals/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('Withdrawal rejected successfully!');
        fetchWithdrawalRequests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Failed to reject withdrawal: ${error.error}`);
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Failed to reject withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency = 'XOF') => {
    // Convert FCFA to XOF for Intl.NumberFormat (XOF is the ISO code for West African CFA franc)
    const isoCurrency = currency === 'FCFA' ? 'XOF' : currency;
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: isoCurrency,
    }).format(amount).replace('XOF', 'FCFA'); // Display as FCFA instead of XOF
  };

  const getPhoneNumber = (metadata: string) => {
    try {
      const data = JSON.parse(metadata);
      return data.phoneNumber || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      // Fetch all withdrawal requests matching current filters (without pagination)
      const params = new URLSearchParams();
      
      // Only add status filter if it's not "all"
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      if (filterDateFrom) {
        params.append('dateFrom', filterDateFrom);
      }
      
      if (filterDateTo) {
        params.append('dateTo', filterDateTo);
      }

      const response = await fetch(`/api/backoffice/withdrawals?${params}`);
      const data = await response.json();
      
      if (!data.withdrawals || data.withdrawals.length === 0) {
        alert('No withdrawal requests to export');
        return;
      }

      // Format data for Excel
      const excelData = data.withdrawals.map((request: WithdrawalRequest) => ({
        'Request ID': request.id,
        'Date': formatDate(request.createdAt),
        'User Name': request.user.name || 'N/A',
        'User Email': request.user.email || 'N/A',
        'Phone Number': getPhoneNumber(request.metadata),
        'Amount': request.amount,
        'Currency': request.currency,
        'Status': request.status === 'completed' ? 'Approved' : request.status === 'failed' ? 'Rejected' : 'Pending',
        'Description': request.description,
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 30 }, // Request ID
        { wch: 20 }, // Date
        { wch: 25 }, // User Name
        { wch: 30 }, // User Email
        { wch: 20 }, // Phone Number
        { wch: 15 }, // Amount
        { wch: 10 }, // Currency
        { wch: 12 }, // Status
        { wch: 50 }, // Description
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Withdrawal Requests');

      // Generate filename with current date and filters
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let filename = `withdrawals_${dateStr}`;
      
      if (filterStatus !== 'all') {
        filename += `_${filterStatus}`;
      }
      if (filterDateFrom || filterDateTo) {
        filename += '_filtered';
      }
      
      filename += '.xlsx';

      // Save file
      XLSX.writeFile(wb, filename);
      
      alert(`Successfully exported ${excelData.length} withdrawal requests to Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      request.user.name?.toLowerCase().includes(search) ||
      request.user.email?.toLowerCase().includes(search) ||
      getPhoneNumber(request.metadata).includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Withdrawal Requests</h1>
          <p className="text-slate-600 mt-1">Review and approve withdrawal requests</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting || requests.length === 0}
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
            onClick={() => {
              fetchWithdrawalRequests();
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.totalPending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalCompleted}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalFailed}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by user or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Approved</option>
                <option value="failed">Rejected</option>
              </select>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Date From
                </div>
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Date To
                </div>
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(filterDateFrom || filterDateTo) && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Date Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600">Loading requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FiDollarSign className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No withdrawal requests</h3>
            <p className="mt-1 text-sm text-slate-500">No requests match your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => router.push(`/backoffice/withdrawals/${request.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/backoffice/users/${request.user.id}`);
                        }}
                      >
                        {request.user.name || request.user.email || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <FiPhone className="w-4 h-4 text-slate-400" />
                        {getPhoneNumber(request.metadata)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        {formatCurrency(request.amount, request.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'completed' ? 'Approved' : request.status === 'failed' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {request.status === 'pending' && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                          >
                            {processingId === request.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-slate-400 text-xs">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
