import { useEffect, useMemo } from 'react';

import { ensureMedia, mediaKey } from '@/lib/media';
import { hasScene, useStoryStore } from '@/lib/storyStore';
import type { Story, StoryNode } from '@/lib/types';

interface SceneMedia {
  /** The scene's art is still being generated. */
  isPaintingScene: boolean;
  /** The narrated line for this scene is still being generated. */
  isRecordingNarration: boolean;
}

/**
 * Keeps the current scene's art and narration flowing: whatever is missing for
 * the scene on screen is requested now, and the art for both possible next
 * scenes is generated ahead of time so a choice never leaves the reader waiting.
 */
export function useSceneMedia(story: Story | null, node: StoryNode | null): SceneMedia {
  const storyId = story?.id ?? null;
  const nodeId = node?.id ?? null;
  const hasImage = Boolean(node?.imageUrl);
  const hasAudio = (node?.audioUrls.length ?? 0) > 0;

  // Only scenes that have actually been written can have art made for them.
  const nextIds = useMemo(() => {
    if (!story || !node) return '';
    return node.choices
      .map((choice) => choice.nextNodeId)
      .filter((value): value is string => value !== null && hasScene(story, value))
      .join(',');
  }, [story, node]);

  const isPaintingScene = useStoryStore(
    (state) => !hasImage && (state.pendingMedia[mediaKey('image', nodeId ?? '-')] ?? false),
  );
  const isRecordingNarration = useStoryStore(
    (state) => !hasAudio && (state.pendingMedia[mediaKey('narration', nodeId ?? '-')] ?? false),
  );

  useEffect(() => {
    if (!storyId || !nodeId) return;
    if (!hasImage) void ensureMedia(storyId, 'image', nodeId);
    if (!hasAudio) void ensureMedia(storyId, 'narration', nodeId);
  }, [storyId, nodeId, hasImage, hasAudio]);

  // Warm up the art of both branches while the reader is still deciding.
  useEffect(() => {
    if (!storyId || nextIds.length === 0) return undefined;
    const timer = setTimeout(() => {
      for (const id of nextIds.split(',')) {
        void ensureMedia(storyId, 'image', id);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [storyId, nextIds]);

  return { isPaintingScene, isRecordingNarration };
}
