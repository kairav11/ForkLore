import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

import { type NarrationClip, narrationClips } from '@/lib/narration';
import type { StoryNode, WordMark } from '@/lib/types';
import { countWords } from '@/lib/utils';

export interface Narration {
  hasAudio: boolean;
  isPlaying: boolean;
  /** Index of the clip being played, -1 when idle. */
  activeClip: number;
  /** The line being narrated, as the scene renders it; -1 when idle. */
  activeLine: number;
  /** The word inside that line, -1 while its timing is still unknown. */
  activeWord: number;
  /** How far through the active line, 0 to 1 — what the panel scrolls by. */
  lineProgress: number;
  toggle: () => void;
  stop: () => void;
}

/** How often the playhead is read while a clip plays. */
const TICK_MS = 90;
/**
 * A swapped-in source does not refresh the player's fields at once: for a short
 * while `currentTime`, `duration` and `playing` still describe the clip that just
 * ended. Nothing is read from the player until this has passed and it reports the
 * new clip as loaded — otherwise the first ticks of a line highlight the last
 * word of the previous one.
 */
const SETTLE_MS = 220;
/**
 * A finish reported this soon after a swap belongs to the clip being replaced,
 * not to the one now loading. Without this guard the trailing "just finished"
 * from line one advanced the queue a second time and line two was never heard.
 */
const GRACE_MS = 420;
/** How close to the end counts as finished when no finish event arrives. */
const END_TOLERANCE_S = 0.06;
/** Playing, but the playhead has not moved for this long: the clip is broken. */
const STALL_MS = 8_000;
/** Extra weight, in characters, given to a word that ends a clause. */
const PAUSE_WEIGHT = 3;

interface Cursor {
  /** Which clip of the queue is speaking; a whole-story queue needs this to
   *  know which scene the line belongs to. */
  clip: number;
  line: number;
  word: number;
  progress: number;
}

const IDLE: Cursor = { clip: -1, line: -1, word: -1, progress: 0 };

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Word timings guessed from the clip's length, for scenes recorded before the
 * voice provider returned an alignment. Longer words take longer, and a word
 * that closes a clause is given the pause that follows it.
 */
function estimateTimings(text: string, duration: number): WordMark[] {
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
function wordAt(timings: WordMark[], time: number): number {
  let index = -1;
  for (let position = 0; position < timings.length; position += 1) {
    if (timings[position].start > time) break;
    index = position;
  }
  return index;
}

/**
 * Plays a scene's clips back to back over the ambient loop, and reports which
 * line and word are being spoken so the text can follow along.
 *
 * Everything here exists because one audio player is reused for every clip, and
 * a player that has just been handed a new source keeps reporting the old one for
 * a moment:
 *
 * 1. Advancing the queue is tied to a play session, guarded against repeats, and
 *    ignored inside a grace window after a swap. A lingering or repeated "just
 *    finished" would otherwise skip a line — the scene then read its dialogue
 *    without its narration, or jumped a line ahead of the words on screen.
 * 2. The playhead is only trusted once the new clip is loaded and settled, so no
 *    word is highlighted from the previous clip's position.
 * 3. Finishes come from real player events, plus a poll for platforms that never
 *    emit one (web keeps reporting `playing` after the audio has ended), plus a
 *    watchdog so a clip that never loads is skipped rather than stalling.
 * 4. Recorded timings only line up with the text when both sides split it the
 *    same way, so a mark set whose length does not match the line's word count is
 *    discarded rather than drifting one word out for the whole line.
 */
export function useNarration(clips: readonly NarrationClip[]): Narration {
  const player = useAudioPlayer(null);

  // Compare by content, not array identity: the story object is re-read while
  // media is generated and must not interrupt playback of an unchanged scene.
  const key = useMemo(() => clips.map((clip) => clip.url).join('|'), [clips]);

  /** Latest clips, read inside the tick without restarting it. */
  const queue = useRef<readonly NarrationClip[]>(clips);
  useEffect(() => {
    queue.current = clips;
  }, [clips]);

  /** The urls playback state currently belongs to, for scene-change detection. */
  const queueUrls = useRef<string[]>([]);
  const index = useRef(0);
  /** Bumped on every play and every reset; stale work is ignored by comparison. */
  const session = useRef(0);
  /** The session the queue has already been advanced for. */
  const advanced = useRef(-1);
  /** When the current clip started, or was resumed. */
  const startedAt = useRef(0);
  /** The url sitting in the player, or null when it holds a stale one. */
  const loaded = useRef<string | null>(null);
  /** Set once the scene has played through, so the next tap starts it over. */
  const sceneEnded = useRef(false);
  const lastTime = useRef(0);
  const movedAt = useRef(0);
  /**
   * Set once the playhead has been seen somewhere before the end of the current
   * clip. Until then a reading that looks finished is a leftover from the clip
   * that was just replaced, not this one.
   */
  const sawMid = useRef(false);
  const playing = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [cursor, setCursor] = useState<Cursor>(IDLE);

  /** Estimates are kept per clip and clip length, so they are computed once. */
  const estimates = useRef(new Map<string, WordMark[]>());

  const setPlaying = useCallback((value: boolean) => {
    playing.current = value;
    setIsPlaying(value);
  }, []);

  /** Loads and plays one clip. Returns false when that clip does not exist. */
  const playClip = useCallback(
    (position: number): boolean => {
      const clip = queue.current[position];
      if (!clip) return false;

      index.current = position;
      session.current += 1;
      startedAt.current = Date.now();
      movedAt.current = Date.now();
      lastTime.current = 0;
      sawMid.current = false;
      loaded.current = clip.url;
      sceneEnded.current = false;

      setCursor({ clip: position, line: clip.line, word: -1, progress: 0 });
      player.replace({ uri: clip.url });
      player.play();
      setPlaying(true);
      return true;
    },
    [player, setPlaying],
  );

  /** Forgets where playback was, so the next tap starts the scene from the top. */
  const reset = useCallback(() => {
    index.current = 0;
    session.current += 1;
    advanced.current = -1;
    sawMid.current = false;
    loaded.current = null;
    sceneEnded.current = false;
    setCursor(IDLE);
    setPlaying(false);
  }, [setPlaying]);

  /** The current clip ended: play the next one, or stop after the last. */
  const advance = useCallback(() => {
    if (!playing.current) return;
    if (advanced.current === session.current) return;
    // Reported too soon after a swap to be about the clip now loading.
    if (Date.now() - startedAt.current < GRACE_MS) return;

    advanced.current = session.current;
    if (playClip(index.current + 1)) return;

    player.pause();
    index.current = 0;
    sceneEnded.current = true;
    setCursor(IDLE);
    setPlaying(false);
  }, [playClip, player, setPlaying]);

  // Reset when the scene changes, so the next tap reloads instead of resuming
  // wherever the previous scene was left. A queue that merely grew — a later line
  // of the same scene finished recording — is not a scene change and must not cut
  // off what is playing.
  useEffect(() => {
    const previous = queueUrls.current;
    const next = key.length > 0 ? key.split('|') : [];
    const grew = next.length > previous.length && previous.every((url, at) => next[at] === url);
    queueUrls.current = next;

    if (grew && playing.current) return;
    player.pause();
    reset();
  }, [key, player, reset]);

  // Real player events: the finish signal on native.
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) advance();
    });
    return () => subscription.remove();
  }, [player, advance]);

  /** Recorded timings when they fit the line, otherwise ones estimated from it. */
  const timingsFor = useCallback((clip: NarrationClip, duration: number): WordMark[] => {
    const words = countWords(clip.text);
    if (clip.marks && words > 0 && clip.marks.length === words) return clip.marks;
    if (!Number.isFinite(duration) || duration <= 0 || words === 0) return [];

    const cacheKey = `${clip.url}:${duration.toFixed(2)}`;
    const cached = estimates.current.get(cacheKey);
    if (cached) return cached;

    const estimated = estimateTimings(clip.text, duration);
    estimates.current.set(cacheKey, estimated);
    return estimated;
  }, []);

  // Follow the playhead: which word is being spoken, and how far through the
  // line we are. Doubles as the finish signal where no event arrives, and as the
  // watchdog for a clip that never loads or stops moving.
  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = setInterval(() => {
      const clip = queue.current[index.current];
      if (!clip) return;

      const settled = player.isLoaded && Date.now() - startedAt.current >= SETTLE_MS;
      if (!settled) {
        // Nothing loaded and nothing playing for this long: give up on the clip
        // rather than leaving the scene silent from here on.
        if (Date.now() - startedAt.current > STALL_MS) advance();
        return;
      }

      const time = player.currentTime;
      const duration = player.duration;
      const known = Number.isFinite(duration) && duration > 0;
      const atEnd = known && time >= duration - END_TOLERANCE_S;

      // A finished-looking reading before this clip has been heard mid-way is a
      // leftover from the clip that was just replaced: neither the highlighted
      // word nor the queue may move on it.
      if (atEnd && !sawMid.current) {
        if (Date.now() - startedAt.current > STALL_MS) advance();
        return;
      }
      if (known && !atEnd) sawMid.current = true;

      const timings = timingsFor(clip, duration);

      const word = timings.length > 0 ? wordAt(timings, time) : -1;
      const span = timings.length > 0 ? timings[timings.length - 1].end : duration;
      const progress = Number.isFinite(span) && span > 0 ? clamp01(time / span) : 0;

      setCursor((current) =>
        current.clip === index.current &&
        current.line === clip.line &&
        current.word === word &&
        Math.abs(current.progress - progress) < 0.01
          ? current
          : { clip: index.current, line: clip.line, word, progress },
      );

      if (time > lastTime.current + 0.01) {
        lastTime.current = time;
        movedAt.current = Date.now();
      }

      if (atEnd || Date.now() - movedAt.current > STALL_MS) advance();
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [isPlaying, player, advance, timingsFor]);

  const stop = useCallback(() => {
    player.pause();
    reset();
  }, [player, reset]);

  const toggle = useCallback(() => {
    if (playing.current) {
      player.pause();
      setPlaying(false);
      return;
    }

    const clip = queue.current[index.current];
    if (!clip) return;

    // Paused part way through this clip: carry on from there. Anything else — a
    // new scene, or a scene played to the end — starts the clip afresh.
    if (!sceneEnded.current && loaded.current === clip.url) {
      startedAt.current = Date.now() - SETTLE_MS;
      movedAt.current = Date.now();
      player.play();
      setPlaying(true);
      return;
    }

    playClip(index.current);
  }, [playClip, player, setPlaying]);

  return {
    hasAudio: clips.length > 0,
    isPlaying,
    activeClip: cursor.clip,
    activeLine: cursor.line,
    activeWord: cursor.word,
    lineProgress: cursor.progress,
    toggle,
    stop,
  };
}

/**
 * Narration for one scene: the recorded clips, each tied to the line it speaks
 * and the word timings it was recorded with.
 */
export function useSceneNarration(node: StoryNode | null): Narration {
  const clips = useMemo(() => narrationClips(node), [node]);
  return useNarration(clips);
}
