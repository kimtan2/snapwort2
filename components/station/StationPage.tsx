// components/station/StationPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  MapPin, 
  BookOpen, 
  Target,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SkillBlock } from './SkillBlock';
import { AddSkillModal } from './AddSkillModal';
import { 
  getStation, 
  getSkills, 
  createSkill, 
  deleteSkill,
  Station, 
  Skill 
} from '@/lib/firestore-station';

interface StationPageProps {
  stationId: string;
}

export function StationPage({ stationId }: StationPageProps) {
  const router = useRouter();
  const [station, setStation] = useState<Station | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load station and skills data
  useEffect(() => {
    loadStationData();
  }, [stationId]);

  const loadStationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load station info
      const stationData = await getStation(stationId);
      if (!stationData) {
        setError('Station not found');
        return;
      }
      setStation(stationData);

      // Load skills
      const skillsData = await getSkills(stationId);
      setSkills(skillsData);
    } catch (err) {
      console.error('Error loading station data:', err);
      setError('Failed to load station data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (skillData: { name: string; description: string }) => {
    try {
      const skillId = await createSkill(stationId, skillData);
      const newSkill: Skill = {
        id: skillId,
        ...skillData,
        stationId,
        createdAt: new Date()
      };
      setSkills(prev => [newSkill, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding skill:', err);
      setError('Failed to add skill');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      await deleteSkill(stationId, skillId);
      setSkills(prev => prev.filter(skill => skill.id !== skillId));
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError('Failed to delete skill');
    }
  };

  const goBack = () => {
    router.push('/land');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Station</h3>
          <p className="text-gray-600">Please wait while we load your learning station...</p>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Station Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Station not found'}</p>
          <button
            onClick={goBack}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Map
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl">{station.icon}</div>
                <div className="text-sm text-gray-600 font-medium">{station.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Station Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl text-4xl text-white mb-6 shadow-2xl">
            {station.icon}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{station.name}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {station.description}
          </p>
        </div>

        {/* Skills Header with Add Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Learning Skills</h2>
          </div>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Skill
          </button>
        </div>

        {/* Skills Grid */}
        {skills.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-4">No Skills Yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Create your first learning skill to start building missions and tracking your progress.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-6 h-6 mr-3 inline" />
              Create Your First Skill
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <SkillBlock
                key={skill.id}
                skill={skill}
                stationId={stationId}
                onDelete={() => handleDeleteSkill(skill.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      <AddSkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddSkill}
      />
    </div>
  );
}