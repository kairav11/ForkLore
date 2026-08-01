export type SettingId = 'school' | 'club' | 'bar' | 'city-center' | 'tv-tower';

export type StyleId = 'flat-illustrated' | 'comic-ink' | 'painterly';

export interface StoryChoice {
  /** Letter used in the path string sent to the backend: a, b, ... */
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
}

export interface CreateStoryInput {
  settingId: SettingId;
  prompt: string;
  styleId: StyleId;
}

/** A decision the current player made, in order. */
export interface Decision {
  nodeId: string;
  nodeText: string;
  nodeImageUrl: string | null;
  choiceLetter: string;
  choiceLabel: string;
}

export type PlayMode = 'owner' | 'shared';
