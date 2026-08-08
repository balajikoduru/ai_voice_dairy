export const CATEGORIES = [
  "Ideas",
  "Memories",
  "Reflections",
  "Reminders",
  "Important Events",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface DiaryEntry {
  id: string;
  created_at: string;
  entry_date: string;
  audio_url: string | null;
  duration_seconds: number | null;
  raw_transcript: string;
  clean_transcript: string;
  category: Category;
  language: string;
}

export interface DailySummary {
  entry_date: string;
  summary: string;
  language: string;
  updated_at: string;
}
