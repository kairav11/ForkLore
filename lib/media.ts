import { generateMedia } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';
import type { MediaTarget } from '@/lib/types';

const inFlight = new Map<string, Promise<void>>();

export function mediaKey(target: MediaTarget, nodeKey?: string): string {
  return `${target}:${nodeKey ?? '-'}`;
}

/**
 * Asks the backend for one generated asset and folds the result into the store.
 * Repeat calls for the same asset share a single request, and a failure never
 * blocks reading — the scene simply stays without that art or narration.
 */
export function ensureMedia(storyId: string, target: MediaTarget, nodeKey?: string): Promise<void> {
  const key = `${storyId}:${mediaKey(target, nodeKey)}`;
  const running = inFlight.get(key);
  if (running) return running;

  const store = useStoryStore.getState();
  store.setMediaPending(mediaKey(target, nodeKey), true);

  const task = generateMedia(storyId, target, nodeKey)
    .then((result) => {
      useStoryStore.getState().applyMedia(storyId, result, nodeKey);
    })
    .catch(() => {
      // Media is a nice-to-have: keep the story readable.
    })
    .finally(() => {
      inFlight.delete(key);
      useStoryStore.getState().setMediaPending(mediaKey(target, nodeKey), false);
    });

  inFlight.set(key, task);
  return task;
}
