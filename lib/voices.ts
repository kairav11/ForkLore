/**
 * The narrators offered on the setup screen. Ids are ElevenLabs voices; the
 * chosen one is stored with the story and used for every narration line, while
 * characters who speak are always given a different voice.
 *
 * This list is the single source of truth: the `story-voices` function only turns
 * these ids into playable demo clips, so the two can never drift apart.
 */
export interface NarratorOption {
  id: string;
  name: string;
  /** One-line character of the voice, shown under the name. */
  blurb: string;
}

export const NARRATORS: readonly NarratorOption[] = [
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', blurb: 'Close, hushed, confiding' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', blurb: 'British, weathered, unhurried' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', blurb: 'Bright, clear, matter of fact' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', blurb: 'Low, gravelly, uneasy' },
] as const;

export const DEFAULT_NARRATOR_ID: string = NARRATORS[0].id;

/** The line every narrator reads in their demo. */
export const NARRATOR_DEMO_LINE = 'You stop at the door. Whatever happens next, you choose it.';

export function narratorName(id: string | null | undefined): string {
  return NARRATORS.find((option) => option.id === id)?.name ?? '';
}
