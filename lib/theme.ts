/**
 * Native color and font constants.
 *
 * Values used outside of `className` resolution (React Navigation options,
 * StatusBar, icon props, gradients, SVG paint) must be React Native-parseable,
 * so they are kept here as hex / rgba equivalents of the tokens in `global.css`.
 */
export const palette = {
  background: '#161109',
  backgroundDeep: '#0D0A06',
  surface: '#241D16',
  surfaceSecondary: '#2E251D',
  foreground: '#F8F3EA',
  muted: '#ABA093',
  accent: '#FBAB55',
  accentForeground: '#2C1D0A',
  accentSoft: 'rgba(251, 171, 85, 0.14)',
  ember: '#D2603F',
  emberSoft: 'rgba(210, 96, 63, 0.12)',
  border: '#3B3128',
  scrim: 'rgba(13, 10, 6, 0.55)',
  scrimSoft: 'rgba(13, 10, 6, 0.2)',
  scrimStrong: 'rgba(13, 10, 6, 0.95)',
  transparent: 'transparent',
} as const;

/** Playfair Display carries the story voice; Inter handles UI and body copy. */
export const fonts = {
  display: 'PlayfairDisplay_700Bold',
  displayMedium: 'PlayfairDisplay_600SemiBold',
} as const;
