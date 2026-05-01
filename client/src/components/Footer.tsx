import { Facebook, Instagram, Send, Linkedin } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './common/Logo';

export function Footer() {
  return (
    <footer className="bg-white border-t border-border ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center mb-4 transition-transform hover:scale-105 active:scale-92 origin-left">
              <Logo className="h-12 w-auto" />
            </Link>
            <p className="text-muted-foreground mb-4">
              AI-powered platform for finding your perfect property or vehicle with confidence and ease.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors">
                <Facebook className="h-5 w-5 text-primary" />
              </a>
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors">
                <Send className="h-5 w-5 text-primary" />
              </a>
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors">
                <Instagram className="h-5 w-5 text-primary" />
              </a>
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors">
                <Linkedin className="h-5 w-5 text-primary" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-foreground">For Customers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/listings" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Homes
                </Link>
              </li>
              <li>
                <Link href="/listings" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Cars
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Desk
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-foreground">For Owners</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  List Your Home
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  List Your Car
                </a>
              </li>

            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-foreground">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
                                                                  
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2026 HomeCar. All rights reserved. </p>
        </div>
      </div>
    </footer>
  );
}
