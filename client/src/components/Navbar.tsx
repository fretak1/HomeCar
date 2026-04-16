"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  User,
  ChevronDown,
  Bell,
  MessageSquare,
  FileText,
  Wrench,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from './common/Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLoading: userLoading } = useUserStore();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, connectSocket, disconnectSocket } = useNotificationStore();
  const [displayNotifications, setDisplayNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      connectSocket();
      
      return () => {
        disconnectSocket();
      };
    }
  }, [currentUser, fetchNotifications, connectSocket, disconnectSocket]);

  // Handle dropdown open/close
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Capture what was unread before marking as read
      const unread = notifications.filter(n => !n.read);
      setDisplayNotifications(unread);

      // Auto-mark all as read
      if (unread.length > 0) {
        markAllAsRead();
      }
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getUserInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getDashboardLabel = () => {
    if (!currentUser) return 'Dashboard';
    const role = currentUser.role.toLowerCase();
    return `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'APPLICATION': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'MAINTENANCE': return <Wrench className="h-4 w-4 text-red-500" />;
      case 'LEASE': return <CheckCircle2 className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            {userLoading ? (
              <Skeleton className="h-10 w-28 rounded-lg" />
            ) : (
              <Logo className="h-10 w-auto" priority />
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-12 h-full">
            {[
              { name: 'Home', href: '/' },
              { name: 'Search On Map', href: '/search' },
              { name: 'Properties', href: '/listings' },
              { name: getDashboardLabel(), href: '/dashboard' },
            ].filter((item) => {
              // Hide all links while auth state is loading to prevent role-based glitch
              if (userLoading) return false;

              // Hide Dashboard link if not logged in
              if (item.href === '/dashboard' && !currentUser) return false;

              // Restricted roles (Admin, Owner, Agent) see NO links in the main navbar
              const isRestrictedRole = currentUser && ['ADMIN', 'OWNER', 'AGENT'].includes(currentUser.role);
              if (isRestrictedRole) {
                return false;
              }
              return true;
            }).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center h-full text-[13px] font-bold transition-colors hover:text-primary ${isActive(item.href) ? 'text-primary' : 'text-foreground/70'
                  } group`}
              >
                <span>{item.name}</span>
                <span className={`absolute bottom-[10px] left-0 h-[3px] bg-primary transition-all duration-300 ease-in-out ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {userLoading ? null : !(currentUser && ['ADMIN', 'OWNER', 'AGENT'].includes(currentUser.role)) && (
              <Link href="/listings" className="md:hidden">
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {userLoading ? (
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-lg hidden md:block" />
              </div>
            ) : currentUser ? (
              <div className="flex items-center space-x-3">
                {currentUser && ['OWNER', 'AGENT', 'CUSTOMER'].includes(currentUser.role) && (
                  <Link href="/chat">
                    <Button variant="ghost" className="relative h-10 w-fit px-3 text-muted-foreground hover:bg-primary/5 rounded-xl transition-all active:scale-95 group flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 group-hover:text-primary transition-colors" />
                      <span className="text-[13px] font-bold group-hover:text-primary hidden sm:block">Messages</span>
                    </Button>
                  </Link>
                )}
                <DropdownMenu onOpenChange={handleOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:bg-primary/5 rounded-full transition-all active:scale-95 group">
                      <Bell className="h-5 w-5 group-hover:text-primary transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 mt-2 rounded-xl shadow-lg border-border p-0 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-gray-50/50">
                      <span className="text-sm font-bold text-foreground">Notifications</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Unread Only</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {displayNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground font-medium">No new notifications</p>
                        </div>
                      ) : (
                        displayNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              if (notification.link) router.push(notification.link);
                            }}
                            className="p-3 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3 bg-primary/[0.02]"
                          >
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] leading-tight mb-0.5 font-bold text-foreground">
                                {notification.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 font-medium">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 self-start" />
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-border bg-gray-50/50">
                      <Button variant="ghost" size="sm" className="w-full text-[11px] font-bold text-muted-foreground" onClick={() => router.push('/dashboard')}>
                        See all in dashboard
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-fit gap-3 px-2 hover:bg-primary/5 rounded-xl transition-all active:scale-95 group">
                      <ChevronDown className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-sm ring-2 ring-white group-hover:border-primary/40 transition-colors">
                        <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                          {getUserInitials(currentUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-foreground leading-none">{currentUser.name}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-lg border-border p-1 animate-in fade-in zoom-in duration-200">


                    <DropdownMenuItem
                      className="cursor-pointer py-2.5 px-3 rounded-lg focus:bg-primary focus:text-white group flex items-center gap-3 transition-all duration-200"
                      onClick={() => router.push('/profile')}
                    >
                      <User className="h-4 w-4 text-muted-foreground group-focus:text-white transition-colors" />
                      <span className="text-sm font-semibold">My Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer py-2.5 px-3 rounded-lg focus:bg-primary focus:text-white group flex items-center gap-3 transition-all duration-200"
                      onClick={() => router.push('/dashboard/ai-insights')}
                    >
                      <Brain className="h-4 w-4 text-muted-foreground group-focus:text-white transition-colors" />
                      <span className="text-sm font-semibold">AI Insights</span>
                    </DropdownMenuItem>



                    <DropdownMenuSeparator className="my-1 mx-1" />

                    <DropdownMenuItem
                      className="cursor-pointer py-2 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/5 flex items-center gap-2 transition-colors"
                      onClick={async () => {
                        await logout();
                        router.push('/');
                      }}
                    >
                      <div className="w-4 flex justify-center">
                        <span className="text-lg">↩</span>
                      </div>
                      <span className="text-sm font-medium">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="rounded-lg font-bold border-border">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm text-white rounded-lg font-bold">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
