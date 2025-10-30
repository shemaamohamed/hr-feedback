'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface SidebarProps {
  userEmail?: string;
  onLogout?: () => void;
}

export function Sidebar({ userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/hr', label: 'Dashboard', icon: <LayoutDashboard /> },
    { href: '/hr/employees', label: 'Chat', icon: <Users /> },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-background border-r transition-all duration-300 ease-in-out flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 border-b px-4">
        {!collapsed && (
          <Image
          src='/logo.png' 
          alt="Logo"      
          width={180}
          height={180}
          className="py-2"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-primary"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center  gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-primary',
                collapsed
                ?"justify-center"
                :""
              )}
            >
              <span className="h-5 w-5 flex items-center justify-center">
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-2" />

      {/* User Info */}
      <div className="p-4 ">
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarFallback>
              {userEmail?.[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium leading-tight">{userEmail}</p>
              <p className="text-xs text-muted-foreground">HR Manager</p>
            </div>
          )}
        </div>
        <Button
          size="sm"
          className="w-full justify-center text-sm bg-[#FF4D4D] text-white hover:bg-black gap-2"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 " />
          <span>
            {!collapsed && 'Logout'}
            </span>
        </Button>
      </div>
    </aside>
  );
}
