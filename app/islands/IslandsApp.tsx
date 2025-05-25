'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, ChevronRight, Mic, Star, X, MessageCircle, BookOpen, ChevronDown, Plus, Check, Trash2 } from 'lucide-react';
import { ISLANDS_DATA } from './data';
import { Island, Subtopic, Question, VocabularyItem, SavedVocabularyItem, SerializedSavedVocabularyItem } from './types';


export function LanguageIslandsApp() {
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    fluency: number;
    pronunciation: number;
    vocabulary: number;
    grammar: number;
    feedback: string[];
  } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State for vocabulary management
  const [expandedVocabSections, setExpandedVocabSections] = useState<Record<string, boolean>>({});
  const [personalWortschatz, setPersonalWortschatz] = useState<Record<string, SavedVocabularyItem[]>>({});
  const [activeSubtopicId, setActiveSubtopicId] = useState<string | null>(null);
  const [showPersonalWortschatz, setShowPersonalWortschatz] = useState<boolean>(false);

  // Load saved vocabulary from local storage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('personalWortschatz');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert serialized vocabulary items back to SavedVocabularyItem format
        const withDates = Object.entries(parsed).reduce<Record<string, SavedVocabularyItem[]>>((acc, [key, items]) => {
          const serializedItems = items as SerializedSavedVocabularyItem[];
          acc[key] = serializedItems.map(item => ({
            ...item,
            dateAdded: new Date(item.dateAdded)
          }));
          return acc;
        }, {});
        setPersonalWortschatz(withDates);
      } catch (error) {
        console.error('Failed to load vocabulary:', error);
      }
    }
  }, []);

  // Save vocabulary to local storage whenever it changes
  useEffect(() => {
    try {
      // Convert SavedVocabularyItem to serialized format for storage
      const toSave = Object.entries(personalWortschatz).reduce<Record<string, SerializedSavedVocabularyItem[]>>(
        (acc, [key, items]) => {
          acc[key] = items.map(item => ({
            ...item,
            dateAdded: item.dateAdded.toISOString()
          }));
          return acc;
        }, 
        {}
      );
      
      localStorage.setItem('personalWortschatz', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save vocabulary:', error);
    }
  }, [personalWortschatz]);

  const toggleVocabSection = (section: string) => {
    setExpandedVocabSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isInPersonalWortschatz = (item: VocabularyItem, subtopicId: string) => {
    return personalWortschatz[subtopicId]?.some(vocab => 
      vocab.text === item.text && vocab.meaning === item.meaning
    ) || false;
  };

  // Toggle personal Wortschatz for a vocabulary item
  const togglePersonalWortschatz = (item: VocabularyItem, subtopicId: string) => {
    setPersonalWortschatz(prev => {
      const currentItems = [...(prev[subtopicId] || [])];
      const existingIndex = currentItems.findIndex(vocab => 
        vocab.text === item.text && vocab.meaning === item.meaning
      );

      // Create a new array to avoid mutating the state directly
      const updatedItems = [...currentItems];
      
      if (existingIndex >= 0) {
        // Remove from personal Wortschatz
        updatedItems.splice(existingIndex, 1);
      } else {
        // Add to personal Wortschatz
        const newItem: SavedVocabularyItem = {
          ...item,
          id: Date.now().toString(),
          dateAdded: new Date(),
          subtopicId: subtopicId
        };
        updatedItems.push(newItem);
      }

      return {
        ...prev,
        [subtopicId]: updatedItems
      };
    });
  };

  const toggleSubtopicWortschatz = (subtopicId: string) => {
    setExpandedVocabSections(prev => ({
      ...prev,
      [subtopicId]: !prev[subtopicId]
    }));
    setActiveSubtopicId(prev => prev === subtopicId ? null : subtopicId);
  };

  const toggleSubtopic = (subtopicId: string) => {
    setExpandedSubtopics(prev => ({
      ...prev,
      [subtopicId]: !prev[subtopicId]
    }));
    setActiveSubtopicId(prev => prev === subtopicId ? null : subtopicId);
  };

  const selectQuestion = (question: Question, subtopicId: string) => {
    setSelectedQuestion(question);
    const subtopic = Object.values(ISLANDS_DATA).find(island => 
      Object.values(island.subtopics).some(st => st.id === subtopicId)
    )?.subtopics[subtopicId] || null;
    setSelectedSubtopic(subtopic);
    setActiveSubtopicId(subtopicId);
  };

  const renderIslandMap = () => {
    return (
      <div className="relative w-full h-[500px] bg-blue-50 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/map-bg.svg')] bg-cover opacity-20"></div>
        
        {Object.values(ISLANDS_DATA).map((island) => (
          <div 
            key={island.id}
            className={`absolute cursor-pointer transform transition-all duration-300 hover:scale-110`}
            style={{ 
              left: `${island.position.x}%`, 
              top: `${island.position.y}%`,
            }}
            onClick={() => setSelectedIsland(island)}
          >
            <div className={`w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br ${island.color} text-white text-2xl shadow-lg`}>
              <span>{island.icon}</span>
            </div>
            <div className="mt-2 text-center font-medium text-gray-800 text-sm">
              {island.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Simulate getting feedback after recording
      setTimeout(() => {
        generateFeedback();
      }, 1000);
    }
  };
  
  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };
  
  const resetRecording = () => {
    setRecordedAudio(null);
    setAudioUrl(null);
    setFeedback(null);
    setShowFeedback(false);
  };
  
  const generateFeedback = () => {
    // Simulate AI feedback
    setFeedback({
      fluency: Math.floor(Math.random() * 30) + 70, // 70-100
      pronunciation: Math.floor(Math.random() * 30) + 70,
      vocabulary: Math.floor(Math.random() * 30) + 70,
      grammar: Math.floor(Math.random() * 30) + 70,
      feedback: [
        "Good job on using appropriate vocabulary for this topic!",
        "Try to speak a bit more fluently by connecting your sentences.",
        "Your pronunciation of technical terms was excellent.",
        "Consider using more complex sentence structures to showcase your skills."
      ]
    });
  };

  const closeIslandModal = () => {
    setSelectedIsland(null);
    setSelectedQuestion(null);
    setSelectedSubtopic(null);
    resetRecording();
  };

  const closeQuestionModal = () => {
    setSelectedQuestion(null);
    resetRecording();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Islands</h1>
        
        {renderIslandMap()}
        
        {/* Island Modal */}
        {selectedIsland && !selectedQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br ${selectedIsland.color} text-white text-xl mr-4`}>
                      <span>{selectedIsland.icon}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedIsland.name}</h2>
                  </div>
                  <button 
                    onClick={closeIslandModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="mt-2 text-gray-600">{selectedIsland.description}</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Topics</h3>
                
                <div className="space-y-3">
                  {Object.values(selectedIsland.subtopics).map((subtopic) => (
                    <div key={subtopic.id} className="border rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                        onClick={() => toggleSubtopic(subtopic.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <span className="text-xl mr-3">{subtopic.icon}</span>
                            <span className="font-medium">{subtopic.name}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubtopicWortschatz(subtopic.id);
                            }}
                            className={`p-1 rounded-full ${activeSubtopicId === subtopic.id ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="View Wortschatz"
                          >
                            <BookOpen size={20} />
                          </button>
                        </div>
                        <ChevronRight 
                          className={`transform transition-transform ${expandedSubtopics[subtopic.id] ? 'rotate-90' : ''}`} 
                          size={20} 
                        />
                      </div>
                      
                      {expandedSubtopics[subtopic.id] && (
                        <div className="border-t">
                          <div className="p-4 space-y-2">
                            {subtopic.questions.map((q) => (
                              <div 
                                key={`${selectedIsland.id}-${subtopic.id}-${q.id}`}
                                className="p-3 rounded-lg border hover:bg-blue-50 cursor-pointer"
                                onClick={() => selectQuestion(q, subtopic.id)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-blue-700">{q.title}</div>
                                    <div className="text-sm text-gray-600 mt-1">{q.question}</div>
                                  </div>
                                  {q.vocabulary && q.vocabulary.length > 0 && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSubtopicWortschatz(subtopic.id);
                                      }}
                                      className="p-1 text-gray-400 hover:text-indigo-500"
                                      title="View Vocabulary"
                                    >
                                      <BookOpen size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Subtopic Wortschatz Panel */}
                          {activeSubtopicId === subtopic.id && (
                            <div className="border-t bg-gray-50 p-4">
                              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                                <BookOpen size={18} className="mr-2" />
                                {subtopic.name} - Wortschatz
                              </h4>
                              {personalWortschatz[subtopic.id]?.length > 0 ? (
                                <div className="space-y-2">
                                  {personalWortschatz[subtopic.id].map((item) => (
                                    <div key={item.id} className="bg-white p-3 rounded border border-gray-100">
                                      <div className="font-medium">{item.text}</div>
                                      <div className="text-sm text-gray-600 mt-1">{item.meaning}</div>
                                      <div className="flex items-center mt-1">
                                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                          {item.type}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                          {new Date(item.dateAdded).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  No vocabulary added yet. Click the + icon to add words.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Question Modal */}
        {selectedQuestion && selectedSubtopic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{selectedSubtopic.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-700">{selectedSubtopic.name}</h3>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mt-2">{selectedQuestion.title}</h2>
                  </div>
                  <button 
                    onClick={closeQuestionModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="text-lg text-gray-800 mb-4">{selectedQuestion.question}</div>
                  
                  <div className="space-y-4">
                    {/* Hints Section */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <BookOpen size={18} className="mr-2" />
                        Hints
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedQuestion.hints.map((hint, index) => (
                          <li key={index} className="text-gray-700">{hint}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Vocabulary Section */}
                    {selectedQuestion.vocabulary && selectedQuestion.vocabulary.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Vocabulary Header */}
                        <div 
                          className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleVocabSection('vocabulary')}
                        >
                          <div className="flex items-center">
                            <MessageCircle size={18} className="mr-2 text-gray-700" />
                            <span className="font-medium">VOCABULARY</span>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`transition-transform ${expandedVocabSections['vocabulary'] ? 'transform rotate-180' : ''}`} 
                          />
                        </div>
                        
                        {/* Vocabulary Content */}
                        {expandedVocabSections['vocabulary'] && (
                          <div className="bg-white p-4 space-y-3">
                            {selectedQuestion.vocabulary.map((item, index) => (
                              <div key={index} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-gray-900">{item.text}</div>
                                    <div className="text-sm text-gray-600 mt-1">{item.meaning}</div>
                                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full mt-1">
                                      {item.type}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePersonalWortschatz(item, selectedSubtopic?.id || '');
                                    }}
                                    className={`p-1 rounded-full ${isInPersonalWortschatz(item, selectedSubtopic?.id || '') ? 'text-green-500' : 'text-gray-400 hover:text-blue-500'}`}
                                    title={isInPersonalWortschatz(item, selectedSubtopic?.id || '') ? 'Remove from My Wortschatz' : 'Add to My Wortschatz'}
                                  >
                                    {isInPersonalWortschatz(item, selectedSubtopic?.id || '') ? <Check size={18} /> : <Plus size={18} />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Personal Wortschatz Toggle */}
                    <button 
                      onClick={() => setShowPersonalWortschatz(!showPersonalWortschatz)}
                      className="w-full text-left flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Star size={18} className="mr-2" />
                        <span className="font-medium">MY PERSONAL WORTSCHATZ</span>
                      </div>
                      <ChevronDown 
                        size={20} 
                        className={`transition-transform ${showPersonalWortschatz ? 'transform rotate-180' : ''}`} 
                      />
                    </button>

                    {/* Personal Wortschatz Content */}
                    {showPersonalWortschatz && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-white p-4 space-y-3">
                          {Object.entries(personalWortschatz).flatMap(([, items]) => items).length > 0 ? (
                            Object.entries(personalWortschatz).flatMap(([, items]) => 
                              items.map((item) => (
                                <div key={item.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 group">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-gray-900">{item.text}</div>
                                      <div className="text-sm text-gray-600 mt-1">{item.meaning}</div>
                                      <div className="flex items-center mt-1">
                                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                                          {item.type}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                          {item.dateAdded.toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setPersonalWortschatz(prev => {
                                          const updatedSubtopicItems = [...(prev[item.subtopicId] || [])].filter(
                                            vocab => vocab.id !== item.id
                                          );
                                          return {
                                            ...prev,
                                            [item.subtopicId]: updatedSubtopicItems
                                          };
                                        });
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
                                      title="Remove from My Wortschatz"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              No vocabulary added yet. Click the + icon next to vocabulary items to add them.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-700 mb-4">Record Your Answer</h4>
                  
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    {!isRecording && !recordedAudio && (
                      <button
                        onClick={startRecording}
                        className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 shadow-lg"
                      >
                        <Mic size={24} />
                      </button>
                    )}
                    
                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white rounded-full w-14 h-14 shadow-lg animate-pulse"
                      >
                        <Square size={24} />
                      </button>
                    )}
                    
                    {recordedAudio && !isRecording && (
                      <>
                        <button
                          onClick={playRecording}
                          className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg"
                        >
                          <Play size={24} />
                        </button>
                        
                        <button
                          onClick={resetRecording}
                          className="flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white rounded-full w-14 h-14 shadow-lg"
                        >
                          <RotateCcw size={24} />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {recordedAudio && !showFeedback && (
                    <div className="text-center">
                      <button
                        onClick={() => setShowFeedback(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md font-medium"
                      >
                        Get Feedback
                      </button>
                    </div>
                  )}
                  
                  {feedback && showFeedback && (
                    <div className="mt-6 bg-white border rounded-xl p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <MessageCircle size={20} className="mr-2" />
                        AI Feedback
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Fluency</div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${feedback.fluency}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-sm mt-1">{feedback.fluency}%</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Pronunciation</div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${feedback.pronunciation}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-sm mt-1">{feedback.pronunciation}%</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Vocabulary</div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full" 
                              style={{ width: `${feedback.vocabulary}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-sm mt-1">{feedback.vocabulary}%</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Grammar</div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-500 rounded-full" 
                              style={{ width: `${feedback.grammar}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-sm mt-1">{feedback.grammar}%</div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Comments:</h5>
                        <ul className="space-y-2">
                          {feedback.feedback.map((comment, index) => (
                            <li key={index} className="flex items-start">
                              <Star size={16} className="text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                              <span className="text-gray-700">{comment}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}
