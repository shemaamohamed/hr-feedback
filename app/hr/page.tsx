'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';

export default function HRDashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Employees',
      value: '156',
      change: '+12 this month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Feedback',
      value: '23',
      change: '8 urgent',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Avg Response Rate',
      value: '87%',
      change: '+5% from last month',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg Response Time',
      value: '2.4 days',
      change: '-0.3 days',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest feedback submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">Employee {i}</p>
                    <p className="text-sm text-gray-500">Performance Review</p>
                  </div>
                  <span className="text-xs text-gray-500">{i}h ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common HR tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <p className="font-medium">Create New Employee</p>
                <p className="text-sm text-gray-500">Add a new team member</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <p className="font-medium">Send Feedback Request</p>
                <p className="text-sm text-gray-500">Request feedback from employees</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <p className="font-medium">Generate Report</p>
                <p className="text-sm text-gray-500">Create analytics report</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
