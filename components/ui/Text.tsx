import { Text as RNText, type TextProps } from 'react-native';

import { fonts } from '@/lib/theme';
import { cn } from '@/lib/utils';

type BodyWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const BODY_FONTS: Record<BodyWeight, string> = {
  regular: fonts.body,
  medium: fonts.bodyMedium,
  semibold: fonts.bodySemibold,
  bold: fonts.bodyBold,
};

interface BodyProps extends TextProps {
  className?: string;
  weight?: BodyWeight;
  /**
   * Explicit colour for the cases a theme class cannot express — a path tone, or
   * text sitting on a filled amber / violet shape. Passing it replaces the
   * default colour class so class and style never fight over the same property.
   */
  color?: string;
}

/**
 * Inter for every line of story text, description and UI label. The family is
 * set explicitly per weight so Android never falls back to Roboto.
 */
export function Body({ className, style, weight = 'regular', color, ...rest }: BodyProps) {
  return (
    <RNText
      {...rest}
      className={color ? className : cn('text-foreground', className)}
      style={[{ fontFamily: BODY_FONTS[weight] }, color ? { color } : null, style]}
    />
  );
}

interface MonoProps extends TextProps {
  className?: string;
  weight?: 'medium' | 'bold';
  /** See `Body.color`. */
  color?: string;
}

/**
 * IBM Plex Mono, small utility labels only: "Decision 1 of 3", share codes,
 * the match percentage, timestamps.
 */
export function Mono({ className, style, weight = 'medium', color, ...rest }: MonoProps) {
  return (
    <RNText
      {...rest}
      className={color ? className : cn('text-muted', className)}
      style={[
        { fontFamily: weight === 'bold' ? fonts.monoBold : fonts.mono },
        color ? { color } : null,
        style,
      ]}
    />
  );
}
