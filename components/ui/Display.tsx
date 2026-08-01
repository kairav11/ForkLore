import { Text as RNText, type TextProps } from 'react-native';

import { fonts } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface DisplayProps extends TextProps {
  className?: string;
  /** `medium` for smaller labels, `bold` for headlines. */
  weight?: 'medium' | 'bold';
}

/** Fraunces — the app title, setting names, story and ending titles. */
export function Display({ className, style, weight = 'bold', ...rest }: DisplayProps) {
  return (
    <RNText
      {...rest}
      className={cn('text-foreground', className)}
      style={[{ fontFamily: weight === 'bold' ? fonts.display : fonts.displayMedium }, style]}
    />
  );
}
