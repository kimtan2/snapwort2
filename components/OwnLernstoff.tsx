'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Word } from '@/lib/db';
import { Volume2, HelpCircle, X } from 'lucide-react';
import { speakText } from '@/lib/textToSpeech';

interface OwnLernstoffProps {
  language: 'en' | 'de';
}

export function OwnLernstoff({ language }: OwnLernstoffProps) {
  const [userSentence, setUserSentence] = useState('');
  const [currentWordId, setCurrentWordId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [suggestions, setSuggestions] = useState<{examples: string[], tips: string[]} | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{isCorrect: boolean, feedback: string, improvedSentence?: string} | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch library words for the current language
  const words = useLiveQuery<Word[]>(
    () => db.words
      .where('language')
      .equals(language)
      .toArray(),
    [language]
  );

  // Get the current word based on wordId
  const currentWord = useLiveQuery<Word | undefined>(
    () => currentWordId ? db.words.get(currentWordId) : undefined,
    [currentWordId]
  );

  // Select a random word from the library
  const selectRandomWord = useCallback(() => {
    if (!words || words.length === 0) return;
    
    // Reset states
    setUserSentence('');
    setFeedback(null);
    setShowHelp(false);
    setSuggestions(null);
    
    // Get a random word that's different from the current one
    let newWordId: number | undefined;
    
    if (words.length === 1) {
      newWordId = words[0].id;
    } else {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * words.length);
      } while (words[randomIndex].id === currentWordId && words.length > 1);
      
      newWordId = words[randomIndex].id;
    }
    
    if (newWordId) {
      console.log(`Selected new word with ID: ${newWordId}`);
      setCurrentWordId(newWordId);
    }
  }, [words, currentWordId]);

  // Load a random word when language changes or when no word is selected
  useEffect(() => {
    if (words && words.length > 0 && !currentWordId) {
      selectRandomWord();
    }
  }, [words, language, currentWordId, selectRandomWord]);

  // Load usage suggestions for the current word
  const loadSuggestions = useCallback(async () => {
    if (!currentWord) return;
    
    setIsSuggestionsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/word-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: currentWord.word,
          language: currentWord.language
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }
      
      setSuggestions({
        examples: data.examples || [],
        tips: data.tips || []
      });
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load suggestions');
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [currentWord]);

  // Toggle help panel and load suggestions if needed
  const toggleHelp = useCallback(() => {
    if (!showHelp && !suggestions && !isSuggestionsLoading) {
      loadSuggestions();
    }
    setShowHelp(!showHelp);
  }, [showHelp, suggestions, isSuggestionsLoading, loadSuggestions]);

  // Handle checking the sentence
  const handleCheck = useCallback(async () => {
    if (!currentWord || !userSentence.trim()) return;
    
    setIsChecking(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentence: userSentence,
          word: currentWord.word,
          language: currentWord.language
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check sentence');
      }
      
      setFeedback(data);
      
      // Record a point for practicing
      await db.points.add({
        points: data.isCorrect ? 5 : 1, // More points for correct sentences
        timestamp: Date.now(),
        taskId: `practice_${currentWord.id || 'unknown'}_${Date.now()}`,
        taskType: 'word_practice'
      });
      
      // Dispatch custom event for the feed page to update counts
      window.dispatchEvent(new CustomEvent('pointsAdded', { 
        detail: { points: data.isCorrect ? 5 : 1 }
      }));
    } catch (error) {
      console.error('Error checking sentence:', error);
      setError(error instanceof Error ? error.message : 'Failed to check your sentence');
    } finally {
      setIsChecking(false);
    }
  }, [currentWord, userSentence]);

  // Handle trying another word
  const handleNextWord = useCallback(() => {
    selectRandomWord();
  }, [selectRandomWord]);

  return (
    <div className="space-y-4" ref={containerRef}>
      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-lg mb-4 shadow-md">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {!words || words.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">No words in your library</h2>
          <p className="text-gray-600 mb-6">
            You need to add words to your library first. Go to the search page and add some words!
          </p>
        </div>
      ) : !currentWord ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-4 flex justify-center items-center min-h-[200px]">
          <div className="animate-pulse text-gray-400">Loading words...</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Practice Vocabulary</h2>
            <div className="flex items-center space-x-3">
              <button 
                onClick={toggleHelp}
                className={`p-2 rounded-full ${showHelp ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Get help with this word"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => speakText(currentWord.word, currentWord.language)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Listen to pronunciation"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <h3 className="text-xl font-bold text-primary-600">{currentWord.word}</h3>
              </div>
              <p className="text-gray-700 font-medium">
                Create a sentence using the word <span className="font-bold">{currentWord.word}</span>.
              </p>
            </div>
            
            {showHelp && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6 relative">
                <button 
                  onClick={() => setShowHelp(false)} 
                  className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h4 className="font-bold text-blue-800 mb-3">Usage Help</h4>
                
                {isSuggestionsLoading ? (
                  <div className="animate-pulse text-blue-500">Loading suggestions...</div>
                ) : suggestions ? (
                  <div className="space-y-4">
                    {suggestions.tips.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-blue-700 mb-2">Tips:</h5>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          {suggestions.tips.map((tip, i) => (
                            <li key={i} className="text-sm">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {suggestions.examples.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-blue-700 mb-2">Examples:</h5>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          {suggestions.examples.map((example, i) => (
                            <li key={i} className="text-sm">{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    
                  </div>
                ) : (
                  <p className="text-blue-700">No suggestions available. Try creating your own sentence!</p>
                )}
              </div>
            )}
            
            <textarea
              value={userSentence}
              onChange={(e) => setUserSentence(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-lg focus:border-primary-600 focus:ring-1 focus:ring-primary-600 min-h-[120px] text-lg"
              placeholder={`Write a sentence using the word "${currentWord.word}"...`}
              disabled={isChecking}
            />
            
            {feedback && (
              <div className={`mt-6 p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                <p className="font-medium text-lg mb-2">Feedback</p>
                <p className="mb-4">{feedback.feedback}</p>
                
                {feedback.improvedSentence && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-medium mb-2">Improved version:</p>
                    <p className="italic">{feedback.improvedSentence}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleCheck}
                disabled={isChecking || !userSentence.trim()}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? 'Checking...' : 'Check Sentence'}
              </button>
              
              <button
                onClick={handleNextWord}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Try Another Word
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 