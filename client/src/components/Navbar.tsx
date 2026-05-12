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
  Brain,
  Menu
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from './common/Logo';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, logout, isLoading: userLoading } = useUserStore();
  // Only show loading skeleton on the very first load (no user data yet)
  const showLoadingSkeleton = userLoading && !currentUser;
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, connectSocket, disconnectSocket } = useNotificationStore();
  const [displayNotifications, setDisplayNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
    if (!currentUser || !currentUser.role) return t('nav.dashboard');
    const role = currentUser.role.toLowerCase();
    if (role === 'customer') return t('nav.customerDashboard');
    if (role === 'owner') return t('nav.ownerDashboard');
    if (role === 'agent') return t('nav.agentDashboard');
    if (role === 'admin') return t('nav.adminDashboard');
    return t('nav.dashboard');
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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              {showLoadingSkeleton ? (
                <Skeleton className="h-10 w-28 rounded-lg" />
              ) : (
                <Logo className="h-10 w-auto" priority />
              )}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-12 h-full">
            {[
              { name: t('nav.home'), href: '/' },
              { name: t('nav.searchOnMap'), href: '/search' },
              { name: t('nav.properties'), href: '/listings' },
              { name: getDashboardLabel(), href: currentUser && currentUser.role ? `/dashboard/${currentUser.role.toLowerCase()}` : '/dashboard' },
            ].filter((item) => {
              // Hide all links while auth state is loading to prevent role-based glitch
              if (showLoadingSkeleton) return false;

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
            <div className="hidden md:block">
              {showLoadingSkeleton ? (
                <Skeleton className="h-9 w-24 rounded-full" />
              ) : (
                <LanguageSwitcher compact />
              )}
            </div>


            {showLoadingSkeleton ? (
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-lg hidden md:block" />
              </div>
            ) : currentUser ? (
              <div className="flex items-center space-x-3">
                {currentUser && ['OWNER', 'AGENT', 'CUSTOMER'].includes(currentUser.role) && (
                  <Link href="/chat">
                    <Button variant="ghost" className="relative h-9 sm:h-10 w-fit px-2 sm:px-3 text-muted-foreground hover:bg-primary/5 rounded-lg transition-all active:scale-95 group flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 group-hover:text-primary transition-colors" />
                      <span className="text-[13px] font-bold group-hover:text-primary hidden sm:block">{t('nav.messages')}</span>
                    </Button>
                  </Link>
                )}
                <DropdownMenu onOpenChange={handleOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:bg-primary/5 rounded-full transition-all active:scale-95 group">
                      <Bell className="h-5 w-5 group-hover:text-primary transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 mt-2 rounded-xl shadow-lg border-border p-0 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b border-border flex justify-between items-center bg-gray-50/50">
                      <span className="text-sm font-bold text-foreground">{t('nav.notifications')}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('nav.unreadOnly')}</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {displayNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground font-medium">{t('nav.noNotifications')}</p>
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
                      <Button variant="ghost" size="sm" className="w-full text-[11px] font-bold text-muted-foreground" onClick={() => router.push(currentUser && currentUser.role ? `/dashboard/${currentUser.role.toLowerCase()}` : '/dashboard')}>
                        {t('nav.seeAllInDashboard')}
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-fit gap-3 px-2 hover:bg-primary/5 rounded-lg transition-all active:scale-95 group">
                      <ChevronDown className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-sm ring-2 ring-white group-hover:border-primary/40 transition-colors">
                        <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                          {getUserInitials(currentUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start">
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
                      <span className="text-sm font-semibold">{t('nav.myProfile')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer py-2.5 px-3 rounded-lg focus:bg-primary focus:text-white group flex items-center gap-3 transition-all duration-200"
                      onClick={() => router.push('/dashboard/ai-insights')}
                    >
                      <Brain className="h-4 w-4 text-muted-foreground group-focus:text-white transition-colors" />
                      <span className="text-sm font-semibold">{t('nav.aiInsights')}</span>
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
                      <span className="text-sm font-medium">{t('nav.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="outline" className="text-[13px] font-bold text-foreground hover:bg-[#14b8a6] hover:text-white px-6 rounded-lg transition-all active:scale-95 border-gray-200 hover:border-[#14b8a6]">
                    {t('nav.signIn')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-[#005a41] hover:bg-[#004a35] text-white text-[13px] font-bold px-6 rounded-lg transition-all active:scale-95">
                    {t('nav.signUp')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] border-r-border">
                  <SheetHeader className="text-left pb-6 border-b border-border flex flex-row items-center justify-between">
                    <SheetTitle>
                      <Logo className="h-8 w-auto" />
                    </SheetTitle>
                    <div className="pr-8">
                      <LanguageSwitcher compact />
                    </div>
                  </SheetHeader>
                  <div className="flex flex-col py-6 pl-4 space-y-4">
                    {[
                      { name: t('nav.home'), href: '/', icon: <User className="h-4 w-4" /> },
                      { name: t('nav.searchOnMap'), href: '/search', icon: <Search className="h-4 w-4" /> },
                      { name: t('nav.properties'), href: '/listings', icon: <FileText className="h-4 w-4" /> },
                      { name: getDashboardLabel(), href: currentUser && currentUser.role ? `/dashboard/${currentUser.role.toLowerCase()}` : '/dashboard', icon: <Wrench className="h-4 w-4" /> },
                    ].filter((item) => {
                      if (showLoadingSkeleton) return false;
                      if (item.href === '/dashboard' && !currentUser) return false;
                      const isRestrictedRole = currentUser && currentUser.role && ['ADMIN', 'OWNER', 'AGENT'].includes(currentUser.role);
                      if (isRestrictedRole && currentUser && currentUser.role && item.href !== '/dashboard' && item.href !== `/dashboard/${currentUser.role.toLowerCase()}`) {
                        return false;
                      }
                      return true;
                    }).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`text-lg font-bold py-2 flex items-center gap-3 transition-colors ${
                          isActive(item.href) ? 'text-primary' : 'text-foreground/70'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    
                    {currentUser && (
                      <>
                        <div className="pt-4 border-t border-border mt-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">{t('nav.account')}</p>
                          <div className="flex flex-col gap-2">
                            <Link 
                              href="/profile" 
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 py-2 text-lg font-bold text-foreground/70 hover:text-primary transition-colors"
                            >
                              <User className="h-5 w-5" />
                              {t('nav.myProfile')}
                            </Link>
                            <Link 
                              href="/dashboard/ai-insights" 
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 py-2 text-lg font-bold text-foreground/70 hover:text-primary transition-colors"
                            >
                              <Brain className="h-5 w-5" />
                              {t('nav.aiInsights')}
                            </Link>
                            <Button 
                              variant="ghost" 
                              className="justify-start px-0 text-lg font-bold text-rose-600 hover:text-rose-700 hover:bg-transparent h-auto py-2"
                              onClick={async () => {
                                setIsOpen(false);
                                await logout();
                                router.push('/');
                              }}
                            >
                              <span className="mr-3">↩</span>
                              {t('nav.logout')}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {!currentUser && (
                      <div className="pt-6 flex flex-col gap-3">
                         <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                          <Button variant="outline" className="w-full justify-center font-bold border-gray-200 rounded-xl py-6 hover:bg-[#14b8a6] hover:text-white hover:border-[#14b8a6]">{t('nav.signIn')}</Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsOpen(false)} className="w-full">
                          <Button className="w-full justify-center font-bold bg-[#005a41] hover:bg-[#004a35] text-white rounded-xl py-6">{t('nav.signUp')}</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
