'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import EnhancedWordSearch from '@/components/EnhancedWordSearch';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Handle URL parameters for saving words from extension
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      
      if (action === 'saveWord') {
        const word = params.get('word');
        const meaning = params.get('meaning');
        const language = params.get('language') || 'de';
        const queryType = params.get('queryType') || 'definition';
        const speaking = params.get('speaking') === 'true';
        
        if (word && meaning) {
          // Save word to IndexedDB
          db.words.add({
            word,
            meaning,
            language: language as 'en' | 'de',
            queryType: queryType as 'definition' | 'check' | 'ask',
            speaking,
            createdAt: new Date()
          }).then(() => {
            // Redirect to library page
            router.push('/library');
            
            // Remove URL parameters
            window.history.replaceState({}, document.title, '/library');
          }).catch(error => {
            console.error('Error saving word:', error);
          });
        } else {
          // If missing required params, just redirect to library
          router.push('/library');
        }
      }
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center px-4">
      <EnhancedWordSearch />
    </div>
  );
}