// app/land/LandMapPage.tsx - UPDATED WITH CLICK FIXES
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Zap, ShoppingCart, Building2, Palette, Coffee, GraduationCap, Heart, Plane, Home, TreePine, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMissionCaller } from './missionCaller';
import { createStation, getStation } from '@/lib/firestore-station';

// TypeScript interfaces
interface LocationPosition {
  x: number;
  y: number;
}

interface Location {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  position: LocationPosition;
  color: string;
  hoverColor: string;
  conversations: string[];
}

interface MissionType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface StatementSubType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface MissionData {
  type: string;
  subType: string;
  question?: string;
  aiNotes?: string;
  situation?: string;
  task?: string;
}

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
}

// Location data with icons and positions (unchanged)
const locations: Location[] = [
  {
    id: 'supermarket',
    name: 'Supermarket',
    icon: ShoppingCart,
    position: { x: 25, y: 35 },
    color: 'from-emerald-500 to-green-600',
    hoverColor: 'from-emerald-600 to-green-700',
    conversations: ['Shopping for groceries', 'Asking for prices', 'Finding products']
  },
  {
    id: 'bank',
    name: 'Bank',
    icon: Building2,
    position: { x: 65, y: 25 },
    color: 'from-blue-500 to-indigo-600',
    hoverColor: 'from-blue-600 to-indigo-700',
    conversations: ['Opening an account', 'Making transactions', 'ATM interactions']
  },
  {
    id: 'museum',
    name: 'Museum',
    icon: Palette,
    position: { x: 40, y: 60 },
    color: 'from-purple-500 to-violet-600',
    hoverColor: 'from-purple-600 to-violet-700',
    conversations: ['Buying tickets', 'Asking about exhibits', 'Museum etiquette']
  },
  {
    id: 'cafe',
    name: 'Café',
    icon: Coffee,
    position: { x: 75, y: 70 },
    color: 'from-amber-500 to-orange-600',
    hoverColor: 'from-amber-600 to-orange-700',
    conversations: ['Ordering drinks', 'Asking about menu', 'Small talk with barista']
  },
  {
    id: 'school',
    name: 'School',
    icon: GraduationCap,
    position: { x: 20, y: 75 },
    color: 'from-cyan-500 to-blue-600',
    hoverColor: 'from-cyan-600 to-blue-700',
    conversations: ['Parent-teacher meetings', 'School enrollment', 'Academic discussions']
  },
  {
    id: 'hospital',
    name: 'Hospital',
    icon: Heart,
    position: { x: 50, y: 20 },
    color: 'from-red-500 to-pink-600',
    hoverColor: 'from-red-600 to-pink-700',
    conversations: ['Making appointments', 'Describing symptoms', 'Emergency situations']
  },
  {
    id: 'airport',
    name: 'Airport',
    icon: Plane,
    position: { x: 80, y: 45 },
    color: 'from-slate-500 to-gray-600',
    hoverColor: 'from-slate-600 to-gray-700',
    conversations: ['Check-in procedures', 'Security questions', 'Flight information']
  },
  {
    id: 'home',
    name: 'Residential Area',
    icon: Home,
    position: { x: 15, y: 50 },
    color: 'from-teal-500 to-emerald-600',
    hoverColor: 'from-teal-600 to-emerald-700',
    conversations: ['Neighborhood interactions', 'Apartment hunting', 'Community events']
  }
];

// Mission types for the carousel
const missionTypes: MissionType[] = [
  {
    id: 'statementStellungnahme',
    name: 'Statement Analysis',
    description: 'Analyze and respond to controversial statements',
    icon: '🎯',
    color: 'from-blue-500 to-indigo-600'
  }
];

// Sub-types for statementStellungnahme
const statementSubTypes: StatementSubType[] = [
  {
    id: 'agreeDisagree',
    name: 'I agree/disagree',
    description: 'Analyze a statement and choose your position',
    icon: '⚖️'
  },
  {
    id: 'situationReact',
    name: 'Situation to react for',
    description: 'Respond to a real-life situation',
    icon: '💬'
  }
];

// Animated background elements - Fixed to prevent hydration mismatch
const BackgroundElements = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    const generatedParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: i * 2,
      duration: 4 + Math.random() * 4
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated clouds */}
      <div className="absolute top-8 left-0 w-16 h-8 bg-white/30 rounded-full animate-pulse" 
           style={{ animation: 'float 20s ease-in-out infinite' }} />
      <div className="absolute top-16 right-20 w-12 h-6 bg-white/20 rounded-full animate-pulse" 
           style={{ animation: 'float 25s ease-in-out infinite 5s' }} />
      <div className="absolute top-12 left-1/3 w-20 h-10 bg-white/25 rounded-full animate-pulse" 
           style={{ animation: 'float 30s ease-in-out infinite 10s' }} />
      
      {/* Roads/paths */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(156, 163, 175, 0.3)" />
            <stop offset="100%" stopColor="rgba(107, 114, 128, 0.3)" />
          </linearGradient>
        </defs>
        
        {/* Curved roads connecting locations */}
        <path
          d="M 150 200 Q 300 150 500 180 Q 650 200 750 160"
          stroke="url(#roadGradient)"
          strokeWidth="8"
          fill="none"
          strokeDasharray="20,10"
          className="animate-pulse"
        />
        <path
          d="M 120 300 Q 250 350 400 320 Q 550 290 700 330"
          stroke="url(#roadGradient)"
          strokeWidth="6"
          fill="none"
          strokeDasharray="15,8"
          className="animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <path
          d="M 180 450 Q 320 400 480 430 Q 620 460 760 420"
          stroke="url(#roadGradient)"
          strokeWidth="6"
          fill="none"
          strokeDasharray="15,8"
          className="animate-pulse"
          style={{ animationDelay: '4s' }}
        />
      </svg>
      
      {/* Decorative trees - static positions */}
      <TreePine className="absolute bottom-20 left-10 w-8 h-8 text-green-400/60 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
      <TreePine className="absolute bottom-32 right-16 w-6 h-6 text-green-500/50 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }} />
      <TreePine className="absolute top-1/3 left-1/4 w-5 h-5 text-green-400/40 animate-bounce" style={{ animationDelay: '3s', animationDuration: '5s' }} />
      
      {/* Floating particles - only render after hydration */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-blue-300/30 rounded-full animate-ping"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
    </div>
  );
};

// Location marker component - FIXED VERSION
const LocationMarker = ({ location, onClick, isHovered, onHover, onLeave }: {
  location: Location;
  onClick: (location: Location) => void;
  isHovered: boolean;
  onHover: (id: string) => void;
  onLeave: () => void;
}) => {
  const Icon = location.icon;
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      style={{ 
        left: `${location.position.x}%`, 
        top: `${location.position.y}%`,
        zIndex: 50 // INCREASED from 10 to 50
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        console.log('Location clicked:', location.name);
        onClick(location);
      }}
      onMouseEnter={() => onHover(location.id)}
      onMouseLeave={onLeave}
    >
      {/* Expanded clickable area */}
      <div className="absolute inset-0 w-20 h-20 -m-4 rounded-full" />
      
      {/* Pulsing ring */}
      <div className={`absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br ${location.color} opacity-20 animate-ping group-hover:opacity-30`} />
      
      {/* Main marker */}
      <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${isHovered ? location.hoverColor : location.color} 
                       shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl
                       flex items-center justify-center border-4 border-white/80`}>
        <Icon className="w-6 h-6 text-white drop-shadow-sm" />
        
        {/* Glowing effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
      </div>
      
      {/* Location name tooltip */}
      <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 
                       bg-gray-900/90 text-white text-sm font-medium rounded-lg backdrop-blur-sm
                       transition-all duration-300 whitespace-nowrap border border-white/10 z-10
                       ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        {location.name}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900/90" />
      </div>
    </div>
  );
};

// Lightning button component (unchanged)
const LightningButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-40 h-32 bg-gradient-to-br from-green-400 to-emerald-600 
                 rounded-full shadow-2xl hover:shadow-green-500/25 transform transition-all duration-300 
                 hover:scale-110 active:scale-95 border-4 border-white/20 overflow-hidden group z-50"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-emerald-500 animate-pulse" />
      
      {/* Lightning icon */}
      <div className="relative flex items-center justify-center h-full">
        <Zap className="w-10 h-10 text-white drop-shadow-lg group-hover:animate-bounce" fill="currentColor" />
      </div>
      
      {/* Glowing ring */}
      <div className="absolute inset-0 rounded-full border-2 border-green-300/50 animate-ping" />
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30 
                      transform rotate-45 translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
    </button>
  );
};

// Starbucks Mission Builder button (unchanged)
const StarbucksMissionButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-20 right-6 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 
                 rounded-full shadow-lg hover:shadow-green-500/25 transform transition-all duration-300 
                 hover:scale-110 active:scale-95 border-2 border-white/20 group z-50"
      title="Starbucks Mission Builder"
    >
      <Star className="w-6 h-6 text-white mx-auto group-hover:animate-pulse" />
    </button>
  );
};

// Enhanced Mission Builder Modal (unchanged, keep existing)
const MissionBuilderModal = ({ isOpen, onClose, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missionData: MissionData) => void;
}) => {
  const [selectedMissionType, setSelectedMissionType] = useState(missionTypes[0]);
  const [selectedSubType, setSelectedSubType] = useState(statementSubTypes[0]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Type A fields (agree/disagree)
  const [question, setQuestion] = useState('');
  const [aiNotesA, setAiNotesA] = useState('');
  
  // Type B fields (situation reaction)
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [aiNotesB, setAiNotesB] = useState('');

  const handleSave = () => {
    const missionData: MissionData = {
      type: selectedMissionType.id,
      subType: selectedSubType.id,
      ...(selectedSubType.id === 'agreeDisagree' ? {
        question,
        aiNotes: aiNotesA
      } : {
        situation,
        task,
        aiNotes: aiNotesB
      })
    };
    onSave(missionData);
    onClose();
    // Reset form
    setQuestion('');
    setAiNotesA('');
    setSituation('');
    setTask('');
    setAiNotesB('');
  };

  const isFormValid = () => {
    if (selectedSubType.id === 'agreeDisagree') {
      return question.trim().length > 0;
    } else {
      return situation.trim().length > 0 && task.trim().length > 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Starbucks Mission Builder</h2>
                <p className="text-green-100">Create custom language missions</p>
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

        <div className="p-6">
          {/* Mission Type Carousel */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mission Type</h3>
            <div className="relative">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex-1 mx-4">
                  <div 
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {missionTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`w-full flex-shrink-0 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedMissionType.id === type.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMissionType(type)}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{type.icon}</div>
                          <h4 className="font-semibold text-gray-800 mb-1">{type.name}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setCurrentSlide(Math.min(missionTypes.length - 1, currentSlide + 1))}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  disabled={currentSlide === missionTypes.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub-type Selection (only show for statementStellungnahme) */}
          {selectedMissionType.id === 'statementStellungnahme' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Mission Sub-type</h3>
              <div className="grid grid-cols-2 gap-4">
                {statementSubTypes.map((subType) => (
                  <div
                    key={subType.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSubType.id === subType.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSubType(subType)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{subType.icon}</div>
                      <h4 className="font-semibold text-gray-800 mb-1">{subType.name}</h4>
                      <p className="text-sm text-gray-600">{subType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mission Configuration based on sub-type */}
          <div className="space-y-6">
            {selectedSubType.id === 'agreeDisagree' ? (
              <>
                {/* Type A: Agree/Disagree Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question/Statement *
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                    rows={3}
                    placeholder="Enter the main question or statement for analysis..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Extra Notes (Optional)
                  </label>
                  <textarea
                    value={aiNotesA}
                    onChange={(e) => setAiNotesA(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                    rows={3}
                    placeholder="Additional instructions for AI when creating the mission or assessing responses..."
                  />
                </div>
              </>
            ) : (
              <>
                {/* Type B: Situation Reaction Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Situation *
                  </label>
                  <textarea
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                    rows={2}
                    placeholder="Describe the situation (e.g., 'A friend lost his stuff')"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task *
                  </label>
                  <textarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                    rows={2}
                    placeholder="What should the user do? (e.g., 'React to that', 'Comfort them', 'Give advice')"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Extra Notes (Optional)
                  </label>
                  <textarea
                    value={aiNotesB}
                    onChange={(e) => setAiNotesB(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                    rows={3}
                    placeholder="Additional instructions for AI when creating the scenario or assessing responses..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid()}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isFormValid()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Mission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LandMapPage() {
  const router = useRouter();
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [isMissionBuilderOpen, setIsMissionBuilderOpen] = useState(false);
  
  // Mission caller hook
  const { startStatementMission, startCustomMission } = useMissionCaller();

  // Initialize stations in Firestore when component mounts
  useEffect(() => {
    initializeStations();
  }, []);

  const initializeStations = async () => {
    console.log('Initializing stations...');
    for (const location of locations) {
      try {
        // Check if station already exists
        const existingStation = await getStation(location.id);
        
        if (!existingStation) {
          console.log(`Creating station: ${location.name}`);
          // Create station if it doesn't exist
          await createStation(location.id, {
            name: location.name,
            description: `Practice real-world conversations at ${location.name}. Develop your language skills through immersive scenarios and structured learning paths.`,
            icon: location.name === 'Supermarket' ? '🛒' :
                  location.name === 'Bank' ? '🏦' :
                  location.name === 'Museum' ? '🏛️' :
                  location.name === 'Café' ? '☕' :
                  location.name === 'School' ? '🎓' :
                  location.name === 'Hospital' ? '🏥' :
                  location.name === 'Airport' ? '✈️' :
                  location.name === 'Residential Area' ? '🏠' : '📍'
          });
          console.log(`Station created: ${location.name}`);
        } else {
          console.log(`Station already exists: ${location.name}`);
        }
      } catch (error) {
        console.error(`Error initializing station ${location.id}:`, error);
      }
    }
    console.log('Station initialization complete');
  };

  const handleLocationClick = (location: Location) => {
    console.log('handleLocationClick called with:', location.name);
    console.log('Navigating to:', `/stations/${location.id}`);
    
    // Navigate to the station page
    router.push(`/stations/${location.id}`);
  };

  const handleLightningClick = () => {
    console.log('Lightning button clicked! Starting Statement Mission...');
    // Check if there's a custom mission saved
    const customMission = localStorage.getItem('customMission');
    if (customMission) {
      startCustomMission(JSON.parse(customMission));
    } else {
      startStatementMission();
    }
  };

  const handleSaveCustomMission = (missionData: MissionData) => {
    // Save to localStorage
    localStorage.setItem('customMission', JSON.stringify(missionData));
    console.log('Custom mission saved:', missionData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background elements */}
      <BackgroundElements />
      
      {/* Header */}
      <div className="relative z-20 pt-8 pb-4 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          City Map
        </h1>
        <p className="text-gray-600 text-lg">
          Explore different locations and practice real-world conversations
        </p>
      </div>
      
      {/* Map container */}
      <div className="relative mx-auto max-w-6xl h-[calc(100vh-200px)] bg-gradient-to-br from-green-100/40 via-emerald-50/30 to-blue-100/40 rounded-3xl border border-white/30 backdrop-blur-sm shadow-2xl overflow-hidden" style={{ minHeight: '500px' }}>
        
        {/* Location markers */}
        {locations.map((location) => (
          <LocationMarker
            key={location.id}
            location={location}
            onClick={handleLocationClick}
            isHovered={hoveredLocation === location.id}
            onHover={setHoveredLocation}
            onLeave={() => setHoveredLocation(null)}
          />
        ))}
        
        {/* Decorative elements on the map */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Interactive Locations</span>
        </div>
      </div>
      
      {/* Starbucks Mission Builder button */}
      <StarbucksMissionButton onClick={() => setIsMissionBuilderOpen(true)} />
      
      {/* Lightning button */}
      <LightningButton onClick={handleLightningClick} />
      
      {/* Mission Builder Modal */}
      <MissionBuilderModal
        isOpen={isMissionBuilderOpen}
        onClose={() => setIsMissionBuilderOpen(false)}
        onSave={handleSaveCustomMission}
      />
      
      {/* CSS animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(20px) translateY(0); }
          75% { transform: translateX(10px) translateY(5px); }
        }
      `}</style>
    </div>
  );
}