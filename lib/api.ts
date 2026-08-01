import { SETTINGS, STYLES, settingLabel, styleLabel } from '@/lib/settings';
import type {
  CreateStoryInput,
  MatchResult,
  SettingId,
  Story,
  StoryChoice,
  StoryNode,
  StyleId,
} from '@/lib/types';

/**
 * Base URL of the StoryBranch backend. Set EXPO_PUBLIC_STORY_API_URL in .env
 * (for example: https://api.example.com) — this is the only place it is read.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_STORY_API_URL ?? '').replace(/\/+$/, '');

export const isApiConfigured = API_BASE_URL.length > 0;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const CHOICE_LETTERS = 'abcdefgh';

const NOT_CONFIGURED_MESSAGE =
  'The story service is not connected yet. Add your backend URL as EXPO_PUBLIC_STORY_API_URL and reload the app.';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError(NOT_CONFIGURED_MESSAGE);
  }

  let response: Response;
  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (init?.body) headers.set('Content-Type', 'application/json');
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(
      'We could not reach the story service. Check your connection and try again.',
    );
  }

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message = str(pick(asRecord(parsed) ?? {}, ['message', 'error', 'detail']));
    if (response.status === 404) {
      throw new ApiError(message ?? 'We could not find that story.', 404);
    }
    throw new ApiError(
      message ?? 'The story service had a problem. Please try again.',
      response.status,
    );
  }

  return parsed as T;
}

/** Turns any thrown value into a message that is safe to show in the UI. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong while talking to the story service. Please try again.';
}

/* ------------------------------------------------------------------ */
/* Response normalization                                             */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Json)
    : null;
}

function pick(source: Json, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function str(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace('%', ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function bool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

const SETTING_IDS: readonly string[] = SETTINGS.map((option) => option.id);
const STYLE_IDS: readonly string[] = STYLES.map((option) => option.id);

function isSettingId(value: string): value is SettingId {
  return SETTING_IDS.includes(value);
}

function isStyleId(value: string): value is StyleId {
  return STYLE_IDS.includes(value);
}

function toSettingId(value: string | null): SettingId | null {
  return value !== null && isSettingId(value) ? value : null;
}

function toStyleId(value: string | null): StyleId | null {
  return value !== null && isStyleId(value) ? value : null;
}

/** Backends may nest the payload under `story`, `data`, or `result`. */
function unwrap(payload: unknown): Json {
  const record = asRecord(payload);
  if (!record) return {};
  for (const key of ['story', 'data', 'result']) {
    const nested = asRecord(record[key]);
    if (nested) return nested;
  }
  return record;
}

function toUrl(value: unknown): string | null {
  const direct = str(value);
  if (direct) return direct;
  const record = asRecord(value);
  if (record) return str(pick(record, ['url', 'uri', 'audioUrl', 'audio_url', 'src', 'href']));
  return null;
}

function toUrlList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(toUrl).filter((item): item is string => item !== null);
  }
  const single = toUrl(value);
  return single ? [single] : [];
}

function normalizeChoices(value: unknown): StoryChoice[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw, index): StoryChoice | null => {
      const record = asRecord(raw);
      if (!record) {
        const label = str(raw);
        return label
          ? { letter: CHOICE_LETTERS[index] ?? String(index), label, nextNodeId: null }
          : null;
      }
      const label = str(pick(record, ['label', 'text', 'title', 'choice', 'option']));
      if (!label) return null;
      return {
        letter:
          str(pick(record, ['letter', 'key', 'id'])) ?? CHOICE_LETTERS[index] ?? String(index),
        label,
        nextNodeId: str(
          pick(record, [
            'nextNodeId',
            'next_node_id',
            'nextId',
            'next_id',
            'next',
            'target',
            'nodeId',
          ]),
        ),
      };
    })
    .filter((choice): choice is StoryChoice => choice !== null);
}

function normalizeNode(raw: unknown, fallbackId: string): StoryNode | null {
  const record = asRecord(raw);
  if (!record) return null;

  const id = str(pick(record, ['id', 'nodeId', 'node_id', 'key'])) ?? fallbackId;
  const text = str(pick(record, ['text', 'story', 'body', 'content', 'paragraph'])) ?? '';
  const choices = normalizeChoices(pick(record, ['choices', 'options', 'decisions', 'branches']));
  const explicitEnding = bool(
    pick(record, ['isEnding', 'is_ending', 'ending', 'isFinal', 'final']),
  );

  return {
    id,
    text,
    imageUrl: toUrl(
      pick(record, [
        'imageUrl',
        'image_url',
        'image',
        'characterImageUrl',
        'character_image_url',
        'foregroundImageUrl',
        'foreground_image_url',
      ]),
    ),
    audioUrls: toUrlList(
      pick(record, [
        'audioUrls',
        'audio_urls',
        'audioLines',
        'audio_lines',
        'narrationUrls',
        'narration',
        'lines',
        'audioUrl',
        'audio_url',
        'audio',
      ]),
    ),
    choices,
    isEnding: explicitEnding ?? choices.length === 0,
  };
}

function normalizeNodes(value: unknown): StoryNode[] {
  if (Array.isArray(value)) {
    return value
      .map((raw, index) => normalizeNode(raw, `node-${index}`))
      .filter((node): node is StoryNode => node !== null);
  }
  const record = asRecord(value);
  if (!record) return [];
  return Object.entries(record)
    .map(([key, raw]) => {
      const node = normalizeNode(raw, key);
      return node ? { ...node, id: node.id === key ? node.id : (str(key) ?? node.id) } : null;
    })
    .filter((node): node is StoryNode => node !== null);
}

export function normalizeStory(payload: unknown): Story {
  const record = unwrap(payload);
  const nodes = normalizeNodes(pick(record, ['nodes', 'storyNodes', 'story_nodes', 'scenes']));

  if (nodes.length === 0) {
    throw new ApiError('The story came back empty. Please try generating it again.');
  }

  const id = str(pick(record, ['id', 'storyId', 'story_id', '_id', 'uuid']));
  if (!id) {
    throw new ApiError('The story service did not return a story id.');
  }

  const startNodeId =
    str(
      pick(record, [
        'startNodeId',
        'start_node_id',
        'startId',
        'start_id',
        'rootNodeId',
        'root_node_id',
        'start',
        'firstNodeId',
      ]),
    ) ?? nodes[0].id;

  const settingRaw = str(pick(record, ['setting', 'settingId', 'setting_id']));
  const styleRaw = str(pick(record, ['style', 'styleId', 'style_id']));

  return {
    id,
    title: str(pick(record, ['title', 'name', 'headline'])),
    settingId: toSettingId(settingRaw),
    styleId: toStyleId(styleRaw),
    ownerName: str(pick(record, ['ownerName', 'owner_name', 'owner', 'author', 'createdBy'])),
    backgroundImageUrl: toUrl(
      pick(record, [
        'backgroundImageUrl',
        'background_image_url',
        'backgroundImage',
        'background_image',
        'backgroundUrl',
        'background',
      ]),
    ),
    backgroundAudioUrl: toUrl(
      pick(record, [
        'backgroundAudioUrl',
        'background_audio_url',
        'backgroundAudio',
        'background_audio',
        'ambientAudioUrl',
        'ambient_audio_url',
        'ambientAudio',
      ]),
    ),
    startNodeId: nodes.some((node) => node.id === startNodeId) ? startNodeId : nodes[0].id,
    nodes,
    shareCode: str(pick(record, ['shareCode', 'share_code', 'code'])),
    shareUrl: str(pick(record, ['shareUrl', 'share_url', 'link', 'url'])),
  };
}

export function normalizeMatch(payload: unknown, fallbackTotal: number): MatchResult {
  const record = unwrap(payload);

  const rawScore = num(
    pick(record, ['score', 'matchScore', 'match_score', 'match', 'percentage', 'percent']),
  );
  const agreed = num(
    pick(record, ['agreed', 'agreedCount', 'agreed_count', 'matches', 'matched', 'sameCount']),
  );
  const total = num(
    pick(record, ['total', 'totalCount', 'total_count', 'totalDecisions', 'decisions', 'count']),
  );

  const totalCount = total !== null && total > 0 ? Math.round(total) : fallbackTotal;
  const agreedCount = agreed !== null ? Math.round(agreed) : 0;

  let score: number;
  if (rawScore !== null) {
    score = rawScore <= 1 && rawScore > 0 ? rawScore * 100 : rawScore;
  } else if (totalCount > 0) {
    score = (agreedCount / totalCount) * 100;
  } else {
    score = 0;
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    agreedCount: agreed !== null ? agreedCount : Math.round((score / 100) * totalCount),
    totalCount,
    ownerName: str(pick(record, ['ownerName', 'owner_name', 'owner', 'author', 'createdBy'])),
  };
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                          */
/* ------------------------------------------------------------------ */

/** POST /story — generate a new story from setting, prompt and style. */
export async function createStory(input: CreateStoryInput): Promise<Story> {
  const payload = await request<unknown>('/story', {
    method: 'POST',
    body: JSON.stringify({
      setting: input.settingId,
      settingLabel: settingLabel(input.settingId),
      prompt: input.prompt,
      style: input.styleId,
      styleLabel: styleLabel(input.styleId),
    }),
  });

  const record = unwrap(payload);
  const hasNodes =
    normalizeNodes(pick(record, ['nodes', 'storyNodes', 'story_nodes', 'scenes'])).length > 0;
  if (!hasNodes) {
    // Some backends return only the new id from POST /story.
    const id = str(pick(record, ['id', 'storyId', 'story_id', '_id', 'uuid']));
    if (!id) {
      throw new ApiError('The story service did not return a story id.');
    }
    return getStory(id);
  }

  return normalizeStory(payload);
}

/** GET /story/:id — fetch full story data. */
export async function getStory(id: string): Promise<Story> {
  const payload = await request<unknown>(`/story/${encodeURIComponent(id)}`);
  return normalizeStory(payload);
}

/** POST /story/:id/finish — record the player's path once they reach an ending. */
export async function finishStory(id: string, path: string[]): Promise<void> {
  await request<unknown>(`/story/${encodeURIComponent(id)}/finish`, {
    method: 'POST',
    body: JSON.stringify({ path: path.join(','), choices: path }),
  });
}

/** GET /story/:id/match?path=a,b,a — match score against the story owner's path. */
export async function getMatch(id: string, path: string[]): Promise<MatchResult> {
  const payload = await request<unknown>(
    `/story/${encodeURIComponent(id)}/match?path=${encodeURIComponent(path.join(','))}`,
  );
  return normalizeMatch(payload, path.length);
}
