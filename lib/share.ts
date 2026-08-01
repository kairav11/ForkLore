import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import type { Story } from '@/lib/types';

/** Deep link prefix — matches the `scheme` in app.config.ts. */
export const SHARE_LINK_PREFIX = 'forklore://story/';

export function shareCodeFor(story: Story): string {
  return story.shareCode ?? story.id;
}

export function shareLinkForCode(code: string): string {
  return `${SHARE_LINK_PREFIX}${code}`;
}

export function shareLinkFor(story: Story): string {
  return story.shareUrl ?? shareLinkForCode(shareCodeFor(story));
}

/** A story as the share sheet needs it: the name to mention and the code to send. */
export interface ShareStoryInput {
  title: string | null;
  code: string;
}

/** What actually happened, so the caller can confirm it in the interface. */
export type ShareOutcome = 'shared' | 'copied';

/** One wording for every share, wherever it is triggered from. */
export function shareMessageFor({ title, code }: ShareStoryInput): string {
  const name = title && title.trim().length > 0 ? `“${title.trim()}”` : 'my ForkLore story';
  return [
    `Read ${name} and make your own choices: ${shareLinkForCode(code)}`,
    '',
    `Or enter the code: ${code}`,
  ].join('\n');
}

interface WebSharePayload {
  title: string;
  text: string;
}

/**
 * The browser's own share sheet, when there is one. It is called through
 * `Reflect.apply` so it keeps `navigator` as its receiver — a detached
 * `navigator.share` throws in Chrome.
 */
async function shareOnWeb(payload: WebSharePayload): Promise<boolean> {
  const navigator: unknown = Reflect.get(globalThis, 'navigator');
  if (typeof navigator !== 'object' || navigator === null) return false;

  const share: unknown = Reflect.get(navigator, 'share');
  if (typeof share !== 'function') return false;

  try {
    const pending: unknown = Reflect.apply(share, navigator, [payload]);
    await pending;
    return true;
  } catch {
    // Dismissed, or unsupported for this payload.
    return false;
  }
}

/**
 * Hands the story's link and code to whatever the platform offers: the native
 * share sheet on a device, the browser's share sheet on the web, and the
 * clipboard when neither exists — a share must never silently do nothing.
 */
export async function shareStory(input: ShareStoryInput): Promise<ShareOutcome> {
  const message = shareMessageFor(input);

  if (Platform.OS === 'web') {
    const shared = await shareOnWeb({ title: input.title ?? 'ForkLore', text: message });
    if (shared) return 'shared';

    await Clipboard.setStringAsync(message);
    return 'copied';
  }

  await Share.share({ message });
  return 'shared';
}

/**
 * Accepts a raw share code, a forklore:// deep link or an https link and
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
