export type VocabularyItem = {
  type: 'phrase' | 'expression' | 'vocabulary';
  text: string;
  meaning: string;
};

export type VocabularyHints = {
  category: string;
  expressions: string[];
};

export type Question = {
  id: number;
  title: string;
  question: string;
  sampleAnswer?: string;
  hints: string[];
  vocabulary?: VocabularyItem[];
  vocabularyHints?: VocabularyHints[];
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

// Updated type for attempt tracking with new feedback structure
export type Attempt = {
  id: string;
  questionId: number;
  subtopicId: string;
  islandId: string;
  userId: string;
  userAnswer: string;
  score: number;
  revised_polished_version: string;
  natural_chunks: Array<{
    category: string;
    expressions: string[];
  }>;
  isTextInput: boolean;
  timestamp: Date;
};

// Updated feedback type for the new structure
export type TextFeedback = {
  score: number;
  revised_polished_version: string;
  natural_chunks: Array<{
    category: string;
    expressions: string[];
  }>;
};