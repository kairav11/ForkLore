import { useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

import { useStoryStore } from '@/lib/storyStore';

/** Ambient loops sit quietly under the narration. */
const AMBIENT_VOLUME = 0.18;

/**
 * Mounted once at the root so the setting's ambient track keeps looping while
 * the player moves between the reader, ending, replay and match screens.
 */
export function AmbientAudio() {
  const backgroundAudioUrl = useStoryStore((state) => state.story?.backgroundAudioUrl ?? null);
  const enabled = useStoryStore((state) => state.ambientEnabled);

  const player = useAudioPlayer(backgroundAudioUrl ? { uri: backgroundAudioUrl } : null);
  const status = useAudioPlayerStatus(player);

  // Boxed in a ref so the imperative property writes below (expo-audio's
  // AudioPlayer exposes `loop`/`volume` as native setters, not methods) are
  // seen as a ref mutation rather than a mutation of the hook's return value.
  const playerRef = useRef<AudioPlayer>(player);
  playerRef.current = player;

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  }, []);

  useEffect(() => {
    if (!backgroundAudioUrl || !status.isLoaded) return;

    const current = playerRef.current;
    current.loop = true;
    current.volume = AMBIENT_VOLUME;

    if (enabled && !status.playing) {
      current.play();
    } else if (!enabled && status.playing) {
      current.pause();
    }
  }, [backgroundAudioUrl, enabled, status.isLoaded, status.playing]);

  return null;
}
