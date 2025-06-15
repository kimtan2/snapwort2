// components/station/MissionHistoryModal.tsx - IMPROVED VERSION
'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Trophy, 
  Calendar, 
  MessageSquare,
  Star,
  Clock,
  Target,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { 
  getMissionAttempts,
  Mission,
  MissionAttempt
} from '@/lib/firestore-station';

interface MissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission;
  stationId: string;
  skillId: string;
  userId: string;
}

export function MissionHistoryModal({ 
  isOpen, 
  onClose, 
  mission, 
  stationId, 
  skillId, 
  userId 
}: MissionHistoryModalProps) {
  const [attempts, setAttempts] = useState<MissionAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<MissionAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAttempts();
    }
  }, [isOpen, stationId, skillId, mission.id, userId]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading attempts for mission:', mission.id);
      
      const attemptsData = await getMissionAttempts(stationId, skillId, mission.id, userId);
      console.log('Attempts loaded:', attemptsData);
      
      setAttempts(attemptsData);
      
      // Auto-select the most recent attempt if available
      if (attemptsData.length > 0 && !selectedAttempt) {
        setSelectedAttempt(attemptsData[0]);
      }
    } catch (err) {
      console.error('Error loading attempts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAverageScore = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length);
  };

  const getBestScore = () => {
    if (attempts.length === 0) return 0;
    return Math.max(...attempts.map(attempt => attempt.score));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Mission History</h2>
                <p className="text-purple-100 truncate max-w-md">{mission.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-full max-h-[calc(90vh-100px)]">
          {/* Left Panel - Attempts List */}
          <div className="w-full md:w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-blue-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-xl font-bold text-gray-900">{attempts.length}</div>
              </div>
              
              <div className="text-center bg-green-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-sm text-gray-600">Best</div>
                <div className="text-xl font-bold text-gray-900">{getBestScore()}</div>
              </div>
              
              <div className="text-center bg-purple-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-sm text-gray-600">Average</div>
                <div className="text-xl font-bold text-gray-900">{getAverageScore()}</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">All Attempts</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-600">Loading attempts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-red-600 mb-2">Error Loading History</h4>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button
                  onClick={loadAttempts}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">No Attempts Yet</h4>
                <p className="text-gray-500">Complete this mission to see your history here.</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-700 text-sm">
                    💡 <strong>Tip:</strong> Start the mission and complete it to track your progress and improvement over time!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt, index) => (
                  <button
                    key={attempt.id}
                    onClick={() => setSelectedAttempt(attempt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAttempt?.id === attempt.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Attempt #{attempts.length - index}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(attempt.score)}`}>
                        {attempt.score}/100
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(attempt.completedAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Attempt Details */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto">
            {selectedAttempt ? (
              <div className="space-y-6">
                {/* Attempt Header */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(selectedAttempt.score)}`}>
                    <Trophy className="w-5 h-5 mr-2" />
                    Score: {selectedAttempt.score}/100
                  </div>
                  <div className="flex items-center justify-center text-gray-500 mt-2">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDate(selectedAttempt.completedAt)}
                  </div>
                </div>

                {/* Your Response */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-800">Your Response</h4>
                  </div>
                  <p className="text-blue-900 leading-relaxed">"{selectedAttempt.userResponse}"</p>
                </div>

                {/* Polished Version */}
                {selectedAttempt.polishedVersion && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center mb-3">
                      <Star className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800">Polished Version</h4>
                    </div>
                    <p className="text-green-900 leading-relaxed italic">"{selectedAttempt.polishedVersion}"</p>
                  </div>
                )}

                {/* Feedback */}
                {selectedAttempt.feedback && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center mb-3">
                      <Target className="w-5 h-5 text-purple-600 mr-2" />
                      <h4 className="font-semibold text-purple-800">AI Feedback</h4>
                    </div>
                    <p className="text-purple-900 leading-relaxed">{selectedAttempt.feedback}</p>
                  </div>
                )}
              </div>
            ) : attempts.length > 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">Select an Attempt</h4>
                  <p className="text-gray-500">Choose an attempt from the list to view details.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">Ready to Start?</h4>
                  <p className="text-gray-500 mb-4">Complete your first attempt to see detailed feedback and track your progress.</p>
                  <button
                    onClick={onClose}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Start Mission
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}