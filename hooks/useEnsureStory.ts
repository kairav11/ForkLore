import { useEffect, useState } from 'react';

import { errorMessage, getStory } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';
import type { PlayMode, Story } from '@/lib/types';

interface EnsureStoryResult {
  story: Story | null;
  error: string | null;
}

/** "a,b" -> ["a", "b"] */
function splitPath(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((letter) => letter.trim())
    .filter((letter) => letter.length > 0);
}

/**
 * Returns the story for `id`, fetching it from the backend when the app was
 * opened straight onto a screen (deep link, reload, or a tap in the reader's own
 * list) instead of through setup.
 *
 * `resumePath` is the decisions already taken, as a comma-separated list of
 * letters. It is only applied to a story that has to be fetched: a story already
 * in memory is where the reader actually is, and must not be rewound.
 */
export function useEnsureStory(
  id: string | undefined,
  mode: PlayMode = 'owner',
  resumePath?: string,
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
        if (!cancelled) loadStory(fetched, mode, splitPath(resumePath));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(errorMessage(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [id, matches, mode, resumePath, loadStory]);

  return { story: matches ? story : null, error };
}
