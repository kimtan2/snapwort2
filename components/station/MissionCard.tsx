// components/station/MissionCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  History, 
  Trash2, 
  CheckCircle, 
  Clock,
  MessageSquare,
  Target,
  Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MissionHistoryModal } from './MissionHistoryModal';
import { 
  getMissionCompletionStatus,
  Mission,
  MissionAttempt
} from '@/lib/firestore-station';

interface MissionCardProps {
  mission: Mission;
  stationId: string;
  skillId: string;
  onDelete: () => void;
}

export function MissionCard({ mission, stationId, skillId, onDelete }: MissionCardProps) {
  const router = useRouter();
  const [completionStatus, setCompletionStatus] = useState<{
    completed: boolean;
    lastAttempt?: MissionAttempt;
  }>({ completed: false });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  // User ID - in a real app, this would come from authentication
  const userId = 'default-user';

  useEffect(() => {
    loadCompletionStatus();
  }, [stationId, skillId, mission.id]);

  const loadCompletionStatus = async () => {
    try {
      setLoading(true);
      const status = await getMissionCompletionStatus(stationId, skillId, mission.id, userId);
      setCompletionStatus(status);
    } catch (err) {
      console.error('Error loading completion status:', err);
    } finally {
      setLoading(false);
    }
  };

  const startMission = () => {
    // Store mission data in sessionStorage for the mission component to access
    const missionContext = {
      stationId,
      skillId,
      missionId: mission.id,
      missionData: mission.data
    };
    sessionStorage.setItem('currentStationMission', JSON.stringify(missionContext));
    sessionStorage.setItem('currentCustomMission', JSON.stringify(mission.data));
    
    // Navigate to the mission page
    router.push('/missions/statementStellungnahme');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getMissionTypeIcon = () => {
    return mission.type === 'agreeDisagree' ? MessageSquare : Target;
  };

  const getMissionTypeColor = () => {
    return mission.type === 'agreeDisagree' 
      ? 'from-blue-500 to-indigo-600' 
      : 'from-purple-500 to-pink-600';
  };

  const getMissionTypeName = () => {
    return mission.type === 'agreeDisagree' ? 'Discussion' : 'Situation';
  };

  const TypeIcon = getMissionTypeIcon();

  return (
    <>
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-300">
        {/* Mission Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            {/* Mission Type Icon */}
            <div className={`w-10 h-10 bg-gradient-to-br ${getMissionTypeColor()} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            
            {/* Mission Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h5 className="font-semibold text-gray-900 truncate">{mission.title}</h5>
                {completionStatus.completed && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="bg-gray-200 px-2 py-1 rounded-full font-medium">
                  {getMissionTypeName()}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(mission.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-2">
            {completionStatus.completed && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                title="View History"
              >
                <History className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
              title="Delete Mission"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mission Preview */}
        <div className="bg-white rounded-lg p-3 mb-3 border border-gray-100">
          <p className="text-sm text-gray-700 line-clamp-2">
            {mission.type === 'agreeDisagree' 
              ? mission.data.question 
              : `${mission.data.situation} - ${mission.data.task}`
            }
          </p>
        </div>

        {/* Completion Status & Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : completionStatus.completed ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="font-medium">Completed</span>
                {completionStatus.lastAttempt && (
                  <span className="text-gray-500 ml-2">
                    Score: {completionStatus.lastAttempt.score}/100
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 font-medium">Not started</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {completionStatus.completed ? (
              <button
                onClick={startMission}
                className="flex items-center bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Redo
              </button>
            ) : (
              <button
                onClick={startMission}
                className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mission History Modal */}
      <MissionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        mission={mission}
        stationId={stationId}
        skillId={skillId}
        userId={userId}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Mission</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this mission? All progress and attempts will be lost. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}