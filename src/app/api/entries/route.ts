import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase, AUDIO_BUCKET } from "@/lib/supabase";
import { processAudio } from "@/lib/gemini";
import { serverErrorResponse } from "@/lib/api";

// Gemini processing can take a while for longer recordings.
export const maxDuration = 60;

// Stay under Vercel's 4.5 MB request body limit; at 32 kbps opus this is
// roughly 17 minutes of audio.
const MAX_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
};

export async function POST(req: Request) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Expected multipart form data with an audio file." },
        { status: 400 }
      );
    }

    const file = form.get("audio");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Missing audio file." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Recording too large — please keep entries under ~15 minutes." },
        { status: 413 }
      );
    }

    const durationRaw = Number(form.get("durationSeconds"));
    const durationSeconds =
      Number.isFinite(durationRaw) && durationRaw > 0
        ? Math.round(durationRaw)
        : null;

    // The client sends its local calendar date so diary days follow the
    // user's timezone, not the server's.
    const entryDateRaw = String(form.get("entryDate") ?? "");
    const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(entryDateRaw)
      ? entryDateRaw
      : new Date().toISOString().slice(0, 10);

    const mimeType = (file.type || "audio/webm").split(";")[0];
    const buffer = Buffer.from(await file.arrayBuffer());

    const processed = await processAudio(buffer, mimeType);
    if (!processed.raw_transcript.trim() || !processed.clean_transcript.trim()) {
      return NextResponse.json(
        { error: "No speech detected in the recording." },
        { status: 422 }
      );
    }

    const supabase = getSupabase();

    // Audio is a nice-to-have next to the transcript — keep the entry even
    // if the upload fails.
    let audioUrl: string | null = null;
    const path = `${entryDate}/${randomUUID()}.${EXTENSIONS[mimeType] ?? "webm"}`;
    const { error: uploadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(path, buffer, { contentType: mimeType });
    if (uploadError) {
      console.error("Audio upload failed:", uploadError.message);
    } else {
      audioUrl = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path)
        .data.publicUrl;
    }

    const { data, error } = await supabase
      .from("entries")
      .insert({
        entry_date: entryDate,
        audio_url: audioUrl,
        duration_seconds: durationSeconds,
        raw_transcript: processed.raw_transcript,
        clean_transcript: processed.clean_transcript,
        category: processed.category,
        language: processed.language,
      })
      .select()
      .single();
    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return serverErrorResponse("POST /api/entries", e);
  }
}

export async function GET(req: Request) {
  try {
    const date = new URL(req.url).searchParams.get("date");

    let query = getSupabase()
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (date) {
      query = query.eq("entry_date", date);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json(data);
  } catch (e) {
    return serverErrorResponse("GET /api/entries", e);
  }
}
