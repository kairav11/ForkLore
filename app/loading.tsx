import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { createStory, errorMessage } from '@/lib/api';
import { settingLabel } from '@/lib/settings';
import { useStoryStore } from '@/lib/storyStore';
import type { SettingId, StyleId } from '@/lib/types';
import { ErrorState, LoadingState } from '@/components/StoryStatus';

export default function LoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ setting: SettingId; style: StyleId; prompt: string }>();
  const loadStory = useStoryStore((state) => state.loadStory);

  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const { setting, style, prompt } = params;

  useEffect(() => {
    let cancelled = false;
    setError(null);

    createStory({ settingId: setting, prompt, styleId: style })
      .then((story) => {
        if (cancelled) return;
        loadStory(story, 'owner');
        router.replace({ pathname: '/reader/[id]', params: { id: story.id } });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(errorMessage(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [setting, style, prompt, attempt, loadStory, router]);

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
      title="Building your story..."
      detail={`${settingLabel(setting)} · shaping the scenes, art and narration.`}
    />
  );
}
