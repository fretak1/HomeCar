"use client";

import { useState } from 'react';
import { Facebook, Instagram, Send, Linkedin } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './common/Logo';
import { useTranslation } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setSubmitting(true);
    try {
      await api.post('/api/feedback', { email, message });
      toast.success(t('footer.feedbackSuccess'));
      setEmail('');
      setMessage('');
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error?.response?.data?.error || t('footer.feedbackError');
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:justify-between gap-8 items-start">
          {/* Column 1: Brand details */}
          <div className="space-y-4 w-full md:max-w-[300px]">
            <Link href="/" className="flex items-center transition-transform hover:scale-105 active:scale-95 origin-left">
              <Logo className="h-12 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-all hover:scale-105 active:scale-95">
                <Facebook className="h-5 w-5 text-primary" />
              </a>
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-all hover:scale-105 active:scale-95">
                <Send className="h-5 w-5 text-primary" />
              </a>
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-all hover:scale-105 active:scale-95">
                <Instagram className="h-5 w-5 text-primary" />
              </a>
              <a href="#" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-all hover:scale-105 active:scale-95">
                <Linkedin className="h-5 w-5 text-primary" />
              </a>
            </div>
          </div>

          {/* Column 2: Feedback Form */}
          <div className="space-y-4 w-full md:max-w-md">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              {t('footer.feedbackTitle')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.feedbackEmailPlaceholder')}
                  required
                  className="w-full px-3.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background/50 hover:border-muted-foreground/30 transition-colors"
                />
              </div>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('footer.feedbackMessagePlaceholder')}
                  required
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background/50 hover:border-muted-foreground/30 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:bg-primary/95 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {submitting ? t('footer.feedbackSubmitting') : t('footer.feedbackSubmit')}
              </button>
            </form>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-4 w-full md:w-auto">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/listings" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.browseHomes')}
                </Link>
              </li>
              <li>
                <Link href="/listings" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.browseCars')}
                </Link>
              </li>       
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; 2026 HomeCar. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
