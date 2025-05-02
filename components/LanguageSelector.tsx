'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">{language === 'en' ? '🇬🇧' : '🇩🇪'}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <button
            onClick={() => {
              setLanguage('en');
              setIsOpen(false);
            }}
            className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-50 ${
              language === 'en' ? 'bg-gray-50' : ''
            }`}
          >
            <span className="mr-2">🇬🇧</span>
            English
          </button>
          <button
            onClick={() => {
              setLanguage('de');
              setIsOpen(false);
            }}
            className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-50 ${
              language === 'de' ? 'bg-gray-50' : ''
            }`}
          >
            <span className="mr-2">🇩🇪</span>
            German
          </button>
        </div>
      )}
    </div>
  );
} 