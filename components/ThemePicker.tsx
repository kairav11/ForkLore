import { Pressable, View } from 'react-native';

import { palette } from '@/lib/theme';
import { THEMES, type ThemeOption } from '@/lib/themes';
import type { ThemeId } from '@/lib/types';
import { Mono } from '@/components/ui/Text';

interface ThemePickerProps {
  value: ThemeId | null;
  /** null when the reader taps the picked chip again, clearing the mood. */
  onSelect: (theme: ThemeOption | null) => void;
}

/**
 * The story's mood, as a wrapped row of chips. One at a time, and tapping the
 * picked chip again clears it — with no mood, the writer chooses its own register.
 */
export function ThemePicker({ value, onSelect }: ThemePickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {THEMES.map((theme) => {
        const isSelected = theme.id === value;
        const Icon = theme.icon;
        const tint = isSelected ? palette.accent : palette.muted;

        return (
          <Pressable
            key={theme.id}
            onPress={() => onSelect(isSelected ? null : theme)}
            accessibilityRole="button"
            accessibilityLabel={theme.label}
            accessibilityHint={theme.hint}
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View
              className="h-9 flex-row items-center gap-2 rounded-full px-3.5"
              style={{
                backgroundColor: isSelected ? palette.accentSoft : palette.background,
                borderWidth: 1,
                borderColor: isSelected ? palette.pathAEdge : palette.border,
              }}
            >
              <Icon size={14} color={tint} />
              <Mono className="text-[10px] tracking-[2px] uppercase" color={tint}>
                {theme.label}
              </Mono>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
