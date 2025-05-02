'use client';

import EnhancedWordSearch from '@/components/EnhancedWordSearch';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center px-4">
      <EnhancedWordSearch />
    </div>
  );
}