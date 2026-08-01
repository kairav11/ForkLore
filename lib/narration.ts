import type { StoryNode, WordMark } from '@/lib/types';

/**
 * Never narrate more than this many lines in one scene. It mirrors the recorder
 * (story-media MAX_NARRATED_LINES): if the two disagree, the app either waits
 * forever for clips that will never be recorded, or plays clip N against line N
 * of a different set.
 */
export const MAX_NARRATED_LINES = 5;

/** A line the recorder voices: its text, and where it sits in the scene. */
export interface NarratedLine {
  /** Index of the line as the scene renders it. */
  line: number;
  text: string;
}

/**
 * The lines of a scene that get a recording, in the exact order the recorder
 * makes them — empty lines dropped, capped, and falling back to the whole-scene
 * transcript for scenes written before dialogue existed.
 *
 * Clip N of `audioUrls` belongs to entry N here. Deriving both the player's
 * queue and the "is this scene voiced yet" check from this one function is what
 * keeps the spoken line and the highlighted line the same line.
 */
export function narratedLines(node: StoryNode | null): NarratedLine[] {
  if (!node) return [];

  const lines = node.lines
    .map((line, index) => ({ line: index, text: line.text.trim() }))
    .filter((entry) => entry.text.length > 0)
    .slice(0, MAX_NARRATED_LINES);
  if (lines.length > 0) return lines;

  const text = node.text.trim();
  return text.length > 0 ? [{ line: 0, text }] : [];
}

/** One recorded clip, tied to the line it speaks. */
export interface NarrationClip {
  url: string;
  /** The text spoken in this clip — the line it was recorded from. */
  text: string;
  /** Recorded word timings, or null when the provider gave no alignment. */
  marks: WordMark[] | null;
  /** Index of the line this clip speaks, as the scene renders it. */
  line: number;
}

/**
 * A scene's narration queue. Clips beyond the narrated lines are ignored rather
 * than played against the wrong text, so a stale recording can never speak a
 * line the scene no longer has.
 */
export function narrationClips(node: StoryNode | null): NarrationClip[] {
  if (!node) return [];
  const lines = narratedLines(node);

  return node.audioUrls.slice(0, lines.length).map((url, index) => ({
    url,
    text: lines[index].text,
    marks: node.audioMarks[index] ?? null,
    line: lines[index].line,
  }));
}

/**
 * True when every narrated line has its clip. A partial set — the recorder ran
 * out of time, or lines were written after the first recording — is not done and
 * gets topped up on the next visit.
 */
export function isFullyNarrated(node: StoryNode | null): boolean {
  if (!node) return true;
  const lines = narratedLines(node);
  return lines.length === 0 || node.audioUrls.length >= lines.length;
}
