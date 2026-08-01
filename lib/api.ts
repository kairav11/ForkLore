import { FunctionsHttpError } from '@biltme/backend';

import { bilt, isBackendConfigured } from '@/lib/bilt';
import { STYLES, stylePrompt } from '@/lib/settings';
import { SHARE_LINK_PREFIX } from '@/lib/share';
import { themeById } from '@/lib/themes';
import type {
  CreateStoryInput,
  Decision,
  MatchResult,
  MediaResult,
  MediaTarget,
  PlayMode,
  Story,
  StoryChoice,
  StoryLine,
  StoryNode,
  StyleId,
  ThemeId,
  WordMark,
} from '@/lib/types';
import { NARRATOR_DEMO_LINE, type NarratorOption } from '@/lib/voices';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const NOT_CONFIGURED =
  'The story service is not connected yet. Reconnect the backend and reload the app.';

const GENERIC_FAILURE = 'Something went wrong while building your story. Please try again.';

/** Turns any thrown value into a message that is safe to show in the UI. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return GENERIC_FAILURE;
}

/* ------------------------------------------------------------------ */
/* Backend function calls                                             */
/* ------------------------------------------------------------------ */

async function messageFromResponse(response: Response): Promise<string | null> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null) return null;
    const message: unknown = Reflect.get(payload, 'error');
    return typeof message === 'string' && message.length > 0 ? message : null;
  } catch {
    return null;
  }
}

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!isBackendConfigured) throw new ApiError(NOT_CONFIGURED);

  const { data, error } = await bilt.functions.invoke<T>(name, { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const message = await messageFromResponse(error.context);
      throw new ApiError(message ?? GENERIC_FAILURE);
    }
    throw new ApiError('We could not reach the story service. Check your connection.');
  }

  if (data === null || data === undefined) throw new ApiError(GENERIC_FAILURE);
  return data;
}

/* ------------------------------------------------------------------ */
/* Row mapping                                                        */
/* ------------------------------------------------------------------ */

interface StoryRow {
  id: string;
  share_code: string;
  setting_id: string;
  style_id: string;
  title: string | null;
  owner_name: string | null;
  background_image_url: string | null;
  background_audio_url: string | null;
  start_node_key: string;
}

interface NodeRow {
  node_key: string;
  depth: number;
  text: string;
  lines: unknown;
  image_url: string | null;
  audio_urls: string[] | null;
  audio_marks: unknown;
  choices: unknown;
  is_ending: boolean;
}

/** Shape returned by the `story_read` database function. */
interface StoryRead {
  story: StoryRow | null;
  nodes: NodeRow[] | null;
}

function toStoryRow(value: unknown): StoryRow | null {
  if (typeof value !== 'object' || value === null) return null;

  const id = Reflect.get(value, 'id');
  const shareCode = Reflect.get(value, 'share_code');
  const settingId = Reflect.get(value, 'setting_id');
  const styleId = Reflect.get(value, 'style_id');
  const startNodeKey = Reflect.get(value, 'start_node_key');
  if (
    typeof id !== 'string' ||
    typeof shareCode !== 'string' ||
    typeof settingId !== 'string' ||
    typeof styleId !== 'string' ||
    typeof startNodeKey !== 'string'
  ) {
    return null;
  }

  const title = Reflect.get(value, 'title');
  const ownerName = Reflect.get(value, 'owner_name');
  const backgroundImageUrl = Reflect.get(value, 'background_image_url');
  const backgroundAudioUrl = Reflect.get(value, 'background_audio_url');

  return {
    id,
    share_code: shareCode,
    setting_id: settingId,
    style_id: styleId,
    title: typeof title === 'string' ? title : null,
    owner_name: typeof ownerName === 'string' ? ownerName : null,
    background_image_url: typeof backgroundImageUrl === 'string' ? backgroundImageUrl : null,
    background_audio_url: typeof backgroundAudioUrl === 'string' ? backgroundAudioUrl : null,
    start_node_key: startNodeKey,
  };
}

function toNodeRow(value: unknown): NodeRow | null {
  if (typeof value !== 'object' || value === null) return null;

  const nodeKey = Reflect.get(value, 'node_key');
  const depth = Reflect.get(value, 'depth');
  const text = Reflect.get(value, 'text');
  const isEnding = Reflect.get(value, 'is_ending');
  if (
    typeof nodeKey !== 'string' ||
    typeof depth !== 'number' ||
    typeof text !== 'string' ||
    typeof isEnding !== 'boolean'
  ) {
    return null;
  }

  const imageUrl = Reflect.get(value, 'image_url');
  const audioUrls = Reflect.get(value, 'audio_urls');

  return {
    node_key: nodeKey,
    depth,
    text,
    lines: Reflect.get(value, 'lines'),
    image_url: typeof imageUrl === 'string' ? imageUrl : null,
    audio_urls: Array.isArray(audioUrls)
      ? audioUrls.filter((item): item is string => typeof item === 'string')
      : null,
    audio_marks: Reflect.get(value, 'audio_marks'),
    choices: Reflect.get(value, 'choices'),
    is_ending: isEnding,
  };
}

/** Tolerantly parses the `story_read` RPC payload, which arrives typed as `any`. */
function toStoryRead(value: unknown): StoryRead {
  if (typeof value !== 'object' || value === null) return { story: null, nodes: null };

  const story = toStoryRow(Reflect.get(value, 'story'));
  const nodesRaw = Reflect.get(value, 'nodes');
  const nodes = Array.isArray(nodesRaw)
    ? nodesRaw.map(toNodeRow).filter((node): node is NodeRow => node !== null)
    : null;

  return { story, nodes };
}

function isStyleId(value: string): value is StyleId {
  return STYLES.some((option) => option.id === value);
}

function toStyleId(value: string): StyleId | null {
  return isStyleId(value) ? value : null;
}

/** "a,b,a" -> ["a", "b", "a"] */
function splitLetters(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((letter) => letter.trim().toLowerCase())
    .filter((letter) => letter.length > 0);
}

function mapChoices(raw: unknown): StoryChoice[] {
  if (!Array.isArray(raw)) return [];
  const entries: unknown[] = raw;

  return entries.flatMap((entry): StoryChoice[] => {
    if (typeof entry !== 'object' || entry === null) return [];

    const label: unknown = Reflect.get(entry, 'label');
    if (typeof label !== 'string' || label.trim().length === 0) return [];

    const letter: unknown = Reflect.get(entry, 'letter');
    const nextNodeId: unknown = Reflect.get(entry, 'nextNodeId');

    return [
      {
        letter: typeof letter === 'string' ? letter : 'a',
        label: label.trim(),
        nextNodeId: typeof nextNodeId === 'string' ? nextNodeId : null,
      },
    ];
  });
}

/**
 * A scene's narration and spoken lines. Scenes written before dialogue existed
 * have no lines at all; the reader falls back to the whole-scene transcript.
 */
function mapLines(raw: unknown): StoryLine[] {
  if (!Array.isArray(raw)) return [];
  const entries: unknown[] = raw;

  return entries.flatMap((entry): StoryLine[] => {
    if (typeof entry !== 'object' || entry === null) return [];

    const text: unknown = Reflect.get(entry, 'text');
    if (typeof text !== 'string' || text.trim().length === 0) return [];

    const speaker: unknown = Reflect.get(entry, 'speaker');
    const name = typeof speaker === 'string' ? speaker.trim() : '';

    return [{ speaker: name.length > 0 ? name : null, text: text.trim() }];
  });
}

/**
 * Word timings as stored: one array per narrated clip, each word a compact
 * `{ s, e }` pair of seconds. A clip the voice provider gave no alignment for
 * comes back as null and the reader estimates its timings instead.
 */
function mapAudioMarks(raw: unknown): (WordMark[] | null)[] {
  if (!Array.isArray(raw)) return [];
  const clips: unknown[] = raw;

  return clips.map((clip): WordMark[] | null => {
    if (!Array.isArray(clip)) return null;
    const words: unknown[] = clip;

    const marks = words.flatMap((entry): WordMark[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const start: unknown = Reflect.get(entry, 's');
      const end: unknown = Reflect.get(entry, 'e');
      if (typeof start !== 'number' || typeof end !== 'number') return [];
      return [{ start, end: Math.max(end, start) }];
    });

    return marks.length > 0 ? marks : null;
  });
}

function mapNode(row: NodeRow): StoryNode {
  return {
    id: row.node_key,
    text: row.text,
    lines: mapLines(row.lines),
    imageUrl: row.image_url,
    audioUrls: row.audio_urls ?? [],
    audioMarks: mapAudioMarks(row.audio_marks),
    choices: mapChoices(row.choices),
    isEnding: row.is_ending,
    depth: row.depth,
  };
}

function mapStory(row: StoryRow, nodeRows: NodeRow[]): Story {
  const nodes = nodeRows.map(mapNode);
  if (nodes.length === 0) {
    throw new ApiError('This story has no scenes yet. Try creating it again.');
  }

  const startNodeId = nodes.some((node) => node.id === row.start_node_key)
    ? row.start_node_key
    : nodes[0].id;

  return {
    id: row.id,
    title: row.title,
    // Places are data now, so whatever the story was created with is kept as is.
    settingId: row.setting_id,
    styleId: toStyleId(row.style_id),
    ownerName: row.owner_name,
    backgroundImageUrl: row.background_image_url,
    backgroundAudioUrl: row.background_audio_url,
    startNodeId,
    nodes,
    shareCode: row.share_code,
    shareUrl: `${SHARE_LINK_PREFIX}${row.share_code}`,
  };
}

/* ------------------------------------------------------------------ */
/* Story data                                                        */
/* ------------------------------------------------------------------ */

/**
 * Generates a new story from the setting, idea and art style. The idea may be
 * empty, in which case the writer invents the premise. Only the opening scene
 * comes back — the branches after it are written by `expandBranch` as the reader
 * gets to them, which keeps every backend call comfortably short.
 */
export async function createStory(input: CreateStoryInput): Promise<Story> {
  const theme = themeById(input.themeId);
  const created = await invoke<{ id?: string }>('story-create', {
    settingId: input.settingId,
    settingLabel: input.settingLabel,
    styleId: input.styleId,
    // The full treatment, not just the name: it is what the images are drawn to.
    styleLabel: stylePrompt(input.styleId),
    prompt: input.prompt,
    themeId: theme?.id ?? '',
    themeLabel: theme?.label ?? '',
    // The tone brief every scene of this story is held to.
    themeDirection: theme?.direction ?? '',
    ownerName: input.ownerName ?? '',
    narratorVoiceId: input.narratorVoiceId ?? '',
    narratorLabel: input.narratorLabel ?? '',
  });

  if (!created.id) throw new ApiError(GENERIC_FAILURE);
  return getStory(created.id);
}

/**
 * A playable demo clip for each narrator offered on the setup screen, keyed by
 * voice id. A voice with no clip comes back as null, and a failed call as an
 * empty map — the picker then simply has nothing to play.
 */
export async function fetchNarratorPreviews(
  narrators: readonly NarratorOption[],
): Promise<Record<string, string>> {
  const result = await invoke<{ previews?: unknown }>('story-voices', {
    voiceIds: narrators.map((option) => option.id),
    demoText: NARRATOR_DEMO_LINE,
  });

  const previews = result.previews;
  if (typeof previews !== 'object' || previews === null) return {};

  const entries: [string, string][] = narrators.flatMap((option) => {
    const url: unknown = Reflect.get(previews, option.id);
    return typeof url === 'string' && url.length > 0 ? [[option.id, url]] : [];
  });

  return Object.fromEntries(entries);
}

/**
 * One story premise for the setup screen's spark button. `avoid` is whatever is
 * already in the field, so tapping again gives a different idea, and the theme is
 * the mood the premise has to fit.
 */
export async function generateIdea(request: {
  settingId: string | null;
  settingLabel: string;
  themeId?: ThemeId | null;
  avoid?: string;
}): Promise<string> {
  const theme = themeById(request.themeId);

  const result = await invoke<{ idea?: string }>('story-idea', {
    settingId: request.settingId ?? '',
    settingLabel: request.settingLabel,
    themeId: theme?.id ?? '',
    themeLabel: theme?.label ?? '',
    themeDirection: theme?.direction ?? '',
    avoid: request.avoid ?? '',
  });

  const idea = (result.idea ?? '').trim();
  if (idea.length === 0) {
    throw new ApiError('We could not think of an idea just now. Try again in a moment.');
  }
  return idea;
}

/** Loads a story by its id or by the share code a friend was given. */
export async function getStory(idOrCode: string): Promise<Story> {
  if (!isBackendConfigured) throw new ApiError(NOT_CONFIGURED);

  const value = idOrCode.trim();
  if (value.length === 0) throw new ApiError('We could not find that story.');

  // Reads go through the story_read database function: the app's public key has
  // no direct table access, so this one call returns the story and its scenes.
  const { data, error } = await bilt.rpc('story_read', { p_id_or_code: value });

  if (error) throw new ApiError('We could not load that story. Please try again.');

  const read = toStoryRead(data);
  if (!read.story) {
    throw new ApiError('We could not find a story with that code. Check it and try again.');
  }

  return mapStory(read.story, read.nodes ?? []);
}

/**
 * Writes the two scenes that follow `nodeKey`, or returns them if they were
 * written already. Safe to call repeatedly and from several devices: the backend
 * keeps the first version of every scene so a shared story never changes.
 */
export async function expandBranch(storyId: string, nodeKey: string): Promise<StoryNode[]> {
  const result = await invoke<{ nodes?: NodeRow[] }>('story-continue', { storyId, nodeKey });
  return (result.nodes ?? []).map(mapNode);
}

/**
 * Generates (or returns the already generated) art or audio for one part of a
 * story. Safe to call repeatedly — the backend caches every asset.
 */
export async function generateMedia(
  storyId: string,
  target: MediaTarget,
  nodeKey?: string,
): Promise<MediaResult> {
  const result = await invoke<{
    backgroundImageUrl?: string | null;
    backgroundAudioUrl?: string | null;
    imageUrl?: string | null;
    audioUrls?: unknown;
    audioMarks?: unknown;
  }>('story-media', { storyId, target, nodeKey: nodeKey ?? '' });

  const audioUrls = Array.isArray(result.audioUrls)
    ? result.audioUrls.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    backgroundImageUrl: result.backgroundImageUrl ?? null,
    backgroundAudioUrl: result.backgroundAudioUrl ?? null,
    imageUrl: result.imageUrl ?? null,
    audioUrls,
    audioMarks: mapAudioMarks(result.audioMarks),
  };
}

/** Records the player's path once they reach an ending. */
export async function finishStory(
  storyId: string,
  path: string[],
  decisions: Decision[],
  mode: PlayMode,
): Promise<void> {
  await invoke<{ ok?: boolean }>('story-finish', {
    storyId,
    path: path.join(','),
    choices: decisions.map((decision) => ({
      nodeId: decision.nodeId,
      letter: decision.choiceLetter,
      label: decision.choiceLabel,
    })),
    mode,
  });
}

/**
 * Match score against the story owner's own path, plus both paths for the
 * diagram. Scoring is prefix-based: in a binary tree, two readers only face the
 * same options while their earlier decisions were identical, so agreement stops
 * counting at the first fork. `divergedAt` is that decision, 1-based.
 */
export async function getMatch(storyId: string, path: string[]): Promise<MatchResult> {
  const result = await invoke<{
    score?: number;
    sharedCount?: number;
    totalCount?: number;
    divergedAt?: number | null;
    ownerName?: string | null;
    ownerPath?: string | null;
    yourPath?: string | null;
  }>('story-match', {
    storyId,
    path: path.join(','),
  });

  const totalCount = Math.max(1, Math.round(result.totalCount ?? path.length));
  const sharedCount = Math.max(0, Math.min(totalCount, Math.round(result.sharedCount ?? 0)));
  const diverged = result.divergedAt == null ? null : Math.round(result.divergedAt);

  return {
    score: Math.max(0, Math.min(100, Math.round(result.score ?? 0))),
    sharedCount,
    totalCount,
    divergedAt: diverged != null && diverged >= 1 ? diverged : null,
    ownerName: result.ownerName ?? null,
    ownerPath: splitLetters(result.ownerPath),
    yourPath: splitLetters(result.yourPath ?? path.join(',')),
  };
}
