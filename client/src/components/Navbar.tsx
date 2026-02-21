"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import {
  Building2,
  Home,
  Search,
  User,
  MessageSquare,
  ChevronDown,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useUserStore();

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


  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-primary">HomeCar</span>
          </Link>

          <div className="hidden md:flex items-center space-x-12 h-full">
            {[
              { name: 'Home', href: '/' },
              { name: 'Search On Map', href: '/search' },
              { name: 'Properties', href: '/listings' },
              { name: getDashboardLabel(), href: '/dashboard' },
              { name: 'Messages', href: '/chat' },
            ].map((item) => (
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
            <Link href="/listings" className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:bg-primary/5 rounded-full transition-all active:scale-95 group">
                  <Bell className="h-5 w-5 group-hover:text-primary transition-colors" />
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                </Button>

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



                    <DropdownMenuSeparator className="my-1 mx-1" />

                    <DropdownMenuItem
                      className="cursor-pointer py-2 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/5 flex items-center gap-2 transition-colors"
                      onClick={() => {
                        logout();
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
