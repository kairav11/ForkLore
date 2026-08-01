import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export interface Narration {
  hasAudio: boolean;
  isPlaying: boolean;
  toggle: () => void;
  stop: () => void;
}

/**
 * Plays a node's narrated line(s) back to back over the ambient loop.
 * Passing a new `urls` array (a new node) resets playback.
 */
export function useNarration(urls: readonly string[]): Narration {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const queue = useRef<readonly string[]>(urls);
  const lineIndex = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const stop = useCallback(() => {
    setIsPlaying(false);
    lineIndex.current = 0;
    player.pause();
  }, [player]);

  // Reset when the node changes.
  useEffect(() => {
    queue.current = urls;
    lineIndex.current = 0;
    setIsPlaying(false);
    player.pause();
  }, [urls, player]);

  // Advance to the next narrated line.
  useEffect(() => {
    if (!status.didJustFinish || !isPlaying) return;
    const next = lineIndex.current + 1;
    const nextUrl = queue.current[next];
    if (nextUrl) {
      lineIndex.current = next;
      player.replace({ uri: nextUrl });
      player.play();
    } else {
      lineIndex.current = 0;
      setIsPlaying(false);
    }
  }, [status.didJustFinish, isPlaying, player]);

  const toggle = useCallback(() => {
    const first = queue.current[0];
    if (!first) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    if (lineIndex.current > 0 || status.currentTime > 0) {
      player.play();
      setIsPlaying(true);
      return;
    }

    player.replace({ uri: first });
    player.play();
    setIsPlaying(true);
  }, [isPlaying, player, status.currentTime]);

  return { hasAudio: urls.length > 0, isPlaying, toggle, stop };
}
