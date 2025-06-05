'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Zap, ShoppingCart, Building2, Palette, Coffee, GraduationCap, Heart, Plane, Home, Car, TreePine } from 'lucide-react';

// Location data with icons and positions
const locations = [
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

// Animated background elements
const BackgroundElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
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
      
      {/* Decorative trees */}
      <TreePine className="absolute bottom-20 left-10 w-8 h-8 text-green-400/60 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
      <TreePine className="absolute bottom-32 right-16 w-6 h-6 text-green-500/50 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }} />
      <TreePine className="absolute top-1/3 left-1/4 w-5 h-5 text-green-400/40 animate-bounce" style={{ animationDelay: '3s', animationDuration: '5s' }} />
      
      {/* Floating particles */}
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-blue-300/30 rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${4 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  );
};

// Location marker component
const LocationMarker = ({ location, onClick, isHovered, onHover, onLeave }: {
  location: any;
  onClick: (location: any) => void;
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
        zIndex: 10
      }}
      onClick={() => onClick(location)}
      onMouseEnter={() => onHover(location.id)}
      onMouseLeave={onLeave}
    >
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
                       transition-all duration-300 whitespace-nowrap border border-white/10
                       ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        {location.name}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900/90" />
      </div>
    </div>
  );
};

// Lightning button component
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

// Location modal component
const LocationModal = ({ location, isOpen, onClose }: {
  location: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !location) return null;
  
  const Icon = location.icon;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className={`p-6 bg-gradient-to-br ${location.color} text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{location.name}</h2>
              <p className="text-white/80">Practice conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <span className="text-white text-xl">×</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Available Scenarios:</h3>
          <div className="space-y-3">
            {location.conversations.map((conversation: string, index: number) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{conversation}</span>
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
          >
            Start Practice
          </button>
        </div>
      </div>
    </div>
  );
};

export default function LandMapPage() {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleLightningClick = () => {
    // Handle lightning button action - could trigger a special mode or quick practice
    console.log('Lightning button clicked! Starting quick practice mode...');
    // You could implement a random location selector or special practice mode here
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
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
      
      {/* Lightning button */}
      <LightningButton onClick={handleLightningClick} />
      
      {/* Location modal */}
      <LocationModal
        location={selectedLocation}
        isOpen={isModalOpen}
        onClose={closeModal}
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