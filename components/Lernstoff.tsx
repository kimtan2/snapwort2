'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedCard } from './FeedCard';

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

interface LernstoffProps {
  language: 'en' | 'de';
}

export function Lernstoff({ language }: LernstoffProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const lastTaskRef = useRef<HTMLDivElement>(null);
  // Keep track of task ids to prevent duplicates
  const processedTaskIds = useRef<Set<string>>(new Set());
  // Ref to hold the container div
  const containerRef = useRef<HTMLDivElement>(null);
  // Prevent multiple simultaneous API calls
  const isGeneratingRef = useRef(false);
  // Track when card was just created
  const [isNewCard, setIsNewCard] = useState(false);
  
  // Clear tasks when language changes
  useEffect(() => {
    console.log(`Language changed to: ${language}`);
    setTasks([]);
    setIsFirstLoad(true);
    setError(null);
    processedTaskIds.current.clear();
    generateTasks(1); // Load only 1 card initially
  }, [language]);

  // Load cards - only shows one at a time
  const generateTasks = useCallback(async (forceTaskCount?: number) => {
    // Prevent multiple simultaneous calls
    if (isLoading || isGeneratingRef.current) {
      console.log('Skipping task generation - already loading or generating');
      return;
    }
    
    console.log(`Generating tasks for language: ${language}, count: ${forceTaskCount || 1}`);
    isGeneratingRef.current = true;
    const taskCount = forceTaskCount || 1; // Always load 1 card
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending request to generate-tasks API...');
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: taskCount,
          language: language,
          previousTasks: Array.from(processedTaskIds.current)
        })
      });
      
      const data = await response.json();
      console.log('Response received from generate-tasks API:', data);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      if (!Array.isArray(data)) {
        console.error('Invalid response format, not an array:', data);
        throw new Error('Invalid response format');
      }
      
      // If we got valid tasks
      if (data.length > 0) {
        console.log(`Received ${data.length} tasks:`, data);
        // Filter out any tasks with duplicate IDs and ensure they're unique
        const newTasksWithUniqueIds = data
          .filter(task => !processedTaskIds.current.has(task.id))
          .map((task, index) => {
            // Ensure each task has a unique ID
            const uniqueId = task.id || `task_${Date.now()}_${Math.floor(Math.random() * 10000)}_${index}`;
            processedTaskIds.current.add(uniqueId);
            return {
              ...task,
              id: uniqueId
            };
          });
        
        console.log(`Filtered to ${newTasksWithUniqueIds.length} unique tasks`);
        
        if (newTasksWithUniqueIds.length > 0) {
          // Keep only one task at a time
          console.log('Setting task:', newTasksWithUniqueIds[0]);
          setTasks([newTasksWithUniqueIds[0]]);
          setIsFirstLoad(false);
          setIsNewCard(true); // Mark this as a new card
          
          // If it's the first load, scroll to the top of the card
          if (isFirstLoad) {
            setTimeout(() => {
              if (containerRef.current) {
                window.scrollTo({
                  top: containerRef.current.offsetTop,
                  behavior: 'auto'
                });
              }
            }, 10);
          }
          
          // Reset the new card flag after a moment
          setTimeout(() => {
            setIsNewCard(false);
          }, 300);
        } else {
          throw new Error('No unique tasks available');
        }
      } else {
        // If we didn't get any tasks
        console.error('No tasks received in the response');
        throw new Error('No tasks received from API');
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate tasks. Please check your API key configuration.');
    } finally {
      setIsLoading(false);
      // Wait a moment before allowing new API calls
      setTimeout(() => {
        isGeneratingRef.current = false;
      }, 1000);
    }
  }, [language, isLoading, isFirstLoad]);

  // Set up intersection observer to detect when user scrolls down past the current card
  useEffect(() => {
    if (tasks.length === 0 || isNewCard) return; // Don't observe if there's no task or the card is new
    
    let observerTimeout: NodeJS.Timeout | null = null;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        // When the card goes out of view (user scrolled down)
        if (!entry.isIntersecting && !isLoading && !isGeneratingRef.current) {
          // Debounce the observation to prevent multiple rapid calls
          if (observerTimeout) {
            clearTimeout(observerTimeout);
          }
          
          observerTimeout = setTimeout(() => {
            // Load a new card when the user scrolls below the current one
            generateTasks(1);
          }, 500);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '-20% 0px -80% 0px' // Trigger when card is 20% from top of viewport
      }
    );
    
    if (lastTaskRef.current) {
      observer.observe(lastTaskRef.current);
    }
    
    return () => {
      if (lastTaskRef.current) {
        observer.unobserve(lastTaskRef.current);
      }
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
    };
  }, [generateTasks, isLoading, tasks, isNewCard]);

  useEffect(() => {
    if (tasks.length === 0) {
      console.log('No tasks loaded, generating first task');
      generateTasks(1); // Load 1 card on first load
    }
    
    // Prevent scrolling up
    const handleScroll = () => {
      if (window.scrollY === 0) {
        window.scrollTo(0, 1);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleTaskComplete = useCallback((taskId: string, isCorrect: boolean) => {
    console.log(`Task ${taskId} completed. Correct: ${isCorrect}`);
    
    // Generate a new task regardless of whether the answer was correct or not
    generateTasks(1);
    
    // Scroll to the bottom after the new task is generated
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 300);
  }, [generateTasks]);

  return (
    <div className="space-y-4" ref={containerRef}>
      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-lg mb-4 shadow-md">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => generateTasks(1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
      
      {tasks.map((task) => (
        <div 
          key={`task_container_${task.id}`} 
          ref={lastTaskRef}
          className="min-h-[75vh] flex flex-col"
        >
          <FeedCard
            key={task.id}
            task={task}
            onComplete={(isCorrect: boolean) => handleTaskComplete(task.id, isCorrect)}
          />
          
          {/* Add a spacer at the bottom to ensure we can scroll past this card */}
          <div className="h-[50vh]"></div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          <p className="ml-3 text-gray-600">Loading tasks...</p>
        </div>
      )}
    </div>
  );
} 