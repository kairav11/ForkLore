import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Library } from 'lucide-react-native';

import { entryRouteParams, useLibraryStore } from '@/lib/library';
import { palette } from '@/lib/theme';
import { LibraryRow } from '@/components/LibraryRow';
import { Body, Mono } from '@/components/ui/Text';

/** How many stories the home panel shows before it defers to the full list. */
const PREVIEW_COUNT = 3;

/**
 * The reader's own stories, on the home screen above the setup fields. Nothing is
 * rendered until at least one story exists, so a first run stays a clean canvas.
 */
export function StoryLibrary() {
  const router = useRouter();
  const entries = useLibraryStore((state) => state.entries);
  const load = useLibraryStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  if (entries.length === 0) return null;

  const preview = entries.slice(0, PREVIEW_COUNT);
  const hidden = entries.length - preview.length;

  return (
    <View
      className="gap-3 rounded-3xl p-4"
      style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border }}
    >
      <View className="flex-row items-center gap-2">
        <Library size={13} color={palette.accent} />
        <Mono className="flex-1 text-[11px] tracking-[2px] uppercase">Your stories</Mono>
        <Mono className="text-[10px] tracking-[2px] uppercase">{entries.length}</Mono>
      </View>

      <View className="gap-1.5">
        {preview.map((entry) => (
          <LibraryRow
            key={entry.id}
            entry={entry}
            onPress={() =>
              router.push({ pathname: '/reader/[id]', params: entryRouteParams(entry) })
            }
          />
        ))}
      </View>

      {hidden > 0 ? (
        <Pressable
          onPress={() => router.push('/library')}
          accessibilityRole="button"
          accessibilityLabel="See all your stories"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: 'flex-start' })}
        >
          <View className="flex-row items-center gap-1.5">
            <Mono className="text-[9px] tracking-[2px] uppercase" color={palette.accent}>
              {`All ${entries.length} stories`}
            </Mono>
            <ChevronRight size={12} color={palette.accent} />
          </View>
        </Pressable>
      ) : null}

      <Body className="text-muted text-[13px] leading-5">
        Kept on this device. Tap one to carry on from the scene you left it at.
      </Body>
    </View>
  );
}
