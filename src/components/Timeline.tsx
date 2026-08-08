"use client";

import { useState } from "react";
import type { Category, DailySummary, DiaryEntry } from "@/lib/types";
import { formatDayLabel, formatTimeOfDay } from "@/lib/dates";
import { useLang } from "@/lib/i18n";

export const CATEGORY_STYLES: Record<Category, string> = {
  Ideas: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Memories: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Reflections:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Reminders: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Important Events":
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

interface TimelineProps {
  entries: DiaryEntry[] | null;
  error: string | null;
  onRetry: () => void;
  highlightId?: string | null;
  summaries: Record<string, DailySummary>;
  summarizingDate: string | null;
  summaryError: { date: string; message: string } | null;
  onSummarize: (date: string) => void;
}

function groupByDay(entries: DiaryEntry[]): [string, DiaryEntry[]][] {
  const days = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const list = days.get(entry.entry_date) ?? [];
    list.push(entry);
    days.set(entry.entry_date, list);
  }
  return [...days.entries()].sort(([a], [b]) => b.localeCompare(a));
}

export default function Timeline({
  entries,
  error,
  onRetry,
  highlightId,
  summaries,
  summarizingDate,
  summaryError,
  onSummarize,
}: TimelineProps) {
  const { t, locale } = useLang();

  if (error) {
    return (
      <div className="flex w-full flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {t.tryAgain}
        </button>
      </div>
    );
  }

  if (entries === null) {
    return (
      <p className="py-8 text-sm text-neutral-400 dark:text-neutral-500">
        {t.loading}
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-8 text-sm text-neutral-400 dark:text-neutral-500">
        {t.empty}
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {groupByDay(entries).map(([date, dayEntries]) => (
        <section key={date} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {formatDayLabel(date, locale, t.today, t.yesterday)}
          </h2>
          <DaySummary
            date={date}
            summary={summaries[date]}
            newestEntryAt={dayEntries[0]?.created_at}
            busy={summarizingDate === date}
            error={summaryError?.date === date ? summaryError.message : null}
            onSummarize={onSummarize}
          />
          <div className="flex flex-col gap-3">
            {dayEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                highlighted={entry.id === highlightId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DaySummary({
  date,
  summary,
  newestEntryAt,
  busy,
  error,
  onSummarize,
}: {
  date: string;
  summary?: DailySummary;
  newestEntryAt?: string;
  busy: boolean;
  error: string | null;
  onSummarize: (date: string) => void;
}) {
  const { t } = useLang();

  // A summary is stale when an entry was recorded after it was generated.
  const stale =
    !!summary &&
    !!newestEntryAt &&
    new Date(summary.updated_at) < new Date(newestEntryAt);

  if (!summary) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSummarize(date)}
          disabled={busy}
          className="self-start rounded-full border border-indigo-200 px-4 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950"
        >
          {busy ? t.summarizing : t.summarizeDay}
        </button>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 dark:border-indigo-950 dark:bg-indigo-950/40">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
          {t.dailySummary}
        </span>
        {stale && (
          <button
            onClick={() => onSummarize(date)}
            disabled={busy}
            className="text-xs text-indigo-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-400"
          >
            {busy ? t.updating : t.updateSummary}
          </button>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-indigo-950 dark:text-indigo-100">
        {summary.summary}
      </p>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  highlighted,
}: {
  entry: DiaryEntry;
  highlighted: boolean;
}) {
  const { t, locale } = useLang();
  const [showRaw, setShowRaw] = useState(false);

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow dark:bg-neutral-900 ${
        highlighted
          ? "border-emerald-400 ring-2 ring-emerald-200 dark:border-emerald-600 dark:ring-emerald-900"
          : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_STYLES[entry.category]}`}
        >
          {t.categories[entry.category] ?? entry.category}
        </span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {formatTimeOfDay(entry.created_at, locale)}
          {entry.duration_seconds != null && ` · ${entry.duration_seconds}s`}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {showRaw ? entry.raw_transcript : entry.clean_transcript}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          onClick={() => setShowRaw((v) => !v)}
          className="text-xs text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
        >
          {showRaw ? t.showClean : t.showRaw}
        </button>
      </div>

      {entry.audio_url && (
        <audio
          src={entry.audio_url}
          controls
          preload="none"
          className="mt-3 h-10 w-full"
          aria-label={t.playAria}
        />
      )}
    </article>
  );
}
