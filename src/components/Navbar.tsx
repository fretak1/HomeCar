"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User, MessageSquare, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';


export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-primary">HomeCar</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/search"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-medium border border-transparent ${isActive('/search')
                ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                : 'text-foreground hover:bg-muted hover:border-border'
                }`}
            >
              <Search className="h-5 w-5" />
              <span>Search On Map</span>
            </Link>
            <Link
              href="/listings"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/listings') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
            >
              <Building2 className="h-5 w-5" />
              <span>Properties</span>
            </Link>
            <Link
              href="#"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
            >
              <User className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/chat"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive('/chat') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/listings" className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm text-white">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
