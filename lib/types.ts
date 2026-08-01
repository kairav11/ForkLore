export type SettingId = 'school' | 'club' | 'bar' | 'city-center' | 'tv-tower';

export type StyleId = 'flat-illustrated' | 'comic-ink' | 'painterly';

export interface StoryChoice {
  /** Letter used in the path string: a, b, ... */
  letter: string;
  label: string;
  nextNodeId: string | null;
}

export interface StoryNode {
  id: string;
  text: string;
  /** Character / foreground image layered over the fixed background. */
  imageUrl: string | null;
  /** One or more narrated lines, played back to back. */
  audioUrls: string[];
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
  /** 0 - 100 */
  score: number;
  agreedCount: number;
  totalCount: number;
  ownerName: string | null;
  /** The owner's decisions, letters in order — drawn in amber on the match screen. */
  ownerPath: string[];
  /** The reader's own decisions — drawn in violet-blue. */
  yourPath: string[];
}

export interface CreateStoryInput {
  settingId: SettingId;
  prompt: string;
  styleId: StyleId;
  /** Shown to friends on the match screen. */
  ownerName?: string;
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
}
