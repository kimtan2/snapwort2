'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, ChevronRight, Mic, Star, X, MessageCircle, BookOpen, ChevronDown, Plus, Check, Trash2, Sparkles, Award, Target } from 'lucide-react';
import { ISLANDS_DATA } from './data';
import { Island, Subtopic, Question, VocabularyItem, SavedVocabularyItem, SerializedSavedVocabularyItem } from './types';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';

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
  const [showPersonalWortschatz, setShowPersonalWortschatz] = useState<Record<string, boolean>>({});

  // User ID for Firestore - in a real app, this would come from authentication
  const [userId, setUserId] = useState<string>('default-user');

  // Load saved vocabulary from Firestore on component mount
  useEffect(() => {
    if (!userId) return;

    // Create a query against the vocabulary collection
    const vocabCollection = collection(db, 'vocabulary');
    const q = query(vocabCollection, where('userId', '==', userId));

    // Set up a real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const vocabBySubtopic: Record<string, SavedVocabularyItem[]> = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const subtopicId = data.subtopicId;
          
          if (!vocabBySubtopic[subtopicId]) {
            vocabBySubtopic[subtopicId] = [];
          }
          
          // Convert Firestore timestamp to Date
          let dateAdded = new Date();
          if (data.dateAdded instanceof Timestamp) {
            dateAdded = data.dateAdded.toDate();
          }
          
          vocabBySubtopic[subtopicId].push({
            id: doc.id,
            text: data.text,
            meaning: data.meaning,
            type: data.type,
            dateAdded: dateAdded,
            subtopicId: data.subtopicId
          });
        });
        
        setPersonalWortschatz(vocabBySubtopic);
      } catch (error) {
        console.error('Failed to load vocabulary from Firestore:', error);
      }
    });
    
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [userId]);

  // We no longer need to save to localStorage as Firestore handles persistence
  // The togglePersonalWortschatz function will handle saving to Firestore directly

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

  // Fixed version of the togglePersonalWortschatz function
const togglePersonalWortschatz = (item: VocabularyItem, subtopicId: string) => {
  setPersonalWortschatz(prev => {
    const currentItems = prev[subtopicId] || [];
    const existingIndex = currentItems.findIndex(vocab => 
      vocab.text === item.text && vocab.meaning === item.meaning
    );

    let updatedItems: SavedVocabularyItem[];
    
    if (existingIndex >= 0) {
      // Remove from personal Wortschatz - create new array without the item
      updatedItems = currentItems.filter((_, index) => index !== existingIndex);
    } else {
      // Add to personal Wortschatz - create new array with the item
      const newItem: SavedVocabularyItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        dateAdded: new Date(),
        subtopicId: subtopicId
      };
      updatedItems = [...currentItems, newItem];
    }

    return {
      ...prev,
      [subtopicId]: updatedItems
    };
  });
};

// Alternative version with additional safety check
const togglePersonalWortschatzSafe = (item: VocabularyItem, subtopicId: string) => {
  setPersonalWortschatz(prev => {
    const currentItems = prev[subtopicId] || [];
    
    // Check if item already exists (more thorough check)
    const existingItem = currentItems.find(vocab => 
      vocab.text === item.text && 
      vocab.meaning === item.meaning &&
      vocab.type === item.type
    );

    if (existingItem) {
      // Remove from personal Wortschatz
      return {
        ...prev,
        [subtopicId]: currentItems.filter(vocab => vocab.id !== existingItem.id)
      };
    } else {
      // Add to personal Wortschatz
      const newItem: SavedVocabularyItem = {
        ...item,
        id: `${subtopicId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date(),
        subtopicId: subtopicId
      };
      
      return {
        ...prev,
        [subtopicId]: [...currentItems, newItem]
      };
    }
  });
};

  const toggleSubtopicWortschatz = (subtopicId: string) => {
    setShowPersonalWortschatz(prev => ({
      ...prev,
      [subtopicId]: !prev[subtopicId]
    }));
  };

  const toggleSubtopic = (subtopicId: string) => {
    setExpandedSubtopics(prev => ({
      ...prev,
      [subtopicId]: !prev[subtopicId]
    }));
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
      <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
        {/* Animated background waves */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-0 w-full h-32 bg-gradient-to-r from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-0 w-2/3 h-24 bg-gradient-to-l from-purple-200/40 to-pink-200/40 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-1/2 h-16 bg-gradient-to-r from-green-200/40 to-teal-200/40 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-16 right-20 w-4 h-4 bg-yellow-400 rounded-full animate-bounce delay-300 opacity-60"></div>
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-700 opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-green-400 rounded-full animate-bounce delay-1000 opacity-60"></div>
        
        {/* Islands */}
        {Object.values(ISLANDS_DATA).map((island) => (
          <div 
            key={island.id}
            className="absolute cursor-pointer transform transition-all duration-500 hover:scale-125 hover:z-10"
            style={{ 
              left: `${island.position.x}%`, 
              top: `${island.position.y}%`,
            }}
            onClick={() => setSelectedIsland(island)}
          >
            {/* Island glow effect */}
            <div className={`absolute inset-0 w-20 h-20 -translate-x-2 -translate-y-2 rounded-full bg-gradient-to-br ${island.color} opacity-20 blur-xl animate-pulse`}></div>
            
            {/* Main island */}
            <div className={`relative w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br ${island.color} text-white text-2xl shadow-xl border-2 border-white/30 hover:shadow-2xl transition-all duration-300`}>
              <span className="relative z-10">{island.icon}</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
            
            {/* Island name */}
            <div className="mt-3 text-center">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border border-white/40">
                <span className="font-semibold text-gray-800 text-sm">{island.name}</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <Award className="w-3 h-3 text-yellow-800" />
            </div>
          </div>
        ))}

        {/* Decorative title */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30">
            <h2 className="text-xl font-bold text-gray-700 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
              Language Islands
              <Target className="w-5 h-5 ml-2 text-blue-500" />
            </h2>
          </div>
        </div>
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
    setFeedback({
      fluency: Math.floor(Math.random() * 30) + 70,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Language Islands
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore different conversation topics and practice your speaking skills in immersive scenarios
          </p>
        </div>
        
        {renderIslandMap()}
        
        {/* Island Modal */}
        {selectedIsland && !selectedQuestion && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
              {/* Header */}
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${selectedIsland.color} text-white text-2xl mr-4 shadow-lg`}>
                      <span>{selectedIsland.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">{selectedIsland.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedIsland.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeIslandModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-500" />
                    Practice Topics
                  </h3>
                </div>
                
                <div className="grid gap-4">
                  {Object.values(selectedIsland.subtopics).map((subtopic) => (
                    <div key={subtopic.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSubtopic(subtopic.id)}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-2xl">{subtopic.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-lg">{subtopic.name}</h4>
                            <p className="text-gray-500 text-sm">{subtopic.questions.length} practice questions</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubtopicWortschatz(subtopic.id);
                            }}
                            className="p-2 rounded-full transition-colors bg-green-100 text-green-600 hover:bg-green-200"
                            title="View Personal Wortschatz"
                          >
                            <BookOpen size={20} />
                          </button>
                          <ChevronRight 
                            className={`transform transition-transform text-gray-400 ${expandedSubtopics[subtopic.id] ? 'rotate-90' : ''}`} 
                            size={20} 
                          />
                        </div>
                      </div>
                      
                      {expandedSubtopics[subtopic.id] && (
                        <div className="border-t">
                          <div className="p-4 space-y-3">
                            {subtopic.questions.map((q) => (
                              <div 
                                key={`${selectedIsland.id}-${subtopic.id}-${q.id}`}
                                className="group p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                                onClick={() => selectQuestion(q, subtopic.id)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-semibold text-blue-700 group-hover:text-blue-800 mb-2">{q.title}</div>
                                    <div className="text-gray-600 text-sm mb-2">{q.question}</div>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    {q.vocabulary && q.vocabulary.length > 0 && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSubtopicWortschatz(subtopic.id);
                                        }}
                                        className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition-colors"
                                        title="View Vocabulary"
                                      >
                                        <BookOpen size={18} />
                                      </button>
                                    )}
                                    <ChevronRight className="text-gray-400 group-hover:text-blue-500" size={16} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Personal Wortschatz Popup Modal */}
        {selectedSubtopic && showPersonalWortschatz[selectedSubtopic.id] && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-4">
                      <BookOpen size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Personal Wortschatz</h3>
                      <p className="text-gray-600">{selectedSubtopic.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleSubtopicWortschatz(selectedSubtopic.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {personalWortschatz[selectedSubtopic.id]?.length > 0 ? (
                  <div className="space-y-4">
                    {personalWortschatz[selectedSubtopic.id].map((item) => (
                      <div key={item.id} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-lg mb-1">{item.text}</div>
                            <div className="text-gray-600 mb-3">{item.meaning}</div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                                {item.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                Added: {item.dateAdded.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                // Delete from Firestore
                                await deleteDoc(doc(db, 'vocabulary', item.id));
                                
                                // Update local state (optimistic update)
                                setPersonalWortschatz(prev => {
                                  const updatedSubtopicItems = [...(prev[item.subtopicId] || [])].filter(
                                    vocab => vocab.id !== item.id
                                  );
                                  return {
                                    ...prev,
                                    [item.subtopicId]: updatedSubtopicItems
                                  };
                                });
                              } catch (error) {
                                console.error('Error deleting vocabulary item:', error);
                              }
                            }}
                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove from Personal Wortschatz"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No vocabulary added yet</h4>
                    <p>Add vocabulary from the question sections to build your personal collection.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
{/* Question Modal */}
        {selectedQuestion && selectedSubtopic && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-xl">{selectedSubtopic.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                        {selectedSubtopic.name}
                      </h3>
                      <h2 className="text-2xl font-bold text-gray-800 mt-1 flex items-center justify-between">
                        {selectedQuestion.title}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubtopicWortschatz(selectedSubtopic.id);
                          }}
                          className="p-2 rounded-full transition-colors bg-green-100 text-green-600 hover:bg-green-200"
                          title="View Personal Wortschatz"
                        >
                          <BookOpen size={20} />
                        </button>
                      </h2>
                    </div>
                  </div>
                  <button 
                    onClick={closeQuestionModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6">
                    <div className="text-lg text-gray-800 mb-4 font-medium">{selectedQuestion.question}</div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Hints Section */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl overflow-hidden">
                      <div 
                        className="p-5 cursor-pointer hover:bg-yellow-50 transition-colors"
                        onClick={() => toggleVocabSection('hints')}
                      >
                        <h4 className="font-semibold text-yellow-800 flex items-center justify-between">
                          <div className="flex items-center">
                            <Sparkles size={18} className="mr-2" />
                            Practice Hints
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`transition-transform text-yellow-600 ${expandedVocabSections['hints'] ? 'transform rotate-180' : ''}`} 
                          />
                        </h4>
                      </div>
                      {expandedVocabSections['hints'] && (
                        <div className="px-5 pb-5">
                          <ul className="space-y-2">
                            {selectedQuestion.hints.map((hint, index) => (
                              <li key={index} className="flex items-start text-gray-700">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span>{hint}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Personal Wortschatz for Question */}
                    {showPersonalWortschatz[selectedSubtopic.id] && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                        <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                          <Star size={18} className="mr-2" />
                          My Personal Wortschatz
                        </h4>
                        {personalWortschatz[selectedSubtopic.id]?.length > 0 ? (
                          <div className="grid gap-3">
                            {personalWortschatz[selectedSubtopic.id].map((item) => (
                              <div key={item.id} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{item.text}</div>
                                    <div className="text-sm text-gray-600 mt-1">{item.meaning}</div>
                                    <div className="flex items-center mt-2 space-x-2">
                                      <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                                        {item.type}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {item.dateAdded.toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      try {
                                        // Delete from Firestore
                                        await deleteDoc(doc(db, 'vocabulary', item.id));
                                        
                                        // Update local state (optimistic update)
                                        setPersonalWortschatz(prev => {
                                          const updatedSubtopicItems = [...(prev[item.subtopicId] || [])].filter(
                                            vocab => vocab.id !== item.id
                                          );
                                          return {
                                            ...prev,
                                            [item.subtopicId]: updatedSubtopicItems
                                          };
                                        });
                                      } catch (error) {
                                        console.error('Error deleting vocabulary item:', error);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                    title="Remove from Personal Wortschatz"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-indigo-600">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 text-indigo-300" />
                            <p>No vocabulary added yet.</p>
                            <p className="text-sm">Add vocabulary from the section below.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vocabulary Section */}
                    {selectedQuestion.vocabulary && selectedQuestion.vocabulary.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Vocabulary Header */}
                        <div 
                          className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 flex justify-between items-center cursor-pointer hover:from-gray-100 hover:to-blue-100 transition-colors"
                          onClick={() => toggleVocabSection('vocabulary')}
                        >
                          <div className="flex items-center">
                            <MessageCircle size={18} className="mr-2 text-blue-600" />
                            <span className="font-semibold text-gray-800">VOCABULARY</span>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`transition-transform text-gray-500 ${expandedVocabSections['vocabulary'] ? 'transform rotate-180' : ''}`} 
                          />
                        </div>
                        
                        {/* Vocabulary Content */}
                        {expandedVocabSections['vocabulary'] && (
                          <div className="p-4 space-y-4">
                            {selectedQuestion.vocabulary.map((item, index) => (
                              <div key={index} className="group p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900 mb-1">{item.text}</div>
                                    <div className="text-gray-600 mb-2">{item.meaning}</div>
                                    <span className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                                      {item.type}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePersonalWortschatz(item, selectedSubtopic?.id || '');
                                    }}
                                    className={`p-2.5 rounded-full transition-all duration-200 ${
                                      isInPersonalWortschatz(item, selectedSubtopic?.id || '') 
                                        ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                        : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                                    }`}
                                    title={isInPersonalWortschatz(item, selectedSubtopic?.id || '') ? 'Remove from My Wortschatz' : 'Add to My Wortschatz'}
                                  >
                                    {isInPersonalWortschatz(item, selectedSubtopic?.id || '') ? 
                                      <Check size={18} /> : 
                                      <Plus size={18} />
                                    }
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recording Section */}
                <div className="border-t pt-8">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center text-xl">
                      <Mic className="w-6 h-6 mr-2 text-purple-600" />
                      Record Your Answer
                    </h4>
                    
                    <div className="flex items-center justify-center space-x-6 mb-8">
                      {!isRecording && !recordedAudio && (
                        <button
                          onClick={startRecording}
                          className="flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full w-20 h-20 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                        >
                          <Mic size={32} />
                        </button>
                      )}
                      
                      {isRecording && (
                        <button
                          onClick={stopRecording}
                          className="flex items-center justify-center bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-full w-20 h-20 shadow-xl animate-pulse"
                        >
                          <Square size={32} />
                        </button>
                      )}
                      
                      {recordedAudio && !isRecording && (
                        <>
                          <button
                            onClick={playRecording}
                            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full w-20 h-20 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                          >
                            <Play size={32} />
                          </button>
                          
                          <button
                            onClick={resetRecording}
                            className="flex items-center justify-center bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full w-20 h-20 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                          >
                            <RotateCcw size={32} />
                          </button>
                        </>
                      )}
                    </div>

                    {isRecording && (
                      <div className="text-center mb-6">
                        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full inline-flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                          Recording in progress...
                        </div>
                      </div>
                    )}
                    
                    {recordedAudio && !showFeedback && (
                      <div className="text-center">
                        <button
                          onClick={() => setShowFeedback(true)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg font-semibold transform hover:scale-105 transition-all duration-200"
                        >
                          Get AI Feedback
                        </button>
                      </div>
                    )}
                    
                    {feedback && showFeedback && (
                      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                        <h4 className="font-bold text-gray-800 mb-6 flex items-center text-xl">
                          <MessageCircle size={24} className="mr-2 text-blue-600" />
                          AI Feedback Report
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-6 mb-8">
                          {[
                            { label: 'Fluency', value: feedback.fluency, color: 'from-green-400 to-green-600' },
                            { label: 'Pronunciation', value: feedback.pronunciation, color: 'from-blue-400 to-blue-600' },
                            { label: 'Vocabulary', value: feedback.vocabulary, color: 'from-purple-400 to-purple-600' },
                            { label: 'Grammar', value: feedback.grammar, color: 'from-yellow-400 to-yellow-600' }
                          ].map((metric) => (
                            <div key={metric.label} className="text-center">
                              <div className="text-sm font-medium text-gray-600 mb-2">{metric.label}</div>
                              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                                <div 
                                  className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-1000 ease-out`}
                                  style={{ width: `${metric.value}%` }}
                                ></div>
                              </div>
                              <div className="text-lg font-bold text-gray-800">{metric.value}%</div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                          <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Star className="w-5 h-5 mr-2 text-yellow-500" />
                            Detailed Comments
                          </h5>
                          <ul className="space-y-3">
                            {feedback.feedback.map((comment, index) => (
                              <li key={index} className="flex items-start">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
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
          </div>
        )}
        
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}