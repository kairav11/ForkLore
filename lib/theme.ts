/**
 * Native color constants.
 *
 * Colors used outside of `className` resolution (React Navigation options,
 * StatusBar, icon props, gradients) must be React Native-parseable, so they are
 * kept here as hex/rgba equivalents of the tokens defined in `global.css`.
 */
export const palette = {
  background: '#181310',
  surface: '#241E1A',
  surfaceSecondary: '#2C2521',
  foreground: '#F7F2EA',
  muted: '#A79C90',
  accent: '#F5A552',
  accentForeground: '#2A1C09',
  border: '#3A322C',
  scrim: 'rgba(16, 12, 10, 0.72)',
  scrimSoft: 'rgba(16, 12, 10, 0.35)',
  transparent: 'transparent',
} as const;
