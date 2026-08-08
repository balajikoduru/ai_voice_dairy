"use client";

import { useState } from "react";
import { useRecorder, type RecordingResult } from "@/hooks/useRecorder";
import { useLang } from "@/lib/i18n";

interface RecorderProps {
  /** Called when the user saves a finished recording. */
  onSave?: (recording: RecordingResult) => Promise<void>;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export default function Recorder({ onSave }: RecorderProps) {
  const { t } = useLang();
  const {
    status,
    elapsedMs,
    recording,
    error,
    isSupported,
    start,
    pause,
    resume,
    stop,
    discard,
  } = useRecorder();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!onSave || !recording) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(recording);
      discard();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Saving failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 p-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        {t.unsupported}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Timer */}
      <div className="flex items-center gap-3">
        {status === "recording" && (
          <span className="relative flex h-3 w-3" aria-label={t.recordingAria}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        )}
        {status === "paused" && (
          <span
            className="inline-flex h-3 w-3 rounded-full bg-amber-500"
            aria-label={t.pausedAria}
          />
        )}
        <span
          className="font-mono text-4xl tabular-nums tracking-tight"
          role="timer"
        >
          {formatTime(elapsedMs)}
        </span>
      </div>

      {/* Controls per state */}
      {status === "idle" && (
        <button
          onClick={start}
          className={`${buttonBase} bg-red-600 text-white hover:bg-red-700`}
        >
          <MicIcon />
          {t.startRecording}
        </button>
      )}

      {(status === "recording" || status === "paused") && (
        <div className="flex items-center gap-3">
          {status === "recording" ? (
            <button
              onClick={pause}
              className={`${buttonBase} border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800`}
            >
              <PauseIcon />
              {t.pause}
            </button>
          ) : (
            <button
              onClick={resume}
              className={`${buttonBase} border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800`}
            >
              <PlayIcon />
              {t.resume}
            </button>
          )}
          <button
            onClick={stop}
            className={`${buttonBase} bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300`}
          >
            <StopIcon />
            {t.stop}
          </button>
        </div>
      )}

      {status === "stopped" && recording && (
        <div className="flex w-full flex-col items-center gap-4">
          <audio
            src={recording.url}
            controls
            className="w-full"
            aria-label={t.replayAria}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={discard}
              disabled={saving}
              className={`${buttonBase} border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800`}
            >
              {t.recordAgain}
            </button>
            <button
              onClick={handleSave}
              disabled={!onSave || saving}
              className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              {saving ? t.transcribing : t.saveEntry}
            </button>
          </div>
          {saveError && (
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              {saveError}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {t.micDenied}
        </p>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}
