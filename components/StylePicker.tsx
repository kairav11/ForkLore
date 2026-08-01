import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Check } from 'lucide-react-native';

import { STYLES, type StyleOption } from '@/lib/settings';
import { palette } from '@/lib/theme';
import type { StyleId } from '@/lib/types';
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

/** Fixed rows of three, so every card is the same width whatever the count. */
function inRows(options: readonly StyleOption[]): StyleOption[][] {
  const rows: StyleOption[][] = [];
  for (let index = 0; index < options.length; index += COLUMNS) {
    rows.push(options.slice(index, index + COLUMNS));
  }
  return rows;
}

const ROWS = inRows(STYLES);

interface StylePickerProps {
  value: StyleId;
  onSelect: (id: StyleId) => void;
}

/** The art style grid: one sample image per treatment, amber border when picked. */
export function StylePicker({ value, onSelect }: StylePickerProps) {
  return (
    <View className="gap-2.5">
      {ROWS.map((row) => (
        <View key={row[0].id} className="flex-row gap-2.5">
          {row.map((option) => {
            const isSelected = option.id === value;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelect(option.id)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isSelected }}
                className="flex-1"
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <View
                  className="gap-2 rounded-2xl p-2"
                  style={{
                    backgroundColor: palette.background,
                    borderWidth: 1,
                    borderColor: isSelected ? palette.accent : palette.border,
                  }}
                >
                  <View className="w-full overflow-hidden rounded-xl">
                    <Image
                      source={STYLE_PREVIEWS[option.id]}
                      style={{ width: '100%', height: 84 }}
                      contentFit="cover"
                      contentPosition="center"
                      cachePolicy="memory-disk"
                      accessibilityIgnoresInvertColors
                    />
                    {isSelected ? (
                      <View className="absolute inset-0 items-center justify-center">
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: 'rgba(20, 21, 26, 0.75)' }}
                        >
                          <Check size={15} color={palette.accent} />
                        </View>
                      </View>
                    ) : null}
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
          })}
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
