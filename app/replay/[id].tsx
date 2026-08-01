import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { CornerDownRight, RotateCcw } from 'lucide-react-native';

import { findNode, useCurrentNode, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { Display } from '@/components/ui/Display';

export default function ReplayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { story, error } = useEnsureStory(id);
  const decisions = useStoryStore((state) => state.decisions);
  const restart = useStoryStore((state) => state.restart);
  const endingNode = useCurrentNode();

  if (error) {
    return (
      <ErrorState
        title="We could not load the replay"
        message={error}
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }

  if (!story) {
    return <LoadingState title="Loading your replay…" />;
  }

  const hasReplay = decisions.length > 0;

  return (
    <StoryBackdrop imageUrl={story.backgroundImageUrl} overlay="strong">
      <View className="pt-safe-offset-2 flex-1">
        <View className="px-5">
          <ScreenHeader title="Your path" onBack={() => router.back()} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-safe-offset-6 gap-4 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2 pb-2">
            <Display className="text-3xl leading-10">
              {story.title ?? 'Your story, start to finish'}
            </Display>
            <Text className="text-muted text-base leading-6">
              Every scene you read and every decision you made, in order.
            </Text>
          </View>

          {decisions.map((decision, index) => {
            const node = findNode(story, decision.nodeId);
            const imageUrl = node?.imageUrl ?? null;

            return (
              <View
                key={`${decision.nodeId}-${decision.choiceLetter}`}
                className="border-border/60 gap-3 rounded-3xl border p-5"
                style={{ backgroundColor: 'rgba(22, 17, 9, 0.86)' }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="border-accent/40 h-7 w-7 items-center justify-center rounded-full border"
                    style={{ backgroundColor: palette.accentSoft }}
                  >
                    <Text className="text-accent text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-muted text-[11px] font-bold tracking-[3px] uppercase">
                    Scene {index + 1}
                  </Text>
                </View>

                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: '100%', height: 190, borderRadius: 18 }}
                    contentFit="cover"
                    contentPosition="top"
                    transition={300}
                    cachePolicy="memory-disk"
                    accessibilityIgnoresInvertColors
                  />
                ) : null}

                <Text className="text-foreground text-lg leading-7">
                  {node?.text ?? decision.nodeText}
                </Text>

                <View className="border-border/60 flex-row items-start gap-2 border-t pt-3">
                  <CornerDownRight size={16} color={palette.accent} />
                  <Text className="text-accent flex-1 text-base leading-6 font-semibold">
                    {decision.choiceLabel}
                  </Text>
                </View>
              </View>
            );
          })}

          {hasReplay ? null : (
            <View
              className="border-border/60 gap-2 rounded-3xl border p-5"
              style={{ backgroundColor: 'rgba(22, 17, 9, 0.86)' }}
            >
              <Text className="text-foreground text-lg leading-7">
                There is no finished playthrough on this device yet.
              </Text>
              <Text className="text-muted text-base leading-6">
                Read the story to the end and your decisions show up here.
              </Text>
            </View>
          )}

          {endingNode?.isEnding ? (
            <View
              className="border-accent/30 gap-3 rounded-3xl border p-5"
              style={{ backgroundColor: 'rgba(22, 17, 9, 0.9)' }}
            >
              <Display className="text-accent text-lg tracking-wide">The End</Display>
              {endingNode.imageUrl ? (
                <Image
                  source={{ uri: endingNode.imageUrl }}
                  style={{ width: '100%', height: 190, borderRadius: 18 }}
                  contentFit="cover"
                  contentPosition="top"
                  transition={300}
                  cachePolicy="memory-disk"
                  accessibilityIgnoresInvertColors
                />
              ) : null}
              <Text className="text-foreground text-lg leading-7">{endingNode.text}</Text>
            </View>
          ) : null}

          <Button
            size="lg"
            className="mt-2 h-14 rounded-2xl"
            onPress={() => {
              restart();
              router.replace({ pathname: '/reader/[id]', params: { id } });
            }}
          >
            <RotateCcw size={18} color={palette.accentForeground} />
            <Button.Label className="text-lg font-semibold">
              Read It Again From The Start
            </Button.Label>
          </Button>
        </ScrollView>
      </View>
    </StoryBackdrop>
  );
}
