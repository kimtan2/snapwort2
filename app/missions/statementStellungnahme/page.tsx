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
  polishedVersion: string; // Added polished version
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize mission on component mount
  useEffect(() => {
    console.log('Component mounted, checking for custom mission...');
    
    // Check if there's a custom mission in sessionStorage
    const customMissionData = sessionStorage.getItem('currentCustomMission');
    if (customMissionData) {
      try {
        const parsedMission = JSON.parse(customMissionData);
        console.log('Custom mission loaded:', parsedMission);
        
        setCustomMission(parsedMission);
        setIsCustomMission(true);
        
        // Set mission type immediately
        const determinedMissionType = parsedMission.subType === 'situationReact' ? 'situationReact' : 'agreeDisagree';
        setMissionType(determinedMissionType);
        
        console.log('Mission type set to:', determinedMissionType);
      } catch (error: unknown) {
        console.error('Error parsing custom mission:', error);
        setError('Failed to load custom mission data.');
      }
    }
    
    // Start with briefing phase
    setMissionProgress(10);
  }, []);

  const initializeMission = async () => {
    console.log('Initializing mission...', { isCustomMission, customMission, missionType });
    
    setCurrentPhase('loading');
    setMissionProgress(25);
    setError(null);
    
    try {
      if (isCustomMission && customMission) {
        console.log('Generating custom mission with data:', customMission);
        
        const customResponse = await fetch('/api/generate-custom-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionData: customMission })
        });

        if (!customResponse.ok) {
          const errorText = await customResponse.text();
          console.error('Custom mission API error:', errorText);
          throw new Error(`Failed to generate custom mission: ${customResponse.status}`);
        }

        const customMissionData = await customResponse.json();
        console.log('Custom mission generated:', customMissionData);
        
        setSelectedStatement({
          id: 1,
          statement: customMissionData.statement
        });
        setContext(customMissionData.context);
        
        const apiMissionType = customMissionData.missionType || customMission.subType;
        const finalMissionType = apiMissionType === 'situationReact' ? 'situationReact' : 'agreeDisagree';
        setMissionType(finalMissionType);
        
        console.log('Final mission type:', finalMissionType);
        
        sessionStorage.removeItem('currentCustomMission');
      } else {
        console.log('Using default random statement');
        
        const statements = data.topics[0].statements;
        const randomStatement = statements[Math.floor(Math.random() * statements.length)];
        setSelectedStatement(randomStatement);
        setMissionType('agreeDisagree');

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
      
      setTimeout(() => {
        console.log('Moving to context phase');
        setCurrentPhase('context');
        setMissionProgress(50);
      }, 1000);
      
      setTimeout(() => {
        if (missionType === 'situationReact') {
          console.log('Situation react mission - going to recording');
          setCurrentPhase('recording');
          setMissionProgress(70);
        } else {
          console.log('Agree/disagree mission - going to choice');
          setCurrentPhase('choice');
          setMissionProgress(60);
        }
      }, 4000);
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize mission. Please try again.');
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
        
        transcribeAudio(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error: unknown) {
      setError('Could not access microphone. Please check permissions.');
      console.error("Error accessing microphone:", error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
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
      const analysisContext = context;
      let additionalInstructions = '';
      
      if (isCustomMission && customMission) {
        if (customMission.aiNotes) {
          additionalInstructions = `\n\nSpecial Assessment Instructions: ${customMission.aiNotes}`;
        }
      }

      const feedbackResponse = await fetch('/api/analyze-statement-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: selectedStatement.statement,
          position: missionType === 'agreeDisagree' ? userPosition : 'response',
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

    } catch (err: unknown) {
      setError('Failed to process your response. Please try again.');
      console.error('Processing error:', err);
    }
  };

  const copyPromptToClipboard = () => {
    if (!selectedStatement || !editedTranscription) return;
    
    const analysisContext = context;
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

Provide feedback and a polished version in this exact JSON format:
{
  "briefFeedback": "One sentence of encouraging feedback about their ${missionType === 'agreeDisagree' ? 'argument or expression' : 'response or reaction'}",
  "vocabularyImprovements": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "polishedVersion": "A complete, polished version of the student's response using natural English"
}`;

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
    sessionStorage.removeItem('currentCustomMission');
  };

  const goBack = () => {
    sessionStorage.removeItem('currentCustomMission');
    router.push('/land');
  };

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
        <div className="absolute inset-0">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-300/40 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
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
                  Receive AI-powered feedback with polished version
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-300/30">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Rocket className="w-5 h-5 mr-2 text-green-300" />
                Mission Requirements
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Microphone access required. Speak clearly and confidently. You'll receive detailed feedback and a polished version of your response.
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

        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // Loading Phase
  if (currentPhase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
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
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl text-center transform animate-fade-in border border-blue-100">
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

          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
                <blockquote className="text-2xl font-medium text-gray-900 leading-relaxed">
                  &quot;{selectedStatement?.statement}&quot;
                </blockquote>
              </div>
            </div>
          </div>

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

          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium text-gray-700">
                {missionType === 'agreeDisagree' ? 'Statement' : 'Situation'}
              </span>
            </div>
            <p className="text-lg text-gray-800 italic">&quot;{selectedStatement?.statement}&quot;</p>
          </div>

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

  // Transcription Phase
  if (currentPhase === 'transcription') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
              <div className="flex items-center space-x-3">
                <button
                  onClick={copyPromptToClipboard}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    copySuccess 
                      ? 'bg-green-100 text-green-600 scale-110' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                  title="Copy prompt to clipboard"
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Review & Edit Your Response</h1>
            <p className="text-xl text-gray-600 mb-6">
              Review the transcription and make any necessary edits before submission.
            </p>
            <MissionProgressBar />
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium text-gray-700">
                {missionType === 'agreeDisagree' ? 'Statement' : 'Situation'}
              </span>
            </div>
            <p className="text-lg text-gray-800 italic">&quot;{selectedStatement?.statement}&quot;</p>
          </div>

          {recordedAudio && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
                  Your Recording
                </h3>
                <button
                  onClick={playRecording}
                  className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Audio
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Edit3 className="w-6 h-6 mr-3 text-purple-600" />
                Edit Your Transcription
              </h3>
              {transcription && editedTranscription && (
                <div className="text-sm text-gray-500">
                  {editedTranscription.length} characters
                </div>
              )}
            </div>

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
            AI is analyzing your {missionType === 'agreeDisagree' ? 'argument' : 'response'} and preparing detailed feedback with polished version...
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
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mission Complete
              </div>
            </div>
          </div>
        </div>

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
            <p className="text-xl text-gray-600 mb-6">
              {isCustomMission 
                ? `Your custom ${missionType === 'agreeDisagree' ? 'discussion' : 'situational response'} mission report is ready` 
                : 'Here\'s your personalized mission report'
              }
            </p>
            <div className="w-full bg-green-200 rounded-full h-3 mb-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-full"></div>
            </div>
          </div>

          {/* Your Original Response */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Volume2 className="w-6 h-6 text-blue-600 mr-3" />
                Your Original Response
              </h3>
              <button
                onClick={copyPromptToClipboard}
                className={`p-2 rounded-full transition-all duration-200 ${
                  copySuccess 
                    ? 'bg-green-100 text-green-600 scale-110' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                }`}
                title="Copy prompt to clipboard"
              >
                {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-gray-800 leading-relaxed">{editedTranscription}</p>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">AI Mission Analysis</h3>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-6">
              <p className="text-purple-900 text-lg leading-relaxed">{feedback?.briefFeedback}</p>
            </div>
            
            {feedback?.vocabularyImprovements && feedback.vocabularyImprovements.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-yellow-500" />
                  Vocabulary Enhancement Suggestions
                </h4>
                <div className="space-y-3">
                  {feedback.vocabularyImprovements.map((improvement, index) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-yellow-800 leading-relaxed">{improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Polished Version - Shown at the end as requested */}
          {feedback?.polishedVersion && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Polished Version</h3>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-green-900 text-lg leading-relaxed italic">&quot;{feedback.polishedVersion}&quot;</p>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                This is how a native speaker might express your ideas naturally while maintaining your original meaning and intent.
              </p>
            </div>
          )}

          {/* Action Buttons */}
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