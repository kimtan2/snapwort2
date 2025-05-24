'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, ChevronRight, Mic, MicOff, Volume2, Star, Trophy, X, MessageCircle, BookOpen } from 'lucide-react';
import { ISLANDS_DATA } from './data';
import { Island, Subtopic, Question } from './types';
import { cn } from '@/lib/utils';

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

  const toggleSubtopic = (subtopicId: string) => {
    setExpandedSubtopics(prev => ({
      ...prev,
      [subtopicId]: !prev[subtopicId]
    }));
  };

  const selectQuestion = (question: Question, subtopicId: string) => {
    setSelectedQuestion(question);
    setSelectedSubtopic(Object.values(ISLANDS_DATA).find(island => 
      Object.values(island.subtopics).some(subtopic => subtopic.id === subtopicId)
    )?.subtopics[subtopicId] || null);
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center"> Islands</h1>
        
        
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
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{subtopic.icon}</span>
                          <span className="font-medium">{subtopic.name}</span>
                        </div>
                        <ChevronRight 
                          className={`transform transition-transform ${expandedSubtopics[subtopic.id] ? 'rotate-90' : ''}`} 
                          size={20} 
                        />
                      </div>
                      
                      {expandedSubtopics[subtopic.id] && (
                        <div className="p-4 border-t">
                          <div className="space-y-2">
                            {subtopic.questions.map((q) => (
                              <div 
                                key={`${selectedIsland.id}-${subtopic.id}-${q.id}`}
                                className="p-3 rounded-lg border hover:bg-blue-50 cursor-pointer"
                                onClick={() => selectQuestion(q, subtopic.id)}
                              >
                                <div className="font-medium text-blue-700">{q.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{q.question}</div>
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
