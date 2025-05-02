'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/db';
import { Lernstoff } from '@/components/Lernstoff';
import { OwnLernstoff } from '@/components/OwnLernstoff';

export default function FeedPage() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'de'>('en');
  const [feedMode, setFeedMode] = useState<'own' | 'all'>('own');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial points and card count
    const loadData = async () => {
      const points = await db.points.toArray();
      const total = points.reduce((sum, record) => sum + record.points, 0);
      setTotalPoints(total || 0);
      
      // Count unique task IDs from points records
      const uniqueTaskIds = new Set(points.map(p => p.taskId));
      setTotalCards(uniqueTaskIds.size);
    };
    loadData();

    // Listen for points updates
    const handlePointsAdded = (event: CustomEvent) => {
      const addedPoints = event.detail.points || 0;
      setTotalPoints(prev => prev + addedPoints);
      
      // Increment card count
      setTotalCards(prev => prev + 1);
    };

    window.addEventListener('pointsAdded', handlePointsAdded as EventListener);
    return () => {
      window.removeEventListener('pointsAdded', handlePointsAdded as EventListener);
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 relative">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Feed</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Cards:</span>
                <span className="font-bold">{totalCards}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Points:</span>
                <span className="font-bold">{totalPoints}</span>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedLanguage === 'en' ? '🇬🇧' : '🇩🇪'}
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 py-2 w-36 bg-white rounded-md shadow-lg z-20">
                    <button 
                      onClick={() => {
                        setSelectedLanguage('en');
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${selectedLanguage === 'en' ? 'bg-gray-100' : ''}`}
                    >
                      <span className="mr-2">🇬🇧</span>
                      English
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedLanguage('de');
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${selectedLanguage === 'de' ? 'bg-gray-100' : ''}`}
                    >
                      <span className="mr-2">🇩🇪</span>
                      German
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-gray-200">
              <button
                type="button"
                onClick={() => setFeedMode('own')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  feedMode === 'own'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Own
              </button>
              <button
                type="button"
                onClick={() => setFeedMode('all')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  feedMode === 'all'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto px-4 py-4">
          {feedMode === 'all' && <Lernstoff language={selectedLanguage} />}
          {feedMode === 'own' && <OwnLernstoff language={selectedLanguage} />}
        </div>
      </div>
    </div>
  );
} 