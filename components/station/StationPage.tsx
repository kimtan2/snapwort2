// components/station/StationPage.tsx - FIXED VERSION
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  MapPin, 
  BookOpen, 
  Target,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SkillBlock } from './SkillBlock';
import { AddSkillModal } from './AddSkillModal';
import { 
  getStation, 
  getSkills, 
  createSkill, 
  deleteSkill,
  createStation,
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
  const [retryCount, setRetryCount] = useState(0);

  // Station data mapping for fallback creation
  const stationDefaults: Record<string, { name: string; description: string; icon: string }> = {
    'supermarket': {
      name: 'Supermarket',
      description: 'Practice real-world conversations at the Supermarket. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '🛒'
    },
    'bank': {
      name: 'Bank', 
      description: 'Practice real-world conversations at the Bank. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '🏦'
    },
    'museum': {
      name: 'Museum',
      description: 'Practice real-world conversations at the Museum. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '🏛️'
    },
    'cafe': {
      name: 'Café',
      description: 'Practice real-world conversations at the Café. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '☕'
    },
    'school': {
      name: 'School',
      description: 'Practice real-world conversations at the School. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '🎓'
    },
    'hospital': {
      name: 'Hospital',
      description: 'Practice real-world conversations at the Hospital. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '🏥'
    },
    'airport': {
      name: 'Airport',
      description: 'Practice real-world conversations at the Airport. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '✈️'
    },
    'home': {
      name: 'Residential Area',
      description: 'Practice real-world conversations in the Residential Area. Develop your language skills through immersive scenarios and structured learning paths.',
      icon: '🏠'
    }
  };

  // Load station and skills data
  useEffect(() => {
    loadStationData();
  }, [stationId, retryCount]);

  const loadStationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading station data for:', stationId);

      // Try to get station info
      let stationData = await getStation(stationId);
      
      // If station doesn't exist, create it
      if (!stationData) {
        console.log('Station not found, creating it...');
        
        const stationInfo = stationDefaults[stationId];
        if (!stationInfo) {
          setError(`Unknown station: ${stationId}`);
          return;
        }

        // Create the station
        await createStation(stationInfo);
        console.log('Station created, fetching again...');
        
        // Wait a moment for Firestore consistency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to get it again
        stationData = await getStation(stationId);
        
        if (!stationData) {
          console.error('Failed to create or retrieve station');
          setError('Failed to initialize station');
          return;
        }
      }

      console.log('Station loaded:', stationData);
      setStation(stationData);

      // Load skills
      console.log('Loading skills...');
      const skillsData = await getSkills(stationId);
      console.log('Skills loaded:', skillsData);
      setSkills(skillsData);
      
    } catch (err) {
      console.error('Error loading station data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load station data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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
        <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center max-w-md">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Station</h3>
          <p className="text-gray-600 text-center">
            {retryCount > 0 ? 'Retrying...' : 'Please wait while we load your learning station...'}
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Attempt {retryCount + 1}</p>
          )}
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
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
            <button
              onClick={goBack}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              Back to Map
            </button>
          </div>
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

        {/* Error Alert (if any) */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

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