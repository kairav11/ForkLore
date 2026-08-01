/**
 * A place the story happens in. Not a fixed union any more: the five originals
 * ship with the app, and readers can add their own, which every reader then sees
 * (see `lib/places.ts`).
 */
export type SettingId = string;

export type StyleId =
  | 'flat-illustrated'
  | 'comic-ink'
  | 'painterly'
  | 'anime-cel'
  | 'watercolour'
  | 'noir-film'
  | 'pixel-art'
  | 'storybook'
  | 'retro-print';

export interface StoryChoice {
  /** Letter used in the path string: a, b, ... */
  letter: string;
  label: string;
  nextNodeId: string | null;
}

/** One beat of a scene: narration, or a character actually speaking. */
export interface StoryLine {
  /** null for narration, the character's name when they speak. */
  speaker: string | null;
  text: string;
}

/**
 * One word of a narrated clip, in seconds from the start of that clip. Words are
 * cut on whitespace, so index N here is the Nth whitespace-separated word of the
 * line's text.
 */
export interface WordMark {
  start: number;
  end: number;
}

export interface StoryNode {
  id: string;
  /** Whole-scene transcript: narration and dialogue in reading order. */
  text: string;
  /** The same scene split into narration and spoken lines. */
  lines: StoryLine[];
  /** Character / foreground image layered over the fixed background. */
  imageUrl: string | null;
  /** One or more narrated lines, played back to back. */
  audioUrls: string[];
  /**
   * Word timings for each clip in `audioUrls`, same order. null for a clip the
   * voice provider gave no alignment for, and empty for scenes recorded before
   * word timings existed — the reader then estimates them from the clip length.
   */
  audioMarks: (WordMark[] | null)[];
  choices: StoryChoice[];
  isEnding: boolean;
  /** 0 for the opening scene, 3 for an ending. */
  depth: number;
}

export interface Story {
  id: string;
  title: string | null;
  settingId: SettingId | null;
  styleId: StyleId | null;
  ownerName: string | null;
  backgroundImageUrl: string | null;
  backgroundAudioUrl: string | null;
  startNodeId: string;
  nodes: StoryNode[];
  shareCode: string | null;
  shareUrl: string | null;
}

export interface MatchResult {
  /** 0 - 100, share of decisions taken together before the paths forked. */
  score: number;
  /** Decisions where both readers were on the same scene and chose the same option. */
  sharedCount: number;
  totalCount: number;
  /**
   * 1-based decision where the two paths first differed, null when identical.
   * From this decision on the two readers were offered different scenes, so
   * their later letters are not comparable.
   */
  divergedAt: number | null;
  ownerName: string | null;
  /** The owner's decisions, letters in order — drawn in amber on the match screen. */
  ownerPath: string[];
  /** The reader's own decisions — drawn in violet-blue. */
  yourPath: string[];
}

export interface CreateStoryInput {
  settingId: SettingId;
  /** The place's name, sent along because custom places are not in the app. */
  settingLabel: string;
  /** May be empty — the writer then invents the premise. */
  prompt: string;
  styleId: StyleId;
  /** Shown to friends on the match screen. */
  ownerName?: string;
  /** ElevenLabs voice that narrates every scene of this story. */
  narratorVoiceId?: string;
  /** That voice's name, kept with the story so it can be shown later. */
  narratorLabel?: string;
}

/** A decision the current player made, in order. */
export interface Decision {
  nodeId: string;
  nodeText: string;
  choiceLetter: string;
  choiceLabel: string;
}

export type PlayMode = 'owner' | 'shared';

/** One generated asset: the fixed backdrop, its ambience, or one scene's art / narration. */
export type MediaTarget = 'background' | 'ambient' | 'image' | 'narration';

export interface MediaResult {
  backgroundImageUrl?: string | null;
  backgroundAudioUrl?: string | null;
  imageUrl?: string | null;
  audioUrls?: string[];
  audioMarks?: (WordMark[] | null)[];
}
