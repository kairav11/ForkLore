import { useEffect, useMemo } from 'react';

import { ensureMedia } from '@/lib/media';
import { isFullyNarrated, narrationClips } from '@/lib/narration';
import type { Story, StoryNode } from '@/lib/types';
import { type Narration, useNarration } from '@/hooks/useNarration';

export interface StoryNarration extends Narration {
  /** Index in `scenes` of the scene being read, -1 when idle. */
  activeScene: number;
  /** Scenes still waiting for their recordings; 0 once the whole story is voiced. */
  pendingScenes: number;
}

/**
 * Reads a whole playthrough aloud: every recorded line of every scene, in the
 * order it was read, back to back.
 *
 * Nothing new is recorded for this — a scene's clips are the same ones the reader
 * plays, so the narrator's voice and each character's own voice carry over as
 * they were. Scenes the reader never listened to may still be silent, so any that
 * are missing clips are requested one at a time; the queue grows as they land and
 * playback continues into them rather than restarting.
 */
export function useStoryNarration(
  story: Story | null,
  scenes: readonly StoryNode[],
): StoryNarration {
  const storyId = story?.id ?? null;

  // Clip -> scene, so the cursor reported by the player can be turned back into
  // "scene 2, line 1" for the highlight and the follow-along scrolling.
  const entries = useMemo(
    () => scenes.flatMap((node, scene) => narrationClips(node).map((clip) => ({ clip, scene }))),
    [scenes],
  );
  const clips = useMemo(() => entries.map((entry) => entry.clip), [entries]);
  const narration = useNarration(clips);

  const missing = useMemo(
    () => scenes.filter((node) => !isFullyNarrated(node)).map((node) => node.id),
    [scenes],
  );
  const missingKey = missing.join(',');

  // One scene at a time: each recording is a backend call that voices several
  // lines, and asking for four at once only makes them all slower.
  useEffect(() => {
    if (!storyId || missingKey.length === 0) return undefined;

    let cancelled = false;
    const run = async () => {
      for (const nodeId of missingKey.split(',')) {
        if (cancelled) return;
        await ensureMedia(storyId, 'narration', nodeId);
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [storyId, missingKey]);

  return {
    ...narration,
    activeScene: entries[narration.activeClip]?.scene ?? -1,
    pendingScenes: missing.length,
  };
}
