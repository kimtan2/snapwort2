// components/station/SkillBlock.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Trash2, 
  Plus,
  Target,
  Trophy,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MissionCard } from './MissionCard';
import { MissionBuilderModal } from './MissionBuilderModal';
import { 
  getMissions, 
  createMission, 
  deleteMission,
  Skill, 
  Mission 
} from '@/lib/firestore-station';

interface SkillBlockProps {
  skill: Skill;
  stationId: string;
  onDelete: () => void;
}

interface MissionData {
  type: string;
  subType: string;
  question?: string;
  situation?: string;
  task?: string;
  aiNotes?: string;
}

export function SkillBlock({ skill, stationId, onDelete }: SkillBlockProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMissionBuilderOpen, setIsMissionBuilderOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load missions for this skill
  useEffect(() => {
    loadMissions();
  }, [stationId, skill.id]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const missionsData = await getMissions(stationId, skill.id);
      setMissions(missionsData);
    } catch (err) {
      console.error('Error loading missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMission = async (missionData: MissionData) => {
    try {
      const title = missionData.subType === 'agreeDisagree' 
        ? `Discussion: ${missionData.question?.substring(0, 50)}...`
        : `Situation: ${missionData.situation?.substring(0, 50)}...`;

      const missionId = await createMission(stationId, skill.id, {
        title,
        type: missionData.subType as 'agreeDisagree' | 'situationReact',
        data: missionData
      });

      const newMission: Mission = {
        id: missionId,
        title,
        type: missionData.subType as 'agreeDisagree' | 'situationReact',
        data: missionData,
        skillId: skill.id,
        stationId,
        createdAt: new Date()
      };

      setMissions(prev => [newMission, ...prev]);
      setIsMissionBuilderOpen(false);
    } catch (err) {
      console.error('Error adding mission:', err);
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    try {
      await deleteMission(stationId, skill.id, missionId);
      setMissions(prev => prev.filter(m => m.id !== missionId));
    } catch (err) {
      console.error('Error deleting mission:', err);
    }
  };

  const handleDeleteSkill = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const completedMissions = missions.length; // You can enhance this with actual completion tracking
  const totalMissions = missions.length;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Skill Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{skill.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{skill.description}</p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setIsMissionBuilderOpen(true)}
                className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                title="Add Mission"
              >
                <Star className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                title="Delete Skill"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600">Missions</div>
              <div className="text-lg font-bold text-gray-900">{totalMissions}</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-lg font-bold text-gray-900">{completedMissions}</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600">Created</div>
              <div className="text-lg font-bold text-gray-900">
                {skill.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Missions Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Missions ({missions.length})
            </h4>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMissionBuilderOpen(true)}
                className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Mission
              </button>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Missions List */}
          {isExpanded && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading missions...</p>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h5 className="text-lg font-medium text-gray-600 mb-2">No Missions Yet</h5>
                  <p className="text-gray-500 text-sm mb-4">
                    Create your first mission to start practicing!
                  </p>
                  <button
                    onClick={() => setIsMissionBuilderOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Mission
                  </button>
                </div>
              ) : (
                missions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    stationId={stationId}
                    skillId={skill.id}
                    onDelete={() => handleDeleteMission(mission.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mission Builder Modal */}
      <MissionBuilderModal
        isOpen={isMissionBuilderOpen}
        onClose={() => setIsMissionBuilderOpen(false)}
        onSave={handleAddMission}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Skill</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{skill.name}"? This will also delete all missions and progress. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSkill}
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