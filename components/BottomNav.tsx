'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Search, Home, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-safe z-10">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-around p-1 mb-2">
          <Link
            href="/feed"
            className={cn(
              'flex flex-col items-center justify-center py-3 px-6 rounded-xl transition-all',
              pathname === '/feed' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            )}
          >
            <Home className={cn(
              "h-5 w-5 mb-1",
              pathname === '/feed' ? 'text-primary-700' : 'text-gray-500'
            )} />
            <span className="text-xs font-medium">Feed</span>
          </Link>
          
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center justify-center py-3 px-6 rounded-xl transition-all',
              pathname === '/' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            )}
          >
            <Search className={cn(
              "h-5 w-5 mb-1",
              pathname === '/' ? 'text-primary-700' : 'text-gray-500'
            )} />
            <span className="text-xs font-medium">Search</span>
          </Link>
          
          <Link
            href="/library"
            className={cn(
              'flex flex-col items-center justify-center py-3 px-6 rounded-xl transition-all',
              pathname === '/library' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            )}
          >
            <BookOpenText className={cn(
              "h-5 w-5 mb-1",
              pathname === '/library' ? 'text-primary-700' : 'text-gray-500'
            )} />
            <span className="text-xs font-medium">Library</span>
          </Link>
          
          <Link
            href="/islands"
            className={cn(
              'flex flex-col items-center justify-center py-3 px-6 rounded-xl transition-all',
              pathname.startsWith('/islands')
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            )}
          >
            <Globe className={cn(
              "h-5 w-5 mb-1",
              pathname.startsWith('/islands') ? 'text-primary-700' : 'text-gray-500'
            )} />
            <span className="text-xs font-medium">Islands</span>
          </Link>
        </div>
      </div>
    </nav>
  );
} 