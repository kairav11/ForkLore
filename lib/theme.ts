/**
 * Native colour and font constants.
 *
 * Values used outside of `className` resolution (React Navigation options,
 * StatusBar, icon props, gradients, SVG paint) must be React Native-parseable,
 * so they are kept here as hex / rgba equivalents of the tokens in `global.css`.
 */
export const palette = {
  /** Near-black charcoal, never pure black. */
  background: '#14151A',
  backgroundDeep: '#0E0F13',
  /** Cards, panels, inputs. */
  surface: '#1F2128',
  surfaceRaised: '#262932',
  /** Story text panel over artwork: surface at 85%. */
  panel: 'rgba(31, 33, 40, 0.85)',
  panelSoft: 'rgba(31, 33, 40, 0.7)',
  foreground: '#F2EFE9',
  muted: '#9B9CA6',
  placeholder: '#6F7180',

  /** First option of every binary choice. */
  pathA: '#E8A33D',
  pathASoft: 'rgba(232, 163, 61, 0.14)',
  pathAEdge: 'rgba(232, 163, 61, 0.45)',
  /** Second option of every binary choice. */
  pathB: '#7C8CFF',
  pathBSoft: 'rgba(124, 140, 255, 0.14)',
  pathBEdge: 'rgba(124, 140, 255, 0.45)',

  /** Alias: the amber path colour doubles as the single UI accent. */
  accent: '#E8A33D',
  accentForeground: '#14151A',
  accentSoft: 'rgba(232, 163, 61, 0.14)',

  border: '#2C2F38',
  borderStrong: '#3A3E49',
  inactive: 'rgba(242, 239, 233, 0.18)',

  scrimSoft: 'rgba(20, 21, 26, 0.3)',
  scrim: 'rgba(20, 21, 26, 0.62)',
  scrimStrong: 'rgba(20, 21, 26, 0.95)',
  transparent: 'transparent',
} as const;

/** The two branch tones, indexed by choice position. */
export const PATH_TONES = [
  {
    color: palette.pathA,
    soft: palette.pathASoft,
    edge: palette.pathAEdge,
  },
  {
    color: palette.pathB,
    soft: palette.pathBSoft,
    edge: palette.pathBEdge,
  },
] as const;

export type PathTone = (typeof PATH_TONES)[number];

/** Amber for the first option, violet-blue for the second. */
export function pathTone(index: number): PathTone {
  return PATH_TONES[index === 0 ? 0 : 1];
}

/**
 * Fraunces carries the story voice, Inter every line of body copy and UI label,
 * IBM Plex Mono the small utility labels (step counters, codes, the score).
 */
export const fonts = {
  display: 'Fraunces_700Bold',
  displayMedium: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_600SemiBold',
} as const;
