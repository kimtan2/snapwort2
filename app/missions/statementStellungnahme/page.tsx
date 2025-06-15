// app/missions/statementStellungnahme/page.tsx - COMPLETE VERSION
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, MessageSquare, Mic, Square, Play, RotateCcw, ThumbsUp, ThumbsDown, 
  Send, Sparkles, Award, Volume2, Clock, Users, Edit3, Copy, CheckCircle, 
  Target, Shield, Zap, Star, FileText, Brain, Rocket, Heart, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { data } from '../../land/data/statementStellungnahmeData';
import { createMissionAttempt } from '@/lib/firestore-station';

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
  polishedVersion: string;
}

interface CustomMission {
  type: string;
  subType: string;
  question?: string;
  situation?: string;
  task?: string;
  aiNotes?: string;
}

interface StationMissionContext {
  stationId: string;
  skillId: string;
  missionId: string;
  missionData: CustomMission;
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
  const [stationMissionContext, setStationMissionContext] = useState<StationMissionContext | null>(null);
  const [isStationMission, setIsStationMission] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // User ID - in a real app, this would come from authentication
  const userId = 'default-user';

  // Initialize mission on component mount
  useEffect(() => {
    console.log('Component mounted, checking for missions...');
    
    // Check for station mission first
    const stationMissionData = sessionStorage.getItem('currentStationMission');
    if (stationMissionData) {
      try {
        const parsedStationMission = JSON.parse(stationMissionData);
        console.log('Station mission loaded:', parsedStationMission);
        
        setStationMissionContext(parsedStationMission);
        setIsStationMission(true);
        setCustomMission(parsedStationMission.missionData);
        setIsCustomMission(true);
        
        // Set mission type immediately
        const determinedMissionType = parsedStationMission.missionData.subType === 'situationReact' ? 'situationReact' : 'agreeDisagree';
        setMissionType(determinedMissionType);
        
        console.log('Station mission type set to:', determinedMissionType);
      } catch (error: unknown) {
        console.error('Error parsing station mission:', error);
        setError('Failed to load station mission data.');
      }
    } else {
      // Check if there's a custom mission in sessionStorage (legacy)
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
    }
    
    // Start with briefing phase
    setMissionProgress(10);
  }, []);

  const initializeMission = async () => {
    console.log('Initializing mission...', { isCustomMission, customMission, missionType, isStationMission });
    
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
        
        // Clean up session storage for non-station missions
        if (!isStationMission) {
          sessionStorage.removeItem('currentCustomMission');
        }
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

  const resetRecording = () => {
    setRecordedAudio(null);
    setAudioUrl(null);
    setTranscription('');
    setEditedTranscription('');
    setIsRecording(false);
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

      // Save mission attempt to Firestore if this is a station mission
      if (isStationMission && stationMissionContext) {
        try {
          await createMissionAttempt(
            stationMissionContext.stationId,
            stationMissionContext.skillId,
            stationMissionContext.missionId,
            {
              userId,
              userResponse: editedTranscription,
              feedback: feedbackData.briefFeedback,
              polishedVersion: feedbackData.polishedVersion,
              score: 85 // You could calculate this based on feedback quality
            }
          );
          console.log('Mission attempt saved to Firestore');
        } catch (saveError) {
          console.error('Error saving mission attempt:', saveError);
          // Don't fail the mission if saving fails
        }
      }

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
    setStationMissionContext(null);
    setIsStationMission(false);
    sessionStorage.removeItem('currentCustomMission');
    sessionStorage.removeItem('currentStationMission');
  };

  const goBack = () => {
    sessionStorage.removeItem('currentCustomMission');
    sessionStorage.removeItem('currentStationMission');
    
    if (isStationMission && stationMissionContext) {
      // Go back to the station page
      router.push(`/stations/${stationMissionContext.stationId}`);
    } else {
      // Go back to the land map
      router.push('/land');
    }
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
                {isStationMission ? <Target className="w-12 h-12 text-white" /> :
                 isCustomMission ? <Star className="w-12 h-12 text-white" /> : 
                 <Target className="w-12 h-12 text-white" />}
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              {isStationMission ? `Station Mission: ${missionType === 'agreeDisagree' ? 'Statement Analysis' : 'Situation Response'}` :
               isCustomMission ? `Custom Mission: ${missionType === 'agreeDisagree' ? 'Statement Analysis' : 'Situation Response'}` : 
               'Mission: Statement Analysis'}
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              {isStationMission 
                ? `Agent, you have been assigned a station mission. Complete this ${missionType === 'agreeDisagree' ? 'discussion challenge' : 'situational response'} to advance your skills.`
                : isCustomMission 
                  ? `Agent, you have been assigned a custom ${missionType === 'agreeDisagree' ? 'discussion mission' : 'situational response mission'} based on your specifications.`
                  : 'Agent, you have been assigned a critical discussion mission. Your task is to analyze a controversial statement and provide a compelling argument.'
              }
            </p>
            
            {isStationMission && stationMissionContext && (
              <div className="mt-6 bg-blue-500/20 rounded-2xl p-4 border border-blue-400/30">
                <h3 className="text-blue-300 font-semibold mb-2">Station Mission Parameters</h3>
                <p className="text-blue-100 text-sm">
                  Station: {stationMissionContext.stationId} | Skill: {stationMissionContext.skillId}
                </p>
              </div>
            )}
            
            {isCustomMission && customMission && !isStationMission && (
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
              {isStationMission ? <Target className="w-6 h-6 mr-3" /> :
               isCustomMission ? <Star className="w-6 h-6 mr-3" /> : 
               <Target className="w-6 h-6 mr-3" />}
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
            {isStationMission ? 'Generating Station Mission' :
             isCustomMission ? 'Generating Custom Mission' : 
             'Mission Intel Loading'}
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            {isStationMission 
              ? `Preparing your station ${missionType === 'agreeDisagree' ? 'discussion' : 'situational response'} scenario...`
              : isCustomMission 
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

  // Context Phase
  if (currentPhase === 'context') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mx-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl mb-6">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Mission Context</h1>
            <div className="bg-blue-500/20 rounded-2xl p-6 border border-blue-400/30 mb-6">
              <p className="text-blue-100 text-lg leading-relaxed">{context}</p>
            </div>
            {selectedStatement && (
              <div className="bg-green-500/20 rounded-2xl p-6 border border-green-400/30">
                <h3 className="text-green-300 font-semibold mb-3">
                  {missionType === 'agreeDisagree' ? 'Statement to Analyze' : 'Situation'}
                </h3>
                <p className="text-green-100 text-lg leading-relaxed">"{selectedStatement.statement}"</p>
              </div>
            )}
          </div>
          <MissionProgressBar />
        </div>
      </div>
    );
  }

  // Choice Phase (for agree/disagree missions)
  if (currentPhase === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center relative overflow-hidden">
        <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mx-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl mb-6">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-6">Choose Your Position</h1>
            {selectedStatement && (
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 mb-8">
                <p className="text-white text-lg leading-relaxed">"{selectedStatement.statement}"</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handlePositionChoice('agree')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-6 rounded-2xl font-semibold text-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
              >
                <ThumbsUp className="w-8 h-8 mx-auto mb-3" />
                I Agree
              </button>
              
              <button
                onClick={() => handlePositionChoice('disagree')}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white p-6 rounded-2xl font-semibold text-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
              >
                <ThumbsDown className="w-8 h-8 mx-auto mb-3" />
                I Disagree
              </button>
            </div>
          </div>
          <MissionProgressBar />
        </div>
      </div>
    );
  }

  // Recording Phase
  if (currentPhase === 'recording') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mx-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl mb-6">
              <Mic className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Record Your Response</h1>
            
            {/* Show context and statement */}
            <div className="bg-blue-500/20 rounded-2xl p-4 border border-blue-400/30 mb-4">
              <p className="text-blue-100 text-sm">{context}</p>
            </div>
            
            {selectedStatement && (
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 mb-8">
                <h3 className="text-green-300 font-semibold mb-3">
                  {missionType === 'agreeDisagree' ? `Statement (Your position: ${userPosition})` : 'Situation'}
                </h3>
                <p className="text-white text-lg leading-relaxed">"{selectedStatement.statement}"</p>
              </div>
            )}

            {/* Recording Controls */}
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
          </div>
          <MissionProgressBar />
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>
    );
  }

  // Transcription Phase
  if (currentPhase === 'transcription') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
        <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mx-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl mb-6 animate-pulse">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Review & Edit Transcription</h1>
            <p className="text-blue-200 text-lg mb-8">
              Your speech has been converted to text. Please review and edit if needed.
            </p>
            
            {transcription && (
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
                <h3 className="text-green-300 font-semibold mb-3">Original Transcription:</h3>
                <p className="text-white text-lg italic">{transcription}</p>
              </div>
            )}
            
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 className="text-blue-300 font-semibold mb-3">Edit Your Response:</h3>
              <textarea
                value={editedTranscription}
                onChange={(e) => setEditedTranscription(e.target.value)}
                className="w-full p-4 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 min-h-[120px] resize-none focus:outline-none focus:border-blue-400"
                placeholder="Your transcribed response will appear here..."
              />
              
              <button
                onClick={submitResponse}
                disabled={!editedTranscription.trim()}
                className={`mt-4 flex items-center justify-center mx-auto px-8 py-3 rounded-xl font-semibold text-lg shadow-2xl transform transition-all duration-300 hover:scale-105 ${
                  editedTranscription.trim()
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-6 h-6 mr-2" />
                Submit Response
              </button>
            </div>
          </div>
          <MissionProgressBar />
        </div>
      </div>
    );
  }

  // Processing Phase
  if (currentPhase === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center relative overflow-hidden">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mx-4">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl mb-8 animate-spin">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Processing Response</h1>
            <p className="text-purple-200 text-lg mb-8">
              AI is analyzing your response and generating personalized feedback...
            </p>
            <MissionProgressBar />
          </div>
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
                {isStationMission ? 'Back to Station' : 'Back to Map'}
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
              {isStationMission 
                ? `Your station ${missionType === 'agreeDisagree' ? 'discussion' : 'situational response'} mission report is ready`
                : isCustomMission 
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

          {/* Polished Version */}
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
              {isStationMission ? 'Return to Station' : 'Return to Base'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback return null
  return null;
}