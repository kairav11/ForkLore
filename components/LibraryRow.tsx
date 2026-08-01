import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { BookOpen, ChevronRight, Trash2 } from 'lucide-react-native';

import {
  entryPlaceLabel,
  entryStatusLabel,
  entryToneLabel,
  type LibraryEntry,
} from '@/lib/library';
import { palette } from '@/lib/theme';
import { Body, Mono } from '@/components/ui/Text';

interface LibraryRowProps {
  entry: LibraryEntry;
  onPress: () => void;
  /** Shown as a small bin on the full list, left out of the home panel. */
  onRemove?: () => void;
}

const COVER_WIDTH = 46;
const COVER_HEIGHT = 60;

/**
 * One story in the reader's own list: its backdrop as a thumbnail, the title,
 * where it happens, and how far they got. Tapping it reopens the story at the
 * scene it was left on.
 */
export function LibraryRow({ entry, onPress, onRemove }: LibraryRowProps) {
  const tone = entryToneLabel(entry);
  const meta = [entryPlaceLabel(entry), tone].filter((part): part is string => Boolean(part));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${entry.title ?? 'your untitled story'}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
    >
      <View
        className="flex-row items-center gap-3 rounded-2xl p-2"
        style={{ backgroundColor: palette.background }}
      >
        {entry.coverUrl ? (
          <Image
            source={{ uri: entry.coverUrl }}
            style={{ width: COVER_WIDTH, height: COVER_HEIGHT, borderRadius: 12 }}
            contentFit="cover"
            contentPosition="center"
            transition={200}
            cachePolicy="memory-disk"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View
            className="items-center justify-center rounded-xl"
            style={{
              width: COVER_WIDTH,
              height: COVER_HEIGHT,
              backgroundColor: palette.surfaceRaised,
            }}
          >
            <BookOpen size={16} color={palette.muted} />
          </View>
        )}

        <View className="flex-1 gap-1">
          <Body weight="medium" numberOfLines={1} className="text-[15px]">
            {entry.title ?? 'Untitled story'}
          </Body>
          <Mono numberOfLines={1} className="text-[9px] tracking-[1px] uppercase">
            {meta.join(' · ')}
          </Mono>
          <Mono
            className="text-[9px] tracking-[2px] uppercase"
            color={entry.isFinished ? palette.accent : undefined}
          >
            {entryStatusLabel(entry)}
          </Mono>
        </View>

        {onRemove ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${entry.title ?? 'this story'} from your list`}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}
          >
            <Trash2 size={16} color={palette.muted} />
          </Pressable>
        ) : (
          <ChevronRight size={16} color={palette.muted} />
        )}
      </View>
    </Pressable>
  );
}
