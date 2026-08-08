"use client";

import { useCallback, useEffect, useState } from "react";
import EntryCapture from "@/components/EntryCapture";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Timeline from "@/components/Timeline";
import { LanguageProvider, useLang } from "@/lib/i18n";
import type { DailySummary, DiaryEntry } from "@/lib/types";

export default function DiaryApp() {
  return (
    <LanguageProvider>
      <DiaryInner />
    </LanguageProvider>
  );
}

async function fetchDiary(): Promise<{
  entries: DiaryEntry[];
  summaries: Record<string, DailySummary>;
}> {
  const [entriesRes, summariesRes] = await Promise.all([
    fetch("/api/entries"),
    fetch("/api/summaries"),
  ]);
  if (!entriesRes.ok || !summariesRes.ok) {
    const failed = entriesRes.ok ? summariesRes : entriesRes;
    const body = await failed.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to load diary (HTTP ${failed.status}).`);
  }
  const [entryList, summaryList] = (await Promise.all([
    entriesRes.json(),
    summariesRes.json(),
  ])) as [DiaryEntry[], DailySummary[]];
  return {
    entries: entryList,
    summaries: Object.fromEntries(summaryList.map((s) => [s.entry_date, s])),
  };
}

function DiaryInner() {
  const { t } = useLang();
  const [entries, setEntries] = useState<DiaryEntry[] | null>(null);
  const [summaries, setSummaries] = useState<Record<string, DailySummary>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [summarizingDate, setSummarizingDate] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<{
    date: string;
    message: string;
  } | null>(null);

  const load = useCallback(() => {
    fetchDiary()
      .then((diary) => {
        setEntries(diary.entries);
        setSummaries(diary.summaries);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load diary.");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = useCallback((entry: DiaryEntry) => {
    setEntries((prev) => [entry, ...(prev ?? [])]);
    setLastSavedId(entry.id);
  }, []);

  const handleSummarize = useCallback(async (date: string) => {
    setSummarizingDate(date);
    setSummaryError(null);
    try {
      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Summary failed (HTTP ${res.status}).`);
      }
      const summary = (await res.json()) as DailySummary;
      setSummaries((prev) => ({ ...prev, [date]: summary }));
    } catch (e) {
      setSummaryError({
        date,
        message: e instanceof Error ? e.message : "Summary failed.",
      });
    } finally {
      setSummarizingDate(null);
    }
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full justify-end">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl" aria-hidden>
          🎙️
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">{t.appTitle}</h1>
        <p className="max-w-md text-balance text-sm text-neutral-500 dark:text-neutral-400">
          {t.tagline}
        </p>
      </div>

      <EntryCapture onSaved={handleSaved} />
      <Timeline
        entries={entries}
        error={loadError}
        onRetry={load}
        highlightId={lastSavedId}
        summaries={summaries}
        summarizingDate={summarizingDate}
        summaryError={summaryError}
        onSummarize={handleSummarize}
      />
    </div>
  );
}
