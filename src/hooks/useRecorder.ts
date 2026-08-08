"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

export type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

export interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  durationSeconds: number;
}

// Ordered by preference: opus/webm is small (~150 KB/min) and what Chrome,
// Edge, and Firefox produce; Safari falls back to mp4/AAC.
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

const emptySubscribe = () => () => {};

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Client-only capability check; the server snapshot assumes support so the
  // recorder UI prerenders and the rare unsupported browser swaps post-hydration.
  const isSupported = useSyncExternalStore(
    emptySubscribe,
    () =>
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined",
    () => true
  );

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // Elapsed time is tracked manually because webm blobs report
  // `Infinity` duration in <audio> elements (Chromium bug 642012).
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlRef = useRef<string | null>(null);

  const currentElapsed = useCallback(
    () =>
      accumulatedMsRef.current +
      (segmentStartRef.current !== null
        ? Date.now() - segmentStartRef.current
        : 0),
    []
  );

  const stopTicker = useCallback(() => {
    if (tickerRef.current !== null) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    tickerRef.current = setInterval(() => setElapsedMs(currentElapsed()), 200);
  }, [stopTicker, currentElapsed]);

  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // Cleanup on unmount only (all deps are stable useCallbacks).
  useEffect(() => {
    return () => {
      stopTicker();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
        recorder.stream.getTracks().forEach((t) => t.stop());
      }
      releaseUrl();
    };
  }, [stopTicker, releaseUrl]);

  const start = useCallback(async () => {
    setError(null);
    releaseUrl();
    setRecording(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("mic-denied");
      return;
    }

    const mimeType = MIME_CANDIDATES.find((t) =>
      MediaRecorder.isTypeSupported(t)
    );
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 32_000,
    });

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setRecording({
        blob,
        url,
        mimeType: type,
        durationSeconds: Math.round(accumulatedMsRef.current / 1000),
      });
      stream.getTracks().forEach((t) => t.stop());
    };

    recorderRef.current = recorder;
    accumulatedMsRef.current = 0;
    segmentStartRef.current = Date.now();
    setElapsedMs(0);
    recorder.start(250);
    setStatus("recording");
    startTicker();
  }, [releaseUrl, startTicker]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    accumulatedMsRef.current = currentElapsed();
    segmentStartRef.current = null;
    stopTicker();
    setElapsedMs(accumulatedMsRef.current);
    setStatus("paused");
  }, [currentElapsed, stopTicker]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    segmentStartRef.current = Date.now();
    startTicker();
    setStatus("recording");
  }, [startTicker]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    accumulatedMsRef.current = currentElapsed();
    segmentStartRef.current = null;
    stopTicker();
    setElapsedMs(accumulatedMsRef.current);
    recorder.stop(); // onstop assembles the blob and sets `recording`
    setStatus("stopped");
  }, [currentElapsed, stopTicker]);

  const discard = useCallback(() => {
    releaseUrl();
    setRecording(null);
    setElapsedMs(0);
    accumulatedMsRef.current = 0;
    setStatus("idle");
  }, [releaseUrl]);

  return {
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
  };
}
