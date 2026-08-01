import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Separator, Text } from 'heroui-native';
import { ChevronLeft, CornerDownRight, RotateCcw } from 'lucide-react-native';

import { useCurrentNode, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';

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
    return <LoadingState title="Loading your replay..." />;
  }

  const hasReplay = decisions.length > 0;

  return (
    <StoryBackdrop imageUrl={story.backgroundImageUrl}>
      <View className="pt-safe-offset-3 flex-1">
        <View className="flex-row items-center gap-2 px-4 pb-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-11 w-11 px-0"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <ChevronLeft size={22} color={palette.foreground} />
          </Button>
          <Text className="text-foreground text-lg font-semibold">Your story, start to finish</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-safe-offset-6 gap-4"
          showsVerticalScrollIndicator={false}
        >
          {decisions.map((decision, index) => (
            <View
              key={`${decision.nodeId}-${decision.choiceLetter}`}
              className="bg-background/85 border-border/60 gap-3 rounded-3xl border p-5"
            >
              <Text className="text-accent text-sm font-semibold tracking-widest uppercase">
                Scene {index + 1}
              </Text>
              {decision.nodeImageUrl ? (
                <Image
                  source={{ uri: decision.nodeImageUrl }}
                  style={{ width: '100%', height: 180, borderRadius: 20 }}
                  contentFit="cover"
                  contentPosition="top"
                  transition={300}
                  cachePolicy="memory-disk"
                  accessibilityIgnoresInvertColors
                />
              ) : null}
              <Text className="text-foreground text-lg leading-7">{decision.nodeText}</Text>
              <Separator />
              <View className="flex-row items-start gap-2">
                <CornerDownRight size={18} color={palette.accent} />
                <Text className="text-accent flex-1 text-base leading-6 font-semibold">
                  You chose: {decision.choiceLabel}
                </Text>
              </View>
            </View>
          ))}

          {hasReplay ? null : (
            <View className="bg-background/85 border-border/60 gap-2 rounded-3xl border p-5">
              <Text className="text-foreground text-lg leading-7">
                There is no finished playthrough on this device yet.
              </Text>
              <Text className="text-muted text-base leading-6">
                Read the story to the end and your decisions will show up here.
              </Text>
            </View>
          )}

          {endingNode && endingNode.isEnding ? (
            <View className="bg-background/85 border-border/60 gap-3 rounded-3xl border p-5">
              <Text className="text-accent text-sm font-semibold tracking-widest uppercase">
                The End
              </Text>
              {endingNode.imageUrl ? (
                <Image
                  source={{ uri: endingNode.imageUrl }}
                  style={{ width: '100%', height: 180, borderRadius: 20 }}
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
            onPress={() => {
              restart();
              router.replace({ pathname: '/reader/[id]', params: { id } });
            }}
          >
            <RotateCcw size={18} color={palette.accentForeground} />
            <Button.Label className="text-lg">Read It Again From The Start</Button.Label>
          </Button>
        </ScrollView>
      </View>
    </StoryBackdrop>
  );
}
