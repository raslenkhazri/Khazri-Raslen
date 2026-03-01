
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  DICTATION = 'DICTATION',
  VOCABULARY = 'VOCABULARY',
  SENTENCE_BUILDER = 'SENTENCE_BUILDER',
  TUTOR = 'TUTOR',
  SAVED_WORDS = 'SAVED_WORDS'
}

export interface WordEntry {
  word: string;
  translation: string;
  definition: string;
  example: string;
  type: string; // noun, verb, adj, etc.
}

export interface DictationSession {
  content: string;
  audioData?: string;
  difficulty: 'B1' | 'B2';
}

export interface SentenceChallenge {
  targetSentence: string;
  scrambledWords: string[];
  context: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
