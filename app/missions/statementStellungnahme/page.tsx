'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, MessageSquare, Mic, Square, Play, RotateCcw, ThumbsUp, ThumbsDown, 
  Send, Sparkles, Award, Volume2, Clock, Users, Edit3, Copy, CheckCircle, 
  Target, Shield, Zap, Star, FileText, Brain, Rocket, Heart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { data } from '../../land/data/statementStellungnahmeData';

interface Statement {
  id: number;
  statement: string;
}

type Phase = 'briefing' | 'loading' | 'context' | 'choice' | 'recording' | 'transcription' | 'processing' | 'feedback';
type Position = 'agree' | 'disagree' | null;
type MissionType = 'agreeDisagree' | 'situationReact';

interface FeedbackData {
  briefFeedback: string;
  vocabularyImprovements: string[];
}

interface CustomMission {
  type: string;
  subType: string;
  question?: string;
  situation?: string;
  task?: string;
  aiNotes?: string;
}

export default function StatementStellungnahmePage() {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<Phase>('briefing');
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [context, setContext] = useState<string>('');
  const [userPosition, setUserPosition] = useState<Position>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [editedTranscription, setEditedTranscription] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missionProgress, setMissionProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [customMission, setCustomMission] = useState<CustomMission | null>(null);
  const [isCustomMission, setIsCustomMission] = useState(false);
  const [missionType, setMissionType] = useState<MissionType>('agreeDisagree');
  const [isClient, setIsClient] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
    
    // Check if there's a custom mission in sessionStorage
    const customMissionData = sessionStorage.getItem('currentCustomMission');
    if (customMissionData) {
      try {
        const parsedMission = JSON.parse(customMissionData);
        setCustomMission(parsedMission);
        setIsCustomMission(true);
        console.log('Custom mission loaded:', parsedMission);
      } catch (error) {
        console.error('Error parsing custom mission:', error);
      }
    }
    
    // Start with briefing phase
    setMissionProgress(10);
  }, []);

  const initializeMission = async () => {
    setCurrentPhase('loading');
    setMissionProgress(25);
    
    try {
      if (isCustomMission && customMission) {
        // Generate custom mission using AI
        const customResponse = await fetch('/api/generate-custom-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionData: customMission })
        });

        if (!customResponse.ok) {
          throw new Error('Failed to generate custom mission');
        }

        const customMissionData = await customResponse.json();
        
        // Set the generated statement and context
        setSelectedStatement({
          id: 1,
          statement: customMissionData.statement
        });
        setContext(customMissionData.context);
        setMissionType(customMissionData.missionType || customMission.subType);
        
        // Clear the session storage
        sessionStorage.removeItem('currentCustomMission');
      } else {
        // Use default random statement logic
        const statements = data.topics[0].statements;
        const randomStatement = statements[Math.floor(Math.random() * statements.length)];
        setSelectedStatement(randomStatement);
        setMissionType('agreeDisagree'); // Default to agree/disagree

        // Generate context using existing API
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
      }

      setMissionProgress(40);
      
      // Transition to context display
      setTimeout(() => {
        setCurrentPhase('context');
        setMissionProgress(50);
      }, 1000);
      
      setTimeout(() => {
        // For situationReact, skip choice phase and go directly to recording
        if (missionType === 'situationReact') {
          setCurrentPhase('recording');
          setMissionProgress(70);
        } else {
          setCurrentPhase('choice');
          setMissionProgress(60);
        }
      }, 4000);
    } catch (err) {
      setError('Failed to initialize mission. Please try again.');
      console.error('Initialization error:', err);
    }
  };

  const handlePositionChoice = (position: Position) => {
    setUserPosition(position);
    setCurrentPhase('recording');
    setMissionProgress(70);
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
        
        // Automatically transcribe after recording
        transcribeAudio(audioBlob);
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

  const transcribeAudio = async (audioBlob: Blob) => {
    setCurrentPhase('transcription');
    setMissionProgress(80);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const transcriptionResponse = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcriptionData = await transcriptionResponse.json();
      setTranscription(transcriptionData.transcription);
      setEditedTranscription(transcriptionData.transcription);
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error('Transcription error:', err);
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const submitResponse = async () => {
    if (!selectedStatement || !editedTranscription.trim()) return;

    setCurrentPhase('processing');
    setMissionProgress(90);
    
    try {
      // Prepare the context and instructions for AI analysis
      let analysisContext = context;
      let additionalInstructions = '';
      
      if (isCustomMission && customMission) {
        if (customMission.aiNotes) {
          additionalInstructions = `\n\nSpecial Assessment Instructions: ${customMission.aiNotes}`;
        }
      }

      // Get feedback from Gemini
      const feedbackResponse = await fetch('/api/analyze-statement-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: selectedStatement.statement,
          position: missionType === 'agreeDisagree' ? userPosition : 'response', // For situationReact, use 'response'
          userResponse: editedTranscription,
          context: analysisContext + additionalInstructions
        })
      });

      if (!feedbackResponse.ok) {
        throw new Error('Failed to analyze response');
      }

      const feedbackData = await feedbackResponse.json();
      setFeedback(feedbackData);
      setCurrentPhase('feedback');
      setMissionProgress(100);

    } catch (err) {
      setError('Failed to process your response. Please try again.');
      console.error('Processing error:', err);
    }
  };

  const copyPromptToClipboard = () => {
    if (!selectedStatement || !editedTranscription) return;
    
    let analysisContext = context;
    let additionalInstructions = '';
    
    if (isCustomMission && customMission) {
      if (customMission.aiNotes) {
        additionalInstructions = `\n\nSpecial Assessment Instructions: ${customMission.aiNotes}`;
      }
    }
    
    const prompt = `You are analyzing a language learner's response to a ${missionType === 'agreeDisagree' ? 'controversial statement' : 'situational scenario'} in a discussion exercise.

Context: ${analysisContext}${additionalInstructions}
${missionType === 'agreeDisagree' ? 'Statement' : 'Situation'}: "${selectedStatement.statement}"
User's position: ${missionType === 'agreeDisagree' ? userPosition : 'responding to situation'}
User's response: "${editedTranscription}"

Provide feedback in this exact JSON format:
{
  "briefFeedback": "One sentence of encouraging feedback about their ${missionType === 'agreeDisagree' ? 'argument or expression' : 'response or reaction'}",
  "vocabularyImprovements": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Guidelines:
- briefFeedback: One sentence only! Be encouraging but specific about what they did well in their ${missionType === 'agreeDisagree' ? 'argument' : 'response'} or language use.
- vocabularyImprovements: Exactly 1-3 concrete vocabulary suggestions that would make their response more sophisticated or natural. Focus on better word choices, phrases, or expressions they could have used.`;

    navigator.clipboard.writeText(prompt).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const resetMission = () => {
    setCurrentPhase('briefing');
    setSelectedStatement(null);
    setContext('');
    setUserPosition(null);
    setIsRecording(false);
    setRecordedAudio(null);
    setAudioUrl(null);
    setTranscription('');
    setEditedTranscription('');
    setFeedback(null);
    setError(null);
    setMissionProgress(10);
    setCustomMission(null);
    setIsCustomMission(false);
    setMissionType('agreeDisagree');
    // Clear any remaining session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('currentCustomMission');
    }
  };

  const goBack = () => {
    // Clear session storage when going back
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('currentCustomMission');
    }
    router.push('/land');
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mission Progress Bar Component
  const MissionProgressBar = () => (
    <div className="w-full bg-gray-200/60 rounded-full h-2 mb-4 overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-1000 ease-out relative"
        style={{ width: `${missionProgress}%` }}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center border border-red-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mission Failed</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={resetMission}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium transform hover:scale-105 shadow-lg"
            >
              Retry Mission
            </button>
            <button
              onClick={goBack}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Abort Mission
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mission Briefing Phase
  if (currentPhase === 'briefing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Simple animated background without random elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-1 h-1 bg-blue-300/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute top-40 right-40 w-1 h-1 bg-blue-300/40 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-40 left-40 w-1 h-1 bg-blue-300/40 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-20 right-20 w-1 h-1 bg-blue-300/40 rounded-full animate-ping" style={{ animationDelay: '4s' }} />
        </div>

        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                {isCustomMission ? <Star className="w-12 h-12 text-white" /> : <Target className="w-12 h-12 text-white" />}
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              {isCustomMission ? `Custom Mission: ${missionType === 'agreeDisagree' ? 'Statement Analysis' : 'Situation Response'}` : 'Mission: Statement Analysis'}
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              {isCustomMission 
                ? `Agent, you have been assigned a custom ${missionType === 'agreeDisagree' ? 'discussion mission' : 'situational response mission'} based on your specifications.`
                : 'Agent, you have been assigned a critical discussion mission. Your task is to analyze a controversial statement and provide a compelling argument.'
              }
            </p>
            
            {isCustomMission && customMission && (
              <div className="mt-6 bg-green-500/20 rounded-2xl p-4 border border-green-400/30">
                <h3 className="text-green-300 font-semibold mb-2">Custom Mission Parameters</h3>
                <p className="text-green-100 text-sm">
                  {missionType === 'agreeDisagree' 
                    ? `Topic: ${customMission.question}` 
                    : `Situation: ${customMission.situation}`
                  }
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-300" />
                Mission Objectives
              </h3>
              <ul className="text-blue-100 space-y-2 text-sm">
                {missionType === 'agreeDisagree' ? (
                  <>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      Analyze the given statement critically
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Choose your position (agree/disagree)
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      Record a compelling argument
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      Understand the situation presented
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Respond naturally and appropriately
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      Show empathy and understanding
                    </li>
                  </>
                )}
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Receive AI-powered feedback
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-300/30">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Rocket className="w-5 h-5 mr-2 text-green-300" />
                Mission Requirements
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Microphone access required. Speak clearly and confidently. You'll have the opportunity to edit your transcription before final submission.
              </p>
            </div>
          </div>

          <MissionProgressBar />

          <div className="flex justify-center">
            <button
              onClick={initializeMission}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl transform transition-all duration-300 hover:scale-105 flex items-center"
            >
              {isCustomMission ? <Star className="w-6 h-6 mr-3" /> : <Target className="w-6 h-6 mr-3" />}
              Begin Mission
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
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-spin">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-white/20 animate-ping"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {isCustomMission ? 'Generating Custom Mission' : 'Mission Intel Loading'}
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            {isCustomMission 
              ? `Creating your personalized ${missionType === 'agreeDisagree' ? 'discussion' : 'situational response'} scenario...` 
              : 'Preparing discussion scenario...'
            }
          </p>
          <MissionProgressBar />
        </div>
      </div>
    );
  }

  // Context Display Phase
  if (currentPhase === 'context') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl text-center border border-blue-100">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            {missionType === 'agreeDisagree' ? <Users className="w-10 h-10 text-white" /> : <Heart className="w-10 h-10 text-white" />}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {isCustomMission ? `Custom ${missionType === 'agreeDisagree' ? 'Mission' : 'Situation'} Scenario` : 'Mission Scenario'}
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
            <p className="text-lg text-blue-900 leading-relaxed">{context}</p>
          </div>
          <div className="flex items-center justify-center text-gray-500 mb-4">
            <Clock className="w-5 h-5 mr-2" />
            {missionType === 'agreeDisagree' ? 'Prepare for statement analysis...' : 'Prepare your response...'}
          </div>
          <MissionProgressBar />
        </div>
      </div>
    );
  }

  // Choice Phase (only for agreeDisagree)
  if (currentPhase === 'choice' && missionType === 'agreeDisagree') {
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
                Abort Mission
              </button>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                {isCustomMission ? 'Custom Mission Active' : 'Mission Active'}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Position</h1>
            <p className="text-xl text-gray-600 mb-6">{context}</p>
            <MissionProgressBar />
          </div>

          {/* Statement Display */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
                <blockquote className="text-2xl font-medium text-gray-900 leading-relaxed">
                  "{selectedStatement?.statement}"
                </blockquote>
              </div>
            </div>
          </div>

          {/* Choice Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => handlePositionChoice('agree')}
              className="group relative bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <ThumbsUp className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">I Agree</h3>
                <p className="text-green-100 text-lg">Support this statement</p>
              </div>
            </button>

            <button
              onClick={() => handlePositionChoice('disagree')}
              className="group relative bg-gradient-to-br from-red-400 to-pink-600 hover:from-red-500 hover:to-pink-700 text-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-300 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <ThumbsDown className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">I Disagree</h3>
                <p className="text-red-100 text-lg">Oppose this statement</p>
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
                Abort Mission
              </button>
              {missionType === 'agreeDisagree' ? (
                <div className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${
                  userPosition === 'agree' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  Position: {userPosition === 'agree' ? 'I Agree' : 'I Disagree'}
                </div>
              ) : (
                <div className="bg-purple-100 text-purple-800 border-purple-200 px-4 py-2 rounded-full text-sm font-medium border-2">
                  Situation Response
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {missionType === 'agreeDisagree' ? 'Record Your Argument' : 'Record Your Response'}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {missionType === 'agreeDisagree' 
                ? 'Elaborate on your position. Be specific and provide examples.'
                : 'Respond naturally to the situation. Show empathy and understanding.'
              }
            </p>
            <MissionProgressBar />
          </div>

          {/* Statement/Situation Reminder */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium text-gray-700">
                {missionType === 'agreeDisagree' ? 'Statement' : 'Situation'}
              </span>
            </div>
            <p className="text-lg text-gray-800 italic">"{selectedStatement?.statement}"</p>
          </div>

          {/* Recording Interface */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className="mb-8">
              {!isRecording && !recordedAudio && (
                <div className="space-y-6">
                  <button
                    onClick={startRecording}
                    className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full shadow-2xl hover:shadow-red-500/25 transform transition-all duration-300 hover:scale-110 mx-auto flex items-center justify-center group"
                  >
                    <Mic className="w-16 h-16 group-hover:scale-110 transition-transform" />
                  </button>
                  <p className="text-gray-600 text-lg">
                    {missionType === 'agreeDisagree' 
                      ? 'Click to start recording your argument'
                      : 'Click to start recording your response'
                    }
                  </p>
                </div>
              )}
              
              {isRecording && (
                <div className="space-y-6">
                  <button
                    onClick={stopRecording}
                    className="w-32 h-32 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-full shadow-2xl animate-pulse mx-auto flex items-center justify-center"
                  >
                    <Square className="w-16 h-16" />
                  </button>
                  <div className="flex items-center justify-center text-red-600">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-3"></div>
                    <span className="text-lg font-medium">Recording in progress... Click to stop</span>
                  </div>
                </div>
              )}
              
              {recordedAudio && !isRecording && (
                <div className="space-y-6">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={playRecording}
                      className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    >
                      <Play className="w-8 h-8" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setRecordedAudio(null);
                        setAudioUrl(null);
                      }}
                      className="w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    >
                      <RotateCcw className="w-8 h-8" />
                    </button>
                  </div>
                  
                  <p className="text-green-600 text-lg font-medium">
                    Recording complete! Transcription in progress...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <audio ref={audioRef} className="hidden" />
      </div>
    );
  }

  // Transcription, Processing, and Feedback phases would continue here...
  // For brevity, I'll include a simplified version showing the pattern

  // Transcription Phase
  if (currentPhase === 'transcription') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Review & Edit Your Response</h1>
            <MissionProgressBar />
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            {transcription ? (
              <div className="space-y-4">
                <textarea
                  value={editedTranscription}
                  onChange={(e) => setEditedTranscription(e.target.value)}
                  className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none text-gray-800 leading-relaxed"
                  placeholder="Your transcribed response will appear here..."
                />
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setRecordedAudio(null);
                      setAudioUrl(null);
                      setTranscription('');
                      setEditedTranscription('');
                      setCurrentPhase('recording');
                    }}
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Re-record
                  </button>
                  
                  <button
                    onClick={submitResponse}
                    disabled={!editedTranscription.trim()}
                    className={`flex items-center px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 ${
                      editedTranscription.trim()
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-6 h-6 mr-3" />
                    Submit Final Response
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Transcribing Audio</h3>
                <p className="text-gray-600">Converting your speech to text...</p>
              </div>
            )}
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
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-blue-100">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Mission Analysis</h2>
          <p className="text-gray-600 text-lg mb-6">
            AI is analyzing your {missionType === 'agreeDisagree' ? 'argument' : 'response'} and preparing feedback...
          </p>
          <MissionProgressBar />
        </div>
      </div>
    );
  }

  // Feedback Phase
  if (currentPhase === 'feedback') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <Award className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Mission Accomplished!</h1>
            <div className="w-full bg-green-200 rounded-full h-3 mb-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Final Response</h3>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-gray-800 leading-relaxed">{editedTranscription}</p>
            </div>
          </div>

          {feedback && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">AI Mission Analysis</h3>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-6">
                <p className="text-purple-900 text-lg leading-relaxed">{feedback.briefFeedback}</p>
              </div>
              
              {feedback.vocabularyImprovements && feedback.vocabularyImprovements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Vocabulary Enhancement Suggestions</h4>
                  <div className="space-y-3">
                    {feedback.vocabularyImprovements.map((improvement, index) => (
                      <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 leading-relaxed">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={resetMission}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-xl hover:from-blue-200 hover:to-indigo-200 transition-all font-medium transform hover:scale-105 shadow-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              New Mission
            </button>
            <button
              onClick={goBack}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium transform hover:scale-105 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Return to Base
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}