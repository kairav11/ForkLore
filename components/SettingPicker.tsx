import { Pressable, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

import { SETTINGS } from '@/lib/settings';
import { palette } from '@/lib/theme';
import type { SettingId } from '@/lib/types';
import { Display } from '@/components/ui/Display';
import { Body, Mono } from '@/components/ui/Text';

interface SettingPickerProps {
  value: SettingId | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: SettingId) => void;
}

/**
 * Custom dropdown for the story's location: a charcoal row that expands into the
 * five settings in place. Setting names are set in the serif display face.
 */
export function SettingPicker({ value, isOpen, onToggle, onSelect }: SettingPickerProps) {
  const selected = SETTINGS.find((option) => option.id === value) ?? null;

  return (
    <View className="gap-2">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="Choose a setting"
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View className="flex-row items-center justify-between gap-3">
          {selected ? (
            <Display className="flex-1 text-[22px] leading-7">{selected.label}</Display>
          ) : (
            <Body className="text-muted flex-1 text-[17px]">Choose a setting</Body>
          )}
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.surfaceRaised }}
          >
            <ChevronDown
              size={16}
              color={palette.foreground}
              style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
            />
          </View>
        </View>
      </Pressable>

      {isOpen ? (
        <View
          className="gap-1 rounded-2xl p-1"
          style={{
            backgroundColor: palette.background,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          {SETTINGS.map((option) => {
            const isSelected = option.id === value;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelect(option.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <View
                  className="flex-row items-center gap-3 rounded-xl px-3 py-3"
                  style={{
                    backgroundColor: isSelected ? palette.accentSoft : palette.transparent,
                  }}
                >
                  <View
                    className="w-[3px] self-stretch rounded-full"
                    style={{
                      backgroundColor: isSelected ? palette.accent : palette.transparent,
                    }}
                  />
                  <View className="flex-1 gap-0.5">
                    <Body
                      weight="medium"
                      className="text-[16px]"
                      color={isSelected ? palette.accent : palette.foreground}
                    >
                      {option.label}
                    </Body>
                    <Mono className="text-[10px] tracking-[1px] uppercase">{option.hint}</Mono>
                  </View>
                  {isSelected ? <Check size={16} color={palette.accent} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
