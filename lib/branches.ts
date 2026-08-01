import { errorMessage, expandBranch } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';

const inFlight = new Map<string, Promise<void>>();

/**
 * Asks the backend to write the two scenes that follow `nodeKey` and folds them
 * into the store. Repeat calls for the same scene share one request, and a
 * failure is remembered so the reader can retry deliberately instead of the app
 * hammering the writer in a loop.
 */
export function ensureBranch(storyId: string, nodeKey: string, force = false): Promise<void> {
  const key = `${storyId}:${nodeKey}`;
  const running = inFlight.get(key);
  if (running) return running;

  const store = useStoryStore.getState();
  if (!force && store.branchErrors[nodeKey]) return Promise.resolve();

  store.setBranchError(nodeKey, null);
  store.setBranchPending(nodeKey, true);

  const task = expandBranch(storyId, nodeKey)
    .then((nodes) => {
      useStoryStore.getState().addNodes(storyId, nodes);
    })
    .catch((cause: unknown) => {
      useStoryStore.getState().setBranchError(nodeKey, errorMessage(cause));
    })
    .finally(() => {
      inFlight.delete(key);
      useStoryStore.getState().setBranchPending(nodeKey, false);
    });

  inFlight.set(key, task);
  return task;
}
