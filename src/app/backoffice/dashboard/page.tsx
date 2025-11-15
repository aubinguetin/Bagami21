'use client';

import { useEffect, useState } from 'react';
import { FiUsers, FiPackage, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeliveries: number;
  activeDeliveries: number;
  totalTransactions: number;
  totalRevenue: number;
  recentUsers: number;
  recentDeliveries: number;
}

export default function BackofficeDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState<number>(17.5);

  useEffect(() => {
    fetchStats();
    fetchCommissionRate();
    
    // Refresh commission rate every 30 seconds to ensure it's up to date
    const interval = setInterval(() => {
      fetchCommissionRate();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/backoffice/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommissionRate = async () => {
    try {
      const response = await fetch('/api/backoffice/platform-settings', {
        cache: 'no-store', // Disable caching to always get fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Platform settings response:', data);
        const rate = data.settings?.commission_rate?.value || '0.175';
        console.log('Commission rate value:', rate);
        const percentage = parseFloat(rate) * 100;
        console.log('Commission rate percentage:', percentage);
        setCommissionRate(percentage);
      } else {
        console.error('Failed to fetch commission rate:', response.status);
      }
    } catch (error) {
      console.error('Error fetching commission rate:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: `+${stats?.recentUsers || 0} this week`,
      icon: FiUsers,
      color: 'blue',
    },
    {
      title: 'Active Deliveries',
      value: stats?.activeDeliveries || 0,
      change: `${stats?.totalDeliveries || 0} total`,
      icon: FiPackage,
      color: 'green',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      change: 'All time',
      icon: FiDollarSign,
      color: 'purple',
    },
    {
      title: 'Platform Revenue',
      value: `${(stats?.totalRevenue || 0).toLocaleString('fr-FR')} FCFA`,
      change: `From platform fees (${commissionRate}%)`,
      icon: FiTrendingUp,
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to the backoffice portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colorClass = colorClasses[card.color as keyof typeof colorClasses];

          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{card.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/backoffice/users"
            className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <FiUsers className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-slate-900">Manage Users</h3>
            <p className="text-sm text-slate-600 mt-1">View and moderate user accounts</p>
          </a>
          <a
            href="/backoffice/deliveries"
            className="p-4 border border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
          >
            <FiPackage className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-slate-900">Monitor Deliveries</h3>
            <p className="text-sm text-slate-600 mt-1">Track delivery requests and offers</p>
          </a>
          <a
            href="/backoffice/transactions"
            className="p-4 border border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
          >
            <FiDollarSign className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-slate-900">View Transactions</h3>
            <p className="text-sm text-slate-600 mt-1">Monitor financial transactions</p>
          </a>
        </div>
      </div>
    </div>
  );
}
