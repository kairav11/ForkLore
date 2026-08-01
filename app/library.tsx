import { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { entryRouteParams, type LibraryEntry, useLibraryStore } from '@/lib/library';
import { palette } from '@/lib/theme';
import { LibraryRow } from '@/components/LibraryRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { Body, Mono } from '@/components/ui/Text';

/** Every story generated on this device, newest first, with the option to forget one. */
export default function LibraryScreen() {
  const router = useRouter();
  const entries = useLibraryStore((state) => state.entries);
  const load = useLibraryStore((state) => state.load);
  const remove = useLibraryStore((state) => state.remove);

  useEffect(() => {
    void load();
  }, [load]);

  const renderItem = ({ item }: { item: LibraryEntry }) => (
    <LibraryRow
      entry={item}
      showCode
      onPress={() => router.push({ pathname: '/reader/[id]', params: entryRouteParams(item) })}
      onRemove={() => remove(item.id)}
    />
  );

  return (
    <View className="bg-background flex-1">
      <View className="pt-safe-offset-2 px-4">
        <ScreenHeader title="Your stories" onBack={() => router.back()} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-safe-offset-6 gap-1.5 pt-2"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          entries.length > 0 ? (
            <View className="gap-1 pb-2">
              <Mono className="text-[9px] tracking-[2px] uppercase">
                {`${entries.length} stor${entries.length === 1 ? 'y' : 'ies'} on this device`}
              </Mono>
              <Body className="text-muted text-[13px] leading-5">
                Tap a story to carry on reading. Share sends its link and code, so a friend reads
                the same story and makes their own choices.
              </Body>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View
            className="gap-3 rounded-3xl p-5"
            style={{
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Body weight="medium" className="text-[16px] leading-6">
              No stories here yet.
            </Body>
            <Body className="text-muted text-[15px] leading-6">
              Every story you generate is listed here so you can pick it back up, share it, or read
              it again.
            </Body>
            <ActionButton
              label="Start my first story"
              icon={Sparkles}
              onPress={() => router.replace('/')}
            />
          </View>
        }
      />
    </View>
  );
}
