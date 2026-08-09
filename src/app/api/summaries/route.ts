import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { summarizeEntries } from "@/lib/gemini";
import { serverErrorResponse } from "@/lib/api";
import type { Category } from "@/lib/types";

export const maxDuration = 60;

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("daily_summaries")
      .select("*")
      .order("entry_date", { ascending: false })
      .limit(200);
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json(data);
  } catch (e) {
    return serverErrorResponse("GET /api/summaries", e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const date =
      typeof body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : null;
    if (!date) {
      return NextResponse.json(
        { error: "Provide a date as YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data: entries, error } = await supabase
      .from("entries")
      .select("category, clean_transcript")
      .eq("entry_date", date)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "No entries for this day yet." },
        { status: 404 }
      );
    }

    const result = await summarizeEntries(
      entries.map((e) => ({
        category: e.category as Category,
        text: e.clean_transcript,
      }))
    );

    const { data: row, error: upsertError } = await supabase
      .from("daily_summaries")
      .upsert({
        entry_date: date,
        summary: result.summary,
        language: result.language,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (upsertError) {
      throw new Error(`Saving summary failed: ${upsertError.message}`);
    }

    return NextResponse.json(row);
  } catch (e) {
    return serverErrorResponse("POST /api/summaries", e);
  }
}
