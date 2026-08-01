import { useMemo } from 'react';
import { create } from 'zustand';

import type { Decision, PlayMode, Story, StoryNode } from '@/lib/types';

export function findNode(story: Story, nodeId: string): StoryNode | null {
  return story.nodes.find((node) => node.id === nodeId) ?? null;
}

interface StoryStoreState {
  story: Story | null;
  mode: PlayMode;
  currentNodeId: string | null;
  decisions: Decision[];
  ambientEnabled: boolean;
  loadStory: (story: Story, mode: PlayMode) => void;
  choose: (choiceIndex: number) => void;
  restart: () => void;
  setAmbientEnabled: (enabled: boolean) => void;
  clear: () => void;
}

export const useStoryStore = create<StoryStoreState>()((set, get) => ({
  story: null,
  mode: 'owner',
  currentNodeId: null,
  decisions: [],
  ambientEnabled: true,

  loadStory: (story, mode) => {
    set({ story, mode, currentNodeId: story.startNodeId, decisions: [] });
  },

  choose: (choiceIndex) => {
    const { story, currentNodeId, decisions } = get();
    if (!story || !currentNodeId) return;

    const node = findNode(story, currentNodeId);
    const choice = node?.choices[choiceIndex];
    if (!node || !choice) return;

    // Fall back to the next node in document order when the backend omits a target.
    const fallbackIndex = story.nodes.findIndex((item) => item.id === node.id) + 1;
    const nextId = choice.nextNodeId ?? story.nodes[fallbackIndex]?.id ?? null;
    if (!nextId || !findNode(story, nextId)) return;

    const decision: Decision = {
      nodeId: node.id,
      nodeText: node.text,
      nodeImageUrl: node.imageUrl,
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

  clear: () => set({ story: null, currentNodeId: null, decisions: [], mode: 'owner' }),
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
