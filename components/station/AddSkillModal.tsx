// components/station/AddSkillModal.tsx
'use client';

import React, { useState } from 'react';
import { X, BookOpen, Save } from 'lucide-react';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skillData: { name: string; description: string }) => void;
}

export function AddSkillModal({ isOpen, onClose, onSave }: AddSkillModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        name: name.trim(),
        description: description.trim()
      });
      
      // Reset form
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Error saving skill:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  const isFormValid = name.trim().length > 0 && description.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add New Skill</h2>
                <p className="text-blue-100">Create a new learning skill for this station</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Skill Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="e.g., Business Conversations, Daily Interactions, Travel Scenarios..."
                maxLength={100}
                disabled={isSubmitting}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {name.length}/100
              </div>
            </div>

            {/* Skill Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none transition-all"
                rows={4}
                placeholder="Describe what this skill will focus on and what learners will practice..."
                maxLength={500}
                disabled={isSubmitting}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {description.length}/500
              </div>
            </div>

            {/* Skill Examples */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Skill Ideas</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div><strong>Business Communication:</strong> Practice meetings, presentations, negotiations</div>
                <div><strong>Daily Conversations:</strong> Small talk, asking for help, making appointments</div>
                <div><strong>Travel & Tourism:</strong> Hotel bookings, directions, cultural exchanges</div>
                <div><strong>Academic Discussions:</strong> Debates, presentations, group discussions</div>
                <div><strong>Social Interactions:</strong> Making friends, party conversations, expressing opinions</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Create Skill
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}