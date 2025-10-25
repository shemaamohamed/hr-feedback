'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, CheckCircle, Clock, Award, FileText, User } from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Pending Feedback',
      value: '3',
      change: '2 due this week',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Completed',
      value: '12',
      change: 'This quarter',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Feedback Received',
      value: '8',
      change: '2 new this week',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Recognition',
      value: '5',
      change: 'Awards this year',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
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

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Feedback Requests</CardTitle>
            <CardDescription>Feedback awaiting your response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Q4 Performance Review', due: '3 days', priority: 'High' },
                { title: 'Team Collaboration Survey', due: '1 week', priority: 'Medium' },
                { title: 'Project Feedback', due: '2 weeks', priority: 'Low' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">Due in {item.due}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.priority === 'High' ? 'bg-red-100 text-red-700' :
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback Received</CardTitle>
            <CardDescription>Feedback from your manager</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Great work on Q3 Project', date: '2 days ago', type: 'Positive' },
                { title: 'Monthly Performance Review', date: '1 week ago', type: 'Review' },
                { title: 'Team Leadership Recognition', date: '2 weeks ago', type: 'Positive' },
              ].map((item, i) => (
                <div key={i} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{item.title}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.type === 'Positive' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="text-left px-4 py-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              <MessageSquare className="h-5 w-5 text-blue-600 mb-2" />
              <p className="font-medium">Submit Feedback</p>
              <p className="text-sm text-gray-500">Provide feedback to peers</p>
            </button>
            <button className="text-left px-4 py-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              <FileText className="h-5 w-5 text-green-600 mb-2" />
              <p className="font-medium">View My Reviews</p>
              <p className="text-sm text-gray-500">See all your reviews</p>
            </button>
            <button className="text-left px-4 py-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              <User className="h-5 w-5 text-purple-600 mb-2" />
              <p className="font-medium">Update Profile</p>
              <p className="text-sm text-gray-500">Manage your information</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
