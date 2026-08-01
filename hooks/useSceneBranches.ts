import { useCallback, useEffect, useMemo } from 'react';

import { ensureBranch } from '@/lib/branches';
import { hasScene, useStoryStore } from '@/lib/storyStore';
import type { Story, StoryNode } from '@/lib/types';

interface SceneBranches {
  /** Both scenes after this one exist, so the choices can be taken. */
  isReady: boolean;
  /** They are being written right now. */
  isWriting: boolean;
  /** Writing them failed; show `retry`. */
  error: string | null;
  retry: () => void;
}

/**
 * Keeps the story one step ahead of the reader: as soon as a scene is on screen,
 * the two scenes that follow it are written (or picked up if a previous session,
 * or the friend who was sent the story, already wrote them).
 */
export function useSceneBranches(story: Story | null, node: StoryNode | null): SceneBranches {
  const storyId = story?.id ?? null;
  const nodeKey = node?.id ?? null;
  const needsBranches = Boolean(node && !node.isEnding && node.choices.length > 0);

  const missingCount = useMemo(() => {
    if (!story || !node || node.isEnding) return 0;
    return node.choices.filter(
      (choice) => !choice.nextNodeId || !hasScene(story, choice.nextNodeId),
    ).length;
  }, [story, node]);

  const isWriting = useStoryStore((state) =>
    nodeKey ? (state.pendingBranches[nodeKey] ?? false) : false,
  );
  const error = useStoryStore((state) => (nodeKey ? (state.branchErrors[nodeKey] ?? null) : null));

  useEffect(() => {
    if (!storyId || !nodeKey || !needsBranches || missingCount === 0) return;
    void ensureBranch(storyId, nodeKey);
  }, [storyId, nodeKey, needsBranches, missingCount]);

  const retry = useCallback(() => {
    if (storyId && nodeKey) void ensureBranch(storyId, nodeKey, true);
  }, [storyId, nodeKey]);

  return {
    isReady: !needsBranches || missingCount === 0,
    isWriting,
    error,
    retry,
  };
}
