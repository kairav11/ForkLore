import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { DECISIONS_PER_STORY, STYLES } from '@/lib/settings';
import { THEMES, themeById } from '@/lib/themes';
import type { Story, StyleId, ThemeId } from '@/lib/types';

const STORAGE_KEY = 'forklore:library:v1';
/** Older entries fall off the end rather than growing the list for ever. */
const MAX_ENTRIES = 40;

/**
 * One story this device made, as the home panel needs it. Only metadata is kept
 * locally — the scenes, art and narration live in the project database and are
 * fetched by id when the story is opened again.
 */
export interface LibraryEntry {
  id: string;
  title: string | null;
  shareCode: string | null;
  settingId: string | null;
  /** The place's name as it was chosen; places are shared data, not app constants. */
  settingLabel: string | null;
  styleId: StyleId | null;
  themeId: ThemeId | null;
  /** The story's fixed backdrop, used as the thumbnail. */
  coverUrl: string | null;
  /** Decision letters taken so far, in order — what a resume replays. */
  path: string[];
  isFinished: boolean;
  createdAt: number;
  updatedAt: number;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const entries: unknown[] = value;
  return entries.filter((entry): entry is string => typeof entry === 'string');
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function isStyleId(value: string): value is StyleId {
  return STYLES.some((style) => style.id === value);
}

function toStyleId(value: unknown): StyleId | null {
  return typeof value === 'string' && isStyleId(value) ? value : null;
}

function isThemeId(value: string): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

function toThemeId(value: unknown): ThemeId | null {
  return typeof value === 'string' && isThemeId(value) ? value : null;
}

function toEntry(value: unknown): LibraryEntry | null {
  if (typeof value !== 'object' || value === null) return null;

  const id = Reflect.get(value, 'id');
  if (typeof id !== 'string' || id.length === 0) return null;

  const createdAt = Reflect.get(value, 'createdAt');
  const updatedAt = Reflect.get(value, 'updatedAt');
  const created = typeof createdAt === 'number' ? createdAt : 0;

  return {
    id,
    title: toText(Reflect.get(value, 'title')),
    shareCode: toText(Reflect.get(value, 'shareCode')),
    settingId: toText(Reflect.get(value, 'settingId')),
    settingLabel: toText(Reflect.get(value, 'settingLabel')),
    styleId: toStyleId(Reflect.get(value, 'styleId')),
    themeId: toThemeId(Reflect.get(value, 'themeId')),
    coverUrl: toText(Reflect.get(value, 'coverUrl')),
    path: toStringArray(Reflect.get(value, 'path')),
    isFinished: Reflect.get(value, 'isFinished') === true,
    createdAt: created,
    updatedAt: typeof updatedAt === 'number' ? updatedAt : created,
  };
}

/** Newest activity first, capped. */
function order(entries: LibraryEntry[]): LibraryEntry[] {
  return [...entries].sort((left, right) => right.updatedAt - left.updatedAt).slice(0, MAX_ENTRIES);
}

function persist(entries: LibraryEntry[]): void {
  // A list that fails to save is not worth interrupting the reader for.
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => undefined);
}

function samePath(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((letter, index) => letter === right[index]);
}

/** True when nothing the panel shows has changed, so no write is needed. */
function sameMetadata(current: LibraryEntry, next: LibraryEntry): boolean {
  return (
    current.title === next.title &&
    current.shareCode === next.shareCode &&
    current.settingId === next.settingId &&
    current.settingLabel === next.settingLabel &&
    current.styleId === next.styleId &&
    current.themeId === next.themeId &&
    current.coverUrl === next.coverUrl
  );
}

async function read(): Promise<LibraryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed: unknown = raw === null ? [] : JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  const values: unknown[] = parsed;
  return values.flatMap((value) => {
    const entry = toEntry(value);
    return entry ? [entry] : [];
  });
}

interface LibraryState {
  entries: LibraryEntry[];
  isLoaded: boolean;
  /** Reads the saved list once, on first use. */
  load: () => Promise<void>;
  /** Adds or refreshes a story's metadata. Progress is left untouched. */
  record: (story: Story, meta?: { settingLabel?: string; themeId?: ThemeId | null }) => void;
  /** Stores how far the reader got. `isFinished` only ever turns on. */
  setProgress: (id: string, path: string[], isFinished: boolean) => void;
  remove: (id: string) => void;
}

/** The read in flight, so two callers never read and write over each other. */
let loading: Promise<void> | null = null;

/**
 * The stories this device generated, kept on the device. There is no sign-in in
 * ForkLore, so the list is local; every entry is just a pointer to a story that
 * lives in the project database, which is why a story still opens on any other
 * device through its share code.
 *
 * Every change waits for the saved list to have been read first: a write against
 * an empty list would replace the stories already on the device with just one.
 */
export const useLibraryStore = create<LibraryState>()((set, get) => {
  const afterLoad = (apply: () => void): void => {
    if (get().isLoaded) {
      apply();
      return;
    }
    void get()
      .load()
      .then(apply)
      .catch(() => undefined);
  };

  return {
    entries: [],
    isLoaded: false,

    load: () => {
      if (get().isLoaded) return Promise.resolve();

      loading ??= read()
        .then((stored) => {
          // Anything recorded while the read was in flight is kept.
          const memory = get().entries;
          const merged = [
            ...memory,
            ...stored.filter((entry) => !memory.some((held) => held.id === entry.id)),
          ];
          set({ entries: order(merged), isLoaded: true });
        })
        .catch(() => {
          set({ isLoaded: true });
        })
        .finally(() => {
          loading = null;
        });

      return loading;
    },

    record: (story, meta) =>
      afterLoad(() => {
        const { entries } = get();
        const index = entries.findIndex((entry) => entry.id === story.id);
        const current = index === -1 ? null : entries[index];
        const now = Date.now();

        const label = meta?.settingLabel?.trim();

        const next: LibraryEntry = {
          id: story.id,
          title: story.title ?? current?.title ?? null,
          shareCode: story.shareCode ?? current?.shareCode ?? null,
          settingId: story.settingId ?? current?.settingId ?? null,
          settingLabel: label && label.length > 0 ? label : (current?.settingLabel ?? null),
          styleId: story.styleId ?? current?.styleId ?? null,
          themeId: meta?.themeId ?? current?.themeId ?? null,
          coverUrl: story.backgroundImageUrl ?? current?.coverUrl ?? null,
          path: current?.path ?? [],
          isFinished: current?.isFinished ?? false,
          createdAt: current?.createdAt ?? now,
          updatedAt: now,
        };

        if (current && sameMetadata(current, next)) return;

        const merged =
          index === -1
            ? [next, ...entries]
            : entries.map((entry, at) => (at === index ? next : entry));
        const ordered = order(merged);
        set({ entries: ordered });
        persist(ordered);
      }),

    setProgress: (id, path, isFinished) =>
      afterLoad(() => {
        const { entries } = get();
        const index = entries.findIndex((entry) => entry.id === id);
        if (index === -1) return;

        const current = entries[index];
        const finished = current.isFinished || isFinished;
        if (samePath(current.path, path) && finished === current.isFinished) return;

        const next: LibraryEntry = {
          ...current,
          path: [...path],
          isFinished: finished,
          updatedAt: Date.now(),
        };
        const ordered = order(entries.map((entry, at) => (at === index ? next : entry)));
        set({ entries: ordered });
        persist(ordered);
      }),

    remove: (id) =>
      afterLoad(() => {
        const entries = get().entries.filter((entry) => entry.id !== id);
        set({ entries });
        persist(entries);
      }),
  };
});

/** The place the story happens in, falling back to a readable form of its id. */
export function entryPlaceLabel(entry: LibraryEntry): string {
  if (entry.settingLabel) return entry.settingLabel;
  if (!entry.settingId) return 'Your story';

  return entry.settingId
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Mood if the story has one, otherwise its art style. */
export function entryToneLabel(entry: LibraryEntry): string | null {
  const theme = themeById(entry.themeId);
  if (theme) return theme.label;
  return STYLES.find((style) => style.id === entry.styleId)?.label ?? null;
}

/** How far the reader got, in the same words the reader itself uses. */
export function entryStatusLabel(entry: LibraryEntry): string {
  if (entry.isFinished) return 'Finished';
  if (entry.path.length === 0) return 'Not started';
  return `Decision ${Math.min(entry.path.length + 1, DECISIONS_PER_STORY)} of ${DECISIONS_PER_STORY}`;
}

/** The code a friend types to read this story; the id still resolves if it is missing. */
export function entryShareCode(entry: LibraryEntry): string {
  return entry.shareCode ?? entry.id;
}

/**
 * Route params that reopen a story where it was left. The reader replays the
 * stored letters and, for a finished story, lands on its ending.
 */
export function entryRouteParams(entry: LibraryEntry): { id: string; resume: string } {
  return { id: entry.id, resume: entry.path.join(',') };
}
