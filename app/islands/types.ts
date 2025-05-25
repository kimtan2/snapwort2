export type VocabularyItem = {
  type: 'phrase' | 'expression' | 'vocabulary';
  text: string;
  meaning: string;
};

export type Question = {
  id: number;
  title: string;
  question: string;
  hints: string[];
  vocabulary?: VocabularyItem[];
};

export type SavedVocabularyItem = VocabularyItem & {
  id: string;
  dateAdded: Date; // Changed from string to Date for better type safety
  subtopicId: string;
};

// Type for serialized vocabulary items (used in localStorage)
export type SerializedSavedVocabularyItem = Omit<SavedVocabularyItem, 'dateAdded'> & {
  dateAdded: string; // ISO string for serialization
};

export type Subtopic = {
  id: string;
  name: string;
  icon: string;
  questions: Question[];
};

export type Island = {
  id: string;
  name: string;
  icon: string;
  position: { x: number; y: number };
  color: string;
  description: string;
  subtopics: Record<string, Subtopic>;
};

export type IslandsData = Record<string, Island>;
