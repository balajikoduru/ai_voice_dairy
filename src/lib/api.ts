import { NextResponse } from "next/server";

/**
 * Uniform 500 handler: full details go to the server log; the client gets a
 * generic message in production so internal errors (which can embed config
 * values) never reach the browser. Dev keeps the real message for debugging.
 */
export function serverErrorResponse(context: string, e: unknown) {
  console.error(`${context} failed:`, e);
  const message =
    process.env.NODE_ENV === "development" && e instanceof Error
      ? e.message
      : "Something went wrong on the server. Please try again.";
  return NextResponse.json({ error: message }, { status: 500 });
}
