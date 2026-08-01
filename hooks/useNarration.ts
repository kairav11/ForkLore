import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

import type { StoryNode, WordMark } from '@/lib/types';
import { countWords } from '@/lib/utils';

/** Everything the hook needs about a scene's narration. Memoise it. */
export interface NarrationSource {
  /** One clip per narrated line, in reading order. */
  urls: readonly string[];
  /** Recorded word timings per clip, same order; null where none were recorded. */
  marks: readonly (WordMark[] | null)[];
  /** The text of each narrated line, used to estimate timings when none exist. */
  texts: readonly string[];
}

export interface Narration {
  hasAudio: boolean;
  isPlaying: boolean;
  /** The line being narrated, -1 before playback starts. */
  activeLine: number;
  /** The word inside that line, -1 while its timing is still unknown. */
  activeWord: number;
  /** How far through the active line, 0 to 1 — what the panel scrolls by. */
  lineProgress: number;
  toggle: () => void;
  stop: () => void;
}

/** How often the playhead is read while a scene is playing. */
const TICK_MS = 90;
/** How close to the end counts as finished when no finish event arrives. */
const END_TOLERANCE_S = 0.35;
/** Extra weight, in characters, given to a word that ends a clause. */
const PAUSE_WEIGHT = 3;

interface Timing {
  start: number;
  end: number;
}

interface Cursor {
  line: number;
  word: number;
  progress: number;
}

const IDLE: Cursor = { line: -1, word: -1, progress: 0 };

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Word timings guessed from the clip's length, for scenes recorded before the
 * voice provider returned an alignment. Longer words take longer, and a word
 * that closes a clause is given the pause that follows it.
 */
function estimateTimings(text: string, duration: number): Timing[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0 || duration <= 0) return [];

  const weights = words.map(
    (word) => word.length + 1 + (/[,.;:!?…—]$/.test(word) ? PAUSE_WEIGHT : 0),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let elapsed = 0;
  return weights.map((weight) => {
    const start = (elapsed / total) * duration;
    elapsed += weight;
    return { start, end: (elapsed / total) * duration };
  });
}

/** The last word whose start has passed. */
function wordAt(timings: Timing[], time: number): number {
  let index = -1;
  for (let position = 0; position < timings.length; position += 1) {
    if (timings[position].start > time) break;
    index = position;
  }
  return index;
}

/**
 * Plays a scene's narrated lines back to back over the ambient loop, and reports
 * which line and word are being spoken so the text can follow along.
 *
 * Three traps this hook exists to avoid:
 *
 * 1. `useAudioPlayerStatus` returns the LAST status event, and `didJustFinish`
 *    stays true after a clip ends. Reading it in an effect meant the first tap on
 *    the next scene saw a stale "finished" flag and skipped straight to line two
 *    — so a scene whose first line is narration and second line is dialogue
 *    played only the dialogue. Finishes are therefore taken from real player
 *    events and de-duplicated against the clip they belong to.
 * 2. On web the player does not reliably emit a finished status at all, so the
 *    same tick that follows the words acts as a safety net: paused, at the end,
 *    still in a play session means that line is done.
 * 3. Recorded word timings only line up with the text when both sides split it
 *    the same way, so a mark set whose length does not match the line's word
 *    count is discarded rather than drifting one word out for the whole line.
 */
export function useNarration(source: NarrationSource): Narration {
  const player = useAudioPlayer(null);

  // Compare by content, not array identity: the story object is re-read while
  // media is generated and must not interrupt playback of an unchanged scene.
  const key = source.urls.join('|');
  const queue = useMemo(() => (key.length > 0 ? key.split('|') : []), [key]);

  const lines = useRef<string[]>(queue);
  const lineIndex = useRef(0);
  /** The url currently sitting in the player, or null when it holds a stale one. */
  const loaded = useRef<string | null>(null);
  /** The url whose finish has already been acted on, so it never fires twice. */
  const finished = useRef<string | null>(null);
  const playing = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursor, setCursor] = useState<Cursor>(IDLE);

  // Latest timings and texts, read inside the tick without restarting it.
  const timingSource = useRef(source);
  useEffect(() => {
    timingSource.current = source;
  }, [source]);

  /** Estimates are kept per clip and clip length, so they are computed once. */
  const estimates = useRef(new Map<string, Timing[]>());

  const setPlaying = useCallback((value: boolean) => {
    playing.current = value;
    setIsPlaying(value);
  }, []);

  /** Loads and plays one line. Returns false when that line does not exist. */
  const playLine = useCallback(
    (index: number): boolean => {
      const url = lines.current[index];
      if (!url) return false;
      lineIndex.current = index;
      loaded.current = url;
      finished.current = null;
      setCursor({ line: index, word: -1, progress: 0 });
      player.replace({ uri: url });
      player.play();
      setPlaying(true);
      return true;
    },
    [player, setPlaying],
  );

  const rewind = useCallback(() => {
    lineIndex.current = 0;
    loaded.current = null;
    finished.current = null;
    setCursor(IDLE);
    setPlaying(false);
  }, [setPlaying]);

  /** The current line ended: move to the next one, or stop after the last. */
  const onLineFinished = useCallback(() => {
    const current = loaded.current;
    if (!playing.current || current === null || finished.current === current) return;
    finished.current = current;
    if (!playLine(lineIndex.current + 1)) {
      // Played to the end: the next tap starts the scene over.
      player.pause();
      rewind();
    }
  }, [playLine, player, rewind]);

  // Reset when the scene changes, so the next tap reloads instead of resuming
  // wherever the previous scene's narration was left. A queue that merely grew —
  // a later line of the same scene finished recording — is not a scene change and
  // must not cut off what is playing.
  useEffect(() => {
    const previous = lines.current;
    const grew =
      queue.length > previous.length && previous.every((url, index) => queue[index] === url);
    lines.current = queue;
    if (grew && playing.current) return;
    rewind();
    player.pause();
  }, [queue, player, rewind]);

  // Real player events: the only trustworthy source of "this clip ended".
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) onLineFinished();
    });
    return () => subscription.remove();
  }, [player, onLineFinished]);

  /** Recorded timings when they fit the line, otherwise ones estimated from it. */
  const timingsFor = useCallback((index: number, duration: number): Timing[] => {
    const { marks, texts } = timingSource.current;
    const text = texts[index] ?? '';
    const words = countWords(text);

    const recorded = marks[index];
    if (recorded && words > 0 && recorded.length === words) return recorded;

    if (duration <= 0 || words === 0) return [];
    const cacheKey = `${index}:${words}:${duration.toFixed(2)}`;
    const cached = estimates.current.get(cacheKey);
    if (cached) return cached;

    const estimated = estimateTimings(text, duration);
    estimates.current.set(cacheKey, estimated);
    return estimated;
  }, []);

  // Follow the playhead: which word is being spoken, and how far through the
  // line we are. Doubles as the web fallback for a missing finish event.
  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = setInterval(() => {
      const index = lineIndex.current;
      const { currentTime, duration } = player;
      const timings = timingsFor(index, duration);

      const word = timings.length > 0 ? wordAt(timings, currentTime) : -1;
      const span = timings.length > 0 ? timings[timings.length - 1].end : duration;
      const progress = span > 0 ? clamp01(currentTime / span) : 0;

      setCursor((current) =>
        current.line === index &&
        current.word === word &&
        Math.abs(current.progress - progress) < 0.01
          ? current
          : { line: index, word, progress },
      );

      if (!player.playing && duration > 0 && currentTime > 0) {
        if (currentTime >= duration - END_TOLERANCE_S) onLineFinished();
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [isPlaying, player, onLineFinished, timingsFor]);

  const stop = useCallback(() => {
    player.pause();
    rewind();
  }, [player, rewind]);

  const toggle = useCallback(() => {
    if (playing.current) {
      player.pause();
      setPlaying(false);
      return;
    }

    const current = lines.current[lineIndex.current];
    if (!current) return;

    // Paused part way through this line: carry on from there. Anything else —
    // a new scene, or a scene played to the end — starts the line afresh.
    if (loaded.current === current && finished.current !== current) {
      player.play();
      setPlaying(true);
      return;
    }

    playLine(lineIndex.current);
  }, [playLine, player, setPlaying]);

  return {
    hasAudio: queue.length > 0,
    isPlaying,
    activeLine: cursor.line,
    activeWord: cursor.word,
    lineProgress: cursor.progress,
    toggle,
    stop,
  };
}

/**
 * Narration for one scene: the clips, their recorded word timings, and the text
 * those timings belong to. The whole scene falls back to a single narrated line
 * for scenes written before dialogue existed.
 */
export function useSceneNarration(node: StoryNode | null): Narration {
  const source = useMemo<NarrationSource>(
    () => ({
      urls: node?.audioUrls ?? [],
      marks: node?.audioMarks ?? [],
      texts: node
        ? node.lines.length > 0
          ? node.lines.map((line) => line.text)
          : [node.text]
        : [],
    }),
    [node],
  );

  return useNarration(source);
}
