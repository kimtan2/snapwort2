'use client';

import { useState } from 'react';
import { db } from '@/lib/db';

interface Task {
  id: string;
  type: 'free_response';
  question: string;
  answer: string;
  alternativeWords?: string[];
  example?: string;
  feedback?: string;
  points: number;
}

interface FeedCardProps {
  task: Task;
  onComplete: (isCorrect: boolean) => void;
}

export function FeedCard({ task, onComplete }: FeedCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleCheck = async () => {
    console.log('Check button clicked');
    console.log('Current user answer:', userAnswer);
    
    setIsChecking(true);
    setError(null);
    
    try {
      console.log('Sending request to check answer...');
      const response = await fetch('/api/check-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          taskType: task.type,
          answer: userAnswer,
          correctAnswer: task.answer,
          question: task.question
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to check answer');
      }
      
      console.log('Answer check result:', result);
      setFeedback(result.feedback);
      setIsCorrect(result.isCorrect);
      
    } catch (error) {
      console.error('Error checking answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to evaluate your answer. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleLearn = async () => {
    // Save 1 point to Dexie
    try {
      await db.points.add({
        points: 1, // Always 1 point when using the learn button
        timestamp: Date.now(),
        taskId: task.id,
        taskType: task.type
      });
      
      // Move to the next card
      onComplete(true);
    } catch (error) {
      console.error('Error saving points:', error);
      setError('Failed to save your progress. Please try again.');
    }
  };
  
  const handleRetry = () => {
    setError(null);
    setIsChecking(false);
    setFeedback(null);
    setIsCorrect(null);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-4 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Practice Vocabulary</h2>
        <div className="flex items-center">
          <span className="text-sm font-medium text-primary-600 mr-2">{task.points} pts</span>
          <button 
            onClick={() => onComplete(false)} 
            className="text-gray-400 hover:text-gray-600 text-sm"
            title="Skip this question"
          >
            Skip
          </button>
        </div>
      </div>
      
      <div className="space-y-4 flex-grow">
        <p className="text-gray-700 font-medium text-lg mb-6">{task.question}</p>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full p-4 border border-gray-200 rounded-lg focus:border-primary-600 focus:ring-1 focus:ring-primary-600 min-h-[120px] text-lg"
          placeholder="Write your answer here..."
          disabled={isChecking}
        />
        
        {/* Dropdown details section */}
        {(task.alternativeWords || task.example) && (
          <div className="mt-4">
            <button
              onClick={toggleDetails}
              className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center"
            >
              <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              <svg
                className={`ml-2 h-5 w-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDetails && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <div className="mb-3">
                  <span className="font-medium text-gray-700">Meant Word:</span>
                  <p className="mt-1">{task.answer}</p>
                </div>
                
                {task.alternativeWords && task.alternativeWords.length > 0 && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Alternative Words:</span>
                    <p className="mt-1">{task.alternativeWords.join(', ')}</p>
                  </div>
                )}
                
                {task.example && (
                  <div>
                    <span className="font-medium text-gray-700">Example:</span>
                    <p className="mt-1 italic">{task.example}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-8 p-4 rounded-lg bg-red-50 text-red-800">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
        
        {feedback && !error && (
          <div className={`mt-8 p-4 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
            <p className="font-medium text-lg">Feedback</p>
            <p className="mt-2 text-base">{feedback}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-700 mb-2">Correct answer:</p>
              <p className="italic">{task.answer}</p>
            </div>
            
            <button
              onClick={handleRetry}
              className="w-full mt-6 py-3 rounded-lg font-medium text-lg bg-gray-600 text-white hover:bg-gray-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      {!feedback && !error && !isChecking && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={handleLearn}
            className="py-3 rounded-lg font-medium text-lg bg-green-600 text-white hover:bg-green-700 flex items-center justify-center"
            title="I know this word"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            I Know This
          </button>
          
          <button
            onClick={handleCheck}
            disabled={!userAnswer || userAnswer.trim().length < 3}
            className={`py-3 rounded-lg font-medium text-lg flex items-center justify-center ${
              !userAnswer || userAnswer.trim().length < 3
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Check Answer
          </button>
        </div>
      )}
      
      {isChecking && (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          <p className="ml-3 text-gray-600">Checking answer...</p>
        </div>
      )}
    </div>
  );
} 