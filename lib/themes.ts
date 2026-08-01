import {
  Flower2,
  Fingerprint,
  Ghost,
  Heart,
  Laugh,
  type LucideIcon,
  Rabbit,
  Worm,
  Zap,
} from 'lucide-react-native';

import type { ThemeId } from '@/lib/types';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  /** One quiet line under the chips, in the reader's language. */
  hint: string;
  /**
   * The tone brief handed to the idea writer and to the story writer. A bare
   * label ("Scary") produces generic prose, so every theme carries the concrete
   * instruction that makes the writing actually read that way.
   */
  direction: string;
  icon: LucideIcon;
}

/**
 * The mood of the story. Optional: with nothing picked the writer chooses its own
 * register, which is how ForkLore behaved before themes existed.
 */
export const THEMES: readonly ThemeOption[] = [
  {
    id: 'funny',
    label: 'Funny',
    hint: 'Light, quick, a little ridiculous.',
    direction:
      'Comic tone: an ordinary situation tipping into the ridiculous, dry understatement, characters who commit far too hard to a bad decision. Funny because of what happens, not because of jokes or puns. Never mean-spirited.',
    icon: Laugh,
  },
  {
    id: 'scary',
    label: 'Scary',
    hint: 'Dread that builds, nothing gory.',
    direction:
      'Horror tone: dread built from small wrong details, silence, and things noticed a moment too late. Tighten slowly instead of using shocks, and suggest far more than you show. No gore, and never explain the thing.',
    icon: Ghost,
  },
  {
    id: 'gross',
    label: 'Disgusting',
    hint: 'Sticky, squirmy, deeply unpleasant.',
    direction:
      'Gross-out tone: lean on texture, smell and sound — damp, sticky, spoiled, squirming, overripe. Physical disgust played for a shudder and a laugh, aimed at objects, food and messes rather than at bodies or people. Nothing sexual, nothing cruel.',
    icon: Worm,
  },
  {
    id: 'mystery',
    label: 'Mystery',
    hint: 'Clues, half-answers, one nagging question.',
    direction:
      'Mystery tone: one concrete question the reader wants answered, evidence left in plain sight, people who answer slightly beside the point. Every scene either adds a clue or deepens the suspicion.',
    icon: Fingerprint,
  },
  {
    id: 'heartfelt',
    label: 'Heartfelt',
    hint: 'Small, honest, quietly moving.',
    direction:
      'Heartfelt tone: ordinary people, small kindnesses, and an old hurt finally said out loud. Earn the feeling through concrete detail and restraint — no speeches, no sentimentality, no tidy lesson.',
    icon: Heart,
  },
  {
    id: 'absurd',
    label: 'Absurd',
    hint: 'Dream logic, played completely straight.',
    direction:
      'Absurd tone: one impossible thing that everyone treats as entirely normal, then followed with total seriousness and bureaucratic logic. Deadpan throughout; never wink at the reader or explain the joke.',
    icon: Rabbit,
  },
  {
    id: 'romantic',
    label: 'Romantic',
    hint: 'Nerves, glances, almost saying it.',
    direction:
      'Romantic tone: attention, nerve and timing — the charge of nearly saying the thing. Tension comes from what stays unsaid and from small physical detail. Warm and sincere, nothing explicit.',
    icon: Flower2,
  },
  {
    id: 'tense',
    label: 'Tense',
    hint: 'A clock running down.',
    direction:
      'Thriller tone: a clock, a real threat, and options narrowing scene by scene. Short sentences, concrete stakes, every choice costing something. Keep it grounded — no spies, no gunfights.',
    icon: Zap,
  },
] as const;

export function themeById(id: ThemeId | null | undefined): ThemeOption | null {
  if (!id) return null;
  return THEMES.find((theme) => theme.id === id) ?? null;
}

/** Name plus tone brief, as the idea writer and the story writer receive it. */
export function themePrompt(id: ThemeId | null | undefined): string {
  const theme = themeById(id);
  return theme ? `${theme.label}. ${theme.direction}` : '';
}
