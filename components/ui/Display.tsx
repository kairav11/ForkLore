import { Text as RNText, type TextProps } from 'react-native';

import { fonts } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface DisplayProps extends TextProps {
  className?: string;
  /** `medium` for smaller labels, `bold` for headlines. */
  weight?: 'medium' | 'bold';
}

/** Serif display type — used for titles and story headlines. */
export function Display({ className, style, weight = 'bold', ...rest }: DisplayProps) {
  return (
    <RNText
      {...rest}
      className={cn('text-foreground', className)}
      style={[{ fontFamily: weight === 'bold' ? fonts.display : fonts.displayMedium }, style]}
    />
  );
}
