"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Category } from "@/lib/types";

export type UILang = "en" | "hi" | "te";

export const UI_LANGS: { code: UILang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
];

/** BCP-47 locales for date/time formatting per UI language. */
const LOCALES: Record<UILang, string> = {
  en: "en",
  hi: "hi-IN",
  te: "te-IN",
};

export interface Strings {
  appTitle: string;
  tagline: string;
  startRecording: string;
  pause: string;
  resume: string;
  stop: string;
  recordAgain: string;
  saveEntry: string;
  transcribing: string;
  micDenied: string;
  unsupported: string;
  replayAria: string;
  recordingAria: string;
  pausedAria: string;
  loading: string;
  empty: string;
  tryAgain: string;
  today: string;
  yesterday: string;
  dailySummary: string;
  summarizeDay: string;
  summarizing: string;
  updateSummary: string;
  updating: string;
  showRaw: string;
  showClean: string;
  playAria: string;
  categories: Record<Category, string>;
}

const STRINGS: Record<UILang, Strings> = {
  en: {
    appTitle: "AI Voice Diary",
    tagline:
      "Speak your mind. Your words are transcribed, cleaned up, categorized, and summarized — one diary day at a time.",
    startRecording: "Start recording",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    recordAgain: "Record again",
    saveEntry: "Save entry",
    transcribing: "Transcribing…",
    micDenied:
      "Microphone access was denied. Allow microphone access in your browser and try again.",
    unsupported:
      "Your browser doesn't support audio recording. Try a recent version of Chrome, Edge, Firefox, or Safari.",
    replayAria: "Replay your recording",
    recordingAria: "Recording",
    pausedAria: "Paused",
    loading: "Loading your diary…",
    empty: "No entries yet — record your first note above.",
    tryAgain: "Try again",
    today: "Today",
    yesterday: "Yesterday",
    dailySummary: "✨ Daily summary",
    summarizeDay: "✨ Summarize this day",
    summarizing: "Summarizing…",
    updateSummary: "New entries since — update",
    updating: "Updating…",
    showRaw: "Show original with fillers",
    showClean: "Show cleaned transcript",
    playAria: "Play this entry's recording",
    categories: {
      Ideas: "Ideas",
      Memories: "Memories",
      Reflections: "Reflections",
      Reminders: "Reminders",
      "Important Events": "Important Events",
    },
  },
  hi: {
    appTitle: "AI वॉइस डायरी",
    tagline:
      "मन की बात बोलिए। आपके शब्द ट्रांसक्राइब होकर साफ़ किए जाते हैं, श्रेणियों में बँटते हैं और हर दिन का सारांश बनता है।",
    startRecording: "रिकॉर्डिंग शुरू करें",
    pause: "पॉज़ करें",
    resume: "जारी रखें",
    stop: "रोकें",
    recordAgain: "फिर से रिकॉर्ड करें",
    saveEntry: "एंट्री सहेजें",
    transcribing: "ट्रांसक्राइब हो रहा है…",
    micDenied:
      "माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र में माइक्रोफ़ोन की अनुमति देकर फिर से कोशिश करें।",
    unsupported:
      "आपका ब्राउज़र ऑडियो रिकॉर्डिंग सपोर्ट नहीं करता। Chrome, Edge, Firefox या Safari का नया संस्करण आज़माएँ।",
    replayAria: "अपनी रिकॉर्डिंग सुनें",
    recordingAria: "रिकॉर्डिंग",
    pausedAria: "रुका हुआ",
    loading: "आपकी डायरी लोड हो रही है…",
    empty: "अभी कोई एंट्री नहीं — ऊपर अपनी पहली रिकॉर्डिंग करें।",
    tryAgain: "फिर से कोशिश करें",
    today: "आज",
    yesterday: "कल",
    dailySummary: "✨ दैनिक सारांश",
    summarizeDay: "✨ इस दिन का सारांश बनाएँ",
    summarizing: "सारांश बन रहा है…",
    updateSummary: "नई एंट्रियाँ आई हैं — अपडेट करें",
    updating: "अपडेट हो रहा है…",
    showRaw: "फ़िलर शब्दों के साथ मूल देखें",
    showClean: "साफ़ ट्रांसक्रिप्ट देखें",
    playAria: "इस एंट्री की रिकॉर्डिंग चलाएँ",
    categories: {
      Ideas: "विचार",
      Memories: "यादें",
      Reflections: "मनन",
      Reminders: "रिमाइंडर",
      "Important Events": "महत्वपूर्ण घटनाएँ",
    },
  },
  te: {
    appTitle: "AI వాయిస్ డైరీ",
    tagline:
      "మీ మనసులోని మాట చెప్పండి. మీ మాటలు ట్రాన్స్‌క్రైబ్ అయ్యి, శుభ్రమై, వర్గీకరించబడి — ప్రతి రోజు సారాంశంగా మారతాయి.",
    startRecording: "రికార్డింగ్ ప్రారంభించండి",
    pause: "పాజ్ చేయండి",
    resume: "కొనసాగించండి",
    stop: "ఆపండి",
    recordAgain: "మళ్లీ రికార్డ్ చేయండి",
    saveEntry: "ఎంట్రీ సేవ్ చేయండి",
    transcribing: "ట్రాన్స్‌క్రైబ్ అవుతోంది…",
    micDenied:
      "మైక్రోఫోన్ అనుమతి లభించలేదు. బ్రౌజర్‌లో మైక్రోఫోన్ అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.",
    unsupported:
      "మీ బ్రౌజర్ ఆడియో రికార్డింగ్‌ను సపోర్ట్ చేయదు. Chrome, Edge, Firefox లేదా Safari తాజా వెర్షన్ ప్రయత్నించండి.",
    replayAria: "మీ రికార్డింగ్ వినండి",
    recordingAria: "రికార్డింగ్",
    pausedAria: "పాజ్‌లో ఉంది",
    loading: "మీ డైరీ లోడ్ అవుతోంది…",
    empty: "ఇంకా ఎంట్రీలు లేవు — పైన మీ మొదటి నోట్ రికార్డ్ చేయండి.",
    tryAgain: "మళ్లీ ప్రయత్నించండి",
    today: "ఈరోజు",
    yesterday: "నిన్న",
    dailySummary: "✨ రోజువారీ సారాంశం",
    summarizeDay: "✨ ఈ రోజు సారాంశం రూపొందించండి",
    summarizing: "సారాంశం అవుతోంది…",
    updateSummary: "కొత్త ఎంట్రీలు వచ్చాయి — అప్డేట్ చేయండి",
    updating: "అప్డేట్ అవుతోంది…",
    showRaw: "ఫిల్లర్ పదాలతో అసలు చూడండి",
    showClean: "శుభ్రమైన ట్రాన్స్‌క్రిప్ట్ చూడండి",
    playAria: "ఈ ఎంట్రీ రికార్డింగ్ ప్లే చేయండి",
    categories: {
      Ideas: "ఐడియాలు",
      Memories: "జ్ఞాపకాలు",
      Reflections: "ఆలోచనలు",
      Reminders: "రిమైండర్లు",
      "Important Events": "ముఖ్యమైన సంఘటనలు",
    },
  },
};

const STORAGE_KEY = "diary-ui-lang";

// Tiny external store around localStorage: useSyncExternalStore keeps the
// saved choice hydration-safe (server snapshot is "en") and in sync across
// every subscribed component.
const langListeners = new Set<() => void>();

function readLang(): UILang {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" || saved === "hi" || saved === "te" ? saved : "en";
}

function subscribeLang(listener: () => void) {
  langListeners.add(listener);
  return () => {
    langListeners.delete(listener);
  };
}

function writeLang(next: UILang) {
  localStorage.setItem(STORAGE_KEY, next);
  langListeners.forEach((listener) => listener());
}

interface LangContextValue {
  lang: UILang;
  setLang: (lang: UILang) => void;
  t: Strings;
  locale: string;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: STRINGS.en,
  locale: LOCALES.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => "en" as const);
  const setLang = useCallback((next: UILang) => writeLang(next), []);

  return (
    <LangContext.Provider
      value={{ lang, setLang, t: STRINGS[lang], locale: LOCALES[lang] }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
