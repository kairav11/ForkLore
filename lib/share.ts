import type { Story } from '@/lib/types';

/** Deep link prefix — matches the `scheme` in app.config.ts. */
export const SHARE_LINK_PREFIX = 'storybranch://story/';

export function shareCodeFor(story: Story): string {
  return story.shareCode ?? story.id;
}

export function shareLinkFor(story: Story): string {
  return story.shareUrl ?? `${SHARE_LINK_PREFIX}${shareCodeFor(story)}`;
}

/**
 * Accepts a raw share code, a storybranch:// deep link or an https link and
 * returns the story code it points at.
 */
export function parseShareInput(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  if (!trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed;
  }

  const [beforeHash] = trimmed.split('#');
  const [pathPart, queryPart] = beforeHash.split('?');

  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [key, value] = pair.split('=');
      if (['code', 'story', 'id', 'storyId'].includes(key) && value) {
        return decodeURIComponent(value);
      }
    }
  }

  const segments = pathPart.split('/').filter((segment) => segment.length > 0);
  const last = segments.at(-1);
  if (!last) return null;
  return decodeURIComponent(last);
}
