import { TextInput, type TextInputProps } from 'react-native';

import { fonts, palette } from '@/lib/theme';

interface FieldInputProps extends Omit<TextInputProps, 'style'> {
  /** `code` is the mono share-code field; everything else is body text. */
  variant?: 'body' | 'code';
  /** Minimum tappable height. Multiline fields get a taller default. */
  minHeight?: number;
}

/**
 * The one text field in the app, always inside a `FieldCard`.
 *
 * Heights are minimums, never fixed: a fixed height clipped the type on Android
 * (a 30pt box around 17pt Inter, a 34pt box around 22pt mono) which is why text
 * sometimes disappeared while typing. Padding is zeroed so the card controls the
 * spacing, and the caret / selection use the amber accent instead of the
 * platform default.
 */
export function FieldInput({
  variant = 'body',
  minHeight,
  multiline = false,
  ...rest
}: FieldInputProps) {
  const isCode = variant === 'code';

  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={palette.placeholder}
      selectionColor={palette.accent}
      underlineColorAndroid={palette.transparent}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={{
        width: '100%',
        minHeight: minHeight ?? (multiline ? 100 : 44),
        paddingVertical: 0,
        paddingHorizontal: 0,
        margin: 0,
        fontFamily: isCode ? fonts.monoBold : fonts.body,
        fontSize: isCode ? 20 : 17,
        // A line height only helps wrapped text; on a single Android line it
        // crops ascenders, so it is left to the platform there.
        lineHeight: multiline ? 26 : undefined,
        letterSpacing: isCode ? 3 : 0,
        color: palette.foreground,
      }}
    />
  );
}
