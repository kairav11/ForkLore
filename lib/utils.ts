import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** One piece of a line: a word, or the whitespace between two words. */
export interface WordToken {
  text: string;
  /** Position among the words of the line, or -1 for whitespace. */
  index: number;
  /** Sequential position among all tokens (words and gaps) in the line; stable per token for list keys. */
  position: number;
}

/**
 * Splits a line into words and the gaps between them, so it can be re-rendered
 * exactly while each word is addressable. The same whitespace split is used when
 * narration timings are recorded, which is what keeps word N here and word N of
 * the recording the same word.
 */
export function splitWords(text: string): WordToken[] {
  const parts = text.split(/(\s+)/).filter((part) => part.length > 0);
  let index = -1;

  return parts.map((part, position) => {
    if (/^\s+$/.test(part)) return { text: part, index: -1, position };
    index += 1;
    return { text: part, index, position };
  });
}

/** How many words a line holds, counted the same way `splitWords` counts them. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((part) => part.length > 0).length;
}
