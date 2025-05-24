export type Question = {
  id: number;
  title: string;
  question: string;
  hints: string[];
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
