'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FiShield, 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiChevronDown, 
  FiChevronUp,
  FiUser,
  FiLogIn,
  FiUserCheck,
  FiUserX,
  FiPackage,
  FiDollarSign,
  FiSettings,
  FiFileText,
  FiBell,
  FiDatabase,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiClock,
  FiMapPin,
  FiMonitor
} from 'react-icons/fi';

interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Fetch logs
  const fetchLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/backoffice/audit?page=${page}&limit=${pagination.limit}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLogs(pagination.page);
    }
  }, [status, pagination.page]);

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      log.action.toLowerCase().includes(searchLower) ||
      log.admin.name?.toLowerCase().includes(searchLower) ||
      log.admin.email.toLowerCase().includes(searchLower) ||
      log.targetId?.toLowerCase().includes(searchLower) ||
      log.ipAddress?.toLowerCase().includes(searchLower);

    // Action filter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    // Target type filter
    const matchesTargetType = targetTypeFilter === 'all' || log.targetType === targetTypeFilter;

    return matchesSearch && matchesAction && matchesTargetType;
  });

  // Get unique action types for filter
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueTargetTypes = Array.from(new Set(logs.map(log => log.targetType).filter(Boolean)));

  // Get icon for action type
  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <FiLogIn className="w-4 h-4" />;
    if (action.includes('suspend') || action.includes('deactivate')) return <FiUserX className="w-4 h-4" />;
    if (action.includes('activate') || action.includes('approve')) return <FiUserCheck className="w-4 h-4" />;
    if (action.includes('reject')) return <FiX className="w-4 h-4" />;
    if (action.includes('user')) return <FiUser className="w-4 h-4" />;
    if (action.includes('delivery')) return <FiPackage className="w-4 h-4" />;
    if (action.includes('withdrawal') || action.includes('topup')) return <FiDollarSign className="w-4 h-4" />;
    if (action.includes('notification')) return <FiBell className="w-4 h-4" />;
    if (action.includes('settings')) return <FiSettings className="w-4 h-4" />;
    if (action.includes('terms') || action.includes('policy')) return <FiFileText className="w-4 h-4" />;
    if (action.includes('export')) return <FiDownload className="w-4 h-4" />;
    return <FiDatabase className="w-4 h-4" />;
  };

  // Get color for action type
  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (action.includes('suspend') || action.includes('reject') || action.includes('delete')) return 'bg-red-100 text-red-700 border-red-300';
    if (action.includes('activate') || action.includes('approve')) return 'bg-green-100 text-green-700 border-green-300';
    if (action.includes('notification')) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (action.includes('withdrawal') || action.includes('topup')) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (action.includes('settings') || action.includes('terms') || action.includes('policy')) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Format action name
  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Admin', 'Action', 'Target Type', 'Target ID', 'IP Address'];
    const csvData = filteredLogs.map(log => [
      formatDate(log.createdAt),
      log.admin.name || log.admin.email,
      log.action,
      log.targetType || '-',
      log.targetId || '-',
      log.ipAddress || '-',
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse and display details
  const renderDetails = (details: string | null) => {
    if (!details) return <span className="text-gray-400 text-xs italic">No details</span>;
    
    try {
      const parsed = JSON.parse(details);
      return (
        <div className="bg-gray-50 rounded-lg p-3 mt-2 border border-gray-200">
          <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      );
    } catch {
      return <span className="text-gray-600 text-xs">{details}</span>;
    }
  };

  // Get browser name from user agent
  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-sm text-gray-600 mt-1">Track all administrative actions and activities</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.total.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiDatabase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredLogs.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiFilter className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Current Page</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.page} / {pagination.totalPages}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FiFileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Action Types</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueActions.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <FiSettings className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by admin, action, target ID, IP..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Actions</option>
                {uniqueActions.sort().map(action => (
                  <option key={action} value={action}>{formatActionName(action)}</option>
                ))}
              </select>
            </div>

            {/* Target Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Target Type
              </label>
              <select
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Targets</option>
                {uniqueTargetTypes.sort().map(type => (
                  <option key={type} value={type as string}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading logs...</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FiAlertCircle className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">No audit logs found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <>
                      <tr 
                        key={log.id}
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <FiUser className="w-3 h-3 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.admin.name || 'Admin'}</p>
                              <p className="text-xs text-gray-500">{log.admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                            {formatActionName(log.action)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {log.targetType ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.targetType}</p>
                              <p className="text-xs text-gray-500 font-mono">{log.targetId?.substring(0, 12)}...</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FiMapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700 font-mono">{log.ipAddress || 'Unknown'}</span>
                          </div>
                          {log.userAgent && (
                            <div className="flex items-center gap-2 mt-1">
                              <FiMonitor className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{getBrowserInfo(log.userAgent)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLog(expandedLog === log.id ? null : log.id);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                          >
                            {expandedLog === log.id ? (
                              <>
                                Hide <FiChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                View <FiChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr key={`${log.id}-details`}>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 mb-1">Action ID</p>
                                  <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200">{log.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 mb-1">Admin ID</p>
                                  <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200">{log.adminId}</p>
                                </div>
                              </div>
                              {log.targetId && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 mb-1">Target ID (Full)</p>
                                  <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200">{log.targetId}</p>
                                </div>
                              )}
                              {log.userAgent && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-600 mb-1">User Agent</p>
                                  <p className="text-xs text-gray-700 bg-white px-3 py-2 rounded border border-gray-200 break-all">{log.userAgent}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Action Details</p>
                                {renderDetails(log.details)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setPagination({ ...pagination, page: pageNum })}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
