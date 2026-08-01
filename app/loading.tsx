import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { createStory, errorMessage } from '@/lib/api';
import { ensureBranch } from '@/lib/branches';
import { useLibraryStore } from '@/lib/library';
import { ensureMedia } from '@/lib/media';
import { useStoryStore } from '@/lib/storyStore';
import type { StyleId, ThemeId } from '@/lib/types';
import { ErrorState, LoadingState, type LoadingStep } from '@/components/StoryStatus';

type Stage = 'writing' | 'painting' | 'ready';

const STAGE_TITLES: Record<Stage, string> = {
  writing: 'Writing your opening…',
  painting: 'Painting the first scene…',
  ready: 'Opening your story…',
};

function stepsFor(stage: Stage): LoadingStep[] {
  return [
    {
      label: 'Writing the opening scene',
      state: stage === 'writing' ? 'active' : 'done',
    },
    {
      label: 'Painting the setting and the cast',
      state: stage === 'writing' ? 'todo' : stage === 'painting' ? 'active' : 'done',
    },
    {
      label: 'Mixing the ambience and narration',
      state: stage === 'ready' ? 'active' : 'todo',
    },
  ];
}

export default function LoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    setting: string;
    settingLabel?: string;
    style: StyleId;
    theme?: ThemeId;
    prompt?: string;
    name?: string;
    voice?: string;
    voiceName?: string;
  }>();
  const loadStory = useStoryStore((state) => state.loadStory);

  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('writing');
  const [attempt, setAttempt] = useState(0);

  const { setting, settingLabel, style, theme, prompt, name, voice, voiceName } = params;
  const placeLabel = settingLabel ?? 'Your story';

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setStage('writing');

    const run = async () => {
      const story = await createStory({
        settingId: setting,
        // The label travels with the id: places are shared data, so a custom one
        // is not in the app's own list.
        settingLabel: placeLabel,
        // Empty is allowed: the writer invents the premise instead.
        prompt: prompt ?? '',
        styleId: style,
        // Empty is allowed too: the writer then picks its own register.
        themeId: theme ?? null,
        ownerName: name,
        narratorVoiceId: voice,
        narratorLabel: voiceName,
      });
      if (cancelled) return;

      loadStory(story, 'owner');
      setStage('painting');

      // Listed on the home screen from the moment it exists, so a story is never
      // lost because the reader left before the ending.
      useLibraryStore.getState().record(story, {
        settingLabel: placeLabel,
        themeId: theme ?? null,
      });

      // Ambience, narration and the scenes behind the first two choices keep
      // generating in the background; the reader picks them up as they land.
      void ensureMedia(story.id, 'ambient');
      void ensureMedia(story.id, 'narration', story.startNodeId);
      void ensureBranch(story.id, story.startNodeId);

      await Promise.all([
        ensureMedia(story.id, 'background'),
        ensureMedia(story.id, 'image', story.startNodeId),
      ]);
      if (cancelled) return;

      setStage('ready');
      router.replace({ pathname: '/reader/[id]', params: { id: story.id } });
    };

    run().catch((cause: unknown) => {
      if (!cancelled) setError(errorMessage(cause));
    });

    return () => {
      cancelled = true;
    };
  }, [
    setting,
    placeLabel,
    style,
    theme,
    prompt,
    name,
    voice,
    voiceName,
    attempt,
    loadStory,
    router,
  ]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (error) {
    return (
      <ErrorState
        title="We could not build your story"
        message={error}
        actionLabel="Try again"
        onAction={retry}
        secondaryLabel="Change my idea"
        onSecondary={() => router.back()}
      />
    );
  }

  return (
    <LoadingState
      title={STAGE_TITLES[stage]}
      detail={`${placeLabel} · this takes a moment, everything is made fresh for you.`}
      steps={stepsFor(stage)}
    />
  );
}
