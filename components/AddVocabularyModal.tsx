'use client';

import { useState } from 'react';
import { X, BookOpen, CheckCircle2, HelpCircle, Volume2 } from 'lucide-react';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';

type QueryType = 'definition' | 'check' | 'ask';

interface AddVocabularyModalProps {
  language: 'en' | 'de';
  onClose: () => void;
}

export function AddVocabularyModal({ language, onClose }: AddVocabularyModalProps) {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('definition');
  const [speaking, setSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!word.trim() || !meaning.trim()) {
      setError('Both word and meaning are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Add to database
      const id = await db.words.add({
        word: word.trim(),
        meaning: meaning.trim(),
        language,
        queryType,
        speaking,
        createdAt: new Date(),
        followUpHistory: []
      });
      
      // Trigger points event
      await db.addPoints({
        points: 5,
        timestamp: Date.now(),
        taskId: `manual-add-${id}`,
        taskType: 'vocabulary-add'
      });
      
      // Close modal after successful addition
      onClose();
    } catch (err) {
      setError('Failed to add vocabulary. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Add New {language === 'en' ? 'English' : 'German'} Vocabulary
          </h2>
          <p className="text-gray-600 mb-6">
            Add a word and its meaning to your personal library
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-1">
                  Word
                </label>
                <input
                  type="text"
                  id="word"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'en' ? 'Enter English word' : 'Enter German word'}
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label htmlFor="meaning" className="block text-sm font-medium text-gray-700 mb-1">
                  Meaning
                </label>
                <textarea
                  id="meaning"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                  placeholder="Enter the meaning/definition"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Type
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setQueryType('definition')}
                    className={cn(
                      "flex items-center justify-center px-3 py-2 rounded-md flex-1 border text-sm",
                      queryType === 'definition' 
                        ? "bg-blue-50 border-blue-200 text-blue-700" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    Definition
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueryType('check')}
                    className={cn(
                      "flex items-center justify-center px-3 py-2 rounded-md flex-1 border text-sm",
                      queryType === 'check' 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Check
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueryType('ask')}
                    className={cn(
                      "flex items-center justify-center px-3 py-2 rounded-md flex-1 border text-sm",
                      queryType === 'ask' 
                        ? "bg-purple-50 border-purple-200 text-purple-700" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <HelpCircle className="h-4 w-4 mr-1.5" />
                    Question
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="speaking"
                  checked={speaking}
                  onChange={(e) => setSpeaking(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="speaking" className="ml-2 flex items-center text-sm text-gray-700">
                  <Volume2 className="w-4 h-4 mr-1.5 text-green-500" />
                  Mark as speaking practice
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add to Library'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 