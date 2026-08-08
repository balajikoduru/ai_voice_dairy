"use client";

import Recorder from "@/components/Recorder";
import type { RecordingResult } from "@/hooks/useRecorder";
import type { DiaryEntry } from "@/lib/types";
import { localDateString } from "@/lib/dates";

interface EntryCaptureProps {
  onSaved: (entry: DiaryEntry) => void;
}

export default function EntryCapture({ onSaved }: EntryCaptureProps) {
  const handleSave = async (recording: RecordingResult) => {
    const form = new FormData();
    const ext = recording.mimeType.includes("mp4")
      ? "m4a"
      : recording.mimeType.includes("ogg")
        ? "ogg"
        : "webm";
    form.append("audio", recording.blob, `entry.${ext}`);
    form.append("durationSeconds", String(recording.durationSeconds));
    form.append("entryDate", localDateString());

    const res = await fetch("/api/entries", { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? `Save failed (HTTP ${res.status}).`);
    }
    onSaved(await res.json());
  };

  return <Recorder onSave={handleSave} />;
}
