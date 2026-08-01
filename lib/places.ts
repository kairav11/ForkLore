import { create } from 'zustand';

import { bilt, isBackendConfigured } from '@/lib/bilt';

/** One option in "Where it happens". */
export interface PlaceOption {
  id: string;
  label: string;
  hint: string;
  /** True for the five that ship with the app. */
  isBuiltin: boolean;
}

/**
 * Shown before the shared list has loaded, and kept as the list if it cannot be
 * reached. These same five rows are seeded in the `places` table.
 */
export const BUILTIN_PLACES: readonly PlaceOption[] = [
  { id: 'school', label: 'At School', hint: 'Hallways, lockers, late bells', isBuiltin: true },
  { id: 'club', label: 'At a Club', hint: 'Strobe lights and loud bass', isBuiltin: true },
  { id: 'bar', label: 'In a Bar', hint: 'Low light, long conversations', isBuiltin: true },
  {
    id: 'city-center',
    label: 'In the City Center',
    hint: 'Crowds, traffic, neon',
    isBuiltin: true,
  },
  {
    id: 'tv-tower',
    label: 'Near the Berlin TV Tower',
    hint: 'Alexanderplatz at dusk',
    isBuiltin: true,
  },
] as const;

export const MIN_PLACE_LABEL = 3;
export const MAX_PLACE_LABEL = 60;
export const MAX_PLACE_HINT = 80;

function toPlace(value: unknown): PlaceOption | null {
  if (typeof value !== 'object' || value === null) return null;

  const id: unknown = Reflect.get(value, 'id');
  const label: unknown = Reflect.get(value, 'label');
  if (typeof id !== 'string' || typeof label !== 'string') return null;
  if (id.trim().length === 0 || label.trim().length === 0) return null;

  const hint: unknown = Reflect.get(value, 'hint');
  const isBuiltin: unknown = Reflect.get(value, 'isBuiltin');

  return {
    id,
    label,
    hint: typeof hint === 'string' ? hint : '',
    isBuiltin: isBuiltin === true,
  };
}

function toPlaces(value: unknown): PlaceOption[] {
  if (!Array.isArray(value)) return [];
  const entries: unknown[] = value;
  return entries.flatMap((entry) => {
    const place = toPlace(entry);
    return place ? [place] : [];
  });
}

interface PlacesState {
  places: PlaceOption[];
  isLoading: boolean;
  /** Set when the shared list could not be read; the builtins are still usable. */
  loadError: string | null;
  load: () => Promise<void>;
  /** Saves a place for everyone and returns it, selected-ready. */
  add: (label: string, hint: string) => Promise<PlaceOption>;
}

/**
 * The shared list of places. Adding one writes it to the project database through
 * the `place_add` function, so every reader of the app sees it from then on —
 * that is the point of the feature, not a per-device list.
 */
export const usePlacesStore = create<PlacesState>()((set, get) => ({
  places: [...BUILTIN_PLACES],
  isLoading: false,
  loadError: null,

  load: async () => {
    if (!isBackendConfigured || get().isLoading) return;

    set({ isLoading: true, loadError: null });
    const { data, error } = await bilt.rpc('places_list');

    if (error) {
      set({ isLoading: false, loadError: 'We could not load the shared places just now.' });
      return;
    }

    const places = toPlaces(data);
    set({
      isLoading: false,
      loadError: null,
      places: places.length > 0 ? places : [...BUILTIN_PLACES],
    });
  },

  add: async (label, hint) => {
    const cleanLabel = label.trim().replace(/\s+/g, ' ').slice(0, MAX_PLACE_LABEL);
    const cleanHint = hint.trim().replace(/\s+/g, ' ').slice(0, MAX_PLACE_HINT);

    if (cleanLabel.length < MIN_PLACE_LABEL) {
      throw new Error(`Give the place a name of at least ${MIN_PLACE_LABEL} letters.`);
    }
    if (!isBackendConfigured) {
      throw new Error('Places are saved online, and the app is not connected right now.');
    }

    const { data, error } = await bilt.rpc('place_add', {
      p_label: cleanLabel,
      p_hint: cleanHint,
    });

    const place = error ? null : toPlace(data);
    if (!place) throw new Error('We could not save that place. Please try again.');

    // An identical label comes back as the place that already exists, so this
    // both adds and de-duplicates.
    const { places } = get();
    const index = places.findIndex((entry) => entry.id === place.id);
    set({
      places:
        index === -1
          ? [...places, place]
          : places.map((entry) => (entry.id === place.id ? place : entry)),
    });

    return place;
  },
}));

export function placeLabel(id: string | null | undefined, places: readonly PlaceOption[]): string {
  return places.find((place) => place.id === id)?.label ?? 'Your story';
}
