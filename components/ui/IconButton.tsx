import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { palette } from '@/lib/theme';

interface IconButtonProps {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  /** `floating` sits over artwork and gets its own dark disc. */
  tone?: 'floating' | 'surface';
}

/** Round 40pt control used for the reader's mute / leave actions and back arrows. */
export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  tone = 'floating',
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: tone === 'floating' ? palette.panel : palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}
