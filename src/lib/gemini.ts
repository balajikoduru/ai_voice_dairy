import "server-only";
import { CATEGORIES, type Category } from "@/lib/types";

export interface ProcessedTranscript {
  raw_transcript: string;
  clean_transcript: string;
  category: Category;
  language: string;
}

export interface DailySummaryResult {
  summary: string;
  language: string;
}

const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

async function callGemini(parts: GeminiPart[], responseSchema: object): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY — see .env.example");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}

const TRANSCRIBE_PROMPT = `You will receive one audio recording: a personal voice diary entry.

Tasks:
1. raw_transcript — transcribe the speech verbatim in the language spoken, including filler words and stutters. Use the language's native script (Devanagari for Hindi, Telugu script for Telugu). If there is no discernible speech, return an empty string.
2. clean_transcript — the same transcript with filler words removed (English: "um", "uh", "ah", "hmm", "er", and "like"/"you know" only when used as filler; Hindi: "मतलब", "वो", "अं", "हाँ तो"; Telugu: "అంటే", "మరి", "అదే", "ఏంటంటే"; and similar in any language), stutters and immediate word repetitions removed, and natural punctuation added. Do NOT paraphrase, summarize, or otherwise change the speaker's words.
3. category — exactly one of: Ideas, Memories, Reflections, Reminders, Important Events. Reminders are things to do or remember; Important Events are notable happenings (appointments, milestones, news); Memories recall the past; Ideas are new thoughts or plans; Reflections are feelings and musings.
4. language — the primary language spoken, as an ISO 639-1 code such as "en", "hi", or "te".`;

const TRANSCRIBE_SCHEMA = {
  type: "OBJECT",
  properties: {
    raw_transcript: { type: "STRING" },
    clean_transcript: { type: "STRING" },
    category: { type: "STRING", enum: [...CATEGORIES] },
    language: { type: "STRING" },
  },
  required: ["raw_transcript", "clean_transcript", "category", "language"],
};

/**
 * One Gemini call does all four AI tasks for an entry: transcription,
 * filler-word removal, categorization, and language detection.
 */
export async function processAudio(
  audio: Buffer,
  mimeType: string
): Promise<ProcessedTranscript> {
  const text = await callGemini(
    [
      { inlineData: { mimeType, data: audio.toString("base64") } },
      { text: TRANSCRIBE_PROMPT },
    ],
    TRANSCRIBE_SCHEMA
  );

  const parsed = JSON.parse(text) as ProcessedTranscript;
  if (!CATEGORIES.includes(parsed.category)) {
    parsed.category = "Reflections";
  }
  return parsed;
}

const SUMMARY_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    language: { type: "STRING" },
  },
  required: ["summary", "language"],
};

/** Summarize one day's diary entries into a short first-person recap. */
export async function summarizeEntries(
  entries: { category: Category; text: string }[]
): Promise<DailySummaryResult> {
  const list = entries
    .map((e, i) => `${i + 1}. (${e.category}) ${e.text}`)
    .join("\n");

  const prompt = `You will receive one day's personal voice diary entries in chronological order, each labeled with its category.

Tasks:
1. summary — a cohesive first-person summary of the day in 2–4 sentences, as if the diarist wrote it. Capture the main activities, thoughts, and feelings, and keep any reminders or important events explicit so they aren't lost. Write it in the language most used in the entries, in that language's native script (Hindi → Devanagari, Telugu → Telugu script).
2. language — ISO 639-1 code of the summary's language, such as "en", "hi", or "te".

Entries:
${list}`;

  const text = await callGemini([{ text: prompt }], SUMMARY_SCHEMA);
  return JSON.parse(text) as DailySummaryResult;
}
