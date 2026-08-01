import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export interface Narration {
  hasAudio: boolean;
  isPlaying: boolean;
  toggle: () => void;
  stop: () => void;
}

/**
 * Plays a node's narrated line(s) back to back over the ambient loop.
 *
 * The player keeps whatever source was last handed to it, so the loaded url is
 * tracked here: when the scene changes it is cleared, which forces the next tap
 * to `replace()` instead of resuming — otherwise scene two would play scene
 * one's narration again from where it stopped.
 */
export function useNarration(urls: readonly string[]): Narration {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Compare by content, not array identity: the story object is re-read while
  // media is generated and must not interrupt playback of an unchanged scene.
  const key = urls.join('|');
  const queue = useMemo(() => (key.length > 0 ? key.split('|') : []), [key]);

  const lines = useRef<string[]>(queue);
  const lineIndex = useRef(0);
  /** The url currently sitting in the player, or null when it holds a stale one. */
  const loaded = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stop = useCallback(() => {
    setIsPlaying(false);
    lineIndex.current = 0;
    loaded.current = null;
    player.pause();
  }, [player]);

  // Reset when the scene changes.
  useEffect(() => {
    lines.current = queue;
    lineIndex.current = 0;
    loaded.current = null;
    setIsPlaying(false);
    player.pause();
  }, [queue, player]);

  // Advance to the next narrated line.
  useEffect(() => {
    if (!status.didJustFinish || !isPlaying) return;
    const next = lineIndex.current + 1;
    const nextUrl = lines.current[next];
    if (nextUrl) {
      lineIndex.current = next;
      loaded.current = nextUrl;
      player.replace({ uri: nextUrl });
      player.play();
    } else {
      // Played to the end: the next tap starts the scene over.
      lineIndex.current = 0;
      loaded.current = null;
      setIsPlaying(false);
    }
  }, [status.didJustFinish, isPlaying, player]);

  const toggle = useCallback(() => {
    const current = lines.current[lineIndex.current] ?? lines.current[0];
    if (!current) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    if (loaded.current === current) {
      player.play();
      setIsPlaying(true);
      return;
    }

    loaded.current = current;
    player.replace({ uri: current });
    player.play();
    setIsPlaying(true);
  }, [isPlaying, player]);

  return { hasAudio: queue.length > 0, isPlaying, toggle, stop };
}
