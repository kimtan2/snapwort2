'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MessageSquare, Mic, Square, Play, RotateCcw, ThumbsUp, ThumbsDown, Send, Sparkles, Award, Volume2, Clock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { data } from '../../land/data/statementStellungnahmeData';

interface Statement {
  id: number;
  statement: string;
}

type Phase = 'loading' | 'context' | 'choice' | 'recording' | 'processing' | 'feedback';
type Position = 'agree' | 'disagree' | null;

interface FeedbackData {
  briefFeedback: string;
  vocabularyImprovements: string[];
}

export default function StatementStellungnahmePage() {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<Phase>('loading');
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [context, setContext] = useState<string>('');
  const [userPosition, setUserPosition] = useState<Position>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize mission on component mount
  useEffect(() => {
    initializeMission();
  }, []);

  const initializeMission = async () => {
    try {
      // Randomly select a statement
      const statements = data.topics[0].statements;
      const randomStatement = statements[Math.floor(Math.random() * statements.length)];
      setSelectedStatement(randomStatement);

      // Generate context using Gemini API
      const contextResponse = await fetch('/api/generate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: randomStatement.statement })
      });

      if (!contextResponse.ok) {
        throw new Error('Failed to generate context');
      }

      const contextData = await contextResponse.json();
      setContext(contextData.context);
      
      // Transition to context display
      setTimeout(() => setCurrentPhase('context'), 500);
      setTimeout(() => setCurrentPhase('choice'), 3000);
    } catch (err) {
      setError('Failed to initialize mission. Please try again.');
      console.error('Initialization error:', err);
    }
  };

  const handlePositionChoice = (position: Position) => {
    setUserPosition(position);
    setCurrentPhase('recording');
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
      setError('Could not access microphone. Please check permissions.');
      console.error("Error accessing microphone:", error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const submitRecording = async () => {
    if (!recordedAudio || !selectedStatement) return;

    setCurrentPhase('processing');
    
    try {
      // Step 1: Transcribe audio using OpenAI Whisper
      const formData = new FormData();
      formData.append('audio', recordedAudio, 'recording.wav');
      
      const transcriptionResponse = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcriptionData = await transcriptionResponse.json();
      setTranscription(transcriptionData.transcription);

      // Step 2: Get feedback from Gemini
      const feedbackResponse = await fetch('/api/analyze-statement-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: selectedStatement.statement,
          position: userPosition,
          userResponse: transcriptionData.transcription,
          context: context
        })
      });

      if (!feedbackResponse.ok) {
        throw new Error('Failed to analyze response');
      }

      const feedbackData = await feedbackResponse.json();
      setFeedback(feedbackData);
      setCurrentPhase('feedback');

    } catch (err) {
      setError('Failed to process your response. Please try again.');
      console.error('Processing error:', err);
    }
  };

  const resetMission = () => {
    setCurrentPhase('loading');
    setSelectedStatement(null);
    setContext('');
    setUserPosition(null);
    setIsRecording(false);
    setRecordedAudio(null);
    setAudioUrl(null);
    setTranscription('');
    setFeedback(null);
    setError(null);
    initializeMission();
  };

  const goBack = () => {
    router.push('/land');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={resetMission}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={goBack}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading Phase
  if (currentPhase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-spin">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Preparing Your Mission</h1>
          <p className="text-xl text-gray-300">Generating discussion context...</p>
        </div>

        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // Context Display Phase
  if (currentPhase === 'context') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl text-center transform animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Discussion Scenario</h2>
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <p className="text-lg text-blue-900 leading-relaxed">{context}</p>
          </div>
          <div className="mt-6 text-gray-500">
            <Clock className="w-5 h-5 inline mr-2" />
            Get ready to share your thoughts...
          </div>
        </div>
      </div>
    );
  }

  // Choice Phase
  if (currentPhase === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <button
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Map
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">What's Your Position?</h1>
            <p className="text-xl text-gray-600">{context}</p>
          </div>

          {/* Statement Display */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <blockquote className="text-2xl font-medium text-gray-900 leading-relaxed mb-6">
                "{selectedStatement?.statement}"
              </blockquote>
            </div>
          </div>

          {/* Choice Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => handlePositionChoice('agree')}
              className="group relative bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <ThumbsUp className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">I Agree</h3>
                <p className="text-green-100">Express your support for this statement</p>
              </div>
            </button>

            <button
              onClick={() => handlePositionChoice('disagree')}
              className="group relative bg-gradient-to-br from-red-400 to-pink-600 hover:from-red-500 hover:to-pink-700 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-300 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <ThumbsDown className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">I Disagree</h3>
                <p className="text-red-100">Share why you oppose this statement</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recording Phase
  if (currentPhase === 'recording') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Map
              </button>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                userPosition === 'agree' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                Position: {userPosition === 'agree' ? 'I Agree' : 'I Disagree'}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Record Your Response</h1>
            <p className="text-xl text-gray-600 mb-6">
              Elaborate on your position. Be specific and provide examples.
            </p>
          </div>

          {/* Statement Reminder */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <p className="text-lg text-gray-800 italic">"{selectedStatement?.statement}"</p>
          </div>

          {/* Recording Interface */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="mb-8">
              {!isRecording && !recordedAudio && (
                <button
                  onClick={startRecording}
                  className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-110 mx-auto flex items-center justify-center"
                >
                  <Mic className="w-10 h-10" />
                </button>
              )}
              
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-full shadow-xl animate-pulse mx-auto flex items-center justify-center"
                >
                  <Square className="w-10 h-10" />
                </button>
              )}
              
              {recordedAudio && !isRecording && (
                <div className="space-y-6">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={playRecording}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    >
                      <Play className="w-6 h-6" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setRecordedAudio(null);
                        setAudioUrl(null);
                      }}
                      className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <button
                    onClick={submitRecording}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 font-semibold text-lg flex items-center mx-auto"
                  >
                    <Send className="w-6 h-6 mr-3" />
                    Submit Response
                  </button>
                </div>
              )}
            </div>

            <div className="text-gray-600">
              {!isRecording && !recordedAudio && "Click to start recording"}
              {isRecording && (
                <div className="flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  Recording... Click to stop
                </div>
              )}
              {recordedAudio && !isRecording && "Great! Review your recording or submit it for analysis"}
            </div>
          </div>
        </div>

        <audio ref={audioRef} className="hidden" />
      </div>
    );
  }

  // Processing Phase
  if (currentPhase === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Analyzing Your Response</h2>
          <p className="text-gray-600 text-lg">
            Transcribing audio and evaluating your arguments...
          </p>
          {transcription && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">Transcription completed ✓</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Feedback Phase
  if (currentPhase === 'feedback') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Map
              </button>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                Mission Complete
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Excellent Work!</h1>
            <p className="text-xl text-gray-600">Here's your personalized feedback</p>
          </div>

          {/* Transcription */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-4">
              <Volume2 className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">What You Said</h3>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-gray-800 leading-relaxed">{transcription}</p>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">AI Feedback</h3>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-6">
              <p className="text-purple-900 text-lg leading-relaxed">{feedback?.briefFeedback}</p>
            </div>
            
            {feedback?.vocabularyImprovements && feedback.vocabularyImprovements.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">💡 Vocabulary Improvements</h4>
                <div className="space-y-2">
                  {feedback.vocabularyImprovements.map((improvement, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800">{improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetMission}
              className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Try Another Statement
            </button>
            <button
              onClick={goBack}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to City Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}