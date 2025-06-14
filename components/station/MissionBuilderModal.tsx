// components/station/MissionBuilderModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Star, ChevronLeft, ChevronRight, Save } from 'lucide-react';

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
  situation?: string;
  task?: string;
  aiNotes?: string;
}

interface MissionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missionData: MissionData) => void;
}

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

export function MissionBuilderModal({ isOpen, onClose, onSave }: MissionBuilderModalProps) {
  const [selectedMissionType, setSelectedMissionType] = useState(missionTypes[0]);
  const [selectedSubType, setSelectedSubType] = useState(statementSubTypes[0]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Type A fields (agree/disagree)
  const [question, setQuestion] = useState('');
  const [aiNotesA, setAiNotesA] = useState('');
  
  // Type B fields (situation reaction)
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [aiNotesB, setAiNotesB] = useState('');

  const handleSave = async () => {
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
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
      
      await onSave(missionData);
      
      // Reset form
      setQuestion('');
      setAiNotesA('');
      setSituation('');
      setTask('');
      setAiNotesB('');
    } catch (error) {
      console.error('Error saving mission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuestion('');
    setAiNotesA('');
    setSituation('');
    setTask('');
    setAiNotesB('');
    setIsSubmitting(false);
    onClose();
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
                <h2 className="text-2xl font-bold">Mission Builder</h2>
                <p className="text-green-100">Create custom language missions</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
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
                  disabled={currentSlide === 0 || isSubmitting}
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
                        onClick={() => !isSubmitting && setSelectedMissionType(type)}
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
                  disabled={currentSlide === missionTypes.length - 1 || isSubmitting}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub-type Selection */}
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
                    onClick={() => !isSubmitting && setSelectedSubType(subType)}
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

          {/* Mission Configuration */}
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
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {question.length}/500
                  </div>
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
                    maxLength={300}
                    disabled={isSubmitting}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {aiNotesA.length}/300
                  </div>
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
                    maxLength={300}
                    disabled={isSubmitting}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {situation.length}/300
                  </div>
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
                    maxLength={300}
                    disabled={isSubmitting}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {task.length}/300
                  </div>
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
                    maxLength={300}
                    disabled={isSubmitting}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {aiNotesB.length}/300
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid() || isSubmitting}
              className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                isFormValid() && !isSubmitting
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Mission
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}