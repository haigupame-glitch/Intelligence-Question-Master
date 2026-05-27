export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_in_blank"
  | "matching"
  | "word_meaning"
  | "jumble"
  | "missing_letter"
  | "short_answer";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string;
  marks: number;
  complexity?: string;
}

export interface Quiz {
  id?: string;
  createdAt?: string;
  title: string;
  questions: Question[];
  examType?: string;
  chapterName?: string;
  totalMarks?: number;
  duration?: number;
  subject?: string;
  classLevel?: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
}
