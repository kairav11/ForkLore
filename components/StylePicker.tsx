import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { STYLES, type StyleOption } from '@/lib/settings';
import { palette } from '@/lib/theme';
import type { StyleId } from '@/lib/types';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Mono } from '@/components/ui/Text';

/** A real sample of each treatment, so the choice is made by eye. */
const STYLE_PREVIEWS: Record<StyleId, number> = {
  'flat-illustrated': require('@/assets/images/style-flat.png'),
  'comic-ink': require('@/assets/images/style-comic.png'),
  painterly: require('@/assets/images/style-painterly.png'),
  'anime-cel': require('@/assets/images/style-anime.png'),
  watercolour: require('@/assets/images/style-watercolour.png'),
  'noir-film': require('@/assets/images/style-noir.png'),
  'pixel-art': require('@/assets/images/style-pixel.png'),
  storybook: require('@/assets/images/style-storybook.png'),
  'retro-print': require('@/assets/images/style-retro-print.png'),
};

const COLUMNS = 3;
const SELECT_MS = 220;

/** Fixed rows of three, so every card is the same width whatever the count. */
function inRows(options: readonly StyleOption[]): StyleOption[][] {
  const rows: StyleOption[][] = [];
  for (let index = 0; index < options.length; index += COLUMNS) {
    rows.push(options.slice(index, index + COLUMNS));
  }
  return rows;
}

const ROWS = inRows(STYLES);

interface StyleCardProps {
  option: StyleOption;
  isSelected: boolean;
  onSelect: (id: StyleId) => void;
}

/**
 * One sample. Picking it lifts the thumbnail slightly and wraps it in a soft
 * amber ring, so the choice reads as a physical selection rather than a tick.
 */
function StyleCard({ option, isSelected, onSelect }: StyleCardProps) {
  const lift = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    lift.value = withTiming(isSelected ? 1 : 0, { duration: SELECT_MS });
  }, [isSelected, lift]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + lift.value * 0.05 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: lift.value }));

  return (
    <Pressable
      onPress={() => onSelect(option.id)}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ selected: isSelected }}
      className="flex-1"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View
        className="gap-2 rounded-2xl p-2.5"
        style={{
          backgroundColor: isSelected ? palette.accentSoft : palette.background,
          borderWidth: 1,
          borderColor: isSelected ? palette.pathAEdge : palette.border,
        }}
      >
        <View className="items-center justify-center">
          <AnimatedView
            pointerEvents="none"
            className="absolute rounded-[17px]"
            style={[
              {
                left: -9,
                right: -9,
                top: -9,
                bottom: -9,
                borderWidth: 5,
                borderColor: 'rgba(232, 163, 61, 0.12)',
              },
              glowStyle,
            ]}
          />
          <AnimatedView
            pointerEvents="none"
            className="absolute rounded-[14px]"
            style={[
              {
                left: -4,
                right: -4,
                top: -4,
                bottom: -4,
                borderWidth: 1.5,
                borderColor: palette.accent,
                ...Platform.select({
                  ios: {
                    shadowColor: palette.accent,
                    shadowOpacity: 0.45,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  },
                  web: {
                    shadowColor: palette.accent,
                    shadowOpacity: 0.45,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  },
                  default: {},
                }),
              },
              glowStyle,
            ]}
          />
          <AnimatedView className="w-full overflow-hidden rounded-xl" style={thumbStyle}>
            <Image
              source={STYLE_PREVIEWS[option.id]}
              style={{ width: '100%', height: 84 }}
              contentFit="cover"
              contentPosition="center"
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          </AnimatedView>
        </View>

        <Mono
          className="text-center text-[9px] leading-[12px] tracking-[1px] uppercase"
          color={isSelected ? palette.accent : palette.muted}
        >
          {option.label}
        </Mono>
      </View>
    </Pressable>
  );
}

interface StylePickerProps {
  value: StyleId;
  onSelect: (id: StyleId) => void;
}

/** The art style grid: one sample image per treatment, a glow ring when picked. */
export function StylePicker({ value, onSelect }: StylePickerProps) {
  return (
    <View className="gap-2.5">
      {ROWS.map((row) => (
        <View key={row[0].id} className="flex-row gap-2.5">
          {row.map((option) => (
            <StyleCard
              key={option.id}
              option={option}
              isSelected={option.id === value}
              onSelect={onSelect}
            />
          ))}
          {row.length < COLUMNS
            ? Array.from({ length: COLUMNS - row.length }, (_unused, index) => (
                <View key={`filler-${index}`} className="flex-1" />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}
