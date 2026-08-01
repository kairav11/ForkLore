import { generateMedia } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';
import type { MediaTarget } from '@/lib/types';

const inFlight = new Map<string, Promise<void>>();

/**
 * Generated art can legitimately fail once: the image model sits right at the
 * backend's time limit, so a second or third try usually lands. Delays between
 * tries are short enough that the reader is still on the scene.
 */
const RETRY_DELAYS_MS = [1_500, 5_000];

export function mediaKey(target: MediaTarget, nodeKey?: string): string {
  return `${target}:${nodeKey ?? '-'}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(storyId: string, target: MediaTarget, nodeKey?: string): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const result = await generateMedia(storyId, target, nodeKey);
      useStoryStore.getState().applyMedia(storyId, result, nodeKey);
      return;
    } catch {
      const delay = RETRY_DELAYS_MS[attempt];
      // Media is a nice-to-have: once the retries are spent, keep the story
      // readable without it rather than surfacing an error.
      if (delay === undefined) return;
      await wait(delay);
    }
  }
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

  const task = request(storyId, target, nodeKey).finally(() => {
    inFlight.delete(key);
    useStoryStore.getState().setMediaPending(mediaKey(target, nodeKey), false);
  });

  inFlight.set(key, task);
  return task;
}
