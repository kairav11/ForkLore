import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { entryRouteParams, useLibraryStore } from '@/lib/library';
import { palette } from '@/lib/theme';
import { LibraryRow } from '@/components/LibraryRow';
import { TicketCard } from '@/components/TicketCard';
import { Mono } from '@/components/ui/Text';

/** How many stories the home panel shows before it defers to the full list. */
const PREVIEW_COUNT = 3;

/**
 * The reader's own stories, on the home screen above the setup fields, as one
 * more ticket stub. Nothing is rendered until at least one story exists, so a
 * first run stays a clean canvas.
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
    <TicketCard
      label="Your stories"
      code={`${entries.length} saved`}
      hint="Tap one to carry on from the scene you left it at, or share it so a friend reads the same story."
    >
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

      <Pressable
        onPress={() => router.push('/library')}
        accessibilityRole="button"
        accessibilityLabel="Open all your stories"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: 'flex-start' })}
      >
        <View className="flex-row items-center gap-1.5">
          <Mono className="text-[9px] tracking-[2px] uppercase" color={palette.accent}>
            {hidden > 0 ? `All ${entries.length} stories` : 'Open your library'}
          </Mono>
          <ChevronRight size={12} color={palette.accent} />
        </View>
      </Pressable>
    </TicketCard>
  );
}
