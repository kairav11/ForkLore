import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useEnsureStory } from '@/hooks/useEnsureStory';
import { ErrorState, LoadingState } from '@/components/StoryStatus';

/**
 * Deep link target for storybranch://story/<code> — loads the shared story and
 * hands the reader over in "shared" mode.
 */
export default function SharedStoryLinkScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { story, error } = useEnsureStory(id, 'shared');

  useEffect(() => {
    if (story) {
      router.replace({ pathname: '/reader/[id]', params: { id: story.id, mode: 'shared' } });
    }
  }, [story, router]);

  if (error) {
    return (
      <ErrorState
        title="That link did not work"
        message={error}
        actionLabel="Enter a code instead"
        onAction={() => router.replace('/enter')}
        secondaryLabel="Start my own story"
        onSecondary={() => router.replace('/')}
      />
    );
  }

  return <LoadingState title="Opening the shared story..." />;
}
