import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { createStory, errorMessage } from '@/lib/api';
import { ensureMedia } from '@/lib/media';
import { settingLabel } from '@/lib/settings';
import { useStoryStore } from '@/lib/storyStore';
import type { SettingId, StyleId } from '@/lib/types';
import { ErrorState, LoadingState, type LoadingStep } from '@/components/StoryStatus';

type Stage = 'writing' | 'painting' | 'ready';

const STAGE_TITLES: Record<Stage, string> = {
  writing: 'Building your story…',
  painting: 'Painting the first scene…',
  ready: 'Opening your story…',
};

function stepsFor(stage: Stage): LoadingStep[] {
  return [
    {
      label: 'Writing the branches',
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
    setting: SettingId;
    style: StyleId;
    prompt: string;
    name?: string;
  }>();
  const loadStory = useStoryStore((state) => state.loadStory);

  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('writing');
  const [attempt, setAttempt] = useState(0);

  const { setting, style, prompt, name } = params;

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setStage('writing');

    const run = async () => {
      const story = await createStory({
        settingId: setting,
        prompt,
        styleId: style,
        ownerName: name,
      });
      if (cancelled) return;

      loadStory(story, 'owner');
      setStage('painting');

      // Ambience and narration keep generating in the background; the reader
      // picks them up as soon as they land.
      void ensureMedia(story.id, 'ambient');
      void ensureMedia(story.id, 'narration', story.startNodeId);

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
  }, [setting, style, prompt, name, attempt, loadStory, router]);

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
      detail={`${settingLabel(setting)} · this takes a moment, everything is made fresh for you.`}
      steps={stepsFor(stage)}
    />
  );
}
