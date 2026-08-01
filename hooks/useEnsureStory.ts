import { useEffect, useState } from 'react';

import { errorMessage, getStory } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';
import type { PlayMode, Story } from '@/lib/types';

interface EnsureStoryResult {
  story: Story | null;
  error: string | null;
}

/**
 * Returns the story for `id`, fetching it from the backend when the app was
 * opened straight onto a screen (deep link, reload) instead of through setup.
 */
export function useEnsureStory(
  id: string | undefined,
  mode: PlayMode = 'owner',
): EnsureStoryResult {
  const story = useStoryStore((state) => state.story);
  const loadStory = useStoryStore((state) => state.loadStory);
  const [error, setError] = useState<string | null>(null);

  const matches = Boolean(id) && story?.id === id;

  useEffect(() => {
    if (!id || matches) return undefined;
    let cancelled = false;
    setError(null);

    getStory(id)
      .then((fetched) => {
        if (!cancelled) loadStory(fetched, mode);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(errorMessage(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [id, matches, mode, loadStory]);

  return { story: matches ? story : null, error };
}
