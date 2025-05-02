'use client';

import { useState } from 'react';
import { db, type Word, type FollowUp } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Book, Trash2, Search, ChevronDown, ChevronUp, Volume2, MessageCircle, Plus, Save, Edit2, X, Filter, BookOpen, CheckCircle2, HelpCircle, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { speakText } from '@/lib/textToSpeech';
import { AddVocabularyModal } from '@/components/AddVocabularyModal';
import { useLanguage } from '@/lib/LanguageContext';

type SortOption = 'newest' | 'oldest' | 'alphabetical';
type FilterOption = 'all' | 'definition' | 'check' | 'ask';

// Helper type for grouped words
type DateGroup = {
  date: string;
  formattedDate: string;
  words: Word[];
};

export function Library() {
  const { language } = useLanguage();
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());
  const [expandedChats, setExpandedChats] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [editedWordText, setEditedWordText] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  // Format date to display
  const formatDate = (date: Date, short = false) => {
    const now = new Date();
    const wordDate = new Date(date);
    
    // Same day
    if (wordDate.toDateString() === now.toDateString()) {
      return short ? "Today" : `Today, ${wordDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (wordDate.toDateString() === yesterday.toDateString()) {
      return short ? "Yesterday" : `Yesterday, ${wordDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Within the last week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (wordDate > oneWeekAgo) {
      const weekday = wordDate.toLocaleDateString([], { weekday: 'long' });
      return short ? weekday : `${weekday}, ${wordDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Older than a week
    return wordDate.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Function to group words by date
  const groupWordsByDate = (words: Word[], alphabetical: boolean): DateGroup[] => {
    if (alphabetical) {
      // For alphabetical sorting, create a single group
      return [{
        date: 'alphabetical',
        formattedDate: 'Alphabetical Order',
        words: words
      }];
    }

    const groups: { [key: string]: Word[] } = {};
    
    words.forEach(word => {
      const date = new Date(word.createdAt);
      const dateString = date.toDateString(); // Use date string as key
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      
      groups[dateString].push(word);
    });
    
    // Convert groups object to array and sort by date
    return Object.entries(groups).map(([dateString, words]) => {
      const date = new Date(dateString);
      return {
        date: dateString,
        formattedDate: formatDate(date, true),
        words
      };
    }).sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
  };
  
  const words = useLiveQuery<Word[]>(
    () => {
      let query = db.words.where('language').equals(language);
      
      // Apply filter if not 'all'
      if (filterOption !== 'all') {
        query = query.filter(word => word.queryType === filterOption || 
          // Handle words saved before queryType was added
          (filterOption === 'definition' && word.queryType === undefined));
      }
      
      return query.toArray();
    },
    [language, filterOption]
  );

  // Sort words based on sortOption
  const sortedWords = words ? [...words].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOption === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortOption === 'alphabetical') {
      return a.word.localeCompare(b.word);
    }
    return 0;
  }) : [];

  // Group words by date
  const groupedByDate = sortedWords ? groupWordsByDate(sortedWords, sortOption === 'alphabetical') : [];

  const handleDelete = async (id?: number) => {
    if (id) {
      await db.words.delete(id);
    }
  };

  const toggleWord = (id: number) => {
    if (editingWordId !== null) return; // Don't toggle if in edit mode
    
    setExpandedWords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleChat = (id: number) => {
    setExpandedChats(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startEditing = (word: Word) => {
    if (!word.id) return;
    setEditingWordId(word.id);
    setEditedWordText(word.word);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editedWordText.trim()) return;
    
    try {
      await db.words.update(id, {
        word: editedWordText.trim()
      });
      setEditingWordId(null);
      setEditedWordText('');
    } catch (error) {
      console.error('Error updating word:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingWordId(null);
    setEditedWordText('');
  };

  // Get the appropriate icon based on queryType
  const getQueryTypeIcon = (queryType?: string) => {
    switch(queryType) {
      case 'check':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ask':
        return <HelpCircle className="h-4 w-4 text-purple-500" />;
      case 'definition':
      default:
        return <BookOpen className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get class name based on query type
  const getQueryTypeClass = (queryType?: string) => {
    switch(queryType) {
      case 'check':
        return 'border-l-4 border-l-green-400';
      case 'ask':
        return 'border-l-4 border-l-purple-400';
      case 'definition':
      default:
        return 'border-l-4 border-l-blue-400';
    }
  };

  // Toggle filter menu
  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Library</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Word
        </button>
      </div>

      {/* Filtering and sorting controls */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="relative">
          <button
            onClick={toggleFilterMenu}
            className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2 text-gray-500 z-50" />
            <span className="text-sm font-medium">Filter</span>
          </button>
          
          {isFilterMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
              <div className="p-2">
                <button
                  onClick={() => { setFilterOption('all'); setIsFilterMenuOpen(false); }}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm rounded-md",
                    filterOption === 'all' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                  )}
                >
                  <Book className="w-4 h-4 mr-2" />
                  All Types
                </button>
                <button
                  onClick={() => { setFilterOption('definition'); setIsFilterMenuOpen(false); }}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm rounded-md",
                    filterOption === 'definition' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                  )}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Definitions
                </button>
                <button
                  onClick={() => { setFilterOption('check'); setIsFilterMenuOpen(false); }}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm rounded-md",
                    filterOption === 'check' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Checks
                </button>
                <button
                  onClick={() => { setFilterOption('ask'); setIsFilterMenuOpen(false); }}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm rounded-md",
                    filterOption === 'ask' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                  )}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Questions
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setSortOption('newest')}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium border-r border-gray-200",
              sortOption === 'newest' ? "bg-blue-50 text-blue-600" : "bg-white hover:bg-gray-50"
            )}
          >
            <Clock className="w-4 h-4 mr-1" /> Newest
          </button>
          <button
            onClick={() => setSortOption('oldest')}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium border-r border-gray-200",
              sortOption === 'oldest' ? "bg-blue-50 text-blue-600" : "bg-white hover:bg-gray-50"
            )}
          >
            <Calendar className="w-4 h-4 mr-1" /> Oldest
          </button>
          <button
            onClick={() => setSortOption('alphabetical')}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium",
              sortOption === 'alphabetical' ? "bg-blue-50 text-blue-600" : "bg-white hover:bg-gray-50"
            )}
          >
            <span className="font-mono mr-1">A→Z</span>
          </button>
        </div>
      </div>

      {!sortedWords || sortedWords.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="bg-gray-50 inline-flex rounded-full p-3 mb-4">
            <Book className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-medium text-lg mb-2">No words saved yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Search for words to add them to your library and they will appear here
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Search className="h-4 w-4 mr-2" />
            Search for words
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-4">
              <div className="sticky top-0 z-20 bg-white py-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <h2 className="text-sm font-medium text-gray-600">{group.formattedDate}</h2>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-gray-200 to-gray-50 mt-2"></div>
              </div>

              {group.words.map((word) => (
                <div 
                  key={word.id} 
                  className={cn(
                    "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200",
                    getQueryTypeClass(word.queryType)
                  )}
                >
                  <div 
                    className={cn(
                      "px-4 py-3 cursor-pointer",
                      expandedWords.has(word.id!) ? "border-b border-gray-100" : ""
                    )}
                    onClick={() => toggleWord(word.id!)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-grow">
                        {editingWordId === word.id ? (
                          <input
                            type="text"
                            value={editedWordText}
                            onChange={(e) => setEditedWordText(e.target.value)}
                            className="text-lg font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()} // Prevent card toggle
                          />
                        ) : (
                          <div className="flex items-center space-x-2 flex-grow">
                            <span className="mr-1">{getQueryTypeIcon(word.queryType)}</span>
                            <h3 className="text-lg font-medium text-gray-900">{word.word}</h3>
                            <button
                              onClick={(e) => { e.stopPropagation(); speakText(word.word, word.language); }}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                              title="Listen to pronunciation"
                            >
                              <Volume2 className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 flex items-center">
                          {formatDate(word.createdAt).includes("Today") || formatDate(word.createdAt).includes("Yesterday") ? (
                            formatDate(word.createdAt).split(', ')[1] // Only show time for today/yesterday
                          ) : (
                            formatDate(word.createdAt).includes(',') ? (
                              formatDate(word.createdAt).split(', ')[1] // Only show time for weekdays
                            ) : (
                              '' // Don't show time for older dates
                            )
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-2">
                        {editingWordId === word.id ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSaveEdit(word.id!); }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditing(word); }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(word.id); }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button 
                              className="transition-transform duration-200 ml-1"
                              onClick={(e) => { e.stopPropagation(); toggleWord(word.id!); }}
                            >
                              {expandedWords.has(word.id!) ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedWords.has(word.id!) && (
                    <div className="p-4 bg-gray-50">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{word.meaning}</ReactMarkdown>
                      </div>
                      
                      {word.followUpHistory && word.followUpHistory.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => toggleChat(word.id!)}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {expandedChats.has(word.id!) ? 'Hide conversation' : 'Show conversation'}
                            {expandedChats.has(word.id!) ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </button>
                          
                          {expandedChats.has(word.id!) && (
                            <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                              {word.followUpHistory.map((chat, index) => (
                                <div key={index} className="space-y-2">
                                  <p className="text-sm font-medium text-gray-900">{chat.question}</p>
                                  <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>{chat.answer}</ReactMarkdown>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddVocabularyModal 
          language={language} 
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </div>
  );
} 