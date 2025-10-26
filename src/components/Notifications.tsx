"use client";

import React, { useEffect, useState } from 'react';
import { notificationService } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = notificationService.subscribeNotifications(user.uid, (items) => {
      setNotifications(items);
    });
    return () => unsub && unsub();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Notifications</h3>
      <div className="space-y-1">
        {notifications.length === 0 && <div className="text-xs text-gray-500">No notifications</div>}
        {notifications.map((n) => (
          <div key={n.id} className={`p-2 rounded border ${n.read ? 'bg-white' : 'bg-blue-50 border-blue-100'}`}>
            <div className="text-sm font-medium">{n.title}</div>
            <div className="text-xs text-gray-600">{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
