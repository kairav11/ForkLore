import { useMemo } from 'react';
import { create } from 'zustand';

import type { Decision, MediaResult, PlayMode, Story, StoryNode } from '@/lib/types';

export function findNode(story: Story, nodeId: string): StoryNode | null {
  return story.nodes.find((node) => node.id === nodeId) ?? null;
}

interface StoryStoreState {
  story: Story | null;
  mode: PlayMode;
  currentNodeId: string | null;
  decisions: Decision[];
  ambientEnabled: boolean;
  /** Keyed by `target:nodeKey` while that asset is being generated. */
  pendingMedia: Record<string, boolean>;
  loadStory: (story: Story, mode: PlayMode) => void;
  choose: (choiceIndex: number) => void;
  restart: () => void;
  setAmbientEnabled: (enabled: boolean) => void;
  setMediaPending: (key: string, pending: boolean) => void;
  applyMedia: (storyId: string, result: MediaResult, nodeKey?: string) => void;
  clear: () => void;
}

export const useStoryStore = create<StoryStoreState>()((set, get) => ({
  story: null,
  mode: 'owner',
  currentNodeId: null,
  decisions: [],
  ambientEnabled: true,
  pendingMedia: {},

  loadStory: (story, mode) => {
    set({ story, mode, currentNodeId: story.startNodeId, decisions: [] });
  },

  choose: (choiceIndex) => {
    const { story, currentNodeId, decisions } = get();
    if (!story || !currentNodeId) return;

    const node = findNode(story, currentNodeId);
    const choice = node?.choices[choiceIndex];
    if (!node || !choice) return;

    const nextId = choice.nextNodeId;
    if (!nextId || !findNode(story, nextId)) return;

    const decision: Decision = {
      nodeId: node.id,
      nodeText: node.text,
      choiceLetter: choice.letter,
      choiceLabel: choice.label,
    };

    set({ currentNodeId: nextId, decisions: [...decisions, decision] });
  },

  restart: () => {
    const { story } = get();
    if (!story) return;
    set({ currentNodeId: story.startNodeId, decisions: [] });
  },

  setAmbientEnabled: (enabled) => set({ ambientEnabled: enabled }),

  setMediaPending: (key, pending) => {
    const { pendingMedia } = get();
    if ((pendingMedia[key] ?? false) === pending) return;
    set({ pendingMedia: { ...pendingMedia, [key]: pending } });
  },

  applyMedia: (storyId, result, nodeKey) => {
    const { story } = get();
    if (!story || story.id !== storyId) return;

    let next = story;

    if (result.backgroundImageUrl) {
      next = { ...next, backgroundImageUrl: result.backgroundImageUrl };
    }
    if (result.backgroundAudioUrl) {
      next = { ...next, backgroundAudioUrl: result.backgroundAudioUrl };
    }

    const hasNodeMedia = Boolean(result.imageUrl) || (result.audioUrls?.length ?? 0) > 0;
    if (nodeKey && hasNodeMedia) {
      next = {
        ...next,
        nodes: next.nodes.map((node) =>
          node.id === nodeKey
            ? {
                ...node,
                imageUrl: result.imageUrl ?? node.imageUrl,
                audioUrls:
                  result.audioUrls && result.audioUrls.length > 0
                    ? result.audioUrls
                    : node.audioUrls,
              }
            : node,
        ),
      };
    }

    if (next !== story) set({ story: next });
  },

  clear: () =>
    set({ story: null, currentNodeId: null, decisions: [], mode: 'owner', pendingMedia: {} }),
}));

export function useCurrentNode(): StoryNode | null {
  const story = useStoryStore((state) => state.story);
  const currentNodeId = useStoryStore((state) => state.currentNodeId);
  return useMemo(
    () => (story && currentNodeId ? findNode(story, currentNodeId) : null),
    [story, currentNodeId],
  );
}

export function usePath(): string[] {
  const decisions = useStoryStore((state) => state.decisions);
  return useMemo(() => decisions.map((decision) => decision.choiceLetter), [decisions]);
}
